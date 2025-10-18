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

    // 2. Récupérer le profil depuis la base de données
    const { data: profile, error: profileError } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError) {
      console.error('Erreur récupération profil:', profileError);
      throw new Error('خطأ في تحميل معلومات المستخدم');
    }

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
// Utilise une fonction RPC SECURITY DEFINER pour contourner les problèmes de cache RLS
async function createCompleteProfile(userId, email, fullName, phone, role, metadata = {}) {
  try {
    console.log('📝 Création profil complet via RPC:', { userId, email, role });

    // Préparer les paramètres selon le rôle
    const rpcParams = {
      p_user_id: userId,
      p_email: email,
      p_full_name: fullName,
      p_role: role
    };

    // Paramètres spécifiques pour creator
    if (role === 'creator') {
      rpcParams.p_username = metadata.username || null;
      rpcParams.p_specialization = metadata.specialization || null;
      rpcParams.p_bio = metadata.bio || null;
      rpcParams.p_profile_picture_url = metadata.profilePictureUrl || null;
      rpcParams.p_cin = metadata.cin || null;
      rpcParams.p_birth_date = metadata.birthDate || null;
      rpcParams.p_ville = metadata.ville || null;
      rpcParams.p_languages = metadata.languages || null;
      rpcParams.p_interests = metadata.interests || null;
      rpcParams.p_bank_name = metadata.bankName || null;
      rpcParams.p_rib = metadata.rib || null;
    }

    // Paramètres spécifiques pour brand
    if (role === 'brand') {
      rpcParams.p_company_name = metadata.companyName || metadata.company_name || fullName;
      rpcParams.p_company_description = metadata.description || metadata.bio || null;
      rpcParams.p_profile_picture_url = metadata.profilePictureUrl || metadata.logo_url || null;
      rpcParams.p_website = metadata.website || null;
      rpcParams.p_industry = metadata.industry || null;
      rpcParams.p_company_size = metadata.companySize || metadata.company_size || null;
    }

    console.log('🚀 Appel RPC create_complete_profile avec params:', rpcParams);

    // Appeler la fonction RPC
    const { data, error } = await window.supabaseClient
      .rpc('create_complete_profile', rpcParams);

    if (error) {
      console.error('❌ Erreur RPC create_complete_profile:', error);
      throw new Error('فشل في إنشاء الملف الشخصي: ' + error.message);
    }

    console.log('📊 Résultat RPC:', data);

    // Vérifier le résultat
    if (!data || !data.success) {
      throw new Error('فشل في إنشاء الملف الشخصي: ' + (data?.error || 'خطأ غير معروف'));
    }

    console.log('✅ Profil complet créé avec succès via RPC');
    return { success: true, profile: data };
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
