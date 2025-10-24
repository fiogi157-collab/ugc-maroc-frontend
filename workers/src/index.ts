import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { schema } from './db/schema'
import { createAuthRoutes } from './auth/routes.js'
import { createPaymentRoutes } from './routes/payments.js'
import { createChatRoutes } from './routes/chat.js'
import { createCachedRoutes } from './routes/cached-routes.js'
import { 
  cacheMiddleware, 
  rateLimitMiddleware, 
  sessionCacheMiddleware,
  analyticsMiddleware,
  featureFlagMiddleware 
} from './middleware/cache.js'

// Types for Cloudflare Workers environment
type Env = {
  DB: D1Database
  R2: R2Bucket
  UGC_MAROC_CACHE: KVNamespace
  ENVIRONMENT: string
  JWT_SECRET: string
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  RESEND_API_KEY: string
  OPENROUTER_API_KEY: string
  // CHAT_ROOM: DurableObjectNamespace
}

// Create Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors({
  origin: [
    'https://ugc-maroc-frontend.pages.dev',
    'https://ugc-maroc.pages.dev', 
    'http://localhost:3000',
    'http://localhost:8787'
  ],
  credentials: true,
}))

// Apply KV cache middleware
app.use('*', analyticsMiddleware)
app.use('*', rateLimitMiddleware)
app.use('*', featureFlagMiddleware)
app.use('*', sessionCacheMiddleware)
app.use('*', cacheMiddleware)

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'UGC Maroc API - Cloudflare Workers',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      campaigns: '/api/campaigns',
      gigs: '/api/gigs',
      orders: '/api/orders',
      payments: '/api/payments',
      messages: '/api/messages',
      negotiations: '/api/negotiations',
      contracts: '/api/contracts'
    },
    documentation: 'https://github.com/fiogi157-collab/ugc-maroc-frontend'
  })
})

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    environment: c.env.ENVIRONMENT || 'development'
  })
})

// Database connection helper
const getDb = (c: any) => drizzle(c.env.DB, { schema })

// ===== AUTH ROUTES =====
// Auth.js routes are handled by createAuthRoutes
createAuthRoutes(app)

// ===== PAYMENT ROUTES =====
// Stripe payment routes
createPaymentRoutes(app)

// ===== CHAT ROUTES =====
// Real-time chat with Durable Objects (temporarily disabled)
// createChatRoutes(app)

// ===== CACHED ROUTES =====
// KV-optimized routes with caching
createCachedRoutes(app)

// ===== PROFILES ROUTES =====
app.get('/api/profiles/:id', async (c) => {
  const db = getDb(c)
  const profileId = c.req.param('id')
  
  try {
    const profile = await db.select().from(schema.profiles).where(eq(schema.profiles.id, profileId)).get()
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }
    
    return c.json({ profile })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/api/profiles', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newProfile = await db.insert(schema.profiles).values(body).returning().get()
    return c.json({ profile: newProfile }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create profile' }, 500)
  }
})

// ===== CAMPAIGNS ROUTES =====
app.get('/api/campaigns', async (c) => {
  const db = getDb(c)
  
  try {
    const campaigns = await db.select().from(schema.campaigns).all()
    return c.json({ 
      success: true,
      campaigns,
      count: campaigns.length 
    })
  } catch (error) {
    console.error('Campaigns fetch error:', error)
    return c.json({ 
      success: false,
      error: 'Failed to fetch campaigns',
      details: error.message 
    }, 500)
  }
})

app.get('/api/campaigns/:id', async (c) => {
  const db = getDb(c)
  const campaignId = parseInt(c.req.param('id'))
  
  try {
    const campaign = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, campaignId)).get()
    
    if (!campaign) {
      return c.json({ error: 'Campaign not found' }, 404)
    }
    
    return c.json({ campaign })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/api/campaigns', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newCampaign = await db.insert(schema.campaigns).values(body).returning().get()
    return c.json({ campaign: newCampaign }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create campaign' }, 500)
  }
})

// ===== GIGS ROUTES =====
app.get('/api/gigs', async (c) => {
  const db = getDb(c)
  
  try {
    const gigs = await db.select().from(schema.gigs).all()
    return c.json({ gigs })
  } catch (error) {
    return c.json({ error: 'Failed to fetch gigs' }, 500)
  }
})

app.get('/api/gigs/:id', async (c) => {
  const db = getDb(c)
  const gigId = parseInt(c.req.param('id'))
  
  try {
    const gig = await db.select().from(schema.gigs).where(eq(schema.gigs.id, gigId)).get()
    
    if (!gig) {
      return c.json({ error: 'Gig not found' }, 404)
    }
    
    return c.json({ gig })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

app.post('/api/gigs', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newGig = await db.insert(schema.gigs).values(body).returning().get()
    return c.json({ gig: newGig }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create gig' }, 500)
  }
})

// ===== SUBMISSIONS ROUTES =====
app.get('/api/submissions', async (c) => {
  const db = getDb(c)
  
  try {
    const submissions = await db.select().from(schema.submissions).all()
    return c.json({ submissions })
  } catch (error) {
    return c.json({ error: 'Failed to fetch submissions' }, 500)
  }
})

app.post('/api/submissions', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newSubmission = await db.insert(schema.submissions).values(body).returning().get()
    return c.json({ submission: newSubmission }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create submission' }, 500)
  }
})

// ===== ORDERS ROUTES =====
app.get('/api/orders', async (c) => {
  const db = getDb(c)
  
  try {
    const orders = await db.select().from(schema.orders).all()
    return c.json({ orders })
  } catch (error) {
    return c.json({ error: 'Failed to fetch orders' }, 500)
  }
})

app.post('/api/orders', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newOrder = await db.insert(schema.orders).values(body).returning().get()
    return c.json({ order: newOrder }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create order' }, 500)
  }
})

