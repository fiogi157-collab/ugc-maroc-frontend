// ===========================================================
// 🛠️ UGC Maroc - Fonctions Utilitaires
// ===========================================================

// Formatage des montants en MAD
function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Formatage des dates en arabe
function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('ar-MA', defaultOptions).format(new Date(date));
}

// Formatage date et heure
function formatDateTime(date) {
  return new Intl.DateTimeFormat('ar-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

// Temps relatif (il y a X jours)
function timeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'أمس';
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} أشهر`;
  return `منذ ${Math.floor(diffDays / 365)} سنوات`;
}

// Calcul commission marque (5%)
function calculateBrandCommission(amount) {
  const commission = amount * 0.05;
  const netAmount = amount - commission;
  return {
    totalAmount: amount,
    commission,
    netAmount
  };
}

// Calcul commission créateur (15% + 17 MAD)
function calculateCreatorCommission(amount) {
  const percentageCommission = amount * 0.15;
  const fixedFee = 17;
  const totalCommission = percentageCommission + fixedFee;
  const netAmount = amount - totalCommission;
  
  return {
    totalAmount: amount,
    percentageCommission,
    fixedFee,
    totalCommission,
    netAmount
  };
}

// Vérification montant minimum retrait (200 MAD)
function canWithdraw(amount) {
  const MIN_WITHDRAWAL = 200;
  return {
    canWithdraw: amount >= MIN_WITHDRAWAL,
    minAmount: MIN_WITHDRAWAL,
    remainingAmount: amount < MIN_WITHDRAWAL ? MIN_WITHDRAWAL - amount : 0
  };
}

// Calcul pénalité retard
function calculatePenalty(daysLate, campaignBudget) {
  let penaltyPercentage = 0;
  
  if (daysLate >= 4) penaltyPercentage = 30;
  else if (daysLate === 3) penaltyPercentage = 20;
  else if (daysLate === 2) penaltyPercentage = 10;
  else if (daysLate === 1) penaltyPercentage = 5;
  
  const penaltyAmount = (campaignBudget * penaltyPercentage) / 100;
  
  return {
    daysLate,
    penaltyPercentage,
    penaltyAmount,
    remainingBudget: campaignBudget - penaltyAmount
  };
}

// Traduction des statuts en arabe
function translateStatus(status) {
  const translations = {
    // Statuts généraux
    'active': 'نشط',
    'inactive': 'غير نشط',
    'blocked': 'محظور',
    'pending': 'قيد الانتظار',
    'completed': 'مكتمل',
    'failed': 'فشل',
    'cancelled': 'ملغى',
    
    // Statuts campagne
    'draft': 'مسودة',
    'published': 'منشور',
    'closed': 'مغلق',
    
    // Statuts soumission
    'submitted': 'مقدم',
    'under_review': 'قيد المراجعة',
    'approved': 'موافق عليه',
    'rejected': 'مرفوض',
    
    // Statuts transaction
    'deposit': 'إيداع',
    'withdrawal': 'سحب',
    'commission': 'عمولة',
    'tip': 'إكرامية',
    'penalty': 'غرامة',
    'refund': 'استرداد',
    
    // Statuts wallet
    'verified': 'موثق',
    'processing': 'قيد المعالجة'
  };
  
  return translations[status] || status;
}

// Afficher message toast
function showToast(message, type = 'info') {
  const colors = {
    'success': 'bg-green-500',
    'error': 'bg-red-500',
    'warning': 'bg-yellow-500',
    'info': 'bg-blue-500'
  };
  
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Afficher loader
function showLoader(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    `;
  }
}

// Cacher loader et afficher contenu
function hideLoader(elementId, content) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = content;
  }
}

// Afficher message erreur
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p class="text-sm">${message}</p>
      </div>
    `;
  }
}

// Afficher message vide
function showEmptyState(elementId, message, icon = '📭') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="text-center py-12">
        <div class="text-6xl mb-4">${icon}</div>
        <p class="text-gray-500 text-lg">${message}</p>
      </div>
    `;
  }
}

// Upload fichier avec preview
async function uploadFile(file, folder = 'uploads') {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('ugc-maroc')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('ugc-maroc')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl, path: filePath };
  } catch (error) {
    console.error('Erreur upload:', error);
    return { success: false, error: error.message };
  }
}

// Validation email
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validation téléphone marocain
function isValidMoroccanPhone(phone) {
  const regex = /^(\+212|0)([ \-_/]*)(\d[ \-_/]*){9}$/;
  return regex.test(phone);
}

// Validation mot de passe (min 8 caractères, 1 majuscule, 1 chiffre)
function isValidPassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

// Générer code parrainage unique
function generateReferralCode(username) {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const prefix = username.substring(0, 3).toUpperCase();
  return `${prefix}${random}`;
}

// Copier dans presse-papier
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('تم النسخ بنجاح!', 'success');
    return true;
  } catch (err) {
    console.error('Erreur copie:', err);
    showToast('فشل النسخ', 'error');
    return false;
  }
}

// Pagination
function paginate(items, page = 1, perPage = 10) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  
  return {
    items: items.slice(start, end),
    currentPage: page,
    totalPages: Math.ceil(items.length / perPage),
    totalItems: items.length,
    hasNext: end < items.length,
    hasPrev: page > 1
  };
}

// Debounce pour recherche
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export global
window.utils = {
  formatMAD,
  formatDate,
  formatDateTime,
  timeAgo,
  calculateBrandCommission,
  calculateCreatorCommission,
  canWithdraw,
  calculatePenalty,
  translateStatus,
  showToast,
  showLoader,
  hideLoader,
  showError,
  showEmptyState,
  uploadFile,
  isValidEmail,
  isValidMoroccanPhone,
  isValidPassword,
  generateReferralCode,
  copyToClipboard,
  paginate,
  debounce
};
