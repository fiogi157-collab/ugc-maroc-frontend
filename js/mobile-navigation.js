/**
 * Mobile Navigation System
 * Optimized navigation for mobile devices with touch gestures
 */

class MobileNavigation {
    constructor() {
        this.isMenuOpen = false;
        this.isAIAssistantOpen = false;
        this.currentStep = 1;
        this.totalSteps = 5;
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupAIAssistant();
        this.setupStepNavigation();
        this.setupTouchGestures();
        this.setupKeyboardShortcuts();
        this.setupAutoSave();
    }

    setupMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const aiBtn = document.getElementById('ai-assistant-mobile-btn');
        const aiPanel = document.getElementById('ai-assistant-mobile');
        const closeBtn = document.getElementById('close-ai-mobile');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        if (aiBtn) {
            aiBtn.addEventListener('click', () => this.toggleAIAssistant());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeAIAssistant());
        }

        // Close AI panel when clicking outside
        if (aiPanel) {
            aiPanel.addEventListener('click', (e) => {
                if (e.target === aiPanel) {
                    this.closeAIAssistant();
                }
            });
        }
    }

    setupAIAssistant() {
        // AI Assistant bottom sheet functionality
        const aiPanel = document.getElementById('ai-assistant-mobile');
        
        if (aiPanel) {
            // Add swipe gestures for AI panel
            let startY = 0;
            let currentY = 0;
            let isDragging = false;

            aiPanel.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                isDragging = true;
            });

            aiPanel.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;
                
                // Only allow downward swipe to close
                if (deltaY > 0) {
                    aiPanel.style.transform = `translateY(${Math.min(deltaY, 100)}px)`;
                }
            });

            aiPanel.addEventListener('touchend', () => {
                if (!isDragging) return;
                
                const deltaY = currentY - startY;
                
                if (deltaY > 100) {
                    this.closeAIAssistant();
                } else {
                    aiPanel.style.transform = 'translateY(0)';
                }
                
                isDragging = false;
            });
        }
    }

    setupStepNavigation() {
        // Step navigation for mobile
        this.updateStepIndicator();
        
        // Add step navigation buttons
        this.addStepNavigationButtons();
    }

    setupTouchGestures() {
        // Swipe gestures for step navigation
        let startX = 0;
        let startY = 0;
        let isHorizontalSwipe = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isHorizontalSwipe = false;
        });

        document.addEventListener('touchmove', (e) => {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = Math.abs(currentX - startX);
            const deltaY = Math.abs(currentY - startY);
            
            if (deltaX > deltaY && deltaX > 10) {
                isHorizontalSwipe = true;
                e.preventDefault(); // Prevent scrolling
            }
        });

        document.addEventListener('touchend', (e) => {
            if (!isHorizontalSwipe) return;
            
            const endX = e.changedTouches[0].clientX;
            const deltaX = endX - startX;
            
            if (Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previousStep();
                } else {
                    this.nextStep();
                }
            }
        });

        // Pull to refresh for AI suggestions
        this.setupPullToRefresh();
    }

    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;
        let pullDistance = 0;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            pullDistance = currentY - startY;
            
            if (pullDistance > 0 && pullDistance < 100) {
                // Show pull to refresh indicator
                this.showPullToRefreshIndicator(pullDistance);
            }
        });

        document.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            if (pullDistance > 80) {
                this.refreshAISuggestions();
            }
            
            this.hidePullToRefreshIndicator();
            isPulling = false;
            pullDistance = 0;
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S for save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveDraft();
            }
            
            // Arrow keys for navigation
            if (e.key === 'ArrowLeft') {
                this.previousStep();
            } else if (e.key === 'ArrowRight') {
                this.nextStep();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveDraft();
        }, 30000);

        // Auto-save on form changes
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('input', this.debounce(() => {
                this.saveDraft();
            }, 2000));
        }
    }

    // Mobile Menu Functions
    toggleMobileMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        
        if (this.isMenuOpen) {
            this.showMobileMenu();
        } else {
            this.hideMobileMenu();
        }
    }

    showMobileMenu() {
        const menu = document.createElement('div');
        menu.id = 'mobile-menu-overlay';
        menu.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden';
        menu.innerHTML = `
            <div class="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-xl">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-8">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 text-primary">
                                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
                                </svg>
                            </div>
                            <h1 class="text-xl font-bold">UGC Maroc</h1>
                        </div>
                        <button onclick="mobileNavigation.closeMobileMenu()" class="touch-button p-2 rounded-lg hover:bg-primary/10">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <nav class="flex flex-col gap-2">
                        <a href="/brand/brand_dashboard_premium.html" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-muted-foreground-light dark:text-muted-foreground-dark">
                            <span class="material-symbols-outlined">home</span>
                            <span>Tableau de bord</span>
                        </a>
                        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary">
                            <span class="material-symbols-outlined">campaign</span>
                            <span>Mes Campagnes</span>
                        </a>
                        <a href="/brand/brand-creators-marketplace.html" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-muted-foreground-light dark:text-muted-foreground-dark">
                            <span class="material-symbols-outlined">groups</span>
                            <span>Créateurs</span>
                        </a>
                        <a href="/brand/orders-history.html" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-muted-foreground-light dark:text-muted-foreground-dark">
                            <span class="material-symbols-outlined">receipt</span>
                            <span>Commandes</span>
                        </a>
                        <a href="/brand/notifications.html" class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/10 text-muted-foreground-light dark:text-muted-foreground-dark">
                            <span class="material-symbols-outlined">notifications</span>
                            <span>Notifications</span>
                        </a>
                    </nav>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        this.isMenuOpen = true;
    }

    hideMobileMenu() {
        const menu = document.getElementById('mobile-menu-overlay');
        if (menu) {
            menu.remove();
        }
        this.isMenuOpen = false;
    }

    closeMobileMenu() {
        this.hideMobileMenu();
    }

    // AI Assistant Functions
    toggleAIAssistant() {
        this.isAIAssistantOpen = !this.isAIAssistantOpen;
        
        const aiPanel = document.getElementById('ai-assistant-mobile');
        if (aiPanel) {
            if (this.isAIAssistantOpen) {
                aiPanel.classList.add('open');
            } else {
                aiPanel.classList.remove('open');
            }
        }
    }

    closeAIAssistant() {
        this.isAIAssistantOpen = false;
        const aiPanel = document.getElementById('ai-assistant-mobile');
        if (aiPanel) {
            aiPanel.classList.remove('open');
        }
    }

    // Step Navigation Functions
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStepIndicator();
            this.scrollToStep();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepIndicator();
            this.scrollToStep();
        }
    }

    updateStepIndicator() {
        // Update progress dots
        const dots = document.querySelectorAll('.progress-dot');
        dots.forEach((dot, index) => {
            dot.classList.remove('active', 'completed');
            
            if (index + 1 < this.currentStep) {
                dot.classList.add('completed');
            } else if (index + 1 === this.currentStep) {
                dot.classList.add('active');
            }
        });

        // Update step numbers
        const stepNumbers = document.querySelectorAll('.step-circle');
        stepNumbers.forEach((step, index) => {
            step.classList.remove('step-active', 'step-complete');
            
            if (index + 1 < this.currentStep) {
                step.classList.add('step-complete');
                step.innerHTML = '<span class="material-symbols-outlined">check</span>';
            } else if (index + 1 === this.currentStep) {
                step.classList.add('step-active');
                step.textContent = index + 1;
            }
        });
    }

    addStepNavigationButtons() {
        // Add step navigation buttons for mobile
        const stepContainer = document.querySelector('.progress-dots');
        if (stepContainer) {
            const navButtons = document.createElement('div');
            navButtons.className = 'flex justify-between mt-4';
            navButtons.innerHTML = `
                <button onclick="mobileNavigation.previousStep()" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold flex items-center gap-2" ${this.currentStep === 1 ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">arrow_back</span>
                    <span>Précédent</span>
                </button>
                <button onclick="mobileNavigation.nextStep()" class="px-4 py-2 bg-primary text-white rounded-lg font-semibold flex items-center gap-2" ${this.currentStep === this.totalSteps ? 'disabled' : ''}>
                    <span>Suivant</span>
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            `;
            stepContainer.appendChild(navButtons);
        }
    }

    scrollToStep() {
        // Smooth scroll to current step content
        const stepContent = document.querySelector(`[data-step="${this.currentStep}"]`);
        if (stepContent) {
            stepContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Pull to Refresh Functions
    showPullToRefreshIndicator(distance) {
        let indicator = document.getElementById('pull-to-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pull-to-refresh-indicator';
            indicator.className = 'fixed top-0 left-0 right-0 bg-primary text-white text-center py-2 z-50';
            indicator.innerHTML = `
                <div class="flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">refresh</span>
                    <span>Relâchez pour actualiser les suggestions IA</span>
                </div>
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.transform = `translateY(${Math.min(distance - 50, 50)}px)`;
    }

    hidePullToRefreshIndicator() {
        const indicator = document.getElementById('pull-to-refresh-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    refreshAISuggestions() {
        // Refresh AI suggestions
        if (typeof aiAssistant !== 'undefined') {
            aiAssistant.generateAIBrief();
        }
        this.showToast('Suggestions IA actualisées', 'success');
    }

    // Utility Functions
    saveDraft() {
        const formData = this.getFormData();
        localStorage.setItem('campaign-draft', JSON.stringify({
            ...formData,
            currentStep: this.currentStep,
            lastSaved: new Date().toISOString()
        }));
        
        this.showToast('Brouillon sauvegardé', 'success');
    }

    loadDraft() {
        const draft = localStorage.getItem('campaign-draft');
        if (draft) {
            const data = JSON.parse(draft);
            this.populateForm(data);
            this.currentStep = data.currentStep || 1;
            this.updateStepIndicator();
            this.showToast('Brouillon chargé', 'success');
        }
    }

    getFormData() {
        const form = document.querySelector('form');
        if (!form) return {};
        
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    populateForm(data) {
        Object.keys(data).forEach(key => {
            const field = document.querySelector(`[name="${key}"]`);
            if (field && key !== 'currentStep' && key !== 'lastSaved') {
                field.value = data[key];
            }
        });
    }

    closeAllModals() {
        this.closeAIAssistant();
        this.closeMobileMenu();
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500 text-white' : 
            type === 'success' ? 'bg-green-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    debounce(func, wait) {
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

    // Mobile-specific optimizations
    optimizeForMobile() {
        // Add mobile-specific classes
        document.body.classList.add('mobile-optimized');
        
        // Optimize touch targets
        const touchTargets = document.querySelectorAll('button, a, input, select, textarea');
        touchTargets.forEach(target => {
            if (!target.classList.contains('touch-button')) {
                target.classList.add('touch-button');
            }
        });
        
        // Add mobile viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
    }

    // Performance optimizations
    optimizePerformance() {
        // Lazy load images
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
        
        // Preload critical resources
        this.preloadCriticalResources();
    }

    preloadCriticalResources() {
        const criticalResources = [
            '/css/style.css',
            '/js/config.js',
            '/js/auth.js',
            '/js/api.js'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }
}

// Initialize Mobile Navigation
const mobileNavigation = new MobileNavigation();

// Auto-optimize for mobile on load
document.addEventListener('DOMContentLoaded', () => {
    mobileNavigation.optimizeForMobile();
    mobileNavigation.optimizePerformance();
    
    // Load draft if available
    mobileNavigation.loadDraft();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        mobileNavigation.saveDraft();
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', (e) => {
    mobileNavigation.saveDraft();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigation;
}

