// ===========================================================
// ⌘ UGC Maroc - Command Palette (Ctrl+K)
// ===========================================================

class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.commands = [];
    this.filteredCommands = [];
    this.selectedIndex = 0;
    this.modal = null;
    this.init();
  }

  init() {
    this.registerCommands();
    this.createModal();
    this.attachKeyboardListeners();
  }

  registerCommands() {
    const userRole = localStorage.getItem('user_role');
    
    this.commands = [
      // Navigation principale
      {
        id: 'home',
        label: 'لوحة التحكم',
        icon: '🏠',
        action: () => window.location.href = userRole === 'brand' ? '/brand/brand_dashboard_premium.html' : '/creator/creator_dashboard.html',
        keywords: ['dashboard', 'home', 'accueil', 'الرئيسية']
      },
      {
        id: 'campaigns',
        label: 'الحملات',
        icon: '📢',
        action: () => navigateTo(window.ROUTES?.brand?.campaigns || '/brand/تفاصيل_الحملة_(للعلامات_التجارية).html'),
        keywords: ['campaigns', 'campagnes', 'حملات'],
        roles: ['brand']
      },
      {
        id: 'creators',
        label: 'المبدعون',
        icon: '👥',
        action: () => navigateTo(window.ROUTES?.brand?.creators || '/brand/سوق_المبدعين_(للعلامات_التجارية).html'),
        keywords: ['creators', 'créateurs', 'مبدعون'],
        roles: ['brand']
      },
      {
        id: 'wallet',
        label: 'المحفظة',
        icon: '💰',
        action: () => navigateTo(window.ROUTES?.brand?.wallet || '/brand/محفظة_العلامة_التجارية_والفواتير.html'),
        keywords: ['wallet', 'portefeuille', 'محفظة', 'argent', 'مال']
      },
      {
        id: 'analytics',
        label: 'الإحصائيات',
        icon: '📊',
        action: () => window.location.href = '/brand/analytics.html',
        keywords: ['analytics', 'stats', 'statistiques', 'إحصائيات']
      },
      {
        id: 'messages',
        label: 'الرسائل',
        icon: '💬',
        action: () => window.location.href = '/brand/messages.html',
        keywords: ['messages', 'chat', 'رسائل']
      },
      
      // Actions rapides
      {
        id: 'new-campaign',
        label: 'إنشاء حملة جديدة',
        icon: '🚀',
        action: () => {
          this.close();
          // Ouvrir modal de création de campagne
          if (typeof openCampaignModal === 'function') {
            openCampaignModal();
          } else {
            navigateTo(window.ROUTES?.brand?.createCampaign || '/brand/إنشاء_حملة_جديدة.html');
          }
        },
        keywords: ['new', 'create', 'campaign', 'nouvelle', 'campagne', 'إنشاء', 'حملة'],
        roles: ['brand']
      },
      {
        id: 'recharge',
        label: 'إعادة شحن المحفظة',
        icon: '💳',
        action: () => {
          this.close();
          if (typeof openRechargeModal === 'function') {
            openRechargeModal();
          } else {
            window.location.href = '/brand/wallet.html?action=recharge';
          }
        },
        keywords: ['recharge', 'add', 'money', 'شحن', 'إضافة'],
        roles: ['brand']
      },
      {
        id: 'browse-creators',
        label: 'تصفح المبدعين',
        icon: '🔍',
        action: () => navigateTo(window.ROUTES?.brand?.creators || '/brand/سوق_المبدعين_(للعلامات_التجارية).html'),
        keywords: ['browse', 'search', 'creators', 'تصفح', 'بحث', 'مبدعين'],
        roles: ['brand']
      },
      
      // Paramètres
      {
        id: 'settings',
        label: 'الإعدادات',
        icon: '⚙️',
        action: () => navigateTo(window.ROUTES?.brand?.settings || '/brand/إعدادات_ملف_العلامة_التجارية_4.html'),
        keywords: ['settings', 'paramètres', 'إعدادات', 'config']
      },
      {
        id: 'support',
        label: 'الدعم والمساعدة',
        icon: '🆘',
        action: () => window.location.href = '/support.html',
        keywords: ['support', 'help', 'aide', 'دعم', 'مساعدة']
      },
      {
        id: 'logout',
        label: 'تسجيل الخروج',
        icon: '🚪',
        action: () => {
          if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
            if (typeof logoutUser === 'function') {
              logoutUser();
            } else {
              localStorage.clear();
              window.location.href = '/index.html';
            }
          }
        },
        keywords: ['logout', 'déconnexion', 'exit', 'خروج']
      },
      
      // Thème
      {
        id: 'toggle-theme',
        label: 'تبديل الوضع الداكن/الفاتح',
        icon: '🌓',
        action: () => {
          document.documentElement.classList.toggle('dark');
          localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
          this.close();
        },
        keywords: ['theme', 'dark', 'light', 'mode', 'وضع', 'داكن', 'فاتح']
      }
    ];

    // Filtrer par rôle
    this.commands = this.commands.filter(cmd => {
      if (!cmd.roles) return true;
      return cmd.roles.includes(userRole);
    });

    this.filteredCommands = [...this.commands];
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'command-palette-modal';
    modal.className = 'hidden';
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh]" onclick="window.commandPalette.close()">
        <div class="w-full max-w-2xl mx-4" onclick="event.stopPropagation()" dir="rtl">
          <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- Search Input -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
                </svg>
                <input
                  type="text"
                  id="command-palette-input"
                  class="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  placeholder="ابحث عن أمر أو انتقل إلى..."
                  autocomplete="off"
                />
                <kbd class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 rounded">
                  ESC
                </kbd>
              </div>
            </div>

            <!-- Commands List -->
            <div id="command-palette-list" class="max-h-[400px] overflow-y-auto">
              <!-- Commands will be inserted here -->
            </div>

            <!-- Footer -->
            <div class="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div class="flex items-center justify-between text-xs text-gray-500">
                <span>اضغط ↑↓ للتنقل</span>
                <span>اضغط Enter للتنفيذ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // Input events
    const input = modal.querySelector('#command-palette-input');
    input.addEventListener('input', (e) => this.handleSearch(e.target.value));
    input.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  attachKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K ou Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }

      // ESC pour fermer
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  handleSearch(query) {
    if (!query.trim()) {
      this.filteredCommands = [...this.commands];
    } else {
      const lowerQuery = query.toLowerCase();
      this.filteredCommands = this.commands.filter(cmd => {
        return cmd.label.toLowerCase().includes(lowerQuery) ||
               cmd.keywords.some(kw => kw.toLowerCase().includes(lowerQuery));
      });
    }

    this.selectedIndex = 0;
    this.render();
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
      this.render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this.render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      this.executeSelected();
    }
  }

  render() {
    const list = this.modal.querySelector('#command-palette-list');
    
    if (this.filteredCommands.length === 0) {
      list.innerHTML = `
        <div class="p-8 text-center text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 256 256">
            <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/>
          </svg>
          <p>لم يتم العثور على نتائج</p>
        </div>
      `;
      return;
    }

    list.innerHTML = this.filteredCommands.map((cmd, index) => `
      <div
        class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
          index === this.selectedIndex
            ? 'bg-primary/10 text-primary'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }"
        onclick="window.commandPalette.execute('${cmd.id}')"
      >
        <span class="text-2xl">${cmd.icon}</span>
        <span class="flex-1 font-medium">${cmd.label}</span>
        ${index === this.selectedIndex ? `
          <kbd class="px-2 py-1 text-xs bg-primary text-white rounded">Enter</kbd>
        ` : ''}
      </div>
    `).join('');
  }

  execute(commandId) {
    const command = this.commands.find(cmd => cmd.id === commandId);
    if (command) {
      command.action();
      this.close();
    }
  }

  executeSelected() {
    if (this.filteredCommands[this.selectedIndex]) {
      this.filteredCommands[this.selectedIndex].action();
      this.close();
    }
  }

  open() {
    this.isOpen = true;
    this.modal.classList.remove('hidden');
    this.filteredCommands = [...this.commands];
    this.selectedIndex = 0;
    this.render();
    
    setTimeout(() => {
      this.modal.querySelector('#command-palette-input').focus();
    }, 50);
  }

  close() {
    this.isOpen = false;
    this.modal.classList.add('hidden');
    this.modal.querySelector('#command-palette-input').value = '';
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// Initialiser globalement
if (typeof window !== 'undefined') {
  window.commandPalette = new CommandPalette();
}
