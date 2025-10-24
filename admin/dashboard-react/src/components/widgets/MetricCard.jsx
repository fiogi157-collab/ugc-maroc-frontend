import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
// Chart.js components are optional for sparklines
// import { Line } from 'react-chartjs-2';

const MetricCard = ({
  title,
  value,
  change,
  changeType = 'percentage', // 'percentage' or 'absolute'
  icon,
  gradient,
  sparklineData = [],
  loading = false,
  onClick,
  trend = 'up', // 'up', 'down', 'neutral'
  subtitle,
  color = 'primary',
  size = 'medium', // 'small', 'medium', 'large'
}) => {
  const theme = useTheme();

  // Generate sparkline chart data
  const chartData = {
    labels: sparklineData.map((_, index) => index),
    datasets: [
      {
        data: sparklineData,
        borderColor: theme.palette[color].main,
        backgroundColor: `${theme.palette[color].main}20`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: theme.palette[color].main,
        pointHoverBorderColor: theme.palette[color].main,
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    interaction: {
      intersect: false,
    },
  };

  const getChangeColor = () => {
    if (trend === 'up') return 'success';
    if (trend === 'down') return 'error';
    return 'default';
  };

  const getChangeIcon = () => {
    if (trend === 'up') return <TrendingUpIcon fontSize="small" />;
    if (trend === 'down') return <TrendingDownIcon fontSize="small" />;
    return null;
  };

  const formatChange = () => {
    if (!change) return null;
    
    const isPositive = change > 0;
    const prefix = isPositive ? '+' : '';
    
    if (changeType === 'percentage') {
      return `${prefix}${change}%`;
    }
    
    return `${prefix}${change}`;
  };

  const getCardHeight = () => {
    switch (size) {
      case 'small': return 120;
      case 'large': return 200;
      default: return 160;
    }
  };

  const getValueFontSize = () => {
    switch (size) {
      case 'small': return 'h5';
      case 'large': return 'h3';
      default: return 'h4';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -2 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: getCardHeight(),
          background: gradient || `linear-gradient(135deg, ${theme.palette[color].main}15 0%, ${theme.palette[color].light}05 100%)`,
          border: `1px solid ${theme.palette[color].main}20`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[8],
            transform: 'translateY(-2px)',
          },
        }}
        onClick={onClick}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 100,
            height: 100,
            background: `radial-gradient(circle, ${theme.palette[color].main}10 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(30px, -30px)',
          }}
        />

        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2.5 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: '0.75rem',
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {change && (
                <Chip
                  label={formatChange()}
                  color={getChangeColor()}
                  size="small"
                  icon={getChangeIcon()}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                />
              )}
              
              <IconButton size="small" sx={{ opacity: 0.7 }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Value */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography
              variant={getValueFontSize()}
              sx={{
                fontWeight: 700,
                color: theme.palette[color].main,
                lineHeight: 1.2,
              }}
            >
              {loading ? (
                <Box sx={{ width: '60%' }}>
                  <LinearProgress
                    color={color}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: `${theme.palette[color].main}20`,
                    }}
                  />
                </Box>
              ) : (
                value
              )}
            </Typography>
          </Box>

          {/* Icon */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                backgroundColor: `${theme.palette[color].main}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.palette[color].main,
              }}
            >
              {icon}
            </Box>

            {/* Sparkline Chart - Simplified */}
            {sparklineData.length > 0 && (
              <Box sx={{ width: 80, height: 30, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  📈
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricCard;