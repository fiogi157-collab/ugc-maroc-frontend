import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/client.js';
import { payoutRequests, creatorBalances, profiles } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = express.Router();

/**
 * POST /api/withdrawal/request
 * Demander un retrait (créateur)
 */
router.post('/request', authMiddleware, async (req, res) => {
    try {
        const { requested_amount, bank_details } = req.body;
        const creator_id = req.user.id;

        // Validation des données
        if (!requested_amount || !bank_details) {
            return res.status(400).json({
                success: false,
                message: "requested_amount et bank_details sont requis"
            });
        }

        const amount = parseFloat(requested_amount);
        const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '200');
        const bankFee = parseFloat(process.env.BANK_WITHDRAWAL_FEE || '17');

        // Vérifier le montant minimum
        if (amount < minWithdrawal) {
            return res.status(400).json({
                success: false,
                message: `Montant minimum: ${minWithdrawal} MAD`
            });
        }

        // Vérifier le solde disponible
        const [balance] = await db.select()
            .from(creatorBalances)
            .where(eq(creatorBalances.creator_id, creator_id));

        if (!balance || parseFloat(balance.available_balance) < amount) {
            return res.status(400).json({
                success: false,
                message: "Solde insuffisant"
            });
        }

        // Vérifier qu'il n'y a pas déjà une demande en attente
        const [pendingRequest] = await db.select()
            .from(payoutRequests)
            .where(and(
                eq(payoutRequests.creator_id, creator_id),
                sql`${payoutRequests.status} IN ('PENDING', 'APPROVED', 'PROCESSING')`
            ));

        if (pendingRequest) {
            return res.status(409).json({
                success: false,
                message: "Une demande de retrait est déjà en cours"
            });
        }

        // Calculer le montant net
        const netAmount = amount - bankFee;

        // Créer la demande de retrait
        const [payoutRequest] = await db.insert(payoutRequests).values({
            creator_id,
            requested_amount: amount,
            bank_fee: bankFee,
            net_amount: netAmount,
            bank_details: JSON.stringify(bank_details),
            status: 'PENDING'
        }).returning();

        // Mettre à jour le solde (réserver le montant)
        await db.update(creatorBalances)
            .set({
                available_balance: sql`${creatorBalances.available_balance} - ${amount}`,
                pending_withdrawal: sql`${creatorBalances.pending_withdrawal} + ${amount}`,
                updated_at: new Date()
            })
            .where(eq(creatorBalances.creator_id, creator_id));

        console.log(`✅ Demande de retrait créée: ${payoutRequest.id} pour ${amount} MAD`);

        res.json({
            success: true,
            data: {
                payout_id: payoutRequest.id,
                requested_amount: amount,
                bank_fee: bankFee,
                net_amount: netAmount,
                status: payoutRequest.status
            }
        });

    } catch (error) {
        console.error('❌ Erreur demande retrait:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * GET /api/withdrawal/requests
 * Récupérer les demandes de retrait (admin)
 */
router.get('/requests', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { status, limit = 20, offset = 0 } = req.query;

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

        // Construire la requête
        let query = db.select({
            id: payoutRequests.id,
            creator_id: payoutRequests.creator_id,
            requested_amount: payoutRequests.requested_amount,
            bank_fee: payoutRequests.bank_fee,
            net_amount: payoutRequests.net_amount,
            bank_details: payoutRequests.bank_details,
            status: payoutRequests.status,
            processed_by: payoutRequests.processed_by,
            processed_at: payoutRequests.processed_at,
            notes: payoutRequests.notes,
            rejection_reason: payoutRequests.rejection_reason,
            created_at: payoutRequests.created_at,
            updated_at: payoutRequests.updated_at,
            // Informations du créateur
            creator_name: profiles.full_name,
            creator_email: profiles.email
        })
        .from(payoutRequests)
        .leftJoin(profiles, eq(payoutRequests.creator_id, profiles.id))
        .orderBy(desc(payoutRequests.created_at))
        .limit(parseInt(limit))
        .offset(parseInt(offset));

        // Ajouter filtre par statut si spécifié
        if (status) {
            query = query.where(eq(payoutRequests.status, status));
        }

        const requests = await query;

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('❌ Erreur récupération demandes retrait:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * GET /api/withdrawal/my-requests
 * Récupérer mes demandes de retrait (créateur)
 */
router.get('/my-requests', authMiddleware, async (req, res) => {
    try {
        const creator_id = req.user.id;
        const { limit = 20, offset = 0 } = req.query;

        const requests = await db.select()
            .from(payoutRequests)
            .where(eq(payoutRequests.creator_id, creator_id))
            .orderBy(desc(payoutRequests.created_at))
            .limit(parseInt(limit))
            .offset(parseInt(offset));

        res.json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('❌ Erreur récupération mes demandes:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * PATCH /api/withdrawal/:id/approve
 * Approuver une demande de retrait (admin)
 */
router.patch('/:id/approve', authMiddleware, async (req, res) => {
    try {
        const payout_id = parseInt(req.params.id);
        const user_id = req.user.id;
        const { notes } = req.body;

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

        // Vérifier que la demande existe
        const [request] = await db.select()
            .from(payoutRequests)
            .where(and(
                eq(payoutRequests.id, payout_id),
                eq(payoutRequests.status, 'PENDING')
            ));

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Demande non trouvée ou déjà traitée"
            });
        }

        // Approuver la demande
        await db.update(payoutRequests)
            .set({
                status: 'APPROVED',
                processed_by: user_id,
                processed_at: new Date(),
                notes: notes || 'Approuvé par admin'
            })
            .where(eq(payoutRequests.id, payout_id));

        console.log(`✅ Demande de retrait approuvée: ${payout_id}`);

        res.json({
            success: true,
            message: "Demande approuvée avec succès"
        });

    } catch (error) {
        console.error('❌ Erreur approbation retrait:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * PATCH /api/withdrawal/:id/reject
 * Rejeter une demande de retrait (admin)
 */
router.patch('/:id/reject', authMiddleware, async (req, res) => {
    try {
        const payout_id = parseInt(req.params.id);
        const user_id = req.user.id;
        const { rejection_reason } = req.body;

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

        if (!rejection_reason) {
            return res.status(400).json({
                success: false,
                message: "rejection_reason est requis"
            });
        }

        // Vérifier que la demande existe
        const [request] = await db.select()
            .from(payoutRequests)
            .where(and(
                eq(payoutRequests.id, payout_id),
                eq(payoutRequests.status, 'PENDING')
            ));

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Demande non trouvée ou déjà traitée"
            });
        }

        // Rejeter la demande
        await db.update(payoutRequests)
            .set({
                status: 'REJECTED',
                processed_by: user_id,
                processed_at: new Date(),
                rejection_reason
            })
            .where(eq(payoutRequests.id, payout_id));

        // Restaurer le solde
        await db.update(creatorBalances)
            .set({
                available_balance: sql`${creatorBalances.available_balance} + ${request.requested_amount}`,
                pending_withdrawal: sql`${creatorBalances.pending_withdrawal} - ${request.requested_amount}`,
                updated_at: new Date()
            })
            .where(eq(creatorBalances.creator_id, request.creator_id));

        console.log(`❌ Demande de retrait rejetée: ${payout_id}`);

        res.json({
            success: true,
            message: "Demande rejetée avec succès"
        });

    } catch (error) {
        console.error('❌ Erreur rejet retrait:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * PATCH /api/withdrawal/:id/complete
 * Marquer un retrait comme terminé (admin)
 */
router.patch('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const payout_id = parseInt(req.params.id);
        const user_id = req.user.id;
        const { receipt_url, notes } = req.body;

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

        // Vérifier que la demande existe et est approuvée
        const [request] = await db.select()
            .from(payoutRequests)
            .where(and(
                eq(payoutRequests.id, payout_id),
                eq(payoutRequests.status, 'APPROVED')
            ));

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Demande non trouvée ou non approuvée"
            });
        }

        // Marquer comme terminé
        await db.update(payoutRequests)
            .set({
                status: 'COMPLETED',
                processed_by: user_id,
                processed_at: new Date(),
                receipt_url,
                notes: notes || 'Retrait effectué'
            })
            .where(eq(payoutRequests.id, payout_id));

        // Mettre à jour le solde
        await db.update(creatorBalances)
            .set({
                pending_withdrawal: sql`${creatorBalances.pending_withdrawal} - ${request.requested_amount}`,
                total_withdrawn: sql`${creatorBalances.total_withdrawn} + ${request.requested_amount}`,
                updated_at: new Date()
            })
            .where(eq(creatorBalances.creator_id, request.creator_id));

        console.log(`✅ Retrait terminé: ${payout_id}`);

        res.json({
            success: true,
            message: "Retrait marqué comme terminé"
        });

    } catch (error) {
        console.error('❌ Erreur completion retrait:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

/**
 * GET /api/withdrawal/balance
 * Récupérer le solde du créateur
 */
router.get('/balance', authMiddleware, async (req, res) => {
    try {
        const creator_id = req.user.id;

        const [balance] = await db.select()
            .from(creatorBalances)
            .where(eq(creatorBalances.creator_id, creator_id));

        if (!balance) {
            // Créer un solde vide si n'existe pas
            const [newBalance] = await db.insert(creatorBalances).values({
                creator_id,
                available_balance: '0.00',
                pending_withdrawal: '0.00',
                total_earned: '0.00',
                total_withdrawn: '0.00'
            }).returning();

            return res.json({
                success: true,
                data: newBalance
            });
        }

        res.json({
            success: true,
            data: balance
        });

    } catch (error) {
        console.error('❌ Erreur récupération solde:', error);
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur"
        });
    }
});

export default router;


