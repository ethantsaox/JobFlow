import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Chart } from 'react-chartjs-2';
import { useDarkMode } from '../hooks/useDarkMode';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ApplicationTimelineProps {
  data: { date: string; applications: number }[];
}

export const ApplicationTimelineChart: React.FC<ApplicationTimelineProps> = ({ data }) => {
  const { isDark } = useDarkMode();

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Applications',
        data: data.map(d => d.applications),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: isDark ? '#ffffff' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'Application Timeline (Last 30 Days)',
        color: isDark ? '#ffffff' : '#374151',
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#d1d5db' : '#6b7280',
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: isDark ? '#d1d5db' : '#6b7280',
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

type StatusType = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

interface StatusDistributionProps {
  data: { [key: string]: number };
}

export const StatusDistributionChart: React.FC<StatusDistributionProps> = ({ data }) => {
  const { isDark } = useDarkMode();

  // Define canonical status colors
  const statusColors: Record<StatusType, { bg: string; border: string }> = {
    applied: { bg: 'rgba(59, 130, 246, 0.8)', border: 'rgb(59, 130, 246)' },
    screening: { bg: 'rgba(251, 191, 36, 0.8)', border: 'rgb(251, 191, 36)' },
    interview: { bg: 'rgba(147, 51, 234, 0.8)', border: 'rgb(147, 51, 234)' },
    offer: { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgb(16, 185, 129)' },
    rejected: { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' }
  };

  const statuses = Object.keys(data);
  const backgroundColors = statuses.map(status => 
    statusColors[status as StatusType]?.bg || 'rgba(156, 163, 175, 0.8)'
  );
  const borderColors = statuses.map(status => 
    statusColors[status as StatusType]?.border || 'rgb(156, 163, 175)'
  );

  const chartData = {
    labels: statuses.map(status => 
      status.charAt(0).toUpperCase() + status.slice(1)
    ),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#ffffff' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'Application Status Distribution',
        color: isDark ? '#ffffff' : '#374151',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

interface WeeklyProgressProps {
  data: { week: string; applications: number; goal: number }[];
}

export const WeeklyProgressChart: React.FC<WeeklyProgressProps> = ({ data }) => {
  const { isDark } = useDarkMode();

  const chartData = {
    labels: data.map(d => d.week),
    datasets: [
      {
        label: 'Applications',
        data: data.map(d => d.applications),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        type: 'bar' as const,
      },
      {
        label: 'Goal',
        data: data.map(d => d.goal),
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        type: 'line' as const,
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDark ? '#ffffff' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'Weekly Applications vs Goal',
        color: isDark ? '#ffffff' : '#374151',
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#d1d5db' : '#6b7280',
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5,
          color: isDark ? '#d1d5db' : '#6b7280',
        },
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return <Chart type='bar' data={chartData} options={options} />;
};

interface JobSourcesProps {
  data: { source: string; count: number }[];
}

export const JobSourcesChart: React.FC<JobSourcesProps> = ({ data }) => {
  const { isDark } = useDarkMode();

  const chartData = {
    labels: data.map(d => d.source),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 69, 19, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: isDark ? '#ffffff' : '#374151',
        },
      },
      title: {
        display: true,
        text: 'Applications by Source',
        color: isDark ? '#ffffff' : '#374151',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};