'use client';

import React from 'react';

interface ChartProps {
  data: number[];
  title: string;
  color?: string;
  height?: number;
}

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  size?: number;
}

// 柱状图组件
export const SimpleBarChart: React.FC<ChartProps> = ({ 
  data, 
  title, 
  color = '#6366F1',
  height = 200 
}) => {
  const maxValue = Math.max(...data);
  const barWidth = 30;
  const chartWidth = data.length * (barWidth + 10);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="rounded-t transition-all hover:opacity-80"
              style={{ 
                width: '100%',
                maxWidth: `${barWidth}px`,
                height: `${(value / maxValue) * (height - 40)}px`,
                minHeight: '20px',
                backgroundColor: color
              }}
              title={`${value}`}
            />
            <span className="text-xs text-gray-600 mt-2">{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 饼图组件
export const SimplePieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  size = 160 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg 
            viewBox={`0 0 ${size} ${size}`} 
            className="w-full h-full transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercentage * circumference / 100;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
            })}
          </svg>
        </div>
        <div className="flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 进度条组件
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  color = '#EF4444', 
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color,
            minWidth: percentage > 0 ? '4px' : '0'
          }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

// 统计卡片组件
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  color = '#6366F1'
}) => {
  const changeColorClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {change && (
        <p className={`text-sm mt-1 ${changeColorClasses[changeType]}`}>
          {change}
        </p>
      )}
    </div>
  );
};

// 风险等级标签组件
interface RiskLevelBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  className?: string;
}

export const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({ 
  level, 
  className = '' 
}) => {
  const levelConfig = {
    low: { 
      label: '低风险', 
      color: 'text-green-600 bg-green-100' 
    },
    medium: { 
      label: '中风险', 
      color: 'text-yellow-600 bg-yellow-100' 
    },
    high: { 
      label: '高风险', 
      color: 'text-orange-600 bg-orange-100' 
    },
    critical: { 
      label: '严重风险', 
      color: 'text-red-600 bg-red-100' 
    }
  };
  
  const config = levelConfig[level];
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color} ${className}`}>
      {config.label}
    </span>
  );
};

// 状态标签组件
interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'active':
        return { 
          label: status === 'pending' ? '待处理' : status === 'active' ? '正常' : status, 
          color: 'text-blue-600 bg-blue-100' 
        };
      case 'approved':
        return { 
          label: '已通过', 
          color: 'text-green-600 bg-green-100' 
        };
      case 'rejected':
      case 'banned':
        return { 
          label: status === 'rejected' ? '已拒绝' : '已封禁', 
          color: 'text-red-600 bg-red-100' 
        };
      case 'manual_review':
        return { 
          label: '人工审核', 
          color: 'text-purple-600 bg-purple-100' 
        };
      case 'frozen':
        return { 
          label: '已冻结', 
          color: 'text-blue-600 bg-blue-100' 
        };
      case 'limited':
        return { 
          label: '已限制', 
          color: 'text-yellow-600 bg-yellow-100' 
        };
      case 'inactive':
        return { 
          label: '禁用', 
          color: 'text-red-600 bg-red-100' 
        };
      default:
        return { 
          label: status, 
          color: 'text-gray-600 bg-gray-100' 
        };
    }
  };
  
  const config = getStatusConfig(status);
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color} ${className}`}>
      {config.label}
    </span>
  );
};