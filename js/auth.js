// ===========================================================
// 🔐 UGC Maroc - Gestion Authentification
// ===========================================================

// Fonction pour récupérer le token actuel
function getAuthToken() {
  const session = JSON.parse(localStorage.getItem('supabase.auth.token'));
  return session?.currentSession?.access_token || null;
}

// Fonction pour récupérer l'utilisateur courant
async function getCurrentUser() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error) {
    console.error('Erreur récupération utilisateur:', error);
    return null;
  }
  return user;
}

// Fonction pour récupérer le profil avec rôle
async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Erreur récupération profil:', error);
    return null;
  }
  
  return { ...user, profile };
}

// Connexion
async function loginUser(email, password) {
  try {
    console.log('🔐 Tentative de connexion:', email);
    
    // 1. Se connecter avec Supabase Auth directement (côté client)
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erreur Supabase Auth:', error);
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }

    console.log('✅ Authentification réussie:', data.user.email);

    // 2. Récupérer le profil depuis Replit PostgreSQL via API
    const profileResponse = await fetch(`${window.API_BASE_URL}/api/profile/${data.user.id}`);
    const profileResult = await profileResponse.json();

    if (!profileResponse.ok || !profileResult.success) {
      console.error('Erreur récupération profil:', profileResult);
      throw new Error('خطأ في تحميل معلومات المستخدم');
    }

    const profile = profileResult.profile;
    console.log('✅ Profil chargé:', profile.role);

    // 3. Sauvegarder infos dans localStorage
    localStorage.setItem('user_role', profile.role);
    localStorage.setItem('user_name', profile.full_name || email);
    localStorage.setItem('user_id', profile.user_id);

    // 4. Redirection selon rôle
    const dashboards = {
      'creator': '/creator/creator_dashboard.html',
      'brand': '/brand/brand_dashboard_premium.html',
      'admin': '/admin/إدارة_المستخدمين_(للمسؤولين)_3.html'
    };

    console.log('📍 Redirection vers:', dashboards[profile.role]);
    window.location.href = dashboards[profile.role] || '/index.html';
    
    return { success: true, user: data.user, profile };
  } catch (err) {
    console.error('❌ Erreur login:', err);
    return { success: false, error: err.message };
  }
}

