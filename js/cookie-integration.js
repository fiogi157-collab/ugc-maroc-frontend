/**
 * Cookie Integration Script
 * UGC Maroc - Intégration globale du système de cookies
 * Ce script doit être ajouté à toutes les pages HTML
 */

// Auto-initialisation du système de cookies
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍪 Initialisation du système de cookies UGC Maroc');
    
    // Vérifier si les scripts cookies sont disponibles
    if (typeof CookieManager === 'undefined') {
        console.error('❌ CookieManager non trouvé. Vérifiez que js/cookie-manager.js est chargé.');
        return;
    }
    
    if (typeof CookieBanner === 'undefined') {
        console.error('❌ CookieBanner non trouvé. Vérifiez que js/cookie-banner.js est chargé.');
        return;
    }
    
    // Initialiser le gestionnaire de cookies
    window.cookieManager = new CookieManager();
    
    // Initialiser la bannière de cookies
    window.cookieBanner = new CookieBanner();
    
    // Vérifier Remember Me si utilisateur non connecté
    if (window.auth && typeof window.auth.checkRememberMe === 'function') {
        window.auth.checkRememberMe().then(success => {
            if (success) {
                console.log('✅ Reconnexion automatique réussie');
                // Optionnel: recharger la page pour mettre à jour l'interface
                // window.location.reload();
            }
        });
    }
    
    console.log('✅ Système de cookies initialisé avec succès');
});

// Fonction utilitaire pour ajouter les scripts cookies à une page
function addCookieScripts() {
    const scripts = [
        '/js/cookie-manager.js',
        '/js/cookie-banner.js',
        '/js/cookie-integration.js'
    ];
    
    scripts.forEach(scriptSrc => {
        if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
            const script = document.createElement('script');
            script.src = scriptSrc;
            script.async = true;
            document.head.appendChild(script);
        }
    });
}

// Fonction pour initialiser les analytics conditionnellement
function initializeAnalytics() {
    if (window.cookieManager && window.cookieManager.hasConsent('analytics')) {
        console.log('📊 Initialisation des analytics avec consentement');
        
        // Les scripts analytics sont déjà chargés par cookie-manager.js
        // Cette fonction peut être utilisée pour des initialisations supplémentaires
    }
}

// Fonction pour initialiser l'auto-save conditionnellement
function initializeAutoSave() {
    if (window.cookieManager && window.cookieManager.hasConsent('functional')) {
        console.log('💾 Initialisation de l\'auto-save avec consentement');
        
        // Les scripts auto-save sont déjà chargés par cookie-manager.js
        // Cette fonction peut être utilisée pour des initialisations supplémentaires
    }
}

// Fonction pour obtenir le statut des cookies
function getCookieStatus() {
    if (!window.cookieManager) return null;
    
    return {
        consent: window.cookieManager.getConsent(),
        preferences: window.cookieManager.getPreferences(),
        hasRememberMe: !!window.cookieManager.getCookie('ugc_remember_me'),
        analyticsEnabled: window.cookieManager.hasConsent('analytics'),
        functionalEnabled: window.cookieManager.hasConsent('functional')
    };
}

// Fonction pour ouvrir les paramètres de cookies
function openCookieSettings() {
    window.location.href = '/cookie-settings.html';
}

// Fonction pour révoquer tous les consentements
function revokeAllConsent() {
    if (window.cookieManager) {
        const consent = {
            essential: true,
            functional: false,
            analytics: false,
            marketing: false
        };
        
        const userId = window.cookieManager.getCurrentUserId();
        window.cookieManager.updateConsent(consent, userId);
        
        console.log('🚫 Tous les consentements révoqués');
    }
}

// Fonction pour accepter tous les cookies
function acceptAllCookies() {
    if (window.cookieManager) {
        const consent = {
            essential: true,
            functional: true,
            analytics: true,
            marketing: false // Marketing reste opt-in
        };
        
        const userId = window.cookieManager.getCurrentUserId();
        window.cookieManager.updateConsent(consent, userId);
        
        console.log('✅ Tous les cookies acceptés');
    }
}

// Exposer les fonctions globalement
window.cookieIntegration = {
    addCookieScripts,
    initializeAnalytics,
    initializeAutoSave,
    getCookieStatus,
    openCookieSettings,
    revokeAllConsent,
    acceptAllCookies
};

// Auto-initialisation si le script est chargé après DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Le code d'initialisation est déjà dans la fonction principale
    });
} else {
    // DOM déjà chargé, initialiser immédiatement
    console.log('🍪 Initialisation immédiate du système de cookies');
    
    if (typeof CookieManager !== 'undefined' && typeof CookieBanner !== 'undefined') {
        window.cookieManager = new CookieManager();
        window.cookieBanner = new CookieBanner();
        
        if (window.auth && typeof window.auth.checkRememberMe === 'function') {
            window.auth.checkRememberMe();
        }
    }
}
