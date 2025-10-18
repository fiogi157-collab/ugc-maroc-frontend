// =====================================================
// 🌍 UGC Maroc – Configuration Centrale
// =====================================================

// -------------------------------
// 🔹 BACKEND API CONFIGURATION
// -------------------------------
const API_BASE_URL = "https://ugc-maroc-backend-q7zna70gs-nabils-projects-e12f0a77.vercel.app"; // ton backend déployé
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
const SUPABASE_URL = "https://arfmvtfxibjdaxwbnqjl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZm12dGZ4aWJqZGF4d2JucWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkwODg4MDcsImV4cCI6MjA0NDY2NDgwN30.CI6brtCwaXOnzDN7IDy30GZ2U9TQ6tHVmA2GZ6zS41I";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

console.log("✅ Supabase client initialized");
console.log("✅ API Backend connecté :", API_BASE_URL);
