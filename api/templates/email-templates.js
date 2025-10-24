/**
 * 📧 UGC Maroc - Templates d'emails professionnels
 * Templates responsives et multilingues pour toutes les notifications
 */

export const emailTemplates = {
  // =====================================================
  // 🔐 AUTHENTIFICATION & COMPTE
  // =====================================================
  
  'welcome': {
    ar: {
      subject: 'مرحباً بك في UGC Maroc - ابدأ رحلتك نحو النجاح',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>مرحباً بك في UGC Maroc</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .tagline { color: rgba(255,255,255,0.9); font-size: 16px; }
            .content { padding: 40px 30px; }
            .welcome-title { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .welcome-text { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .features { background: #f7fafc; padding: 30px; border-radius: 8px; margin: 30px 0; }
            .feature { display: flex; align-items: center; margin-bottom: 15px; }
            .feature-icon { background: #5b13ec; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-left: 15px; }
            .feature-text { color: #2d3748; font-size: 14px; }
            .footer { background: #2d3748; color: white; padding: 30px; text-align: center; font-size: 14px; }
            .social-links { margin: 20px 0; }
            .social-links a { color: white; text-decoration: none; margin: 0 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UGC Maroc</div>
              <div class="tagline">منصة رائدة لصناعة المحتوى في المغرب</div>
            </div>
            
            <div class="content">
              <h1 class="welcome-title">مرحباً {{name}}! 🎉</h1>
              
              <p class="welcome-text">
                أهلاً وسهلاً بك في UGC Maroc، المنصة الأولى في المغرب التي تربط بين العلامات التجارية وصناع المحتوى المبدعين. 
                نحن متحمسون لانضمامك إلينا في هذه الرحلة المثيرة نحو النجاح والتميز.
              </p>
              
              <div class="features">
                <h3 style="color: #2d3748; margin-bottom: 20px; text-align: center;">ما يمكنك تحقيقه معنا:</h3>
                
                <div class="feature">
                  <div class="feature-icon">💰</div>
                  <div class="feature-text">
                    <strong>دخل شهري يصل إلى 12,000 درهم</strong><br>
                    من خلال التعاون مع العلامات التجارية الكبرى
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">🤖</div>
                  <div class="feature-text">
                    <strong>ذكاء اصطناعي متطور</strong><br>
                    لمطابقة مثالية مع المشاريع المناسبة لك
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">🛡️</div>
                  <div class="feature-text">
                    <strong>نظام ضمان آمن 100%</strong><br>
                    استلم أجرك فور إتمام العمل
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">📱</div>
                  <div class="feature-text">
                    <strong>مرونة كاملة</strong><br>
                    اعمل من أي مكان وفي الوقت الذي يناسبك
                  </div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="{{dashboardUrl}}" class="cta-button">ابدأ رحلتك الآن</a>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
                إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا. فريق الدعم متاح 24/7 لمساعدتك.
              </p>
            </div>
            
            <div class="footer">
              <div class="social-links">
                <a href="#">تويتر</a> | 
                <a href="#">إنستغرام</a> | 
                <a href="#">لينكد إن</a>
              </div>
              <p>© 2024 UGC Maroc. جميع الحقوق محفوظة.</p>
              <p>هذا البريد الإلكتروني مرسل إلى {{email}} - إذا لم تطلب هذا البريد، يمكنك تجاهله بأمان.</p>
            </div>
          </div>
        </body>
        </html>
      `
    },
    fr: {
      subject: 'Bienvenue sur UGC Maroc - Commencez votre voyage vers le succès',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur UGC Maroc</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .tagline { color: rgba(255,255,255,0.9); font-size: 16px; }
            .content { padding: 40px 30px; }
            .welcome-title { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .welcome-text { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .features { background: #f7fafc; padding: 30px; border-radius: 8px; margin: 30px 0; }
            .feature { display: flex; align-items: center; margin-bottom: 15px; }
            .feature-icon { background: #5b13ec; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; }
            .feature-text { color: #2d3748; font-size: 14px; }
            .footer { background: #2d3748; color: white; padding: 30px; text-align: center; font-size: 14px; }
            .social-links { margin: 20px 0; }
            .social-links a { color: white; text-decoration: none; margin: 0 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UGC Maroc</div>
              <div class="tagline">Plateforme leader pour la création de contenu au Maroc</div>
            </div>
            
            <div class="content">
              <h1 class="welcome-title">Bienvenue {{name}}! 🎉</h1>
              
              <p class="welcome-text">
                Nous sommes ravis de vous accueillir sur UGC Maroc, la première plateforme au Maroc qui connecte les marques 
                avec des créateurs de contenu talentueux. Nous sommes excités de vous accompagner dans ce voyage passionnant vers le succès.
              </p>
              
              <div class="features">
                <h3 style="color: #2d3748; margin-bottom: 20px; text-align: center;">Ce que vous pouvez accomplir avec nous :</h3>
                
                <div class="feature">
                  <div class="feature-icon">💰</div>
                  <div class="feature-text">
                    <strong>Revenus mensuels jusqu'à 12,000 MAD</strong><br>
                    En collaborant avec les grandes marques
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">🤖</div>
                  <div class="feature-text">
                    <strong>IA avancée</strong><br>
                    Pour un matching parfait avec les projets qui vous conviennent
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">🛡️</div>
                  <div class="feature-text">
                    <strong>Système d'escrow sécurisé 100%</strong><br>
                    Recevez votre paiement dès la livraison
                  </div>
                </div>
                
                <div class="feature">
                  <div class="feature-icon">📱</div>
                  <div class="feature-text">
                    <strong>Flexibilité totale</strong><br>
                    Travaillez de n'importe où, quand vous voulez
                  </div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="{{dashboardUrl}}" class="cta-button">Commencez votre voyage</a>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
                Si vous avez des questions, n'hésitez pas à nous contacter. Notre équipe de support est disponible 24/7.
              </p>
            </div>
            
            <div class="footer">
              <div class="social-links">
                <a href="#">Twitter</a> | 
                <a href="#">Instagram</a> | 
                <a href="#">LinkedIn</a>
              </div>
              <p>© 2024 UGC Maroc. Tous droits réservés.</p>
              <p>Cet email a été envoyé à {{email}} - Si vous n'avez pas demandé cet email, vous pouvez l'ignorer en toute sécurité.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },

  'signup-confirmation': {
    ar: {
      subject: 'تأكيد حسابك في UGC Maroc',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تأكيد حسابك</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .title { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .text { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .verification-box { background: #f7fafc; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px dashed #5b13ec; }
            .footer { background: #2d3748; color: white; padding: 30px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UGC Maroc</div>
            </div>
            
            <div class="content">
              <h1 class="title">تأكيد حسابك 📧</h1>
              
              <p class="text">
                مرحباً {{name}}،<br><br>
                شكراً لك على التسجيل في UGC Maroc! لتفعيل حسابك والبدء في رحلتك نحو النجاح، 
                يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني.
              </p>
              
              <div class="verification-box">
                <h3 style="color: #2d3748; margin-bottom: 15px;">تأكيد البريد الإلكتروني</h3>
                <p style="color: #4a5568; margin-bottom: 20px;">انقر على الزر أدناه لتفعيل حسابك</p>
                <a href="{{verificationUrl}}" class="cta-button">تأكيد حسابي</a>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center;">
                إذا لم تطلب هذا البريد الإلكتروني، يمكنك تجاهله بأمان. 
                الرابط صالح لمدة 24 ساعة فقط.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 UGC Maroc. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },

  // =====================================================
  // 💰 PAIEMENTS & FINANCES
  // =====================================================
  
  'payment-successful': {
    ar: {
      subject: 'تم الدفع بنجاح - {{amount}} MAD',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>تم الدفع بنجاح</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .title { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .success-icon { font-size: 60px; text-align: center; margin: 20px 0; }
            .amount-box { background: #f0fdf4; border: 2px solid #10b981; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; }
            .amount { color: #10b981; font-size: 36px; font-weight: bold; margin-bottom: 10px; }
            .details { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { color: #4a5568; font-weight: bold; }
            .detail-value { color: #2d3748; }
            .footer { background: #2d3748; color: white; padding: 30px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UGC Maroc</div>
            </div>
            
            <div class="content">
              <div class="success-icon">✅</div>
              <h1 class="title">تم الدفع بنجاح!</h1>
              
              <div class="amount-box">
                <div class="amount">{{amount}} MAD</div>
                <p style="color: #059669; font-size: 16px; margin: 0;">تم الدفع بنجاح</p>
              </div>
              
              <div class="details">
                <h3 style="color: #2d3748; margin-bottom: 20px;">تفاصيل الدفع:</h3>
                <div class="detail-row">
                  <span class="detail-label">رقم المرجع:</span>
                  <span class="detail-value">{{reference}}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">تاريخ الدفع:</span>
                  <span class="detail-value">{{date}}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">طريقة الدفع:</span>
                  <span class="detail-value">Stripe</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">الحالة:</span>
                  <span class="detail-value" style="color: #10b981; font-weight: bold;">مكتمل</span>
                </div>
              </div>
              
              <p style="color: #4a5568; font-size: 16px; text-align: center; margin-top: 30px;">
                شكراً لك على ثقتك في UGC Maroc. يمكنك الآن متابعة مشروعك في لوحة التحكم.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 UGC Maroc. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },

  // =====================================================
  // 💬 MESSAGES & NOTIFICATIONS
  // =====================================================
  
  'new-message': {
    ar: {
      subject: 'رسالة جديدة من {{senderName}}',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>رسالة جديدة</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .title { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .message-box { background: #f7fafc; padding: 30px; border-radius: 8px; margin: 30px 0; border-right: 4px solid #5b13ec; }
            .sender { color: #5b13ec; font-weight: bold; font-size: 18px; margin-bottom: 15px; }
            .message-preview { color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #2d3748; color: white; padding: 30px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UGC Maroc</div>
            </div>
            
            <div class="content">
              <h1 class="title">رسالة جديدة 📩</h1>
              
              <div class="message-box">
                <div class="sender">من: {{senderName}}</div>
                <div class="message-preview">{{messagePreview}}</div>
              </div>
              
              <div style="text-align: center;">
                <a href="{{messageUrl}}" class="cta-button">قراءة الرسالة</a>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
                لا تنس تفعيل الإشعارات لتحصل على تحديثات فورية حول مشاريعك.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 UGC Maroc. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },

  // =====================================================
  // 🎯 CAMPAGNES & PROJETS
  // =====================================================
  
  'campaign-created': {
    ar: {
      subject: 'تم إنشاء حملتك بنجاح - {{campaignTitle}}',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>حملة جديدة</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .title { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .campaign-box { background: #f7fafc; padding: 30px; border-radius: 8px; margin: 30px 0; border: 2px solid #5b13ec; }
            .campaign-title { color: #5b13ec; font-size: 20px; font-weight: bold; margin-bottom: 15px; }
            .campaign-details { color: #4a5568; font-size: 16px; line-height: 1.6; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #2d3748; color: white; padding: 30px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UGC Maroc</div>
            </div>
            
            <div class="content">
              <h1 class="title">حملة جديدة تم إنشاؤها! 🎯</h1>
              
              <div class="campaign-box">
                <div class="campaign-title">{{campaignTitle}}</div>
                <div class="campaign-details">
                  <p><strong>الميزانية:</strong> {{budget}} MAD</p>
                  <p><strong>الموعد النهائي:</strong> {{deadline}}</p>
                  <p><strong>الوصف:</strong> {{description}}</p>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="{{campaignUrl}}" class="cta-button">عرض الحملة</a>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
                سيتم إشعار المبدعين المناسبين تلقائياً. يمكنك متابعة التقدم من لوحة التحكم.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 UGC Maroc. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  },

  // =====================================================
  // 📊 RAPPORTS & ANALYTICS
  // =====================================================
  
  'monthly-report': {
    ar: {
      subject: 'تقريرك الشهري - {{month}} {{year}}',
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>التقرير الشهري</title>
          <style>
            body { font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); padding: 40px 20px; text-align: center; }
            .logo { color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .title { color: #1a202c; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .stat-box { background: #f7fafc; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #e2e8f0; }
            .stat-number { color: #5b13ec; font-size: 28px; font-weight: bold; margin-bottom: 5px; }
            .stat-label { color: #4a5568; font-size: 14px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #5b13ec 0%, #00b7ff 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { background: #2d3748; color: white; padding: 30px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">UGC Maroc</div>
            </div>
            
            <div class="content">
              <h1 class="title">تقريرك الشهري 📊</h1>
              <p style="color: #4a5568; font-size: 16px; text-align: center; margin-bottom: 30px;">
                إليك ملخص أدائك لشهر {{month}} {{year}}
              </p>
              
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-number">{{projectsCompleted}}</div>
                  <div class="stat-label">مشروع مكتمل</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">{{totalEarnings}} MAD</div>
                  <div class="stat-label">إجمالي الأرباح</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">{{averageRating}}/5</div>
                  <div class="stat-label">متوسط التقييم</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">{{newClients}}</div>
                  <div class="stat-label">عميل جديد</div>
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="{{reportUrl}}" class="cta-button">عرض التقرير الكامل</a>
              </div>
              
              <p style="color: #718096; font-size: 14px; text-align: center; margin-top: 30px;">
                استمر في التميز! نحن فخورون بإنجازاتك هذا الشهر.
              </p>
            </div>
            
            <div class="footer">
              <p>© 2024 UGC Maroc. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  }
};

/**
 * Remplacer les variables dans un template
 * @param {string} template - Le template HTML
 * @param {object} data - Les données à remplacer
 * @returns {string} - Le template avec les variables remplacées
 */
export function replaceTemplateVariables(template, data = {}) {
  let result = template;
  
  // Remplacer toutes les variables {{variable}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  
  return result;
}

/**
 * Obtenir un template d'email
 * @param {string} templateName - Nom du template
 * @param {string} language - Langue (ar, fr, en)
 * @param {object} data - Données à remplacer
 * @returns {object} - {subject, html}
 */
export function getEmailTemplate(templateName, language = 'ar', data = {}) {
  const template = emailTemplates[templateName];
  
  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }
  
  const langTemplate = template[language] || template.ar;
  
  if (!langTemplate) {
    throw new Error(`Language '${language}' not found for template '${templateName}'`);
  }
  
  return {
    subject: replaceTemplateVariables(langTemplate.subject, data),
    html: replaceTemplateVariables(langTemplate.html, data)
  };
}
