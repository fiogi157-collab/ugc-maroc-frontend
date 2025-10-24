import { Auth } from '@auth/core'
import Credentials from '@auth/core/providers/credentials'
import { D1Adapter } from '@auth/d1-adapter'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface AuthConfig {
  DB: D1Database
  JWT_SECRET: string
}

export function createAuthHandler(env: AuthConfig) {
  return Auth({
    providers: [
      Credentials({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          try {
            // Rechercher l'utilisateur dans D1
            const user = await env.DB.prepare(
              'SELECT * FROM profiles WHERE email = ?'
            ).bind(credentials.email).first()

            if (!user) {
              return null
            }

            // Vérifier le mot de passe (hashé avec bcrypt)
            const isValid = await bcrypt.compare(credentials.password, user.password_hash)
            
            if (!isValid) {
              return null
            }

            return {
              id: user.id,
              email: user.email,
              name: user.full_name,
              role: user.role,
              image: user.avatar_url
            }
          } catch (error) {
            console.error('Auth error:', error)
            return null
          }
        }
      })
    ],
    adapter: D1Adapter(env.DB),
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
      secret: env.JWT_SECRET,
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = user.role
        }
        return token
      },
      async session({ session, token }) {
        if (token) {
          session.user.id = token.sub
          session.user.role = token.role
        }
        return session
      }
    },
    pages: {
      signIn: '/auth/login',
      signUp: '/auth/register',
    }
  })
}

// Helper pour hasher les mots de passe
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

// Helper pour générer un JWT
export function generateJWT(payload: any, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: '30d' })
}

// Helper pour vérifier un JWT
export function verifyJWT(token: string, secret: string): any {
  return jwt.verify(token, secret)
}
