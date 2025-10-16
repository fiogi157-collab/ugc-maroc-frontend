// ===========================================================
// 🗺️ UGC Maroc - Routing System (Maps logical URLs to actual Arabic filenames)
// ===========================================================

const ROUTES = {
  // Brand Routes
  brand: {
    dashboard: '/brand/brand_dashboard_premium.html',
    dashboardOld: '/brand/brand_dashboard_-_variant_2.html',
    campaigns: '/brand/تفاصيل_الحملة_(للعلامات_التجارية).html',
    createCampaign: '/brand/إنشاء_حملة_جديدة.html',
    creators: '/brand/سوق_المبدعين_(للعلامات_التجارية).html',
    wallet: '/brand/محفظة_العلامة_التجارية_والفواتير.html',
    settings: '/brand/إعدادات_ملف_العلامة_التجارية_4.html',
    messages: '/brand/messages.html', // To be created
    analytics: '/brand/analytics.html', // To be created
  },

  // Creator Routes (will be added when needed)
  creator: {
    dashboard: '/creator/creator_dashboard.html',
  },

  // Public Routes
  public: {
    home: '/index.html',
    brandLogin: '/brand-login.html',
    creatorLogin: '/creator-login.html',
    support: '/support.html',
  },

  // Docs
  docs: {
    gettingStarted: '/docs/getting-started.html',
    wallet: '/docs/wallet.html',
  }
};

// Helper function to navigate
function navigateTo(route) {
  if (typeof route === 'string') {
    window.location.href = route;
  } else {
    console.error('Route invalide:', route);
  }
}

// Helper to get route by path
function getRoute(path) {
  const parts = path.split('.');
  let current = ROUTES;
  
  for (const part of parts) {
    current = current[part];
    if (!current) {
      console.warn(`Route non trouvée: ${path}`);
      return null;
    }
  }
  
  return current;
}

// Export globally
if (typeof window !== 'undefined') {
  window.ROUTES = ROUTES;
  window.navigateTo = navigateTo;
  window.getRoute = getRoute;
}
