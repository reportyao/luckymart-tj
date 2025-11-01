'use client';

import React from 'react';
import Chart, { ChartType, type BarChartData, type LineChartData, type PieChartData, type AreaChartData, type RadarChartData } from './Chart';

// 示例数据
const barData: BarChartData[] = [
  { label: '一月', value: 4000, color: '#3B82F6' },
  { label: '二月', value: 3000, color: '#EF4444' },
  { label: '三月', value: 5000, color: '#10B981' },
  { label: '四月', value: 4500, color: '#F59E0B' },
  { label: '五月', value: 6000, color: '#8B5CF6' },
  { label: '六月', value: 5500, color: '#EC4899' },
];

const lineData: LineChartData[] = [
  { x: '第1周', y: 120 },
  { x: '第2周', y: 135 },
  { x: '第3周', y: 110 },
  { x: '第4周', y: 145 },
  { x: '第5周', y: 160 },
  { x: '第6周', y: 155 },
  { x: '第7周', y: 170 },
  { x: '第8周', y: 185 },
];

const pieData: PieChartData[] = [
  { name: '直接访问', value: 400, color: '#3B82F6' },
  { name: '邮件营销', value: 300, color: '#EF4444' },
  { name: '联盟广告', value: 200, color: '#10B981' },
  { name: '视频广告', value: 100, color: '#F59E0B' },
  { name: '搜索引擎', value: 500, color: '#8B5CF6' },
];

const areaData: AreaChartData[] = [
  { x: '一月', y: 400 },
  { x: '二月', y: 300 },
  { x: '三月', y: 500 },
  { x: '四月', y: 450 },
  { x: '五月', y: 600 },
  { x: '六月', y: 550 },
];

const radarData: RadarChartData[] = [
  { subject: '技术能力', value: 85, fullMark: 100 },
  { subject: '产品理解', value: 78, fullMark: 100 },
  { subject: '团队协作', value: 92, fullMark: 100 },
  { subject: '沟通能力', value: 88, fullMark: 100 },
  { subject: '项目管理', value: 75, fullMark: 100 },
  { subject: '创新思维', value: 80, fullMark: 100 },
];

const composedData = [
  { name: '产品A', 销量: 4000, 增长: 2400, 满意度: 9800 },
  { name: '产品B', 销量: 3000, 增长: 1398, 满意度: 8900 },
  { name: '产品C', 销量: 2000, 增长: 9800, 满意度: 7800 },
  { name: '产品D', 销量: 2780, 增长: 3908, 满意度: 8500 },
  { name: '产品E', 销量: 1890, 增长: 4800, 满意度: 9200 },
  { name: '产品F', 销量: 2390, 增长: 3800, 满意度: 8800 },
];

