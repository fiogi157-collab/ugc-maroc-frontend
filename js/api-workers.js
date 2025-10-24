// ===========================================================
// 🌐 UGC Maroc - API Client Workers (JWT)
// ===========================================================

// Fonction helper pour appels API avec authentification JWT
async function apiCall(endpoint, options = {}) {
  try {
    const token = getAuthToken();
    
    if (!token && !endpoint.includes('/auth/')) {
      throw new Error('Non authentifié. Veuillez vous connecter.');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Gérer erreur 401 (non authentifié)
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/auth/creator-login.html';
      throw new Error('Session expirée');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Erreur API');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur API:', error);
    return { success: false, error: error.message };
  }
}

// ===========================================================
// 👤 API CRÉATEUR
// ===========================================================

// Récupérer les campagnes disponibles
async function getAvailableCampaigns() {
  const result = await apiCall('/api/campaigns/cached');
  return result;
}

// Récupérer les gigs du créateur
async function getCreatorGigs() {
  const result = await apiCall('/api/gigs/cached');
  return result;
}

// Créer un nouveau gig
async function createGig(gigData) {
  const result = await apiCall('/api/gigs', {
    method: 'POST',
    body: JSON.stringify(gigData)
  });
  return result;
}

// Mettre à jour un gig
async function updateGig(gigId, gigData) {
  const result = await apiCall(`/api/gigs/${gigId}`, {
    method: 'PUT',
    body: JSON.stringify(gigData)
  });
  return result;
}

// Supprimer un gig
async function deleteGig(gigId) {
  const result = await apiCall(`/api/gigs/${gigId}`, {
    method: 'DELETE'
  });
  return result;
}

// Soumettre une candidature pour une campagne
async function applyToCampaign(campaignId, applicationData) {
  const result = await apiCall(`/api/campaigns/${campaignId}/apply`, {
    method: 'POST',
    body: JSON.stringify(applicationData)
  });
  return result;
}

// Récupérer les soumissions du créateur
async function getCreatorSubmissions() {
  const result = await apiCall('/api/submissions');
  return result;
}

// Soumettre du contenu pour une campagne
async function submitContent(campaignId, contentData) {
  const result = await apiCall(`/api/campaigns/${campaignId}/submit`, {
    method: 'POST',
    body: JSON.stringify(contentData)
  });
  return result;
}

// ===========================================================
// 🏢 API BRAND
// ===========================================================

// Créer une nouvelle campagne
async function createCampaign(campaignData) {
  const result = await apiCall('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify(campaignData)
  });
  return result;
}

// Mettre à jour une campagne
async function updateCampaign(campaignId, campaignData) {
  const result = await apiCall(`/api/campaigns/${campaignId}`, {
    method: 'PUT',
    body: JSON.stringify(campaignData)
  });
  return result;
}

// Récupérer les campagnes de la marque
async function getBrandCampaigns() {
  const result = await apiCall('/api/campaigns');
  return result;
}

// Récupérer les détails d'une campagne
async function getCampaignDetails(campaignId) {
  const result = await apiCall(`/api/campaigns/${campaignId}`);
  return result;
}

// Rechercher des créateurs
async function searchCreators(searchParams) {
  const queryString = new URLSearchParams(searchParams).toString();
  const result = await apiCall(`/api/search?${queryString}`);
  return result;
}

// Récupérer les créateurs populaires
async function getTopCreators() {
  const result = await apiCall('/api/creators/top');
  return result;
}

// ===========================================================
// 💰 API PAIEMENTS
// ===========================================================

// Créer un payment intent
async function createPaymentIntent(amount, currency = 'MAD', metadata = {}) {
  const result = await apiCall('/api/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      currency,
      ...metadata
    })
  });
  return result;
}

// Confirmer un paiement
async function confirmPayment(paymentIntentId, paymentMethodId) {
  const result = await apiCall('/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({
      payment_intent_id: paymentIntentId,
      payment_method_id: paymentMethodId
    })
  });
  return result;
}

