// Stripe service for Cloudflare Workers
export class StripeService {
  private apiKey: string
  private baseUrl = 'https://api.stripe.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }

    let body: string | undefined
    if (data && method !== 'GET') {
      body = new URLSearchParams(data).toString()
    }

    const response = await fetch(url, {
      method,
      headers,
      body
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stripe API error: ${response.status} - ${error}`)
    }

    return await response.json()
  }

  // Create a payment intent
  async createPaymentIntent(amount: number, currency: string = 'MAD', metadata?: any) {
    const data = {
      amount: amount * 100, // Convert to cents
      currency: currency.toLowerCase(),
      metadata: JSON.stringify(metadata || {})
    }

    return await this.makeRequest('/payment_intents', 'POST', data)
  }

  // Confirm a payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    const data = {
      payment_method: paymentMethodId
    }

    return await this.makeRequest(`/payment_intents/${paymentIntentId}/confirm`, 'POST', data)
  }

  // Create a customer
  async createCustomer(email: string, name?: string, metadata?: any) {
    const data: any = {
      email,
      metadata: JSON.stringify(metadata || {})
    }

    if (name) {
      data.name = name
    }

    return await this.makeRequest('/customers', 'POST', data)
  }

  // Create a payment method
  async createPaymentMethod(type: string, card: any) {
    const data = {
      type,
      'card[number]': card.number,
      'card[exp_month]': card.exp_month,
      'card[exp_year]': card.exp_year,
      'card[cvc]': card.cvc
    }

    return await this.makeRequest('/payment_methods', 'POST', data)
  }

  // Get payment intent
  async getPaymentIntent(paymentIntentId: string) {
    return await this.makeRequest(`/payment_intents/${paymentIntentId}`)
  }

  // Create a refund
  async createRefund(paymentIntentId: string, amount?: number, reason?: string) {
    const data: any = {
      payment_intent: paymentIntentId
    }

    if (amount) {
      data.amount = amount * 100 // Convert to cents
    }

    if (reason) {
      data.reason = reason
    }

    return await this.makeRequest('/refunds', 'POST', data)
  }

  // Create a transfer (for payouts to creators)
  async createTransfer(amount: number, destination: string, currency: string = 'MAD', metadata?: any) {
    const data = {
      amount: amount * 100, // Convert to cents
      currency: currency.toLowerCase(),
      destination,
      metadata: JSON.stringify(metadata || {})
    }

    return await this.makeRequest('/transfers', 'POST', data)
  }

  // Create a connected account for creators
  async createConnectedAccount(type: string = 'express', country: string = 'MA') {
    const data = {
      type,
      country
    }

    return await this.makeRequest('/accounts', 'POST', data)
  }

  // Create account link for onboarding
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    const data = {
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    }

    return await this.makeRequest('/account_links', 'POST', data)
  }
}

// Helper function to create Stripe service
export function createStripeService(apiKey: string): StripeService {
  return new StripeService(apiKey)
}
