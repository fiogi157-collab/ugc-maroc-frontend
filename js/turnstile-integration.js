// ===========================================================
// 🛡️ UGC Maroc - Turnstile Integration (Anti-bot)
// ===========================================================

// Configuration Turnstile
const TURNSTILE_CONFIG = {
  siteKey: null, // Sera récupéré depuis l'API
  theme: 'auto',
  size: 'normal',
  language: 'fr'
};

// État global Turnstile
let turnstileWidget = null;
let turnstileToken = null;

// Initialiser Turnstile
async function initTurnstile() {
  try {
    // Récupérer la configuration depuis l'API
    const response = await fetch(`${API_BASE_URL}/api/turnstile/config`);
    const data = await response.json();
    
    if (data.success) {
      TURNSTILE_CONFIG.siteKey = data.config.sitekey;
      console.log('✅ Turnstile config loaded');
    } else {
      console.error('❌ Failed to load Turnstile config:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Turnstile init error:', error);
    return false;
  }
  
  return true;
}

// Charger le script Turnstile
function loadTurnstileScript() {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Turnstile script loaded');
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Turnstile script');
      reject(new Error('Turnstile script failed to load'));
    };
    
    document.head.appendChild(script);
  });
}

// Rendre un widget Turnstile
function renderTurnstile(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error('❌ Turnstile container not found:', containerId);
    return null;
  }
  
  if (!window.turnstile) {
    console.error('❌ Turnstile not loaded');
    return null;
  }
  
  if (!TURNSTILE_CONFIG.siteKey) {
    console.error('❌ Turnstile site key not configured');
    return null;
  }
  
  // Configuration du widget
  const widgetConfig = {
    sitekey: TURNSTILE_CONFIG.siteKey,
    theme: options.theme || TURNSTILE_CONFIG.theme,
    size: options.size || TURNSTILE_CONFIG.size,
    language: options.language || TURNSTILE_CONFIG.language,
    callback: (token) => {
      console.log('✅ Turnstile token received');
      turnstileToken = token;
      if (options.onSuccess) options.onSuccess(token);
    },
    'expired-callback': () => {
      console.log('⚠️ Turnstile token expired');
      turnstileToken = null;
      if (options.onExpired) options.onExpired();
    },
    'error-callback': (error) => {
      console.error('❌ Turnstile error:', error);
      turnstileToken = null;
      if (options.onError) options.onError(error);
    }
  };
  
  // Rendre le widget
  turnstileWidget = window.turnstile.render(container, widgetConfig);
  
  return turnstileWidget;
}

