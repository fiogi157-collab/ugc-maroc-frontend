// ===========================================================
// 💡 UGC Maroc - Système de Tooltips Intelligents
// ===========================================================

class TooltipManager {
  constructor() {
    this.tooltips = new Map();
    this.currentTooltip = null;
    this.init();
  }

  init() {
    // Créer le conteneur de tooltip
    const container = document.createElement('div');
    container.id = 'tooltip-container';
    container.className = 'hidden';
    container.style.cssText = `
      position: fixed;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    this.container = container;

    // Observer les éléments avec data-tooltip
    this.observeTooltips();
  }

  observeTooltips() {
    // MutationObserver pour détecter les nouveaux éléments avec tooltip
    const observer = new MutationObserver(() => {
      this.attachTooltips();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.attachTooltips();
  }

  attachTooltips() {
    const elements = document.querySelectorAll('[data-tooltip]:not([data-tooltip-attached])');
    
    elements.forEach(el => {
      el.setAttribute('data-tooltip-attached', 'true');
      
      el.addEventListener('mouseenter', (e) => {
        const content = el.getAttribute('data-tooltip');
        const type = el.getAttribute('data-tooltip-type') || 'info';
        const position = el.getAttribute('data-tooltip-position') || 'top';
        this.show(el, content, type, position);
      });

      el.addEventListener('mouseleave', () => {
        this.hide();
      });
    });
  }

  show(element, content, type = 'info', position = 'top') {
    const config = this.getConfig(type);
    const rect = element.getBoundingClientRect();

    this.container.innerHTML = `
      <div class="tooltip-content animate-fade-in" dir="rtl">
        <div class="max-w-xs p-3 rounded-lg shadow-xl ${config.bg} ${config.border} backdrop-blur-sm">
          <div class="flex items-start gap-2">
            ${config.icon ? `
              <div class="flex-shrink-0 ${config.iconBg} rounded-full p-1">
                ${config.icon}
              </div>
            ` : ''}
            <div class="flex-1 text-sm ${config.text}">
              ${content}
            </div>
          </div>
        </div>
        <div class="tooltip-arrow ${config.arrowBg}"></div>
      </div>
    `;

    this.container.classList.remove('hidden');
    this.currentTooltip = this.container.firstElementChild;

    // Positionner le tooltip
    this.position(rect, position);
  }

  position(targetRect, position = 'top') {
    const tooltip = this.currentTooltip;
    if (!tooltip) return;

    const tooltipRect = tooltip.getBoundingClientRect();
    const arrow = tooltip.querySelector('.tooltip-arrow');
    
    let top, left;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 10;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        if (arrow) {
          arrow.style.cssText = `
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
            width: 12px;
            height: 12px;
          `;
        }
        break;

      case 'bottom':
        top = targetRect.bottom + 10;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        if (arrow) {
          arrow.style.cssText = `
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%) rotate(45deg);
            width: 12px;
            height: 12px;
          `;
        }
        break;

      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 10;
        if (arrow) {
          arrow.style.cssText = `
            position: absolute;
            right: -6px;
            top: 50%;
            transform: translateY(-50%) rotate(45deg);
            width: 12px;
            height: 12px;
          `;
        }
        break;

      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 10;
        if (arrow) {
          arrow.style.cssText = `
            position: absolute;
            left: -6px;
            top: 50%;
            transform: translateY(-50%) rotate(45deg);
            width: 12px;
            height: 12px;
          `;
        }
        break;
    }

    // Ajustements pour rester dans la fenêtre
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) top = 10;
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  getConfig(type) {
    const configs = {
      info: {
        bg: 'bg-blue-50 dark:bg-blue-950/90',
        border: 'border border-blue-200 dark:border-blue-800',
        text: 'text-blue-900 dark:text-blue-100',
        iconBg: 'bg-blue-500',
        arrowBg: 'bg-blue-50 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z"/>
        </svg>`
      },
      help: {
        bg: 'bg-purple-50 dark:bg-purple-950/90',
        border: 'border border-purple-200 dark:border-purple-800',
        text: 'text-purple-900 dark:text-purple-100',
        iconBg: 'bg-purple-500',
        arrowBg: 'bg-purple-50 dark:bg-purple-950/90 border-purple-200 dark:border-purple-800',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/>
        </svg>`
      },
      success: {
        bg: 'bg-green-50 dark:bg-green-950/90',
        border: 'border border-green-200 dark:border-green-800',
        text: 'text-green-900 dark:text-green-100',
        iconBg: 'bg-green-500',
        arrowBg: 'bg-green-50 dark:bg-green-950/90 border-green-200 dark:border-green-800',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
        </svg>`
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-950/90',
        border: 'border border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-900 dark:text-yellow-100',
        iconBg: 'bg-yellow-500',
        arrowBg: 'bg-yellow-50 dark:bg-yellow-950/90 border-yellow-200 dark:border-yellow-800',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z"/>
        </svg>`
      },
      ai: {
        bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/90 dark:to-pink-950/90',
        border: 'border border-purple-200 dark:border-purple-800',
        text: 'text-purple-900 dark:text-purple-100',
        iconBg: 'bg-gradient-to-br from-purple-500 to-pink-500',
        arrowBg: 'bg-purple-50 dark:bg-purple-950/90 border-purple-200 dark:border-purple-800',
        icon: `<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 256 256">
          <path d="M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.65,71.65,0,0,0,27.64,56.3A32,32,0,0,1,96,186v6h64v-6a32.15,32.15,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Zm-16.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z"/>
        </svg>`
      }
    };

    return configs[type] || configs.info;
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
      this.currentTooltip = null;
    }
  }
}

// Tooltips prédéfinis pour termes courants
const commonTooltips = {
  'roi': {
    ar: 'العائد على الاستثمار: يقيس أرباحك مقارنة بالتكلفة. ROI 100% يعني ضعف استثمارك',
    type: 'help'
  },
  'engagement': {
    ar: 'معدل التفاعل: نسبة المشاهدين الذين تفاعلوا مع المحتوى (إعجاب، تعليق، مشاركة)',
    type: 'help'
  },
  'match-score': {
    ar: '🤖 نسبة التطابق: الذكاء الاصطناعي يحلل مدى توافق المبدع مع علامتك التجارية',
    type: 'ai'
  },
  'escrow': {
    ar: 'الضمان: المبلغ محفوظ بأمان حتى استلام المحتوى والموافقة عليه',
    type: 'info'
  },
  'pending': {
    ar: 'قيد الانتظار: المبلغ محجوز للحملة ولم يتم صرفه بعد',
    type: 'warning'
  },
  'commission': {
    ar: 'عمولة المنصة: 5% للعلامات التجارية، 15% + 17 د.م للمبدعين',
    type: 'info'
  }
};

// Helper function pour ajouter tooltip facilement
function addTooltip(element, content, type = 'info', position = 'top') {
  element.setAttribute('data-tooltip', content);
  element.setAttribute('data-tooltip-type', type);
  element.setAttribute('data-tooltip-position', position);
}

// Initialiser globalement
if (typeof window !== 'undefined') {
  window.tooltipManager = new TooltipManager();
  window.addTooltip = addTooltip;
  window.commonTooltips = commonTooltips;
}

// CSS pour l'animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out;
  }
`;
document.head.appendChild(style);
