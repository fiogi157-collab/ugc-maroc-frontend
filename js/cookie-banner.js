/**
 * Bannière de Consentement RGPD UGC Maroc
 * Interface utilisateur pour la gestion des cookies et consentements
 */
class CookieBanner {
  constructor() {
    this.bannerId = 'ugc-cookie-banner';
    this.modalId = 'ugc-cookie-modal';
    this.isVisible = false;
    this.hasShownBanner = localStorage.getItem('ugc_cookie_banner_shown') === 'true';
    
    // Textes multilingues
    this.texts = {
      ar: {
        title: 'نحن نستخدم ملفات تعريف الارتباط',
        description: 'نحن نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا، وتحليل حركة المرور، وتخصيص المحتوى. يمكنك اختيار أنواع ملفات تعريف الارتباط التي تريد قبولها.',
        acceptAll: 'قبول الكل',
        rejectAll: 'رفض الكل',
        customize: 'تخصيص',
        learnMore: 'تعرف على المزيد',
        essential: 'ضرورية',
        functional: 'وظيفية',
        analytics: 'تحليلية',
        marketing: 'تسويقية'
      },
      fr: {
        title: 'Nous utilisons des cookies',
        description: 'Nous utilisons des cookies pour améliorer votre expérience sur notre site, analyser le trafic et personnaliser le contenu. Vous pouvez choisir quels types de cookies vous souhaitez accepter.',
        acceptAll: 'Tout accepter',
        rejectAll: 'Tout refuser',
        customize: 'Personnaliser',
        learnMore: 'En savoir plus',
        essential: 'Essentiels',
        functional: 'Fonctionnels',
        analytics: 'Analytiques',
        marketing: 'Marketing'
      },
      en: {
        title: 'We use cookies',
        description: 'We use cookies to improve your experience on our site, analyze traffic, and personalize content. You can choose which types of cookies you want to accept.',
        acceptAll: 'Accept All',
        rejectAll: 'Reject All',
        customize: 'Customize',
        learnMore: 'Learn More',
        essential: 'Essential',
        functional: 'Functional',
        analytics: 'Analytics',
        marketing: 'Marketing'
      }
    };

    this.currentLanguage = this.getCurrentLanguage();
    this.init();
  }

