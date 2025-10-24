import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  Notifications,
  Settings,
  AccountCircle,
  Language,
  DarkMode,
  LightMode,
  Refresh,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { selectThemeMode, selectLanguage } from '../../store/slices/themeSlice';
import { selectUnreadCount } from '../../store/slices/notificationSlice';
import { setMode, setLanguage } from '../../store/slices/themeSlice';

const Header = ({ onMenuClick, unreadCount, isMobile }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const themeMode = useSelector(selectThemeMode);
  const language = useSelector(selectLanguage);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleThemeToggle = () => {
    dispatch(setMode(themeMode === 'dark' ? 'light' : 'dark'));
  };

  const handleLanguageChange = (newLanguage) => {
    dispatch(setLanguage(newLanguage));
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    // Implémenter la recherche globale
    console.log('Search:', searchValue);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        background: 'rgba(15, 20, 25, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Section gauche */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuClick}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          {!isMobile && (
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Dashboard Admin
            </Typography>
          )}
        </Box>

        {/* Section centre - Recherche */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, maxWidth: 400, mx: 4 }}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                size="small"
                placeholder="Rechercher utilisateurs, commandes, paiements..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
            </form>
          </Box>
        )}

        {/* Section droite */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Bouton de rafraîchissement */}
          <IconButton
            color="inherit"
            onClick={handleRefresh}
            title="Actualiser"
          >
            <Refresh />
          </IconButton>

          {/* Bouton plein écran */}
          <IconButton
            color="inherit"
            onClick={handleFullscreenToggle}
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>

          {/* Sélecteur de langue */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {['ar', 'fr', 'en'].map((lang) => (
              <Chip
                key={lang}
                label={lang.toUpperCase()}
                size="small"
                variant={language === lang ? 'filled' : 'outlined'}
                onClick={() => handleLanguageChange(lang)}
                sx={{
                  minWidth: 32,
                  height: 24,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              />
            ))}
          </Box>

          {/* Bouton thème */}
          <IconButton
            color="inherit"
            onClick={handleThemeToggle}
            title={`Basculer vers le thème ${themeMode === 'dark' ? 'clair' : 'sombre'}`}
          >
            {themeMode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>

          {/* Notifications */}
          <IconButton
            color="inherit"
            title="Notifications"
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Paramètres */}
          <IconButton
            color="inherit"
            title="Paramètres"
          >
            <Settings />
          </IconButton>

          {/* Profil utilisateur */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            title="Profil utilisateur"
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <AccountCircle />
            </Avatar>
          </IconButton>

          {/* Menu profil */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                minWidth: 200,
                mt: 1,
              },
            }}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <AccountCircle sx={{ mr: 2 }} />
              Mon profil
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <Settings sx={{ mr: 2 }} />
              Paramètres
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <Language sx={{ mr: 2 }} />
              Langue
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <DarkMode sx={{ mr: 2 }} />
              Thème
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
