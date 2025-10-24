/**
 * Admin Service pour UGC Maroc
 * Dashboard financier et métriques business
 */

import { createClient } from '@supabase/supabase-js';
import { eq, and, desc, sql, gte, lte, count, sum, avg } from 'drizzle-orm';
import { db } from '../db/client.js';
import { profiles, orders, payments, campaigns, gigs, reviews, reviewStats, creators, brands } from '../db/schema.js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service Admin pour métriques business
 */
class AdminService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Obtenir les métriques générales du dashboard
   */
  async getDashboardMetrics(period = '30d') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      // Métriques financières
      const financialMetrics = await this.getFinancialMetrics(dateFilter);
      
      // Métriques utilisateurs
      const userMetrics = await this.getUserMetrics(dateFilter);
      
      // Métriques contenu
      const contentMetrics = await this.getContentMetrics(dateFilter);
      
      // Métriques performance
      const performanceMetrics = await this.getPerformanceMetrics(dateFilter);

      return {
        success: true,
        period: period,
        financial: financialMetrics,
        users: userMetrics,
        content: contentMetrics,
        performance: performanceMetrics,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Get dashboard metrics error:', error);
      return {
        success: false,
        message: 'Failed to get dashboard metrics',
        error: error.message
      };
    }
  }

  /**
   * Métriques financières
   */
  async getFinancialMetrics(dateFilter) {
    try {
      // Revenue total
      const { data: revenueData } = await this.supabase
        .from('payments')
        .select('amount, status, created_at')
        .eq('status', 'completed')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;

      // Commission plateforme (15% sur chaque paiement)
      const platformCommission = totalRevenue * 0.15;

      // Frais Stripe (5% sur chaque paiement)
      const stripeFees = totalRevenue * 0.05;

      // Revenue net
      const netRevenue = platformCommission - stripeFees;

      // Retraits demandés
      const { data: withdrawalsData } = await this.supabase
        .from('payouts')
        .select('amount, status, created_at')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const totalWithdrawals = withdrawalsData?.reduce((sum, withdrawal) => sum + parseFloat(withdrawal.amount || 0), 0) || 0;

      // Paiements en attente
      const { data: pendingPayments } = await this.supabase
        .from('payments')
        .select('amount')
        .eq('status', 'pending');

      const pendingAmount = pendingPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;

      return {
        totalRevenue: totalRevenue,
        platformCommission: platformCommission,
        stripeFees: stripeFees,
        netRevenue: netRevenue,
        totalWithdrawals: totalWithdrawals,
        pendingAmount: pendingAmount,
        profitMargin: totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('❌ Get financial metrics error:', error);
      return {
        totalRevenue: 0,
        platformCommission: 0,
        stripeFees: 0,
        netRevenue: 0,
        totalWithdrawals: 0,
        pendingAmount: 0,
        profitMargin: 0
      };
    }
  }

  /**
   * Métriques utilisateurs
   */
  async getUserMetrics(dateFilter) {
    try {
      // Nouveaux utilisateurs
      const { data: newUsers } = await this.supabase
        .from('profiles')
        .select('id, role, created_at')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const newCreators = newUsers?.filter(user => user.role === 'creator').length || 0;
      const newBrands = newUsers?.filter(user => user.role === 'brand').length || 0;

      // Utilisateurs actifs (avec au moins une commande)
      const { data: activeUsers } = await this.supabase
        .from('orders')
        .select('brand_id, creator_id, created_at')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const activeBrands = new Set(activeUsers?.map(order => order.brand_id)).size || 0;
      const activeCreators = new Set(activeUsers?.map(order => order.creator_id)).size || 0;

      // Total utilisateurs
      const { data: totalUsers } = await this.supabase
        .from('profiles')
        .select('role');

      const totalCreators = totalUsers?.filter(user => user.role === 'creator').length || 0;
      const totalBrands = totalUsers?.filter(user => user.role === 'brand').length || 0;

      return {
        newUsers: {
          creators: newCreators,
          brands: newBrands,
          total: newCreators + newBrands
        },
        activeUsers: {
          creators: activeCreators,
          brands: activeBrands,
          total: activeCreators + activeBrands
        },
        totalUsers: {
          creators: totalCreators,
          brands: totalBrands,
          total: totalCreators + totalBrands
        },
        growthRate: {
          creators: totalCreators > 0 ? ((newCreators / totalCreators) * 100).toFixed(2) : 0,
          brands: totalBrands > 0 ? ((newBrands / totalBrands) * 100).toFixed(2) : 0
        }
      };

    } catch (error) {
      console.error('❌ Get user metrics error:', error);
      return {
        newUsers: { creators: 0, brands: 0, total: 0 },
        activeUsers: { creators: 0, brands: 0, total: 0 },
        totalUsers: { creators: 0, brands: 0, total: 0 },
        growthRate: { creators: 0, brands: 0 }
      };
    }
  }

  /**
   * Métriques contenu
   */
  async getContentMetrics(dateFilter) {
    try {
      // Nouvelles campagnes
      const { data: newCampaigns } = await this.supabase
        .from('campaigns')
        .select('id, created_at')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      // Nouveaux gigs
      const { data: newGigs } = await this.supabase
        .from('gigs')
        .select('id, created_at')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      // Commandes créées
      const { data: newOrders } = await this.supabase
        .from('orders')
        .select('id, created_at, status')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const completedOrders = newOrders?.filter(order => order.status === 'completed').length || 0;
      const pendingOrders = newOrders?.filter(order => order.status === 'pending').length || 0;

      // Reviews créées
      const { data: newReviews } = await this.supabase
        .from('reviews')
        .select('id, created_at, rating')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const averageRating = newReviews?.length > 0 
        ? (newReviews.reduce((sum, review) => sum + review.rating, 0) / newReviews.length).toFixed(2)
        : 0;

      return {
        campaigns: {
          new: newCampaigns?.length || 0,
          total: await this.getTotalCount('campaigns')
        },
        gigs: {
          new: newGigs?.length || 0,
          total: await this.getTotalCount('gigs')
        },
        orders: {
          new: newOrders?.length || 0,
          completed: completedOrders,
          pending: pendingOrders,
          completionRate: newOrders?.length > 0 ? ((completedOrders / newOrders.length) * 100).toFixed(2) : 0
        },
        reviews: {
          new: newReviews?.length || 0,
          averageRating: averageRating,
          total: await this.getTotalCount('reviews')
        }
      };

    } catch (error) {
      console.error('❌ Get content metrics error:', error);
      return {
        campaigns: { new: 0, total: 0 },
        gigs: { new: 0, total: 0 },
        orders: { new: 0, completed: 0, pending: 0, completionRate: 0 },
        reviews: { new: 0, averageRating: 0, total: 0 }
      };
    }
  }

  /**
   * Métriques de performance
   */
  async getPerformanceMetrics(dateFilter) {
    try {
      // Taux de conversion
      const { data: conversionData } = await this.supabase
        .from('campaigns')
        .select('id, status, created_at')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const totalCampaigns = conversionData?.length || 0;
      const activeCampaigns = conversionData?.filter(campaign => campaign.status === 'active').length || 0;
      const conversionRate = totalCampaigns > 0 ? ((activeCampaigns / totalCampaigns) * 100).toFixed(2) : 0;

      // Temps de réponse moyen
      const { data: responseData } = await this.supabase
        .from('messages')
        .select('created_at, updated_at')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      // Revenue par utilisateur
      const { data: revenuePerUser } = await this.supabase
        .from('payments')
        .select('amount, brand_id')
        .eq('status', 'completed')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end);

      const uniqueBrands = new Set(revenuePerUser?.map(payment => payment.brand_id)).size || 1;
      const totalRevenue = revenuePerUser?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
      const revenuePerUserValue = uniqueBrands > 0 ? (totalRevenue / uniqueBrands).toFixed(2) : 0;

      return {
        conversionRate: conversionRate,
        averageResponseTime: '2.5h', // TODO: Calculer réellement
        revenuePerUser: revenuePerUserValue,
        customerSatisfaction: await this.getCustomerSatisfaction(),
        systemUptime: await this.getSystemUptime()
      };

    } catch (error) {
      console.error('❌ Get performance metrics error:', error);
      return {
        conversionRate: 0,
        averageResponseTime: 'N/A',
        revenuePerUser: 0,
        customerSatisfaction: 0,
        systemUptime: 0
      };
    }
  }

  /**
   * Obtenir les top performers
   */
  async getTopPerformers(limit = 10) {
    try {
      // Top creators par revenue
      const { data: topCreators } = await this.supabase
        .from('profiles')
        .select(`
          id, full_name, avatar_url, role,
          creator_earnings!inner(amount)
        `)
        .eq('role', 'creator')
        .order('creator_earnings.amount', { ascending: false })
        .limit(limit);

      // Top brands par dépenses
      const { data: topBrands } = await this.supabase
        .from('profiles')
        .select(`
          id, full_name, avatar_url, role,
          brand_spending!inner(amount)
        `)
        .eq('role', 'brand')
        .order('brand_spending.amount', { ascending: false })
        .limit(limit);

      // Top gigs par commandes
      const { data: topGigs } = await this.supabase
        .from('gigs')
        .select(`
          id, title, base_price, creator_id,
          orders!inner(id)
        `)
        .order('orders.id', { ascending: false })
        .limit(limit);

      return {
        success: true,
        topCreators: topCreators || [],
        topBrands: topBrands || [],
        topGigs: topGigs || []
      };

    } catch (error) {
      console.error('❌ Get top performers error:', error);
      return {
        success: false,
        message: 'Failed to get top performers',
        error: error.message
      };
    }
  }

  /**
   * Obtenir les données pour graphiques
   */
  async getChartData(period = '30d', chartType = 'revenue') {
    try {
      const dateFilter = this.getDateFilter(period);
      
      switch (chartType) {
        case 'revenue':
          return await this.getRevenueChartData(dateFilter);
        case 'users':
          return await this.getUsersChartData(dateFilter);
        case 'orders':
          return await this.getOrdersChartData(dateFilter);
        case 'reviews':
          return await this.getReviewsChartData(dateFilter);
        default:
          return { success: false, message: 'Invalid chart type' };
      }

    } catch (error) {
      console.error('❌ Get chart data error:', error);
      return {
        success: false,
        message: 'Failed to get chart data',
        error: error.message
      };
    }
  }

  /**
   * Données de graphique revenue
   */
  async getRevenueChartData(dateFilter) {
    try {
      const { data: revenueData } = await this.supabase
        .from('payments')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', dateFilter.start)
        .lte('created_at', dateFilter.end)
        .order('created_at', { ascending: true });

      // Grouper par jour
      const dailyRevenue = {};
      revenueData?.forEach(payment => {
        const date = payment.created_at.split('T')[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(payment.amount || 0);
      });

      const chartData = Object.entries(dailyRevenue).map(([date, amount]) => ({
        date,
        revenue: amount
      }));

      return {
        success: true,
        data: chartData,
        total: chartData.reduce((sum, item) => sum + item.revenue, 0)
      };

    } catch (error) {
      console.error('❌ Get revenue chart data error:', error);
      return {
        success: false,
        message: 'Failed to get revenue chart data',
        error: error.message
      };
    }
  }

  /**
   * Obtenir les alertes admin
   */
  async getAdminAlerts() {
    try {
      const alerts = [];

      // Paiements en attente depuis plus de 24h
      const { data: pendingPayments } = await this.supabase
        .from('payments')
        .select('id, amount, created_at')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (pendingPayments?.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Paiements en attente',
          message: `${pendingPayments.length} paiements en attente depuis plus de 24h`,
          count: pendingPayments.length,
          action: 'review_payments'
        });
      }

      // Retraits en attente
      const { data: pendingWithdrawals } = await this.supabase
        .from('payouts')
        .select('id, amount, created_at')
        .eq('status', 'pending');

      if (pendingWithdrawals?.length > 0) {
        alerts.push({
          type: 'info',
          title: 'Retraits en attente',
          message: `${pendingWithdrawals.length} demandes de retrait en attente`,
          count: pendingWithdrawals.length,
          action: 'review_withdrawals'
        });
      }

      // Reviews signalées
      const { data: reportedReviews } = await this.supabase
        .from('review_reports')
        .select('id, reason, created_at')
        .eq('status', 'pending');

      if (reportedReviews?.length > 0) {
        alerts.push({
          type: 'danger',
          title: 'Reviews signalées',
          message: `${reportedReviews.length} reviews signalées nécessitent une révision`,
          count: reportedReviews.length,
          action: 'review_reports'
        });
      }

      return {
        success: true,
        alerts: alerts,
        total: alerts.length
      };

    } catch (error) {
      console.error('❌ Get admin alerts error:', error);
      return {
        success: false,
        message: 'Failed to get admin alerts',
        error: error.message
      };
    }
  }

  /**
   * Utilitaires
   */
  getDateFilter(period) {
    const now = new Date();
    let start;

    switch (period) {
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      start: start.toISOString(),
      end: now.toISOString()
    };
  }

  async getTotalCount(table) {
    try {
      const { count } = await this.supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  async getCustomerSatisfaction() {
    try {
      const { data: reviews } = await this.supabase
        .from('reviews')
        .select('rating')
        .eq('status', 'active');

      if (!reviews?.length) return 0;

      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      return averageRating.toFixed(2);
    } catch (error) {
      return 0;
    }
  }

  async getSystemUptime() {
    // TODO: Implémenter le calcul d'uptime réel
    return 99.9;
  }
}

export default new AdminService();
