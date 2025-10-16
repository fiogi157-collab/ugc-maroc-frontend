// ===========================================================
// 🏢 UGC Maroc - Dashboard Marque
// ===========================================================

// Vérifier authentification marque
auth.checkAuth('brand');

// ===========================================================
// CHARGER STATS DASHBOARD MARQUE
// ===========================================================
async function loadBrandDashboard() {
  try {
    // Récupérer wallet
    const walletResult = await api.wallet.getMyWallet();
    if (walletResult.success && walletResult.data) {
      const wallet = walletResult.data;
      
      const balanceEl = document.getElementById('wallet-balance');
      if (balanceEl) {
        balanceEl.textContent = utils.formatMAD(wallet.balance_mad);
      }
    }

    // Récupérer mes campagnes
    const campaignsResult = await api.brand.getMyCampaigns();
    if (campaignsResult.success && campaignsResult.data) {
      const campaigns = campaignsResult.data;
      
      const statsContainer = document.getElementById('campaigns-stats');
      if (statsContainer) {
        const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
        const totalCampaigns = campaigns.length;
        
        statsContainer.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p class="text-2xl font-bold">${activeCampaigns}</p>
            <p class="text-sm text-gray-500">Campagnes actives</p>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p class="text-2xl font-bold">${totalCampaigns}</p>
            <p class="text-sm text-gray-500">Total campagnes</p>
          </div>
        `;
      }
    }

  } catch (error) {
    console.error('Erreur chargement dashboard:', error);
    utils.showToast('خطأ في تحميل لوحة التحكم', 'error');
  }
}

// ===========================================================
// CHARGER MES CAMPAGNES
// ===========================================================
async function loadMyCampaigns() {
  const container = document.getElementById('my-campaigns-list');
  if (!container) return;

  utils.showLoader('my-campaigns-list');

  try {
    const result = await api.brand.getMyCampaigns();
    
    if (result.success && result.data) {
      const campaigns = result.data;
      
      if (campaigns.length > 0) {
        container.innerHTML = campaigns.map(campaign => `
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-xl font-bold">${campaign.title}</h3>
                <p class="text-gray-500 text-sm mt-1">
                  Créée le ${utils.formatDate(campaign.created_at)}
                </p>
              </div>
              <span class="px-3 py-1 rounded-full text-sm font-medium
                ${campaign.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                ${campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                ${campaign.status === 'closed' ? 'bg-red-100 text-red-800' : ''}
              ">
                ${utils.translateStatus(campaign.status)}
              </span>
            </div>
            
            <p class="text-gray-600 mb-4">${campaign.description || ''}</p>
            
            <div class="flex justify-between items-center pt-4 border-t">
              <div>
                <span class="text-sm text-gray-500">Budget: </span>
                <span class="font-medium">${utils.formatMAD(campaign.budget_per_video)}</span>
              </div>
              <div class="flex gap-2">
                <a href="/brand/تفاصيل_الحملة_(للعلامات_التجارية).html?id=${campaign.id}" 
                   class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  عرض التفاصيل
                </a>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('my-campaigns-list', 'لم تنشئ أي حملة بعد', '📢');
      }
    }
  } catch (error) {
    console.error('Erreur chargement campagnes:', error);
    utils.showError('my-campaigns-list', 'خطأ في تحميل الحملات');
  }
}

// ===========================================================
// CHARGER SOUMISSIONS D'UNE CAMPAGNE
// ===========================================================
async function loadCampaignSubmissions() {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get('id');
  
  if (!campaignId) return;

  const container = document.getElementById('campaign-submissions');
  if (!container) return;

  utils.showLoader('campaign-submissions');

  try {
    const result = await api.brand.getCampaignSubmissions(campaignId);
    
    if (result.success && result.data) {
      const submissions = result.data;
      
      if (submissions.length > 0) {
        container.innerHTML = submissions.map(sub => `
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h4 class="font-bold">${sub.profiles?.full_name || 'Créateur'}</h4>
                <p class="text-sm text-gray-500">Soumis le ${utils.formatDate(sub.submitted_at)}</p>
                
                ${sub.video_url ? `
                  <video controls class="w-full mt-4 rounded-lg max-h-64">
                    <source src="${sub.video_url}" type="video/mp4">
                  </video>
                ` : ''}
                
                <p class="mt-4 text-gray-700">${sub.description || ''}</p>
              </div>
              
              <div class="flex flex-col gap-2 ml-4">
                <span class="px-3 py-1 rounded-full text-sm font-medium text-center
                  ${sub.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                  ${sub.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${sub.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                ">
                  ${utils.translateStatus(sub.status)}
                </span>
                
                ${sub.status === 'under_review' ? `
                  <button onclick="approveSubmission('${sub.id}')" 
                          class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                    Approuver
                  </button>
                  <button onclick="rejectSubmission('${sub.id}')" 
                          class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                    Rejeter
                  </button>
                ` : ''}
                
                ${sub.status === 'approved' ? `
                  <button onclick="giveTip('${sub.id}')" 
                          class="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                    💝 Pourboire
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('campaign-submissions', 'لا توجد soumissions بعد', '📭');
      }
    }
  } catch (error) {
    console.error('Erreur chargement soumissions:', error);
    utils.showError('campaign-submissions', 'خطأ في تحميل السومissions');
  }
}

// ===========================================================
// ACTIONS SOUMISSIONS
// ===========================================================
async function approveSubmission(submissionId) {
  const feedback = prompt('Ajouter un feedback (optionnel):');
  
  const result = await api.brand.approveSubmission(submissionId, feedback);
  
  if (result.success) {
    utils.showToast('تم الموافقة على الفيديو بنجاح!', 'success');
    loadCampaignSubmissions(); // Recharger
  } else {
    utils.showToast(result.error, 'error');
  }
}

async function rejectSubmission(submissionId) {
  const reason = prompt('Raison du rejet:');
  
  if (!reason) {
    utils.showToast('يجب إدخال سبب الرفض', 'warning');
    return;
  }
  
  const result = await api.brand.rejectSubmission(submissionId, reason);
  
  if (result.success) {
    utils.showToast('تم رفض الفيديو', 'success');
    loadCampaignSubmissions(); // Recharger
  } else {
    utils.showToast(result.error, 'error');
  }
}

async function giveTip(submissionId) {
  const amount = prompt('Montant du pourboire (MAD):');
  
  if (!amount || isNaN(amount) || amount <= 0) {
    utils.showToast('المبلغ غير صالح', 'error');
    return;
  }
  
  const message = prompt('Message pour le créateur (optionnel):');
  
  const result = await api.tips.giveTip({
    submission_id: submissionId,
    amount: parseFloat(amount),
    message: message
  });
  
  if (result.success) {
    utils.showToast('تم إرسال الإكرامية بنجاح! (0% عمولة)', 'success');
  } else {
    utils.showToast(result.error, 'error');
  }
}

// Export fonctions globales
window.approveSubmission = approveSubmission;
window.rejectSubmission = rejectSubmission;
window.giveTip = giveTip;

// Charger au démarrage
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('dashboard') || path.includes('brand_dashboard')) {
    loadBrandDashboard();
  } else if (path.includes('campaigns') || path.includes('المشاريع')) {
    loadMyCampaigns();
  } else if (path.includes('تفاصيل_الحملة') || path.includes('submissions')) {
    loadCampaignSubmissions();
  }
});
