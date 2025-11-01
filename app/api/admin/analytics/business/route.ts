import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions, AdminUser } from '../../../../../lib/admin-permission-manager';

const withPermission = AdminPermissionManager.createPermissionMiddleware({
  customPermissions: AdminPermissions.stats.read()
});

export async function GET(request: NextRequest) {
  return withPermission(async (request: NextRequest, admin: AdminUser) => {

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    const businessAnalytics = {
      orderMetrics: {
        totalOrders: 5678 + Math.floor(Math.random() * 500),
        completedOrders: 5234 + Math.floor(Math.random() * 400),
        canceledOrders: 234 + Math.floor(Math.random() * 50),
        avgOrderValue: (245.67 + Math.random() * 50).toFixed(2),
      },
      dailyOrders: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        orders: Math.floor(Math.random() * 200) + 100,
        revenue: Math.floor(Math.random() * 50000) + 20000,
      })),
      categoryPerformance: [
        { category: '食品饮料', orders: 2345, revenue: 125678, growth: 15.6 },
        { category: '日用百货', orders: 1876, revenue: 98543, growth: 8.3 },
        { category: '个护清洁', orders: 1234, revenue: 76543, growth: 12.4 },
        { category: '母婴用品', orders: 987, revenue: 65432, growth: -3.2 },
        { category: '数码家电', orders: 765, revenue: 54321, growth: 21.5 },
      ],
      topProducts: [
        { id: 1, name: '可口可乐 330ml', sales: 567, revenue: 4536, stock: 1234 },
        { id: 2, name: '农夫山泉 550ml', sales: 489, revenue: 3912, stock: 2345 },
        { id: 3, name: '康师傅方便面', sales: 423, revenue: 5076, stock: 876 },
        { id: 4, name: '维达抽纸', sales: 398, revenue: 7164, stock: 456 },
        { id: 5, name: '金龙鱼食用油 5L', sales: 345, revenue: 20700, stock: 234 },
      ],
      conversionFunnel: [
        { step: '浏览商品', count: 12345, percentage: 100 },
        { step: '加入购物车', count: 4567, percentage: 37.0 },
        { step: '进入结算', count: 2345, percentage: 19.0 },
        { step: '完成支付', count: 1876, percentage: 15.2 },
      ],
    };

    return NextResponse.json(businessAnalytics);
  });
}
