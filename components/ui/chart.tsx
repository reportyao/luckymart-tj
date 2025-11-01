'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart as RechartsAreaChart,
  Area,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

// 图表数据接口
export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  x: string | number;
  y: number;
}

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

// 通用图表容器组件
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ 
  title, 
  children, 
  className = '' 
}) => (
  <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

// 柱状图组件
interface BarChartProps {
  data: BarChartData[];
  height?: number;
  maxValue?: number;
  showValues?: boolean;
  className?: string;
  colors?: string[];
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 300,
  maxValue,
  showValues = false,
  className = '',
  colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
}) => {
  // 转换数据格式适配 recharts
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value,
    fill: item.color
  }));

  return (
    <ChartContainer title="柱状图" className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: any) => [value, '值']}
            labelStyle={{ color: '#374151' }}
          />
          <Bar 
            dataKey="value" 
            fill="#3B82F6"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill || colors[index % colors.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// 折线图组件
interface LineChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
  className?: string;
  smooth?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 300,
  color = '#3B82F6',
  showDots = true,
  showGrid = true,
  className = '',
  smooth = true
}) => {
  const chartData = data.map(item => ({
    name: typeof item.x === 'string' ? item.x : `第${item.x}`,
    value: item.y
  }));

  return (
    <ChartContainer title="折线图" className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: any) => [value, '值']}
            labelStyle={{ color: '#374151' }}
          />
          <Line 
            type={smooth ? 'monotone' : 'linear'}
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: showDots ? 4 : 0 }}
            activeDot={{ r: 6, fill: color }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// 饼图组件
interface PieChartProps {
  data: ChartData[];
  size?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
  className?: string;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 300,
  showLabels = true,
  showPercentages = false,
  className = '',
  colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'],
  innerRadius = 0,
  outerRadius = 100
}) => {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length]
  }));

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartContainer title="饼图" className={className}>
      <ResponsiveContainer width="100%" height={size}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentages ? renderCustomizedLabel : false}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any) => [value, '值']}
            labelStyle={{ color: '#374151' }}
          />
          {showLabels && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// 面积图组件
interface AreaChartProps {
  data: LineChartData[];
  height?: number;
  color?: string;
  fillColor?: string;
  showGrid?: boolean;
  className?: string;
  gradient?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 300,
  color = '#3B82F6',
  fillColor = '#3B82F620',
  showGrid = true,
  className = '',
  gradient = true
}) => {
  const chartData = data.map(item => ({
    name: typeof item.x === 'string' ? item.x : `第${item.x}`,
    value: item.y
  }));

  const gradientId = "areaGradient";

  return (
    <ChartContainer title="面积图" className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: any) => [value, '值']}
            labelStyle={{ color: '#374151' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            fillOpacity={1} 
            fill={gradient ? `url(#${gradientId})` : fillColor}
            strokeWidth={2}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// 雷达图组件
interface RadarChartProps {
  data: ChartData[];
  size?: number;
  maxValue?: number;
  className?: string;
  color?: string;
  fillColor?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 300,
  maxValue = 100,
  className = '',
  color = '#3B82F6',
  fillColor = '#3B82F620'
}) => {
  const chartData = data.map(item => ({
    subject: item.label,
    value: item.value,
    fullMark: maxValue
  }));

  return (
    <ChartContainer title="雷达图" className={className}>
      <ResponsiveContainer width="100%" height={size}>
        <RechartsRadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, maxValue]} />
          <Radar
            name="数据"
            dataKey="value"
            stroke={color}
            fill={fillColor}
            fillOpacity={0.6}
            strokeWidth={2}
          />
          <Tooltip 
            formatter={(value: any, name: any) => [value, '值']}
            labelStyle={{ color: '#374151' }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// 混合图表组件
interface MixedChartProps {
  barData?: BarChartData[];
  lineData?: LineChartData[];
  height?: number;
  className?: string;
}

export const MixedChart: React.FC<MixedChartProps> = ({
  barData = [],
  lineData = [],
  height = 300,
  className = ''
}) => {
  const allValues = [
    ...barData.map(item => item.value),
    ...lineData.map(item => item.y)
  ];
  const maxValue = Math.max(...allValues);
  
  return (
    <ChartContainer title="混合图表" className={className}>
      <div style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* 柱状图 */}
          {barData.map((item, index) => {
            const x = (index / barData.length) * 90 + 5;
            const barHeight = (item.value / maxValue) * 70;
            return (
              <rect
                key={`bar-${index}`}
                x={x}
                y={100 - barHeight - 20}
                width={80 / barData.length}
                height={barHeight}
                fill={item.color || '#3B82F6'}
                opacity="0.7"
              />
            );
          })}
          
          {/* 折线图 */}
          {lineData.length > 0 && (
            <polyline
              points={lineData.map((item, index) => {
                const x = (index / (lineData.length - 1)) * 90 + 5;
                const y = 100 - ((item.y / maxValue) * 70) - 20;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
            />
          )}
          
          {/* Y轴刻度 */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="5"
              y1={100 - (ratio * 70) - 20}
              x2="95"
              y2={100 - (ratio * 70) - 20}
              stroke="#E5E7EB"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>
    </ChartContainer>
  );
};

// 默认导出包含所有图表组件
const ChartComponents = {
  BarChart,
  LineChart,
  PieChart,
  AreaChart,
  RadarChart,
  MixedChart
};

export default ChartComponents;