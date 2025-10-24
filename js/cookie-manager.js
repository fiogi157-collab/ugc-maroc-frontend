/**
 * Gestionnaire de Cookies UGC Maroc
 * Gère les consentements RGPD, l'authentification persistante, et les préférences
 */
class CookieManager {
  constructor() {
    this.apiUrl = window.location.origin + '/api';
    this.consentKey = 'ugc_maroc_consent';
    this.preferencesKey = 'ugc_maroc_preferences';
    this.authKey = 'ugc_maroc_auth';
    this.draftPrefix = 'ugc_maroc_draft_';
    
    // Durées de conservation (en jours)
    this.expiry = {
      auth: 30,
      preferences: 365,
      analytics: 395, // 13 mois
      marketing: 90
    };

    // État du consentement
    this.consent = this.getConsent();
    
    // Initialiser les analytics si consentement donné
    this.initializeAnalytics();
  }

  /**
   * Définir un cookie
   * @param {string} name - Nom du cookie
   * @param {string} value - Valeur du cookie
   * @param {number} days - Durée en jours
   * @param {Object} options - Options supplémentaires
   */
  setCookie(name, value, days = 30, options = {}) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const cookieOptions = {
      expires: expires.toUTCString(),
      path: '/',
      sameSite: 'lax',
      secure: window.location.protocol === 'https:',
      ...options
    };

    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    Object.entries(cookieOptions).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        cookieString += `; ${key}=${val}`;
      }
    });

    document.cookie = cookieString;
  }

  /**
   * Récupérer un cookie
   * @param {string} name - Nom du cookie
   * @returns {string|null} Valeur du cookie ou null
   */
  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  /**
   * Supprimer un cookie
   * @param {string} name - Nom du cookie
   * @param {string} path - Chemin du cookie
   */
  deleteCookie(name, path = '/') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
  }

  /**
   * Récupérer le consentement actuel
   * @returns {Object} Objet de consentement
   */
  getConsent() {
    const stored = localStorage.getItem(this.consentKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Invalid consent data in localStorage');
      }
    }

    // Consentement par défaut (Option B+ - Équilibrée)
    return {
      essential: true,
      functional: true,  // Pré-coché
      analytics: true,   // Pré-coché
      marketing: false,  // Opt-in
      timestamp: Date.now()
    };
  }

  /**
   * Mettre à jour le consentement
   * @param {Object} newConsent - Nouveau consentement
   * @param {string} userId - ID utilisateur (optionnel)
   */
  async updateConsent(newConsent, userId = null) {
    const consent = {
      ...newConsent,
      timestamp: Date.now()
    };

    // Sauvegarder localement
    localStorage.setItem(this.consentKey, JSON.stringify(consent));
    this.consent = consent;

    // Sauvegarder sur le serveur si utilisateur connecté
    if (userId) {
      try {
        await fetch(`${this.apiUrl}/cookies/consent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            ...consent
          })
        });
      } catch (error) {
        console.error('Failed to save consent to server:', error);
      }
    }

    // Recharger les scripts analytics selon le nouveau consentement
    this.initializeAnalytics();

    // Déclencher l'événement de changement de consentement
    window.dispatchEvent(new CustomEvent('consentChanged', { 
      detail: { consent } 
    }));
  }

  /**
   * Vérifier si un type de consentement est donné
   * @param {string} type - Type de consentement
   * @returns {boolean} True si consentement donné
   */
  hasConsent(type) {
    return this.consent[type] === true;
  }

  /**
   * Initialiser les scripts analytics selon le consentement
   */
  initializeAnalytics() {
    // Supprimer les scripts existants
    this.removeAnalyticsScripts();

    // Charger les scripts selon le consentement
    if (this.hasConsent('analytics')) {
      this.loadAnalyticsScripts();
    }

    if (this.hasConsent('marketing')) {
      this.loadMarketingScripts();
    }
  }

  /**
   * Charger les scripts analytics
   */
  loadAnalyticsScripts() {
    // Charger tous les scripts analytics
    this.loadScript('/js/analytics/clarity.js', () => {
      console.log('✅ Microsoft Clarity script loaded');
    });

    this.loadScript('/js/analytics/ga4.js', () => {
      console.log('✅ Google Analytics 4 script loaded');
    });

    this.loadScript('/js/analytics/mixpanel.js', () => {
      console.log('✅ Mixpanel script loaded');
    });

    this.loadScript('/js/analytics/custom-analytics.js', () => {
      console.log('✅ Custom Analytics script loaded');
    });

    // Charger les scripts auto-save
    this.loadScript('/js/auto-save/campaign-drafts.js', () => {
      console.log('✅ Campaign auto-save script loaded');
    });

    this.loadScript('/js/auto-save/gig-drafts.js', () => {
      console.log('✅ Gig auto-save script loaded');
    });

    this.loadScript('/js/auto-save/message-drafts.js', () => {
      console.log('✅ Message auto-save script loaded');
    });

    // Initialiser tous les analytics
    setTimeout(() => {
      const userData = {
        userId: this.getCurrentUserId(),
        role: document.body.dataset.userRole,
        language: this.getPreferences().language
      };

      if (window.clarityAnalytics) {
        window.clarityAnalytics.init(userData);
      }
      if (window.ga4Analytics) {
        window.ga4Analytics.init(userData);
      }
      if (window.mixpanelAnalytics) {
        window.mixpanelAnalytics.init(userData);
      }
      if (window.customAnalytics) {
        window.customAnalytics.init(userData);
      }
    }, 1000);
  }

  /**
   * Charger les scripts marketing (préparés mais désactivés)
   */
  loadMarketingScripts() {
    // Facebook Pixel (désactivé par défaut)
    // this.loadScript('https://connect.facebook.net/en_US/fbevents.js');
    
    // Google Ads (désactivé par défaut)
    // this.loadScript('https://www.googletagmanager.com/gtag/js?id=AW-CONVERSION_ID');
    
    // TikTok Pixel (désactivé par défaut)
    // this.loadScript('https://analytics.tiktok.com/i18n/pixel/events.js');
    
    console.log('📢 Marketing scripts ready for activation');
  }

  /**
   * Supprimer les scripts analytics
   */
  removeAnalyticsScripts() {
    const scripts = document.querySelectorAll('script[src*="clarity"], script[src*="gtag"], script[src*="mixpanel"]');
    scripts.forEach(script => script.remove());
  }

  /**
   * Charger un script dynamiquement
   * @param {string} src - URL du script
   * @param {Function} callback - Callback après chargement
   */
  loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = callback;
    document.head.appendChild(script);
  }

  /**
   * Tracker un événement analytics
   * @param {string} eventName - Nom de l'événement
   * @param {Object} data - Données de l'événement
   */
  trackEvent(eventName, data = {}) {
    if (!this.hasConsent('analytics')) {
      return;
    }

    // Microsoft Clarity
    if (window.clarityAnalytics) {
      window.clarityAnalytics.trackEvent(eventName, data);
    }

    // Google Analytics 4
    if (window.ga4Analytics) {
      window.ga4Analytics.trackEvent(eventName, data);
    }

    // Mixpanel
    if (window.mixpanelAnalytics) {
      window.mixpanelAnalytics.track(eventName, data);
    }

    // Custom Analytics (Supabase)
    if (window.customAnalytics) {
      window.customAnalytics.trackBusinessEvent(eventName, data);
    }
  }

  /**
   * Tracker un événement personnalisé dans Supabase
   * @param {string} eventName - Nom de l'événement
   * @param {Object} data - Données de l'événement
   */
  async trackCustomEvent(eventName, data = {}) {
    try {
      const userId = this.getCurrentUserId();
      
      await fetch(`${this.apiUrl}/cookies/analytics/${userId || 'anonymous'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: eventName,
          event_data: data,
          page_url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to track custom event:', error);
    }
  }

  /**
   * Récupérer l'ID de l'utilisateur actuel
   * @returns {string|null} ID utilisateur ou null
   */
  getCurrentUserId() {
    const authData = this.getAuthData();
    return authData ? authData.userId : null;
  }

  /**
   * Sauvegarder un brouillon
   * @param {string} type - Type de brouillon (campaign, gig, message)
   * @param {Object} data - Données du brouillon
   */
  saveDraft(type, data) {
    if (!this.hasConsent('functional')) {
      return;
    }

    const draftKey = `${this.draftPrefix}${type}`;
    const draftData = {
      data,
      timestamp: Date.now(),
      pageUrl: window.location.href
    };

    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }

  /**
   * Charger un brouillon
   * @param {string} type - Type de brouillon
   * @returns {Object|null} Données du brouillon ou null
   */
  loadDraft(type) {
    if (!this.hasConsent('functional')) {
      return null;
    }

    const draftKey = `${this.draftPrefix}${type}`;
    const stored = localStorage.getItem(draftKey);
    
    if (stored) {
      try {
        const draftData = JSON.parse(stored);
        // Vérifier si le brouillon n'est pas trop ancien (7 jours)
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - draftData.timestamp < maxAge) {
          return draftData.data;
        } else {
          this.clearDraft(type);
        }
      } catch (e) {
        console.warn('Invalid draft data in localStorage');
        this.clearDraft(type);
      }
    }
    
    return null;
  }

  /**
   * Supprimer un brouillon
   * @param {string} type - Type de brouillon
   */
  clearDraft(type) {
    const draftKey = `${this.draftPrefix}${type}`;
    localStorage.removeItem(draftKey);
  }

  /**
   * Sauvegarder les préférences utilisateur
   * @param {Object} preferences - Préférences à sauvegarder
   * @param {string} userId - ID utilisateur (optionnel)
   */
  async savePreferences(preferences, userId = null) {
    // Sauvegarder localement
    localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));

    // Sauvegarder sur le serveur si utilisateur connecté
    if (userId) {
      try {
        await fetch(`${this.apiUrl}/cookies/preferences/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(preferences)
        });
      } catch (error) {
        console.error('Failed to save preferences to server:', error);
      }
    }

    // Appliquer les préférences immédiatement
    this.applyPreferences(preferences);
  }

  /**
   * Récupérer les préférences utilisateur
   * @returns {Object} Préférences utilisateur
   */
  getPreferences() {
    const stored = localStorage.getItem(this.preferencesKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Invalid preferences data in localStorage');
      }
    }

    // Préférences par défaut
    return {
      language: 'ar',
      theme: 'light',
      notifications: true,
      autoSave: true,
      emailNotifications: true,
      pushNotifications: false
    };
  }

  /**
   * Appliquer les préférences utilisateur
   * @param {Object} preferences - Préférences à appliquer
   */
  applyPreferences(preferences) {
    // Appliquer la langue
    if (preferences.language) {
      document.documentElement.lang = preferences.language;
      document.documentElement.dir = preferences.language === 'ar' ? 'rtl' : 'ltr';
    }

    // Appliquer le thème
    if (preferences.theme) {
      document.documentElement.setAttribute('data-theme', preferences.theme);
    }

    // Déclencher l'événement de changement de préférences
    window.dispatchEvent(new CustomEvent('preferencesChanged', { 
      detail: { preferences } 
    }));
  }

  /**
   * Créer un cookie d'authentification
   * @param {string} token - Token d'authentification
   * @param {boolean} rememberMe - Se souvenir de l'utilisateur
   */
  setAuthCookie(token, rememberMe = false) {
    const days = rememberMe ? this.expiry.auth : 1;
    this.setCookie(this.authKey, token, days, {
      httpOnly: false, // Accessible par JS pour vérification
      secure: window.location.protocol === 'https:'
    });
  }

  /**
   * Récupérer les données d'authentification
   * @returns {Object|null} Données d'authentification ou null
   */
  getAuthData() {
    const token = this.getCookie(this.authKey);
    if (!token) return null;

    try {
      // Décoder le JWT (partie payload seulement)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        rememberMe: payload.rememberMe,
        expires: payload.exp
      };
    } catch (e) {
      console.warn('Invalid auth token');
      this.deleteCookie(this.authKey);
      return null;
    }
  }

  /**
   * Supprimer le cookie d'authentification
   */
  clearAuthCookie() {
    this.deleteCookie(this.authKey);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {boolean} True si connecté
   */
  isAuthenticated() {
    const authData = this.getAuthData();
    if (!authData) return false;

    // Vérifier si le token n'est pas expiré
    return authData.expires > Date.now() / 1000;
  }

  /**
   * Révoquer tous les consentements
   */
  revokeAllConsent() {
    // Supprimer tous les cookies non essentiels
    this.deleteCookie(this.preferencesKey);
    this.deleteCookie(this.consentKey);
    
    // Supprimer les données localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ugc_maroc_')) {
        localStorage.removeItem(key);
      }
    });

    // Réinitialiser le consentement
    this.consent = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    };

    // Supprimer les scripts analytics
    this.removeAnalyticsScripts();

    // Déclencher l'événement
    window.dispatchEvent(new CustomEvent('consentRevoked'));
  }

  /**
   * Obtenir le statut complet des cookies
   * @returns {Object} Statut des cookies
   */
  getCookieStatus() {
    return {
      consent: this.consent,
      preferences: this.getPreferences(),
      authenticated: this.isAuthenticated(),
      authData: this.getAuthData(),
      drafts: this.getAllDrafts()
    };
  }

  /**
   * Récupérer tous les brouillons
   * @returns {Object} Tous les brouillons
   */
  getAllDrafts() {
    const drafts = {};
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.draftPrefix)) {
        const type = key.replace(this.draftPrefix, '');
        drafts[type] = this.loadDraft(type);
      }
    });
    return drafts;
  }
}

// Initialiser le gestionnaire de cookies global
window.cookieManager = new CookieManager();

// Exporter pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CookieManager;
}
