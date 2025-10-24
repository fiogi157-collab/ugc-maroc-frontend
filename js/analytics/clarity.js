/**
 * Microsoft Clarity Analytics Integration
 * UGC Maroc - Analytics avec consentement RGPD
 */
class ClarityAnalytics {
  constructor() {
    this.projectId = 'ugc-maroc';
    this.isLoaded = false;
    this.isInitialized = false;
  }

  /**
   * Initialiser Microsoft Clarity
   * @param {Object} userData - Données utilisateur
   */
  init(userData = {}) {
    if (this.isInitialized) return;

    // Vérifier le consentement analytics
    if (!window.cookieManager || !window.cookieManager.hasConsent('analytics')) {
      console.log('🔒 Clarity blocked: No analytics consent');
      return;
    }

    this.loadScript(() => {
      this.setupClarity(userData);
      this.isInitialized = true;
      console.log('✅ Microsoft Clarity initialized');
    });
  }

  /**
   * Charger le script Clarity
   * @param {Function} callback - Callback après chargement
   */
  loadScript(callback) {
    if (this.isLoaded) {
      callback();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${this.projectId}");
    `;
    
    document.head.appendChild(script);
    this.isLoaded = true;
    
    // Attendre que Clarity soit disponible
    const checkClarity = () => {
      if (window.clarity) {
        callback();
      } else {
        setTimeout(checkClarity, 100);
      }
    };
    checkClarity();
  }

  /**
   * Configurer Clarity avec les données utilisateur
   * @param {Object} userData - Données utilisateur
   */
  setupClarity(userData) {
    if (!window.clarity) return;

    // Configuration de base
    window.clarity('set', 'projectId', this.projectId);
    
    // Tags personnalisés pour segmentation
    if (userData.userId) {
      window.clarity('set', 'userId', userData.userId);
    }
    
    if (userData.role) {
      window.clarity('set', 'userType', userData.role);
    }
    
    if (userData.language) {
      window.clarity('set', 'language', userData.language);
    }

    // Configuration pour UGC Maroc
    window.clarity('set', 'platform', 'ugc-maroc');
    window.clarity('set', 'version', '1.0.0');
  }

  /**
   * Tracker un événement personnalisé
   * @param {string} eventName - Nom de l'événement
   * @param {Object} data - Données de l'événement
   */
  trackEvent(eventName, data = {}) {
    if (!this.isInitialized || !window.clarity) return;

    // Événements métier UGC Maroc
    const ugcEvents = {
      // Campagnes
      'campaign_viewed': 'Campaign Viewed',
      'campaign_created': 'Campaign Created',
      'campaign_applied': 'Campaign Applied',
      'campaign_accepted': 'Campaign Accepted',
      
      // Gigs
      'gig_viewed': 'Gig Viewed',
      'gig_created': 'Gig Created',
      'gig_ordered': 'Gig Ordered',
      
      // Négociations
      'negotiation_started': 'Negotiation Started',
      'negotiation_message_sent': 'Negotiation Message Sent',
      'negotiation_completed': 'Negotiation Completed',
      
      // Vidéos
      'video_uploaded': 'Video Uploaded',
      'video_viewed': 'Video Viewed',
      'video_approved': 'Video Approved',
      'video_rejected': 'Video Rejected',
      
      // Paiements
      'payment_initiated': 'Payment Initiated',
      'payment_completed': 'Payment Completed',
      'withdrawal_requested': 'Withdrawal Requested',
      
      // Navigation
      'page_viewed': 'Page Viewed',
      'search_performed': 'Search Performed',
      'filter_applied': 'Filter Applied',
      
      // Erreurs
      'error_occurred': 'Error Occurred',
      'upload_failed': 'Upload Failed'
    };

    const clarityEventName = ugcEvents[eventName] || eventName;
    
    // Tracker l'événement
    window.clarity('event', clarityEventName);
    
    // Ajouter des données contextuelles si disponibles
    if (data.category) {
      window.clarity('set', 'category', data.category);
    }
    
    if (data.value) {
      window.clarity('set', 'value', data.value);
    }

    console.log(`📊 Clarity event tracked: ${clarityEventName}`, data);
  }

  /**
   * Identifier un utilisateur
   * @param {string} userId - ID utilisateur
   * @param {Object} userProperties - Propriétés utilisateur
   */
  identify(userId, userProperties = {}) {
    if (!this.isInitialized || !window.clarity) return;

    window.clarity('set', 'userId', userId);
    
    // Propriétés utilisateur
    Object.entries(userProperties).forEach(([key, value]) => {
      window.clarity('set', key, value);
    });

    console.log(`👤 Clarity user identified: ${userId}`, userProperties);
  }

  /**
   * Définir une propriété personnalisée
   * @param {string} key - Clé de la propriété
   * @param {*} value - Valeur de la propriété
   */
  setProperty(key, value) {
    if (!this.isInitialized || !window.clarity) return;
    
    window.clarity('set', key, value);
  }

  /**
   * Tracker une conversion
   * @param {string} conversionType - Type de conversion
   * @param {Object} conversionData - Données de conversion
   */
  trackConversion(conversionType, conversionData = {}) {
    if (!this.isInitialized || !window.clarity) return;

    const conversionEvents = {
      'campaign_application': 'Campaign Application',
      'gig_purchase': 'Gig Purchase',
      'video_approval': 'Video Approval',
      'payment_completion': 'Payment Completion',
      'withdrawal_request': 'Withdrawal Request'
    };

    const clarityConversionName = conversionEvents[conversionType] || conversionType;
    
    window.clarity('event', clarityConversionName);
    
    // Données de conversion
    if (conversionData.value) {
      window.clarity('set', 'conversionValue', conversionData.value);
    }
    
    if (conversionData.currency) {
      window.clarity('set', 'currency', conversionData.currency);
    }

    console.log(`💰 Clarity conversion tracked: ${clarityConversionName}`, conversionData);
  }

  /**
   * Tracker une erreur
   * @param {string} errorType - Type d'erreur
   * @param {Object} errorData - Données de l'erreur
   */
  trackError(errorType, errorData = {}) {
    if (!this.isInitialized || !window.clarity) return;

    window.clarity('event', 'Error Occurred');
    window.clarity('set', 'errorType', errorType);
    
    if (errorData.message) {
      window.clarity('set', 'errorMessage', errorData.message);
    }
    
    if (errorData.code) {
      window.clarity('set', 'errorCode', errorData.code);
    }

    console.log(`❌ Clarity error tracked: ${errorType}`, errorData);
  }

  /**
   * Vérifier si Clarity est disponible
   * @returns {boolean} True si disponible
   */
  isAvailable() {
    return this.isInitialized && window.clarity;
  }

  /**
   * Obtenir les données de session
   * @returns {Object} Données de session Clarity
   */
  getSessionData() {
    if (!this.isAvailable()) return null;
    
    return {
      projectId: this.projectId,
      isLoaded: this.isLoaded,
      isInitialized: this.isInitialized
    };
  }
}

// Initialiser Clarity Analytics
window.clarityAnalytics = new ClarityAnalytics();

// Auto-initialiser si consentement déjà donné
document.addEventListener('DOMContentLoaded', () => {
  if (window.cookieManager && window.cookieManager.hasConsent('analytics')) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.clarityAnalytics.init(userData);
  }
});

// Écouter les changements de consentement
window.addEventListener('consentChanged', (event) => {
  const { consent } = event.detail;
  
  if (consent.analytics && !window.clarityAnalytics.isInitialized) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.clarityAnalytics.init(userData);
  }
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClarityAnalytics;
}
