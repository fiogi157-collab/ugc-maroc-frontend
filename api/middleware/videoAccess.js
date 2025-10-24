import { db } from "../db/index.js";
import { submissions, campaigns, profiles } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

/**
 * Middleware to control video access based on user role and watermark status
 * GET /api/submissions/:id/video
 * 
 * Rules:
 * - Creator (owner): always watermarked_url
 * - Brand (campaign owner): watermarked_url if watermark_removed=false, original_url if watermark_removed=true
 * - Admin: always original_url
 * - Others: 403
 */
export async function checkVideoAccess(req, res, next) {
  try {
    const submissionId = parseInt(req.params.id);
    const userId = req.user?.id; // From auth middleware
    const userRole = req.user?.role; // From auth middleware

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "معرف التقديم غير صحيح"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "يجب تسجيل الدخول للوصول إلى الفيديو"
      });
    }

    console.log(`🔍 Checking video access for submission ${submissionId}, user ${userId} (${userRole})`);

    // Get submission with campaign and creator info
    const submission = await db
      .select({
        id: submissions.id,
        creatorId: submissions.creatorId,
        campaignId: submissions.campaignId,
        status: submissions.status,
        watermarkedUrl: submissions.watermarkedUrl,
        originalUrl: submissions.originalUrl,
        watermarkRemoved: submissions.watermarkRemoved,
        campaignBrandId: campaigns.brandId,
        creatorUserId: profiles.id
      })
      .from(submissions)
      .innerJoin(campaigns, eq(submissions.campaignId, campaigns.id))
      .innerJoin(profiles, eq(submissions.creatorId, profiles.id))
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (submission.length === 0) {
      return res.status(404).json({
        success: false,
        message: "التقديم غير موجود"
      });
    }

    const submissionData = submission[0];

    // Determine access level and video URL
    let videoUrl;
    let accessLevel;
    let watermarkStatus;

    if (userRole === 'admin') {
      // Admin: always gets original (no watermark)
      videoUrl = submissionData.originalUrl;
      accessLevel = 'admin';
      watermarkStatus = 'removed';
      console.log(`👑 Admin access: original video`);
    } else if (submissionData.creatorId === userId) {
      // Creator (owner): always gets watermarked version
      videoUrl = submissionData.watermarkedUrl;
      accessLevel = 'creator';
      watermarkStatus = 'active';
      console.log(`🎨 Creator access: watermarked video`);
    } else if (submissionData.campaignBrandId === userId) {
      // Brand (campaign owner): depends on watermark status
      if (submissionData.watermarkRemoved) {
        videoUrl = submissionData.originalUrl;
        accessLevel = 'brand_approved';
        watermarkStatus = 'removed';
        console.log(`🏢 Brand access: original video (approved)`);
      } else {
        videoUrl = submissionData.watermarkedUrl;
        accessLevel = 'brand_preview';
        watermarkStatus = 'active';
        console.log(`🏢 Brand access: watermarked video (preview)`);
      }
    } else {
      // No access
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى هذا الفيديو"
      });
    }

    // Add video info to request for the route handler
    req.videoAccess = {
      submissionId: submissionData.id,
      videoUrl: videoUrl,
      accessLevel: accessLevel,
      watermarkStatus: watermarkStatus,
      submissionStatus: submissionData.status,
      canDownloadOriginal: accessLevel === 'admin' || accessLevel === 'brand_approved',
      isPreview: watermarkStatus === 'active'
    };

    next();

  } catch (error) {
    console.error("❌ Error in checkVideoAccess middleware:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في التحقق من صلاحية الوصول",
      error: error.message
    });
  }
}

/**
 * Route handler for GET /api/submissions/:id/video
 * Returns video URL based on access control
 */
export async function getVideoUrl(req, res) {
  try {
    const { videoUrl, accessLevel, watermarkStatus, canDownloadOriginal, isPreview } = req.videoAccess;

    return res.status(200).json({
      success: true,
      data: {
        videoUrl: videoUrl,
        accessLevel: accessLevel,
        watermarkStatus: watermarkStatus,
        canDownloadOriginal: canDownloadOriginal,
        isPreview: isPreview,
        message: isPreview 
          ? "هذا الفيديو محمي بعلامة مائية حتى تأكيد الدفع" 
          : "يمكنك تحميل الفيديو الأصلي"
      }
    });

  } catch (error) {
    console.error("❌ Error in getVideoUrl:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في الحصول على رابط الفيديو",
      error: error.message
    });
  }
}

export default {
  checkVideoAccess,
  getVideoUrl
};
