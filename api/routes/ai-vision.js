import express from 'express';
import aiVisionService from '../services/ai-vision.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/ai-vision/analyze-quality
 * Analyze video quality using AI Vision
 */
router.post('/analyze-quality', authMiddleware, async (req, res) => {
  try {
    const { videoUrl, options = {} } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL الفيديو مطلوب'
      });
    }

    console.log('🎬 Starting video quality analysis...');
    const result = await aiVisionService.analyzeVideoQuality(videoUrl, options);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم تحليل جودة الفيديو بنجاح',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في تحليل جودة الفيديو',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in quality analysis endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * POST /api/ai-vision/moderate-content
 * Moderate video content for inappropriate material
 */
router.post('/moderate-content', authMiddleware, async (req, res) => {
  try {
    const { videoUrl, options = {} } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL الفيديو مطلوب'
      });
    }

    console.log('🛡️ Starting content moderation...');
    const result = await aiVisionService.moderateContent(videoUrl, options);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم مراجعة المحتوى بنجاح',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في مراجعة المحتوى',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in content moderation endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * POST /api/ai-vision/analyze-portfolio
 * Analyze creator portfolio for brand matching
 */
router.post('/analyze-portfolio', authMiddleware, async (req, res) => {
  try {
    const { portfolioUrls, brandRequirements = {} } = req.body;

    if (!portfolioUrls || !Array.isArray(portfolioUrls) || portfolioUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'روابط المحفظة مطلوبة'
      });
    }

    console.log('🎨 Starting portfolio analysis...');
    const result = await aiVisionService.analyzePortfolio(portfolioUrls, brandRequirements);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم تحليل المحفظة بنجاح',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في تحليل المحفظة',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in portfolio analysis endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * GET /api/ai-vision/test
 * Test AI Vision service
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing AI Vision service...');
    
    // Test with a sample image URL
    const testImageUrl = 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Test+Video';
    
    const result = await aiVisionService.analyzeVideoQuality(testImageUrl);
    
    return res.status(200).json({
      success: true,
      message: 'AI Vision service is working!',
      testResult: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI Vision test error:', error);
    return res.status(500).json({
      success: false,
      message: 'AI Vision service test failed',
      error: error.message
    });
  }
});

export default router;
