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
