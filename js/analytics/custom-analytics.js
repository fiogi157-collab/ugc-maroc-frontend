/**
 * Custom Analytics System
 * UGC Maroc - Analytics personnalisées avec Supabase
 */
class CustomAnalytics {
  constructor() {
    this.apiUrl = window.location.origin + '/api';
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();
    this.eventQueue = [];
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 secondes
  }

  /**
   * Initialiser Custom Analytics
   * @param {Object} userData - Données utilisateur
   */
  init(userData = {}) {
    if (this.isInitialized) return;

    // Vérifier le consentement analytics
    if (!window.cookieManager || !window.cookieManager.hasConsent('analytics')) {
      console.log('🔒 Custom Analytics blocked: No analytics consent');
      return;
    }

    this.userData = userData;
    this.isInitialized = true;
    
    // Démarrer le flush automatique
    this.startAutoFlush();
    
    console.log('✅ Custom Analytics initialized');
  }

  /**
   * Générer un ID de session unique
   * @returns {string} ID de session
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  /**
   * Tracker un événement
   * @param {string} eventType - Type d'événement
   * @param {Object} eventData - Données de l'événement
   */
  track(eventType, eventData = {}) {
    if (!this.isInitialized) return;

    const event = {
      event_type: eventType,
      event_data: eventData,
      user_id: this.userData.userId || null,
      session_id: this.sessionId,
      page_url: window.location.href,
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      platform: 'ugc-maroc',
      version: '1.0.0'
    };

    // Ajouter à la queue
    this.eventQueue.push(event);

    // Flush si la queue est pleine
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }

