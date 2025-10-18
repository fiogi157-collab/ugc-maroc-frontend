// =====================================================
// 🌍 UGC Maroc – Navigation intelligente + Auth Supabase
// =====================================================

import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('✅ nav-links.js chargé avec succès');

  // Vérifie si un utilisateur est connecté
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const role = user.user_metadata?.role || 'unknown';
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

    if (text.includes('ابدأ الربح') || text.includes('المبدعين') || text.toLowerCase().includes('creator signup')) {
      el.addEventListener('click', e => redirect(e, routes.creatorSignup));
    }

    if (text.includes('ابدأ حملتك') || text.includes('العلامات') || text.toLowerCase().includes('brand signup')) {
      el.addEventListener('click', e => redirect(e, routes.brandSignup));
    }

    if (text.includes('نسيت كلمة المرور') || text.toLowerCase().includes('forgot')) {
      el.addEventListener('click', e => redirect(e, routes.forgotPassword));
    }
  });

  console.log('🎯 Navigation publique prête');
});
