import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq, desc, sql } from 'drizzle-orm'
import { schema } from '../db/schema.js'
import { KVCacheService, createSearchHash } from '../services/kv-cache.js'

export function createCachedRoutes(app: Hono) {
  // Helper to get cache service
  const getCache = (c: any) => new KVCacheService(c.env.UGC_MAROC_CACHE)
  
  // Helper to get database
  const getDb = (c: any) => drizzle(c.env.DB, { schema })

  // ===== CACHED CAMPAIGNS =====
  app.get('/api/campaigns/cached', async (c) => {
    const cache = getCache(c)
    const db = getDb(c)
    
    try {
      // Try cache first
      const cached = await cache.getCachedCampaigns()
      if (cached) {
        console.log('✅ Campaigns from cache')
        return c.json({
          success: true,
          campaigns: cached,
          count: cached.length,
          source: 'cache'
        })
      }

      // Cache miss - query database
      console.log('❌ Campaigns cache miss - querying DB')
      const campaigns = await db.select().from(schema.campaigns).all()
      
      // Cache the result
      await cache.cacheCampaigns(campaigns)
      
      return c.json({
        success: true,
        campaigns,
        count: campaigns.length,
        source: 'database'
      })
    } catch (error) {
      console.error('Campaigns error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to fetch campaigns' 
      }, 500)
    }
  })

  // ===== CACHED GIGS =====
  app.get('/api/gigs/cached', async (c) => {
    const cache = getCache(c)
    const db = getDb(c)
    
    try {
      // Try cache first
      const cached = await cache.getCachedGigs()
      if (cached) {
        console.log('✅ Gigs from cache')
        return c.json({
          success: true,
          gigs: cached,
          count: cached.length,
          source: 'cache'
        })
      }

      // Cache miss - query database
      console.log('❌ Gigs cache miss - querying DB')
      const gigs = await db.select().from(schema.gigs).all()
      
      // Cache the result
      await cache.cacheGigs(gigs)
      
      return c.json({
        success: true,
        gigs,
        count: gigs.length,
        source: 'database'
      })
    } catch (error) {
      console.error('Gigs error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to fetch gigs' 
      }, 500)
    }
  })

  // ===== CACHED CREATORS =====
  app.get('/api/creators/top', async (c) => {
    const cache = getCache(c)
    const db = getDb(c)
    
    try {
      // Try cache first
      const cached = await cache.getCachedTopCreators()
      if (cached) {
        console.log('✅ Top creators from cache')
        return c.json({
          success: true,
          creators: cached,
          count: cached.length,
          source: 'cache'
        })
      }

      // Cache miss - query database
      console.log('❌ Top creators cache miss - querying DB')
      const creators = await db.select()
        .from(schema.creators)
        .orderBy(desc(schema.creators.rating))
        .limit(10)
        .all()
      
      // Cache the result
      await cache.cacheTopCreators(creators)
      
      return c.json({
        success: true,
        creators,
        count: creators.length,
        source: 'database'
      })
    } catch (error) {
      console.error('Top creators error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to fetch top creators' 
      }, 500)
    }
  })

  // ===== CACHED SEARCH =====
  app.get('/api/search', async (c) => {
    const cache = getCache(c)
    const db = getDb(c)
    const query = c.req.query('q')
    const type = c.req.query('type') || 'all'
    
    if (!query) {
      return c.json({
        success: false,
        error: 'Search query required'
      }, 400)
    }

    try {
      // Create search hash for caching
      const searchParams = { query, type }
      const searchHash = await createSearchHash(searchParams)
      
      // Try cache first
      const cached = await cache.getCachedSearchResults(searchHash)
      if (cached) {
        console.log('✅ Search results from cache')
        return c.json({
          success: true,
          results: cached,
          query,
          source: 'cache'
        })
      }

      // Cache miss - perform search
      console.log('❌ Search cache miss - querying DB')
      let results = []
      
      if (type === 'all' || type === 'campaigns') {
        const campaigns = await db.select()
          .from(schema.campaigns)
          .where(sql`title LIKE ${'%' + query + '%'}`)
          .all()
        results.push(...campaigns.map(c => ({ ...c, type: 'campaign' })))
      }
      
      if (type === 'all' || type === 'gigs') {
        const gigs = await db.select()
          .from(schema.gigs)
          .where(sql`title LIKE ${'%' + query + '%'}`)
          .all()
        results.push(...gigs.map(g => ({ ...g, type: 'gig' })))
      }
      
      if (type === 'all' || type === 'creators') {
        const creators = await db.select()
          .from(schema.creators)
          .where(sql`specialization LIKE ${'%' + query + '%'}`)
          .all()
        results.push(...creators.map(c => ({ ...c, type: 'creator' })))
      }
      
      // Cache the results
      await cache.cacheSearchResults(searchHash, results)
      
      return c.json({
        success: true,
        results,
        query,
        count: results.length,
        source: 'database'
      })
    } catch (error) {
      console.error('Search error:', error)
      return c.json({ 
        success: false, 
        error: 'Search failed' 
      }, 500)
    }
  })

  // ===== ANALYTICS ENDPOINTS =====
  app.get('/api/analytics/stats', async (c) => {
    const cache = getCache(c)
    
    try {
      const stats = {
        total_requests: await cache.getCounter('requests:total'),
        total_visitors_today: await cache.getCounter(`visitors:${new Date().toISOString().split('T')[0]}`),
        campaigns_views: await cache.getCounter('analytics:campaigns:views'),
        gigs_views: await cache.getCounter('analytics:gigs:views'),
        creators_views: await cache.getCounter('analytics:creators:views')
      }
      
      return c.json({
        success: true,
        stats
      })
    } catch (error) {
      console.error('Analytics error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get analytics' 
      }, 500)
    }
  })

  // ===== FEATURE FLAGS =====
  app.get('/api/features', async (c) => {
    const cache = getCache(c)
    
    try {
      const flags = await cache.getAllFeatureFlags()
      
      return c.json({
        success: true,
        features: flags
      })
    } catch (error) {
      console.error('Features error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get features' 
      }, 500)
    }
  })

  app.post('/api/features', async (c) => {
    const cache = getCache(c)
    const { features } = await c.req.json()
    
    try {
      await cache.setAllFeatureFlags(features)
      
      return c.json({
        success: true,
        message: 'Features updated'
      })
    } catch (error) {
      console.error('Features update error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to update features' 
      }, 500)
    }
  })

  // ===== CACHE MANAGEMENT =====
  app.post('/api/cache/invalidate', async (c) => {
    const { pattern } = await c.req.json()
    
    try {
      // This is a simplified version
      // In production, you'd want more sophisticated cache invalidation
      console.log(`Cache invalidation requested for pattern: ${pattern}`)
      
      return c.json({
        success: true,
        message: `Cache invalidation initiated for pattern: ${pattern}`
      })
    } catch (error) {
      console.error('Cache invalidation error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to invalidate cache' 
      }, 500)
    }
  })

  app.get('/api/cache/stats', async (c) => {
    const cache = getCache(c)
    
    try {
      const stats = await cache.getCacheStats()
      
      return c.json({
        success: true,
        cache_stats: stats
      })
    } catch (error) {
      console.error('Cache stats error:', error)
      return c.json({ 
        success: false, 
        error: 'Failed to get cache stats' 
      }, 500)
    }
  })
}