// Vérifier un token Turnstile
async function verifyTurnstileToken(token, action = null) {
  try {
    const body = {
      token,
      action,
      remoteip: await getClientIP()
    };
    
    const response = await fetch(`${API_BASE_URL}/api/turnstile/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Turnstile token verified');
      return { success: true, details: data.details };
    } else {
      console.error('❌ Turnstile verification failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('❌ Turnstile verification error:', error);
    return { success: false, error: error.message };
  }
}

// Vérifier avec action spécifique
async function verifyTurnstileAction(token, action) {
  try {
    const body = {
      token,
      action,
      remoteip: await getClientIP()
    };
    
    const response = await fetch(`${API_BASE_URL}/api/turnstile/verify-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Turnstile ${action} verified`);
      return { success: true, action: data.action };
    } else {
      console.error(`❌ Turnstile ${action} verification failed:`, data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error(`❌ Turnstile ${action} verification error:`, error);
    return { success: false, error: error.message };
  }
}

// Obtenir l'IP du client
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('⚠️ Could not get client IP:', error);
    return null;
  }
}

// Reset le widget Turnstile
function resetTurnstile() {
  if (turnstileWidget && window.turnstile) {
    window.turnstile.reset(turnstileWidget);
    turnstileToken = null;
    console.log('🔄 Turnstile widget reset');
  }
}

// Supprimer le widget Turnstile
function removeTurnstile() {
  if (turnstileWidget && window.turnstile) {
    window.turnstile.remove(turnstileWidget);
    turnstileWidget = null;
    turnstileToken = null;
    console.log('🗑️ Turnstile widget removed');
  }
}

// Helper pour les formulaires
function addTurnstileToForm(formId, action = null) {
  const form = document.getElementById(formId);
  if (!form) {
    console.error('❌ Form not found:', formId);
    return;
  }
  
  // Ajouter le container Turnstile
  const turnstileContainer = document.createElement('div');
  turnstileContainer.id = `turnstile-${formId}`;
  turnstileContainer.className = 'turnstile-container';
  
  // Insérer avant le bouton submit
  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  if (submitBtn) {
    submitBtn.parentNode.insertBefore(turnstileContainer, submitBtn);
  } else {
    form.appendChild(turnstileContainer);
  }
  
  // Rendre le widget
  renderTurnstile(`turnstile-${formId}`, {
    onSuccess: (token) => {
      console.log('✅ Turnstile token ready for form submission');
    },
    onExpired: () => {
      console.log('⚠️ Turnstile token expired, please solve again');
    },
    onError: (error) => {
      console.error('❌ Turnstile error:', error);
    }
  });
  
  // Intercepter la soumission du formulaire
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!turnstileToken) {
      alert('Veuillez compléter la vérification anti-bot');
      return;
    }
    
    // Vérifier le token
    const verification = action 
      ? await verifyTurnstileAction(turnstileToken, action)
      : await verifyTurnstileToken(turnstileToken);
    
    if (!verification.success) {
      alert('Vérification anti-bot échouée. Veuillez réessayer.');
      resetTurnstile();
      return;
    }
    
    // Soumettre le formulaire
    const formData = new FormData(form);
    formData.append('turnstile_token', turnstileToken);
    
    // Continuer avec la soumission normale
    form.submit();
  });
}

// Actions prédéfinies pour UGC Maroc
const TURNSTILE_ACTIONS = {
  SIGNUP: 'SIGNUP',
  LOGIN: 'LOGIN',
  CAMPAIGN_SUBMIT: 'CAMPAIGN_SUBMIT',
  GIG_CREATE: 'GIG_CREATE',
  CONTACT: 'CONTACT',
  PASSWORD_RESET: 'PASSWORD_RESET'
};

// Auto-setup pour les pages UGC Maroc
function setupTurnstileForUgcMaroc() {
  // Formulaires d'inscription
  const signupForms = document.querySelectorAll('form[data-turnstile="signup"]');
  signupForms.forEach(form => {
    addTurnstileToForm(form.id, TURNSTILE_ACTIONS.SIGNUP);
  });
  
  // Formulaires de connexion
  const loginForms = document.querySelectorAll('form[data-turnstile="login"]');
  loginForms.forEach(form => {
    addTurnstileToForm(form.id, TURNSTILE_ACTIONS.LOGIN);
  });
  
  // Formulaires de soumission de campagne
  const campaignForms = document.querySelectorAll('form[data-turnstile="campaign"]');
  campaignForms.forEach(form => {
    addTurnstileToForm(form.id, TURNSTILE_ACTIONS.CAMPAIGN_SUBMIT);
  });
  
  // Formulaires de création de gig
  const gigForms = document.querySelectorAll('form[data-turnstile="gig"]');
  gigForms.forEach(form => {
    addTurnstileToForm(form.id, TURNSTILE_ACTIONS.GIG_CREATE);
  });
  
  // Formulaires de contact
  const contactForms = document.querySelectorAll('form[data-turnstile="contact"]');
  contactForms.forEach(form => {
    addTurnstileToForm(form.id, TURNSTILE_ACTIONS.CONTACT);
  });
  
  // Formulaires de reset password
  const resetForms = document.querySelectorAll('form[data-turnstile="reset"]');
  resetForms.forEach(form => {
    addTurnstileToForm(form.id, TURNSTILE_ACTIONS.PASSWORD_RESET);
  });
}

// Initialisation automatique
async function initTurnstileUgcMaroc() {
  console.log('🛡️ Initializing Turnstile for UGC Maroc...');
  
  try {
    // Charger le script
    await loadTurnstileScript();
    
    // Initialiser la configuration
    const configLoaded = await initTurnstile();
    if (!configLoaded) {
      console.error('❌ Failed to load Turnstile configuration');
      return;
    }
    
    // Setup automatique
    setupTurnstileForUgcMaroc();
    
    console.log('✅ Turnstile initialized for UGC Maroc');
  } catch (error) {
    console.error('❌ Turnstile initialization failed:', error);
  }
}

// Exporter les fonctions
window.TurnstileUgcMaroc = {
  init: initTurnstileUgcMaroc,
  render: renderTurnstile,
  verify: verifyTurnstileToken,
  verifyAction: verifyTurnstileAction,
  reset: resetTurnstile,
  remove: removeTurnstile,
  addToForm: addTurnstileToForm,
  setup: setupTurnstileForUgcMaroc,
  ACTIONS: TURNSTILE_ACTIONS
};

// Auto-initialisation si API est prête
if (window.API_BASE_URL) {
  initTurnstileUgcMaroc();
} else {
  window.addEventListener('apiReady', initTurnstileUgcMaroc);
}
