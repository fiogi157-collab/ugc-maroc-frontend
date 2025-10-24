/**
 * Rate Limiting Middleware
 * UGC Maroc - Protection contre spam et attaques DDoS
 */

import rateLimit from 'express-rate-limit';

// Configuration générale
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      console.warn(`🚨 Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Limites par type d'endpoint
export const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 tentatives max
  'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  true
);

export const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requêtes max
  'Trop de requêtes. Réessayez dans 15 minutes.'
);

export const uploadLimiter = createRateLimit(
  60 * 60 * 1000, // 1 heure
  10, // 10 uploads max
  'Limite d\'upload atteinte. Réessayez dans 1 heure.'
);

export const paymentLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  3, // 3 tentatives de paiement max
  'Trop de tentatives de paiement. Réessayez dans 5 minutes.',
  true
);

export const emailLimiter = createRateLimit(
  60 * 60 * 1000, // 1 heure
  20, // 20 emails max
  'Limite d\'envoi d\'emails atteinte. Réessayez dans 1 heure.'
);

export const aiLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 requêtes AI max
  'Limite de requêtes AI atteinte. Réessayez dans 1 minute.'
);

// Limite stricte pour les endpoints sensibles
export const strictLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  5, // 5 requêtes max
  'Trop de requêtes sur cet endpoint sensible. Réessayez dans 5 minutes.'
);

// Limite pour les endpoints publics (plus permissive)
export const publicLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requêtes max
  'Trop de requêtes. Réessayez dans 15 minutes.'
);

// Fonction pour whitelist les admins
export const createAdminWhitelist = (adminIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Whitelist IPs admin
    if (adminIPs.includes(clientIP)) {
      return next();
    }
    
    // Whitelist utilisateurs admin connectés
    const userRole = req.user?.role || req.headers['x-user-role'];
    if (userRole === 'admin') {
      return next();
    }
    
    // Appliquer rate limiting normal
    return next();
  };
};

// Configuration par défaut
export const defaultLimiter = apiLimiter;

export default {
  authLimiter,
  apiLimiter,
  uploadLimiter,
  paymentLimiter,
  emailLimiter,
  aiLimiter,
  strictLimiter,
  publicLimiter,
  createAdminWhitelist,
  defaultLimiter
};
