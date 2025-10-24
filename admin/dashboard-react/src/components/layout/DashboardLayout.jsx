import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  Tooltip,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  Campaign as CampaignIcon,
  Store as StoreIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  AccountCircle as AccountCircleIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import { motion, AnimatePresence } from 'framer-motion';

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

const menuItems = [
  { icon: DashboardIcon, label: 'Vue d\'ensemble', path: '/', badge: null },
  { icon: PeopleIcon, label: 'Utilisateurs', path: '/users', badge: '247' },
  { icon: ShoppingCartIcon, label: 'Commandes', path: '/orders', badge: '12' },
  { icon: PaymentIcon, label: 'Paiements', path: '/payments', badge: null },
  { icon: CampaignIcon, label: 'Campagnes', path: '/campaigns', badge: '8' },
  { icon: StoreIcon, label: 'Marketplace', path: '/marketplace', badge: '156' },
  { icon: AnalyticsIcon, label: 'Analytics', path: '/analytics', badge: null },
  { icon: SettingsIcon, label: 'Paramètres', path: '/settings', badge: null },
];

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout');
    handleMenuClose();
  };

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = [
      <Link
        key="home"
        underline="hover"
        color="inherit"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          navigate('/');
        }}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
        Dashboard
      </Link>,
    ];

    pathnames.forEach((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      
      breadcrumbs.push(
        isLast ? (
          <Typography key={name} color="text.primary" sx={{ textTransform: 'capitalize' }}>
            {name}
          </Typography>
        ) : (
          <Link
            key={name}
            underline="hover"
            color="inherit"
            href={routeTo}
            onClick={(e) => {
              e.preventDefault();
              navigate(routeTo);
            }}
            sx={{ textTransform: 'capitalize' }}
          >
            {name}
          </Link>
        )
      );
    });

    return breadcrumbs;
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography variant="h6" fontWeight="bold" color="primary">
              UGC Maroc
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin Dashboard
            </Typography>
          </motion.div>
        )}
        
        <Tooltip title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
          <IconButton onClick={handleCollapseToggle} size="small">
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={collapsed ? item.label : ''} placement="right">
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setMobileOpen(false);
                    }}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      backgroundColor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'primary.contrastText' : 'text.primary',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                      },
                      transition: 'all 0.2s ease-in-out',
                      minHeight: 48,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed ? 'auto' : 40,
                        color: isActive ? 'primary.contrastText' : 'text.secondary',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon />
                    </ListItemIcon>
                    
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', flex: 1 }}
                        >
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.875rem',
                              fontWeight: isActive ? 600 : 400,
                            }}
                          />
                          {item.badge && (
                            <Chip
                              label={item.badge}
                              size="small"
                              color="secondary"
                              sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            </motion.div>
          );
        })}
      </List>

      {/* Theme Toggle */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <FormControlLabel
          control={
            <Switch
              checked={isDarkMode}
              onChange={handleThemeToggle}
              icon={<LightModeIcon />}
              checkedIcon={<DarkModeIcon />}
            />
          }
          label={!collapsed ? (isDarkMode ? 'Dark Mode' : 'Light Mode') : ''}
          sx={{
            justifyContent: collapsed ? 'center' : 'space-between',
            '& .MuiFormControlLabel-label': {
              fontSize: '0.875rem',
            },
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { md: collapsed ? `${collapsedDrawerWidth}px` : `${drawerWidth}px` },
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Breadcrumbs */}
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{ flex: 1, '& .MuiBreadcrumbs-separator': { mx: 1 } }}
          >
            {generateBreadcrumbs()}
          </Breadcrumbs>

          {/* Search */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SearchIcon />
          </IconButton>

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationMenuOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ p: 0 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              A
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: collapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: collapsed ? collapsedDrawerWidth : drawerWidth,
              transition: 'width 0.3s ease-in-out',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="body2">New user registered</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="body2">Payment received</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="body2">System update available</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayout;