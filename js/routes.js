// ===========================================================
// 🗺️ UGC Maroc - Routing System (Maps logical URLs to actual Arabic filenames)
// ===========================================================

const ROUTES = {
  // Brand Routes
  brand: {
    dashboard: '/brand/create-campaign-wizard.html',
    campaigns: '/brand/brand-campaign-details-ar.html',
    createCampaign: '/brand/create-campaign-wizard.html',
    creators: '/brand/brand-creators-marketplace.html',
    wallet: '/brand/orders-history.html',
    settings: '/brand/brand-profile-settings.html',
    messages: '/brand/messages.html',
    analytics: '/brand/analytics.html', // To be created
  },

  // Creator Routes
  creator: {
    dashboard: '/creator/ugc-creator-dashboard.html',
    createGig: '/creator/creator-create-gig.html',
    browseCampaigns: '/creator/creator-browse-campaigns.html',
    earnings: '/creator/creator-earnings-history.html',
    withdrawal: '/creator/withdrawal-redirect.html',
    profile: '/creator/profile.html',
    messages: '/creator/messages.html',
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