    console.log(`📊 Custom Analytics event queued: ${eventType}`, eventData);
  }

  /**
   * Envoyer les événements en batch
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.apiUrl}/cookies/analytics/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: events,
          session_id: this.sessionId
        })
      });

      if (response.ok) {
        console.log(`✅ Custom Analytics: ${events.length} events sent`);
      } else {
        console.error('❌ Custom Analytics: Failed to send events');
        // Remettre les événements en queue en cas d'erreur
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('❌ Custom Analytics error:', error);
      // Remettre les événements en queue en cas d'erreur
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Démarrer le flush automatique
   */
  startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Tracker un événement métier UGC
   * @param {string} businessEvent - Événement métier
   * @param {Object} businessData - Données métier
   */
  trackBusinessEvent(businessEvent, businessData = {}) {
    const businessEvents = {
      // Campagnes
      'campaign_created': 'Campaign Created',
      'campaign_viewed': 'Campaign Viewed',
      'campaign_applied': 'Campaign Applied',
      'campaign_accepted': 'Campaign Accepted',
      'campaign_rejected': 'Campaign Rejected',
      
      // Gigs
      'gig_created': 'Gig Created',
      'gig_viewed': 'Gig Viewed',
      'gig_ordered': 'Gig Ordered',
      'gig_delivered': 'Gig Delivered',
      
      // Négociations
      'negotiation_started': 'Negotiation Started',
      'negotiation_message_sent': 'Negotiation Message Sent',
      'negotiation_completed': 'Negotiation Completed',
      'negotiation_cancelled': 'Negotiation Cancelled',
      
      // Vidéos
      'video_uploaded': 'Video Uploaded',
      'video_viewed': 'Video Viewed',
      'video_approved': 'Video Approved',
      'video_rejected': 'Video Rejected',
      'video_downloaded': 'Video Downloaded',
      
      // Paiements
      'payment_initiated': 'Payment Initiated',
      'payment_completed': 'Payment Completed',
      'payment_failed': 'Payment Failed',
      'withdrawal_requested': 'Withdrawal Requested',
      'withdrawal_completed': 'Withdrawal Completed',
      
      // Utilisateurs
      'user_registered': 'User Registered',
      'user_logged_in': 'User Logged In',
      'user_logged_out': 'User Logged Out',
      'profile_updated': 'Profile Updated',
      
      // Navigation
      'page_viewed': 'Page Viewed',
      'search_performed': 'Search Performed',
      'filter_applied': 'Filter Applied',
      'sort_applied': 'Sort Applied',
      
      // Erreurs
      'error_occurred': 'Error Occurred',
      'upload_failed': 'Upload Failed',
      'payment_error': 'Payment Error'
    };

    const eventName = businessEvents[businessEvent] || businessEvent;
    
    this.track(eventName, {
      business_event: businessEvent,
      ...businessData
    });
  }

  /**
   * Tracker une conversion
   * @param {string} conversionType - Type de conversion
   * @param {Object} conversionData - Données de conversion
   */
  trackConversion(conversionType, conversionData = {}) {
    this.track('Conversion', {
      conversion_type: conversionType,
      conversion_value: conversionData.value,
      currency: conversionData.currency || 'MAD',
      ...conversionData
    });
  }

  /**
   * Tracker un funnel
   * @param {string} funnelName - Nom du funnel
   * @param {string} step - Étape
   * @param {Object} stepData - Données de l'étape
   */
  trackFunnel(funnelName, step, stepData = {}) {
    this.track('Funnel Step', {
      funnel_name: funnelName,
      funnel_step: step,
      step_number: stepData.stepNumber,
      step_duration: stepData.duration,
      ...stepData
    });
  }

  /**
   * Tracker la performance
   * @param {string} performanceType - Type de performance
   * @param {Object} performanceData - Données de performance
   */
  trackPerformance(performanceType, performanceData = {}) {
    this.track('Performance', {
      performance_type: performanceType,
      load_time: performanceData.loadTime,
      render_time: performanceData.renderTime,
      api_response_time: performanceData.apiResponseTime,
      ...performanceData
    });
  }

  /**
   * Tracker un événement d'erreur
   * @param {string} errorType - Type d'erreur
   * @param {Object} errorData - Données de l'erreur
   */
  trackError(errorType, errorData = {}) {
    this.track('Error', {
      error_type: errorType,
      error_message: errorData.message,
      error_code: errorData.code,
      error_stack: errorData.stack,
      ...errorData
    });
  }

  /**
   * Tracker un événement de timing
   * @param {string} timingName - Nom du timing
   * @param {number} duration - Durée en millisecondes
   * @param {Object} timingData - Données du timing
   */
  trackTiming(timingName, duration, timingData = {}) {
    this.track('Timing', {
      timing_name: timingName,
      duration: duration,
      ...timingData
    });
  }

  /**
   * Tracker un événement de cohorte
   * @param {string} cohortName - Nom de la cohorte
   * @param {Object} cohortData - Données de la cohorte
   */
  trackCohort(cohortName, cohortData = {}) {
    this.track('Cohort', {
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
    this.track('Retention', {
      retention_type: retentionType,
      days_since_signup: retentionData.daysSinceSignup,
      retention_rate: retentionData.rate,
      ...retentionData
    });
  }

  /**
   * Obtenir les statistiques de session
   * @returns {Object} Statistiques de session
   */
  getSessionStats() {
    return {
      sessionId: this.sessionId,
      eventsQueued: this.eventQueue.length,
      isInitialized: this.isInitialized,
      userData: this.userData
    };
  }

  /**
   * Forcer l'envoi des événements
   */
  async forceFlush() {
    await this.flush();
  }

  /**
   * Vérifier si Custom Analytics est disponible
   * @returns {boolean} True si disponible
   */
  isAvailable() {
    return this.isInitialized;
  }
}

// Initialiser Custom Analytics
window.customAnalytics = new CustomAnalytics();

// Auto-initialiser si consentement déjà donné
document.addEventListener('DOMContentLoaded', () => {
  if (window.cookieManager && window.cookieManager.hasConsent('analytics')) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.customAnalytics.init(userData);
  }
});

// Écouter les changements de consentement
window.addEventListener('consentChanged', (event) => {
  const { consent } = event.detail;
  
  if (consent.analytics && !window.customAnalytics.isInitialized) {
    const userData = {
      userId: window.cookieManager.getCurrentUserId(),
      role: document.body.dataset.userRole,
      language: window.cookieManager.getPreferences().language
    };
    
    window.customAnalytics.init(userData);
  }
});

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomAnalytics;
}
