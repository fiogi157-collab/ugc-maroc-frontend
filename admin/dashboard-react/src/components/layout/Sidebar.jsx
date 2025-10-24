import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  People,
  ShoppingCart,
  Payment,
  TrendingUp,
  ContentPaste,
  Settings,
  Notifications,
  Security,
  Analytics,
  Support,
  Logout,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { selectSidebarCollapsed, selectThemeMode } from '../../store/slices/themeSlice';
import { toggleSidebar } from '../../store/slices/themeSlice';

const menuItems = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: <Dashboard />,
    path: '/admin/dashboard',
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: <People />,
    path: '/admin/users',
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: <ShoppingCart />,
    path: '/admin/orders',
  },
  {
    id: 'payments',
    label: 'Paiements',
    icon: <Payment />,
    path: '/admin/payments',
  },
  {
    id: 'withdrawals',
    label: 'Retraits',
    icon: <TrendingUp />,
    path: '/admin/withdrawals',
  },
  {
    id: 'content',
    label: 'Contenu',
    icon: <ContentPaste />,
    path: '/admin/content',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <Analytics />,
    path: '/admin/analytics',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Notifications />,
    path: '/admin/notifications',
  },
  {
    id: 'security',
    label: 'Sécurité',
    icon: <Security />,
    path: '/admin/security',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: <Settings />,
    path: '/admin/settings',
  },
  {
    id: 'support',
    label: 'Support',
    icon: <Support />,
    path: '/admin/support',
  },
];

const Sidebar = ({ open, onClose, collapsed, isMobile, drawerWidth }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);
  const themeMode = useSelector(selectThemeMode);

  const handleToggleCollapse = () => {
    if (!isMobile) {
      dispatch(toggleSidebar());
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Header de la sidebar */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: '64px',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {!collapsed && (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            UGC Maroc
          </Typography>
        )}
        
        {!isMobile && (
          <Tooltip title={collapsed ? 'Développer' : 'Réduire'}>
            <Box
              onClick={handleToggleCollapse}
              sx={{
                cursor: 'pointer',
                p: 0.5,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              {collapsed ? <ChevronRight /> : <ChevronLeft />}
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Menu principal */}
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip
              title={collapsed ? item.label : ''}
              placement="right"
              disableHoverListener={!collapsed}
            >
              <ListItemButton
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1.5 : 2,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    border: `1px solid rgba(102, 126, 234, 0.2)`,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 'auto' : 40,
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Menu utilisateur */}
      <List sx={{ px: 1, py: 2 }}>
        <ListItem disablePadding>
          <Tooltip
            title={collapsed ? 'Déconnexion' : ''}
            placement="right"
            disableHoverListener={!collapsed}
          >
            <ListItemButton
              sx={{
                borderRadius: 2,
                minHeight: 48,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
                color: theme.palette.error.main,
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 'auto' : 40,
                  color: theme.palette.error.main,
                }}
              >
                <Logout />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary="Déconnexion"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                />
              )}
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Meilleure performance sur mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            background: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: drawerWidth,
          background: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
