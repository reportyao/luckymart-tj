'use client';

import * as React from 'react';
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
  Legend,
  ComposedChart,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

// 基础数据类型定义
export interface BaseChartData {
  label?: string;
  name?: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export interface LineChartData {
  x: string | number;
  y: number;
  [key: string]: any;
}

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

export interface AreaChartData {
  x: string | number;
  y: number;
  [key: string]: any;
}

export interface RadarChartData {
  subject: string;
  value: number;
  fullMark?: number;
  [key: string]: any;
}

// 图表类型枚举
export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  RADAR = 'radar',
  COMPOSED = 'composed',
  FUNNEL = 'funnel'
}

// 通用图表配置接口
export interface ChartConfig {
  type: ChartType;
  title?: string;
  height?: number;
  width?: number;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  responsive?: boolean;
  className?: string;
  animated?: boolean;
  theme?: 'light' | 'dark';
}

// 柱状图特定配置
export interface BarChartConfig extends ChartConfig {
  type: ChartType.BAR;
  data: BarChartData[];
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  showValues?: boolean;
  maxValue?: number;
}

// 折线图特定配置
export interface LineChartConfig extends ChartConfig {
  type: ChartType.LINE;
  data: LineChartData[];
  smooth?: boolean;
  showDots?: boolean;
  strokeWidth?: number;
  dotSize?: number;
  color?: string;
}

// 饼图特定配置
export interface PieChartConfig extends ChartConfig {
  type: ChartType.PIE;
  data: PieChartData[];
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
  cornerRadius?: number;
}

// 面积图特定配置
export interface AreaChartConfig extends ChartConfig {
  type: ChartType.AREA;
  data: AreaChartData[];
  fillOpacity?: number;
  strokeWidth?: number;
  gradient?: boolean;
  fillColor?: string;
  strokeColor?: string;
}

// 雷达图特定配置
export interface RadarChartConfig extends ChartConfig {
  type: ChartType.RADAR;
  data: RadarChartData[];
  maxValue?: number;
  innerRadius?: number;
  outerRadius?: number;
  fillOpacity?: number;
  strokeColor?: string;
}

// 组合图特定配置
export interface ComposedChartConfig extends ChartConfig {
  type: ChartType.COMPOSED;
  data: BaseChartData[];
  bars?: {
    dataKey: string;
    color?: string;
    stackId?: string;
  }[];
  lines?: {
    dataKey: string;
    color?: string;
    strokeWidth?: number;
  }[];
  areas?: {
    dataKey: string;
    color?: string;
    fillOpacity?: number;
  }[];
}

// 漏斗图特定配置
export interface FunnelChartConfig extends ChartConfig {
  type: ChartType.FUNNEL;
  data: { name: string; value: number; color?: string }[];
  isAnimationActive?: boolean;
}

// 图表配置联合类型
export type ChartConfigUnion = 
  | BarChartConfig 
  | LineChartConfig 
  | PieChartConfig 
  | AreaChartConfig 
  | RadarChartConfig 
  | ComposedChartConfig 
  | FunnelChartConfig;

// 通用图表组件
const Chart: React.FC<ChartConfigUnion> = (config: ChartConfigUnion) => {
  const {
    type,
    title,
    height = 300,
    width,
    colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
      '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6',
      '#F97316', '#84CC16', '#06B6D4', '#8B5CF6'
    ],
    showLegend = true,
    showGrid = true,
    showTooltip = true,
    responsive = true,
    className = '',
    animated = true,
    theme = 'light'
  } = config;

  // 通用样式
  const containerStyle = {
    width: width ? `${width}px` : '100%',
    height: `${height}px`,
  };

  const titleStyle = {
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '18px',
    fontWeight: '600' as const,
    marginBottom: '16px',
  };

  const containerClass = `
    bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}
    ${theme === 'dark' ? 'dark' : ''}
  `;

  // 通用工具提示配置
  const tooltipStyle = {
    labelStyle: { color: theme === 'dark' ? '#F9FAFB' : '#374151' },
    contentStyle: {
      backgroundColor: theme === 'dark' ? '#374151' : '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  };

  // 渲染图表内容的函数
  const renderChartContent = () => {
    switch (type) {
      case ChartType.BAR:
        return renderBarChart(config as BarChartConfig);
      case ChartType.LINE:
        return renderLineChart(config as LineChartConfig);
      case ChartType.PIE:
        return renderPieChart(config as PieChartConfig);
      case ChartType.AREA:
        return renderAreaChart(config as AreaChartConfig);
      case ChartType.RADAR:
        return renderRadarChart(config as RadarChartConfig);
      case ChartType.COMPOSED:
        return renderComposedChart(config as ComposedChartConfig);
      case ChartType.FUNNEL:
        return renderFunnelChart(config as FunnelChartConfig);
      default:
        return <div>不支持的图表类型</div>;
    }
  };

  // 柱状图渲染
  const renderBarChart = (barConfig: BarChartConfig) => {
    const { 
      data, 
      orientation = 'vertical',
      stacked = false,
      showValues = false,
      maxValue
    } = barConfig;

    const chartData = data.map(item => ({
      name: item.label,
      value: item.value,
      fill: item.color
    }));

    const isHorizontal = orientation === 'horizontal';

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          layout={isHorizontal ? 'horizontal' : 'vertical'}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {isHorizontal ? (
            <XAxis type="number" />
          ) : (
            <XAxis dataKey="name" />
          )}
          {isHorizontal ? (
            <YAxis dataKey="name" type="category" />
          ) : (
            <YAxis />
          )}
          {showTooltip && (
            <Tooltip 
              formatter={(value: any) => [value, '值']}
              {...tooltipStyle}
            />
          )}
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
            isAnimationActive={animated}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill || colors[index % colors.length]} 
              />
            ))}
            {showValues && (
              <LabelList 
                dataKey="value" 
                position="top" 
                style={{ fill: theme === 'dark' ? '#F9FAFB' : '#374151' }}
              />
            )}
          </Bar>
          {showLegend && <Legend />}
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  };

  // 折线图渲染
  const renderLineChart = (lineConfig: LineChartConfig) => {
    const { 
      data, 
      smooth = true,
      showDots = true,
      strokeWidth = 2,
      dotSize = 4,
      color = colors[0]
    } = lineConfig;

    const chartData = data.map(item => ({
      name: typeof item.x === 'string' ? item.x : `第${item.x}`,
      value: item.y
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="name" />
          <YAxis />
          {showTooltip && (
            <Tooltip 
              formatter={(value: any) => [value, '值']}
              {...tooltipStyle}
            />
          )}
          <Line 
            type={smooth ? 'monotone' : 'linear'}
            dataKey="value" 
            stroke={color}
            strokeWidth={strokeWidth}
            dot={{ 
              fill: color, 
              strokeWidth: 2, 
              r: showDots ? dotSize : 0 
            }}
            activeDot={{ r: 6, fill: color }}
            isAnimationActive={animated}
          />
          {showLegend && <Legend />}
        </RechartsLineChart>
      </ResponsiveContainer>
    );
  };

  // 饼图渲染
  const renderPieChart = (pieConfig: PieChartConfig) => {
    const { 
      data,
      innerRadius = 0,
      outerRadius = 100,
      showLabels = true,
      showPercentages = false,
      cornerRadius = 0
    } = pieConfig;

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
          {showPercentages ? `${(percent * 100).toFixed(0)}%` : ''}
        </text>
      );
    };

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentages ? renderCustomizedLabel : showLabels}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            cornerRadius={cornerRadius}
            isAnimationActive={animated}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          {showTooltip && (
            <Tooltip 
              formatter={(value: any) => [value, '值']}
              {...tooltipStyle}
            />
          )}
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  };

  // 面积图渲染
  const renderAreaChart = (areaConfig: AreaChartConfig) => {
    const { 
      data,
      fillOpacity = 0.6,
      strokeWidth = 2,
      gradient = true,
      fillColor,
      strokeColor = colors[0]
    } = areaConfig;

    const chartData = data.map(item => ({
      name: typeof item.x === 'string' ? item.x : `第${item.x}`,
      value: item.y
    }));

    const gradientId = "areaGradient";

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={fillOpacity}/>
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="name" />
          <YAxis />
          {showTooltip && (
            <Tooltip 
              formatter={(value: any) => [value, '值']}
              {...tooltipStyle}
            />
          )}
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor} 
            fillOpacity={1} 
            fill={gradient ? `url(#${gradientId})` : fillColor || `${strokeColor}20`}
            strokeWidth={strokeWidth}
            isAnimationActive={animated}
          />
          {showLegend && <Legend />}
        </RechartsAreaChart>
      </ResponsiveContainer>
    );
  };

  // 雷达图渲染
  const renderRadarChart = (radarConfig: RadarChartConfig) => {
    const { 
      data,
      maxValue = 100,
      innerRadius,
      outerRadius,
      fillOpacity = 0.6,
      strokeColor = colors[0]
    } = radarConfig;

    const chartData = data.map(item => ({
      subject: item.subject || item.label,
      value: item.value,
      fullMark: item.fullMark || maxValue
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, maxValue]} />
          <Radar
            name="数据"
            dataKey="value"
            stroke={strokeColor}
            fill={strokeColor}
            fillOpacity={fillOpacity}
            strokeWidth={2}
            isAnimationActive={animated}
          />
          {showTooltip && (
            <Tooltip 
              formatter={(value: any) => [value, '值']}
              {...tooltipStyle}
            />
          )}
          {showLegend && <Legend />}
        </RechartsRadarChart>
      </ResponsiveContainer>
    );
  };

  // 组合图渲染
  const renderComposedChart = (composedConfig: ComposedChartConfig) => {
    const { data, bars = [], lines = [], areas = [] } = composedConfig;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="name" />
          <YAxis />
          {showTooltip && <Tooltip {...tooltipStyle} />}
          {showLegend && <Legend />}
          
          {/* 渲染柱状图 */}
          {bars.map((bar, index) => (
            <Bar 
              key={`bar-${index}`}
              dataKey={bar.dataKey} 
              fill={bar.color || colors[index % colors.length]}
              stackId={bar.stackId}
              isAnimationActive={animated}
            />
          ))}
          
          {/* 渲染折线图 */}
          {lines.map((line, index) => (
            <Line
              key={`line-${index}`}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color || colors[(bars.length + index) % colors.length]}
              strokeWidth={line.strokeWidth || 2}
              isAnimationActive={animated}
            />
          ))}
          
          {/* 渲染面积图 */}
          {areas.map((area, index) => (
            <Area
              key={`area-${index}`}
              type="monotone"
              dataKey={area.dataKey}
              fill={area.color || colors[(bars.length + lines.length + index) % colors.length]}
              fillOpacity={area.fillOpacity || 0.3}
              isAnimationActive={animated}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // 漏斗图渲染
  const renderFunnelChart = (funnelConfig: FunnelChartConfig) => {
    const { data, isAnimationActive = true } = funnelConfig;

    return (
      <ResponsiveContainer width="100%" height={height}>
        <FunnelChart>
          <Tooltip 
            formatter={(value: any) => [value, '值']}
            {...tooltipStyle}
          />
          <Funnel
            dataKey="value"
            data={data}
            isAnimationActive={isAnimationActive}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || colors[index % colors.length]} 
              />
            ))}
          </Funnel>
          {showLegend && <Legend />}
        </FunnelChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className={containerClass} style={responsive ? undefined : containerStyle}>
      {title && (
        <h3 className="text-lg font-semibold mb-4" style={titleStyle}>
          {title}
        </h3>
      )}
      <div style={responsive ? undefined : containerStyle}>
        {renderChartContent()}
      </div>
    </div>
  );
};

export default Chart;