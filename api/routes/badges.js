/**
 * Badges Routes pour UGC Maroc
 * API endpoints pour la gestion des badges
 */

import express from 'express';
import badgesService from '../services/badges.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

/**
 * GET /api/badges/user/:userId
 * Obtenir les badges d'un utilisateur
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await badgesService.getUserBadges(userId);

    if (result.success) {
      res.json({
        success: true,
        badges: result.badges,
        count: result.badges.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get user badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user badges',
      error: error.message
    });
  }
});

/**
 * POST /api/badges/award
 * Attribuer un badge à un utilisateur (admin)
 */
router.post('/award', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, badgeType, metadata = {} } = req.body;

    if (!userId || !badgeType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and badge type are required'
      });
    }

    const result = await badgesService.awardBadge(userId, badgeType, metadata);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Badge awarded successfully',
        badge: result.badge
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Award badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award badge',
      error: error.message
    });
  }
});

/**
 * DELETE /api/badges/revoke
 * Retirer un badge d'un utilisateur (admin)
 */
router.delete('/revoke', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, badgeType, reason = '' } = req.body;

    if (!userId || !badgeType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and badge type are required'
      });
    }

    const result = await badgesService.revokeBadge(userId, badgeType, reason);

    if (result.success) {
      res.json({
        success: true,
        message: 'Badge revoked successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Revoke badge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke badge',
      error: error.message
    });
  }
});

/**
 * POST /api/badges/check/:userId
 * Vérifier et attribuer automatiquement des badges
 */
router.post('/check/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await badgesService.checkAndAwardBadges(userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Badge check completed',
        awardedBadges: result.awardedBadges,
        count: result.count
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Check badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check badges',
      error: error.message
    });
  }
});

/**
 * GET /api/badges/all
 * Obtenir tous les badges disponibles
 */
router.get('/all', async (req, res) => {
  try {
    const result = await badgesService.getAllBadges();

    if (result.success) {
      res.json({
        success: true,
        badges: result.badges,
        count: result.badges.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get all badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get all badges',
      error: error.message
    });
  }
});

/**
 * GET /api/badges/stats
 * Obtenir les statistiques des badges
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await badgesService.getBadgeStats();

    if (result.success) {
      res.json({
        success: true,
        stats: result.stats,
        total: result.total,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get badge stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get badge stats',
      error: error.message
    });
  }
});

/**
 * GET /api/badges/top-holders
 * Obtenir les utilisateurs avec le plus de badges
 */
router.get('/top-holders', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await badgesService.getTopBadgeHolders(parseInt(limit));

    if (result.success) {
      res.json({
        success: true,
        holders: result.holders,
        count: result.holders.length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get top badge holders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top badge holders',
      error: error.message
    });
  }
});

/**
 * POST /api/badges/bulk-award
 * Attribuer des badges en masse (admin)
 */
router.post('/bulk-award', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userIds, badgeType, metadata = {} } = req.body;

    if (!userIds || !Array.isArray(userIds) || !badgeType) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array and badge type are required'
      });
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const result = await badgesService.awardBadge(userId, badgeType, metadata);
        results.push({ userId, success: result.success, badge: result.badge });
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Bulk award completed',
      results: results,
      errors: errors,
      totalProcessed: userIds.length,
      successful: results.filter(r => r.success).length,
      failed: errors.length
    });
  } catch (error) {
    console.error('❌ Bulk award badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk award badges',
      error: error.message
    });
  }
});

/**
 * GET /api/badges/search
 * Rechercher des badges par critères
 */
router.get('/search', async (req, res) => {
  try {
    const { 
      badgeType, 
      userId, 
      isActive = true, 
      limit = 20, 
      offset = 0 
    } = req.query;

    // TODO: Implémenter la recherche de badges
    res.json({
      success: true,
      message: 'Badge search not implemented yet',
      filters: {
        badgeType,
        userId,
        isActive,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Search badges error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search badges',
      error: error.message
    });
  }
});

export default router;
