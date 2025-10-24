import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://arfmvtfkibjadxwnbqjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service de gestion des cookies pour UGC Maroc
 * Gère les consentements RGPD, l'authentification persistante, et les préférences
 */
class CookieService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'ugc-maroc-secret-key';
    this.cookieExpiry = {
      auth: 30, // jours
      preferences: 365, // jours
      analytics: 395, // 13 mois
      marketing: 90 // jours
    };
  }

  /**
   * Créer un cookie d'authentification sécurisé
   * @param {string} userId - ID de l'utilisateur
   * @param {boolean} rememberMe - Si true, cookie valide 30 jours
   * @returns {Object} Cookie options et token
   */
  createAuthCookie(userId, rememberMe = false) {
    try {
      const expiresIn = rememberMe ? '30d' : '24h';
      const token = jwt.sign(
        { 
          userId, 
          type: 'auth',
          rememberMe,
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 jours ou 24h
        path: '/'
      };

      return {
        success: true,
        token,
        cookieOptions,
        expiresIn: rememberMe ? '30 days' : '24 hours'
      };
    } catch (error) {
      console.error('❌ Error creating auth cookie:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Créer un cookie de préférences utilisateur
   * @param {Object} preferences - Préférences utilisateur
   * @returns {Object} Cookie options et données
   */
  createPreferencesCookie(preferences) {
    try {
      const cookieData = {
        language: preferences.language || 'ar',
        theme: preferences.theme || 'light',
        notifications: preferences.notifications || true,
        autoSave: preferences.autoSave || true,
        timestamp: Date.now()
      };

      const cookieOptions = {
        httpOnly: false, // Accessible par JS pour les préférences UI
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: this.cookieExpiry.preferences * 24 * 60 * 60 * 1000,
        path: '/'
      };

      return {
        success: true,
        data: cookieData,
        cookieOptions
      };
    } catch (error) {
      console.error('❌ Error creating preferences cookie:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Valider un cookie d'authentification
   * @param {string} token - Token JWT
   * @returns {Object} Résultat de validation
   */
  async validateCookie(token) {
    try {
      if (!token) {
        return { success: false, error: 'No token provided' };
      }

      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (decoded.type !== 'auth') {
        return { success: false, error: 'Invalid token type' };
      }

      // Vérifier que l'utilisateur existe toujours
      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, email, role, status')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return { success: false, error: 'User not found' };
      }

      if (user.status !== 'active') {
        return { success: false, error: 'User account inactive' };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        rememberMe: decoded.rememberMe
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { success: false, error: 'Token expired' };
      }
      if (error.name === 'JsonWebTokenError') {
        return { success: false, error: 'Invalid token' };
      }
      
      console.error('❌ Error validating cookie:', error);
      return { success: false, error: 'Token validation failed' };
    }
  }

  /**
   * Enregistrer le consentement RGPD d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} consent - Objet de consentement
   * @param {string} ipAddress - Adresse IP
   * @param {string} userAgent - User Agent
   * @returns {Object} Résultat de l'enregistrement
   */
  async saveConsent(userId, consent, ipAddress, userAgent) {
    try {
      const consentData = {
        user_id: userId,
        essential: true, // Toujours true
        functional: consent.functional || false,
        analytics: consent.analytics || false,
        marketing: consent.marketing || false,
        ip_address: ipAddress,
        user_agent: userAgent,
        consent_date: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      // Vérifier si un consentement existe déjà
      const { data: existingConsent } = await supabase
        .from('cookie_consents')
        .select('id')
        .eq('user_id', userId)
        .single();

      let result;
      if (existingConsent) {
        // Mettre à jour le consentement existant
        result = await supabase
          .from('cookie_consents')
          .update({
            functional: consentData.functional,
            analytics: consentData.analytics,
            marketing: consentData.marketing,
            ip_address: consentData.ip_address,
            user_agent: consentData.user_agent,
            last_updated: consentData.last_updated
          })
          .eq('user_id', userId);
      } else {
        // Créer un nouveau consentement
        result = await supabase
          .from('cookie_consents')
          .insert(consentData);
      }

      if (result.error) {
        throw result.error;
      }

      console.log(`✅ Consent saved for user ${userId}:`, consentData);
      
      return {
        success: true,
        consent: consentData
      };
    } catch (error) {
      console.error('❌ Error saving consent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Récupérer le consentement d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} Consentement de l'utilisateur
   */
  async getConsent(userId) {
    try {
      const { data: consent, error } = await supabase
        .from('cookie_consents')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // Consentement par défaut si aucun n'existe
      const defaultConsent = {
        essential: true,
        functional: true, // Pré-coché selon Option B+
        analytics: true,  // Pré-coché selon Option B+
        marketing: false  // Opt-in selon Option B+
      };

      return {
        success: true,
        consent: consent || defaultConsent
      };
    } catch (error) {
      console.error('❌ Error getting consent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Révoquer le consentement pour un type de cookie
   * @param {string} userId - ID de l'utilisateur
   * @param {string} cookieType - Type de cookie à révoquer
   * @returns {Object} Résultat de la révocation
   */
  async revokeConsent(userId, cookieType) {
    try {
      if (cookieType === 'essential') {
        return {
          success: false,
          error: 'Cannot revoke essential cookies'
        };
      }

      const updateData = {
        [cookieType]: false,
        last_updated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('cookie_consents')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      console.log(`✅ Consent revoked for user ${userId}, type: ${cookieType}`);
      
      return {
        success: true,
        revoked: cookieType
      };
    } catch (error) {
      console.error('❌ Error revoking consent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Nettoyer les cookies expirés (cron job)
   * @returns {Object} Résultat du nettoyage
   */
  async cleanExpiredCookies() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Supprimer les consentements de plus de 30 jours sans activité
      const { error } = await supabase
        .from('cookie_consents')
        .delete()
        .lt('last_updated', thirtyDaysAgo.toISOString());

      if (error) {
        throw error;
      }

      console.log('✅ Expired cookies cleaned');
      
      return {
        success: true,
        cleanedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error cleaning expired cookies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer un hash sécurisé pour les cookies
   * @param {string} data - Données à hasher
   * @returns {string} Hash sécurisé
   */
  generateSecureHash(data) {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest('hex');
  }

  /**
   * Vérifier l'intégrité d'un cookie
   * @param {string} cookieValue - Valeur du cookie
   * @param {string} hash - Hash attendu
   * @returns {boolean} True si valide
   */
  verifyCookieIntegrity(cookieValue, hash) {
    const crypto = require('crypto');
    const expectedHash = this.generateSecureHash(cookieValue);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  }
}

export default new CookieService();
