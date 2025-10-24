import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { orders, payments } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import stripeService from '../services/stripe.js';

const router = express.Router();

/**
 * POST /api/payments/stripe/checkout
 * Créer un PaymentIntent Stripe pour une commande
 */
router.post('/stripe/checkout', authMiddleware, async (req, res) => {
    try {
        const { order_id } = req.body;
        const user_id = req.user.id;

        if (!order_id) {
            return res.status(400).json({
                success: false,
                message: "order_id est requis"
            });
        }

        // Vérifier que la commande existe et appartient au brand
        const [order] = await db.select()
            .from(orders)
            .where(and(
                eq(orders.id, order_id),
                eq(orders.brand_id, user_id),
                eq(orders.status, 'PENDING_PAYMENT')
            ));

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Commande non trouvée ou déjà payée"
            });
        }

        // Créer le PaymentIntent
        const result = await stripeService.createPaymentIntent({
            order_id: order.id,
            amount_mad: parseFloat(order.amount_mad),
            currency: order.currency,
            metadata: {
                brand_id: order.brand_id,
                creator_id: order.creator_id,
                campaign_id: order.campaign_id
            }
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        res.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('❌ Erreur checkout Stripe:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * POST /api/payments/stripe/webhook
 * Webhook Stripe pour traiter les événements
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        
        if (!signature) {
            return res.status(400).json({
                success: false,
                message: "Signature Stripe manquante"
            });
        }

        // Vérifier la signature
        const verifyResult = await stripeService.verifyWebhookSignature(req.body, signature);
        
        if (!verifyResult.success) {
            console.error('❌ Signature webhook invalide:', verifyResult.error);
            return res.status(400).json({
                success: false,
                message: "Signature invalide"
            });
        }

        // Traiter l'événement
        const processResult = await stripeService.processWebhookEvent(verifyResult.event);
        
        if (!processResult.success) {
            console.error('❌ Erreur traitement webhook:', processResult.error);
            return res.status(500).json({
                success: false,
                message: "Erreur traitement événement"
            });
        }

        res.json({ success: true });

    } catch (error) {
        console.error('❌ Erreur webhook Stripe:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * GET /api/payments/status/:payment_intent_id
 * Vérifier le statut d'un paiement
 */
router.get('/status/:payment_intent_id', authMiddleware, async (req, res) => {
    try {
        const { payment_intent_id } = req.params;
        const user_id = req.user.id;

        // Récupérer le paiement depuis la base
        const [payment] = await db.select({
            id: payments.id,
            order_id: payments.order_id,
            status: payments.status,
            amount_mad: payments.amount_mad,
            currency: payments.currency,
            created_at: payments.created_at,
            updated_at: payments.updated_at,
            // Informations de la commande
            brand_id: orders.brand_id,
            creator_id: orders.creator_id
        })
        .from(payments)
        .leftJoin(orders, eq(payments.order_id, orders.id))
        .where(and(
            eq(payments.payment_intent_id, payment_intent_id),
            sql`(${orders.brand_id} = ${user_id} OR ${orders.creator_id} = ${user_id})`
        ));

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Paiement non trouvé"
            });
        }

        // Récupérer le statut depuis Stripe
        const stripeResult = await stripeService.getPaymentIntent(payment_intent_id);
        
        res.json({
            success: true,
            data: {
                payment_id: payment.id,
                order_id: payment.order_id,
                status: payment.status,
                stripe_status: stripeResult.success ? stripeResult.data.status : 'unknown',
                amount_mad: payment.amount_mad,
                currency: payment.currency,
                created_at: payment.created_at,
                updated_at: payment.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Erreur statut paiement:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * POST /api/payments/refund
 * Rembourser un paiement (admin uniquement)
 */
router.post('/refund', authMiddleware, async (req, res) => {
    try {
        const { payment_intent_id, amount } = req.body;
        const user_id = req.user.id;

        // Vérifier que l'utilisateur est admin
        const [user] = await db.select()
            .from(profiles)
            .where(and(
                eq(profiles.id, user_id),
                eq(profiles.role, 'admin')
            ));

        if (!user) {
            return res.status(403).json({
                success: false,
                message: "Accès refusé - Admin requis"
            });
        }

        if (!payment_intent_id) {
            return res.status(400).json({
                success: false,
                message: "payment_intent_id est requis"
            });
        }

        // Effectuer le remboursement
        const result = await stripeService.refundPayment(payment_intent_id, amount);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        res.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('❌ Erreur remboursement:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

export default router;