  /**
   * Initialiser la bannière
   */
  init() {
    // Ne pas afficher si déjà montrée et consentement donné
    if (this.hasShownBanner && window.cookieManager.hasConsent('essential')) {
      return;
    }

    // Attendre que le DOM soit chargé
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.showBanner());
    } else {
      this.showBanner();
    }
  }

  /**
   * Afficher la bannière
   */
  showBanner() {
    if (this.isVisible) return;

    this.createBanner();
    this.createModal();
    this.isVisible = true;
    this.hasShownBanner = true;
    localStorage.setItem('ugc_cookie_banner_shown', 'true');

    // Animation d'entrée
    setTimeout(() => {
      const banner = document.getElementById(this.bannerId);
      if (banner) {
        banner.classList.add('show');
      }
    }, 100);
  }

  /**
   * Créer la bannière HTML
   */
  createBanner() {
    const texts = this.texts[this.currentLanguage];
    
    const bannerHTML = `
      <div id="${this.bannerId}" class="cookie-banner">
        <div class="cookie-banner-content">
          <div class="cookie-banner-text">
            <h3 class="cookie-banner-title">${texts.title}</h3>
            <p class="cookie-banner-description">${texts.description}</p>
          </div>
          <div class="cookie-banner-actions">
            <button class="cookie-btn cookie-btn-secondary" onclick="window.cookieBanner.rejectAll()">
              ${texts.rejectAll}
            </button>
            <button class="cookie-btn cookie-btn-customize" onclick="window.cookieBanner.showModal()">
              ${texts.customize}
            </button>
            <button class="cookie-btn cookie-btn-primary" onclick="window.cookieBanner.acceptAll()">
              ${texts.acceptAll}
            </button>
          </div>
        </div>
      </div>
    `;

    // Ajouter les styles CSS
    this.addStyles();
    
    // Ajouter la bannière au DOM
    document.body.insertAdjacentHTML('beforeend', bannerHTML);
  }

  /**
   * Créer le modal de personnalisation
   */
  createModal() {
    const texts = this.texts[this.currentLanguage];
    
    const modalHTML = `
      <div id="${this.modalId}" class="cookie-modal">
        <div class="cookie-modal-overlay" onclick="window.cookieBanner.hideModal()"></div>
        <div class="cookie-modal-content">
          <div class="cookie-modal-header">
            <h2 class="cookie-modal-title">${texts.title}</h2>
            <button class="cookie-modal-close" onclick="window.cookieBanner.hideModal()">&times;</button>
          </div>
          <div class="cookie-modal-body">
            <p class="cookie-modal-description">${texts.description}</p>
            
            <div class="cookie-categories">
              <div class="cookie-category">
                <div class="cookie-category-header">
                  <h3>${texts.essential}</h3>
                  <div class="cookie-toggle disabled">
                    <input type="checkbox" checked disabled>
                    <span class="cookie-slider"></span>
                  </div>
                </div>
                <p class="cookie-category-description">
                  ${this.getCategoryDescription('essential')}
                </p>
              </div>

              <div class="cookie-category">
                <div class="cookie-category-header">
                  <h3>${texts.functional}</h3>
                  <div class="cookie-toggle">
                    <input type="checkbox" id="functional-toggle" checked>
                    <span class="cookie-slider"></span>
                  </div>
                </div>
                <p class="cookie-category-description">
                  ${this.getCategoryDescription('functional')}
                </p>
              </div>

              <div class="cookie-category">
                <div class="cookie-category-header">
                  <h3>${texts.analytics}</h3>
                  <div class="cookie-toggle">
                    <input type="checkbox" id="analytics-toggle" checked>
                    <span class="cookie-slider"></span>
                  </div>
                </div>
                <p class="cookie-category-description">
                  ${this.getCategoryDescription('analytics')}
                </p>
              </div>

              <div class="cookie-category">
                <div class="cookie-category-header">
                  <h3>${texts.marketing}</h3>
                  <div class="cookie-toggle">
                    <input type="checkbox" id="marketing-toggle">
                    <span class="cookie-slider"></span>
                  </div>
                </div>
                <p class="cookie-category-description">
                  ${this.getCategoryDescription('marketing')}
                </p>
              </div>
            </div>
          </div>
          <div class="cookie-modal-footer">
            <button class="cookie-btn cookie-btn-secondary" onclick="window.cookieBanner.rejectAll()">
              ${texts.rejectAll}
            </button>
            <button class="cookie-btn cookie-btn-primary" onclick="window.cookieBanner.savePreferences()">
              ${texts.acceptAll}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Obtenir la description d'une catégorie de cookies
   * @param {string} category - Catégorie de cookie
   * @returns {string} Description
   */
  getCategoryDescription(category) {
    const descriptions = {
      ar: {
        essential: 'هذه الملفات ضرورية لتشغيل الموقع ولا يمكن تعطيلها. تشمل ملفات الجلسة والمصادقة.',
        functional: 'تساعد هذه الملفات على تحسين وظائف الموقع مثل تذكر تفضيلاتك وإعداداتك.',
        analytics: 'نستخدم هذه الملفات لفهم كيفية استخدامك للموقع وتحسين تجربتك.',
        marketing: 'نستخدم هذه الملفات لعرض الإعلانات المناسبة لك على مواقع أخرى.'
      },
      fr: {
        essential: 'Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés. Ils incluent les cookies de session et d\'authentification.',
        functional: 'Ces cookies aident à améliorer les fonctionnalités du site comme mémoriser vos préférences et paramètres.',
        analytics: 'Nous utilisons ces cookies pour comprendre comment vous utilisez le site et améliorer votre expérience.',
        marketing: 'Nous utilisons ces cookies pour afficher des publicités pertinentes sur d\'autres sites.'
      },
      en: {
        essential: 'These cookies are necessary for the website to function and cannot be disabled. They include session and authentication cookies.',
        functional: 'These cookies help improve website functionality like remembering your preferences and settings.',
        analytics: 'We use these cookies to understand how you use the site and improve your experience.',
        marketing: 'We use these cookies to show you relevant advertisements on other sites.'
      }
    };

    return descriptions[this.currentLanguage][category];
  }

  /**
   * Accepter tous les cookies
   */
  acceptAll() {
    const consent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };

    this.updateConsent(consent);
    this.hideBanner();
  }

  /**
   * Rejeter tous les cookies sauf essentiels
   */
  rejectAll() {
    const consent = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };

    this.updateConsent(consent);
    this.hideBanner();
  }

  /**
   * Sauvegarder les préférences personnalisées
   */
  savePreferences() {
    const functionalToggle = document.getElementById('functional-toggle');
    const analyticsToggle = document.getElementById('analytics-toggle');
    const marketingToggle = document.getElementById('marketing-toggle');

    const consent = {
      essential: true,
      functional: functionalToggle ? functionalToggle.checked : true,
      analytics: analyticsToggle ? analyticsToggle.checked : true,
      marketing: marketingToggle ? marketingToggle.checked : false
    };

    this.updateConsent(consent);
    this.hideModal();
    this.hideBanner();
  }

  /**
   * Mettre à jour le consentement
   * @param {Object} consent - Nouveau consentement
   */
  async updateConsent(consent) {
    const userId = window.cookieManager.getCurrentUserId();
    await window.cookieManager.updateConsent(consent, userId);
    
    // Déclencher l'événement de consentement
    window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
      detail: { consent }
    }));
  }

  /**
   * Afficher le modal
   */
  showModal() {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  /**
   * Masquer le modal
   */
  hideModal() {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }

  /**
   * Masquer la bannière
   */
  hideBanner() {
    const banner = document.getElementById(this.bannerId);
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
    this.isVisible = false;
  }

  /**
   * Obtenir la langue actuelle
   * @returns {string} Code de langue
   */
  getCurrentLanguage() {
    const preferences = window.cookieManager.getPreferences();
    return preferences.language || 'ar';
  }

  /**
   * Ajouter les styles CSS
   */
  addStyles() {
    if (document.getElementById('cookie-banner-styles')) return;

    const styles = `
      <style id="cookie-banner-styles">
        /* Bannière de cookies */
        .cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #5B13EC 0%, #1E40AF 100%);
          color: white;
          padding: 20px;
          z-index: 10000;
          transform: translateY(100%);
          transition: transform 0.3s ease-in-out;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
        }

        .cookie-banner.show {
          transform: translateY(0);
        }

        .cookie-banner-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .cookie-banner-text {
          flex: 1;
          min-width: 300px;
        }

        .cookie-banner-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .cookie-banner-description {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
          line-height: 1.4;
        }

        .cookie-banner-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cookie-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .cookie-btn-primary {
          background: #10B981;
          color: white;
        }

        .cookie-btn-primary:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .cookie-btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .cookie-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .cookie-btn-customize {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .cookie-btn-customize:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Modal de cookies */
        .cookie-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10001;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .cookie-modal.show {
          display: flex;
        }

        .cookie-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .cookie-modal-content {
          position: relative;
          background: white;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .cookie-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 0 24px;
        }

        .cookie-modal-title {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #1F2937;
        }

        .cookie-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6B7280;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .cookie-modal-close:hover {
          background: #F3F4F6;
        }

        .cookie-modal-body {
          padding: 24px;
          max-height: 50vh;
          overflow-y: auto;
        }

        .cookie-modal-description {
          margin: 0 0 24px 0;
          color: #6B7280;
          line-height: 1.5;
        }

        .cookie-categories {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .cookie-category {
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 20px;
          background: #FAFAFA;
        }

        .cookie-category-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .cookie-category-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1F2937;
        }

        .cookie-category-description {
          margin: 0;
          color: #6B7280;
          font-size: 14px;
          line-height: 1.4;
        }

        /* Toggle switches */
        .cookie-toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .cookie-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .cookie-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.2s;
          border-radius: 24px;
        }

        .cookie-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.2s;
          border-radius: 50%;
        }

        .cookie-toggle input:checked + .cookie-slider {
          background-color: #10B981;
        }

        .cookie-toggle input:checked + .cookie-slider:before {
          transform: translateX(26px);
        }

        .cookie-toggle.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cookie-toggle.disabled .cookie-slider {
          cursor: not-allowed;
        }

        .cookie-modal-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding: 0 24px 24px 24px;
        }

        .cookie-modal-footer .cookie-btn {
          color: #374151;
        }

        .cookie-modal-footer .cookie-btn-primary {
          background: #5B13EC;
          color: white;
        }

        .cookie-modal-footer .cookie-btn-primary:hover {
          background: #4C1D95;
        }

        .cookie-modal-footer .cookie-btn-secondary {
          background: #F3F4F6;
          color: #374151;
          border: 1px solid #D1D5DB;
        }

        .cookie-modal-footer .cookie-btn-secondary:hover {
          background: #E5E7EB;
        }

        /* Support RTL */
        [dir="rtl"] .cookie-banner-content {
          direction: rtl;
        }

        [dir="rtl"] .cookie-banner-actions {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .cookie-modal-header {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .cookie-category-header {
          flex-direction: row-reverse;
        }

        [dir="rtl"] .cookie-modal-footer {
          flex-direction: row-reverse;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .cookie-banner-content {
            flex-direction: column;
            text-align: center;
          }

          .cookie-banner-actions {
            justify-content: center;
            width: 100%;
          }

          .cookie-btn {
            flex: 1;
            min-width: 120px;
          }

          .cookie-modal-content {
            margin: 10px;
            max-height: 90vh;
          }

          .cookie-modal-header {
            padding: 20px 20px 0 20px;
          }

          .cookie-modal-body {
            padding: 20px;
          }

          .cookie-modal-footer {
            padding: 0 20px 20px 20px;
            flex-direction: column;
          }

          .cookie-modal-footer .cookie-btn {
            width: 100%;
          }
        }

        /* Animation pour modal */
        .modal-open {
          overflow: hidden;
        }

        .cookie-modal.show .cookie-modal-content {
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }
}

// Initialiser la bannière de cookies
window.cookieBanner = new CookieBanner();

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieBanner;
}
