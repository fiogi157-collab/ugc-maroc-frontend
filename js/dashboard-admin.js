// ===========================================================
// 👨‍💼 UGC Maroc - Dashboard Admin
// ===========================================================

// Vérifier authentification admin
auth.checkAuth('admin');

// ===========================================================
// CHARGER STATS ADMIN
// ===========================================================
async function loadAdminDashboard() {
  try {
    const result = await api.admin.getStats();
    
    if (result.success && result.data) {
      const stats = result.data;
      
      // Afficher stats
      document.getElementById('total-users').textContent = stats.totalUsers || 0;
      document.getElementById('total-creators').textContent = stats.totalCreators || 0;
      document.getElementById('total-brands').textContent = stats.totalBrands || 0;
      document.getElementById('total-campaigns').textContent = stats.totalCampaigns || 0;
    }
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

// ===========================================================
// GESTION UTILISATEURS
// ===========================================================
async function loadUsers() {
  const container = document.getElementById('users-list');
  if (!container) return;

  utils.showLoader('users-list');

  try {
    const result = await api.admin.getUsers();
    
    if (result.success && result.data) {
      const users = result.data;
      
      container.innerHTML = users.map(user => `
        <tr class="border-b">
          <td class="py-3">${user.full_name || user.email}</td>
          <td class="py-3">${user.email}</td>
          <td class="py-3">
            <span class="px-2 py-1 rounded text-xs font-medium
              ${user.role === 'creator' ? 'bg-blue-100 text-blue-800' : ''}
              ${user.role === 'brand' ? 'bg-purple-100 text-purple-800' : ''}
              ${user.role === 'admin' ? 'bg-red-100 text-red-800' : ''}
            ">
              ${utils.translateStatus(user.role)}
            </span>
          </td>
          <td class="py-3">
            <span class="px-2 py-1 rounded text-xs font-medium
              ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            ">
              ${utils.translateStatus(user.status)}
            </span>
          </td>
          <td class="py-3">
            ${user.status === 'active' ? 
              `<button onclick="blockUser('${user.user_id}')" class="text-red-600 hover:underline text-sm">حظر</button>` :
              `<button onclick="unblockUser('${user.user_id}')" class="text-green-600 hover:underline text-sm">إلغاء الحظر</button>`
            }
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Erreur chargement utilisateurs:', error);
    utils.showError('users-list', 'خطأ في تحميل المستخدمين');
  }
}

async function blockUser(userId) {
  if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;
  
  const result = await api.admin.blockUser(userId);
  if (result.success) {
    utils.showToast('تم حظر المستخدم', 'success');
    loadUsers();
  } else {
    utils.showToast(result.error, 'error');
  }
}

async function unblockUser(userId) {
  const result = await api.admin.unblockUser(userId);
  if (result.success) {
    utils.showToast('تم إلغاء حظر المستخدم', 'success');
    loadUsers();
  } else {
    utils.showToast(result.error, 'error');
  }
}

// ===========================================================
// VIREMENTS BANCAIRES EN ATTENTE
// ===========================================================
async function loadPendingTransfers() {
  const container = document.getElementById('pending-transfers');
  if (!container) return;

  utils.showLoader('pending-transfers');

  try {
    const result = await api.admin.getPendingTransfers();
    
    if (result.success && result.data) {
      const transfers = result.data;
      
      if (transfers.length > 0) {
        container.innerHTML = transfers.map(transfer => `
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold">Virement de ${utils.formatMAD(transfer.amount)}</h4>
                <p class="text-sm text-gray-500">
                  Reçu le ${utils.formatDate(transfer.created_at)}
                </p>
                ${transfer.receipt_url ? `
                  <a href="${transfer.receipt_url}" target="_blank" 
                     class="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    📄 Voir le reçu
                  </a>
                ` : ''}
              </div>
              <div class="flex flex-col gap-2">
                <button onclick="verifyTransfer('${transfer.id}', 'approve')" 
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  ✓ Approuver
                </button>
                <button onclick="verifyTransfer('${transfer.id}', 'reject')" 
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  ✗ Rejeter
                </button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('pending-transfers', 'لا توجد virements قيد الانتظار', '✅');
      }
    }
  } catch (error) {
    console.error('Erreur chargement virements:', error);
    utils.showError('pending-transfers', 'خطأ في تحميل التحويلات');
  }
}

async function verifyTransfer(transferId, action) {
  const note = action === 'reject' ? prompt('Note de vérification:') : '';
  
  const result = await api.admin.verifyTransfer(transferId, action, note);
  
  if (result.success) {
    utils.showToast(
      action === 'approve' ? 'تم الموافقة على التحويل وإضافة الرصيد' : 'تم رفض التحويل',
      'success'
    );
    loadPendingTransfers();
  } else {
    utils.showToast(result.error, 'error');
  }
}

// ===========================================================
// RETRAITS EN ATTENTE
// ===========================================================
async function loadPendingWithdrawals() {
  const container = document.getElementById('pending-withdrawals');
  if (!container) return;

  utils.showLoader('pending-withdrawals');

  try {
    const result = await api.admin.getPendingWithdrawals();
    
    if (result.success && result.data) {
      const withdrawals = result.data;
      
      if (withdrawals.length > 0) {
        container.innerHTML = withdrawals.map(withdrawal => `
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold">Retrait de ${utils.formatMAD(withdrawal.amount)}</h4>
                <p class="text-sm text-gray-500">
                  Demandé le ${utils.formatDate(withdrawal.requested_at)}
                </p>
                <p class="text-sm mt-2">
                  <strong>RIB:</strong> ${withdrawal.rib_number}
                </p>
                <p class="text-sm">
                  <strong>Banque:</strong> ${withdrawal.bank_name}
                </p>
                ${withdrawal.cin_document_url ? `
                  <a href="${withdrawal.cin_document_url}" target="_blank"
                     class="text-blue-600 hover:underline text-sm mt-2 inline-block">
                    📄 Voir CIN
                  </a>
                ` : ''}
              </div>
              <div class="flex flex-col gap-2">
                <button onclick="processWithdrawal('${withdrawal.id}', 'complete')" 
                        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  ✓ Traiter
                </button>
                <button onclick="processWithdrawal('${withdrawal.id}', 'reject')" 
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                  ✗ Rejeter
                </button>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        utils.showEmptyState('pending-withdrawals', 'لا توجد طلبات سحب قيد الانتظار', '✅');
      }
    }
  } catch (error) {
    console.error('Erreur chargement retraits:', error);
    utils.showError('pending-withdrawals', 'خطأ في تحميل طلبات السحب');
  }
}

async function processWithdrawal(withdrawalId, action) {
  let data = {};
  
  if (action === 'complete') {
    const transferRef = prompt('Référence du virement bancaire:');
    if (!transferRef) return;
    data.transfer_reference = transferRef;
  } else {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;
    data.rejection_reason = reason;
  }
  
  const result = await api.admin.processWithdrawal(withdrawalId, action, data);
  
  if (result.success) {
    utils.showToast(
      action === 'complete' ? 'تم معالجة السحب بنجاح' : 'تم رفض طلب السحب',
      'success'
    );
    loadPendingWithdrawals();
  } else {
    utils.showToast(result.error, 'error');
  }
}

// Export fonctions globales
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.verifyTransfer = verifyTransfer;
window.processWithdrawal = processWithdrawal;

// Charger au démarrage
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('dashboard') || path.includes('إدارة_المستخدمين')) {
    loadAdminDashboard();
  } else if (path.includes('users') || path.includes('المستخدمين')) {
    loadUsers();
  } else if (path.includes('verify') || path.includes('التحقق')) {
    loadPendingTransfers();
  } else if (path.includes('withdrawals')) {
    loadPendingWithdrawals();
  }
});
