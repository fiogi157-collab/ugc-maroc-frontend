// ===========================================================
// 📭 UGC Maroc - Empty States Engageants
// ===========================================================

class EmptyStates {
  constructor() {
    this.states = this.defineStates();
  }

  defineStates() {
    return {
      // Campagnes
      campaigns: {
        icon: '🎯',
        title: 'لا توجد حملات بعد',
        description: 'ابدأ أول حملة لك في 3 دقائق فقط',
        actions: [
          {
            label: '🚀 إطلاق حملة الآن',
            type: 'primary',
            href: '/brand/إنشاء_حملة_جديدة.html'
          },
          {
            label: '📚 كيف تبدأ؟',
            type: 'secondary',
            href: '/docs/getting-started.html'
          }
        ],
        image: `
          <svg class="w-32 h-32 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        `
      },

      activeCampaigns: {
        icon: '📢',
        title: 'لا توجد حملات نشطة',
        description: 'جميع حملاتك مكتملة أو في المراجعة',
        actions: [
          {
            label: 'إنشاء حملة جديدة',
            type: 'primary',
            onclick: 'window.location.href="/brand/create-campaign.html"'
          },
          {
            label: 'عرض الحملات المكتملة',
            type: 'secondary',
            onclick: 'showCompletedCampaigns()'
          }
        ]
      },

      // Créateurs
      creators: {
        icon: '👥',
        title: 'لم تدع أي مبدع بعد',
        description: 'ابحث عن المبدعين المثاليين لعلامتك التجارية',
        actions: [
          {
            label: '🔍 تصفح المبدعين',
            type: 'primary',
            href: '/brand/سوق_المبدعين_(للعلامات_التجارية).html'
          },
          {
            label: '🤖 توصيات الذكاء الاصطناعي',
            type: 'ai',
            href: '/brand/ai-recommendations.html'
          }
        ],
        image: `
          <svg class="w-32 h-32 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        `
      },

      submissions: {
        icon: '📭',
        title: 'لا توجد مشاركات بعد',
        description: 'لم يقم المبدعون بتقديم محتوى لهذه الحملة',
        actions: [
          {
            label: 'دعوة المزيد من المبدعين',
            type: 'primary',
            onclick: 'inviteCreators()'
          },
          {
            label: 'عرض تفاصيل الحملة',
            type: 'secondary',
            onclick: 'viewCampaignDetails()'
          }
        ]
      },

      // Messages
      messages: {
        icon: '💬',
        title: 'صندوق الوارد فارغ',
        description: 'لا توجد رسائل جديدة',
        actions: [
          {
            label: 'بدء محادثة',
            type: 'primary',
            onclick: 'startNewConversation()'
          }
        ],
        image: `
          <svg class="w-32 h-32 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        `
      },

      // Wallet
      walletEmpty: {
        icon: '💰',
        title: 'محفظتك فارغة',
        description: 'قم بإعادة شحن محفظتك لبدء إطلاق الحملات',
        actions: [
          {
            label: '💳 إعادة شحن الآن',
            type: 'primary',
            onclick: 'openRechargeModal()'
          },
          {
            label: 'معرفة المزيد',
            type: 'secondary',
            href: '/docs/wallet.html'
          }
        ],
        alert: {
          type: 'warning',
          message: 'تحتاج إلى رصيد لإطلاق حملات جديدة'
        }
      },

      transactions: {
        icon: '💸',
        title: 'لا توجد معاملات',
        description: 'سجل معاملاتك سيظهر هنا',
        actions: [
          {
            label: 'إعادة شحن المحفظة',
            type: 'primary',
            onclick: 'openRechargeModal()'
          }
        ]
      },

      // Analytics
      noData: {
        icon: '📊',
        title: 'لا توجد بيانات كافية',
        description: 'ستظهر الإحصائيات بعد إطلاق حملتك الأولى',
        actions: [
          {
            label: 'إطلاق حملة',
            type: 'primary',
            href: '/brand/إنشاء_حملة_جديدة.html'
          }
        ]
      },

      // Search Results
      searchEmpty: {
        icon: '🔍',
        title: 'لم يتم العثور على نتائج',
        description: 'حاول استخدام كلمات مفتاحية مختلفة',
        actions: [
          {
            label: 'مسح البحث',
            type: 'secondary',
            onclick: 'clearSearch()'
          },
          {
            label: '🤖 اقتراحات الذكاء الاصطناعي',
            type: 'ai',
            onclick: 'showAISuggestions()'
          }
        ]
      },

      // Notifications
      notifications: {
        icon: '🔔',
        title: 'لا توجد إشعارات',
        description: 'أنت على اطلاع بكل شيء!',
        image: `
          <svg class="w-32 h-32 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
        `
      },

      // Onboarding
      welcome: {
        icon: '👋',
        title: 'مرحبا بك في UGC Maroc!',
        description: 'لنبدأ بإعداد حسابك وإطلاق حملتك الأولى',
        actions: [
          {
            label: '🚀 ابدأ الجولة التوجيهية',
            type: 'primary',
            onclick: 'startOnboarding()'
          },
          {
            label: 'تخطي',
            type: 'secondary',
            onclick: 'skipOnboarding()'
          }
        ],
        checklist: [
          { id: 'profile', label: 'إكمال الملف الشخصي', completed: false },
          { id: 'payment', label: 'إضافة طريقة دفع', completed: false },
          { id: 'campaign', label: 'إطلاق حملة', completed: false },
          { id: 'creators', label: 'دعوة 3 مبدعين', completed: false }
        ]
      },

      // Errors
      error: {
        icon: '⚠️',
        title: 'حدث خطأ',
        description: 'عذراً، حدث خطأ أثناء تحميل البيانات',
        actions: [
          {
            label: 'إعادة المحاولة',
            type: 'primary',
            onclick: 'location.reload()'
          },
          {
            label: 'الاتصال بالدعم',
            type: 'secondary',
            href: '/support.html'
          }
        ]
      },

      offline: {
        icon: '📡',
        title: 'غير متصل بالإنترنت',
        description: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
        actions: [
          {
            label: 'إعادة المحاولة',
            type: 'primary',
            onclick: 'location.reload()'
          }
        ]
      }
    };
  }

