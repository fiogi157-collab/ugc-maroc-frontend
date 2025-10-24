import express from 'express';
import cookieService from '../services/cookies.js';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://arfmvtfkibjadxwnbqjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const router = express.Router();

/**
 * Routes pour la gestion des cookies et consentements RGPD
 */

/**
 * POST /api/cookies/consent
 * Enregistrer le consentement RGPD d'un utilisateur
 */
router.post('/consent', async (req, res) => {
  try {
    const { 
      userId, 
      essential = true, 
      functional = true, 
      analytics = true, 
      marketing = false 
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const consent = {
      essential,
      functional,
      analytics,
      marketing
    };

    const result = await cookieService.saveConsent(userId, consent, ipAddress, userAgent);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save consent',
        error: result.error
      });
    }

    console.log(`✅ Consent saved for user ${userId}:`, consent);

    return res.status(200).json({
      success: true,
      message: 'Consent saved successfully',
      consent: result.consent
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/consent:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/cookies/preferences/:userId
 * Récupérer les préférences d'un utilisateur
 */
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Récupérer les préférences depuis la base de données
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Préférences par défaut si aucune n'existe
    const defaultPreferences = {
      language: 'ar',
      theme: 'light',
      notifications: true,
      autoSave: true,
      emailNotifications: true,
      pushNotifications: false
    };

    return res.status(200).json({
      success: true,
      preferences: preferences || defaultPreferences
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message
    });
  }
});

/**
 * PUT /api/cookies/preferences/:userId
 * Mettre à jour les préférences d'un utilisateur
 */
router.put('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const preferencesData = {
      user_id: userId,
      language: preferences.language || 'ar',
      theme: preferences.theme || 'light',
      notifications: preferences.notifications !== undefined ? preferences.notifications : true,
      autoSave: preferences.autoSave !== undefined ? preferences.autoSave : true,
      emailNotifications: preferences.emailNotifications !== undefined ? preferences.emailNotifications : true,
      pushNotifications: preferences.pushNotifications !== undefined ? preferences.pushNotifications : false,
      updated_at: new Date().toISOString()
    };

    // Vérifier si des préférences existent déjà
    const { data: existingPreferences } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingPreferences) {
      // Mettre à jour les préférences existantes
      result = await supabase
        .from('user_preferences')
        .update(preferencesData)
        .eq('user_id', userId);
    } else {
      // Créer de nouvelles préférences
      result = await supabase
        .from('user_preferences')
        .insert(preferencesData);
    }

    if (result.error) {
      throw result.error;
    }

    console.log(`✅ Preferences updated for user ${userId}:`, preferencesData);

    return res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: preferencesData
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/preferences PUT:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

/**
 * GET /api/cookies/consent/:userId
 * Récupérer le consentement d'un utilisateur
 */
router.get('/consent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const result = await cookieService.getConsent(userId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get consent',
        error: result.error
      });
    }

    return res.status(200).json({
      success: true,
      consent: result.consent
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/consent GET:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /api/cookies/revoke/:userId
 * Révoquer le consentement pour un type de cookie
 */
router.delete('/revoke/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { cookieType } = req.body;

    if (!userId || !cookieType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and cookie type are required'
      });
    }

    const result = await cookieService.revokeConsent(userId, cookieType);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    console.log(`✅ Consent revoked for user ${userId}, type: ${cookieType}`);

    return res.status(200).json({
      success: true,
      message: `Consent revoked for ${cookieType}`,
      revoked: result.revoked
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/revoke:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/cookies/status
 * Vérifier le statut de consentement (pour utilisateur anonyme)
 */
router.get('/status', async (req, res) => {
  try {
    // Pour les utilisateurs non connectés, retourner les valeurs par défaut
    const defaultStatus = {
      essential: true,
      functional: true,  // Pré-coché selon Option B+
      analytics: true,   // Pré-coché selon Option B+
      marketing: false   // Opt-in selon Option B+
    };

    return res.status(200).json({
      success: true,
      consent: defaultStatus,
      message: 'Default consent status for anonymous users'
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/cookies/validate-auth
 * Valider un cookie d'authentification
 */
router.post('/validate-auth', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const result = await cookieService.validateCookie(token);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      user: result.user,
      rememberMe: result.rememberMe
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/validate-auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/cookies/cleanup
 * Nettoyer les cookies expirés (endpoint admin)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const result = await cookieService.cleanExpiredCookies();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to clean expired cookies',
        error: result.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Expired cookies cleaned successfully',
      cleanedAt: result.cleanedAt
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/cleanup:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/cookies/analytics/:userId
 * Récupérer les données analytics d'un utilisateur (pour dashboard)
 */
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Récupérer les événements analytics de l'utilisateur
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    // Statistiques basiques
    const stats = {
      totalEvents: events.length,
      lastActivity: events[0]?.created_at || null,
      eventTypes: {}
    };

    events.forEach(event => {
      stats.eventTypes[event.event_type] = (stats.eventTypes[event.event_type] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      analytics: {
        events,
        stats
      }
    });

  } catch (error) {
    console.error('❌ Error in /api/cookies/analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get analytics data',
      error: error.message
    });
  }
});

export default router;
