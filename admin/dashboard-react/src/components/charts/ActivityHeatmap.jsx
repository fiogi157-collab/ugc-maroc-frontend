import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Grid,
  Paper,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const ActivityHeatmap = ({ 
  height = 250, 
  data = null, 
  onRefresh = () => {},
  onExport = () => {},
  onFullscreen = () => {},
}) => {
  // Mock data - In real app, this would come from props or API
  const mockData = {
    hours: ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'],
    days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    activities: [
      [2, 1, 0, 0, 3, 8, 12, 15, 18, 20, 16, 10],
      [1, 0, 0, 0, 4, 9, 14, 17, 19, 22, 18, 12],
      [3, 1, 0, 0, 5, 10, 16, 20, 22, 24, 20, 14],
      [2, 0, 0, 0, 6, 12, 18, 22, 24, 26, 22, 16],
      [4, 2, 0, 0, 7, 14, 20, 24, 26, 28, 24, 18],
      [6, 3, 1, 0, 8, 16, 22, 26, 28, 30, 26, 20],
      [8, 4, 2, 0, 9, 18, 24, 28, 30, 32, 28, 22],
    ],
  };

  const heatmapData = data || mockData;

  const getIntensityColor = (value, maxValue) => {
    const intensity = value / maxValue;
    if (intensity === 0) return '#f5f5f5';
    if (intensity <= 0.2) return '#e3f2fd';
    if (intensity <= 0.4) return '#bbdefb';
    if (intensity <= 0.6) return '#90caf9';
    if (intensity <= 0.8) return '#64b5f6';
    return '#2196f3';
  };

  const getMaxValue = () => {
    return Math.max(...heatmapData.activities.flat());
  };

  const maxValue = getMaxValue();

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

      {/* Heatmap */}
      <Box sx={{ height: '100%', pt: 4 }}>
        <Grid container spacing={0.5} sx={{ height: '100%' }}>
          {/* Hour Labels */}
          <Grid item xs={1}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
              {heatmapData.hours.map((hour) => (
                <Typography key={hour} variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  {hour}h
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* Heatmap Grid */}
          <Grid item xs={11}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {heatmapData.activities.map((dayActivities, dayIndex) => (
                <Box key={dayIndex} sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
                  {/* Day Label */}
                  <Box sx={{ 
                    width: 30, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    borderRadius: 1,
                  }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                      {heatmapData.days[dayIndex]}
                    </Typography>
                  </Box>

                  {/* Activity Cells */}
                  {dayActivities.map((activity, hourIndex) => (
                    <Tooltip
                      key={`${dayIndex}-${hourIndex}`}
                      title={`${heatmapData.days[dayIndex]} ${heatmapData.hours[hourIndex]}h: ${activity} activités`}
                      placement="top"
                    >
                      <Box
                        sx={{
                          flex: 1,
                          backgroundColor: getIntensityColor(activity, maxValue),
                          borderRadius: 1,
                          minHeight: 20,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            zIndex: 1,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Legend */}
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
              Activité par Heure
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              Moins ← → Plus
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
              <Box
                key={intensity}
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: getIntensityColor(intensity * maxValue, maxValue),
                  borderRadius: 1,
                }}
              />
            ))}
            <Typography variant="caption" color="text.secondary">
              {maxValue}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ActivityHeatmap;
