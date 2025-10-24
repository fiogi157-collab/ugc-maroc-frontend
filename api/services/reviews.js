/**
 * Reviews Service pour UGC Maroc
 * Gestion du système de notation 5 étoiles et badges de confiance
 */

import { createClient } from '@supabase/supabase-js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { reviews, reviewStats, verificationBadges, reviewReports } from '../db/schema.js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service de gestion des reviews et badges
 */
class ReviewsService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Créer une nouvelle review
   */
  async createReview(reviewData) {
    try {
      const {
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
        isPublic = true
      } = reviewData;

      // Vérifier que l'utilisateur peut laisser une review
      const canReview = await this.canUserReview(reviewerId, revieweeId, orderId);
      if (!canReview.allowed) {
        return {
          success: false,
          message: canReview.reason
        };
      }

      // Créer la review
      const { data: review, error } = await this.supabase
        .from('reviews')
        .insert({
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          order_id: orderId,
          campaign_id: campaignId,
          gig_id: gigId,
          rating: rating,
          title: title,
          comment: comment,
          quality_rating: qualityRating,
          communication_rating: communicationRating,
          delivery_rating: deliveryRating,
          value_rating: valueRating,
          is_public: isPublic,
          is_verified: true, // Auto-verify for now
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Create review error:', error);
        return {
          success: false,
          message: 'Failed to create review',
          error: error.message
        };
      }

      // Recalculer les statistiques
      await this.recalculateUserStats(revieweeId);

      // Attribuer des badges automatiquement
      await this.assignBadges(revieweeId);

      console.log(`✅ Review created: ${review.id}`);

      return {
        success: true,
        review: review,
        message: 'Review created successfully'
      };

    } catch (error) {
      console.error('❌ Reviews service error:', error);
      return {
        success: false,
        message: 'Review creation failed',
        error: error.message
      };
    }
  }

  /**
   * Vérifier si un utilisateur peut laisser une review
   */
  async canUserReview(reviewerId, revieweeId, orderId) {
    try {
      // Vérifier que l'utilisateur n'a pas déjà laissé une review pour cette commande
      if (orderId) {
        const { data: existingReview } = await this.supabase
          .from('reviews')
          .select('id')
          .eq('reviewer_id', reviewerId)
          .eq('order_id', orderId)
          .single();

        if (existingReview) {
          return {
            allowed: false,
            reason: 'You have already reviewed this order'
          };
        }
      }

      // Vérifier que l'utilisateur ne se review pas lui-même
      if (reviewerId === revieweeId) {
        return {
          allowed: false,
          reason: 'You cannot review yourself'
        };
      }

      // Vérifier que la commande est terminée
      if (orderId) {
        const { data: order } = await this.supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single();

        if (!order || order.status !== 'completed') {
          return {
            allowed: false,
            reason: 'Order must be completed before reviewing'
          };
        }
      }

      return {
        allowed: true,
        reason: 'Review allowed'
      };

    } catch (error) {
      console.error('❌ Can review check error:', error);
      return {
        allowed: false,
        reason: 'Error checking review eligibility'
      };
    }
  }

  /**
   * Obtenir les reviews d'un utilisateur
   */
  async getUserReviews(userId, options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      const { data: reviews, error } = await this.supabase
        .rpc('get_user_reviews', {
          user_id_param: userId,
          limit_param: limit,
          offset_param: offset
        });

      if (error) {
        console.error('❌ Get user reviews error:', error);
        return {
          success: false,
          message: 'Failed to get reviews',
          error: error.message
        };
      }

      return {
        success: true,
        reviews: reviews || [],
        pagination: {
          limit,
          offset,
          total: reviews?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Get user reviews error:', error);
      return {
        success: false,
        message: 'Failed to get user reviews',
        error: error.message
      };
    }
  }

  /**
   * Obtenir les statistiques de reviews d'un utilisateur
   */
  async getUserStats(userId) {
    try {
      const { data: stats, error } = await this.supabase
        .rpc('get_user_review_stats', {
          user_id_param: userId
        });

      if (error) {
        console.error('❌ Get user stats error:', error);
        return {
          success: false,
          message: 'Failed to get user stats',
          error: error.message
        };
      }

      return {
        success: true,
        stats: stats?.[0] || {
          total_reviews: 0,
          average_rating: 0,
          five_star_count: 0,
          four_star_count: 0,
          three_star_count: 0,
          two_star_count: 0,
          one_star_count: 0,
          avg_quality_rating: 0,
          avg_communication_rating: 0,
          avg_delivery_rating: 0,
          avg_value_rating: 0
        }
      };

    } catch (error) {
      console.error('❌ Get user stats error:', error);
      return {
        success: false,
        message: 'Failed to get user stats',
        error: error.message
      };
    }
  }

  /**
   * Obtenir les badges d'un utilisateur
   */
  async getUserBadges(userId) {
    try {
      const { data: badges, error } = await this.supabase
        .rpc('get_user_badges', {
          user_id_param: userId
        });

      if (error) {
        console.error('❌ Get user badges error:', error);
        return {
          success: false,
          message: 'Failed to get user badges',
          error: error.message
        };
      }

      return {
        success: true,
        badges: badges || []
      };

    } catch (error) {
      console.error('❌ Get user badges error:', error);
      return {
        success: false,
        message: 'Failed to get user badges',
        error: error.message
      };
    }
  }

  /**
   * Mettre à jour une review
   */
  async updateReview(reviewId, updateData, userId) {
    try {
      // Vérifier que l'utilisateur peut modifier cette review
      const { data: review } = await this.supabase
        .from('reviews')
        .select('reviewer_id, reviewee_id')
        .eq('id', reviewId)
        .single();

      if (!review) {
        return {
          success: false,
          message: 'Review not found'
        };
      }

      if (review.reviewer_id !== userId) {
        return {
          success: false,
          message: 'You can only update your own reviews'
        };
      }

      // Mettre à jour la review
      const { data: updatedReview, error } = await this.supabase
        .from('reviews')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('❌ Update review error:', error);
        return {
          success: false,
          message: 'Failed to update review',
          error: error.message
        };
      }

      // Recalculer les statistiques
      await this.recalculateUserStats(review.reviewee_id);

      return {
        success: true,
        review: updatedReview,
        message: 'Review updated successfully'
      };

    } catch (error) {
      console.error('❌ Update review error:', error);
      return {
        success: false,
        message: 'Failed to update review',
        error: error.message
      };
    }
  }

  /**
   * Supprimer une review
   */
  async deleteReview(reviewId, userId) {
    try {
      // Vérifier que l'utilisateur peut supprimer cette review
      const { data: review } = await this.supabase
        .from('reviews')
        .select('reviewer_id, reviewee_id')
        .eq('id', reviewId)
        .single();

      if (!review) {
        return {
          success: false,
          message: 'Review not found'
        };
      }

      if (review.reviewer_id !== userId) {
        return {
          success: false,
          message: 'You can only delete your own reviews'
        };
      }

      // Marquer comme supprimée au lieu de supprimer définitivement
      const { error } = await this.supabase
        .from('reviews')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) {
        console.error('❌ Delete review error:', error);
        return {
          success: false,
          message: 'Failed to delete review',
          error: error.message
        };
      }

      // Recalculer les statistiques
      await this.recalculateUserStats(review.reviewee_id);

      return {
        success: true,
        message: 'Review deleted successfully'
      };

    } catch (error) {
      console.error('❌ Delete review error:', error);
      return {
        success: false,
        message: 'Failed to delete review',
        error: error.message
      };
    }
  }

  /**
   * Signaler une review
   */
  async reportReview(reviewId, reporterId, reason, description) {
    try {
      const { data: report, error } = await this.supabase
        .from('review_reports')
        .insert({
          review_id: reviewId,
          reporter_id: reporterId,
          reason: reason,
          description: description,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Report review error:', error);
        return {
          success: false,
          message: 'Failed to report review',
          error: error.message
        };
      }

      return {
        success: true,
        report: report,
        message: 'Review reported successfully'
      };

    } catch (error) {
      console.error('❌ Report review error:', error);
      return {
        success: false,
        message: 'Failed to report review',
        error: error.message
      };
    }
  }

  /**
   * Recalculer les statistiques d'un utilisateur
   */
  async recalculateUserStats(userId) {
    try {
      const { error } = await this.supabase
        .rpc('calculate_review_stats', {
          user_id_param: userId
        });

      if (error) {
        console.error('❌ Recalculate stats error:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ Recalculate stats error:', error);
      return false;
    }
  }

  /**
   * Attribuer des badges automatiquement
   */
  async assignBadges(userId) {
    try {
      const { error } = await this.supabase
        .rpc('assign_verification_badges', {
          user_id_param: userId
        });

      if (error) {
        console.error('❌ Assign badges error:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('❌ Assign badges error:', error);
      return false;
    }
  }

  /**
   * Obtenir les reviews récentes (pour l'admin)
   */
  async getRecentReviews(options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        status = 'active'
      } = options;

      const { data: reviews, error } = await this.supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url),
          reviewee:profiles!reviews_reviewee_id_fkey(full_name, avatar_url)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Get recent reviews error:', error);
        return {
          success: false,
          message: 'Failed to get recent reviews',
          error: error.message
        };
      }

      return {
        success: true,
        reviews: reviews || [],
        pagination: {
          limit,
          offset,
          total: reviews?.length || 0
        }
      };

    } catch (error) {
      console.error('❌ Get recent reviews error:', error);
      return {
        success: false,
        message: 'Failed to get recent reviews',
        error: error.message
      };
    }
  }

  /**
   * Obtenir les statistiques globales (pour l'admin)
   */
  async getGlobalStats() {
    try {
      const { data: stats, error } = await this.supabase
        .from('review_stats')
        .select('*')
        .order('average_rating', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Get global stats error:', error);
        return {
          success: false,
          message: 'Failed to get global stats',
          error: error.message
        };
      }

      return {
        success: true,
        stats: stats || []
      };

    } catch (error) {
      console.error('❌ Get global stats error:', error);
      return {
        success: false,
        message: 'Failed to get global stats',
        error: error.message
      };
    }
  }
}

export default new ReviewsService();