// Récupérer l'historique des paiements
async function getPaymentHistory() {
  const result = await apiCall('/api/payments');
  return result;
}

// ===========================================================
// 📊 API ANALYTICS
// ===========================================================

// Récupérer les statistiques
async function getAnalyticsStats() {
  const result = await apiCall('/api/analytics/stats');
  return result;
}

// Récupérer les métriques d'une campagne
async function getCampaignMetrics(campaignId) {
  const result = await apiCall(`/api/campaigns/${campaignId}/metrics`);
  return result;
}

// ===========================================================
// 🔍 API RECHERCHE
// ===========================================================

// Recherche globale
async function globalSearch(query, type = 'all') {
  const result = await apiCall(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
  return result;
}

// ===========================================================
// 💬 API MESSAGES (quand Durable Objects sera activé)
// ===========================================================

// Récupérer les conversations
async function getConversations() {
  const result = await apiCall('/api/chat/conversations');
  return result;
}

// Créer une nouvelle conversation
async function createConversation(participants, type = 'direct', title = null) {
  const result = await apiCall('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({
      participants,
      type,
      title
    })
  });
  return result;
}

// Récupérer les messages d'une conversation
async function getMessages(conversationId, limit = 50, offset = 0) {
  const result = await apiCall(`/api/chat/${conversationId}/messages?limit=${limit}&offset=${offset}`);
  return result;
}

// Envoyer un message
async function sendMessage(conversationId, content, type = 'text') {
  const result = await apiCall(`/api/chat/${conversationId}/send`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      type
    })
  });
  return result;
}

// ===========================================================
// 🎛️ API FEATURE FLAGS
// ===========================================================

// Récupérer les feature flags
async function getFeatureFlags() {
  const result = await apiCall('/api/features');
  return result;
}

// ===========================================================
// 📁 API UPLOAD R2
// ===========================================================

// Uploader un fichier vers R2
async function uploadFile(file, folder = 'uploads') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Erreur upload');
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Erreur upload:', error);
    return { success: false, error: error.message };
  }
}

// ===========================================================
// 🔧 UTILITAIRES
// ===========================================================

// Fonction pour formater les dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Fonction pour formater les montants
function formatAmount(amount, currency = 'MAD') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Fonction pour valider un email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Fonction pour valider un mot de passe
function isValidPassword(password) {
  return password.length >= 8;
}

// Exporter toutes les fonctions pour utilisation globale
window.apiCall = apiCall;
window.getAvailableCampaigns = getAvailableCampaigns;
window.getCreatorGigs = getCreatorGigs;
window.createGig = createGig;
window.updateGig = updateGig;
window.deleteGig = deleteGig;
window.applyToCampaign = applyToCampaign;
window.getCreatorSubmissions = getCreatorSubmissions;
window.submitContent = submitContent;
window.createCampaign = createCampaign;
window.updateCampaign = updateCampaign;
window.getBrandCampaigns = getBrandCampaigns;
window.getCampaignDetails = getCampaignDetails;
window.searchCreators = searchCreators;
window.getTopCreators = getTopCreators;
window.createPaymentIntent = createPaymentIntent;
window.confirmPayment = confirmPayment;
window.getPaymentHistory = getPaymentHistory;
window.getAnalyticsStats = getAnalyticsStats;
window.getCampaignMetrics = getCampaignMetrics;
window.globalSearch = globalSearch;
window.getConversations = getConversations;
window.createConversation = createConversation;
window.getMessages = getMessages;
window.sendMessage = sendMessage;
window.getFeatureFlags = getFeatureFlags;
window.uploadFile = uploadFile;
window.formatDate = formatDate;
window.formatAmount = formatAmount;
window.isValidEmail = isValidEmail;
window.isValidPassword = isValidPassword;