// Créer profil complet (profil + wallet + creator/brand)
// Utilise l'API backend qui écrit dans Replit PostgreSQL
async function createCompleteProfile(userId, email, fullName, phone, role, metadata = {}) {
  try {
    console.log('📝 Création profil complet via API backend:', { userId, email, role });

    // Préparer les données pour l'API
    const requestBody = {
      userId,
      email,
      fullName,
      phone,
      role,
      metadata
    };

    console.log('🚀 Appel API /api/create-profile');

    // Appeler l'API backend
    const response = await fetch(`${window.API_BASE_URL}/api/create-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ Erreur API create-profile:', result);
      throw new Error(result.message || 'فشل في إنشاء الملف الشخصي');
    }

    console.log('✅ Profil complet créé avec succès:', result);
    return { success: true, profile: result.profile };
  } catch (err) {
    console.error('❌ Erreur createCompleteProfile:', err);
    throw err;
  }
}

// Inscription
async function signupUser(email, password, role, fullName, phone, metadata = {}) {
  try {
    console.log('🔍 Début inscription:', { email, role, fullName });
    console.log('🔑 Supabase client disponible:', !!window.supabaseClient);
    
    // Vérifier que le client est initialisé
    if (!window.supabaseClient) {
      throw new Error('Client Supabase non initialisé. Rafraîchissez la page.');
    }
    
    // 1. Créer utilisateur Supabase Auth
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: metadata.username || null
        }
      }
    });

    console.log('📊 Résultat signup Supabase Auth:', { 
      user: data?.user?.email, 
      session: data?.session ? 'Oui' : 'Non',
      error: error?.message 
    });

    if (error) {
      throw new Error('فشل إنشاء الحساب: ' + error.message);
    }

    if (!data.user) {
      throw new Error('فشل إنشاء الحساب - لا يوجد مستخدم');
    }

    // 2. Créer profil complet (profil + wallet + creator/brand)
    await createCompleteProfile(data.user.id, email, fullName, phone, role, metadata);

    // 3. Si pas de session (email confirmation requis)
    if (!data.session) {
      console.log('⚠️ Session null - confirmation email requise');
      return { 
        success: true, 
        message: 'تم إنشاء الحساب بنجاح! يرجى تأكيد بريدك الإلكتروني.',
        requiresEmailVerification: true,
        user: data.user
      };
    }

    // 4. Si session existe (auto-login)
    console.log('✅ Session active - connexion automatique');
    
    // Sauvegarder infos dans localStorage
    localStorage.setItem('user_role', role);
    localStorage.setItem('user_name', fullName || email);
    localStorage.setItem('user_id', data.user.id);

    // 5. Redirection automatique selon rôle
    const dashboards = {
      'creator': '/creator/creator_dashboard.html',
      'brand': '/brand/brand_dashboard_premium.html',
      'admin': '/admin/إدارة_المستخدمين_(للمسؤولين)_3.html'
    };

    console.log('📍 Redirection automatique vers:', dashboards[role]);
    
    setTimeout(() => {
      window.location.href = dashboards[role] || '/index.html';
    }, 1000);

    return { 
      success: true, 
      message: 'تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...',
      requiresEmailVerification: false,
      user: data.user,
      session: data.session
    };
  } catch (err) {
    console.error('❌ Erreur inscription:', err);
    return { 
      success: false, 
      error: err.message || 'حدث خطأ أثناء إنشاء الحساب'
    };
  }
}

// Déconnexion
async function logoutUser() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    localStorage.clear();
    window.location.href = '/index.html';
  } catch (err) {
    console.error('Erreur déconnexion:', err);
    alert('خطأ في تسجيل الخروج: ' + err.message);
  }
}

// Réinitialisation mot de passe
async function resetPassword(email) {
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/reset-password.html'
    });

    if (error) throw error;
    return { success: true, message: 'Email de réinitialisation envoyé !' };
  } catch (err) {
    console.error('Erreur reset password:', err);
    return { success: false, error: err.message };
  }
}

// Mettre à jour mot de passe
async function updatePassword(newPassword) {
  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return { success: true, message: 'Mot de passe mis à jour avec succès !' };
  } catch (err) {
    console.error('Erreur update password:', err);
    return { success: false, error: err.message };
  }
}

// Vérifier si utilisateur est connecté
async function checkAuth(requiredRole = null) {
  const user = await getCurrentUser();
  
  if (!user) {
    // Redirection intelligente selon le rôle requis ou la page actuelle
    let loginPage = '/auth/creator-login.html'; // Par défaut
    
    if (requiredRole === 'brand') {
      loginPage = '/auth/brand-login.html';
    } else if (requiredRole === 'admin') {
      loginPage = '/auth/admin-login.html';
    } else if (requiredRole === 'creator') {
      loginPage = '/auth/creator-login.html';
    } else {
      // Si pas de rôle spécifié, détecter depuis l'URL
      const currentPath = window.location.pathname;
      if (currentPath.includes('/brand/')) {
        loginPage = '/auth/brand-login.html';
      } else if (currentPath.includes('/admin/')) {
        loginPage = '/auth/admin-login.html';
      }
    }
    
    window.location.href = loginPage;
    return false;
  }

  if (requiredRole) {
    const userRole = localStorage.getItem('user_role');
    if (userRole !== requiredRole) {
      alert('غير مصرح لك بالوصول إلى هذه الصفحة');
      
      // Rediriger vers le bon dashboard selon le rôle de l'utilisateur
      const dashboards = {
        'creator': '/creator/creator_dashboard.html',
        'brand': '/brand/brand_dashboard_-_variant_2.html',
        'admin': '/admin/إدارة_المستخدمين_(للمسؤولين)_3.html'
      };
      window.location.href = dashboards[userRole] || '/index.html';
      return false;
    }
  }

  return true;
}

// Export fonctions
window.auth = {
  loginUser,
  signupUser,
  logoutUser,
  resetPassword,
  updatePassword,
  getCurrentUser,
  getUserProfile,
  getAuthToken,
  checkAuth,
  createCompleteProfile
};
