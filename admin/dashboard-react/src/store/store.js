import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '../services/api';
import dashboardSlice from './slices/dashboardSlice';
import userSlice from './slices/userSlice';
import notificationSlice from './slices/notificationSlice';
import themeSlice from './slices/themeSlice';

// Configuration du store Redux
export const store = configureStore({
  reducer: {
    // API slice pour les requêtes
    [api.reducerPath]: api.reducer,
    
    // Slices pour l'état local
    dashboard: dashboardSlice,
    user: userSlice,
    notifications: notificationSlice,
    theme: themeSlice,
  },
  
  // Middleware
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignorer les actions qui contiennent des fonctions ou des objets non sérialisables
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    }).concat(api.middleware),
  
  // Configuration pour le développement
  devTools: import.meta.env.DEV,
});

// Configuration des listeners pour les requêtes automatiques
setupListeners(store.dispatch);

// Types pour TypeScript (optionnel) - Commentés pour éviter les erreurs Vite
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
