import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { orders, campaignAgreements, profiles, campaigns } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = express.Router();

/**
 * POST /api/orders/create
 * Créer une nouvelle commande après négociation
 */
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { agreement_id, amount_mad, description, metadata = {} } = req.body;
        const brand_id = req.user.id;

        // Validation des données
        if (!agreement_id || !amount_mad) {
            return res.status(400).json({
                success: false,
                message: "agreement_id et amount_mad sont requis"
            });
        }

        // Vérifier que l'agreement existe et appartient au brand
        const [agreement] = await db.select()
            .from(campaignAgreements)
            .where(and(
                eq(campaignAgreements.id, agreement_id),
                eq(campaignAgreements.brand_id, brand_id),
                eq(campaignAgreements.status, 'accepted')
            ));

        if (!agreement) {
            return res.status(404).json({
                success: false,
                message: "Accord non trouvé ou non accepté"
            });
        }

        // Vérifier qu'il n'y a pas déjà une commande pour cet agreement
        const [existingOrder] = await db.select()
            .from(orders)
            .where(eq(orders.agreement_id, agreement_id));

        if (existingOrder) {
            return res.status(409).json({
                success: false,
                message: "Une commande existe déjà pour cet accord"
            });
        }

        // Calculer les frais Stripe (5%)
        const stripeFee = Math.round(amount_mad * 0.05 * 100) / 100;
        const totalPaid = amount_mad + stripeFee;

        // Créer la commande
        const [order] = await db.insert(orders).values({
            brand_id,
            creator_id: agreement.creator_id,
            campaign_id: agreement.campaign_id,
            agreement_id,
            amount_mad: parseFloat(amount_mad),
            stripe_fee_mad: stripeFee,
            total_paid_mad: totalPaid,
            currency: 'MAD',
            status: 'PENDING_PAYMENT',
            description: description || `Commande pour accord ${agreement_id}`,
            metadata: JSON.stringify(metadata)
        }).returning();

        // Mettre à jour l'agreement avec l'order_id
        await db.update(campaignAgreements)
            .set({ 
                order_id: order.id,
                updated_at: new Date()
            })
            .where(eq(campaignAgreements.id, agreement_id));

        console.log(`✅ Commande créée: ${order.id} pour l'accord ${agreement_id}`);

        res.json({
            success: true,
            data: {
                order_id: order.id,
                amount_creator: order.amount_mad,
                stripe_fee: order.stripe_fee_mad,
                total_paid: order.total_paid_mad,
                status: order.status
            }
        });

    } catch (error) {
        console.error('❌ Erreur création commande:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * GET /api/orders
 * Récupérer les commandes de l'utilisateur
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { status, limit = 20, offset = 0 } = req.query;

        // Construire la requête
        let query = db.select({
            id: orders.id,
            brand_id: orders.brand_id,
            creator_id: orders.creator_id,
            campaign_id: orders.campaign_id,
            agreement_id: orders.agreement_id,
            amount_mad: orders.amount_mad,
            stripe_fee_mad: orders.stripe_fee_mad,
            total_paid_mad: orders.total_paid_mad,
            currency: orders.currency,
            status: orders.status,
            description: orders.description,
            created_at: orders.created_at,
            updated_at: orders.updated_at,
            // Informations supplémentaires
            brand_name: profiles.full_name,
            creator_name: sql`creator_profile.full_name`,
            campaign_title: campaigns.title
        })
        .from(orders)
        .leftJoin(profiles, eq(orders.brand_id, profiles.id))
        .leftJoin(sql`profiles as creator_profile`, eq(orders.creator_id, sql`creator_profile.id`))
        .leftJoin(campaigns, eq(orders.campaign_id, campaigns.id))
        .where(
            sql`(${orders.brand_id} = ${user_id} OR ${orders.creator_id} = ${user_id})`
        )
        .orderBy(desc(orders.created_at))
        .limit(parseInt(limit))
        .offset(parseInt(offset));

        // Ajouter filtre par statut si spécifié
        if (status) {
            query = query.where(and(
                sql`(${orders.brand_id} = ${user_id} OR ${orders.creator_id} = ${user_id})`,
                eq(orders.status, status)
            ));
        }

        const ordersList = await query;

        res.json({
            success: true,
            data: ordersList
        });

    } catch (error) {
        console.error('❌ Erreur récupération commandes:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * GET /api/orders/:id
 * Récupérer une commande spécifique
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const order_id = parseInt(req.params.id);
        const user_id = req.user.id;

        const [order] = await db.select({
            id: orders.id,
            brand_id: orders.brand_id,
            creator_id: orders.creator_id,
            campaign_id: orders.campaign_id,
            agreement_id: orders.agreement_id,
            amount_mad: orders.amount_mad,
            stripe_fee_mad: orders.stripe_fee_mad,
            total_paid_mad: orders.total_paid_mad,
            currency: orders.currency,
            status: orders.status,
            description: orders.description,
            metadata: orders.metadata,
            created_at: orders.created_at,
            updated_at: orders.updated_at,
            // Informations supplémentaires
            brand_name: profiles.full_name,
            creator_name: sql`creator_profile.full_name`,
            campaign_title: campaigns.title
        })
        .from(orders)
        .leftJoin(profiles, eq(orders.brand_id, profiles.id))
        .leftJoin(sql`profiles as creator_profile`, eq(orders.creator_id, sql`creator_profile.id`))
        .leftJoin(campaigns, eq(orders.campaign_id, campaigns.id))
        .where(and(
            eq(orders.id, order_id),
            sql`(${orders.brand_id} = ${user_id} OR ${orders.creator_id} = ${user_id})`
        ));

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Commande non trouvée"
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('❌ Erreur récupération commande:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * PATCH /api/orders/:id/cancel
 * Annuler une commande (uniquement si PENDING_PAYMENT)
 */
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const order_id = parseInt(req.params.id);
        const user_id = req.user.id;

        // Vérifier que la commande existe et appartient à l'utilisateur
        const [order] = await db.select()
            .from(orders)
            .where(and(
                eq(orders.id, order_id),
                eq(orders.brand_id, user_id)
            ));

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Commande non trouvée"
            });
        }

        if (order.status !== 'PENDING_PAYMENT') {
            return res.status(400).json({
                success: false,
                message: "Seules les commandes en attente de paiement peuvent être annulées"
            });
        }

        // Annuler la commande
        await db.update(orders)
            .set({ 
                status: 'CANCELLED',
                updated_at: new Date()
            })
            .where(eq(orders.id, order_id));

        console.log(`🚫 Commande annulée: ${order_id}`);

        res.json({
            success: true,
            message: "Commande annulée avec succès"
        });

    } catch (error) {
        console.error('❌ Erreur annulation commande:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

export default router;


