import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { store } from './store/store';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#f093fb',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<div>Users Page - Coming Soon</div>} />
              <Route path="orders" element={<div>Orders Page - Coming Soon</div>} />
              <Route path="payments" element={<div>Payments Page - Coming Soon</div>} />
              <Route path="campaigns" element={<div>Campaigns Page - Coming Soon</div>} />
              <Route path="marketplace" element={<div>Marketplace Page - Coming Soon</div>} />
              <Route path="analytics" element={<div>Analytics Page - Coming Soon</div>} />
              <Route path="settings" element={<div>Settings Page - Coming Soon</div>} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;