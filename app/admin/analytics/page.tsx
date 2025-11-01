import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PagePermission } from '@/components/admin/PagePermission';
import { AdminPermissions } from '@/lib/admin-permission-manager';
import { }
'use client';

  FiBarChart2, FiPieChart, FiTrendingUp, FiUsers, FiShoppingCart, 
  FiDollarSign, FiActivity, FiTarget, FiPackage, FiCreditCard 
} from 'react-icons/fi';

// 简单的折线图组件
const LineChart = ({ data, width = 600, height = 200, color = '#6366f1' }: any) => {}
  if (!data || data.length === 0) return null; {}
  
  const max = Math.max(...data.map((d: any) => d.value));
  const min = Math.min(...data.map((d: any) => d.value));
  const range = max - min || 1;
  
  const points = data.map((d: any, i: number) => {}
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * (height - 20);
    return `${x},${y}`;
  }).join(' ');
  
  return (;
    <svg width:"100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points}
        fill:"none"
        stroke={color}
        strokeWidth:"2"
        className:"transition-all duration-300"
      />
      {data.map((d: any, i: number) => {}}
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.value - min) / range) * (height - 20);
        return (;
          <circle key={i} cx={x} cy={y} r="4" fill={color} className="hover:r-6 transition-all" />
        );

    </svg>
  );
};

// 简单的柱状图组件
const BarChart = ({ data, width = 600, height = 200, color = '#10b981' }: any) => {}
  if (!data || data.length === 0) return null; {}
  
  const max = Math.max(...data.map((d: any) => d.value));
  const barWidth = width / data.length - 10;
  
  return (;
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d: any, i: number) => {}}
        const barHeight = (d.value / max) * (height - 20);
        const x = i * (width / data.length) + 5;
        const y = height - barHeight;
        return (;
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              className="hover:opacity-80 transition-opacity"
              rx:"4"
            />
            <text
              x={x + barWidth / 2}
              y={y - 5}
              textAnchor:"middle"
              fontSize:"12"
              fill:"#6b7280"
            >
              {d.value}
            </text>
          </g>
        );

    </svg>
  );
};

