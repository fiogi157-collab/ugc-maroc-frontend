import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Validate configuration
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error("❌ Missing R2 configuration. Please check environment variables:");
  console.error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
}

// R2 endpoint (S3-compatible)
const R2_ENDPOINT = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

// Initialize S3 client for R2
const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file to Cloudflare R2 from a file path (streams from disk, no memory load)
 * @param {string} filePath - Path to file on disk
 * @param {string} fileName - Unique file name in R2 (e.g., "videos/campaign-123/video-uuid.mp4")
 * @param {string} contentType - MIME type (e.g., "video/mp4")
 * @returns {Promise<{success: boolean, publicUrl: string, key: string, size: number}>}
 */
export async function uploadFileToR2(filePath, fileName, contentType = "video/mp4") {
  const fs = await import("fs");
  const fsPromises = await import("fs/promises");
  
  try {
    // Get file size
    const stats = await fsPromises.stat(filePath);
    const fileSize = stats.size;

    // Create read stream (avoids loading entire file into memory)
    const fileStream = fs.createReadStream(filePath);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: fileStream,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    await r2Client.send(command);

    // Generate public URL (R2 custom domain or default)
    const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${fileName}`;

    console.log(`✅ File uploaded to R2: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    return {
      success: true,
      publicUrl,
      key: fileName,
      size: fileSize,
    };
  } catch (error) {
    console.error("❌ Error uploading to R2:", error);
    throw new Error(`R2 upload failed: ${error.message}`);
  }
}

/**
 * Upload a file to Cloudflare R2 (legacy buffer-based method)
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Unique file name (e.g., "videos/campaign-123/video-uuid.mp4")
 * @param {string} contentType - MIME type (e.g., "video/mp4")
 * @returns {Promise<{success: boolean, publicUrl: string, key: string}>}
 */
export async function uploadToR2(fileBuffer, fileName, contentType = "video/mp4") {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Generate public URL (R2 custom domain or default)
    const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${fileName}`;

    console.log(`✅ File uploaded to R2: ${fileName}`);

    return {
      success: true,
      publicUrl,
      key: fileName,
    };
  } catch (error) {
    console.error("❌ Error uploading to R2:", error);
    throw new Error(`R2 upload failed: ${error.message}`);
  }
}

/**
 * Generate a signed URL for private access (valid for 1 hour)
 * @param {string} key - File key in R2
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrlFromR2(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error("❌ Error generating signed URL:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

/**
 * Delete a file from R2
 * @param {string} key - File key to delete
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteFromR2(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    console.log(`✅ File deleted from R2: ${key}`);

    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting from R2:", error);
    throw new Error(`R2 deletion failed: ${error.message}`);
  }
}

/**
 * Generate public URL for a file in R2
 * @param {string} key - File key
 * @returns {string} Public URL
 */
export function getPublicUrl(key) {
  return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
}

export default {
  uploadToR2,
  uploadFileToR2,
  getSignedUrlFromR2,
  deleteFromR2,
  getPublicUrl,
};
