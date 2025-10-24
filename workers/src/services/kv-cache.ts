// KV Cache service for UGC Maroc
export class KVCacheService {
  private kv: KVNamespace

  constructor(kv: KVNamespace) {
    this.kv = kv
  }

  // ===== SESSION CACHE =====
  async cacheUserSession(userId: string, userData: any, ttl: number = 3600) {
    const key = `session:${userId}`
    await this.kv.put(key, JSON.stringify(userData), { expirationTtl: ttl })
  }

  async getUserSession(userId: string) {
    const key = `session:${userId}`
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  async invalidateUserSession(userId: string) {
    const key = `session:${userId}`
    await this.kv.delete(key)
  }

  // ===== CAMPAIGNS CACHE =====
  async cacheCampaigns(campaigns: any[], ttl: number = 300) {
    const key = 'campaigns:active'
    await this.kv.put(key, JSON.stringify(campaigns), { expirationTtl: ttl })
  }

  async getCachedCampaigns() {
    const key = 'campaigns:active'
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  async cacheCampaign(campaignId: string, campaign: any, ttl: number = 3600) {
    const key = `campaign:${campaignId}`
    await this.kv.put(key, JSON.stringify(campaign), { expirationTtl: ttl })
  }

  async getCachedCampaign(campaignId: string) {
    const key = `campaign:${campaignId}`
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  async invalidateCampaign(campaignId: string) {
    const key = `campaign:${campaignId}`
    await this.kv.delete(key)
  }

  // ===== GIGS CACHE =====
  async cacheGigs(gigs: any[], ttl: number = 300) {
    const key = 'gigs:active'
    await this.kv.put(key, JSON.stringify(gigs), { expirationTtl: ttl })
  }

  async getCachedGigs() {
    const key = 'gigs:active'
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  async cacheGig(gigId: string, gig: any, ttl: number = 3600) {
    const key = `gig:${gigId}`
    await this.kv.put(key, JSON.stringify(gig), { expirationTtl: ttl })
  }

  async getCachedGig(gigId: string) {
    const key = `gig:${gigId}`
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  // ===== CREATORS CACHE =====
  async cacheCreator(creatorId: string, creator: any, ttl: number = 3600) {
    const key = `creator:${creatorId}`
    await this.kv.put(key, JSON.stringify(creator), { expirationTtl: ttl })
  }

  async getCachedCreator(creatorId: string) {
    const key = `creator:${creatorId}`
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  async cacheTopCreators(creators: any[], ttl: number = 1800) {
    const key = 'creators:top'
    await this.kv.put(key, JSON.stringify(creators), { expirationTtl: ttl })
  }

  async getCachedTopCreators() {
    const key = 'creators:top'
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  // ===== RATE LIMITING =====
  async checkRateLimit(clientId: string, endpoint: string, limit: number = 100, window: number = 60) {
    const key = `ratelimit:${clientId}:${endpoint}`
    const current = await this.kv.get(key)
    const count = current ? parseInt(current) : 0

    if (count >= limit) {
      return { allowed: false, remaining: 0, resetTime: Date.now() + (window * 1000) }
    }

    await this.kv.put(key, String(count + 1), { expirationTtl: window })
    return { allowed: true, remaining: limit - count - 1, resetTime: Date.now() + (window * 1000) }
  }

  // ===== SEARCH CACHE =====
  async cacheSearchResults(queryHash: string, results: any[], ttl: number = 300) {
    const key = `search:${queryHash}`
    await this.kv.put(key, JSON.stringify(results), { expirationTtl: ttl })
  }

  async getCachedSearchResults(queryHash: string) {
    const key = `search:${queryHash}`
    const cached = await this.kv.get(key, 'json')
    return cached
  }

  // ===== ANALYTICS =====
  async incrementCounter(counterName: string, value: number = 1) {
    const key = `analytics:${counterName}`
    const current = await this.kv.get(key)
    const count = current ? parseInt(current) : 0
    await this.kv.put(key, String(count + value))
  }

  async getCounter(counterName: string) {
    const key = `analytics:${counterName}`
    const value = await this.kv.get(key)
    return value ? parseInt(value) : 0
  }

  // ===== FEATURE FLAGS =====
  async setFeatureFlag(flagName: string, enabled: boolean) {
    const key = `feature:${flagName}`
    await this.kv.put(key, JSON.stringify({ enabled, updated_at: Date.now() }))
  }

  async getFeatureFlag(flagName: string) {
    const key = `feature:${flagName}`
    const cached = await this.kv.get(key, 'json')
    return cached?.enabled || false
  }

  async getAllFeatureFlags() {
    const key = 'features:all'
    const cached = await this.kv.get(key, 'json')
    return cached || {}
  }

  async setAllFeatureFlags(flags: Record<string, boolean>) {
    const key = 'features:all'
    await this.kv.put(key, JSON.stringify(flags))
  }

  // ===== CACHE INVALIDATION =====
  async invalidatePattern(pattern: string) {
    // Note: KV doesn't support pattern deletion, so we need to track keys
    // This is a simplified version - in production, you'd want a more sophisticated approach
    console.log(`Would invalidate pattern: ${pattern}`)
  }

  async clearAllCache() {
    // Note: KV doesn't support bulk deletion
    // This would require tracking all keys or using a different approach
    console.log('Would clear all cache')
  }

  // ===== CACHE STATS =====
  async getCacheStats() {
    // This would require additional tracking
    return {
      total_keys: 'N/A - KV doesn\'t provide key listing',
      memory_usage: 'N/A - KV doesn\'t provide usage stats'
    }
  }
}

// Helper function to create hash for search queries
export async function createSearchHash(params: any): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(params))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Helper function to get client ID for rate limiting
export function getClientId(request: Request): string {
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             request.headers.get('X-Real-IP') || 
             'unknown'
  return ip
}
