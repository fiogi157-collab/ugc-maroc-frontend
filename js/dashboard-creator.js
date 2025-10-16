// ===========================================================
// 📊 UGC Maroc - Dashboard Créateur
// ===========================================================

// Vérifier authentification créateur
auth.checkAuth('creator');

// ===========================================================
// CHARGER STATS DASHBOARD
// ===========================================================
async function loadCreatorDashboard() {
  try {
    // Récupérer wallet
    const walletResult = await api.wallet.getMyWallet();
    if (walletResult.success && walletResult.data) {
      const wallet = walletResult.data;
      
      // Afficher solde
      const balanceEl = document.getElementById('wallet-balance');
      if (balanceEl) {
        balanceEl.textContent = utils.formatMAD(wallet.balance_mad);
      }
      
      // Afficher total gagné
      const earnedEl = document.getElementById('total-earned');
      if (earnedEl) {
        earnedEl.textContent = utils.formatMAD(wallet.total_earned);
      }
    }

    // Récupérer badges
    const badgesResult = await api.badges.getMyBadges();
    if (badgesResult.success && badgesResult.data) {
      const badges = badgesResult.data;
      const badgesContainer = document.getElementById('badges-container');
      
      if (badgesContainer && badges.length > 0) {
        badgesContainer.innerHTML = badges.map(badge => `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
            <div class="text-4xl mb-2">${badge.badges.icon}</div>
            <p class="text-sm font-medium">${badge.badges.name_ar}</p>
            ${badge.badge_reward ? `<p class="text-xs text-green-600 mt-1">+${badge.badge_reward} MAD</p>` : ''}
          </div>
        `).join('');
      }
    }

    // Récupérer dernières soumissions
    const submissionsResult = await api.creator.getMySubmissions();
    if (submissionsResult.success && submissionsResult.data) {
      const submissions = submissionsResult.data.slice(0, 5); // Les 5 dernières
      const submissionsContainer = document.getElementById('recent-submissions');
      
      if (submissionsContainer) {
        if (submissions.length > 0) {
          submissionsContainer.innerHTML = submissions.map(sub => `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center">
              <div>
                <p class="font-medium">${sub.campaigns?.title || 'Campagne'}</p>
                <p class="text-sm text-gray-500">${utils.formatDate(sub.submitted_at)}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-medium
                ${sub.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                ${sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${sub.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
              ">
                ${utils.translateStatus(sub.status)}
              </span>
            </div>
          `).join('');
        } else {
          submissionsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">لا توجد soumissions بعد</p>';
        }
      }
    }

  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
    utils.showToast('خطأ في تحميل لوحة التحكم', 'error');
  }
}

