import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const OrdersFunnelChart = ({ 
  height = 250, 
  data = null, 
  onRefresh = () => {},
  onExport = () => {},
  onFullscreen = () => {},
}) => {
  // Mock data - In real app, this would come from props or API
  const mockData = [
    { stage: 'Browse', count: 1000, percentage: 100, color: '#667eea' },
    { stage: 'Apply', count: 450, percentage: 45, color: '#f093fb' },
    { stage: 'Negotiate', count: 320, percentage: 32, color: '#4facfe' },
    { stage: 'Contract', count: 280, percentage: 28, color: '#43e97b' },
    { stage: 'Completed', count: 250, percentage: 25, color: '#f5576c' },
  ];

  const funnelData = data || mockData;

  const getConversionRate = (current, previous) => {
    if (!previous) return 100;
    return Math.round((current / previous) * 100);
  };

  return (
    <Box sx={{ height, position: 'relative' }}>
      {/* Chart Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        mb: 2,
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
      }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Actualiser">
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Exporter">
            <IconButton size="small" onClick={onExport}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Plein écran">
            <IconButton size="small" onClick={onFullscreen}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Funnel Chart */}
      <Box sx={{ height: '100%', pt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {funnelData.map((item, index) => {
          const previousItem = index > 0 ? funnelData[index - 1] : null;
          const conversionRate = getConversionRate(item.count, previousItem?.count);
          
          return (
            <Box key={item.stage} sx={{ position: 'relative' }}>
              {/* Stage Label */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                  {item.stage}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight="bold">
                    {item.count.toLocaleString()}
                  </Typography>
                  <Chip
                    label={`${item.percentage}%`}
                    size="small"
                    sx={{
                      backgroundColor: `${item.color}20`,
                      color: item.color,
                      fontWeight: 'medium',
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
              </Box>

              {/* Progress Bar */}
              <Box sx={{ position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={item.percentage}
                  sx={{
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: `${item.color}10`,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: item.color,
                      borderRadius: 12,
                    },
                  }}
                />
                
                {/* Conversion Rate */}
                {previousItem && (
                  <Box sx={{ 
                    position: 'absolute', 
                    right: -40, 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      {conversionRate}%
                    </Typography>
                    <Box sx={{ 
                      width: 0, 
                      height: 0, 
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderTop: `4px solid ${conversionRate >= 70 ? '#4caf50' : conversionRate >= 50 ? '#ff9800' : '#f44336'}`,
                    }} />
                  </Box>
                )}
              </Box>

              {/* Stage Description */}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {item.stage === 'Browse' && 'Utilisateurs qui ont consulté les offres'}
                {item.stage === 'Apply' && 'Candidatures soumises'}
                {item.stage === 'Negotiate' && 'Négociations en cours'}
                {item.stage === 'Contract' && 'Contrats signés'}
                {item.stage === 'Completed' && 'Projets finalisés'}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Summary Stats */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0,
        p: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Taux de Conversion Global
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {Math.round((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100)}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Commandes Finalisées
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {funnelData[funnelData.length - 1].count.toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OrdersFunnelChart;
