import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import QueryOptimizer from '@/lib/query-optimizer';

// GET /api/admin/stats - 获取后台统计数据
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({
        success: false,
        error: '管理员权限验证失败'
      }, { status: 403 });
    }

    // 检查统计查看权限
    const hasPermission = admin.permissions.includes('stats:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: '权限不足：无法查看统计数据'
      }, { status: 403 });
    }

    // 使用优化的统计查询
    const stats = await QueryOptimizer.getDashboardStats();

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: Number(stats.total_users || 0),
        totalOrders: Number(stats.total_orders || 0),
        pendingWithdrawals: Number(stats.pending_withdrawals || 0),
        activeRounds: Number(stats.active_rounds || 0),
        todayUsers: Number(stats.today_users || 0),
        todayOrders: Number(stats.today_orders || 0),
        todayRevenue: stats.today_revenue?.toString() || '0',
        totalRevenue: stats.total_revenue?.toString() || '0',
        activeResaleListings: Number(stats.active_resale_listings || 0),
        todayParticipations: Number(stats.today_participations || 0)
      }
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch stats'
    }, { status: 500 });
  }
}
