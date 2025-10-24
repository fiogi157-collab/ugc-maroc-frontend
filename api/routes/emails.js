import express from 'express';
import emailService from '../services/resend.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/emails/send
 * Send email notification
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { to, subject, template, data, language } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json({
        success: false,
        message: 'المعلومات المطلوبة: to, subject, template'
      });
    }

    console.log('📧 Sending email notification...');
    const result = await emailService.sendEmail({
      to,
      subject,
      template,
      data: data || {},
      language: language || 'ar'
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم إرسال البريد الإلكتروني بنجاح',
        data: {
          messageId: result.messageId,
          template,
          recipient: to
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في إرسال البريد الإلكتروني',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in email send endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * POST /api/emails/signup-confirmation
 * Send signup confirmation email
 */
router.post('/signup-confirmation', async (req, res) => {
  try {
    const { email, name, verificationUrl, language = 'ar' } = req.body;

    if (!email || !verificationUrl) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني ورابط التحقق مطلوبان'
      });
    }

    const subjects = {
      ar: 'مرحباً بك في UGC Maroc - تأكيد حسابك',
      fr: 'Bienvenue sur UGC Maroc - Confirmez votre compte',
      en: 'Welcome to UGC Maroc - Confirm your account'
    };

    const result = await emailService.sendEmail({
      to: email,
      subject: subjects[language] || subjects.ar,
      template: 'signup-confirmation',
      data: { name, verificationUrl },
      language
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم إرسال بريد التأكيد بنجاح',
        data: { messageId: result.messageId }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في إرسال بريد التأكيد',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in signup confirmation:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * POST /api/emails/payment-successful
 * Send payment successful notification
 */
router.post('/payment-successful', authMiddleware, async (req, res) => {
  try {
    const { email, amount, date, reference, language = 'ar' } = req.body;

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني والمبلغ مطلوبان'
      });
    }

    const subjects = {
      ar: `تم الدفع بنجاح - ${amount} MAD`,
      fr: `Paiement réussi - ${amount} MAD`,
      en: `Payment Successful - ${amount} MAD`
    };

    const result = await emailService.sendEmail({
      to: email,
      subject: subjects[language] || subjects.ar,
      template: 'payment-successful',
      data: { amount, date: date || new Date().toISOString(), reference },
      language
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم إرسال إشعار الدفع بنجاح',
        data: { messageId: result.messageId }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في إرسال إشعار الدفع',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in payment notification:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * POST /api/emails/new-message
 * Send new message notification
 */
router.post('/new-message', authMiddleware, async (req, res) => {
  try {
    const { email, senderName, messagePreview, messageUrl, language = 'ar' } = req.body;

    if (!email || !senderName || !messageUrl) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني واسم المرسل ورابط الرسالة مطلوبة'
      });
    }

    const subjects = {
      ar: `رسالة جديدة من ${senderName}`,
      fr: `Nouveau message de ${senderName}`,
      en: `New message from ${senderName}`
    };

    const result = await emailService.sendEmail({
      to: email,
      subject: subjects[language] || subjects.ar,
      template: 'new-message',
      data: { senderName, messagePreview, messageUrl },
      language
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'تم إرسال إشعار الرسالة بنجاح',
        data: { messageId: result.messageId }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'خطأ في إرسال إشعار الرسالة',
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error in message notification:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

/**
 * GET /api/emails/test
 * Test email service
 */
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 Testing email service...');
    
    // Test with sample data
    const testResult = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email - UGC Maroc',
      template: 'welcome',
      data: { 
        name: 'أحمد',
        email: 'test@example.com',
        dashboardUrl: 'http://localhost:5000/creator/ugc-creator-dashboard.html'
      },
      language: 'ar'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Email service is working!',
      testResult: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email service test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email service test failed',
      error: error.message
    });
  }
});

/**
 * POST /api/emails/test-template
 * Test specific email template
 */
router.post('/test-template', async (req, res) => {
  try {
    const { template, language = 'ar', data = {} } = req.body;
    
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }
    
    console.log(`🧪 Testing template: ${template} in ${language}`);
    
    const testResult = await emailService.sendEmail({
      to: 'test@example.com',
      template: template,
      data: {
        name: 'أحمد',
        email: 'test@example.com',
        dashboardUrl: 'http://localhost:5000/creator/ugc-creator-dashboard.html',
        verificationUrl: 'http://localhost:5000/verify?token=test123',
        amount: '1,500',
        reference: 'TXN-123456',
        date: new Date().toLocaleDateString('ar-MA'),
        senderName: 'فاطمة الزهراء',
        messagePreview: 'مرحباً، أريد مناقشة تفاصيل المشروع...',
        messageUrl: 'http://localhost:5000/messages/123',
        campaignTitle: 'حملة منتجات التجميل الجديدة',
        budget: '5,000',
        deadline: '15 ديسمبر 2024',
        description: 'إنشاء محتوى إبداعي لمنتجات التجميل الجديدة',
        campaignUrl: 'http://localhost:5000/campaigns/123',
        month: 'ديسمبر',
        year: '2024',
        projectsCompleted: '8',
        totalEarnings: '12,500',
        averageRating: '4.8',
        newClients: '3',
        reportUrl: 'http://localhost:5000/reports/monthly',
        ...data
      },
      language: language
    });
    
    return res.status(200).json({
      success: true,
      message: `Template '${template}' tested successfully`,
      testResult: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Template test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Template test failed',
      error: error.message
    });
  }
});

export default router;
