/**
 * Google Analytics 4 Integration
 * UGC Maroc - Analytics avec consentement RGPD
 */
class GA4Analytics {
  constructor() {
    this.measurementId = 'GA_MEASUREMENT_ID'; // À remplacer par votre ID
    this.isLoaded = false;
    this.isInitialized = false;
    this.dataLayer = window.dataLayer || [];
  }

  /**
   * Initialiser Google Analytics 4
   * @param {Object} userData - Données utilisateur
   */
  init(userData = {}) {
    if (this.isInitialized) return;

    // Vérifier le consentement analytics
    if (!window.cookieManager || !window.cookieManager.hasConsent('analytics')) {
      console.log('🔒 GA4 blocked: No analytics consent');
      return;
    }

    this.loadScript(() => {
      this.setupGA4(userData);
      this.isInitialized = true;
      console.log('✅ Google Analytics 4 initialized');
    });
  }

  /**
   * Charger le script GA4
   * @param {Function} callback - Callback après chargement
   */
  loadScript(callback) {
    if (this.isLoaded) {
      callback();
      return;
    }

    // Initialiser dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());

    // Charger le script GA4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    script.onload = callback;
    document.head.appendChild(script);
    
    this.isLoaded = true;
  }

  /**
   * Configurer GA4 avec les données utilisateur
   * @param {Object} userData - Données utilisateur
   */
  setupGA4(userData) {
    if (!window.gtag) return;

    // Configuration de base
    window.gtag('config', this.measurementId, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure',
      send_page_view: false, // Nous gérons manuellement
      custom_map: {
        'custom_parameter_1': 'user_role',
        'custom_parameter_2': 'user_language',
        'custom_parameter_3': 'platform_version'
      }
    });

    // User properties
    if (userData.userId) {
      window.gtag('set', 'user_id', userData.userId);
    }
    
    if (userData.role) {
      window.gtag('set', 'user_role', userData.role);
    }
    
    if (userData.language) {
      window.gtag('set', 'user_language', userData.language);
    }

    // Propriétés personnalisées UGC Maroc
    window.gtag('set', 'platform', 'ugc-maroc');
    window.gtag('set', 'platform_version', '1.0.0');
    window.gtag('set', 'user_type', userData.role || 'anonymous');