// ===========================================================
// CHARGER CAMPAGNES DISPONIBLES
// ===========================================================
async function loadAvailableCampaigns() {
  const container = document.getElementById('campaigns-list');
  if (!container) return;

  utils.showLoader('campaigns-list');

  try {
    const result = await api.creator.getCampaigns();
    
    if (result.success && result.data) {
      const campaigns = result.data;
      
      if (campaigns.length > 0) {
        container.innerHTML = campaigns.map(campaign => `
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold">${campaign.title}</h3>
                <p class="text-gray-500 text-sm mt-1">${campaign.brands?.company_name || 'Marque'}</p>
              </div>
              <span class="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                ${utils.formatMAD(campaign.budget_per_video)}
              </span>
            </div>
            
            <p class="text-gray-600 mb-4">${campaign.description || ''}</p>
            
            <div class="flex flex-wrap gap-2 mb-4">
              ${campaign.content_type ? `<span class="px-2 py-1 bg-gray-100 rounded text-xs">${campaign.content_type}</span>` : ''}
              ${campaign.video_duration ? `<span class="px-2 py-1 bg-gray-100 rounded text-xs">${campaign.video_duration}</span>` : ''}
            </div>
            
            <div class="flex justify-between items-center pt-4 border-t">
              <span class="text-sm text-gray-500">
                Date limite: ${utils.formatDate(campaign.deadline)}
              </span>
              <a href="/creator/submit-video.html?campaign=${campaign.id}" 
                 class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Postuler
              </a>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('campaigns-list', 'لا توجد حملات متاحة حالياً', '📭');
      }
    }
  } catch (error) {
    console.error('Erreur chargement campagnes:', error);
    utils.showError('campaigns-list', 'خطأ في تحميل الحملات');
  }
}

// ===========================================================
// CHARGER MES SOUMISSIONS
// ===========================================================
async function loadMySubmissions() {
  const container = document.getElementById('my-submissions-list');
  if (!container) return;

  utils.showLoader('my-submissions-list');

  try {
    const result = await api.creator.getMySubmissions();
    
    if (result.success && result.data) {
      const submissions = result.data;
      
      if (submissions.length > 0) {
        container.innerHTML = submissions.map(sub => `
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="text-lg font-bold">${sub.campaigns?.title || 'Campagne'}</h3>
                <p class="text-sm text-gray-500 mt-1">
                  Soumis le ${utils.formatDate(sub.submitted_at)}
                </p>
                
                ${sub.video_url ? `
                  <video controls class="w-full mt-4 rounded-lg max-h-64">
                    <source src="${sub.video_url}" type="video/mp4">
                  </video>
                ` : ''}
                
                ${sub.feedback_brand ? `
                  <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm font-medium text-blue-900">Feedback:</p>
                    <p class="text-sm text-blue-700">${sub.feedback_brand}</p>
                  </div>
                ` : ''}
                
                ${sub.rejection_reason ? `
                  <div class="mt-4 p-3 bg-red-50 rounded-lg">
                    <p class="text-sm font-medium text-red-900">Raison du rejet:</p>
                    <p class="text-sm text-red-700">${sub.rejection_reason}</p>
                  </div>
                ` : ''}
              </div>
              
              <span class="px-3 py-1 rounded-full text-sm font-medium
                ${sub.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                ${sub.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${sub.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
              ">
                ${utils.translateStatus(sub.status)}
              </span>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('my-submissions-list', 'لم تقدم أي فيديو بعد', '🎬');
      }
    }
  } catch (error) {
    console.error('Erreur chargement soumissions:', error);
    utils.showError('my-submissions-list', 'خطأ في تحميل السومْissions');
  }
}

// ===========================================================
// CHARGER WALLET
// ===========================================================
async function loadWallet() {
  try {
    const result = await api.wallet.getMyWallet();
    
    if (result.success && result.data) {
      const wallet = result.data;
      
      // Afficher infos wallet
      document.getElementById('current-balance').textContent = utils.formatMAD(wallet.balance_mad);
      document.getElementById('total-earned-wallet').textContent = utils.formatMAD(wallet.total_earned);
      document.getElementById('total-withdrawn').textContent = utils.formatMAD(wallet.total_withdrawn);
      
      // Vérifier si peut retirer
      const canWithdraw = utils.canWithdraw(wallet.balance_mad);
      const withdrawBtn = document.getElementById('withdraw-btn');
      
      if (withdrawBtn) {
        if (canWithdraw.canWithdraw) {
          withdrawBtn.disabled = false;
          withdrawBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          withdrawBtn.disabled = true;
          withdrawBtn.classList.add('opacity-50', 'cursor-not-allowed');
          withdrawBtn.title = `Minimum ${canWithdraw.minAmount} MAD requis`;
        }
      }
    }

    // Charger transactions
    const txResult = await api.wallet.getTransactions();
    if (txResult.success && txResult.data) {
      const transactions = txResult.data;
      const container = document.getElementById('transactions-list');
      
      if (container) {
        if (transactions.length > 0) {
          container.innerHTML = transactions.map(tx => `
            <div class="flex justify-between items-center py-3 border-b">
              <div>
                <p class="font-medium">${utils.translateStatus(tx.type)}</p>
                <p class="text-sm text-gray-500">${utils.formatDateTime(tx.created_at)}</p>
              </div>
              <div class="text-right">
                <p class="font-medium ${tx.type === 'withdrawal' || tx.type === 'commission' || tx.type === 'penalty' ? 'text-red-600' : 'text-green-600'}">
                  ${tx.type === 'withdrawal' || tx.type === 'commission' || tx.type === 'penalty' ? '-' : '+'}${utils.formatMAD(tx.amount)}
                </p>
                <span class="text-xs px-2 py-1 rounded-full
                  ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                  ${tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${tx.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                ">
                  ${utils.translateStatus(tx.status)}
                </span>
              </div>
            </div>
          `).join('');
        } else {
          container.innerHTML = '<p class="text-gray-500 text-center py-4">لا توجد معاملات</p>';
        }
      }
    }

  } catch (error) {
    console.error('Erreur chargement wallet:', error);
    utils.showToast('خطأ في تحميل المحفظة', 'error');
  }
}

// Charger au démarrage selon la page
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('dashboard')) {
    loadCreatorDashboard();
  } else if (path.includes('campaigns') || path.includes('تصفح')) {
    loadAvailableCampaigns();
  } else if (path.includes('submissions')) {
    loadMySubmissions();
  } else if (path.includes('wallet') || path.includes('سحب')) {
    loadWallet();
  }
});
