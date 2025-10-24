import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  metrics: {
    revenue: 0,
    users: 0,
    orders: 0,
    rating: 0,
  },
  loading: false,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setMetrics: (state, action) => {
      state.metrics = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    updateLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { setMetrics, setLoading, updateLastUpdated } = dashboardSlice.actions;
export default dashboardSlice.reducer;