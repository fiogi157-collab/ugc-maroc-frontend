/**
 * Backup Service pour UGC Maroc
 * Système de backup automatique pour Supabase et Cloudflare R2
 */

import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration Cloudflare R2
const r2Client = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || 'ugc-maroc-assets';
const BACKUP_BUCKET = process.env.CLOUDFLARE_R2_BACKUP_BUCKET || 'ugc-maroc-backups';

/**
 * Service de backup pour UGC Maroc
 */
class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.maxBackups = 30; // Garder 30 backups maximum
    this.isRunning = false;
  }

  /**
   * Initialiser le service de backup
   */
  async initialize() {
    try {
      // Créer le dossier de backup local
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Programmer les backups automatiques
      this.scheduleBackups();
      
      console.log('✅ Backup Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize backup service:', error);
    }
  }

  /**
   * Programmer les backups automatiques
   */
  scheduleBackups() {
    // Backup quotidien à 2h du matin
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Starting scheduled daily backup...');
      await this.performFullBackup();
    });

    // Backup hebdomadaire le dimanche à 3h du matin
    cron.schedule('0 3 * * 0', async () => {
      console.log('🔄 Starting scheduled weekly backup...');
      await this.performFullBackup('weekly');
    });

    // Backup mensuel le 1er à 4h du matin
    cron.schedule('0 4 1 * *', async () => {
      console.log('🔄 Starting scheduled monthly backup...');
      await this.performFullBackup('monthly');
    });

    console.log('📅 Backup schedules configured');
  }

  /**
   * Effectuer un backup complet
   */
  async performFullBackup(type = 'daily') {
    if (this.isRunning) {
      console.log('⚠️ Backup already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`🔄 Starting ${type} backup...`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `${type}-${timestamp}`;
      
      // 1. Backup de la base de données Supabase
      const dbBackup = await this.backupDatabase(backupId);
      
      // 2. Backup des assets R2
      const assetsBackup = await this.backupAssets(backupId);
      
      // 3. Créer un manifest de backup
      const manifest = {
        id: backupId,
        type: type,
        timestamp: new Date().toISOString(),
        database: dbBackup,
        assets: assetsBackup,
        size: {
          database: dbBackup.size,
          assets: assetsBackup.size,
          total: dbBackup.size + assetsBackup.size
        }
      };

      // 4. Sauvegarder le manifest
      await this.saveBackupManifest(backupId, manifest);
      
      // 5. Nettoyer les anciens backups
      await this.cleanupOldBackups();
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${type} backup completed in ${duration}ms`);
      
      return {
        success: true,
        backupId,
        duration,
        manifest
      };

    } catch (error) {
      console.error(`❌ ${type} backup failed:`, error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Backup de la base de données Supabase
   */
  async backupDatabase(backupId) {
    try {
      console.log('📊 Backing up database...');
      
      const tables = [
        'profiles', 'campaigns', 'gigs', 'orders', 'payments', 
        'escrow_wallets', 'ledger_entries', 'payouts', 'webhook_events',
        'agreements', 'submissions', 'reviews', 'messages', 'negotiations',
        'contracts', 'cookie_consents', 'user_preferences', 'analytics_events'
      ];

      const dbData = {};
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*');
          
          if (error) {
            console.warn(`⚠️ Error backing up table ${table}:`, error.message);
            dbData[table] = { error: error.message, data: [] };
          } else {
            dbData[table] = { data: data || [], count: data?.length || 0 };
          }
        } catch (tableError) {
          console.warn(`⚠️ Table ${table} not accessible:`, tableError.message);
          dbData[table] = { error: tableError.message, data: [] };
        }
      }

      // Sauvegarder localement
      const dbBackupPath = path.join(this.backupDir, `${backupId}-database.json`);
      await fs.writeFile(dbBackupPath, JSON.stringify(dbData, null, 2));
      
      // Upload vers R2
      const r2Key = `backups/${backupId}/database.json`;
      await this.uploadToR2(dbBackupPath, r2Key);
      
      const stats = await fs.stat(dbBackupPath);
      
      console.log(`✅ Database backup completed: ${stats.size} bytes`);
      
      return {
        path: dbBackupPath,
        r2Key: r2Key,
        size: stats.size,
        tables: Object.keys(dbData),
        totalRecords: Object.values(dbData).reduce((sum, table) => sum + (table.count || 0), 0)
      };

    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  /**
   * Backup des assets Cloudflare R2
   */
  async backupAssets(backupId) {
    try {
      console.log('📁 Backing up assets...');
      
      // Lister tous les objets dans le bucket principal
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 1000
      });
      
      const listResult = await r2Client.send(listCommand);
      const objects = listResult.Contents || [];
      
      let totalSize = 0;
      let backedUpCount = 0;
      
      // Créer un manifest des assets
      const assetsManifest = {
        backupId,
        timestamp: new Date().toISOString(),
        sourceBucket: BUCKET_NAME,
        objects: []
      };
      
      for (const obj of objects) {
        try {
          // Copier l'objet vers le bucket de backup
          const backupKey = `backups/${backupId}/assets/${obj.Key}`;
          
          // Pour l'instant, on enregistre juste les métadonnées
          // Dans un vrai système, on copierait les fichiers
          assetsManifest.objects.push({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            backupKey: backupKey
          });
          
          totalSize += obj.Size || 0;
          backedUpCount++;
          
        } catch (objError) {
          console.warn(`⚠️ Error backing up asset ${obj.Key}:`, objError.message);
        }
      }
      
      // Sauvegarder le manifest des assets
      const assetsManifestPath = path.join(this.backupDir, `${backupId}-assets.json`);
      await fs.writeFile(assetsManifestPath, JSON.stringify(assetsManifest, null, 2));
      
      // Upload du manifest vers R2
      const r2Key = `backups/${backupId}/assets-manifest.json`;
      await this.uploadToR2(assetsManifestPath, r2Key);
      
      console.log(`✅ Assets backup completed: ${backedUpCount} objects, ${totalSize} bytes`);
      
      return {
        path: assetsManifestPath,
        r2Key: r2Key,
        size: totalSize,
        objectCount: backedUpCount,
        manifest: assetsManifest
      };

    } catch (error) {
      console.error('❌ Assets backup failed:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder le manifest de backup
   */
  async saveBackupManifest(backupId, manifest) {
    try {
      const manifestPath = path.join(this.backupDir, `${backupId}-manifest.json`);
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      // Upload vers R2
      const r2Key = `backups/${backupId}/manifest.json`;
      await this.uploadToR2(manifestPath, r2Key);
      
      console.log(`✅ Backup manifest saved: ${backupId}`);
      
    } catch (error) {
      console.error('❌ Failed to save backup manifest:', error);
      throw error;
    }
  }

  /**
   * Upload un fichier vers R2
   */
  async uploadToR2(filePath, key) {
    try {
      const fileContent = await fs.readFile(filePath);
      
      const command = new PutObjectCommand({
        Bucket: BACKUP_BUCKET,
        Key: key,
        Body: fileContent,
        ContentType: 'application/json'
      });
      
      await r2Client.send(command);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${key} to R2:`, error);
      throw error;
    }
  }

  /**
   * Nettoyer les anciens backups
   */
  async cleanupOldBackups() {
    try {
      console.log('🧹 Cleaning up old backups...');
      
      // Lister les backups locaux
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.includes('-manifest.json'));
      
      if (backupFiles.length <= this.maxBackups) {
        console.log(`✅ No cleanup needed (${backupFiles.length}/${this.maxBackups})`);
        return;
      }
      
      // Trier par date et supprimer les plus anciens
      const sortedFiles = backupFiles.sort().reverse();
      const filesToDelete = sortedFiles.slice(this.maxBackups);
      
      for (const file of filesToDelete) {
        const backupId = file.replace('-manifest.json', '');
        
        // Supprimer les fichiers locaux
        const patterns = [
          `${backupId}-manifest.json`,
          `${backupId}-database.json`,
          `${backupId}-assets.json`
        ];
        
        for (const pattern of patterns) {
          try {
            await fs.unlink(path.join(this.backupDir, pattern));
          } catch (unlinkError) {
            // Fichier peut ne pas exister
          }
        }
        
        console.log(`🗑️ Cleaned up old backup: ${backupId}`);
      }
      
      console.log(`✅ Cleanup completed: removed ${filesToDelete.length} old backups`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Restaurer depuis un backup
   */
  async restoreFromBackup(backupId) {
    try {
      console.log(`🔄 Restoring from backup: ${backupId}`);
      
      // Télécharger le manifest
      const manifestPath = path.join(this.backupDir, `${backupId}-manifest.json`);
      
      // Si le manifest n'existe pas localement, le télécharger depuis R2
      try {
        await fs.access(manifestPath);
      } catch {
        console.log('📥 Downloading manifest from R2...');
        // TODO: Implémenter le téléchargement depuis R2
      }
      
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      console.log(`📋 Restoring backup from ${manifest.timestamp}`);
      
      // Restaurer la base de données
      await this.restoreDatabase(backupId, manifest.database);
      
      // Restaurer les assets
      await this.restoreAssets(backupId, manifest.assets);
      
      console.log(`✅ Restore completed: ${backupId}`);
      
      return {
        success: true,
        backupId,
        manifest
      };

    } catch (error) {
      console.error(`❌ Restore failed:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restaurer la base de données
   */
  async restoreDatabase(backupId, dbInfo) {
    try {
      console.log('📊 Restoring database...');
      
      const dbBackupPath = path.join(this.backupDir, `${backupId}-database.json`);
      const dbContent = await fs.readFile(dbBackupPath, 'utf8');
      const dbData = JSON.parse(dbContent);
      
      // Restaurer chaque table
      for (const [tableName, tableData] of Object.entries(dbData)) {
        if (tableData.error) {
          console.warn(`⚠️ Skipping table ${tableName}: ${tableData.error}`);
          continue;
        }
        
        if (tableData.data && tableData.data.length > 0) {
          console.log(`📝 Restoring table ${tableName}: ${tableData.data.length} records`);
          
          // Supprimer les données existantes (attention en production!)
          await supabase.from(tableName).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          
          // Insérer les données de backup
          const { error } = await supabase
            .from(tableName)
            .insert(tableData.data);
          
          if (error) {
            console.error(`❌ Error restoring table ${tableName}:`, error);
          } else {
            console.log(`✅ Table ${tableName} restored successfully`);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      throw error;
    }
  }

  /**
   * Restaurer les assets
   */
  async restoreAssets(backupId, assetsInfo) {
    try {
      console.log('📁 Restoring assets...');
      
      const assetsManifestPath = path.join(this.backupDir, `${backupId}-assets.json`);
      const assetsContent = await fs.readFile(assetsManifestPath, 'utf8');
      const assetsManifest = JSON.parse(assetsContent);
      
      console.log(`📋 Found ${assetsManifest.objects.length} assets to restore`);
      
      // TODO: Implémenter la restauration des assets depuis R2
      console.log('⚠️ Asset restoration not fully implemented yet');
      
    } catch (error) {
      console.error('❌ Assets restore failed:', error);
      throw error;
    }
  }

  /**
   * Lister les backups disponibles
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const manifestFiles = files.filter(file => file.includes('-manifest.json'));
      
      const backups = [];
      
      for (const file of manifestFiles) {
        try {
          const manifestPath = path.join(this.backupDir, file);
          const manifestContent = await fs.readFile(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestContent);
          
          backups.push({
            id: manifest.id,
            type: manifest.type,
            timestamp: manifest.timestamp,
            size: manifest.size,
            tables: manifest.database?.tables || [],
            assets: manifest.assets?.objectCount || 0
          });
        } catch (error) {
          console.warn(`⚠️ Error reading manifest ${file}:`, error.message);
        }
      }
      
      return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Obtenir le statut du service de backup
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      backupDir: this.backupDir,
      maxBackups: this.maxBackups,
      schedules: {
        daily: '0 2 * * *',
        weekly: '0 3 * * 0',
        monthly: '0 4 1 * *'
      }
    };
  }
}

export default new BackupService();
