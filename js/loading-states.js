// ===========================================================
// ⏳ UGC Maroc - Smart Loading States
// ===========================================================

class LoadingStates {
  constructor() {
    this.activeLoaders = new Map();
  }

  // Skeleton loader pour cartes
  showCardSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletons = Array(count).fill(0).map(() => `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div class="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    `).join('');

    container.innerHTML = skeletons;
  }

  // Skeleton loader pour liste
  showListSkeleton(containerId, count = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletons = Array(count).fill(0).map(() => `
      <div class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div class="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    `).join('');

    container.innerHTML = skeletons;
  }

  // Skeleton pour stats cards
  showStatsSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="flex justify-between items-start mb-3">
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    `;
  }

  // Loader contextuel avec message
  showContextualLoader(containerId, message = 'جاري التحميل...', progress = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loaderId = `loader-${Date.now()}`;
    this.activeLoaders.set(containerId, loaderId);

    container.innerHTML = `
      <div id="${loaderId}" class="flex flex-col items-center justify-center p-12" dir="rtl">
        <div class="relative mb-6">
          <div class="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div class="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">${message}</p>
        ${progress !== null ? `
          <div class="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
            <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
          </div>
          <p class="text-sm text-gray-500 mt-2">${progress}%</p>
        ` : ''}
      </div>
    `;
  }

  // Loader inline (petit)
  showInlineLoader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-center p-4">
        <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    `;
  }

  // Loader pour wallet (spécifique)
  showWalletLoader() {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="flex items-center justify-between mb-4">
          <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full w-full mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    `;
  }

  // Loader pour graphique
  showChartLoader(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
        <div class="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    `;
  }

  // Mettre à jour la progression
  updateProgress(containerId, progress, message = null) {
    const loaderId = this.activeLoaders.get(containerId);
    if (!loaderId) return;

    const loader = document.getElementById(loaderId);
    if (!loader) return;

    const progressBar = loader.querySelector('[style*="width"]');
    const progressText = loader.querySelector('.text-sm.text-gray-500');
    const messageEl = loader.querySelector('.text-lg');

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (progressText) {
      progressText.textContent = `${progress}%`;
    }
    if (message && messageEl) {
      messageEl.textContent = message;
    }
  }

  // Effacer le loader
  hide(containerId) {
    this.activeLoaders.delete(containerId);
  }

  // Shimmer effect (alternative à pulse)
  createShimmer() {
    return `
      <style>
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(
            to right,
            #f0f0f0 0%,
            #e0e0e0 20%,
            #f0f0f0 40%,
            #f0f0f0 100%
          );
          background-size: 1000px 100%;
        }
        .dark .shimmer {
          background: linear-gradient(
            to right,
            #1f2937 0%,
            #374151 20%,
            #1f2937 40%,
            #1f2937 100%
          );
        }
      </style>
    `;
  }
}

// Messages contextuels pour différentes actions
const loadingMessages = {
  campaigns: [
    'جاري تحميل حملاتك...',
    'تحليل أداء الحملات...',
    'جمع البيانات...'
  ],
  creators: [
    'جاري البحث عن المبدعين...',
    'تحليل ملفات المبدعين...',
    'حساب نسب التطابق...'
  ],
  wallet: [
    'جاري تحميل محفظتك...',
    'حساب رصيدك...',
    'تحليل المعاملات...'
  ],
  analytics: [
    'جاري تحليل البيانات...',
    'إنشاء الرسوم البيانية...',
    'حساب الإحصائيات...'
  ],
  ai: [
    '🤖 الذكاء الاصطناعي يحلل بياناتك...',
    '🧠 جاري إنشاء التوصيات...',
    '✨ تحسين النتائج...'
  ]
};

// Instance globale
if (typeof window !== 'undefined') {
  window.loadingStates = new LoadingStates();
  window.loadingMessages = loadingMessages;
}
