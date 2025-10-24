import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { schema } from './db/schema'

// Types for Cloudflare Workers environment
type Env = {
  DB: D1Database
  R2: R2Bucket
  STRIPE_SECRET_KEY: string
  RESEND_API_KEY: string
  OPENROUTER_API_KEY: string
  JWT_SECRET: string
}

// Create Hono app with environment bindings
const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors({
  origin: ['https://ugc-maroc-frontend.pages.dev', 'http://localhost:3000'],
  credentials: true,
}))

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
app.get('/api/auth/me', async (c) => {
  // TODO: Implement Auth.js middleware
  return c.json({ message: 'Auth endpoint - to be implemented' })
})

app.post('/api/auth/login', async (c) => {
  // TODO: Implement login with Auth.js
  return c.json({ message: 'Login endpoint - to be implemented' })
})

app.post('/api/auth/register', async (c) => {
  // TODO: Implement registration with Auth.js
  return c.json({ message: 'Register endpoint - to be implemented' })
})

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
    return c.json({ campaigns })
  } catch (error) {
    return c.json({ error: 'Failed to fetch campaigns' }, 500)
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
