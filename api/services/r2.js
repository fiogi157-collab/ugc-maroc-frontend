import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import multer from 'multer';
import path from 'path';

// Configuration Cloudflare R2
const r2 = new S3Client({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET || 'ugc-maroc-assets';
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://assets.ugcmaroc.com';

class R2Service {
  
  /**
   * Upload un fichier vers Cloudflare R2
   * @param {Object} file - Fichier multer
   * @param {string} folder - Dossier de destination (ex: 'gigs', 'campaigns', 'profiles')
   * @param {string} filename - Nom du fichier (optionnel)
   * @returns {Promise<Object>} - URL publique et métadonnées
   */
  async uploadFile(file, folder = 'uploads', filename = null) {
    try {
      const fileExtension = path.extname(file.originalname);
      const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const key = `${folder}/${finalFilename}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      });

      const result = await r2.send(command);
      
      return {
        success: true,
        url: `${PUBLIC_URL}/${key}`,
        key: key,
        bucket: BUCKET_NAME,
        size: file.size,
        type: file.mimetype,
        originalName: file.originalname,
        etag: result.ETag
      };
    } catch (error) {
      console.error('❌ R2 Upload Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload multiple files
   * @param {Array} files - Array de fichiers multer
   * @param {string} folder - Dossier de destination
   * @returns {Promise<Array>} - Array des résultats
   */
  static async uploadMultipleFiles(files, folder = 'uploads') {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Supprimer un fichier de R2
   * @param {string} key - Clé du fichier à supprimer
   * @returns {Promise<boolean>} - Succès de la suppression
   */
  static async deleteFile(key) {
    try {
      await r2.deleteObject({
        Bucket: BUCKET_NAME,
        Key: key
      }).promise();
      
      return { success: true };
    } catch (error) {
      console.error('❌ R2 Delete Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lister les fichiers d'un dossier
   * @param {string} prefix - Préfixe du dossier
   * @returns {Promise<Array>} - Liste des fichiers
   */
  static async listFiles(prefix = '') {
    try {
      const result = await r2.listObjectsV2({
        Bucket: BUCKET_NAME,
        Prefix: prefix
      }).promise();
      
      return {
        success: true,
        files: result.Contents.map(file => ({
          key: file.Key,
          url: `${PUBLIC_URL}/${file.Key}`,
          size: file.Size,
          lastModified: file.LastModified
        }))
      };
    } catch (error) {
      console.error('❌ R2 List Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer une URL signée pour upload direct
   * @param {string} key - Clé du fichier
   * @param {string} contentType - Type MIME
   * @param {number} expiresIn - Durée en secondes (défaut: 3600)
   * @returns {Promise<string>} - URL signée
   */
  static async getSignedUploadUrl(key, contentType, expiresIn = 3600) {
    try {
      const url = await r2.getSignedUrl('putObject', {
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        Expires: expiresIn
      });
      
      return { success: true, url };
    } catch (error) {
      console.error('❌ R2 Signed URL Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Générer une URL signée pour téléchargement privé
   * @param {string} key - Clé du fichier
   * @param {number} expiresIn - Durée en secondes (défaut: 3600)
   * @returns {Promise<string>} - URL signée
   */
  static async getSignedDownloadUrl(key, expiresIn = 3600) {
    try {
      const url = await r2.getSignedUrl('getObject', {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: expiresIn
      });
      
      return { success: true, url };
    } catch (error) {
      console.error('❌ R2 Signed Download URL Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier si un fichier existe
   * @param {string} key - Clé du fichier
   * @returns {Promise<boolean>} - Existence du fichier
   */
  static async fileExists(key) {
    try {
      await r2.headObject({
        Bucket: BUCKET_NAME,
        Key: key
      }).promise();
      
      return { success: true, exists: true };
    } catch (error) {
      if (error.statusCode === 404) {
        return { success: true, exists: false };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les métadonnées d'un fichier
   * @param {string} key - Clé du fichier
   * @returns {Promise<Object>} - Métadonnées du fichier
   */
  static async getFileMetadata(key) {
    try {
      const result = await r2.headObject({
        Bucket: BUCKET_NAME,
        Key: key
      }).promise();
      
      return {
        success: true,
        metadata: {
          size: result.ContentLength,
          type: result.ContentType,
          lastModified: result.LastModified,
          etag: result.ETag
        }
      };
    } catch (error) {
      console.error('❌ R2 Metadata Error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new R2Service();