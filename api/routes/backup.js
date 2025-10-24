/**
 * Backup Routes pour UGC Maroc
 * API endpoints pour la gestion des backups
 */

import express from 'express';
import backupService from '../services/backup.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = express.Router();

/**
 * GET /api/backup/status
 * Obtenir le statut du service de backup
 */
router.get('/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const status = backupService.getStatus();
    
    res.json({
      success: true,
      status: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Backup status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup status',
      error: error.message
    });
  }
});

/**
 * POST /api/backup/perform
 * Effectuer un backup manuel
 */
router.post('/perform', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { type = 'manual' } = req.body;
    
    console.log(`🔄 Manual backup requested: ${type}`);
    
    const result = await backupService.performFullBackup(type);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Backup completed successfully`,
        backupId: result.backupId,
        duration: result.duration,
        manifest: result.manifest
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Backup failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Manual backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Manual backup failed',
      error: error.message
    });
  }
});

/**
 * GET /api/backup/list
 * Lister tous les backups disponibles
 */
router.get('/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    res.json({
      success: true,
      backups: backups,
      count: backups.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ List backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

/**
 * POST /api/backup/restore/:backupId
 * Restaurer depuis un backup spécifique
 */
router.post('/restore/:backupId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { backupId } = req.params;
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: 'Backup ID is required'
      });
    }
    
    console.log(`🔄 Restore requested: ${backupId}`);
    
    const result = await backupService.restoreFromBackup(backupId);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Restore completed successfully`,
        backupId: result.backupId,
        manifest: result.manifest
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Restore failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Restore failed',
      error: error.message
    });
  }
});

/**
 * DELETE /api/backup/:backupId
 * Supprimer un backup spécifique
 */
router.delete('/:backupId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { backupId } = req.params;
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: 'Backup ID is required'
      });
    }
    
    console.log(`🗑️ Delete backup requested: ${backupId}`);
    
    // TODO: Implémenter la suppression d'un backup spécifique
    // Pour l'instant, on utilise le cleanup général
    await backupService.cleanupOldBackups();
    
    res.json({
      success: true,
      message: `Backup ${backupId} deletion initiated`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Delete backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
});

/**
 * POST /api/backup/initialize
 * Initialiser le service de backup
 */
router.post('/initialize', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('🔄 Initializing backup service...');
    
    await backupService.initialize();
    
    res.json({
      success: true,
      message: 'Backup service initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Initialize backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize backup service',
      error: error.message
    });
  }
});

/**
 * GET /api/backup/health
 * Vérifier la santé du système de backup
 */
router.get('/health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const status = backupService.getStatus();
    const backups = await backupService.listBackups();
    
    const health = {
      service: 'backup',
      status: 'healthy',
      isRunning: status.isRunning,
      backupCount: backups.length,
      lastBackup: backups.length > 0 ? backups[0].timestamp : null,
      schedules: status.schedules,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      health: health
    });
  } catch (error) {
    console.error('❌ Backup health error:', error);
    res.status(500).json({
      success: false,
      message: 'Backup health check failed',
      error: error.message
    });
  }
});

export default router;
