// ===========================================================
// 🔧 UGC Maroc - Configuration Centrale
// ===========================================================

// Configuration API Backend - Utilise le domaine actuel
const API_BASE_URL = window.location.origin + "/api";
window.API_BASE_URL = API_BASE_URL;

// Configuration Supabase - Clés mises à jour
const SUPABASE_URL = "https://arfmvtfkibjadxwnbqjl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyZm12dGZraWJqYWR4d25icWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODI0MjAsImV4cCI6MjA3NTY1ODQyMH0.PIWR6lWml5iliG4658nZdaNy1aiF7hgZZUR__NUDOT0";

// Initialisation Supabase Client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export pour utilisation globale
window.supabaseClient = supabaseClient;
console.log('✅ Supabase client initialized');
