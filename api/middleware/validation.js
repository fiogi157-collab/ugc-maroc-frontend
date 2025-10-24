/**
 * Input Validation Middleware
 * UGC Maroc - Protection contre XSS, SQL injection et données malformées
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Schémas de validation pour les endpoints principaux

// Schéma pour l'authentification
export const authSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .max(255, 'Email trop long')
    .transform(email => email.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Mot de passe trop court (minimum 8 caractères)')
    .max(128, 'Mot de passe trop long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  role: z.enum(['creator', 'brand', 'admin']).optional(),
  rememberMe: z.boolean().optional()
});

// Schéma pour les profils utilisateur
export const profileSchema = z.object({
  fullName: z.string()
    .min(2, 'Nom trop court')
    .max(100, 'Nom trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Nom contient des caractères invalides')
    .transform(name => DOMPurify.sanitize(name.trim())),
  phone: z.string()
    .regex(/^(\+212|0)[5-7][0-9]{8}$/, 'Numéro de téléphone marocain invalide')
    .optional(),
  bio: z.string()
    .max(500, 'Bio trop longue (maximum 500 caractères)')
    .optional()
    .transform(bio => bio ? DOMPurify.sanitize(bio.trim()) : bio),
  location: z.string()
    .max(100, 'Localisation trop longue')
    .optional()
    .transform(location => location ? DOMPurify.sanitize(location.trim()) : location)
});

// Schéma pour les campagnes
export const campaignSchema = z.object({
  title: z.string()
    .min(5, 'Titre trop court (minimum 5 caractères)')
    .max(200, 'Titre trop long (maximum 200 caractères)')
    .transform(title => DOMPurify.sanitize(title.trim())),
  description: z.string()
    .min(20, 'Description trop courte (minimum 20 caractères)')
    .max(2000, 'Description trop longue (maximum 2000 caractères)')
    .transform(desc => DOMPurify.sanitize(desc.trim())),
  budget: z.number()
    .min(100, 'Budget minimum: 100 MAD')
    .max(100000, 'Budget maximum: 100,000 MAD'),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .transform(date => new Date(date))
    .refine(date => date > new Date(), 'Date limite doit être dans le futur'),
  category: z.enum(['beauty', 'fashion', 'food', 'tech', 'lifestyle', 'other']),
  requirements: z.string()
    .max(1000, 'Exigences trop longues')
    .optional()
    .transform(req => req ? DOMPurify.sanitize(req.trim()) : req)
});

// Schéma pour les gigs
export const gigSchema = z.object({
  title: z.string()
    .min(5, 'Titre trop court')
    .max(200, 'Titre trop long')
    .transform(title => DOMPurify.sanitize(title.trim())),
  description: z.string()
    .min(20, 'Description trop courte')
    .max(2000, 'Description trop longue')
    .transform(desc => DOMPurify.sanitize(desc.trim())),
  basePrice: z.number()
    .min(50, 'Prix minimum: 50 MAD')
    .max(50000, 'Prix maximum: 50,000 MAD'),
  deliveryTime: z.enum(['1', '3', '7', '14', '30']),
  category: z.enum(['video', 'photo', 'editing', 'voice', 'writing', 'other']),
  skills: z.array(z.string())
    .max(10, 'Maximum 10 compétences')
    .optional(),
  portfolio: z.array(z.string().url())
    .max(5, 'Maximum 5 liens portfolio')
    .optional()
});

// Schéma pour les messages
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message vide')
    .max(2000, 'Message trop long (maximum 2000 caractères)')
    .transform(content => DOMPurify.sanitize(content.trim())),
  conversationId: z.string().uuid('ID de conversation invalide'),
  type: z.enum(['text', 'image', 'video', 'file']).optional(),
  replyTo: z.string().uuid().optional()
});

// Schéma pour les paiements
export const paymentSchema = z.object({
  amount: z.number()
    .min(10, 'Montant minimum: 10 MAD')
    .max(100000, 'Montant maximum: 100,000 MAD'),
  currency: z.enum(['MAD', 'USD', 'EUR']).default('MAD'),
  orderId: z.string().uuid('ID de commande invalide'),
  paymentMethod: z.enum(['stripe', 'bank_transfer']),
  description: z.string()
    .max(200, 'Description trop longue')
    .optional()
    .transform(desc => desc ? DOMPurify.sanitize(desc.trim()) : desc)
});

// Schéma pour les retraits
export const withdrawalSchema = z.object({
  amount: z.number()
    .min(200, 'Montant minimum de retrait: 200 MAD')
    .max(50000, 'Montant maximum de retrait: 50,000 MAD'),
  bankAccount: z.object({
    accountNumber: z.string()
      .regex(/^[0-9]{10,20}$/, 'Numéro de compte invalide'),
    bankName: z.string()
      .min(2, 'Nom de banque invalide')
      .max(50, 'Nom de banque trop long'),
    accountHolder: z.string()
      .min(2, 'Nom du titulaire invalide')
      .max(100, 'Nom du titulaire trop long')
  })
});

// Schéma pour les reviews
export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Note minimum: 1 étoile')
    .max(5, 'Note maximum: 5 étoiles'),
  comment: z.string()
    .min(10, 'Commentaire trop court (minimum 10 caractères)')
    .max(500, 'Commentaire trop long (maximum 500 caractères)')
    .optional()
    .transform(comment => comment ? DOMPurify.sanitize(comment.trim()) : comment),
  orderId: z.string().uuid('ID de commande invalide'),
  type: z.enum(['creator_to_brand', 'brand_to_creator'])
});

// Middleware de validation générique
export const validateRequest = (schema, target = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[target];
      const validatedData = schema.parse(data);
      
      // Remplacer les données par les données validées
      req[target] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        console.warn(`❌ Validation failed for ${req.method} ${req.path}:`, errorMessages);
        
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errorMessages
        });
      }
      
      console.error('❌ Validation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erreur de validation interne'
      });
    }
  };
};

// Middleware pour sanitizer les paramètres de query
export const sanitizeQuery = (req, res, next) => {
  try {
    const sanitizedQuery = {};
    
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        sanitizedQuery[key] = DOMPurify.sanitize(value.trim());
      } else {
        sanitizedQuery[key] = value;
      }
    }
    
    req.query = sanitizedQuery;
    next();
  } catch (error) {
    console.error('❌ Query sanitization error:', error);
    next();
  }
};

// Middleware pour valider les paramètres d'URL
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Paramètres d\'URL invalides',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Schémas pour les paramètres d'URL
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID invalide')
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide')
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid('ID de commande invalide')
});

export default {
  authSchema,
  profileSchema,
  campaignSchema,
  gigSchema,
  messageSchema,
  paymentSchema,
  withdrawalSchema,
  reviewSchema,
  validateRequest,
  sanitizeQuery,
  validateParams,
  uuidParamSchema,
  userIdParamSchema,
  orderIdParamSchema
};
