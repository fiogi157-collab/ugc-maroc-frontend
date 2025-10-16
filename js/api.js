// ===========================================================
// 🌐 UGC Maroc - API Client
// ===========================================================

// Fonction helper pour appels API avec authentification
async function apiCall(endpoint, options = {}) {
  try {
    // Récupérer token de session Supabase
    const { data: { session } } = await supabaseClient.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Non authentifié. Veuillez vous connecter.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Gérer erreur 401 (non authentifié)
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = '/auth/creator-login.html';
      throw new Error('Session expirée');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Erreur API');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Erreur API:', error);
    return { success: false, error: error.message };
  }
}

// ===========================================================
// 👤 API CRÉATEUR
// ===========================================================

const creatorAPI = {
  // Récupérer campagnes disponibles
  getCampaigns: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/creator/campaigns?${params}`);
  },

  // Détails d'une campagne
  getCampaignDetails: async (campaignId) => {
    return apiCall(`/creator/campaigns/${campaignId}`);
  },

  // Mes soumissions
  getMySubmissions: async () => {
    return apiCall('/creator/submissions');
  },

  // Soumettre vidéo
  submitVideo: async (submissionData) => {
    return apiCall('/creator/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData)
    });
  },

  // Mon profil
  getProfile: async () => {
    return apiCall('/creator/profile');
  },

  // Mettre à jour profil
  updateProfile: async (profileData) => {
    return apiCall('/creator/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// ===========================================================
// 🏢 API MARQUE
// ===========================================================

const brandAPI = {
  // Mes campagnes
  getMyCampaigns: async () => {
    return apiCall('/brand/campaigns');
  },

  // Créer campagne
  createCampaign: async (campaignData) => {
    return apiCall('/brand/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData)
    });
  },

  // Mettre à jour campagne
  updateCampaign: async (campaignId, campaignData) => {
    return apiCall(`/brand/campaigns/${campaignId}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData)
    });
  },

  // Soumissions pour une campagne
  getCampaignSubmissions: async (campaignId) => {
    return apiCall(`/brand/campaigns/${campaignId}/submissions`);
  },

  // Approuver soumission
  approveSubmission: async (submissionId, feedback) => {
    return apiCall(`/brand/submissions/${submissionId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ feedback })
    });
  },

  // Rejeter soumission
  rejectSubmission: async (submissionId, rejectionReason) => {
    return apiCall(`/brand/submissions/${submissionId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejection_reason: rejectionReason })
    });
  },

  // Mon profil
  getProfile: async () => {
    return apiCall('/brand/profile');
  },

  // Mettre à jour profil
  updateProfile: async (profileData) => {
    return apiCall('/brand/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// ===========================================================
// 💰 API WALLET
// ===========================================================

const walletAPI = {
  // Mon portefeuille
  getMyWallet: async () => {
    return apiCall('/wallet/my-wallet');
  },

  // Historique transactions
  getTransactions: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/wallet/transactions?${params}`);
  },

  // Déposer fonds (marque)
  deposit: async (depositData) => {
    return apiCall('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(depositData)
    });
  },

  // Historique dépôts
  getDeposits: async () => {
    return apiCall('/wallet/deposits');
  },

  // Retirer fonds (créateur)
  withdraw: async (withdrawalData) => {
    return apiCall('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(withdrawalData)
    });
  },

  // Historique retraits
  getWithdrawals: async () => {
    return apiCall('/wallet/withdrawals');
  }
};

// ===========================================================
// 💝 API POURBOIRES
// ===========================================================

const tipsAPI = {
  // Donner pourboire
  giveTip: async (tipData) => {
    return apiCall('/tips/give-tip', {
      method: 'POST',
      body: JSON.stringify(tipData)
    });
  },

  // Mes pourboires reçus (créateur)
  getMyTips: async () => {
    return apiCall('/tips/my-tips');
  }
};

// ===========================================================
// ⚖️ API LITIGES
// ===========================================================

const disputesAPI = {
  // Ouvrir litige
  openDispute: async (disputeData) => {
    return apiCall('/disputes/open', {
      method: 'POST',
      body: JSON.stringify(disputeData)
    });
  },

  // Mes litiges
  getMyDisputes: async () => {
    return apiCall('/disputes/my-disputes');
  }
};

// ===========================================================
// 🤝 API PARRAINAGE
// ===========================================================

const referralsAPI = {
  // Mon code parrain
  getMyCode: async () => {
    return apiCall('/referrals/my-code');
  },

  // Utiliser code parrain
  useCode: async (code) => {
    return apiCall('/referrals/use-code', {
      method: 'POST',
      body: JSON.stringify({ referral_code: code })
    });
  },

  // Mes stats parrainage
  getMyStats: async () => {
    return apiCall('/referrals/my-stats');
  }
};

// ===========================================================
// 🎫 API SUPPORT TICKETS
// ===========================================================

const ticketsAPI = {
  // Créer ticket
  createTicket: async (ticketData) => {
    return apiCall('/tickets/create', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  },

  // Mes tickets
  getMyTickets: async () => {
    return apiCall('/tickets/my-tickets');
  },

  // Détails ticket
  getTicketDetails: async (ticketId) => {
    return apiCall(`/tickets/${ticketId}`);
  },

  // Répondre à ticket
  replyToTicket: async (ticketId, message) => {
    return apiCall(`/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
};

// ===========================================================
// 🎓 API CERTIFICATIONS
// ===========================================================

const certificationsAPI = {
  // Commencer formation
  startCertification: async () => {
    return apiCall('/certifications/start', { method: 'POST' });
  },

  // Compléter module
  completeModule: async (moduleNumber) => {
    return apiCall('/certifications/complete-module', {
      method: 'POST',
      body: JSON.stringify({ module_number: moduleNumber })
    });
  },

  // Passer quiz
  submitQuiz: async (answers) => {
    return apiCall('/certifications/quiz', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });
  },

  // Mon statut certification
  getMyStatus: async () => {
    return apiCall('/certifications/my-status');
  }
};

// ===========================================================
// 🏆 API BADGES
// ===========================================================

const badgesAPI = {
  // Mes badges
  getMyBadges: async () => {
    return apiCall('/badges/my-badges');
  },

  // Badges disponibles
  getAvailable: async () => {
    return apiCall('/badges/available');
  },

  // Vérifier débloquage badges
  checkBadges: async () => {
    return apiCall('/badges/check', { method: 'POST' });
  }
};

// ===========================================================
// 👨‍💼 API ADMIN
// ===========================================================

const adminAPI = {
  // Gestion utilisateurs
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/admin/users?${params}`);
  },

  blockUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/block`, { method: 'PUT' });
  },

  unblockUser: async (userId) => {
    return apiCall(`/admin/users/${userId}/unblock`, { method: 'PUT' });
  },

  changeUserRole: async (userId, newRole) => {
    return apiCall(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ new_role: newRole })
    });
  },

  // Stats globales
  getStats: async () => {
    return apiCall('/admin/stats');
  },

  // Virements bancaires en attente
  getPendingTransfers: async () => {
    return apiCall('/wallet/admin/pending-transfers');
  },

  // Vérifier virement
  verifyTransfer: async (transferId, action, note) => {
    return apiCall(`/wallet/admin/verify-transfer/${transferId}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        action, 
        verification_note: note 
      })
    });
  },

  // Retraits en attente
  getPendingWithdrawals: async () => {
    return apiCall('/wallet/admin/pending-withdrawals');
  },

  // Traiter retrait
  processWithdrawal: async (withdrawalId, action, data) => {
    return apiCall(`/wallet/admin/process-withdrawal/${withdrawalId}`, {
      method: 'PUT',
      body: JSON.stringify({ action, ...data })
    });
  },

  // Litiges
  getAllDisputes: async () => {
    return apiCall('/disputes/admin/all');
  },

  assignDispute: async (disputeId, adminId) => {
    return apiCall(`/disputes/admin/assign/${disputeId}`, {
      method: 'PUT',
      body: JSON.stringify({ admin_id: adminId })
    });
  },

  resolveDispute: async (disputeId, resolution) => {
    return apiCall(`/disputes/admin/resolve/${disputeId}`, {
      method: 'PUT',
      body: JSON.stringify(resolution)
    });
  },

  // Tickets support
  getAllTickets: async () => {
    return apiCall('/tickets/admin/all');
  },

  assignTicket: async (ticketId, adminId) => {
    return apiCall(`/tickets/admin/assign/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({ admin_id: adminId })
    });
  },

  resolveTicket: async (ticketId, resolution) => {
    return apiCall(`/tickets/admin/resolve/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify({ resolution_note: resolution })
    });
  }
};

// Export global
window.api = {
  creator: creatorAPI,
  brand: brandAPI,
  wallet: walletAPI,
  tips: tipsAPI,
  disputes: disputesAPI,
  referrals: referralsAPI,
  tickets: ticketsAPI,
  certifications: certificationsAPI,
  badges: badgesAPI,
  admin: adminAPI
};
