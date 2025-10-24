import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  loading: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    logout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, setLoading, logout } = userSlice.actions;
export default userSlice.reducer;