import { Hono } from 'hono'
import { createStripeService } from '../services/stripe.js'

export function createPaymentRoutes(app: Hono) {
  // Create payment intent
  app.post('/api/payments/create-intent', async (c) => {
    try {
      const { amount, currency = 'MAD', campaign_id, order_id } = await c.req.json()
      
      if (!amount || amount <= 0) {
        return c.json({ 
          success: false, 
          error: 'Montant invalide' 
        }, 400)
      }

      const stripe = createStripeService(c.env.STRIPE_SECRET_KEY)
      
      const paymentIntent = await stripe.createPaymentIntent(
        amount,
        currency,
        {
          campaign_id,
          order_id,
          platform: 'ugc-maroc'
        }
      )

      return c.json({
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        }
      })

    } catch (error) {
      console.error('Payment intent error:', error)
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la création du paiement' 
      }, 500)
    }
  })

  // Confirm payment
  app.post('/api/payments/confirm', async (c) => {
    try {
      const { payment_intent_id, payment_method_id } = await c.req.json()
      
      if (!payment_intent_id || !payment_method_id) {
        return c.json({ 
          success: false, 
          error: 'Paramètres manquants' 
        }, 400)
      }

      const stripe = createStripeService(c.env.STRIPE_SECRET_KEY)
      
      const confirmedPayment = await stripe.confirmPaymentIntent(
        payment_intent_id,
        payment_method_id
      )

      // Update order status in database
      if (confirmedPayment.status === 'succeeded') {
        // TODO: Update order status in D1
        console.log('Payment succeeded:', confirmedPayment.id)
      }

      return c.json({
        success: true,
        payment: {
          id: confirmedPayment.id,
          status: confirmedPayment.status,
          amount: confirmedPayment.amount,
          currency: confirmedPayment.currency
        }
      })

    } catch (error) {
      console.error('Payment confirmation error:', error)
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la confirmation du paiement' 
      }, 500)
    }
  })

  // Create customer
  app.post('/api/payments/customers', async (c) => {
    try {
      const { email, name, user_id } = await c.req.json()
      
      if (!email) {
        return c.json({ 
          success: false, 
          error: 'Email requis' 
        }, 400)
      }

      const stripe = createStripeService(c.env.STRIPE_SECRET_KEY)
      
      const customer = await stripe.createCustomer(
        email,
        name,
        { user_id, platform: 'ugc-maroc' }
      )

      return c.json({
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        }
      })

    } catch (error) {
      console.error('Customer creation error:', error)
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la création du client' 
      }, 500)
    }
  })

  // Create refund
  app.post('/api/payments/refund', async (c) => {
    try {
      const { payment_intent_id, amount, reason } = await c.req.json()
      
      if (!payment_intent_id) {
        return c.json({ 
          success: false, 
          error: 'ID de paiement requis' 
        }, 400)
      }

      const stripe = createStripeService(c.env.STRIPE_SECRET_KEY)
      
      const refund = await stripe.createRefund(
        payment_intent_id,
        amount,
        reason
      )

      return c.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          reason: refund.reason
        }
      })

    } catch (error) {
      console.error('Refund error:', error)
      return c.json({ 
        success: false, 
        error: 'Erreur lors du remboursement' 
      }, 500)
    }
  })

  // Get payment status
  app.get('/api/payments/:payment_intent_id', async (c) => {
    try {
      const payment_intent_id = c.req.param('payment_intent_id')
      
      const stripe = createStripeService(c.env.STRIPE_SECRET_KEY)
      const paymentIntent = await stripe.getPaymentIntent(payment_intent_id)

      return c.json({
        success: true,
        payment: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: paymentIntent.created
        }
      })

    } catch (error) {
      console.error('Payment status error:', error)
      return c.json({ 
        success: false, 
        error: 'Erreur lors de la récupération du statut' 
      }, 500)
    }
  })

  // Stripe webhook handler
  app.post('/api/payments/webhook', async (c) => {
    try {
      const body = await c.req.text()
      const signature = c.req.header('stripe-signature')
      
      if (!signature) {
        return c.json({ error: 'Missing signature' }, 400)
      }

      // TODO: Verify webhook signature
      // const event = stripe.webhooks.constructEvent(body, signature, c.env.STRIPE_WEBHOOK_SECRET)
      
      const event = JSON.parse(body)
      
      console.log('Stripe webhook event:', event.type)

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('Payment succeeded:', event.data.object.id)
          // TODO: Update order status in D1
          break
          
        case 'payment_intent.payment_failed':
          console.log('Payment failed:', event.data.object.id)
          // TODO: Handle failed payment
          break
          
        case 'charge.dispute.created':
          console.log('Dispute created:', event.data.object.id)
          // TODO: Handle dispute
          break
      }

      return c.json({ received: true })

    } catch (error) {
      console.error('Webhook error:', error)
      return c.json({ error: 'Webhook processing failed' }, 500)
    }
  })
}