// ===== PAYMENTS ROUTES =====
app.get('/api/payments', async (c) => {
  const db = getDb(c)
  
  try {
    const payments = await db.select().from(schema.payments).all()
    return c.json({ payments })
  } catch (error) {
    return c.json({ error: 'Failed to fetch payments' }, 500)
  }
})

app.post('/api/payments', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newPayment = await db.insert(schema.payments).values(body).returning().get()
    return c.json({ payment: newPayment }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create payment' }, 500)
  }
})

// ===== MESSAGES ROUTES =====
app.get('/api/messages', async (c) => {
  const db = getDb(c)
  
  try {
    const messages = await db.select().from(schema.messages).all()
    return c.json({ messages })
  } catch (error) {
    return c.json({ error: 'Failed to fetch messages' }, 500)
  }
})

app.post('/api/messages', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newMessage = await db.insert(schema.messages).values(body).returning().get()
    return c.json({ message: newMessage }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create message' }, 500)
  }
})

// ===== NEGOTIATIONS ROUTES =====
app.get('/api/negotiations', async (c) => {
  const db = getDb(c)
  
  try {
    const negotiations = await db.select().from(schema.negotiations).all()
    return c.json({ negotiations })
  } catch (error) {
    return c.json({ error: 'Failed to fetch negotiations' }, 500)
  }
})

app.post('/api/negotiations', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newNegotiation = await db.insert(schema.negotiations).values(body).returning().get()
    return c.json({ negotiation: newNegotiation }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create negotiation' }, 500)
  }
})

// ===== CONTRACTS ROUTES =====
app.get('/api/contracts', async (c) => {
  const db = getDb(c)
  
  try {
    const contracts = await db.select().from(schema.contracts).all()
    return c.json({ contracts })
  } catch (error) {
    return c.json({ error: 'Failed to fetch contracts' }, 500)
  }
})

app.post('/api/contracts', async (c) => {
  const db = getDb(c)
  const body = await c.req.json()
  
  try {
    const newContract = await db.insert(schema.contracts).values(body).returning().get()
    return c.json({ contract: newContract }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create contract' }, 500)
  }
})

// ===== WALLETS ROUTES =====
app.get('/api/wallets/:userId', async (c) => {
  const db = getDb(c)
  const userId = c.req.param('userId')
  
  try {
    const wallet = await db.select().from(schema.wallets).where(eq(schema.wallets.user_id, userId)).get()
    
    if (!wallet) {
      return c.json({ error: 'Wallet not found' }, 404)
    }
    
    return c.json({ wallet })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// Error handler
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

export default app

// Durable Object for real-time chat
export class ChatRoom {
  private state: DurableObjectState
  private sessions: Set<WebSocket> = new Set()
  private messages: Array<{
    id: string
    user_id: string
    conversation_id: string
    content: string
    timestamp: number
    type: 'text' | 'image' | 'file'
  }> = []

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request)
    }
    
    if (url.pathname === '/messages') {
      return this.handleMessages(request)
    }
    
    if (url.pathname === '/send') {
      return this.handleSendMessage(request)
    }

    return new Response('Not found', { status: 404 })
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    server.accept()
    this.sessions.add(server)

    // Send recent messages to new connection
    const recentMessages = this.messages.slice(-50) // Last 50 messages
    server.send(JSON.stringify({
      type: 'history',
      messages: recentMessages
    }))

    server.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string)
        this.handleMessage(data, server)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    })

    server.addEventListener('close', () => {
      this.sessions.delete(server)
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  private async handleMessage(data: any, sender: WebSocket) {
    switch (data.type) {
      case 'join':
        console.log(`User ${data.user_id} joined conversation ${data.conversation_id}`)
        break
        
      case 'message':
        const message = {
          id: crypto.randomUUID(),
          user_id: data.user_id,
          conversation_id: data.conversation_id,
          content: data.content,
          timestamp: Date.now(),
          type: data.message_type || 'text'
        }
        
        this.messages.push(message)
        
        this.broadcast({
          type: 'new_message',
          message
        })
        break
        
      case 'typing':
        this.broadcast({
          type: 'typing',
          user_id: data.user_id,
          conversation_id: data.conversation_id,
          is_typing: data.is_typing
        })
        break
    }
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data)
    this.sessions.forEach(ws => {
      try {
        ws.send(message)
      } catch (error) {
        console.error('Broadcast error:', error)
        this.sessions.delete(ws)
      }
    })
  }

  private async handleMessages(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const conversationId = url.searchParams.get('conversation_id')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let filteredMessages = this.messages
    
    if (conversationId) {
      filteredMessages = this.messages.filter(m => m.conversation_id === conversationId)
    }

    const paginatedMessages = filteredMessages
      .slice(offset, offset + limit)
      .sort((a, b) => b.timestamp - a.timestamp)

    return new Response(JSON.stringify({
      success: true,
      messages: paginatedMessages,
      total: filteredMessages.length,
      has_more: offset + limit < filteredMessages.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  private async handleSendMessage(request: Request): Promise<Response> {
    try {
      const data = await request.json()
      
      const message = {
        id: crypto.randomUUID(),
        user_id: data.user_id,
        conversation_id: data.conversation_id,
        content: data.content,
        timestamp: Date.now(),
        type: data.type || 'text'
      }
      
      this.messages.push(message)
      
      this.broadcast({
        type: 'new_message',
        message
      })
      
      return new Response(JSON.stringify({
        success: true,
        message
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to send message'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