    // Envoyer page view initial
    this.trackPageView();
  }

  /**
   * Tracker une page view
   * @param {string} pagePath - Chemin de la page
   * @param {string} pageTitle - Titre de la page
   */
  trackPageView(pagePath = null, pageTitle = null) {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: pagePath || window.location.pathname,
      page_title: pageTitle || document.title,
      page_location: window.location.href
    });

    console.log('📄 GA4 page view tracked:', pagePath || window.location.pathname);
  }

  /**
   * Tracker un événement personnalisé
   * @param {string} eventName - Nom de l'événement
   * @param {Object} parameters - Paramètres de l'événement
   */
  trackEvent(eventName, parameters = {}) {
    if (!this.isInitialized || !window.gtag) return;

    // Événements métier UGC Maroc
    const eventConfig = this.getEventConfig(eventName, parameters);
    
    window.gtag('event', eventName, eventConfig);
    
    console.log(`📊 GA4 event tracked: ${eventName}`, eventConfig);
  }

  /**
   * Obtenir la configuration d'un événement
   * @param {string} eventName - Nom de l'événement
   * @param {Object} parameters - Paramètres
   * @returns {Object} Configuration de l'événement
   */
  getEventConfig(eventName, parameters) {
    const baseConfig = {
      event_category: 'UGC Maroc',
      platform: 'ugc-maroc',
      ...parameters
    };

    // Configurations spécifiques par événement
    const eventConfigs = {
      // Campagnes
      'campaign_viewed': {
        event_category: 'Campaign',
        event_label: parameters.campaignId,
        value: parameters.budget
      },
      'campaign_created': {
        event_category: 'Campaign',
        event_label: 'Campaign Created',
        value: parameters.budget
      },
      'campaign_applied': {
        event_category: 'Campaign',
        event_label: parameters.campaignId,
        value: parameters.budget
      },
      
      // Gigs
      'gig_viewed': {
        event_category: 'Gig',
        event_label: parameters.gigId,
        value: parameters.price
      },
      'gig_created': {
        event_category: 'Gig',
        event_label: 'Gig Created',
        value: parameters.price
      },
      'gig_ordered': {
        event_category: 'Gig',
        event_label: parameters.gigId,
        value: parameters.price
      },
      
      // Négociations
      'negotiation_started': {
        event_category: 'Negotiation',
        event_label: parameters.negotiationId
      },
      'negotiation_message_sent': {
        event_category: 'Negotiation',
        event_label: parameters.negotiationId
      },
      
      // Vidéos
      'video_uploaded': {
        event_category: 'Video',
        event_label: parameters.videoId,
        value: parameters.fileSize
      },
      'video_viewed': {
        event_category: 'Video',
        event_label: parameters.videoId
      },
      'video_approved': {
        event_category: 'Video',
        event_label: parameters.videoId,
        value: parameters.amount
      },
      
      // Paiements
      'payment_initiated': {
        event_category: 'Payment',
        event_label: parameters.paymentId,
        value: parameters.amount,
        currency: 'MAD'
      },
      'payment_completed': {
        event_category: 'Payment',
        event_label: parameters.paymentId,
        value: parameters.amount,
        currency: 'MAD'
      },
      'withdrawal_requested': {
        event_category: 'Withdrawal',
        event_label: parameters.withdrawalId,
        value: parameters.amount,
        currency: 'MAD'
      },
      
      // Navigation
      'search_performed': {
        event_category: 'Search',
        event_label: parameters.query,
        search_term: parameters.query
      },
      'filter_applied': {
        event_category: 'Filter',
        event_label: parameters.filterType
      },
      
      // Erreurs
      'error_occurred': {
        event_category: 'Error',
        event_label: parameters.errorType,
        error_message: parameters.message
      }
    };

    return { ...baseConfig, ...eventConfigs[eventName] };
  }

  /**
   * Tracker une conversion e-commerce
   * @param {Object} transactionData - Données de transaction
   */
  trackPurchase(transactionData) {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'purchase', {
      transaction_id: transactionData.transactionId,
      value: transactionData.value,
      currency: transactionData.currency || 'MAD',
      items: transactionData.items || []
    });

    console.log('💰 GA4 purchase tracked:', transactionData);
  }

  /**
   * Tracker un item ajouté au panier
   * @param {Object} itemData - Données de l'item
   */
  trackAddToCart(itemData) {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'add_to_cart', {
      currency: 'MAD',
      value: itemData.price,
      items: [{
        item_id: itemData.itemId,
        item_name: itemData.name,
        item_category: itemData.category,
        price: itemData.price,
        quantity: 1
      }]
    });

    console.log('🛒 GA4 add to cart tracked:', itemData);
  }

  /**
   * Identifier un utilisateur
   * @param {string} userId - ID utilisateur
   * @param {Object} userProperties - Propriétés utilisateur
   */
  identify(userId, userProperties = {}) {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('set', 'user_id', userId);
    
    // Propriétés utilisateur
    Object.entries(userProperties).forEach(([key, value]) => {
      window.gtag('set', key, value);
    });

    console.log(`👤 GA4 user identified: ${userId}`, userProperties);
  }

  /**
   * Définir une propriété personnalisée
   * @param {string} key - Clé de la propriété
   * @param {*} value - Valeur de la propriété
   */
  setProperty(key, value) {
    if (!this.isInitialized || !window.gtag) return;
    
    window.gtag('set', key, value);
  }

  /**
   * Tracker une erreur
   * @param {string} errorType - Type d'erreur
   * @param {Object} errorData - Données de l'erreur
   */
  trackError(errorType, errorData = {}) {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'exception', {
      description: errorData.message || errorType,
      fatal: errorData.fatal || false,
      error_type: errorType,
      error_code: errorData.code
    });

    console.log(`❌ GA4 error tracked: ${errorType}`, errorData);
  }

  /**
   * Tracker un timing
   * @param {string} name - Nom du timing
   * @param {number} value - Valeur en millisecondes
   * @param {string} category - Catégorie du timing
   */
  trackTiming(name, value, category = 'Performance') {
    if (!this.isInitialized || !window.gtag) return;

    window.gtag('event', 'timing_complete', {
      name: name,
      value: value,
      event_category: category
    });

    console.log(`⏱️ GA4 timing tracked: ${name} = ${value}ms`);
  }

  /**
   * Vérifier si GA4 est disponible
   * @returns {boolean} True si disponible
   */
  isAvailable() {
    return this.isInitialized && window.gtag;
  }

  /**
   * Obtenir les données de session
   * @returns {Object} Données de session GA4
   */
  getSessionData() {
    if (!this.isAvailable()) return null;
    
    return {
      measurementId: this.measurementId,
      isLoaded: this.isLoaded,
      isInitialized: this.isInitialized,
      dataLayer: this.dataLayer
    };
  }
}

// Initialiser GA4 Analytics
window.ga4Analytics = new GA4Analytics();

// Auto-initialiser si consentement déjà donné
document.addEventListener('DOMContentLoaded', () => {
  if (window.cookieManager && window.cookieManager.hasConsent('analytics')) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.ga4Analytics.init(userData);
  }
});

// Écouter les changements de consentement
window.addEventListener('consentChanged', (event) => {
  const { consent } = event.detail;
  
  if (consent.analytics && !window.ga4Analytics.isInitialized) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.ga4Analytics.init(userData);
  }
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GA4Analytics;
}
