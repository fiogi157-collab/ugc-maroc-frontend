import { Hono } from 'hono'
import { KVCacheService } from '../services/kv-cache.js'

// Hash functions compatible with Cloudflare Workers
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  const hashedPassword = await hashPassword(password)
  return hashedPassword === hash
}

// Simple JWT implementation for Workers
function createJWT(payload: any, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const signature = btoa(secret + encodedHeader + encodedPayload) // Simplified
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

function verifyJWT(token: string, secret: string): any {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token')
  
  const [header, payload, signature] = parts
  const expectedSignature = btoa(secret + header + payload)
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid signature')
  }
  
  return JSON.parse(atob(payload))
}

export function createAuthRoutes(app: Hono) {

  // Route de connexion personnalisée
  app.post('/api/auth/login', async (c) => {
    try {
      const { email, password } = await c.req.json()
      
      if (!email || !password) {
        return c.json({ 
          success: false, 
          error: 'Email et mot de passe requis' 
        }, 400)
      }

      // Rechercher l'utilisateur
      const user = await c.env.DB.prepare(
        'SELECT * FROM profiles WHERE email = ?'
      ).bind(email).first()

      if (!user) {
        return c.json({ 
          success: false, 
          error: 'Utilisateur non trouvé' 
        }, 404)
      }

      // Vérifier le mot de passe
      const isValid = await comparePassword(password, user.password_hash)
      
      if (!isValid) {
        return c.json({ 
          success: false, 
          error: 'Mot de passe incorrect' 
        }, 401)
      }

      // Générer JWT
      const token = createJWT({
        sub: user.id,
        email: user.email,
        role: user.role
      }, c.env.JWT_SECRET)

      // Cache user session
      const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
      const userData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url
      }
      await cache.cacheUserSession(user.id, userData)

      return c.json({
        success: true,
        user: userData,
        token
      })

    } catch (error) {
      console.error('Login error:', error)
      return c.json({ 
        success: false, 
        error: 'Erreur serveur' 
      }, 500)
    }
  })

  // Route d'inscription
  app.post('/api/auth/register', async (c) => {
    try {
      const { email, password, full_name, role, phone } = await c.req.json()
      
      if (!email || !password || !full_name || !role) {
        return c.json({ 
          success: false, 
          error: 'Tous les champs sont requis' 
        }, 400)
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM profiles WHERE email = ?'
      ).bind(email).first()

      if (existingUser) {
        return c.json({ 
          success: false, 
          error: 'Cet email est déjà utilisé' 
        }, 409)
      }

      // Hasher le mot de passe
      const hashedPassword = await hashPassword(password)
      
      // Générer un UUID pour l'utilisateur
      const userId = crypto.randomUUID()

      // Créer l'utilisateur
      const result = await c.env.DB.prepare(`
        INSERT INTO profiles (id, email, full_name, role, phone, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        email,
        full_name,
        role,
        phone || null,
        hashedPassword,
        Date.now(),
        Date.now()
      ).run()

      if (!result.success) {
        return c.json({ 
          success: false, 
          error: 'Erreur lors de la création du compte' 
        }, 500)
      }

      // Créer le wallet pour l'utilisateur
      await c.env.DB.prepare(`
        INSERT INTO wallets (user_id, balance, pending_balance, currency, created_at, updated_at)
        VALUES (?, 0.0, 0.0, 'MAD', ?, ?)
      `).bind(userId, Date.now(), Date.now()).run()

      // Créer le profil étendu selon le rôle
      if (role === 'creator') {
        await c.env.DB.prepare(`
          INSERT INTO creators (user_id, specialization, created_at, updated_at)
          VALUES (?, 'lifestyle', ?, ?)
        `).bind(userId, Date.now(), Date.now()).run()
      } else if (role === 'brand') {
        await c.env.DB.prepare(`
          INSERT INTO brands (user_id, company_name, created_at, updated_at)
          VALUES (?, ?, ?, ?)
        `).bind(userId, full_name, Date.now(), Date.now()).run()
      }

      // Générer JWT
      const token = createJWT({
        sub: userId,
        email,
        role
      }, c.env.JWT_SECRET)

      // Cache user session
      const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
      const userData = {
        id: userId,
        email,
        full_name,
        role
      }
      await cache.cacheUserSession(userId, userData)

      return c.json({
        success: true,
        message: 'Compte créé avec succès',
        user: userData,
        token
      })

    } catch (error) {
      console.error('Register error:', error)
      return c.json({ 
        success: false, 
        error: 'Erreur serveur' 
      }, 500)
    }
  })

  // Route de déconnexion
  app.post('/api/auth/logout', async (c) => {
    try {
      const authHeader = c.req.header('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const decoded = verifyJWT(token, c.env.JWT_SECRET)
        
        // Invalider le cache de session
        const cache = new KVCacheService(c.env.UGC_MAROC_CACHE)
        await cache.invalidateUserSession(decoded.sub)
      }
      
      return c.json({
        success: true,
        message: 'Déconnexion réussie'
      })
    } catch (error) {
      console.error('Logout error:', error)
      return c.json({
        success: true,
        message: 'Déconnexion réussie'
      })
    }
  })

  // Route pour vérifier le token
  app.get('/api/auth/me', async (c) => {
    try {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ 
          success: false, 
          error: 'Token manquant' 
        }, 401)
      }

      const token = authHeader.substring(7)
      const decoded = verifyJWT(token, c.env.JWT_SECRET)

      // Récupérer les infos utilisateur
      const user = await c.env.DB.prepare(
        'SELECT id, email, full_name, role, avatar_url FROM profiles WHERE id = ?'
      ).bind(decoded.sub).first()

      if (!user) {
        return c.json({ 
          success: false, 
          error: 'Utilisateur non trouvé' 
        }, 404)
      }

      return c.json({
        success: true,
        user
      })

    } catch (error) {
      console.error('Auth me error:', error)
      return c.json({ 
        success: false, 
        error: 'Token invalide' 
      }, 401)
    }
  })
}
