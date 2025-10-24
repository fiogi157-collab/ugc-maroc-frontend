// ===========================================================
// 🛡️ UGC Maroc - Turnstile Routes (Anti-bot)
// ===========================================================

import { Hono } from 'hono'
import { TurnstileService } from '../services/turnstile.js'

export function createTurnstileRoutes(app: Hono) {
  
  // Helper pour initialiser TurnstileService
  app.use('/api/turnstile/*', async (c, next) => {
    const siteKey = c.env.TURNSTILE_SITE_KEY
    const secretKey = c.env.TURNSTILE_SECRET_KEY
    
    if (!siteKey || !secretKey) {
      return c.json({ 
        success: false, 
        error: 'Turnstile credentials not configured' 
      }, 500)
    }
    
    c.set('turnstileService', new TurnstileService(secretKey, siteKey))
    await next()
  })

  // Vérifier un token Turnstile
  app.post('/api/turnstile/verify', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { 
        token, 
        remoteip, 
        action, 
        cdata 
      } = body

      if (!token) {
        return c.json({ 
          success: false, 
          error: 'Token is required' 
        }, 400)
      }

      const result = await turnstileService.verifyWithOptions(token, {
        remoteip,
        action,
        cdata
      })

      return c.json({
        success: result.success,
        error: result.error,
        details: result.details
      })

    } catch (error) {
      console.error('Turnstile verify error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify token',
        details: error.message 
      }, 500)
    }
  })

  // Vérifier avec rate limiting
  app.post('/api/turnstile/verify-with-rate-limit', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { 
        token, 
        remoteip, 
        action, 
        cdata,
        rateLimitKey,
        maxAttempts = 5,
        windowMs = 60000
      } = body

      if (!token) {
        return c.json({ 
          success: false, 
          error: 'Token is required' 
        }, 400)
      }

      const result = await turnstileService.verifyWithRateLimit(token, {
        remoteip,
        action,
        cdata,
        rateLimitKey,
        maxAttempts,
        windowMs
      }, c.env.UGC_MAROC_CACHE)

      return c.json({
        success: result.success,
        error: result.error,
        rateLimited: result.rateLimited,
        attempts: result.attempts
      })

    } catch (error) {
      console.error('Turnstile verify with rate limit error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify token',
        details: error.message 
      }, 500)
    }
  })

  // Vérifier avec action spécifique
  app.post('/api/turnstile/verify-action', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { 
        token, 
        action, 
        remoteip, 
        cdata 
      } = body

      if (!token) {
        return c.json({ 
          success: false, 
          error: 'Token is required' 
        }, 400)
      }

      if (!action || !['SIGNUP', 'LOGIN', 'CAMPAIGN_SUBMIT', 'GIG_CREATE', 'CONTACT', 'PASSWORD_RESET'].includes(action)) {
        return c.json({ 
          success: false, 
          error: 'Valid action is required' 
        }, 400)
      }

      const result = await turnstileService.verifyWithAction(token, action as any, {
        remoteip,
        cdata
      })

      return c.json({
        success: result.success,
        error: result.error,
        action: result.action
      })

    } catch (error) {
      console.error('Turnstile verify action error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify token',
        details: error.message 
      }, 500)
    }
  })

  // Obtenir la configuration frontend
  app.get('/api/turnstile/config', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const theme = c.req.query('theme') as 'light' | 'dark' | 'auto' || 'auto'
      const size = c.req.query('size') as 'normal' | 'compact' || 'normal'
      const language = c.req.query('language')
      const callback = c.req.query('callback')
      const expiredCallback = c.req.query('expired-callback')
      const errorCallback = c.req.query('error-callback')

      const config = turnstileService.getFrontendConfig({
        theme,
        size,
        language,
        callback,
        'expired-callback': expiredCallback,
        'error-callback': errorCallback
      })

      return c.json({
        success: true,
        config
      })

    } catch (error) {
      console.error('Turnstile config error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get config',
        details: error.message 
      }, 500)
    }
  })

  // Middleware pour protéger les routes
  app.use('/api/protected/*', async (c, next) => {
    const turnstileToken = c.req.header('X-Turnstile-Token')
    
    if (!turnstileToken) {
      return c.json({ 
        success: false, 
        error: 'Turnstile token required' 
      }, 401)
    }

    const turnstileService: TurnstileService = c.get('turnstileService')
    const result = await turnstileService.verifyWithOptions(turnstileToken)

    if (!result.success) {
      return c.json({ 
        success: false, 
        error: 'Invalid Turnstile token',
        details: result.error 
      }, 401)
    }

    await next()
  })

  // Routes spécifiques pour chaque action
  app.post('/api/turnstile/signup', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { token, remoteip } = body

      const result = await turnstileService.verifyWithAction(token, 'SIGNUP', { remoteip })

      return c.json({
        success: result.success,
        error: result.error,
        action: result.action
      })

    } catch (error) {
      console.error('Turnstile signup error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify signup token',
        details: error.message 
      }, 500)
    }
  })

  app.post('/api/turnstile/login', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { token, remoteip } = body

      const result = await turnstileService.verifyWithAction(token, 'LOGIN', { remoteip })

      return c.json({
        success: result.success,
        error: result.error,
        action: result.action
      })

    } catch (error) {
      console.error('Turnstile login error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify login token',
        details: error.message 
      }, 500)
    }
  })

  app.post('/api/turnstile/campaign-submit', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { token, remoteip } = body

      const result = await turnstileService.verifyWithAction(token, 'CAMPAIGN_SUBMIT', { remoteip })

      return c.json({
        success: result.success,
        error: result.error,
        action: result.action
      })

    } catch (error) {
      console.error('Turnstile campaign submit error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify campaign submit token',
        details: error.message 
      }, 500)
    }
  })

  app.post('/api/turnstile/gig-create', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { token, remoteip } = body

      const result = await turnstileService.verifyWithAction(token, 'GIG_CREATE', { remoteip })

      return c.json({
        success: result.success,
        error: result.error,
        action: result.action
      })

    } catch (error) {
      console.error('Turnstile gig create error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify gig create token',
        details: error.message 
      }, 500)
    }
  })

  app.post('/api/turnstile/contact', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { token, remoteip } = body

      const result = await turnstileService.verifyWithAction(token, 'CONTACT', { remoteip })

      return c.json({
        success: result.success,
        error: result.error,
        action: result.action
      })

    } catch (error) {
      console.error('Turnstile contact error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify contact token',
        details: error.message 
      }, 500)
    }
  })

  app.post('/api/turnstile/password-reset', async (c) => {
    const turnstileService: TurnstileService = c.get('turnstileService')
    
    try {
      const body = await c.req.json()
      const { token, remoteip } = body

      const result = await turnstileService.verifyWithAction(token, 'PASSWORD_RESET', { remoteip })

      return c.json({
        success: result.success,
        error: result.error,
        action: result.action
      })

    } catch (error) {
      console.error('Turnstile password reset error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to verify password reset token',
        details: error.message 
      }, 500)
    }
  })
}
