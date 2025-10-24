import Stripe from 'stripe';
import { db } from '../db/client.js';
import { payments, webhookEvents, orders, creatorBalances, agreementEscrow, campaignAgreements } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Service Stripe pour UGC Maroc
 * Gère les paiements, webhooks et remboursements
 */
class StripeService {
    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia',
        });
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        this.platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '15');
        this.stripeFeePercentage = parseFloat(process.env.STRIPE_FEE_PERCENTAGE || '5');
        
        if (!this.stripe) {
            console.error("⚠️ STRIPE_SECRET_KEY manquante dans les variables d'environnement");
        } else {
            console.log("✅ Service Stripe initialisé");
        }
    }

    /**
     * Créer un PaymentIntent Stripe
     * @param {Object} orderData - Données de la commande
     * @returns {Object} Résultat avec client_secret
     */
    async createPaymentIntent(orderData) {
        try {
            const { order_id, amount_mad, currency = 'MAD', metadata = {} } = orderData;
            
            // Calculer les frais Stripe (5%)
            const stripeFee = Math.round(amount_mad * this.stripeFeePercentage / 100 * 100) / 100;
            const totalAmount = amount_mad + stripeFee;
            
            // Convertir MAD en centimes (Stripe utilise les centimes)
            const amountInCents = Math.round(totalAmount * 100);
            
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountInCents,
                currency: currency.toLowerCase(),
                metadata: {
                    order_id: order_id.toString(),
                    platform: 'ugc_maroc',
                    amount_creator: amount_mad.toString(),
                    stripe_fee: stripeFee.toString(),
                    ...metadata
                },
                automatic_payment_methods: {
                    enabled: true,
                },
                capture_method: 'automatic',
            });

            // Enregistrer le paiement en base
            const [payment] = await db.insert(payments).values({
                order_id,
                provider: 'stripe',
                payment_intent_id: paymentIntent.id,
                status: 'PENDING',
                amount_mad: totalAmount,
                currency,
                fee_mad: stripeFee,
                payload: JSON.stringify(paymentIntent)
            }).returning();

            console.log(`✅ PaymentIntent créé: ${paymentIntent.id} pour la commande ${order_id}`);
            
            return {
                success: true,
                data: {
                    client_secret: paymentIntent.client_secret,
                    payment_intent_id: paymentIntent.id,
                    payment_id: payment.id,
                    amount_total: totalAmount,
                    stripe_fee: stripeFee
                }
            };

        } catch (error) {
            console.error('❌ Erreur création PaymentIntent:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Vérifier la signature du webhook
     * @param {Buffer} rawBody - Corps brut de la requête
     * @param {string} signature - Signature Stripe
     * @returns {Object} Résultat avec event ou erreur
     */
    async verifyWebhookSignature(rawBody, signature) {
        try {
            const event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                this.webhookSecret
            );
            return { success: true, event };
        } catch (error) {
            console.error('❌ Erreur vérification webhook:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Traiter un événement webhook
     * @param {Object} event - Événement Stripe
     * @returns {Object} Résultat du traitement
     */
    async processWebhookEvent(event) {
        try {
            // Vérifier si l'événement a déjà été traité (idempotence)
            const existingEvent = await db.select()
                .from(webhookEvents)
                .where(and(
                    eq(webhookEvents.provider, 'stripe'),
                    eq(webhookEvents.event_id, event.id)
                ));

            if (existingEvent.length > 0) {
                console.log(`⚠️ Événement déjà traité: ${event.id}`);
                return { success: true, message: 'Event already processed' };
            }

            // Enregistrer l'événement
            await db.insert(webhookEvents).values({
                provider: 'stripe',
                event_id: event.id,
                event_type: event.type,
                status: 'PENDING',
                payload: JSON.stringify(event)
            });

            // Traiter selon le type d'événement
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                case 'payment_intent.canceled':
                    await this.handlePaymentCanceled(event.data.object);
                    break;
                default:
                    console.log(`ℹ️ Événement non traité: ${event.type}`);
            }

            // Marquer l'événement comme traité
            await db.update(webhookEvents)
                .set({ 
                    status: 'PROCESSED',
                    processed_at: new Date()
                })
                .where(and(
                    eq(webhookEvents.provider, 'stripe'),
                    eq(webhookEvents.event_id, event.id)
                ));

            return { success: true };

        } catch (error) {
            console.error('❌ Erreur traitement webhook:', error);
            
            // Marquer l'événement comme échoué
            await db.update(webhookEvents)
                .set({ 
                    status: 'FAILED',
                    error_message: error.message,
                    processed_at: new Date()
                })
                .where(and(
                    eq(webhookEvents.provider, 'stripe'),
                    eq(webhookEvents.event_id, event.id)
                ));

            return { success: false, error: error.message };
        }
    }

    /**
     * Gérer un paiement réussi
     * @param {Object} paymentIntent - PaymentIntent Stripe
     */
    async handlePaymentSucceeded(paymentIntent) {
        try {
            const orderId = parseInt(paymentIntent.metadata.order_id);
            const amountCreator = parseFloat(paymentIntent.metadata.amount_creator);
            
            // Mettre à jour le paiement
            await db.update(payments)
                .set({ 
                    status: 'CAPTURED',
                    updated_at: new Date()
                })
                .where(eq(payments.payment_intent_id, paymentIntent.id));

            // Mettre à jour la commande
            await db.update(orders)
                .set({ 
                    status: 'PAID',
                    updated_at: new Date()
                })
                .where(eq(orders.id, orderId));

            // Mettre à jour l'agreement
            await db.update(campaignAgreements)
                .set({ 
                    payment_status: 'PAID',
                    updated_at: new Date()
                })
                .where(eq(campaignAgreements.order_id, orderId));

            // Créer l'escrow
            const [order] = await db.select()
                .from(orders)
                .where(eq(orders.id, orderId));

            if (order) {
                await db.insert(agreementEscrow).values({
                    agreement_id: order.agreement_id,
                    brand_id: order.brand_id,
                    creator_id: order.creator_id,
                    amount: amountCreator,
                    status: 'active',
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }

            console.log(`✅ Paiement réussi traité: ${paymentIntent.id}`);
            
        } catch (error) {
            console.error('❌ Erreur traitement paiement réussi:', error);
            throw error;
        }
    }

    /**
     * Gérer un paiement échoué
     * @param {Object} paymentIntent - PaymentIntent Stripe
     */
    async handlePaymentFailed(paymentIntent) {
        try {
            const orderId = parseInt(paymentIntent.metadata.order_id);
            
            // Mettre à jour le paiement
            await db.update(payments)
                .set({ 
                    status: 'FAILED',
                    updated_at: new Date()
                })
                .where(eq(payments.payment_intent_id, paymentIntent.id));

            // Mettre à jour la commande
            await db.update(orders)
                .set({ 
                    status: 'FAILED',
                    updated_at: new Date()
                })
                .where(eq(orders.id, orderId));

            // Mettre à jour l'agreement
            await db.update(campaignAgreements)
                .set({ 
                    payment_status: 'FAILED',
                    updated_at: new Date()
                })
                .where(eq(campaignAgreements.order_id, orderId));

            console.log(`❌ Paiement échoué traité: ${paymentIntent.id}`);
            
        } catch (error) {
            console.error('❌ Erreur traitement paiement échoué:', error);
            throw error;
        }
    }

    /**
     * Gérer un paiement annulé
     * @param {Object} paymentIntent - PaymentIntent Stripe
     */
    async handlePaymentCanceled(paymentIntent) {
        try {
            const orderId = parseInt(paymentIntent.metadata.order_id);
            
            // Mettre à jour le paiement
            await db.update(payments)
                .set({ 
                    status: 'FAILED',
                    updated_at: new Date()
                })
                .where(eq(payments.payment_intent_id, paymentIntent.id));

            // Mettre à jour la commande
            await db.update(orders)
                .set({ 
                    status: 'CANCELLED',
                    updated_at: new Date()
                })
                .where(eq(orders.id, orderId));

            console.log(`🚫 Paiement annulé traité: ${paymentIntent.id}`);
            
        } catch (error) {
            console.error('❌ Erreur traitement paiement annulé:', error);
            throw error;
        }
    }

    /**
     * Libérer des fonds vers un créateur
     * @param {number} orderId - ID de la commande
     * @param {number} amountMad - Montant en MAD
     * @returns {Object} Résultat de l'opération
     */
    async releaseFundsToCreator(orderId, amountMad) {
        try {
            // Récupérer les détails de la commande
            const [order] = await db.select()
                .from(orders)
                .where(eq(orders.id, orderId));

            if (!order) {
                throw new Error(`Commande ${orderId} non trouvée`);
            }

            // Calculer les frais plateforme (15%)
            const platformFee = Math.round(amountMad * this.platformFeePercentage / 100 * 100) / 100;
            const netAmount = amountMad - platformFee;

            // Créer ou mettre à jour le solde du créateur
            await db.insert(creatorBalances).values({
                creator_id: order.creator_id,
                available_balance: netAmount,
                total_earned: netAmount
            }).onConflictDoUpdate({
                target: [creatorBalances.creator_id],
                set: {
                    available_balance: sql`${creatorBalances.available_balance} + ${netAmount}`,
                    total_earned: sql`${creatorBalances.total_earned} + ${netAmount}`,
                    updated_at: new Date()
                }
            });

            // Mettre à jour l'escrow
            await db.update(agreementEscrow)
                .set({
                    status: 'released',
                    updated_at: new Date()
                })
                .where(and(
                    eq(agreementEscrow.agreement_id, order.agreement_id),
                    eq(agreementEscrow.status, 'active')
                ));

            console.log(`✅ Fonds libérés vers créateur ${order.creator_id}: ${netAmount} MAD (frais: ${platformFee} MAD)`);
            
            return { 
                success: true, 
                data: { 
                    net_amount: netAmount, 
                    platform_fee: platformFee 
                } 
            };
            
        } catch (error) {
            console.error('❌ Erreur libération fonds:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Rembourser un paiement
     * @param {string} paymentIntentId - ID du PaymentIntent
     * @param {number} amount - Montant à rembourser (optionnel)
     * @returns {Object} Résultat du remboursement
     */
    async refundPayment(paymentIntentId, amount = null) {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined,
            });

            // Mettre à jour le paiement
            await db.update(payments)
                .set({ 
                    status: 'REFUNDED',
                    updated_at: new Date()
                })
                .where(eq(payments.payment_intent_id, paymentIntentId));

            // Mettre à jour la commande
            const [payment] = await db.select()
                .from(payments)
                .where(eq(payments.payment_intent_id, paymentIntentId));

            if (payment) {
                await db.update(orders)
                    .set({ 
                        status: 'REFUNDED',
                        updated_at: new Date()
                    })
                    .where(eq(orders.id, payment.order_id));
            }

            console.log(`✅ Remboursement créé: ${refund.id}`);
            
            return { success: true, data: refund };
            
        } catch (error) {
            console.error('❌ Erreur remboursement:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtenir les détails d'un PaymentIntent
     * @param {string} paymentIntentId - ID du PaymentIntent
     * @returns {Object} Détails du PaymentIntent
     */
    async getPaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            return { success: true, data: paymentIntent };
        } catch (error) {
            console.error('❌ Erreur récupération PaymentIntent:', error);
            return { success: false, error: error.message };
        }
    }
}

export default new StripeService();


