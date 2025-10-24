import express from "express";
import { db } from "../db/index.js";
import { submissions, campaigns, orders } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { checkVideoAccess, getVideoUrl } from "../middleware/videoAccess.js";

const router = express.Router();

/**
 * POST /api/submissions/:id/approve
 * Approve a submission and remove preview watermark
 * Only accessible by campaign owner after payment confirmation
 */
router.post("/:id/approve", async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const { brandId } = req.body; // Should come from authenticated user

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "معرف التقديم غير صحيح"
      });
    }

    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: "معرف العلامة التجارية مطلوب"
      });
    }

    console.log(`🔍 Checking submission ${submissionId} for brand ${brandId}`);

    // Get submission with campaign info
    const submission = await db
      .select({
        id: submissions.id,
        campaignId: submissions.campaignId,
        creatorId: submissions.creatorId,
        status: submissions.status,
        watermarkedUrl: submissions.watermarkedUrl,
        originalUrl: submissions.originalUrl,
        watermarkRemoved: submissions.watermarkRemoved,
        campaignBrandId: campaigns.brandId
      })
      .from(submissions)
      .innerJoin(campaigns, eq(submissions.campaignId, campaigns.id))
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (submission.length === 0) {
      return res.status(404).json({
        success: false,
        message: "التقديم غير موجود"
      });
    }

    const submissionData = submission[0];

    // Verify brand ownership
    if (submissionData.campaignBrandId !== brandId) {
      return res.status(403).json({
        success: false,
        message: "ليس لديك صلاحية للوصول إلى هذا التقديم"
      });
    }

    // Check if already approved
    if (submissionData.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: "تم الموافقة على هذا التقديم مسبقاً"
      });
    }

    // Check if watermark already removed
    if (submissionData.watermarkRemoved) {
      return res.status(400).json({
        success: false,
        message: "تم إزالة العلامة المائية مسبقاً"
      });
    }

    // Verify payment is confirmed
    console.log(`💳 Checking payment status for submission ${submissionId}`);
    const paymentCheck = await db
      .select({
        orderId: orders.id,
        status: orders.status,
        amount: orders.amountMad
      })
      .from(orders)
      .where(
        and(
          eq(orders.campaignId, submissionData.campaignId),
          eq(orders.creatorId, submissionData.creatorId),
          eq(orders.status, 'PAID')
        )
      )
      .limit(1);

    if (paymentCheck.length === 0) {
      return res.status(402).json({
        success: false,
        message: "يجب تأكيد الدفع قبل الموافقة على التقديم",
        requiresPayment: true
      });
    }

    console.log(`✅ Payment confirmed: ${paymentCheck[0].amount} MAD`);

    // Update submission status and remove watermark flag
    await db
      .update(submissions)
      .set({
        status: 'approved',
        watermarkRemoved: true,
        reviewedAt: new Date()
      })
      .where(eq(submissions.id, submissionId));

    console.log(`🎉 Submission ${submissionId} approved and watermark removed`);

    // Return success with original URL
    return res.status(200).json({
      success: true,
      message: "تمت الموافقة على التقديم وإزالة العلامة المائية بنجاح! 🎉",
      data: {
        submissionId: submissionId,
        status: 'approved',
        watermarkRemoved: true,
        originalUrl: submissionData.originalUrl,
        watermarkedUrl: submissionData.watermarkedUrl,
        paymentConfirmed: true,
        paymentAmount: paymentCheck[0].amount
      }
    });

  } catch (error) {
    console.error("❌ Error approving submission:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في الموافقة على التقديم",
      error: error.message
    });
  }
});

/**
 * GET /api/submissions/:id/status
 * Get submission status and watermark info
 */
router.get("/:id/status", async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "معرف التقديم غير صحيح"
      });
    }

    const submission = await db
      .select({
        id: submissions.id,
        status: submissions.status,
        watermarkedUrl: submissions.watermarkedUrl,
        originalUrl: submissions.originalUrl,
        watermarkRemoved: submissions.watermarkRemoved,
        submittedAt: submissions.submittedAt,
        reviewedAt: submissions.reviewedAt
      })
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (submission.length === 0) {
      return res.status(404).json({
        success: false,
        message: "التقديم غير موجود"
      });
    }

    const submissionData = submission[0];

    return res.status(200).json({
      success: true,
      data: {
        submissionId: submissionData.id,
        status: submissionData.status,
        watermarkStatus: submissionData.watermarkRemoved ? 'removed' : 'active',
        watermarkedUrl: submissionData.watermarkedUrl,
        originalUrl: submissionData.originalUrl,
        submittedAt: submissionData.submittedAt,
        reviewedAt: submissionData.reviewedAt,
        canDownloadOriginal: submissionData.watermarkRemoved && submissionData.status === 'approved'
      }
    });

  } catch (error) {
    console.error("❌ Error getting submission status:", error);
    return res.status(500).json({
      success: false,
      message: "خطأ في الحصول على حالة التقديم",
      error: error.message
    });
  }
});

/**
 * GET /api/submissions/:id/video
 * Get video URL with access control based on user role and watermark status
 */
router.get("/:id/video", checkVideoAccess, getVideoUrl);

export default router;
