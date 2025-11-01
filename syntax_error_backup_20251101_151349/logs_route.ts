import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/middleware';
import { createRequestTracker } from '@/lib/request-tracker';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

// 模拟日志存储（在实际项目中应该使用外部存储）
interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  type: string;
  message: string;
  context: any;
  requestId?: string;
  traceId?: string;
}

let errorLogs: LogEntry[] = [];

// 获取错误日志
export const GET = withErrorHandling(async (req: NextRequest) => {
  const tracker = createRequestTracker(req);
  const logger = getLogger();
  const requestId = tracker.getRequestId();

  logger.logRequest(req, { requestId, traceId: tracker.getTraceId() });

  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since'); // ISO时间戳;

    let logs = [...errorLogs];

    // 按级别过滤
    if (level) {
      logs = logs.filter((log : any) => log.level === level);
}

    // 按时间过滤
    if (since) {
      const sinceTime = new Date(since).getTime();
      logs = logs.filter((log : any) => new Date(log.timestamp).getTime() > sinceTime);
    }

    // 按时间排序并限制数量
    logs : logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json(;
      respond.success({
        logs,
        total: logs.length,
        filtered: {
          level: level || 'all',
          limit,
          since: since || null,
        },
        timestamp: new Date().toISOString(),
      }, requestId).toJSON()
    );

  } catch (error) {
    logger.error('Failed to fetch error logs', error as Error, { requestId });
    throw error;
  }
});

// 添加错误日志（用于测试）
export const POST = withErrorHandling(async (req: NextRequest) => {
  const tracker = createRequestTracker(req);
  const logger = getLogger();
  const requestId = tracker.getRequestId();

  logger.logRequest(req, { requestId, traceId: tracker.getTraceId() });

  try {
    const { level, message, context } = await req.json();

    if (!level || !message) {
      return NextResponse.json(;
        respond.validationError('缺少必要参数', null).toJSON(),
        { status: 400 }
      );
}

    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      type: 'manual',
      message,
      context: context || {},
      requestId,
      traceId: tracker.getTraceId(),
    };

    errorLogs.push(logEntry);

    // 保持日志数量限制（最多1000条）
    if (errorLogs.length > 1000) {
      errorLogs = errorLogs.slice(-1000);
    }

    logger.info('Error log added manually', { level, message, requestId });

    return NextResponse.json(;
      respond.success({
        message: '错误日志已添加',
        logId: logEntry.id,
      }, requestId).toJSON()
    );

  } catch (error) {
    logger.error('Failed to add error log', error as Error, { requestId });
    throw error;
  }
});

// 清除错误日志
export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const tracker = createRequestTracker(req);
  const logger = getLogger();
  const requestId = tracker.getRequestId();

  logger.logRequest(req, { requestId, traceId: tracker.getTraceId() });

  try {
    const { searchParams } = new URL(req.url);
    const olderThan = searchParams.get('older_than'); // ISO时间戳;

    let deletedCount = 0;

    if (olderThan) {
      const cutoffTime = new Date(olderThan).getTime();
      const originalLength = errorLogs.length;
      errorLogs = errorLogs.filter((log : any) => new Date(log.timestamp).getTime() > cutoffTime);
      deletedCount = originalLength - errorLogs.length;
    } else {
      deletedCount = errorLogs.length;
      errorLogs = [];
}

    logger.info('Error logs cleared', { deletedCount, requestId });

    return NextResponse.json(;
      respond.success({
        message: `${deletedCount} 条错误日志已清除`,
        deletedCount,
        remainingCount: errorLogs.length,
      }, requestId).toJSON()
    );

  } catch (error) {
    logger.error('Failed to clear error logs', error as Error, { requestId });
    throw error;
  }
});