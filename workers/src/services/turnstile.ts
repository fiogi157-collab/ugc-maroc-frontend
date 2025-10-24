// ===========================================================
// 🛡️ UGC Maroc - Turnstile Anti-bot Service
// ===========================================================

export interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

export interface TurnstileConfig {
  siteKey: string
  secretKey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  language?: string
}

export class TurnstileService {
  private secretKey: string
  private siteKey: string

  constructor(secretKey: string, siteKey: string) {
    this.secretKey = secretKey
    this.siteKey = siteKey
  }

  // Vérifier un token Turnstile
  async verifyToken(token: string, options: {
    remoteip?: string
    action?: string
    cdata?: string
  } = {}): Promise<TurnstileResponse> {
    const formData = new FormData()
    formData.append('secret', this.secretKey)
    formData.append('response', token)
    
    if (options.remoteip) {
      formData.append('remoteip', options.remoteip)
    }
    if (options.action) {
      formData.append('action', options.action)
    }
    if (options.cdata) {
      formData.append('cdata', options.cdata)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Turnstile verification failed: ${response.statusText}`)
    }

    return await response.json()
  }

  // Vérifier avec des options avancées
  async verifyWithOptions(token: string, options: {
    remoteip?: string
    action?: string
    cdata?: string
    timeout?: number
  } = {}): Promise<{
    success: boolean
    error?: string
    details?: TurnstileResponse
  }> {
    try {
      const result = await this.verifyToken(token, options)
      
      if (result.success) {
        return {
          success: true,
          details: result
        }
      } else {
        return {
          success: false,
          error: result['error-codes']?.join(', ') || 'Verification failed',
          details: result
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Générer la configuration frontend
  getFrontendConfig(options: {
    theme?: 'light' | 'dark' | 'auto'
    size?: 'normal' | 'compact'
    language?: string
    callback?: string
    'expired-callback'?: string
    'error-callback'?: string
  } = {}): {
    sitekey: string
    theme: string
    size: string
    language?: string
    callback?: string
    'expired-callback'?: string
    'error-callback'?: string
  } {
    return {
      sitekey: this.siteKey,
      theme: options.theme || 'auto',
      size: options.size || 'normal',
      language: options.language,
      callback: options.callback,
      'expired-callback': options['expired-callback'],
      'error-callback': options['error-callback']
    }
  }

  // Vérifier avec rate limiting
  async verifyWithRateLimit(token: string, options: {
    remoteip?: string
    action?: string
    cdata?: string
    rateLimitKey?: string
    maxAttempts?: number
    windowMs?: number
  } = {}, cache?: KVNamespace): Promise<{
    success: boolean
    error?: string
    rateLimited?: boolean
    attempts?: number
  }> {
    const rateLimitKey = options.rateLimitKey || `turnstile:${options.remoteip || 'unknown'}`
    const maxAttempts = options.maxAttempts || 5
    const windowMs = options.windowMs || 60000 // 1 minute

    if (cache) {
      // Vérifier le rate limiting
      const attempts = await cache.get(rateLimitKey)
      const attemptCount = attempts ? parseInt(attempts) : 0

      if (attemptCount >= maxAttempts) {
        return {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true,
          attempts: attemptCount
        }
      }

      // Incrémenter le compteur
      await cache.put(rateLimitKey, (attemptCount + 1).toString(), {
        expirationTtl: Math.floor(windowMs / 1000)
      })
    }

    // Vérifier le token
    const result = await this.verifyWithOptions(token, options)

    if (result.success && cache) {
      // Reset le compteur en cas de succès
      await cache.delete(rateLimitKey)
    }

    return {
      success: result.success,
      error: result.error,
      attempts: cache ? await cache.get(rateLimitKey).then(v => v ? parseInt(v) : 0) : undefined
    }
  }

  // Actions prédéfinies pour UGC Maroc
  static readonly ACTIONS = {
    SIGNUP: 'signup',
    LOGIN: 'login',
    CAMPAIGN_SUBMIT: 'campaign_submit',
    GIG_CREATE: 'gig_create',
    CONTACT: 'contact',
    PASSWORD_RESET: 'password_reset'
  } as const

  // Vérifier avec action spécifique
  async verifyWithAction(token: string, action: keyof typeof TurnstileService.ACTIONS, options: {
    remoteip?: string
    cdata?: string
  } = {}): Promise<{
    success: boolean
    error?: string
    action?: string
  }> {
    const result = await this.verifyWithOptions(token, {
      ...options,
      action: TurnstileService.ACTIONS[action]
    })

    return {
      success: result.success,
      error: result.error,
      action: TurnstileService.ACTIONS[action]
    }
  }
}
