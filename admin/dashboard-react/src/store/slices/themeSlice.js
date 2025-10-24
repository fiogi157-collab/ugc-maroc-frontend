import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mode: 'light', // 'light' ou 'dark'
  primaryColor: '#5B13EC',
  secondaryColor: '#00D4AA',
  glassmorphism: true,
  animations: true,
  compactMode: false,
  language: 'fr', // 'fr', 'ar', 'en'
  sidebarCollapsed: false,
  notifications: {
    sound: true,
    desktop: true,
    email: true
  }
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
    setPrimaryColor: (state, action) => {
      state.primaryColor = action.payload;
    },
    setSecondaryColor: (state, action) => {
      state.secondaryColor = action.payload;
    },
    toggleGlassmorphism: (state) => {
      state.glassmorphism = !state.glassmorphism;
    },
    toggleAnimations: (state) => {
      state.animations = !state.animations;
    },
    toggleCompactMode: (state) => {
      state.compactMode = !state.compactMode;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    updateNotifications: (state, action) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    resetTheme: () => initialState
  }
});

export const {
  toggleTheme,
  setTheme,
  setPrimaryColor,
  setSecondaryColor,
  toggleGlassmorphism,
  toggleAnimations,
  toggleCompactMode,
  setLanguage,
  toggleSidebar,
  setSidebarCollapsed,
  updateNotifications,
  resetTheme
} = themeSlice.actions;

export default themeSlice.reducer;