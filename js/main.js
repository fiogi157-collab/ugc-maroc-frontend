// ===========================================================
// 🌍 UGC Maroc - Script Principal
// ===========================================================

// Ce fichier se charge après config.js, auth.js, api.js et utils.js

// ===========================================================
// 📱 GESTION FORMULAIRES AUTHENTIFICATION
// ===========================================================

// Formulaire login (isolé dans un scope pour éviter conflits)
(function() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = e.target.email.value;
      const password = e.target.password.value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      
      // Désactiver bouton pendant traitement
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري التحميل...';
      
      const result = await auth.loginUser(email, password);
      
      if (!result.success) {
        utils.showToast(result.error, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'تسجيل الدخول';
      }
    });
  }
})();

// Formulaire inscription (isolé)
(function() {
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = e.target.email.value;
      const password = e.target.password.value;
      const fullName = e.target.fullname?.value || '';
      const phone = e.target.phone?.value || '';
      const role = e.target.dataset.role || 'creator';
      const profilePictureUrl = document.getElementById('profile-picture-url')?.value || null;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      
      // Validation
      if (!utils.isValidEmail(email)) {
        utils.showToast('البريد الإلكتروني غير صالح', 'error');
        return;
      }
      
      if (!utils.isValidPassword(password)) {
        utils.showToast('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير ورقم', 'error');
        return;
      }
      
      // Désactiver bouton
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري الإنشاء...';
      
      const result = await auth.signupUser(email, password, role, fullName, phone, profilePictureUrl);
      
      if (result.success) {
        utils.showToast(result.message, 'success');
        
        // Sauvegarder email pour fonction resend dans page pending
        localStorage.setItem('pending_verification_email', email);
        
        // Rediriger vers page pending selon rôle
        const pendingPages = {
          'creator': '/auth/creator-pending.html',
          'brand': '/auth/brand-pending.html'
        };
        
        setTimeout(() => {
          window.location.href = pendingPages[role] || '/auth/creator-pending.html';
        }, 1500);
      } else {
        utils.showToast(result.error, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'إنشاء حساب';
      }
    });
  }
})();

// Formulaire réinitialisation mot de passe (isolé)
(function() {
  const resetForm = document.getElementById('reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = e.target.email.value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      
      if (!utils.isValidEmail(email)) {
        utils.showToast('البريد الإلكتروني غير صالح', 'error');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري الإرسال...';
      
      const result = await auth.resetPassword(email);
      
      if (result.success) {
        utils.showToast(result.message, 'success');
      } else {
        utils.showToast(result.error, 'error');
      }
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'إرسال رابط الاستعادة';
    });
  }
})();

// Formulaire nouveau mot de passe (isolé)
(function() {
  const updatePasswordForm = document.getElementById('update-password-form');
  if (updatePasswordForm) {
    updatePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const password = e.target.password.value;
      const confirmPassword = e.target.confirm_password?.value;
      const submitBtn = e.target.querySelector('button[type="submit"]');
      
      if (confirmPassword && password !== confirmPassword) {
        utils.showToast('كلمات المرور غير متطابقة', 'error');
        return;
      }
      
      if (!utils.isValidPassword(password)) {
        utils.showToast('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير ورقم', 'error');
        return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'جاري التحديث...';
      
      const result = await auth.updatePassword(password);
      
      if (result.success) {
        utils.showToast(result.message, 'success');
        setTimeout(() => {
          window.location.href = '/auth/creator-login.html';
        }, 1500);
      } else {
        utils.showToast(result.error, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'تحديث كلمة المرور';
      }
    });
  }
})();

// ===========================================================
// 🚪 BOUTON DÉCONNEXION
// ===========================================================

const logoutButtons = document.querySelectorAll('[data-logout]');
logoutButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      await auth.logoutUser();
    }
  });
});

// ===========================================================
// 👤 AFFICHAGE INFOS UTILISATEUR
// ===========================================================

async function displayUserInfo() {
  const userName = localStorage.getItem('user_name');
  const userRole = localStorage.getItem('user_role');
  
  const userNameElements = document.querySelectorAll('[data-user-name]');
  const userRoleElements = document.querySelectorAll('[data-user-role]');
  
  userNameElements.forEach(el => {
    el.textContent = userName || 'مستخدم';
  });
  
  userRoleElements.forEach(el => {
    const roleTranslations = {
      'creator': 'مبدع',
      'brand': 'علامة تجارية',
      'admin': 'مسؤول'
    };
    el.textContent = roleTranslations[userRole] || userRole;
  });
}

// Exécuter au chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayUserInfo);
} else {
  displayUserInfo();
}

// ===========================================================
// 🔔 VÉRIFICATION AUTHENTIFICATION SUR PAGES PROTÉGÉES
// ===========================================================

// Pages créateur
if (window.location.pathname.includes('/creator/')) {
  auth.checkAuth('creator');
}

// Pages marque
if (window.location.pathname.includes('/brand/')) {
  auth.checkAuth('brand');
}

// Pages admin
if (window.location.pathname.includes('/admin/')) {
  auth.checkAuth('admin');
}

// ===========================================================
// 📊 FONCTIONS HELPER POUR DASHBOARDS
// ===========================================================

// Charger wallet dans dashboard
async function loadWalletInfo(elementId = 'wallet-info') {
  const result = await api.wallet.getMyWallet();
  
  if (result.success && result.data) {
    const wallet = result.data;
    const element = document.getElementById(elementId);
    
    if (element) {
      element.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="text-lg font-bold mb-2">المحفظة</h3>
          <p class="text-3xl font-bold text-purple-600">${utils.formatMAD(wallet.balance_mad)}</p>
          <p class="text-sm text-gray-500 mt-1">الرصيد المتاح</p>
        </div>
      `;
    }
  }
}

// Charger badges dans dashboard
async function loadBadges(elementId = 'badges-container') {
  const result = await api.badges.getMyBadges();
  
  if (result.success && result.data) {
    const badges = result.data;
    const element = document.getElementById(elementId);
    
    if (element && badges.length > 0) {
      element.innerHTML = badges.map(badge => `
        <div class="bg-white rounded-lg shadow p-3 text-center">
          <div class="text-4xl mb-2">${badge.badges.icon}</div>
          <p class="text-sm font-bold">${badge.badges.name_ar}</p>
        </div>
      `).join('');
    } else if (element) {
      element.innerHTML = '<p class="text-gray-500 text-center">لا توجد شارات بعد</p>';
    }
  }
}

// Export fonctions globales
window.loadWalletInfo = loadWalletInfo;
window.loadBadges = loadBadges;

console.log('✅ UGC Maroc - Système initialisé');
