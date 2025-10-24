// Configuration de l'application
export const APP_CONFIG = {
  // URLs de l'API
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:5000',
  
  // Informations de l'application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'UGC Maroc Admin',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Configuration des features
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME === 'true',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  
  // Configuration des analytics
  GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID || '',
  MIXPANEL_TOKEN: import.meta.env.VITE_MIXPANEL_TOKEN || '',
  
  // Configuration des intervalles
  REFRESH_INTERVAL: 30000, // 30 secondes
  WEBSOCKET_RECONNECT_INTERVAL: 5000, // 5 secondes
  MAX_RECONNECT_ATTEMPTS: 5,
  
  // Configuration des thèmes
  DEFAULT_THEME: 'dark',
  DEFAULT_LANGUAGE: 'ar',
  
  // Configuration des métriques
  METRICS_UPDATE_INTERVAL: 30000, // 30 secondes
  CHART_ANIMATION_DURATION: 1000, // 1 seconde
};

export default APP_CONFIG;
