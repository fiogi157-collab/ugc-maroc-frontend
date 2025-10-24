import { createTheme } from '@mui/material/styles';

// Palette de couleurs personnalisée pour UGC Maroc
const palette = {
  mode: 'dark',
  primary: {
    main: '#667eea',
    light: '#8b9ff5',
    dark: '#4e5fc4',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#764ba2',
    light: '#9b6ec9',
    dark: '#5a3a7d',
    contrastText: '#ffffff',
  },
  background: {
    default: '#0f1419',
    paper: '#1a1f2e',
    elevated: '#232938',
  },
  surface: {
    main: '#1a1f2e',
    light: '#232938',
    dark: '#0f1419',
  },
  success: {
    main: '#00c851',
    light: '#4caf50',
    dark: '#388e3c',
  },
  warning: {
    main: '#ffbb33',
    light: '#ffc107',
    dark: '#f57c00',
  },
  error: {
    main: '#ff4444',
    light: '#f44336',
    dark: '#d32f2f',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
  },
  text: {
    primary: '#ffffff',
    secondary: '#b0b3b8',
    disabled: '#6c757d',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
};

// Typographie personnalisée
const typography = {
  fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    color: palette.text.secondary,
  },
  button: {
    fontWeight: 600,
    textTransform: 'none',
  },
};

// Ombres personnalisées pour glassmorphism
const shadows = [
  'none',
  '0px 2px 4px rgba(0, 0, 0, 0.1)',
  '0px 4px 8px rgba(0, 0, 0, 0.15)',
  '0px 8px 16px rgba(0, 0, 0, 0.2)',
  '0px 12px 24px rgba(0, 0, 0, 0.25)',
  '0px 16px 32px rgba(0, 0, 0, 0.3)',
  '0px 20px 40px rgba(0, 0, 0, 0.35)',
  '0px 24px 48px rgba(0, 0, 0, 0.4)',
  '0px 28px 56px rgba(0, 0, 0, 0.45)',
  '0px 32px 64px rgba(0, 0, 0, 0.5)',
  '0px 36px 72px rgba(0, 0, 0, 0.55)',
  '0px 40px 80px rgba(0, 0, 0, 0.6)',
  '0px 44px 88px rgba(0, 0, 0, 0.65)',
  '0px 48px 96px rgba(0, 0, 0, 0.7)',
  '0px 52px 104px rgba(0, 0, 0, 0.75)',
  '0px 56px 112px rgba(0, 0, 0, 0.8)',
  '0px 60px 120px rgba(0, 0, 0, 0.85)',
  '0px 64px 128px rgba(0, 0, 0, 0.9)',
  '0px 68px 136px rgba(0, 0, 0, 0.95)',
  '0px 72px 144px rgba(0, 0, 0, 1)',
  '0px 76px 152px rgba(0, 0, 0, 1)',
  '0px 80px 160px rgba(0, 0, 0, 1)',
  '0px 84px 168px rgba(0, 0, 0, 1)',
  '0px 88px 176px rgba(0, 0, 0, 1)',
  '0px 92px 184px rgba(0, 0, 0, 1)',
];

// Configuration du thème principal
const theme = createTheme({
  palette,
  typography,
  shadows,
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    // Personnalisation des composants Material-UI
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 31, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(26, 31, 46, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#667eea',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(15, 20, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(15, 20, 25, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        },
      },
    },
  },
});

// Thème clair (optionnel)
export const lightTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'light',
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
      elevated: '#f1f5f9',
    },
    surface: {
      main: '#ffffff',
      light: '#f8fafc',
      dark: '#e2e8f0',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
      disabled: '#a0aec0',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  components: {
    ...theme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme;