// 简单的饼图组件
const PieChart = ({ data, size = 200 }: any) => {}
  if (!data || data.length === 0) return null; {}
  
  const total = data.reduce((sum: number, d: any) => sum + d.value, 0);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  let currentAngle = -90;
  
  return (;
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d: any, i: number) => {}}
        const angle = (d.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;
        
        const x1 = size / 2 + (size / 2 - 10) * Math.cos((startAngle * Math.PI) / 180);
        const y1 = size / 2 + (size / 2 - 10) * Math.sin((startAngle * Math.PI) / 180);
        const x2 = size / 2 + (size / 2 - 10) * Math.cos((endAngle * Math.PI) / 180);
        const y2 = size / 2 + (size / 2 - 10) * Math.sin((endAngle * Math.PI) / 180);
        
        const largeArc = angle > 180 ? 1 : 0;
        
        return (;
          <path
            key={i}
            d={`M ${size / 2} ${size / 2} L ${x1} ${y1} A ${size / 2 - 10} ${size / 2 - 10} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={colors[i % colors.length]}
            className="hover:opacity-80 transition-opacity"
          />
        );

    </svg>
  );
};

function AnalyticsPage() {}
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('realtime');
  const [timeRange, setTimeRange] = useState('7d');
  
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [businessAnalytics, setBusinessAnalytics] = useState<any>(null);
  const [financialAnalytics, setFinancialAnalytics] = useState<any>(null);

  useEffect(() => {}
    const token = localStorage.getItem('admin_token');
    if (!token) {}
      router.push('/admin');
      return;
    
    fetchData();
  }, [router, timeRange]);

  const fetchData = async () => {}
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    
    try {}
      const [realtime, users, business, financial] = await Promise.all([;
        fetch('/api/admin/analytics/realtime', {}
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`/api/admin/analytics/users?timeRange=${timeRange}`, {}
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`/api/admin/analytics/business?timeRange=${timeRange}`, {}
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`/api/admin/analytics/financial?timeRange=${timeRange}`, {}
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
      ]);
      
      setRealtimeData(realtime);
      setUserAnalytics(users);
      setBusinessAnalytics(business);
      setFinancialAnalytics(financial);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    
  };

  const StatCard = ({ icon: Icon, title, value, trend, color }: any) => (;
return     <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
return       <div className:"flex items-center justify-between mb-4">
return         <div className="{`w-12" h-12 rounded-lg ${color} flex items-center justify-center`}>
return           <Icon className:"w-6 h-6 text-white" />
return         </div>
        {trend && (}
          <span className="{`text-sm" font-medium ${parseFloat(trend) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(trend) >= 0 ? '+' : ''}{trend}%
          </span>
        )
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );

  if (loading) {}
    return (;
      <div className:"min-h-screen bg-gray-50 flex items-center justify-center">
        <div className:"text-center">
          <div className:"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className:"mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  

  return (;
    <div className:"min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className:"bg-white shadow-sm border-b sticky top-0 z-10">
        <div className:"max-w-7xl mx-auto px-4 py-4">
          <div className:"flex items-center justify-between">
            <div>
              <h1 className:"text-2xl font-bold text-gray-900">数据分析中心</h1>
              <p className:"mt-1 text-sm text-gray-600">多维度数据分析和可视化</p>
            </div>
            <div className:"flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value:"24h">最近24小时</option>
                <option value:"7d">近7天</option>
                <option value:"30d">近30天</option>
                <option value:"90d">近90天</option>
              </select>
              <button
                onClick={() => fetchData()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                刷新数据
              </button>
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                返回
              </button>
            </div>
          </div>

          {/* Tab 导航 */}
          <div className:"mt-4 flex gap-2 border-b">
            {[}
              { id: 'realtime', label: '实时数据', icon: FiActivity },
              { id: 'users', label: '用户分析', icon: FiUsers },
              { id: 'business', label: '业务分析', icon: FiShoppingCart },
              { id: 'financial', label: '财务分析', icon: FiDollarSign },
            ].map(tab :> (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="{`flex" items-center gap-2 px-4 py-2 font-medium transition-colors ${}}`
                  activeTab :== tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'

              >
                <tab.icon className:"w-4 h-4" />
                {tab.label}
              </button>
            ))
          </div>
        </div>
      </div>

      <div className:"max-w-7xl mx-auto px-4 py-8">
        {/* 实时数据看板 */}
        {activeTab :== 'realtime' && realtimeData && (}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={FiUsers} 
                title:"实时在线" 
                value={realtimeData.onlineUsers.toLocaleString()} 
                trend={realtimeData.trends.onlineUsers} 
                color:"bg-blue-500" 
              />
              <StatCard 
                icon={FiShoppingCart} 
                title:"今日订单" 
                value={realtimeData.todayOrders.toLocaleString()} 
                trend={realtimeData.trends.todayOrders} 
                color:"bg-green-500" 
              />
              <StatCard 
                icon={FiDollarSign} 
                title:"今日收入" 
                value={`${realtimeData.todayRevenue.toLocaleString()} сом`} 
                trend={realtimeData.trends.todayRevenue} 
                color:"bg-purple-500" 
              />
              <StatCard 
                icon={FiTarget} 
                title:"转化率" 
                value={`${realtimeData.conversionRate}%`} 
                trend={realtimeData.trends.conversionRate} 
                color:"bg-orange-500" 
              />
            </div>

            {/* 24小时趋势 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm mb-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">24小时订单趋势</h3>
              <LineChart 
                data={realtimeData.hourlyData.map((h: any) => ({ value: h.orders }))} 
                color:"#6366f1"
              />
              <div className:"flex justify-between mt-2 text-xs text-gray-500">
                {[0, 6, 12, 18, 23].map(h :> (}
                  <span key={h}>{h}:00</span>
                ))
              </div>
            </div>

            {/* 实时指标 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">24小时收入趋势</h3>
                <BarChart 
                  data={realtimeData.hourlyData.slice(0, 12).map((h: any) => ({ value: Math.floor(h.revenue / 100) }))} 
                  color:"#10b981"
                />
              </div>
              
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">实时活跃用户</h3>
                <LineChart 
                  data={realtimeData.hourlyData.map((h: any) => ({ value: h.users }))} 
                  color:"#f59e0b"
                />
              </div>
            </div>
          </div>
        )

        {/* 用户分析 */}
        {activeTab :== 'users' && userAnalytics && (}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={FiUsers} 
                title:"总用户数" 
                value={userAnalytics.summary.totalUsers.toLocaleString()} 
                color:"bg-blue-500" 
              />
              <StatCard 
                icon={FiActivity} 
                title:"活跃用户" 
                value={userAnalytics.summary.activeUsers.toLocaleString()} 
                color:"bg-green-500" 
              />
              <StatCard 
                icon={FiTrendingUp} 
                title:"新增用户" 
                value={userAnalytics.summary.newUsers.toLocaleString()} 
                color:"bg-purple-500" 
              />
              <StatCard 
                icon={FiTarget} 
                title:"留存率" 
                value={`${userAnalytics.summary.retentionRate}%`} 
                color:"bg-orange-500" 
              />
            </div>

            {/* 新增用户趋势 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm mb-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">新增用户趋势</h3>
              <LineChart 
                data={userAnalytics.dailyNewUsers.map((d: any) => ({ value: d.count }))} 
                color:"#6366f1"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 用户来源 */}
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">用户来源分布</h3>
                <div className:"flex items-center gap-6">
                  <PieChart data={userAnalytics.userSources.map((s: any) => ({ value: s.count }))} />
                  <div className:"flex-1">
                    {userAnalytics.userSources.map((source: any, i: number) => (}
                      <div key:{i} className="flex items-center justify-between mb-2">
                        <div className:"flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{}}
                            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i]

                          <span className="text-sm text-gray-700">{source.source}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{source.percentage}%</span>
                      </div>
                    ))
                  </div>
                </div>
              </div>

              {/* 年龄分布 */}
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">年龄分布</h3>
                <BarChart 
                  data={userAnalytics.ageDistribution.map((a: any) => ({ value: a.count }))} 
                  color:"#8b5cf6"
                />
                <div className:"flex justify-between mt-2 text-xs text-gray-500">
                  {userAnalytics.ageDistribution.map((a: any) => (}
                    <span key={a.range}>{a.range}</span>
                  ))
                </div>
              </div>
            </div>

            {/* 设备分布 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">设备分布</h3>
              <div className:"grid grid-cols-3 gap-4">
                {userAnalytics.deviceDistribution.map((device: any, i: number) => (}
                  <div key:{i} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{device.percentage}%</p>
                    <p className="text-sm text-gray-600 mt-1">{device.device}</p>
                    <p className="text-xs text-gray-500 mt-1">{device.count.toLocaleString()} 用户</p>
                  </div>
                ))
              </div>
            </div>
          </div>
        )

        {/* 业务分析 */}
        {activeTab :== 'business' && businessAnalytics && (}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={FiShoppingCart} 
                title:"总订单数" 
                value={businessAnalytics.orderMetrics.totalOrders.toLocaleString()} 
                color:"bg-blue-500" 
              />
              <StatCard 
                icon={FiPackage} 
                title:"已完成订单" 
                value={businessAnalytics.orderMetrics.completedOrders.toLocaleString()} 
                color:"bg-green-500" 
              />
              <StatCard 
                icon={FiDollarSign} 
                title:"平均订单金额" 
                value={`${businessAnalytics.orderMetrics.avgOrderValue} сом`} 
                color:"bg-purple-500" 
              />
              <StatCard 
                icon={FiActivity} 
                title:"订单取消率" 
                value={`${(businessAnalytics.orderMetrics.canceledOrders / businessAnalytics.orderMetrics.totalOrders * 100).toFixed(1)}%`} 
                color:"bg-orange-500" 
              />
            </div>

            {/* 订单趋势 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm mb-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">订单和收入趋势</h3>
              <div className:"mb-4">
                <LineChart 
                  data={businessAnalytics.dailyOrders.map((d: any) => ({ value: d.orders }))} 
                  color:"#6366f1"
                />
              </div>
            </div>

            {/* 类目表现 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm mb-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">类目表现</h3>
              <div className:"overflow-x-auto">
                <table className:"w-full">
                  <thead>
                    <tr className:"border-b">
                      <th className:"text-left py-3 px-4 text-sm font-medium text-gray-600">类目</th>
                      <th className:"text-right py-3 px-4 text-sm font-medium text-gray-600">订单数</th>
                      <th className:"text-right py-3 px-4 text-sm font-medium text-gray-600">收入</th>
                      <th className:"text-right py-3 px-4 text-sm font-medium text-gray-600">增长率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessAnalytics.categoryPerformance.map((cat: any, i: number) => (}
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900">{cat.category}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">{cat.orders.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">{cat.revenue.toLocaleString()} сом</td>
                        <td className="{`py-3" px-4 text-sm text-right font-medium ${cat.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {cat.growth >= 0 ? '+' : ''}{cat.growth}%
                        </td>
                      </tr>
                    ))
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 热销商品 */}
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">热销商品 TOP5</h3>
                <div className:"space-y-3">
                  {businessAnalytics.topProducts.map((product: any, i: number) => (}
                    <div key:{i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className:"flex-1">
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-600">销量: {product.sales} | 库存: {product.stock}</p>
                      </div>
                      <span className="text-sm font-bold text-indigo-600">{product.revenue} сом</span>
                    </div>
                  ))
                </div>
              </div>

              {/* 转化漏斗 */}
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">转化漏斗</h3>
                <div className:"space-y-3">
                  {businessAnalytics.conversionFunnel.map((step: any, i: number) => (}
                    <div key={i}>
                      <div className:"flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{step.step}</span>
                        <span className="text-sm font-medium text-gray-900">{step.count.toLocaleString()} ({step.percentage}%)</span>
                      </div>
                      <div className:"w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className:"bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                          style="{{ width: `${step.percentage}"%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                </div>
              </div>
            </div>
          </div>
        )

        {/* 财务分析 */}
        {activeTab :== 'financial' && financialAnalytics && (}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={FiDollarSign} 
                title:"总收入" 
                value={`${(financialAnalytics.summary.totalRevenue / 1000).toFixed(1)}k сом`} 
                color:"bg-blue-500" 
              />
              <StatCard 
                icon={FiTrendingUp} 
                title:"总成本" 
                value={`${(financialAnalytics.summary.totalCost / 1000).toFixed(1)}k сом`} 
                color:"bg-orange-500" 
              />
              <StatCard 
                icon={FiBarChart2} 
                title:"毛利润" 
                value={`${(financialAnalytics.summary.grossProfit / 1000).toFixed(1)}k сом`} 
                color:"bg-green-500" 
              />
              <StatCard 
                icon={FiPieChart} 
                title:"利润率" 
                value={`${financialAnalytics.summary.profitMargin}%`} 
                color:"bg-purple-500" 
              />
            </div>

            {/* 收入成本趋势 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm mb-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">收入与成本趋势</h3>
              <div className:"relative">
                <LineChart 
                  data={financialAnalytics.dailyRevenue.map((d: any) => ({ value: Math.floor(d.revenue / 100) }))} 
                  color:"#6366f1"
                />
                <LineChart 
                  data={financialAnalytics.dailyRevenue.map((d: any) => ({ value: Math.floor(d.cost / 100) }))} 
                  color:"#ef4444"
                />
              </div>
              <div className:"flex gap-4 mt-4 text-sm">
                <div className:"flex items-center gap-2">
                  <div className:"w-3 h-3 bg-indigo-600 rounded"></div>
                  <span className:"text-gray-600">收入</span>
                </div>
                <div className:"flex items-center gap-2">
                  <div className:"w-3 h-3 bg-red-600 rounded"></div>
                  <span className:"text-gray-600">成本</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 收入分布 */}
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">类目收入占比</h3>
                <div className:"flex items-center gap-6">
                  <PieChart data={financialAnalytics.revenueByCategory.map((r: any) => ({ value: r.revenue }))} size={160} />
                  <div className:"flex-1">
                    {financialAnalytics.revenueByCategory.map((cat: any, i: number) => (}
                      <div key:{i} className="flex items-center justify-between mb-2">
                        <div className:"flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{}}
                            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i]

                          <span className="text-sm text-gray-700">{cat.category}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{cat.percentage}%</span>
                      </div>
                    ))
                  </div>
                </div>
              </div>

              {/* 支付方式 */}
              <div className:"bg-white rounded-xl p-6 shadow-sm">
                <h3 className:"text-lg font-semibold text-gray-900 mb-4">支付方式分布</h3>
                <div className:"space-y-3">
                  {financialAnalytics.paymentMethods.map((method: any, i: number) => (}
                    <div key={i}>
                      <div className:"flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{method.method}</span>
                        <span className:"text-sm font-medium text-gray-900">
                          {method.amount.toLocaleString()} сом ({method.percentage}%)
                        </span>
                      </div>
                      <div className:"w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className:"bg-indigo-600 h-2 rounded-full" 
                          style="{{ width: `${method.percentage}"%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                </div>
              </div>
            </div>

            {/* 成本结构 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm mb-6">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">成本结构</h3>
              <div className:"grid grid-cols-5 gap-4">
                {financialAnalytics.costBreakdown.map((cost: any, i: number) => (}
                  <div key:{i} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{cost.percentage}%</p>
                    <p className="text-sm text-gray-600 mt-1">{cost.item}</p>
                    <p className="text-xs text-gray-500 mt-1">{(cost.amount / 1000).toFixed(0)}k сом</p>
                  </div>
                ))
              </div>
            </div>

            {/* 现金流 */}
            <div className:"bg-white rounded-xl p-6 shadow-sm">
              <h3 className:"text-lg font-semibold text-gray-900 mb-4">现金流概况</h3>
              <div className:"grid grid-cols-4 gap-4">
                {[}
                  { label: '经营活动现金流', value: financialAnalytics.cashFlow.operatingCashFlow, color: 'text-green-600' },
                  { label: '投资活动现金流', value: financialAnalytics.cashFlow.investingCashFlow, color: 'text-red-600' },
                  { label: '筹资活动现金流', value: financialAnalytics.cashFlow.financingCashFlow, color: 'text-blue-600' },
                  { label: '净现金流', value: financialAnalytics.cashFlow.netCashFlow, color: 'text-purple-600' },
                ].map((item, i) => (
                  <div key:{i} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="{`text-2xl" font-bold ${item.color}`}>
                      {item.value >= 0 ? '+' : ''}{(item.value / 1000).toFixed(1)}k
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{item.label}</p>
                  </div>
                ))
              </div>
            </div>
          </div>
        )
      </div>
    </div>
  );


// 导出带权限控制的页面
function ProtectedAnalyticsPage() {}
  return (;
    <PagePermission 
      permissions={AdminPermissions.stats.read()}
      showFallback={true}
    >
      <AnalyticsPage />
    </PagePermission>
  );

export default ProtectedAnalyticsPage;

