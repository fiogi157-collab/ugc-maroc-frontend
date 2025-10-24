// ===========================================================
// 📧 UGC Maroc - Email Routing Service
// ===========================================================

export interface EmailRoute {
  id: string
  pattern: string
  destination: string[]
  enabled: boolean
  created: string
  modified: string
}

export interface EmailDestination {
  type: 'worker' | 'email'
  value: string
}

export interface EmailMessage {
  from: string
  to: string
  subject: string
  text?: string
  html?: string
  headers?: Record<string, string>
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
}

export class EmailRoutingService {
  private accountId: string
  private apiToken: string

  constructor(accountId: string, apiToken: string) {
    this.accountId = accountId
    this.apiToken = apiToken
  }

  // Créer une route email
  async createRoute(pattern: string, destinations: EmailDestination[]): Promise<EmailRoute> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/email/routing/rules`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern,
          destinations: destinations.map(d => ({
            type: d.type,
            value: d.value
          }))
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create email route: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Lister les routes email
  async listRoutes(): Promise<EmailRoute[]> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/email/routing/rules`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list email routes: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Supprimer une route email
  async deleteRoute(id: string): Promise<boolean> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/email/routing/rules/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      }
    )

    return response.ok
  }

  // Mettre à jour une route email
  async updateRoute(id: string, pattern: string, destinations: EmailDestination[]): Promise<EmailRoute> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/email/routing/rules/${id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pattern,
          destinations: destinations.map(d => ({
            type: d.type,
            value: d.value
          }))
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update email route: ${response.statusText}`)
    }

    const data = await response.json()
    return data.result
  }

  // Envoyer un email via Workers
  async sendEmail(message: EmailMessage, workerUrl: string): Promise<boolean> {
    const response = await fetch(workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify({
        type: 'email',
        message
      }),
    })

    return response.ok
  }

  // Routes prédéfinies pour UGC Maroc
  static readonly ROUTES = {
    SUPPORT: {
      pattern: 'support@ugcmaroc.ma',
      destinations: [
        { type: 'worker' as const, value: 'ugc-maroc-api' }
      ]
    },
    SALES: {
      pattern: 'sales@ugcmaroc.ma',
      destinations: [
        { type: 'worker' as const, value: 'ugc-maroc-api' }
      ]
    },
    CONTACT: {
      pattern: 'contact@ugcmaroc.ma',
      destinations: [
        { type: 'worker' as const, value: 'ugc-maroc-api' }
      ]
    },
    INFO: {
      pattern: 'info@ugcmaroc.ma',
      destinations: [
        { type: 'worker' as const, value: 'ugc-maroc-api' }
      ]
    },
    CATCH_ALL: {
      pattern: '*@ugcmaroc.ma',
      destinations: [
        { type: 'worker' as const, value: 'ugc-maroc-api' }
      ]
    }
  } as const

  // Setup automatique des routes UGC Maroc
  async setupUgcMarocRoutes(): Promise<{
    success: boolean
    routes: EmailRoute[]
    errors: string[]
  }> {
    const routes: EmailRoute[] = []
    const errors: string[] = []

    for (const [name, config] of Object.entries(EmailRoutingService.ROUTES)) {
      try {
        const route = await this.createRoute(config.pattern, config.destinations)
        routes.push(route)
        console.log(`✅ Created route: ${name} -> ${config.pattern}`)
      } catch (error) {
        const errorMsg = `Failed to create route ${name}: ${error.message}`
        errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    return {
      success: errors.length === 0,
      routes,
      errors
    }
  }

  // Traiter un email reçu
  async processIncomingEmail(emailData: {
    from: string
    to: string
    subject: string
    text: string
    html?: string
    headers: Record<string, string>
  }): Promise<{
    success: boolean
    action: string
    response?: string
  }> {
    const { from, to, subject, text, html, headers } = emailData

    // Détecter le type d'email
    if (to.includes('support@')) {
      return this.handleSupportEmail({ from, subject, text, html })
    } else if (to.includes('sales@')) {
      return this.handleSalesEmail({ from, subject, text, html })
    } else if (to.includes('contact@')) {
      return this.handleContactEmail({ from, subject, text, html })
    } else {
      return this.handleGeneralEmail({ from, to, subject, text, html })
    }
  }

  private async handleSupportEmail(data: {
    from: string
    subject: string
    text: string
    html?: string
  }): Promise<{ success: boolean; action: string; response?: string }> {
    // Logique pour les emails de support
    console.log('📧 Support email received:', data.from, data.subject)
    
    // Ici vous pouvez :
    // - Créer un ticket dans votre système
    // - Envoyer une notification aux admins
    // - Répondre automatiquement
    
    return {
      success: true,
      action: 'support_ticket_created',
      response: 'Votre demande de support a été reçue. Nous vous répondrons dans les 24h.'
    }
  }

  private async handleSalesEmail(data: {
    from: string
    subject: string
    text: string
    html?: string
  }): Promise<{ success: boolean; action: string; response?: string }> {
    // Logique pour les emails de vente
    console.log('💰 Sales email received:', data.from, data.subject)
    
    return {
      success: true,
      action: 'sales_inquiry_received',
      response: 'Merci pour votre intérêt ! Notre équipe commerciale vous contactera bientôt.'
    }
  }

  private async handleContactEmail(data: {
    from: string
    subject: string
    text: string
    html?: string
  }): Promise<{ success: boolean; action: string; response?: string }> {
    // Logique pour les emails de contact général
    console.log('📬 Contact email received:', data.from, data.subject)
    
    return {
      success: true,
      action: 'contact_form_received',
      response: 'Merci pour votre message ! Nous vous répondrons rapidement.'
    }
  }

  private async handleGeneralEmail(data: {
    from: string
    to: string
    subject: string
    text: string
    html?: string
  }): Promise<{ success: boolean; action: string; response?: string }> {
    // Logique pour les emails généraux
    console.log('📧 General email received:', data.from, data.to, data.subject)
    
    return {
      success: true,
      action: 'email_forwarded',
      response: 'Email reçu et traité.'
    }
  }
}
