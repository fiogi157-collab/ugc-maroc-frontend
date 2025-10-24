import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isDarkMode: false,
  language: 'fr',
  sidebarCollapsed: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
  },
});

export const { toggleTheme, setLanguage, toggleSidebar } = themeSlice.actions;
export default themeSlice.reducer;