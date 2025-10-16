// ===========================================================
// ⌨️ UGC Maroc - Raccourcis Clavier
// ===========================================================

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = this.defineShortcuts();
    this.helpModalOpen = false;
    this.init();
  }

  defineShortcuts() {
    const userRole = localStorage.getItem('user_role');
    
    const shortcuts = [
      // Navigation
      {
        key: 'h',
        description: 'الصفحة الرئيسية',
        action: () => {
          window.location.href = userRole === 'brand' ? '/brand/brand_dashboard_premium.html' : '/creator/creator_dashboard.html';
        },
        category: 'التنقل'
      },
      {
        key: 'c',
        description: 'الحملات',
        action: () => navigateTo(window.ROUTES?.brand?.campaigns || '/brand/تفاصيل_الحملة_(للعلامات_التجارية).html'),
        category: 'التنقل',
        roles: ['brand']
      },
      {
        key: 'm',
        description: 'الرسائل',
        action: () => window.location.href = '/brand/messages.html',
        category: 'التنقل'
      },
      {
        key: 'w',
        description: 'المحفظة',
        action: () => navigateTo(window.ROUTES?.brand?.wallet || '/brand/محفظة_العلامة_التجارية_والفواتير.html'),
        category: 'التنقل',
        roles: ['brand']
      },
      {
        key: 'a',
        description: 'الإحصائيات',
        action: () => window.location.href = '/brand/analytics.html',
        category: 'التنقل'
      },
      {
        key: 's',
        description: 'الإعدادات',
        action: () => navigateTo(window.ROUTES?.brand?.settings || '/brand/إعدادات_ملف_العلامة_التجارية_4.html'),
        category: 'التنقل'
      },

      // Actions rapides
      {
        key: 'n',
        description: 'حملة جديدة',
        action: () => {
          if (typeof openCampaignModal === 'function') {
            openCampaignModal();
          } else {
            navigateTo(window.ROUTES?.brand?.createCampaign || '/brand/إنشاء_حملة_جديدة.html');
          }
        },
        category: 'الإجراءات',
        roles: ['brand']
      },
      {
        key: 'r',
        description: 'إعادة شحن المحفظة',
        action: () => {
          if (typeof openRechargeModal === 'function') {
            openRechargeModal();
          } else {
            window.location.href = '/brand/wallet.html?action=recharge';
          }
        },
        category: 'الإجراءات',
        roles: ['brand']
      },
      {
        key: 'f',
        description: 'البحث عن مبدعين',
        action: () => navigateTo(window.ROUTES?.brand?.creators || '/brand/سوق_المبدعين_(للعلامات_التجارية).html'),
        category: 'الإجراءات',
        roles: ['brand']
      },

      // Command Palette & Search
      {
        key: 'k',
        ctrl: true,
        description: 'لوحة الأوامر',
        action: () => window.commandPalette?.open(),
        category: 'البحث'
      },
      {
        key: '/',
        description: 'بحث',
        action: () => {
          const searchInput = document.querySelector('input[type="search"]') || 
                             document.querySelector('input[placeholder*="بحث"]');
          if (searchInput) {
            searchInput.focus();
          } else {
            window.commandPalette?.open();
          }
        },
        category: 'البحث'
      },

      // UI Controls
      {
        key: 't',
        description: 'تبديل الوضع الداكن',
        action: () => {
          document.documentElement.classList.toggle('dark');
          localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        },
        category: 'الواجهة'
      },
      {
        key: 'b',
        description: 'تبديل الشريط الجانبي',
        action: () => {
          const sidebar = document.getElementById('sidebar');
          if (sidebar) {
            sidebar.classList.toggle('-translate-x-full');
          }
        },
        category: 'الواجهة'
      },

      // Undo/Redo
      {
        key: 'z',
        ctrl: true,
        description: 'تراجع عن آخر إجراء',
        action: () => {
          if (window.undoRedoManager) {
            window.undoRedoManager.undo();
          } else {
            window.toastManager?.info('لا توجد إجراءات للتراجع عنها');
          }
        },
        category: 'التحرير'
      },

      // Help Modal
      {
        key: '?',
        shift: true,
        description: 'عرض الاختصارات',
        action: () => this.toggleHelpModal(),
        category: 'المساعدة'
      },

      // Escape (close modals)
      {
        key: 'Escape',
        description: 'إغلاق',
        action: () => {
          // Close command palette
          if (window.commandPalette?.isOpen) {
            window.commandPalette.close();
            return;
          }

          // Close help modal
          if (this.helpModalOpen) {
            this.toggleHelpModal();
            return;
          }

          // Close any open modal
          const modal = document.querySelector('.modal:not(.hidden)');
          if (modal) {
            modal.classList.add('hidden');
          }
        },
        category: 'التحكم',
        hidden: true // Don't show in help
      }
    ];

    // Filter by role
    return shortcuts.filter(shortcut => {
      if (!shortcut.roles) return true;
      return shortcut.roles.includes(userRole);
    });
  }

  init() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        // Allow Ctrl+K even in inputs
        if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.handleShortcut(e);
        }
        return;
      }

      this.handleShortcut(e);
    });

    // Create help modal
    this.createHelpModal();
  }

  handleShortcut(e) {
    const shortcut = this.shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
      const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = s.alt ? e.altKey : !e.altKey;

      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  }

  createHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'keyboard-shortcuts-modal';
    modal.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
    
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onclick="event.stopPropagation()" dir="rtl">
        <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
          <h2 class="text-2xl font-bold">⌨️ اختصارات لوحة المفاتيح</h2>
          <button onclick="window.keyboardShortcuts.toggleHelpModal()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
            </svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
          <div id="shortcuts-list" class="space-y-6">
            <!-- Will be populated -->
          </div>

          <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>نصيحة:</strong> استخدم <kbd class="px-2 py-1 bg-white dark:bg-gray-800 rounded border">Ctrl+K</kbd> أو <kbd class="px-2 py-1 bg-white dark:bg-gray-800 rounded border">/</kbd> للبحث السريع
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.helpModal = modal;

    // Click outside to close
    modal.addEventListener('click', () => this.toggleHelpModal());

    // Render shortcuts
    this.renderShortcutsList();
  }

  renderShortcutsList() {
    const container = document.getElementById('shortcuts-list');
    if (!container) return;

    // Group by category
    const categories = {};
    this.shortcuts.filter(s => !s.hidden).forEach(shortcut => {
      if (!categories[shortcut.category]) {
        categories[shortcut.category] = [];
      }
      categories[shortcut.category].push(shortcut);
    });

    container.innerHTML = Object.entries(categories).map(([category, shortcuts]) => `
      <div>
        <h3 class="text-lg font-bold mb-3 text-primary">${category}</h3>
        <div class="space-y-2">
          ${shortcuts.map(shortcut => `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span class="text-gray-700 dark:text-gray-300">${shortcut.description}</span>
              <div class="flex items-center gap-1">
                ${shortcut.ctrl ? '<kbd class="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 text-sm font-mono">Ctrl</kbd><span class="text-gray-400">+</span>' : ''}
                ${shortcut.shift ? '<kbd class="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 text-sm font-mono">Shift</kbd><span class="text-gray-400">+</span>' : ''}
                ${shortcut.alt ? '<kbd class="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 text-sm font-mono">Alt</kbd><span class="text-gray-400">+</span>' : ''}
                <kbd class="px-2 py-1 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600 text-sm font-mono">${shortcut.key.toUpperCase()}</kbd>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  toggleHelpModal() {
    this.helpModalOpen = !this.helpModalOpen;
    
    if (this.helpModalOpen) {
      this.helpModal.classList.remove('hidden');
      this.renderShortcutsList(); // Refresh in case shortcuts changed
    } else {
      this.helpModal.classList.add('hidden');
    }
  }

  // Add custom shortcut dynamically
  addShortcut(shortcut) {
    this.shortcuts.push(shortcut);
  }

  // Remove shortcut
  removeShortcut(key) {
    this.shortcuts = this.shortcuts.filter(s => s.key !== key);
  }
}

// Initialize globally
if (typeof window !== 'undefined') {
  window.keyboardShortcuts = new KeyboardShortcuts();
}
