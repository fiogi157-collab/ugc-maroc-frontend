import express from 'express';
import smartMatchingService from '../services/smart-matching.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/smart-matching/match-creators
 * Match creators to a brand campaign
 */
router.post('/match-creators', authMiddleware, async (req, res) => {
  try {
    const { campaign, creators } = req.body;

    if (!campaign || !creators || !Array.isArray(creators)) {
      return res.status(400).json({
        success: false,
        message: 'تفاصيل الحملة والمبدعين مطلوبة'
      });
    }

    console.log('🎯 Starting creator matching for campaign:', campaign.title);
    const result = await smartMatchingService.matchCreatorsToCampaign(campaign, creators);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم مطابقة المبدعين بنجاح',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في مطابقة المبدعين',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in creator matching endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * POST /api/smart-matching/match-campaigns
 * Match campaigns to a creator
 */
router.post('/match-campaigns', authMiddleware, async (req, res) => {
  try {
    const { creator, campaigns } = req.body;

    if (!creator || !campaigns || !Array.isArray(campaigns)) {
      return res.status(400).json({
        success: false,
        message: 'تفاصيل المبدع والحملات مطلوبة'
      });
    }

    console.log('🎯 Starting campaign matching for creator:', creator.name);
    const result = await smartMatchingService.matchCampaignsToCreator(creator, campaigns);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم مطابقة الحملات بنجاح',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في مطابقة الحملات',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in campaign matching endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * POST /api/smart-matching/predict-performance
 * Predict campaign performance
 */
router.post('/predict-performance', authMiddleware, async (req, res) => {
  try {
    const { campaign, creator } = req.body;

    if (!campaign || !creator) {
      return res.status(400).json({
        success: false,
        message: 'تفاصيل الحملة والمبدع مطلوبة'
      });
    }

    console.log('📊 Starting performance prediction...');
    const result = await smartMatchingService.predictCampaignPerformance(campaign, creator);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم التنبؤ بالأداء بنجاح',
        data: result.data
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في التنبؤ بالأداء',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in performance prediction endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * GET /api/smart-matching/test
 * Test Smart Matching service
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing Smart Matching service...');
    
    // Test with sample data
    const testCampaign = {
      id: 'test-1',
      title: 'حملة منتجات التجميل',
      description: 'حملة إعلانية لمنتجات التجميل الطبيعية',
      budget: 5000,
      category: 'beauty',
      targetAudience: 'نساء 18-35 سنة',
      requirements: 'فيديو عالي الجودة، إضاءة جيدة'
    };

    const testCreators = [
      {
        id: 'creator-1',
        name: 'فاطمة الزهراء',
        specialties: 'تجميل، أزياء',
        successRate: 95,
        rating: 4.8,
        projectsCount: 25,
        location: 'الدار البيضاء',
        languages: 'العربية، الفرنسية'
      },
      {
        id: 'creator-2',
        name: 'أحمد المبدع',
        specialties: 'تقنية، ألعاب',
        successRate: 88,
        rating: 4.5,
        projectsCount: 15,
        location: 'الرباط',
        languages: 'العربية، الإنجليزية'
      }
    ];

    const result = await smartMatchingService.matchCreatorsToCampaign(testCampaign, testCreators);
    
    return res.status(200).json({
      success: true,
      message: 'Smart Matching service is working!',
      testResult: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Smart Matching test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Smart Matching service test failed',
      error: error.message
    });
  }
});

export default router;
