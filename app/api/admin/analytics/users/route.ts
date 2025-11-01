import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions, AdminUser } from '../../../../../lib/admin-permission-manager';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

const withPermission = AdminPermissionManager.createPermissionMiddleware({
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `users_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('users_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
}
  } catch (error) {
    logger.error('users_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
    });

    export async function GET(request: NextRequest) {
      return withPermission(async (request: NextRequest, admin: AdminUser) => {

        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || '7d';

        // 根据时间范围生成数据
        const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

        const userAnalytics = {
          summary: {
            totalUsers: 15234 + Math.floor(Math.random() * 1000),
            activeUsers: 8456 + Math.floor(Math.random() * 500),
            newUsers: 234 + Math.floor(Math.random() * 100),
            retentionRate: (65 + Math.random() * 10).toFixed(1),
          },
          dailyNewUsers: Array.from({ length: days }, (_, i) => ({
            date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 150) + 50,
          })),
          userSources: [
            { source: 'Telegram推荐', count: 4523, percentage: 42.3 },
            { source: '直接访问', count: 2856, percentage: 26.7 },
            { source: '社交媒体', count: 1876, percentage: 17.5 },
            { source: '搜索引擎', count: 982, percentage: 9.2 },
            { source: '其他', count: 456, percentage: 4.3 },
          ],
          ageDistribution: [
            { range: '18-24岁', count: 3456, percentage: 28.5 },
            { range: '25-34岁', count: 5234, percentage: 43.2 },
            { range: '35-44岁', count: 2145, percentage: 17.7 },
            { range: '45-54岁', count: 876, percentage: 7.2 },
            { range: '55岁以上', count: 412, percentage: 3.4 },
          ],
          deviceDistribution: [
            { device: '移动端', count: 9876, percentage: 78.4 },
            { device: '桌面端', count: 2145, percentage: 17.0 },
            { device: '平板', count: 578, percentage: 4.6 },
          ],
        };

        return NextResponse.json(userAnalytics);
}
}