// 图表展示示例组件
export const ChartExamples: React.FC = () => {
  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">通用图表组件示例</h1>
        <p className="text-gray-600">展示不同类型图表的使用方法</p>
      </div>

      {/* 柱状图示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">柱状图示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Chart
            type={ChartType.BAR}
            title="月度销售额"
            data={barData}
            height={300}
            showValues={true}
            colors={['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']}
          />
          <Chart
            type={ChartType.BAR}
            title="横向柱状图"
            data={barData}
            height={300}
            orientation="horizontal"
            showValues={true}
            showGrid={false}
          />
        </div>
      </section>

      {/* 折线图示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">折线图示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Chart
            type={ChartType.LINE}
            title="用户增长趋势"
            data={lineData}
            height={300}
            smooth={true}
            showDots={true}
            strokeWidth={3}
            color="#3B82F6"
          />
          <Chart
            type={ChartType.LINE}
            title="简洁折线图"
            data={lineData}
            height={300}
            smooth={false}
            showDots={false}
            showGrid={false}
            color="#EF4444"
          />
        </div>
      </section>

      {/* 饼图示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">饼图示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Chart
            type={ChartType.PIE}
            title="流量来源分析"
            data={pieData}
            height={300}
            showPercentages={true}
            showLabels={true}
            innerRadius={40}
            outerRadius={80}
          />
          <Chart
            type={ChartType.PIE}
            title="环形图"
            data={pieData}
            height={300}
            showPercentages={true}
            showLabels={false}
            innerRadius={60}
            outerRadius={100}
          />
        </div>
      </section>

      {/* 面积图示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">面积图示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Chart
            type={ChartType.AREA}
            title="收入趋势（渐变）"
            data={areaData}
            height={300}
            gradient={true}
            fillOpacity={0.6}
            strokeColor="#3B82F6"
          />
          <Chart
            type={ChartType.AREA}
            title="收入趋势（纯色）"
            data={areaData}
            height={300}
            gradient={false}
            fillColor="#10B98140"
            strokeColor="#10B981"
          />
        </div>
      </section>

      {/* 雷达图示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">雷达图示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Chart
            type={ChartType.RADAR}
            title="员工能力评估"
            data={radarData}
            height={300}
            maxValue={100}
            fillOpacity={0.3}
            strokeColor="#3B82F6"
          />
          <Chart
            type={ChartType.RADAR}
            title="项目完成度"
            data={radarData}
            height={300}
            maxValue={100}
            fillOpacity={0.5}
            strokeColor="#EF4444"
            showGrid={false}
          />
        </div>
      </section>

      {/* 组合图示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">组合图示例</h2>
        <div className="grid grid-cols-1 gap-6">
          <Chart
            type={ChartType.COMPOSED}
            title="产品综合分析"
            data={composedData}
            height={400}
            bars={[
              { dataKey: '销量', color: '#3B82F6', stackId: 'total' },
              { dataKey: '增长', color: '#10B981', stackId: 'total' }
            ]}
            lines={[
              { dataKey: '满意度', color: '#EF4444', strokeWidth: 3 }
            ]}
            showLegend={true}
            showGrid={true}
          />
        </div>
      </section>

      {/* 自定义样式示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">自定义样式示例</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Chart
            type={ChartType.BAR}
            title="深色主题柱状图"
            data={barData}
            height={300}
            theme="dark"
            className="!bg-gray-800 !text-white"
            colors={['#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA', '#F472B6']}
          />
          <Chart
            type={ChartType.PIE}
            title="深色主题饼图"
            data={pieData}
            height={300}
            theme="dark"
            className="!bg-gray-800"
            colors={['#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA']}
          />
        </div>
      </section>

      {/* 实际应用场景示例 */}
      <section className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">实际应用场景</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 销售仪表板 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">销售仪表板</h3>
            <Chart
              type={ChartType.LINE}
              title="月度销售趋势"
              data={lineData.slice(0, 6)}
              height={200}
              showGrid={false}
              showLegend={false}
              color="#3B82F6"
            />
            <Chart
              type={ChartType.PIE}
              title="产品销售占比"
              data={pieData.slice(0, 3)}
              height={200}
              showLegend={true}
              showPercentages={true}
              colors={['#3B82F6', '#10B981', '#F59E0B']}
            />
          </div>

          {/* 数据分析 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">数据分析</h3>
            <Chart
              type={ChartType.AREA}
              title="收入增长"
              data={areaData}
              height={200}
              gradient={true}
              fillOpacity={0.4}
              color="#10B981"
            />
            <Chart
              type={ChartType.BAR}
              title="部门表现"
              data={barData.slice(0, 4)}
              height={200}
              showValues={true}
              colors={['#3B82F6', '#10B981', '#F59E0B', '#EF4444']}
            />
          </div>

          {/* 用户画像 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">用户画像</h3>
            <Chart
              type={ChartType.RADAR}
              title="用户特征"
              data={radarData.slice(0, 4)}
              height={200}
              maxValue={100}
              fillOpacity={0.3}
              strokeColor="#8B5CF6"
            />
            <Chart
              type={ChartType.BAR}
              title="用户活跃度"
              data={[
                { label: '高活跃', value: 35, color: '#10B981' },
                { label: '中活跃', value: 45, color: '#F59E0B' },
                { label: '低活跃', value: 20, color: '#EF4444' }
              ]}
              height={200}
              showValues={true}
              orientation="horizontal"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChartExamples;