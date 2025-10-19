// =====================================================
// 🌙 Dark Mode Toggle - UGC Maroc
// =====================================================

class DarkModeToggle {
  constructor() {
    this.init();
  }

  init() {
    // Check saved preference or default to light
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Create toggle button if not exists
    this.createToggleButton();
  }

  createToggleButton() {
    // Check if button already exists
    if (document.getElementById('dark-mode-toggle')) return;

    // Find header or create container
    let container = document.querySelector('header');
    if (!container) {
      container = document.querySelector('nav');
    }

    // If still no container, create a fixed button
    if (!container) {
      this.createFixedButton();
      return;
    }

    // Create toggle button
    const button = document.createElement('button');
    button.id = 'dark-mode-toggle';
    button.className = 'fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-110';
    button.setAttribute('aria-label', 'تبديل الوضع الداكن');
    button.innerHTML = this.getIconHTML();

    // Add to page
    document.body.appendChild(button);

    // Add event listener
    button.addEventListener('click', () => this.toggle());

    console.log('✅ Dark mode toggle initialized');
  }

  createFixedButton() {
    const button = document.createElement('button');
    button.id = 'dark-mode-toggle';
    button.className = 'fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:scale-110';
    button.setAttribute('aria-label', 'تبديل الوضع الداكن');
    button.innerHTML = this.getIconHTML();
    
    document.body.appendChild(button);
    button.addEventListener('click', () => this.toggle());
  }

  getIconHTML() {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
      // Sun icon (switch to light)
      return `
        <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 256 256">
          <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"/>
        </svg>
      `;
    } else {
      // Moon icon (switch to dark)
      return `
        <svg class="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 256 256">
          <path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z"/>
        </svg>
      `;
    }
  }

  toggle() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update icon
    const button = document.getElementById('dark-mode-toggle');
    if (button) {
      button.innerHTML = this.getIconHTML();
    }

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: isDark ? 'dark' : 'light' } }));

    // Show toast notification
    if (window.toastManager) {
      window.toastManager.info(isDark ? '🌙 تم تفعيل الوضع الداكن' : '☀️ تم تفعيل الوضع الفاتح');
    }
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.darkModeToggle = new DarkModeToggle();
  });
} else {
  window.darkModeToggle = new DarkModeToggle();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DarkModeToggle;
}
