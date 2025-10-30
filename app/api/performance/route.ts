import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitor, MetricsCollector } from '@/lib/performance';
import { MultiLevelCache } from '@/lib/memory-cache';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'stats';

    if (type === 'stats') {
      // 返回性能统计信息
      const perfStats = PerformanceMonitor.getPerformanceStats();
      const metrics = MetricsCollector.getAllMetrics();
      const cacheStats = MultiLevelCache.getAllStats();

      return NextResponse.json({
        success: true,
        data: {
          timestamp: Date.now(),
          performance: perfStats,
          metrics,
          cache: cacheStats,
          summary: {
            totalRequests: perfStats.totalRequests,
            averageResponseTime: perfStats.averageResponseTime,
            cacheHitRate: Object.values(cacheStats).reduce((acc: number, cache: any) => {
              return acc + cache.hitRate;
            }, 0) / Object.keys(cacheStats).length || 0,
            errorRate: perfStats.errorRate
          }
        }
      });
    }

    if (type === 'slow-queries') {
      // 返回慢查询
      const slowQueries = PerformanceMonitor.getSlowQueries(20);
      return NextResponse.json({
        success: true,
        data: {
          timestamp: Date.now(),
          slowQueries
        }
      });
    }

    if (type === 'errors') {
      // 返回错误日志
      const errorLogs = PerformanceMonitor.getErrorLogs(20);
      return NextResponse.json({
        success: true,
        data: {
          timestamp: Date.now(),
          errors: errorLogs
        }
      });
    }

    if (type === 'metrics') {
      // 返回详细指标
      const metrics = MetricsCollector.getAllMetrics();
      return NextResponse.json({
        success: true,
        data: {
          timestamp: Date.now(),
          metrics
        }
      });
    }

    if (type === 'cache') {
      // 返回缓存统计
      const cacheStats = MultiLevelCache.getAllStats();
      return NextResponse.json({
        success: true,
        data: {
          timestamp: Date.now(),
          caches: cacheStats
        }
      });
    }

    if (type === 'export') {
      // 导出所有性能数据
      const perfStats = PerformanceMonitor.getPerformanceStats();
      const metrics = MetricsCollector.getAllMetrics();
      const cacheStats = MultiLevelCache.getAllStats();
      const slowQueries = PerformanceMonitor.getSlowQueries(50);
      const errorLogs = PerformanceMonitor.getErrorLogs(50);

      return NextResponse.json({
        success: true,
        data: {
          exportTime: new Date().toISOString(),
          performance: perfStats,
          metrics,
          cache: cacheStats,
          slowQueries,
          errorLogs
        }
      });
    }

    // 默认返回基本统计
    const perfStats = PerformanceMonitor.getPerformanceStats();
    return NextResponse.json({
      success: true,
      data: {
        timestamp: Date.now(),
        performance: perfStats,
        summary: {
          totalRequests: perfStats.totalRequests,
          averageResponseTime: perfStats.averageResponseTime,
          errorRate: perfStats.errorRate,
          slowQueries: perfStats.slowQueries
        }
      }
    });

  } catch (error: any) {
    console.error('Performance stats error:', error);
    return NextResponse.json(
      { 
        error: '获取性能统计失败', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 清除性能监控日志
    PerformanceMonitor.clearLogs();
    
    // 清除所有缓存
    MultiLevelCache.clearAll();

    return NextResponse.json({
      success: true,
      message: '性能监控数据已清除'
    });

  } catch (error: any) {
    console.error('Clear performance data error:', error);
    return NextResponse.json(
      { 
        error: '清除数据失败', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 记录自定义指标
    const body = await request.json();
    const { name, value } = body;

    if (name && typeof value === 'number') {
      MetricsCollector.record(name, value);
      
      return NextResponse.json({
        success: true,
        message: `指标 ${name} 已记录: ${value}`
      });
    }

    return NextResponse.json(
      { error: '无效的指标数据' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Record metric error:', error);
    return NextResponse.json(
      { 
        error: '记录指标失败', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}