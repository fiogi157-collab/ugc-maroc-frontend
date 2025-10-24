/**
 * Reviews Routes pour UGC Maroc
 * API endpoints pour le système de notation et badges
 */

import express from 'express';
import reviewsService from '../services/reviews.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { validateRequest } from '../middleware/validation.js';
import { reviewSchema } from '../middleware/validation.js';

const router = express.Router();

/**
 * POST /api/reviews
 * Créer une nouvelle review
 */
router.post('/', authMiddleware, validateRequest(reviewSchema), async (req, res) => {
  try {
    const {
      revieweeId,
      orderId,
      campaignId,
      gigId,
      rating,
      title,
      comment,
      qualityRating,
      communicationRating,
      deliveryRating,
      valueRating,
      isPublic
    } = req.body;

    const reviewerId = req.user.userId || req.user.id;

    const result = await reviewsService.createReview({
      reviewerId,
      revieweeId,
      orderId,
      campaignId,
      gigId,
      rating,
      title,
      comment,
      qualityRating,
      communicationRating,
      deliveryRating,
      valueRating,
      isPublic
    });

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        review: result.review
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error.message
    });
  }
});

/**
 * GET /api/reviews/user/:userId
 * Obtenir les reviews d'un utilisateur
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    const result = await reviewsService.getUserReviews(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    if (result.success) {
      res.json({
        success: true,
        reviews: result.reviews,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user reviews',
      error: error.message
    });
  }
});

/**
 * GET /api/reviews/user/:userId/stats
 * Obtenir les statistiques de reviews d'un utilisateur
 */
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await reviewsService.getUserStats(userId);

    if (result.success) {
      res.json({
        success: true,
        stats: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: error.message
    });
  }
});

/**
 * GET /api/reviews/user/:userId/badges
 * Obtenir les badges d'un utilisateur
 */
router.get('/user/:userId/badges', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await reviewsService.getUserBadges(userId);

    if (result.success) {
      res.json({
        success: true,
        badges: result.badges
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
 * PUT /api/reviews/:reviewId
 * Mettre à jour une review
 */
router.put('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const updateData = req.body;
    const userId = req.user.userId || req.user.id;

    const result = await reviewsService.updateReview(reviewId, updateData, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Review updated successfully',
        review: result.review
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
});

/**
 * DELETE /api/reviews/:reviewId
 * Supprimer une review
 */
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId || req.user.id;

    const result = await reviewsService.deleteReview(reviewId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
});

/**
 * POST /api/reviews/:reviewId/report
 * Signaler une review
 */
router.post('/:reviewId/report', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.userId || req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    const result = await reviewsService.reportReview(reviewId, reporterId, reason, description);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: 'Review reported successfully',
        report: result.report
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message
    });
  }
});

/**
 * GET /api/reviews/admin/recent
 * Obtenir les reviews récentes (admin)
 */
router.get('/admin/recent', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status = 'active' } = req.query;

    const result = await reviewsService.getRecentReviews({
      limit: parseInt(limit),
      offset: parseInt(offset),
      status
    });

    if (result.success) {
      res.json({
        success: true,
        reviews: result.reviews,
        pagination: result.pagination
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get recent reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent reviews',
      error: error.message
    });
  }
});

/**
 * GET /api/reviews/admin/stats
 * Obtenir les statistiques globales (admin)
 */
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await reviewsService.getGlobalStats();

    if (result.success) {
      res.json({
        success: true,
        stats: result.stats
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get global stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get global stats',
      error: error.message
    });
  }
});

/**
 * POST /api/reviews/admin/:reviewId/feature
 * Mettre en avant une review (admin)
 */
router.post('/admin/:reviewId/feature', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isFeatured } = req.body;

    // TODO: Implémenter la logique de mise en avant
    res.json({
      success: true,
      message: 'Review featured status updated',
      reviewId,
      isFeatured
    });
  } catch (error) {
    console.error('❌ Feature review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to feature review',
      error: error.message
    });
  }
});

/**
 * POST /api/reviews/admin/:reviewId/verify
 * Vérifier une review (admin)
 */
router.post('/admin/:reviewId/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isVerified } = req.body;

    // TODO: Implémenter la logique de vérification
    res.json({
      success: true,
      message: 'Review verification status updated',
      reviewId,
      isVerified
    });
  } catch (error) {
    console.error('❌ Verify review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify review',
      error: error.message
    });
  }
});

export default router;
