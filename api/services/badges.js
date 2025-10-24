/**
 * Badges Service pour UGC Maroc
 * Gestion des badges de vérification et confiance
 */

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service de gestion des badges
 */
class BadgesService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Obtenir les badges d'un utilisateur
   */
  async getUserBadges(userId) {
    try {
      const { data: badges, error } = await this.supabase
        .from('verification_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('awarded_at', { ascending: false });

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
   * Attribuer un badge à un utilisateur
   */
  async awardBadge(userId, badgeType, metadata = {}) {
    try {
      const badgeConfig = this.getBadgeConfig(badgeType);
      
      if (!badgeConfig) {
        return {
          success: false,
          message: 'Invalid badge type'
        };
      }

      // Vérifier si l'utilisateur a déjà ce badge
      const { data: existingBadge } = await this.supabase
        .from('verification_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_type', badgeType)
        .eq('is_active', true)
        .single();

      if (existingBadge) {
        return {
          success: false,
          message: 'User already has this badge'
        };
      }

      // Créer le badge
      const { data: badge, error } = await this.supabase
        .from('verification_badges')
        .insert({
          user_id: userId,
          badge_type: badgeType,
          title: badgeConfig.title,
          description: badgeConfig.description,
          icon: badgeConfig.icon,
          color: badgeConfig.color,
          criteria: JSON.stringify(metadata),
          is_active: true,
          awarded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Award badge error:', error);
        return {
          success: false,
          message: 'Failed to award badge',
          error: error.message
        };
      }

      // Envoyer notification
      await this.sendBadgeNotification(userId, badge);

      return {
        success: true,
        badge: badge,
        message: 'Badge awarded successfully'
      };

    } catch (error) {
      console.error('❌ Award badge error:', error);
      return {
        success: false,
        message: 'Failed to award badge',
        error: error.message
      };
    }
  }

  /**
   * Retirer un badge d'un utilisateur
   */
  async revokeBadge(userId, badgeType, reason = '') {
    try {
      const { error } = await this.supabase
        .from('verification_badges')
        .update({
          is_active: false,
          expires_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('badge_type', badgeType)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Revoke badge error:', error);
        return {
          success: false,
          message: 'Failed to revoke badge',
          error: error.message
        };
      }

      return {
        success: true,
        message: 'Badge revoked successfully'
      };

    } catch (error) {
      console.error('❌ Revoke badge error:', error);
      return {
        success: false,
        message: 'Failed to revoke badge',
        error: error.message
      };
    }
  }

  /**
   * Vérifier et attribuer automatiquement des badges
   */
  async checkAndAwardBadges(userId) {
    try {
      const badgesToCheck = [
        'verified',
        'top_rated',
        'fast_delivery',
        'high_quality',
        'excellent_communication',
        'value_for_money',
        'repeat_client',
        'premium_creator'
      ];

      const awardedBadges = [];

      for (const badgeType of badgesToCheck) {
        const shouldAward = await this.shouldAwardBadge(userId, badgeType);
        
        if (shouldAward) {
          const result = await this.awardBadge(userId, badgeType);
          if (result.success) {
            awardedBadges.push(result.badge);
          }
        }
      }

      return {
        success: true,
        awardedBadges: awardedBadges,
        count: awardedBadges.length
      };

    } catch (error) {
      console.error('❌ Check and award badges error:', error);
      return {
        success: false,
        message: 'Failed to check and award badges',
        error: error.message
      };
    }
  }

  /**
   * Vérifier si un utilisateur devrait recevoir un badge
   */
  async shouldAwardBadge(userId, badgeType) {
    try {
      // Récupérer les statistiques de l'utilisateur
      const { data: stats } = await this.supabase
        .from('review_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!stats) return false;

      switch (badgeType) {
        case 'verified':
          return stats.total_reviews >= 5 && stats.average_rating >= 4.0;
        
        case 'top_rated':
          return stats.total_reviews >= 10 && stats.average_rating >= 4.5;
        
        case 'fast_delivery':
          return stats.avg_delivery_rating >= 4.5;
        
        case 'high_quality':
          return stats.avg_quality_rating >= 4.5;
        
        case 'excellent_communication':
          return stats.avg_communication_rating >= 4.5;
        
        case 'value_for_money':
          return stats.avg_value_rating >= 4.5;
        
        case 'repeat_client':
          return stats.repeat_client_rate >= 30; // 30% de clients récurrents
        
        case 'premium_creator':
          return stats.total_reviews >= 20 && stats.average_rating >= 4.8;
        
        default:
          return false;
      }

    } catch (error) {
      console.error('❌ Should award badge error:', error);
      return false;
    }
  }

  /**
   * Obtenir la configuration d'un badge
   */
  getBadgeConfig(badgeType) {
    const badgeConfigs = {
      'verified': {
        title: 'Vérifié',
        description: 'Utilisateur vérifié avec d\'excellentes notes',
        icon: 'verified',
        color: '#00C851'
      },
      'top_rated': {
        title: 'Top Rated',
        description: 'Excellent créateur avec des notes exceptionnelles',
        icon: 'star',
        color: '#FFD700'
      },
      'fast_delivery': {
        title: 'Livraison Rapide',
        description: 'Livraison toujours dans les temps',
        icon: 'schedule',
        color: '#00BCD4'
      },
      'high_quality': {
        title: 'Haute Qualité',
        description: 'Travail de qualité exceptionnelle',
        icon: 'diamond',
        color: '#9C27B0'
      },
      'excellent_communication': {
        title: 'Excellente Communication',
        description: 'Communication claire et professionnelle',
        icon: 'chat',
        color: '#4CAF50'
      },
      'value_for_money': {
        title: 'Rapport Qualité-Prix',
        description: 'Excellent rapport qualité-prix',
        icon: 'attach_money',
        color: '#FF9800'
      },
      'repeat_client': {
        title: 'Clients Récurrents',
        description: 'Beaucoup de clients reviennent',
        icon: 'repeat',
        color: '#795548'
      },
      'premium_creator': {
        title: 'Créateur Premium',
        description: 'Créateur d\'élite avec des performances exceptionnelles',
        icon: 'workspace_premium',
        color: '#E91E63'
      },
      'brand_verified': {
        title: 'Marque Vérifiée',
        description: 'Marque officiellement vérifiée',
        icon: 'verified_business',
        color: '#3F51B5'
      },
      'influencer': {
        title: 'Influenceur',
        description: 'Influenceur avec une grande audience',
        icon: 'trending_up',
        color: '#FF5722'
      }
    };

    return badgeConfigs[badgeType] || null;
  }

  /**
   * Obtenir tous les badges disponibles
   */
  async getAllBadges() {
    try {
      const badgeTypes = Object.keys(this.getBadgeConfig('verified') ? {} : {
        'verified': 'Vérifié',
        'top_rated': 'Top Rated',
        'fast_delivery': 'Livraison Rapide',
        'high_quality': 'Haute Qualité',
        'excellent_communication': 'Excellente Communication',
        'value_for_money': 'Rapport Qualité-Prix',
        'repeat_client': 'Clients Récurrents',
        'premium_creator': 'Créateur Premium',
        'brand_verified': 'Marque Vérifiée',
        'influencer': 'Influenceur'
      });

      const badges = badgeTypes.map(type => ({
        type,
        ...this.getBadgeConfig(type)
      }));

      return {
        success: true,
        badges: badges
      };

    } catch (error) {
      console.error('❌ Get all badges error:', error);
      return {
        success: false,
        message: 'Failed to get all badges',
        error: error.message
      };
    }
  }

  /**
   * Obtenir les statistiques des badges
   */
  async getBadgeStats() {
    try {
      const { data: stats, error } = await this.supabase
        .from('verification_badges')
        .select('badge_type, is_active')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Get badge stats error:', error);
        return {
          success: false,
          message: 'Failed to get badge stats',
          error: error.message
        };
      }

      // Compter les badges par type
      const badgeCounts = {};
      stats?.forEach(badge => {
        badgeCounts[badge.badge_type] = (badgeCounts[badge.badge_type] || 0) + 1;
      });

      return {
        success: true,
        stats: badgeCounts,
        total: stats?.length || 0
      };

    } catch (error) {
      console.error('❌ Get badge stats error:', error);
      return {
        success: false,
        message: 'Failed to get badge stats',
        error: error.message
      };
    }
  }

  /**
   * Envoyer une notification de badge
   */
  async sendBadgeNotification(userId, badge) {
    try {
      // TODO: Implémenter l'envoi de notification
      console.log(`🏆 Badge awarded: ${badge.title} to user ${userId}`);
      
      return {
        success: true,
        message: 'Badge notification sent'
      };

    } catch (error) {
      console.error('❌ Send badge notification error:', error);
      return {
        success: false,
        message: 'Failed to send badge notification',
        error: error.message
      };
    }
  }

  /**
   * Obtenir les utilisateurs avec le plus de badges
   */
  async getTopBadgeHolders(limit = 10) {
    try {
      const { data: topHolders, error } = await this.supabase
        .from('verification_badges')
        .select(`
          user_id,
          profiles!inner(full_name, avatar_url, role),
          badge_type
        `)
        .eq('is_active', true)
        .order('awarded_at', { ascending: false })
        .limit(limit * 5); // Récupérer plus pour grouper

      if (error) {
        console.error('❌ Get top badge holders error:', error);
        return {
          success: false,
          message: 'Failed to get top badge holders',
          error: error.message
        };
      }

      // Grouper par utilisateur et compter les badges
      const userBadgeCounts = {};
      topHolders?.forEach(badge => {
        const userId = badge.user_id;
        if (!userBadgeCounts[userId]) {
          userBadgeCounts[userId] = {
            user: badge.profiles,
            badgeCount: 0,
            badges: []
          };
        }
        userBadgeCounts[userId].badgeCount++;
        userBadgeCounts[userId].badges.push(badge.badge_type);
      });

      // Trier par nombre de badges
      const sortedHolders = Object.values(userBadgeCounts)
        .sort((a, b) => b.badgeCount - a.badgeCount)
        .slice(0, limit);

      return {
        success: true,
        holders: sortedHolders
      };

    } catch (error) {
      console.error('❌ Get top badge holders error:', error);
      return {
        success: false,
        message: 'Failed to get top badge holders',
        error: error.message
      };
    }
  }
}

export default new BadgesService();
