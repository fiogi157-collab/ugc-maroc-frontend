// =====================================================
// 🌍 UGC Maroc – Configuration Centrale
// =====================================================

// -------------------------------
// 🔹 BACKEND API CONFIGURATION
// -------------------------------
// Cloudflare Workers API URL
const API_BASE_URL = 'https://ugc-maroc-api.fiogi157.workers.dev';
window.API_BASE_URL = API_BASE_URL;

// Helper pour requêtes API (login, signup, etc.)
async function apiRequest(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
    return await res.json();
  } catch (err) {
    console.error("❌ Erreur de communication avec le backend:", err);
    return { success: false, message: "Erreur serveur" };
  }
}

// -------------------------------
// 🔹 CLOUDFLARE WORKERS API CONFIGURATION
// -------------------------------
// API is now handled by Cloudflare Workers with D1 database
console.log("✅ API Backend connecté :", API_BASE_URL);
console.log("✅ Cloudflare Workers + D1 configuration active");

// Emit custom event to notify other scripts that API is ready
window.dispatchEvent(new CustomEvent('apiReady', { detail: { apiUrl: API_BASE_URL } }));

// ===========================================================
// 🔄 MIGRATION SUPABASE → WORKERS
// ===========================================================

// Fonction pour détecter si l'utilisateur a un token Supabase
function hasSupabaseToken() {
  const supabaseToken = localStorage.getItem('supabase.auth.token');
  return supabaseToken !== null;
}

// Fonction pour migrer les données Supabase vers Workers
async function migrateSupabaseToWorkers() {
  if (!hasSupabaseToken()) {
    console.log('ℹ️ Aucune session Supabase à migrer');
    return;
  }

  try {
    console.log('🔄 Migration session Supabase → Workers...');
    
    // Récupérer les données Supabase
    const supabaseSession = JSON.parse(localStorage.getItem('supabase.auth.token'));
    const supabaseUser = supabaseSession?.currentSession?.user;
    
    if (!supabaseUser) {
      console.log('ℹ️ Aucun utilisateur Supabase trouvé');
      return;
    }

    // Nettoyer les données Supabase
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refresh_token');
    
    console.log('✅ Migration terminée - utilisez Workers API maintenant');
    
    // Rediriger vers la page de connexion pour re-authentification
    window.location.href = '/auth/creator-login.html';
    
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

// Exécuter la migration au chargement
migrateSupabaseToWorkers();
