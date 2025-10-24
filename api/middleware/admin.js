/**
 * Admin Middleware pour UGC Maroc
 * Vérification des permissions administrateur
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware pour vérifier les permissions administrateur
 */
export const adminMiddleware = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Vérifier le rôle administrateur dans la base de données
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Admin check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify admin permissions'
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Vérifier si l'utilisateur est administrateur
    if (profile.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin permissions required',
        userRole: profile.role
      });
    }

    // Ajouter les informations admin au request
    req.admin = {
      userId: userId,
      role: profile.role,
      permissions: ['backup', 'restore', 'monitoring', 'analytics']
    };

    next();

  } catch (error) {
    console.error('❌ Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin verification failed',
      error: error.message
    });
  }
};

/**
 * Middleware pour vérifier les permissions super-admin
 */
export const superAdminMiddleware = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Vérifier le rôle super-admin dans la base de données
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Super admin check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify super admin permissions'
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Vérifier si l'utilisateur est super-admin
    if (profile.role !== 'admin' || !profile.is_super_admin) {
      return res.status(403).json({
        success: false,
        message: 'Super admin permissions required',
        userRole: profile.role,
        isSuperAdmin: profile.is_super_admin
      });
    }

    // Ajouter les informations super-admin au request
    req.superAdmin = {
      userId: userId,
      role: profile.role,
      isSuperAdmin: true,
      permissions: ['backup', 'restore', 'monitoring', 'analytics', 'system', 'users', 'billing']
    };

    next();

  } catch (error) {
    console.error('❌ Super admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Super admin verification failed',
      error: error.message
    });
  }
};

/**
 * Middleware pour vérifier les permissions de modération
 */
export const moderatorMiddleware = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user.userId || req.user.id;

    // Vérifier le rôle dans la base de données
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_moderator')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Moderator check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify moderator permissions'
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Vérifier si l'utilisateur est admin ou modérateur
    if (profile.role !== 'admin' && !profile.is_moderator) {
      return res.status(403).json({
        success: false,
        message: 'Moderator permissions required',
        userRole: profile.role,
        isModerator: profile.is_moderator
      });
    }

    // Ajouter les informations modérateur au request
    req.moderator = {
      userId: userId,
      role: profile.role,
      isModerator: profile.is_moderator,
      permissions: ['moderate', 'review', 'approve', 'reject']
    };

    next();

  } catch (error) {
    console.error('❌ Moderator middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Moderator verification failed',
      error: error.message
    });
  }
};

export default {
  adminMiddleware,
  superAdminMiddleware,
  moderatorMiddleware
};
