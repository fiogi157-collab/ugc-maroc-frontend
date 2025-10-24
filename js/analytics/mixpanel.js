/**
 * Mixpanel Analytics Integration
 * UGC Maroc - Analytics avec consentement RGPD
 */
class MixpanelAnalytics {
  constructor() {
    this.token = 'MIXPANEL_TOKEN'; // À remplacer par votre token
    this.isLoaded = false;
    this.isInitialized = false;
  }

  /**
   * Initialiser Mixpanel
   * @param {Object} userData - Données utilisateur
   */
  init(userData = {}) {
    if (this.isInitialized) return;

    // Vérifier le consentement analytics
    if (!window.cookieManager || !window.cookieManager.hasConsent('analytics')) {
      console.log('🔒 Mixpanel blocked: No analytics consent');
      return;
    }

    this.loadScript(() => {
      this.setupMixpanel(userData);
      this.isInitialized = true;
      console.log('✅ Mixpanel initialized');
    });
  }

  /**
   * Charger le script Mixpanel
   * @param {Function} callback - Callback après chargement
   */
  loadScript(callback) {
    if (this.isLoaded) {
      callback();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
    script.onload = callback;
    document.head.appendChild(script);
    
    this.isLoaded = true;
  }

  /**
   * Configurer Mixpanel avec les données utilisateur
   * @param {Object} userData - Données utilisateur
   */
  setupMixpanel(userData) {
    if (!window.mixpanel) return;

    // Initialiser Mixpanel
    window.mixpanel.init(this.token, {
      api_host: 'https://api-eu.mixpanel.com',
      batch_requests: true,
      persistence: 'localStorage',
      cross_subdomain_cookie: false,
      secure_cookie: window.location.protocol === 'https:'
    });

    // Configuration pour UGC Maroc
    window.mixpanel.register({
      platform: 'ugc-maroc',
      version: '1.0.0',
      language: userData.language || 'ar',
      user_type: userData.role || 'anonymous'
    });

    // Identifier l'utilisateur si connecté
    if (userData.userId) {
      this.identify(userData.userId, userData);
    }
  }

  /**
   * Tracker un événement
   * @param {string} eventName - Nom de l'événement
   * @param {Object} properties - Propriétés de l'événement
   */
  track(eventName, properties = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    // Propriétés de base pour tous les événements
    const baseProperties = {
      platform: 'ugc-maroc',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      ...properties
    };

    window.mixpanel.track(eventName, baseProperties);
    
    console.log(`📊 Mixpanel event tracked: ${eventName}`, baseProperties);
  }

  /**
   * Identifier un utilisateur
   * @param {string} userId - ID utilisateur
   * @param {Object} userProperties - Propriétés utilisateur
   */
  identify(userId, userProperties = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    window.mixpanel.identify(userId);
    
    // Définir les propriétés utilisateur
    window.mixpanel.people.set({
      $first_name: userProperties.firstName,
      $last_name: userProperties.lastName,
      $email: userProperties.email,
      $created: userProperties.createdAt,
      user_role: userProperties.role,
      user_language: userProperties.language,
      platform: 'ugc-maroc',
      last_seen: new Date().toISOString()
    });

    console.log(`👤 Mixpanel user identified: ${userId}`, userProperties);
  }

  /**
   * Définir des propriétés utilisateur
   * @param {Object} properties - Propriétés à définir
   */
  setUserProperties(properties) {
    if (!this.isInitialized || !window.mixpanel) return;

    window.mixpanel.people.set(properties);
  }

  /**
   * Incrémenter une propriété numérique
   * @param {string} property - Nom de la propriété
   * @param {number} value - Valeur à ajouter
   */
  increment(property, value = 1) {
    if (!this.isInitialized || !window.mixpanel) return;

    window.mixpanel.people.increment(property, value);
  }

  /**
   * Tracker un événement de conversion
   * @param {string} conversionType - Type de conversion
   * @param {Object} conversionData - Données de conversion
   */
  trackConversion(conversionType, conversionData = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    const conversionEvents = {
      'campaign_application': 'Campaign Application',
      'gig_purchase': 'Gig Purchase',
      'video_approval': 'Video Approval',
      'payment_completion': 'Payment Completion',
      'withdrawal_request': 'Withdrawal Request',
      'user_registration': 'User Registration',
      'first_campaign': 'First Campaign',
      'first_gig': 'First Gig'
    };

    const eventName = conversionEvents[conversionType] || conversionType;
    
    this.track(eventName, {
      conversion_type: conversionType,
      conversion_value: conversionData.value,
      currency: conversionData.currency || 'MAD',
      ...conversionData
    });

    // Incrémenter les compteurs de conversion
    this.increment('total_conversions');
    this.increment(`conversions_${conversionType}`);
    
    if (conversionData.value) {
      this.increment('total_revenue', conversionData.value);
    }
  }

  /**
   * Tracker un funnel de conversion
   * @param {string} funnelName - Nom du funnel
   * @param {string} step - Étape du funnel
   * @param {Object} stepData - Données de l'étape
   */
  trackFunnel(funnelName, step, stepData = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    this.track('Funnel Step', {
      funnel_name: funnelName,
      funnel_step: step,
      step_number: stepData.stepNumber,
      step_duration: stepData.duration,
      ...stepData
    });

    console.log(`🔄 Mixpanel funnel tracked: ${funnelName} - ${step}`);
  }

  /**
   * Tracker une cohorte
   * @param {string} cohortName - Nom de la cohorte
   * @param {Object} cohortData - Données de la cohorte
   */
  trackCohort(cohortName, cohortData = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    this.track('Cohort Event', {
      cohort_name: cohortName,
      cohort_date: cohortData.date,
      cohort_size: cohortData.size,
      ...cohortData
    });
  }

  /**
   * Tracker la rétention
   * @param {string} retentionType - Type de rétention
   * @param {Object} retentionData - Données de rétention
   */
  trackRetention(retentionType, retentionData = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    this.track('Retention Event', {
      retention_type: retentionType,
      days_since_signup: retentionData.daysSinceSignup,
      retention_rate: retentionData.rate,
      ...retentionData
    });
  }

  /**
   * Tracker un A/B test
   * @param {string} testName - Nom du test
   * @param {string} variant - Variante
   * @param {Object} testData - Données du test
   */
  trackABTest(testName, variant, testData = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    this.track('A/B Test', {
      test_name: testName,
      variant: variant,
      test_group: testData.group,
      ...testData
    });
  }

  /**
   * Tracker un événement de performance
   * @param {string} performanceType - Type de performance
   * @param {Object} performanceData - Données de performance
   */
  trackPerformance(performanceType, performanceData = {}) {
    if (!this.isInitialized || !window.mixpanel) return;

    this.track('Performance Event', {
      performance_type: performanceType,
      load_time: performanceData.loadTime,
      render_time: performanceData.renderTime,
      ...performanceData
    });
  }

  /**
   * Créer un alias pour un utilisateur
   * @param {string} alias - Alias
   * @param {string} distinctId - ID distinct
   */
  alias(alias, distinctId) {
    if (!this.isInitialized || !window.mixpanel) return;

    window.mixpanel.alias(alias, distinctId);
  }

  /**
   * Réinitialiser l'utilisateur
   */
  reset() {
    if (!this.isInitialized || !window.mixpanel) return;

    window.mixpanel.reset();
  }

  /**
   * Obtenir les données de session
   * @returns {Object} Données de session Mixpanel
   */
  getSessionData() {
    if (!this.isAvailable()) return null;
    
    return {
      token: this.token,
      isLoaded: this.isLoaded,
      isInitialized: this.isInitialized,
      distinctId: window.mixpanel.get_distinct_id()
    };
  }

  /**
   * Vérifier si Mixpanel est disponible
   * @returns {boolean} True si disponible
   */
  isAvailable() {
    return this.isInitialized && window.mixpanel;
  }
}

// Initialiser Mixpanel Analytics
window.mixpanelAnalytics = new MixpanelAnalytics();

// Auto-initialiser si consentement déjà donné
document.addEventListener('DOMContentLoaded', () => {
  if (window.cookieManager && window.cookieManager.hasConsent('analytics')) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.mixpanelAnalytics.init(userData);
  }
});

// Écouter les changements de consentement
window.addEventListener('consentChanged', (event) => {
  const { consent } = event.detail;
  
  if (consent.analytics && !window.mixpanelAnalytics.isInitialized) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.mixpanelAnalytics.init(userData);
  }
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MixpanelAnalytics;
}