  render(type, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = this.states[type];
    if (!state) {
      console.warn(`Empty state type "${type}" not found`);
      return;
    }

    // Merge with custom options
    const config = { ...state, ...options };

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-12 text-center" dir="rtl">
        ${config.image || ''}
        <div class="text-6xl mb-4">${config.icon}</div>
        <h3 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">${config.title}</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6 max-w-md">${config.description}</p>
        
        ${config.alert ? `
          <div class="w-full max-w-md mb-6 p-4 rounded-lg ${
            config.alert.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800' :
            config.alert.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800' :
            'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
          }">
            <p class="text-sm font-medium">${config.alert.message}</p>
          </div>
        ` : ''}

        ${config.checklist ? this.renderChecklist(config.checklist) : ''}

        ${config.actions ? this.renderActions(config.actions) : ''}
      </div>
    `;
  }

  renderActions(actions) {
    return `
      <div class="flex flex-wrap gap-3 justify-center">
        ${actions.map(action => {
          const buttonClass = action.type === 'primary' 
            ? 'px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all hover:shadow-glow-primary font-semibold'
            : action.type === 'ai'
            ? 'px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold'
            : 'px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';

          if (action.href) {
            return `<a href="${action.href}" class="${buttonClass}">${action.label}</a>`;
          } else if (action.onclick) {
            return `<button onclick="${action.onclick}" class="${buttonClass}">${action.label}</button>`;
          }
          return '';
        }).join('')}
      </div>
    `;
  }

  renderChecklist(items) {
    return `
      <div class="w-full max-w-md mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h4 class="font-semibold mb-3 text-right">قائمة المهام:</h4>
        <div class="space-y-2">
          ${items.map(item => `
            <div class="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
              <div class="w-6 h-6 rounded-full border-2 ${
                item.completed 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-gray-300 dark:border-gray-600'
              } flex items-center justify-center">
                ${item.completed ? `
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
                  </svg>
                ` : ''}
              </div>
              <span class="flex-1 text-right ${item.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}">
                ${item.label}
              </span>
            </div>
          `).join('')}
        </div>
        <div class="mt-3 text-sm text-gray-500 text-right">
          ${items.filter(i => i.completed).length} من ${items.length} مكتملة
        </div>
      </div>
    `;
  }

  // Helper: Render inline (for smaller spaces)
  renderInline(type, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = this.states[type];
    if (!state) return;

    const config = { ...state, ...options };

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div class="text-4xl mb-2">${config.icon}</div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${config.description}</p>
        ${config.actions && config.actions[0] ? `
          <button onclick="${config.actions[0].onclick || `window.location.href='${config.actions[0].href}'`}" 
                  class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors">
            ${config.actions[0].label}
          </button>
        ` : ''}
      </div>
    `;
  }
}

// Instance globale
if (typeof window !== 'undefined') {
  window.emptyStates = new EmptyStates();
}
