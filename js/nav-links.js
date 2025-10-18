// =====================================================
// 🌍 UGC Maroc – Navigation intelligente + Auth Supabase
// =====================================================

// ES6 imports removed for compatibility - using window.supabaseClient from config.js instead

async function performAuthCheck() {
  console.log('✅ nav-links.js - performing auth check');

  if (!window.supabaseClient) {
    console.log('⚠️ Supabase client not available — skipping auth check');
    return;
  }

  // Vérifie si un utilisateur est connecté
  const { data: { user } } = await window.supabaseClient.auth.getUser();

  if (user) {
    const role = user.user_metadata?.role || localStorage.getItem('user_role') || 'unknown';
    console.log(`👤 Utilisateur connecté : ${user.email} (${role})`);

    // Redirection automatique selon le rôle
    if (role === 'creator') {
      window.location.href = '/creator/creator_dashboard_1.html';
      return;
    } else if (role === 'brand') {
      window.location.href = '/brand/brand_dashboard_premium.html';
      return;
    }
  } else {
    console.log('⚠️ Aucun utilisateur connecté — navigation publique activée');
  }

  setupNavigation();
}

function setupNavigation() {
  // Navigation standard si non connecté
  const routes = {
    creatorLogin: '/auth/creator-login.html',
    creatorSignup: '/auth/creator-signup.html',
    brandLogin: '/auth/brand-login.html',
    brandSignup: '/auth/brand-signup.html',
    forgotPassword: '/auth/forgot-password.html',
    index: '/index.html',
  };

  // Fonction utilitaire
  const redirect = (e, path) => {
    e.preventDefault();
    window.location.href = path;
  };

  // Écoute des boutons
  document.querySelectorAll('a, button').forEach(el => {
    const text = el.textContent.trim();

    if (text.includes('دخول المبدعين') || text.toLowerCase().includes('creator login')) {
      el.addEventListener('click', e => redirect(e, routes.creatorLogin));
    }

    if (text.includes('دخول الشركات') || text.toLowerCase().includes('brand login')) {
      el.addEventListener('click', e => redirect(e, routes.brandLogin));
    }

    if (text.includes('تسجيل كمبدع') || text.toLowerCase().includes('creator signup')) {
      el.addEventListener('click', e => redirect(e, routes.creatorSignup));
    }

    if (text.includes('تسجيل كعلامة تجارية') || text.toLowerCase().includes('brand signup')) {
      el.addEventListener('click', e => redirect(e, routes.brandSignup));
    }

    if (text.includes('نسيت كلمة المرور') || text.toLowerCase().includes('forgot password')) {
      el.addEventListener('click', e => redirect(e, routes.forgotPassword));
    }
  });
}

// Wait for both DOM and Supabase to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ nav-links.js chargé avec succès');
  
  // If Supabase is already initialized, perform auth check immediately
  if (window.supabaseClient) {
    performAuthCheck();
  } else {
    // Otherwise, wait for the supabaseReady event
    window.addEventListener('supabaseReady', () => {
      performAuthCheck();
    });
  }
});
