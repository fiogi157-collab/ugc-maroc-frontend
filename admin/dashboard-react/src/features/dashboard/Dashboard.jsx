import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  People,
  ShoppingCart,
  Payment,
  TrendingDown,
  ContentPaste,
  Security,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import MetricCard from '../../components/widgets/MetricCard';
import { fetchDashboardMetrics } from '../../store/slices/dashboardSlice';
import { selectDashboardMetrics, selectIsLoading } from '../../store/slices/dashboardSlice';

const Dashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const metrics = useSelector(selectDashboardMetrics);
  const loading = useSelector(selectIsLoading);
  
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Charger les métriques au montage du composant
  useEffect(() => {
    dispatch(fetchDashboardMetrics());
  }, [dispatch]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchDashboardMetrics());
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDashboardMetrics());
    setLastRefresh(new Date());
  };

  // Données des métriques principales
  const mainMetrics = [
    {
      title: 'Revenus Totaux',
      value: metrics.totalRevenue || 0,
      change: 12.5,
      trend: 'up',
      icon: <TrendingUp />,
      color: 'success',
      sparklineData: [100, 120, 110, 140, 130, 160, 150, 180, 170, 200, 190, 220],
    },
    {
      title: 'Utilisateurs Actifs',
      value: metrics.activeUsers || 0,
      change: 8.3,
      trend: 'up',
      icon: <People />,
      color: 'primary',
      sparklineData: [50, 55, 60, 58, 65, 70, 68, 75, 80, 85, 90, 95],
    },
    {
      title: 'Commandes en Cours',
      value: metrics.pendingOrders || 0,
      change: -2.1,
      trend: 'down',
      icon: <ShoppingCart />,
      color: 'warning',
      sparklineData: [20, 25, 22, 28, 30, 27, 32, 35, 33, 38, 40, 42],
    },
    {
      title: 'Paiements Reçus',
      value: metrics.totalRevenue || 0,
      change: 15.7,
      trend: 'up',
      icon: <Payment />,
      color: 'info',
      sparklineData: [80, 85, 90, 88, 95, 100, 98, 105, 110, 115, 120, 125],
    },
  ];

  // Métriques secondaires
  const secondaryMetrics = [
    {
      title: 'Retraits Totaux',
      value: metrics.totalWithdrawals || 0,
      change: 5.2,
      trend: 'up',
      icon: <TrendingDown />,
      color: 'error',
    },
    {
      title: 'Contenu Modéré',
      value: 1247,
      change: 3.8,
      trend: 'up',
      icon: <ContentPaste />,
      color: 'primary',
    },
    {
      title: 'Alertes Sécurité',
      value: 3,
      change: -50,
      trend: 'down',
      icon: <Security />,
      color: 'warning',
    },
    {
      title: 'Commission Plateforme',
      value: metrics.platformCommission || 0,
      change: 18.4,
      trend: 'up',
      icon: <TrendingUp />,
      color: 'success',
    },
  ];

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Tableau de Bord Admin
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          Vue d'ensemble des performances de la plateforme UGC Maroc
        </Typography>
      </Box>

      {/* Métriques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mainMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MetricCard
                {...metric}
                loading={loading}
                onRefresh={handleRefresh}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Métriques secondaires */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {secondaryMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (index + 4) * 0.1 }}
            >
              <MetricCard
                {...metric}
                loading={loading}
                onRefresh={handleRefresh}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Section graphiques (placeholder pour l'instant) */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(26, 31, 46, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  textAlign: 'center',
                }}
              >
                📊 Graphique des Revenus
                <br />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  (ApexCharts sera intégré ici)
                </Typography>
              </Typography>
            </Paper>
          </motion.div>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(26, 31, 46, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  textAlign: 'center',
                }}
              >
                👥 Utilisateurs Actifs
                <br />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  (Graphique en temps réel)
                </Typography>
              </Typography>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      {/* Bouton de rafraîchissement flottant */}
      <Tooltip title="Actualiser les données">
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
          }}
          onClick={handleRefresh}
        >
          <Refresh />
        </Fab>
      </Tooltip>

      {/* Indicateur de dernière mise à jour */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          p: 1.5,
          background: 'rgba(26, 31, 46, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
          }}
        >
          Dernière mise à jour: {lastRefresh.toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;
