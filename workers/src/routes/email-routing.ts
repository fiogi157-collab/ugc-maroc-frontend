// ===========================================================
// 📧 UGC Maroc - Email Routing Routes
// ===========================================================

import { Hono } from 'hono'
import { EmailRoutingService } from '../services/email-routing.js'

export function createEmailRoutingRoutes(app: Hono) {
  
  // Helper pour initialiser EmailRoutingService
  app.use('/api/email/*', async (c, next) => {
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = c.env.CLOUDFLARE_API_TOKEN
    
    if (!accountId || !apiToken) {
      return c.json({ 
        success: false, 
        error: 'Email routing credentials not configured' 
      }, 500)
    }
    
    c.set('emailRoutingService', new EmailRoutingService(accountId, apiToken))
    await next()
  })

  // Créer une route email
  app.post('/api/email/routes', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const body = await c.req.json()
      const { pattern, destinations } = body

      if (!pattern || !destinations || !Array.isArray(destinations)) {
        return c.json({ 
          success: false, 
          error: 'Pattern and destinations are required' 
        }, 400)
      }

      const route = await emailRoutingService.createRoute(pattern, destinations)

      return c.json({
        success: true,
        route
      })

    } catch (error) {
      console.error('Email routing create error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to create email route',
        details: error.message 
      }, 500)
    }
  })

  // Lister les routes email
  app.get('/api/email/routes', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const routes = await emailRoutingService.listRoutes()

      return c.json({
        success: true,
        routes
      })

    } catch (error) {
      console.error('Email routing list error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to list email routes',
        details: error.message 
      }, 500)
    }
  })

  // Supprimer une route email
  app.delete('/api/email/routes/:id', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    const id = c.req.param('id')
    
    try {
      const deleted = await emailRoutingService.deleteRoute(id)
      
      if (deleted) {
        return c.json({
          success: true,
          message: 'Email route deleted successfully'
        })
      } else {
        return c.json({ 
          success: false, 
          error: 'Failed to delete email route' 
        }, 500)
      }

    } catch (error) {
      console.error('Email routing delete error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to delete email route',
        details: error.message 
      }, 500)
    }
  })

  // Mettre à jour une route email
  app.put('/api/email/routes/:id', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    const id = c.req.param('id')
    
    try {
      const body = await c.req.json()
      const { pattern, destinations } = body

      if (!pattern || !destinations || !Array.isArray(destinations)) {
        return c.json({ 
          success: false, 
          error: 'Pattern and destinations are required' 
        }, 400)
      }

      const route = await emailRoutingService.updateRoute(id, pattern, destinations)

      return c.json({
        success: true,
        route
      })

    } catch (error) {
      console.error('Email routing update error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to update email route',
        details: error.message 
      }, 500)
    }
  })

  // Setup automatique des routes UGC Maroc
  app.post('/api/email/setup-ugc-maroc', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const result = await emailRoutingService.setupUgcMarocRoutes()

      return c.json({
        success: result.success,
        message: `Setup completed: ${result.routes.length} routes created`,
        routes: result.routes,
        errors: result.errors
      })

    } catch (error) {
      console.error('Email routing setup error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to setup UGC Maroc routes',
        details: error.message 
      }, 500)
    }
  })

  // Envoyer un email
  app.post('/api/email/send', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const body = await c.req.json()
      const { 
        from, 
        to, 
        subject, 
        text, 
        html, 
        headers = {}, 
        attachments = [] 
      } = body

      if (!from || !to || !subject || (!text && !html)) {
        return c.json({ 
          success: false, 
          error: 'From, to, subject, and text/html are required' 
        }, 400)
      }

      const workerUrl = `${c.env.API_BASE_URL || 'https://ugc-maroc-api.fiogi157.workers.dev'}/api/email/process`
      
      const sent = await emailRoutingService.sendEmail({
        from,
        to,
        subject,
        text,
        html,
        headers,
        attachments
      }, workerUrl)

      if (sent) {
        return c.json({
          success: true,
          message: 'Email sent successfully'
        })
      } else {
        return c.json({ 
          success: false, 
          error: 'Failed to send email' 
        }, 500)
      }

    } catch (error) {
      console.error('Email send error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to send email',
        details: error.message 
      }, 500)
    }
  })

  // Traiter un email reçu (webhook)
  app.post('/api/email/process', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const body = await c.req.json()
      
      // Vérifier que c'est bien un email
      if (body.type !== 'email') {
        return c.json({ 
          success: false, 
          error: 'Invalid email data' 
        }, 400)
      }

      const emailData = body.message
      const result = await emailRoutingService.processIncomingEmail(emailData)

      return c.json({
        success: result.success,
        action: result.action,
        response: result.response
      })

    } catch (error) {
      console.error('Email process error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to process email',
        details: error.message 
      }, 500)
    }
  })

  // Routes spécifiques pour chaque type d'email
  app.post('/api/email/support', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const body = await c.req.json()
      const { from, subject, text, html } = body

      const result = await emailRoutingService.processIncomingEmail({
        from,
        to: 'support@ugcmaroc.ma',
        subject,
        text,
        html,
        headers: {}
      })

      return c.json({
        success: result.success,
        action: result.action,
        response: result.response
      })

    } catch (error) {
      console.error('Email support error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to process support email',
        details: error.message 
      }, 500)
    }
  })

  app.post('/api/email/sales', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const body = await c.req.json()
      const { from, subject, text, html } = body

      const result = await emailRoutingService.processIncomingEmail({
        from,
        to: 'sales@ugcmaroc.ma',
        subject,
        text,
        html,
        headers: {}
      })

      return c.json({
        success: result.success,
        action: result.action,
        response: result.response
      })

    } catch (error) {
      console.error('Email sales error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to process sales email',
        details: error.message 
      }, 500)
    }
  })

  app.post('/api/email/contact', async (c) => {
    const emailRoutingService: EmailRoutingService = c.get('emailRoutingService')
    
    try {
      const body = await c.req.json()
      const { from, subject, text, html } = body

      const result = await emailRoutingService.processIncomingEmail({
        from,
        to: 'contact@ugcmaroc.ma',
        subject,
        text,
        html,
        headers: {}
      })

      return c.json({
        success: result.success,
        action: result.action,
        response: result.response
      })

    } catch (error) {
      console.error('Email contact error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to process contact email',
        details: error.message 
      }, 500)
    }
  })

  // Webhook pour les emails entrants
  app.post('/api/email/webhook', async (c) => {
    try {
      const body = await c.req.json()
      
      // Traiter les événements email
      switch (body.type) {
        case 'email.received':
          console.log('📧 Email received:', body.data.from, body.data.to)
          // Traiter l'email reçu
          break
          
        case 'email.bounced':
          console.log('📧 Email bounced:', body.data.to, body.data.reason)
          // Gérer le bounce
          break
          
        case 'email.complained':
          console.log('📧 Email complained:', body.data.to)
          // Gérer la plainte
          break
      }

      return c.json({ success: true })

    } catch (error) {
      console.error('Email webhook error:', error)
      return c.json({ 
        success: false, 
        error: 'Webhook processing failed' 
      }, 500)
    }
  })
}
