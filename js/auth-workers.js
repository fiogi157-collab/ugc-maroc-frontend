// ===========================================================
// 🔐 UGC Maroc - Authentification Workers API (JWT)
// ===========================================================

// Fonction pour récupérer le token JWT actuel
function getAuthToken() {
  return localStorage.getItem('ugc-maroc-token');
}

// Fonction pour récupérer l'utilisateur courant depuis le token
function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
}

// Fonction pour récupérer le profil complet
async function getUserProfile() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Erreur récupération profil');
    }

    const result = await response.json();
    return result.success ? result.user : null;
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return null;
  }
}

// Connexion avec Workers API
async function loginUser(email, password, rememberMe = false) {
  try {
    console.log('🔐 Tentative de connexion:', email);
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erreur de connexion');
    }

    // Stocker le token JWT
    localStorage.setItem('ugc-maroc-token', result.token);
    localStorage.setItem('ugc-maroc-user', JSON.stringify(result.user));

    console.log('✅ Connexion réussie:', result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    return { success: false, error: error.message };
  }
}

// Inscription avec Workers API
async function signupUser(email, password, role, fullName, phone, metadata = {}) {
  try {
    console.log('🔍 Début inscription:', { email, role, fullName });
    
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        role,
        full_name: fullName,
        phone,
        ...metadata
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erreur d\'inscription');
    }

    // Stocker le token JWT
    localStorage.setItem('ugc-maroc-token', result.token);
    localStorage.setItem('ugc-maroc-user', JSON.stringify(result.user));

    console.log('✅ Inscription réussie:', result.user);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    return { success: false, error: error.message };
  }
}

// Déconnexion
async function logoutUser() {
  try {
    const token = getAuthToken();
    if (token) {
      // Appeler l'endpoint de déconnexion pour invalider le cache
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  } finally {
    // Nettoyer le localStorage
    localStorage.removeItem('ugc-maroc-token');
    localStorage.removeItem('ugc-maroc-user');
    
    // Rediriger vers la page de connexion
    window.location.href = '/auth/creator-login.html';
  }
}

// Vérifier si l'utilisateur est connecté
function isLoggedIn() {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (error) {
    return false;
  }
}

// Rediriger si non connecté
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/auth/creator-login.html';
    return false;
  }
  return true;
}

// Rediriger selon le rôle
function redirectByRole(role) {
  switch (role) {
    case 'creator':
      window.location.href = '/creator/ugc-creator-dashboard.html';
      break;
    case 'brand':
      window.location.href = '/brand/campaign-details.html';
      break;
    case 'admin':
      window.location.href = '/admin/dashboard.html';
      break;
    default:
      window.location.href = '/';
  }
}

// Fonction pour mettre à jour le profil
async function updateProfile(profileData) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Non authentifié');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/profiles/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur mise à jour profil');
    }

    return { success: true, profile: result.profile };
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour changer le mot de passe
async function changePassword(currentPassword, newPassword) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Non authentifié');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur changement mot de passe');
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    return { success: false, error: error.message };
  }
}

// Fonction pour réinitialiser le mot de passe
async function resetPassword(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur réinitialisation');
    }

    return { success: true, message: result.message };
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    return { success: false, error: error.message };
  }
}

// Exporter les fonctions pour utilisation globale
window.loginUser = loginUser;
window.signupUser = signupUser;
window.logoutUser = logoutUser;
window.getCurrentUser = getCurrentUser;
window.getUserProfile = getUserProfile;
window.getAuthToken = getAuthToken;
window.isLoggedIn = isLoggedIn;
window.requireAuth = requireAuth;
window.redirectByRole = redirectByRole;
window.updateProfile = updateProfile;
window.changePassword = changePassword;
window.resetPassword = resetPassword;
