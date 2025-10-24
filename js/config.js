// =====================================================
// 🌍 UGC Maroc – Configuration Centrale
// =====================================================

// -------------------------------
// 🔹 BACKEND API CONFIGURATION
// -------------------------------
// Use relative URL for API calls since everything runs on the same server
const API_BASE_URL = window.location.origin;
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
// 🔹 SUPABASE CONFIGURATION
// -------------------------------
// Fetch Supabase configuration from backend API (secure approach)
let supabaseClient = null;

async function initializeSupabase() {
  try {
    const config = await apiRequest('/api/config');
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.error('❌ Supabase configuration missing');
      return null;
    }

    const { createClient } = supabase;
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    window.supabaseClient = supabaseClient;
    
    console.log("✅ Supabase client initialized");
    console.log("✅ API Backend connecté :", API_BASE_URL);
    
    // Emit custom event to notify other scripts that Supabase is ready
    window.dispatchEvent(new CustomEvent('supabaseReady', { detail: { supabaseClient } }));
    
    return supabaseClient;
  } catch (error) {
    console.error("❌ Failed to initialize Supabase:", error);
    return null;
  }
}

// Initialize Supabase when the page loads
if (typeof supabase !== 'undefined') {
  initializeSupabase();
} else {
  console.warn('⚠️ Supabase library not loaded yet. Will initialize when available.');
  // Wait for Supabase library to load
  const checkSupabase = () => {
    if (typeof supabase !== 'undefined') {
      initializeSupabase();
    } else {
      setTimeout(checkSupabase, 100);
    }
  };
  checkSupabase();
}
