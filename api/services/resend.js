import { Resend } from 'resend';
import { getEmailTemplate } from '../templates/email-templates.js';

/**
 * Email Service using Resend API
 * Handles all email notifications for UGC Maroc
 */
class EmailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.resend = this.apiKey ? new Resend(this.apiKey) : null;
    this.fromEmail = process.env.FROM_EMAIL || 'UGC Maroc <noreply@ugcmaroc.com>';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@ugcmaroc.com';
  }

  /**
   * Send email with template
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.template - Template name
   * @param {Object} options.data - Template data
   * @param {string} options.language - Language (ar, fr, en)
   * @returns {Promise<Object>} Send result
   */
  async sendEmail({ to, subject, template, data = {}, language = 'ar' }) {
    try {
      console.log(`📧 Sending email: ${template} to ${to}`);

      if (!this.resend) {
        console.warn('⚠️ Resend API key not configured, email not sent');
        return {
          success: true,
          messageId: 'mock-' + Date.now(),
          template,
          recipient: to,
          mock: true
        };
      }

      // Utiliser les templates professionnels
      let finalSubject = subject;
      let htmlContent;
      
      try {
        const templateData = getEmailTemplate(template, language, data);
        finalSubject = templateData.subject;
        htmlContent = templateData.html;
      } catch (templateError) {
        console.warn(`⚠️ Template '${template}' not found, using fallback`);
        htmlContent = this.generateTemplate(template, data, language);
      }
      
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: finalSubject,
        html: htmlContent,
      });

      console.log(`✅ Email sent successfully: ${result.data?.id}`);
      
      return {
        success: true,
        messageId: result.data?.id,
        template,
        recipient: to
      };

    } catch (error) {
      console.error('❌ Email send error:', error);
      return {
        success: false,
        error: error.message,
        template,
        recipient: to
      };
    }
  }

  /**
   * Generate HTML template
   * @param {string} template - Template name
   * @param {Object} data - Template data
   * @param {string} language - Language
   * @returns {string} HTML content
   */
  generateTemplate(template, data, language) {
    const templates = {
      // Authentication
      'signup-confirmation': this.getSignupConfirmationTemplate(data, language),
      'email-verification': this.getEmailVerificationTemplate(data, language),
      'password-reset': this.getPasswordResetTemplate(data, language),
      'login-success': this.getLoginSuccessTemplate(data, language),
      
      // Campaigns
      'campaign-created': this.getCampaignCreatedTemplate(data, language),
      'application-received': this.getApplicationReceivedTemplate(data, language),
      'application-accepted': this.getApplicationAcceptedTemplate(data, language),
      
      // Payments
      'payment-successful': this.getPaymentSuccessfulTemplate(data, language),
      'payment-failed': this.getPaymentFailedTemplate(data, language),
      'withdrawal-requested': this.getWithdrawalRequestedTemplate(data, language),
      
      // Submissions
      'submission-received': this.getSubmissionReceivedTemplate(data, language),
      'submission-approved': this.getSubmissionApprovedTemplate(data, language),
      
      // Messages
      'new-message': this.getNewMessageTemplate(data, language),
      
      // System
      'welcome': this.getWelcomeTemplate(data, language),
      'weekly-summary': this.getWeeklySummaryTemplate(data, language)
    };

    return templates[template] || this.getDefaultTemplate(data, language);
  }

  /**
   * Get signup confirmation template
   */
  getSignupConfirmationTemplate(data, language) {
    const texts = {
      ar: {
        title: 'مرحباً بك في UGC Maroc!',
        message: 'تم إنشاء حسابك بنجاح. يرجى تأكيد بريدك الإلكتروني للمتابعة.',
        cta: 'تأكيد البريد الإلكتروني',
        footer: 'شكراً لانضمامك إلى منصة UGC Maroc'
      },
      fr: {
        title: 'Bienvenue sur UGC Maroc!',
        message: 'Votre compte a été créé avec succès. Veuillez confirmer votre email pour continuer.',
        cta: 'Confirmer l\'email',
        footer: 'Merci de rejoindre la plateforme UGC Maroc'
      },
      en: {
        title: 'Welcome to UGC Maroc!',
        message: 'Your account has been created successfully. Please confirm your email to continue.',
        cta: 'Confirm Email',
        footer: 'Thank you for joining UGC Maroc platform'
      }
    };

    const t = texts[language] || texts.ar;
    const isRTL = language === 'ar';

    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
          body { font-family: ${isRTL ? 'Cairo, Arial' : 'Inter, Arial'}, sans-serif; margin: 0; padding: 0; background-color: #f6f6f8; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #5020df, #7c3aed); padding: 40px 20px; text-align: center; }
          .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 20px; text-align: ${isRTL ? 'right' : 'left'}; }
          .message { font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px; text-align: ${isRTL ? 'right' : 'left'}; }
          .cta-button { display: inline-block; background: #5020df; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">UGC Maroc</div>
          </div>
          <div class="content">
            <h1 class="title">${t.title}</h1>
            <p class="message">${t.message}</p>
            <a href="${data.verificationUrl}" class="cta-button">${t.cta}</a>
          </div>
          <div class="footer">
            <p>${t.footer}</p>
            <p>© 2024 UGC Maroc. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get email verification template
   */
  getEmailVerificationTemplate(data, language) {
    const texts = {
      ar: {
        title: 'تأكيد بريدك الإلكتروني',
        message: 'انقر على الرابط أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.',
        cta: 'تأكيد البريد الإلكتروني',
        expires: 'ينتهي هذا الرابط خلال 24 ساعة'
      },
      fr: {
        title: 'Confirmez votre email',
        message: 'Cliquez sur le lien ci-dessous pour confirmer votre email et activer votre compte.',
        cta: 'Confirmer l\'email',
        expires: 'Ce lien expire dans 24 heures'
      },
      en: {
        title: 'Confirm your email',
        message: 'Click the link below to confirm your email and activate your account.',
        cta: 'Confirm Email',
        expires: 'This link expires in 24 hours'
      }
    };

    const t = texts[language] || texts.ar;
    const isRTL = language === 'ar';

    return this.getSignupConfirmationTemplate({
      ...data,
      verificationUrl: data.verificationUrl
    }, language).replace('مرحباً بك في UGC Maroc!', t.title)
                 .replace('تم إنشاء حسابك بنجاح', t.message)
                 .replace('تأكيد البريد الإلكتروني', t.cta);
  }

  /**
   * Get payment successful template
   */
  getPaymentSuccessfulTemplate(data, language) {
    const texts = {
      ar: {
        title: 'تم الدفع بنجاح!',
        message: `تم استلام دفعتك بقيمة ${data.amount} MAD بنجاح.`,
        details: 'تفاصيل الدفع:',
        amount: 'المبلغ:',
        date: 'التاريخ:',
        reference: 'رقم المرجع:'
      },
      fr: {
        title: 'Paiement réussi!',
        message: `Votre paiement de ${data.amount} MAD a été reçu avec succès.`,
        details: 'Détails du paiement:',
        amount: 'Montant:',
        date: 'Date:',
        reference: 'Référence:'
      },
      en: {
        title: 'Payment Successful!',
        message: `Your payment of ${data.amount} MAD has been received successfully.`,
        details: 'Payment Details:',
        amount: 'Amount:',
        date: 'Date:',
        reference: 'Reference:'
      }
    };

    const t = texts[language] || texts.ar;
    const isRTL = language === 'ar';

    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
          body { font-family: ${isRTL ? 'Cairo, Arial' : 'Inter, Arial'}, sans-serif; margin: 0; padding: 0; background-color: #f6f6f8; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 20px; text-align: center; }
          .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 20px; text-align: ${isRTL ? 'right' : 'left'}; }
          .message { font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px; text-align: ${isRTL ? 'right' : 'left'}; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">UGC Maroc</div>
          </div>
          <div class="content">
            <h1 class="title">${t.title}</h1>
            <p class="message">${t.message}</p>
            <div class="details">
              <h3>${t.details}</h3>
              <div class="detail-row">
                <span>${t.amount}</span>
                <span>${data.amount} MAD</span>
              </div>
              <div class="detail-row">
                <span>${t.date}</span>
                <span>${data.date}</span>
              </div>
              <div class="detail-row">
                <span>${t.reference}</span>
                <span>${data.reference}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 UGC Maroc. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get new message template
   */
  getNewMessageTemplate(data, language) {
    const texts = {
      ar: {
        title: 'رسالة جديدة',
        message: `لديك رسالة جديدة من ${data.senderName}`,
        preview: 'معاينة الرسالة:',
        cta: 'عرض الرسالة'
      },
      fr: {
        title: 'Nouveau message',
        message: `Vous avez un nouveau message de ${data.senderName}`,
        preview: 'Aperçu du message:',
        cta: 'Voir le message'
      },
      en: {
        title: 'New Message',
        message: `You have a new message from ${data.senderName}`,
        preview: 'Message preview:',
        cta: 'View Message'
      }
    };

    const t = texts[language] || texts.ar;
    const isRTL = language === 'ar';

    return `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
        <style>
          body { font-family: ${isRTL ? 'Cairo, Arial' : 'Inter, Arial'}, sans-serif; margin: 0; padding: 0; background-color: #f6f6f8; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 40px 20px; text-align: center; }
          .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .content { padding: 40px 20px; }
          .title { font-size: 24px; font-weight: bold; color: #1a1a2e; margin-bottom: 20px; text-align: ${isRTL ? 'right' : 'left'}; }
          .message { font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 30px; text-align: ${isRTL ? 'right' : 'left'}; }
          .preview { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">UGC Maroc</div>
          </div>
          <div class="content">
            <h1 class="title">${t.title}</h1>
            <p class="message">${t.message}</p>
            <div class="preview">
              <h3>${t.preview}</h3>
              <p>${data.messagePreview}</p>
            </div>
            <a href="${data.messageUrl}" class="cta-button">${t.cta}</a>
          </div>
          <div class="footer">
            <p>© 2024 UGC Maroc. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get default template for unknown templates
   */
  getDefaultTemplate(data, language) {
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UGC Maroc</title>
      </head>
      <body style="font-family: Cairo, Arial, sans-serif; margin: 0; padding: 20px; background-color: #f6f6f8;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #5020df; text-align: center;">UGC Maroc</h1>
          <p style="color: #666; line-height: 1.6;">مرحباً،</p>
          <p style="color: #666; line-height: 1.6;">شكراً لاستخدام منصة UGC Maroc.</p>
          <p style="color: #666; line-height: 1.6;">© 2024 UGC Maroc. جميع الحقوق محفوظة.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Placeholder methods for other templates
  getPasswordResetTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getLoginSuccessTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getCampaignCreatedTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getApplicationReceivedTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getApplicationAcceptedTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getPaymentFailedTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getWithdrawalRequestedTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getSubmissionReceivedTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getSubmissionApprovedTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getWelcomeTemplate(data, language) { return this.getDefaultTemplate(data, language); }
  getWeeklySummaryTemplate(data, language) { return this.getDefaultTemplate(data, language); }
}

// Export singleton instance
export default new EmailService();
