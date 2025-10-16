// ===========================================================
// 🍞 UGC Maroc - Système de Notifications Toast
// ===========================================================

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.init();
  }

  init() {
    // Créer le conteneur de toasts s'il n'existe pas
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'fixed top-4 left-4 z-50 flex flex-col gap-2';
      this.container.style.cssText = `
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 5000, action = null) {
    const toast = this.createToast(message, type, action);
    this.container.appendChild(toast);
    this.toasts.push(toast);

    // Animation d'entrée
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    }, 10);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  }

  createToast(message, type, action) {
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.style.cssText = `
      pointer-events: auto;
      transform: translateX(-120%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 320px;
      max-width: 420px;
    `;

    const config = this.getToastConfig(type);
    
    toast.innerHTML = `
      <div class="flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-sm border ${config.bg} ${config.border}" dir="rtl">
        <div class="flex-shrink-0 w-6 h-6 flex items-center justify-center ${config.iconBg} rounded-full">
          ${config.icon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium ${config.text}">${message}</p>
          ${action ? `
            <button class="mt-2 text-xs font-semibold ${config.actionText} hover:underline" onclick="(${action.onClick.toString()})()">
              ${action.label}
            </button>
          ` : ''}
        </div>
        <button class="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onclick="window.toastManager.dismiss(this.closest('.toast-item'))">
          <svg class="w-4 h-4 ${config.text}" fill="currentColor" viewBox="0 0 256 256">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
          </svg>
        </button>
      </div>
    `;

    return toast;
  }

  getToastConfig(type) {
    const configs = {
      success: {
        bg: 'bg-green-50 dark:bg-green-950/50',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-800 dark:text-green-200',
        iconBg: 'bg-green-500',
        actionText: 'text-green-700 dark:text-green-300',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
        </svg>`
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-950/50',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        iconBg: 'bg-red-500',
        actionText: 'text-red-700 dark:text-red-300',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
        </svg>`
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-950/50',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        iconBg: 'bg-yellow-500',
        actionText: 'text-yellow-700 dark:text-yellow-300',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/>
        </svg>`
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        iconBg: 'bg-blue-500',
        actionText: 'text-blue-700 dark:text-blue-300',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z"/>
        </svg>`
      }
    };

    return configs[type] || configs.info;
  }

  dismiss(toast) {
    if (!toast) return;

    toast.style.transform = 'translateX(-120%)';
    toast.style.opacity = '0';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
    }, 300);
  }

  dismissAll() {
    this.toasts.forEach(toast => this.dismiss(toast));
  }

  // Méthodes helpers
  success(message, duration = 5000, action = null) {
    return this.show(message, 'success', duration, action);
  }

  error(message, duration = 5000, action = null) {
    return this.show(message, 'error', duration, action);
  }

  warning(message, duration = 5000, action = null) {
    return this.show(message, 'warning', duration, action);
  }

  info(message, duration = 5000, action = null) {
    return this.show(message, 'info', duration, action);
  }
}

// Initialiser le gestionnaire global
if (typeof window !== 'undefined') {
  window.toastManager = new ToastManager();
}

// Alias pour compatibilité avec utils.showToast existant
if (typeof window !== 'undefined' && window.utils) {
  const originalShowToast = window.utils.showToast;
  window.utils.showToast = function(message, type = 'info') {
    return window.toastManager.show(message, type);
  };
}
