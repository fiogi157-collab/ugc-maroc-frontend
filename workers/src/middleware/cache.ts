import { Context, Next } from 'hono'
import { KVCacheService, getClientId } from '../services/kv-cache.js'

// Cache middleware for Hono
export async function cacheMiddleware(c: Context, next: Next) {
  const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
  const request = c.req
  const url = new URL(request.url)
  
  // Skip cache for POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    return await next()
  }

  // Create cache key based on URL and query params
  const cacheKey = `route:${url.pathname}:${url.search}`
  
  try {
    // Try to get from cache
    const cached = await c.env.UGC_MAROC_CACHE.get(cacheKey, 'json')
    
    if (cached) {
      console.log(`Cache HIT for ${cacheKey}`)
      return c.json(cached.data, cached.status, cached.headers)
    }
  } catch (error) {
    console.error('Cache read error:', error)
  }

  // Cache miss - execute the route
  await next()

  // Cache the response if it's successful
  if (c.res.status >= 200 && c.res.status < 300) {
    try {
      const responseData = await c.res.clone().json()
      const cacheData = {
        data: responseData,
        status: c.res.status,
        headers: Object.fromEntries(c.res.headers.entries())
      }
      
      // Cache for 5 minutes by default
      await c.env.UGC_MAROC_CACHE.put(cacheKey, JSON.stringify(cacheData), {
        expirationTtl: 300
      })
      
      console.log(`Cache SET for ${cacheKey}`)
    } catch (error) {
      console.error('Cache write error:', error)
    }
  }
}

// Rate limiting middleware
export async function rateLimitMiddleware(c: Context, next: Next) {
  const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
  const clientId = getClientId(c.req.raw)
  const endpoint = c.req.path
  
  // Different limits for different endpoints
  let limit = 100 // Default
  let window = 60 // 1 minute
  
  if (endpoint.includes('/auth/')) {
    limit = 10 // Stricter for auth endpoints
    window = 300 // 5 minutes
  } else if (endpoint.includes('/payments/')) {
    limit = 20 // Moderate for payment endpoints
    window = 60
  } else if (endpoint.includes('/api/')) {
    limit = 100 // Standard for API endpoints
    window = 60
  }
  
  const rateLimit = await cache.checkRateLimit(clientId, endpoint, limit, window)
  
  if (!rateLimit.allowed) {
    return c.json({
      success: false,
      error: 'Too many requests',
      retry_after: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    }, 429)
  }
  
  // Add rate limit headers
  c.header('X-RateLimit-Limit', String(limit))
  c.header('X-RateLimit-Remaining', String(rateLimit.remaining))
  c.header('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)))
  
  await next()
}

// Session cache middleware
export async function sessionCacheMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return await next()
  }
  
  const token = authHeader.substring(7)
  const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
  
  try {
    // Try to decode JWT to get user ID
    const parts = token.split('.')
    if (parts.length !== 3) {
      return await next()
    }
    
    const payload = JSON.parse(atob(parts[1]))
    const userId = payload.sub
    
    if (!userId) {
      return await next()
    }
    
    // Try to get user from cache
    const cachedUser = await cache.getUserSession(userId)
    
    if (cachedUser) {
      console.log(`Session cache HIT for user ${userId}`)
      // Add user to context for use in routes
      c.set('user', cachedUser)
      c.set('userId', userId)
      return await next()
    }
    
    console.log(`Session cache MISS for user ${userId}`)
    
  } catch (error) {
    console.error('Session cache error:', error)
  }
  
  await next()
}

// Analytics middleware
export async function analyticsMiddleware(c: Context, next: Next) {
  const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
  
  // Track request
  await cache.incrementCounter('requests:total')
  await cache.incrementCounter(`requests:${c.req.method}`)
  await cache.incrementCounter(`requests:${c.req.path}`)
  
  // Track unique visitors (simplified)
  const clientId = getClientId(c.req.raw)
  const today = new Date().toISOString().split('T')[0]
  await cache.incrementCounter(`visitors:${today}`)
  
  await next()
  
  // Track response status
  await cache.incrementCounter(`responses:${c.res.status}`)
}

// Feature flag middleware
export async function featureFlagMiddleware(c: Context, next: Next) {
  const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
  
  // Check if chat is enabled
  const chatEnabled = await cache.getFeatureFlag('chat_enabled')
  if (c.req.path.includes('/chat/') && !chatEnabled) {
    return c.json({
      success: false,
      error: 'Chat feature is currently disabled'
    }, 503)
  }
  
  // Check if AI matching is enabled
  const aiMatchingEnabled = await cache.getFeatureFlag('ai_matching')
  if (c.req.path.includes('/ai/') && !aiMatchingEnabled) {
    return c.json({
      success: false,
      error: 'AI matching feature is currently disabled'
    }, 503)
  }
  
  await next()
}
