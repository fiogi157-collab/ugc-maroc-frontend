import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const UsersGrowthChart = ({ 
  height = 300, 
  data = null, 
  period = '30d',
  onPeriodChange = () => {},
  onRefresh = () => {},
  onExport = () => {},
  onFullscreen = () => {},
}) => {
  // Mock data - In real app, this would come from props or API
  const mockData = {
    labels: [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
    ],
    datasets: [
      {
        label: 'Créateurs',
        data: [45, 52, 68, 75, 82, 95, 108, 125, 142, 158, 175, 192],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#667eea',
        pointHoverBorderColor: '#667eea',
        pointHoverBorderWidth: 2,
      },
      {
        label: 'Marques',
        data: [25, 32, 38, 45, 52, 58, 65, 72, 78, 85, 92, 98],
        borderColor: '#f093fb',
        backgroundColor: 'rgba(240, 147, 251, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#f093fb',
        pointHoverBorderColor: '#f093fb',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const chartData = data || mockData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: '500',
          },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} utilisateurs`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#666',
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#666',
          callback: function(value) {
            return value;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 6,
      },
    },
  };

  const periods = [
    { value: '7d', label: '7j' },
    { value: '30d', label: '30j' },
    { value: '90d', label: '3m' },
    { value: '1y', label: '1a' },
  ];

  // Calculate totals
  const totalCreators = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
  const totalBrands = chartData.datasets[1].data.reduce((a, b) => a + b, 0);
  const totalUsers = totalCreators + totalBrands;

  return (
    <Box sx={{ height, position: 'relative' }}>
      {/* Chart Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
      }}>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <InputLabel>Période</InputLabel>
          <Select
            value={period}
            label="Période"
            onChange={(e) => onPeriodChange(e.target.value)}
          >
            {periods.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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

      {/* Chart */}
      <Box sx={{ height: '100%', pt: 6 }}>
        <Line data={chartData} options={options} />
      </Box>

      {/* Chart Summary */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Total Utilisateurs
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {totalUsers.toLocaleString()}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Chip
            label={`${totalCreators} Créateurs`}
            size="small"
            sx={{
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              color: '#667eea',
              fontWeight: 'medium',
            }}
          />
          <Chip
            label={`${totalBrands} Marques`}
            size="small"
            sx={{
              backgroundColor: 'rgba(240, 147, 251, 0.1)',
              color: '#f093fb',
              fontWeight: 'medium',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default UsersGrowthChart;
