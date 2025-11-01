import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/middleware';
import { createRequestTracker } from '@/lib/request-tracker';
import { getLogger } from '@/lib/logger';
import { getMonitor } from '@/lib/monitoring';
import { respond } from '@/lib/responses';

// 获取系统健康状态
export const GET = withErrorHandling(async (req: NextRequest) => {
  const tracker = createRequestTracker(req);
  const logger = getLogger();
  const monitor = getMonitor();
  const requestId = tracker.getRequestId();

  logger.logRequest(req, { requestId, traceId: tracker.getTraceId() });

  try {
    const health = monitor.getSystemHealth();
    const monitoringReport = monitor.getMonitoringReport();

    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(;
}
      respond.success({
        status: health.status,
        timestamp: new Date().toISOString(),
        uptime: health.uptime,
        metrics: health.metrics,
        alerts: monitoringReport.activeAlerts.length,
        performance: monitoringReport.performanceMetrics,
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      }, requestId).toJSON(),
      { status: statusCode }
    );

  } catch (error) {
    logger.error('Health check failed', error as Error, { requestId });
    
    return NextResponse.json(;
      respond.serverError('健康检查失败', { error: (error as Error).message }).toJSON(),
      { status: 503 }
    );
  }
});

// 详细的系统监控信息
export const POST = withErrorHandling(async (req: NextRequest) => {
  const tracker = createRequestTracker(req);
  const logger = getLogger();
  const monitor = getMonitor();
  const requestId = tracker.getRequestId();

  logger.logRequest(req, { requestId, traceId: tracker.getTraceId() });

  try {
    const { action } = await req.json();

    switch (action) {
      case 'metrics':
        const report = monitor.getMonitoringReport();
        return NextResponse.json(;
}
          respond.success(report, requestId).toJSON()
        );

      case 'reset':
        monitor.reset();
        logger.info('Monitoring data reset', { requestId });
        return NextResponse.json(;
          respond.success({ message: '监控数据已重置' }, requestId).toJSON()
        );

      case 'alerts':
        const activeAlerts = monitor.getMonitoringReport().activeAlerts;
        return NextResponse.json(;
          respond.success(activeAlerts, requestId).toJSON()
        );

      default:
        return NextResponse.json(;
          respond.validationError('未知的操作类型', 'action', action).toJSON(),
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Monitoring action failed', error as Error, );
    throw error;
  }
});