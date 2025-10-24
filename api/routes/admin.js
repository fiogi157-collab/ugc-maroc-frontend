/**
 * Admin Routes pour UGC Maroc
 * API endpoints pour le dashboard admin
 */

import express from 'express';
import adminService from '../services/admin.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

/**
 * GET /api/admin/dashboard
 * Obtenir les métriques du dashboard admin
 */
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const result = await adminService.getDashboardMetrics(period);

    if (result.success) {
      res.json({
        success: true,
        dashboard: result,
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
    console.error('❌ Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard metrics',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/metrics/financial
 * Obtenir les métriques financières
 */
router.get('/metrics/financial', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const dateFilter = adminService.getDateFilter(period);

    const result = await adminService.getFinancialMetrics(dateFilter);

    res.json({
      success: true,
      financial: result,
      period: period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get financial metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial metrics',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/metrics/users
 * Obtenir les métriques utilisateurs
 */
router.get('/metrics/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const dateFilter = adminService.getDateFilter(period);

    const result = await adminService.getUserMetrics(dateFilter);

    res.json({
      success: true,
      users: result,
      period: period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get user metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user metrics',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/metrics/content
 * Obtenir les métriques contenu
 */
router.get('/metrics/content', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const dateFilter = adminService.getDateFilter(period);

    const result = await adminService.getContentMetrics(dateFilter);

    res.json({
      success: true,
      content: result,
      period: period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get content metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get content metrics',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/metrics/performance
 * Obtenir les métriques de performance
 */
router.get('/metrics/performance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const dateFilter = adminService.getDateFilter(period);

    const result = await adminService.getPerformanceMetrics(dateFilter);

    res.json({
      success: true,
      performance: result,
      period: period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/top-performers
 * Obtenir les top performers
 */
router.get('/top-performers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await adminService.getTopPerformers(parseInt(limit));

    if (result.success) {
      res.json({
        success: true,
        performers: result,
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
    console.error('❌ Get top performers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top performers',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/charts/:chartType
 * Obtenir les données pour graphiques
 */
router.get('/charts/:chartType', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { chartType } = req.params;
    const { period = '30d' } = req.query;

    const result = await adminService.getChartData(period, chartType);

    if (result.success) {
      res.json({
        success: true,
        chartData: result,
        chartType: chartType,
        period: period,
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
    console.error('❌ Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chart data',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/alerts
 * Obtenir les alertes admin
 */
router.get('/alerts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await adminService.getAdminAlerts();

    if (result.success) {
      res.json({
        success: true,
        alerts: result.alerts,
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
    console.error('❌ Get admin alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin alerts',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/export/:dataType
 * Exporter des données admin
 */
router.get('/export/:dataType', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { format = 'json', period = '30d' } = req.query;

    // TODO: Implémenter l'export de données
    res.json({
      success: true,
      message: `Export ${dataType} in ${format} format for period ${period}`,
      downloadUrl: `/api/admin/downloads/${dataType}-${period}.${format}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/actions/:action
 * Actions admin (approve, reject, etc.)
 */
router.post('/actions/:action', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { action } = req.params;
    const { id, reason, notes } = req.body;

    // Actions disponibles
    const availableActions = [
      'approve_payment',
      'reject_payment',
      'approve_withdrawal',
      'reject_withdrawal',
      'feature_review',
      'hide_review',
      'ban_user',
      'unban_user',
      'send_notification'
    ];

    if (!availableActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
        availableActions: availableActions
      });
    }

    // TODO: Implémenter les actions admin
    res.json({
      success: true,
      message: `Action ${action} executed successfully`,
      action: action,
      targetId: id,
      reason: reason,
      notes: notes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Admin action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute admin action',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/system/health
 * Vérifier la santé du système
 */
router.get('/system/health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // TODO: Implémenter les vérifications système
    const systemHealth = {
      database: 'healthy',
      storage: 'healthy',
      email: 'healthy',
      payments: 'healthy',
      ai: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      health: systemHealth
    });
  } catch (error) {
    console.error('❌ System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check system health',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/logs
 * Obtenir les logs système
 */
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type = 'all', limit = 100, offset = 0 } = req.query;

    // TODO: Implémenter la récupération des logs
    const logs = [
      {
        id: 1,
        type: 'info',
        message: 'User login successful',
        timestamp: new Date().toISOString(),
        userId: 'user-123',
        ip: '192.168.1.1'
      },
      {
        id: 2,
        type: 'warning',
        message: 'Payment processing delayed',
        timestamp: new Date().toISOString(),
        paymentId: 'pay-456',
        amount: 1500
      }
    ];

    res.json({
      success: true,
      logs: logs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: logs.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system logs',
      error: error.message
    });
  }
});

export default router;
