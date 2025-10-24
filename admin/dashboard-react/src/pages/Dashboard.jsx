import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  IconButton,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PersonAdd as PersonAddIcon,
  Payment as PaymentIcon,
  Campaign as CampaignIcon,
  Store as StoreIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MetricCard from '../components/widgets/MetricCard';
import RevenueChart from '../components/charts/RevenueChart';
import UsersGrowthChart from '../components/charts/UsersGrowthChart';
import OrdersFunnelChart from '../components/charts/OrdersFunnelChart';
import ActivityHeatmap from '../components/charts/ActivityHeatmap';

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Mock data - In real app, this would come from Redux store or API
  const metrics = [
    {
      title: 'Revenus Totaux',
      value: '487,250 MAD',
      change: 23.5,
      trend: 'up',
      icon: <AttachMoneyIcon />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      sparklineData: [12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48],
      color: 'primary',
    },
    {
      title: 'Utilisateurs Actifs',
      value: '1,247',
      change: 12.3,
      trend: 'up',
      icon: <PeopleIcon />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      sparklineData: [8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45],
      color: 'secondary',
    },
    {
      title: 'Commandes',
      value: '856',
      change: 8.7,
      trend: 'up',
      icon: <ShoppingCartIcon />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      sparklineData: [5, 8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42],
      color: 'info',
    },
    {
      title: 'Note Moyenne',
      value: '4.8/5',
      change: 0.2,
      trend: 'up',
      icon: <StarIcon />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      sparklineData: [4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.8, 4.7, 4.8, 4.8, 4.8],
      color: 'success',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'new_user',
      user: 'Ahmed El Mansouri',
      timestamp: 'Il y a 2 min',
      icon: <PersonAddIcon />,
      color: 'success',
    },
    {
      id: 2,
      type: 'new_order',
      amount: '2,500 MAD',
      timestamp: 'Il y a 5 min',
      icon: <ShoppingCartIcon />,
      color: 'primary',
    },
    {
      id: 3,
      type: 'payment_received',
      amount: '1,800 MAD',
      timestamp: 'Il y a 8 min',
      icon: <PaymentIcon />,
      color: 'success',
    },
    {
      id: 4,
      type: 'new_campaign',
      title: 'Campagne Produits Bio',
      timestamp: 'Il y a 12 min',
      icon: <CampaignIcon />,
      color: 'info',
    },
    {
      id: 5,
      type: 'new_gig',
      title: 'Création de Contenu Vidéo',
      timestamp: 'Il y a 15 min',
      icon: <StoreIcon />,
      color: 'warning',
    },
  ];

  const topPerformers = [
    {
      id: 1,
      name: 'Fatima Zahra',
      role: 'Creator',
      avatar: 'FZ',
      revenue: '15,250 MAD',
      orders: 23,
      rating: 4.9,
      trend: 'up',
    },
    {
      id: 2,
      name: 'Omar Benali',
      role: 'Brand',
      avatar: 'OB',
      revenue: '28,500 MAD',
      orders: 12,
      rating: 4.8,
      trend: 'up',
    },
    {
      id: 3,
      name: 'Aicha Alami',
      role: 'Creator',
      avatar: 'AA',
      revenue: '12,800 MAD',
      orders: 18,
      rating: 4.7,
      trend: 'down',
    },
  ];

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Vue d'ensemble
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bienvenue sur votre tableau de bord administrateur
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="small"
            >
              Actualiser
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <motion.div variants={itemVariants}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <MetricCard
                {...metric}
                loading={loading}
                onClick={() => console.log(`Clicked on ${metric.title}`)}
              />
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Chart */}
        <motion.div variants={itemVariants}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Revenus et Tendances
                  </Typography>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <RevenueChart height={300} />
              </CardContent>
            </Card>
          </Grid>
        </motion.div>

        {/* Users Growth Chart */}
        <motion.div variants={itemVariants}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Croissance Utilisateurs
                  </Typography>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <UsersGrowthChart height={300} />
              </CardContent>
            </Card>
          </Grid>
        </motion.div>

        {/* Orders Funnel */}
        <motion.div variants={itemVariants}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 350 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Entonnoir des Commandes
                  </Typography>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <OrdersFunnelChart height={250} />
              </CardContent>
            </Card>
          </Grid>
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div variants={itemVariants}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: 350 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Activité par Heure
                  </Typography>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <ActivityHeatmap height={250} />
              </CardContent>
            </Card>
          </Grid>
        </motion.div>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Activité Récente
                  </Typography>
                  <Button variant="text" size="small">
                    Voir tout
                  </Button>
                </Box>
                <List>
                  {recentActivity.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: `${theme.palette[activity.color].main}20`,
                              color: theme.palette[activity.color].main,
                            }}
                          >
                            {activity.icon}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {activity.type === 'new_user' && `Nouvel utilisateur: ${activity.user}`}
                                {activity.type === 'new_order' && `Nouvelle commande: ${activity.amount}`}
                                {activity.type === 'payment_received' && `Paiement reçu: ${activity.amount}`}
                                {activity.type === 'new_campaign' && `Nouvelle campagne: ${activity.title}`}
                                {activity.type === 'new_gig' && `Nouveau service: ${activity.title}`}
                              </Typography>
                              <Chip
                                label={activity.timestamp}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </motion.div>

        {/* Top Performers */}
        <motion.div variants={itemVariants}>
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Top Performers
                  </Typography>
                  <Button variant="text" size="small">
                    Voir tout
                  </Button>
                </Box>
                <List>
                  {topPerformers.map((performer, index) => (
                    <React.Fragment key={performer.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {performer.avatar}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {performer.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {performer.role}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {performer.revenue}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {performer.orders} commandes
                                  </Typography>
                                  {performer.trend === 'up' ? (
                                    <TrendingUpIcon fontSize="small" color="success" />
                                  ) : (
                                    <TrendingDownIcon fontSize="small" color="error" />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < topPerformers.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </motion.div>
      </Grid>
    </motion.div>
  );
};

export default Dashboard;
