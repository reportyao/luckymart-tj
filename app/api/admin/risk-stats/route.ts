import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

const withStatsPermission = AdminPermissionManager.createPermissionMiddleware([
  AdminPermissions.stats.read
]);

// 模拟风控统计数据
const mockDashboardData = {
  todayRiskEvents: 23,
  riskEventsTrend: [15, 12, 18, 25, 20, 22, 28],
  riskLevelDistribution: [
    { label: '低风险', value: 45, color: '#10B981' },
    { label: '中风险', value: 30, color: '#F59E0B' },
    { label: '高风险', value: 20, color: '#EF4444' },
    { label: '严重风险', value: 5, color: '#7C2D12' }
  ],
  rulesExecuted: 156,
  autoProcessingSuccess: 89.5,
  totalRules: 24,
  activeRules: 18,
  // 新增统计数据
  highRiskUsers: 12,
  frozenAccounts: 3,
  limitedAccounts: 7,
  averageRiskScore: 67,
  userStats: {
    totalUsers: 1250,
    activeUsers: 987,
    newUsersToday: 15
  },
  transactionStats: {
    totalTransactions: 3456,
    flaggedTransactions: 89,
    blockedTransactions: 12
  },
  // 时间序列数据
  hourlyRiskEvents: [
    { hour: '00:00', count: 2 },
    { hour: '01:00', count: 1 },
    { hour: '02:00', count: 0 },
    { hour: '03:00', count: 1 },
    { hour: '04:00', count: 3 },
    { hour: '05:00', count: 2 },
    { hour: '06:00', count: 4 },
    { hour: '07:00', count: 6 },
    { hour: '08:00', count: 8 },
    { hour: '09:00', count: 12 },
    { hour: '10:00', count: 15 },
    { hour: '11:00', count: 18 },
    { hour: '12:00', count: 22 },
    { hour: '13:00', count: 25 },
    { hour: '14:00', count: 20 },
    { hour: '15:00', count: 23 },
    { hour: '16:00', count: 19 },
    { hour: '17:00', count: 16 },
    { hour: '18:00', count: 14 },
    { hour: '19:00', count: 11 },
    { hour: '20:00', count: 9 },
    { hour: '21:00', count: 7 },
    { hour: '22:00', count: 5 },
    { hour: '23:00', count: 3 }
  ],
  // 风险类型分布
  riskTypeDistribution: [
    { type: '异常登录', count: 45, percentage: 35.2 },
    { type: '大额交易', count: 32, percentage: 25.0 },
    { type: '频繁操作', count: 28, percentage: 21.9 },
    { type: '设备异常', count: 15, percentage: 11.7 },
    { type: 'IP异常', count: 8, percentage: 6.2 }
  ]
};

export async function GET(request: NextRequest) {
  return withStatsPermission(async (request: any, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month
    const refresh = searchParams.get('refresh') === 'true';

    // 在实际应用中，这里会根据 period 参数获取不同时间段的数据
    // refresh 参数用于强制刷新缓存
    
    // 模拟数据加载延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json({
      success: true,
      data: {
        ...mockDashboardData,
        period,
        timestamp: new Date().toISOString(),
        // 根据时间段调整数据
        ...(period === 'week' && {
          todayRiskEvents: mockDashboardData.todayRiskEvents * 7,
          rulesExecuted: mockDashboardData.rulesExecuted * 7
        }),
        ...(period === 'month' && {
          todayRiskEvents: mockDashboardData.todayRiskEvents * 30,
          rulesExecuted: mockDashboardData.rulesExecuted * 30
        })
      }
    });
  } catch (error) {
    console.error('获取风控统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取数据失败' },
      { status: 500 }
    );
  }
  })(request);
}

// 获取实时统计数据（用于WebSocket或轮询）
export async function POST(request: NextRequest) {
  return withStatsPermission(async (request: any, admin: any) => {
  try {
    const body = await request.json();
    const { metric, action } = body;

    if (!metric) {
      return NextResponse.json(
        { success: false, error: '缺少指标参数' },
        { status: 400 }
      );
    }

    // 模拟实时数据更新
    const updatedData = { ...mockDashboardData };

    switch (action) {
      case 'increment':
        if (metric in updatedData && typeof updatedData[metric] === 'number') {
          (updatedData as any)[metric]++;
        }
        break;
      case 'reset':
        if (metric in updatedData && typeof updatedData[metric] === 'number') {
          (updatedData as any)[metric] = 0;
        }
        break;
      default:
        break;
    }

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: '数据更新成功'
    });
  } catch (error) {
    console.error('更新统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
  })(request);
}