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
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2';

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

interface SuccessFunnelProps {
  data: {
    applied: number;
    screening: number;
    interview: number;
    offers: number;
  };
}

export const SuccessFunnelChart: React.FC<SuccessFunnelProps> = ({ data }) => {
  const chartData = {
    labels: ['Applied', 'Screening', 'Interview', 'Offers'],
    datasets: [
      {
        label: 'Applications',
        data: [data.applied, data.screening, data.interview, data.offers],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 69, 19, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(16, 185, 129)',
          'rgb(139, 69, 19)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Application Success Funnel',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const percentage = data.applied > 0 ? (context.parsed.y / data.applied * 100).toFixed(1) : '0';
            return `${context.label}: ${context.parsed.y} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

interface CompanyTypeAnalysisProps {
  data: { size: string; count: number }[];
}

export const CompanyTypeChart: React.FC<CompanyTypeAnalysisProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.size),
    datasets: [
      {
        data: data.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 69, 19, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Applications by Company Size',
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
};

interface ApplicationHeatmapProps {
  data: { date: string; applications: number; goal_met: boolean }[];
}

export const ApplicationHeatmap: React.FC<ApplicationHeatmapProps> = ({ data }) => {
  // Create a grid for the last 12 weeks (84 days)
  const weeks: Array<Array<{date: string; applications: number; goal_met: boolean}>> = [];
  let currentWeek: Array<{date: string; applications: number; goal_met: boolean}> = [];

  data.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === data.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const getIntensityColor = (applications: number, goalMet: boolean) => {
    if (applications === 0) return 'bg-gray-100';
    if (goalMet) {
      if (applications >= 5) return 'bg-green-600';
      if (applications >= 3) return 'bg-green-400';
      return 'bg-green-200';
    } else {
      if (applications >= 3) return 'bg-yellow-400';
      if (applications >= 1) return 'bg-yellow-200';
      return 'bg-gray-200';
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Activity Heatmap</h3>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-500">Less</span>
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
          <span className="text-gray-500">More</span>
        </div>
      </div>
      
      <div className="flex space-x-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col space-y-1">
            {week.map((day, dayIndex) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${getIntensityColor(day.applications, day.goal_met)}`}
                title={`${day.date}: ${day.applications} applications${day.goal_met ? ' (Goal met)' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>12 weeks ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

interface MonthlyTrendsProps {
  data: { month: string; applications: number; interviews: number }[];
}

export const MonthlyTrendsChart: React.FC<MonthlyTrendsProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Applications',
        data: data.map(d => d.applications),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Interviews',
        data: data.map(d => d.interviews),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monthly Application & Interview Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

interface SkillRadarProps {
  data: { skill: string; frequency: number; successRate: number }[];
}

export const SkillRadarChart: React.FC<SkillRadarProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.skill),
    datasets: [
      {
        label: 'Skill Frequency',
        data: data.map(d => d.frequency),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
      },
      {
        label: 'Success Rate',
        data: data.map(d => d.successRate),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Skills Analysis',
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return <Radar data={chartData} options={options} />;
};

interface TimeOfDayProps {
  data: { hour: number; applications: number }[];
}

export const TimeOfDayChart: React.FC<TimeOfDayProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => `${d.hour}:00`),
    datasets: [
      {
        label: 'Applications',
        data: data.map(d => d.applications),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Application Activity by Time of Day',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};