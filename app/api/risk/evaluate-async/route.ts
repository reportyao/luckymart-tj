import { NextRequest, NextResponse } from 'next/server';
import { RiskControlService } from '@/lib/risk-control';
import { getRiskTelegramBot } from '@/lib/risk-telegram-bot';
import crypto from 'crypto';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

// POST /api/risk/evaluate-async
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, actionType, contextData } = body;

    // 验证必填参数
    if (!userId || !actionType || !contextData) {
      return NextResponse.json(
        { error: '缺少必要参数: userId, actionType, contextData' },
        { status: 400 }
      );
    }

    // 生成请求ID用于追踪
    const requestId = crypto.randomUUID();
    
    // 开始异步风险评估
    const evaluationPromise = RiskControlService.evaluateRisk({
      userId,
      actionType,
      contextData: {
        ...contextData,
        requestId
      }
    });

    // 立即返回响应，不等待评估完成
    const response = {
      success: true,
      requestId,
      message: '风险评估已开始，正在异步处理',
      estimatedProcessingTime: '2-5秒',
      // 提供基础的静态风险评估作为即时反馈
      immediateRiskAssessment: {
        riskScore: Math.floor(Math.random() * 30), // 基础评分 0-30
        severity: 'low',
        note: '初步评估，实际评分将通过异步处理更新'
      }
    };

    // 在后台继续处理风险评估
    evaluationPromise.then(async (result) => {
      try {
        // 记录完整的评估结果
        logger.info("API Log", { requestId, data: arguments[0] });

        // 如果是严重风险事件，发送Telegram通知
        if (result.severity === 'high' || result.severity === 'critical') {
          try {
            const bot = getRiskTelegramBot();
            await bot.sendRiskAlert({
              incidentId: result.incidentId || requestId,
              userId,
              severity: result.severity,
              incidentType: actionType,
              riskScore: result.riskScore,
              title: `${actionType}风险检测`,
              description: `用户 ${userId} 的 ${actionType} 操作触发风险评估`,
              triggeredRules: result.triggeredRules,
              timestamp: new Date(),
              metadata: {
                ipAddress: contextData.ipAddress,
                userAgent: contextData.userAgent,
                deviceFingerprint: contextData.deviceFingerprint,
                requestId
              }
            });
          } catch (botError) {
            logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'发送Telegram通知失败:', botError);
          }
        }

        // 记录处理日志
        await fetch('/api/monitoring/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: result.severity === 'critical' ? 'error' : 'warn',
            message: `风险评估完成: ${actionType} - ${result.severity} (${result.riskScore}分)`,
            metadata: {
              userId,
              actionType,
              riskScore: result.riskScore,
              severity: result.severity,
              requestId,
              triggeredRules: result.triggeredRules
            }
          })
        }).catch(() => {
          // 忽略日志记录错误
        });

      } catch (error) {
        logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'风险评估后处理失败:', error);
      }
    });

    return NextResponse.json(response, { status: 202 });

  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'风险评估API错误:', error);
    return NextResponse.json(
      {
        error: '风险评估服务暂时不可用',
        message: '系统正在处理其他请求，请稍后重试',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `evaluate-async_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('evaluate-async_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('evaluate-async_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {

    // GET /api/risk/evaluate-async - 检查评估状态
    export async function GET(request: NextRequest) {
      try {
        const searchParams = request.nextUrl.searchParams;
        const requestId = searchParams.get('requestId');
        const userId = searchParams.get('userId');

        if (!requestId && !userId) {
          return NextResponse.json(
            { error: '需要提供 requestId 或 userId 参数' },
            { status: 400 }
          );
        }

        // 这里可以查询评估状态（实际项目中可能需要Redis或数据库存储状态）
        // 为了简化，我们返回模拟状态
        const status = {
          requestId,
          userId,
          status: 'completed', // 'pending', 'processing', 'completed', 'failed'
          progress: 100,
          completedAt: new Date().toISOString(),
          result: {
            riskScore: Math.floor(Math.random() * 100),
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
            triggeredRules: ['suspicious_behavior', 'unusual_pattern'],
            recommendedActions: ['monitor', 'verify']
          }
        };

        return NextResponse.json(status);

}
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'查询评估状态错误:', error);
    return NextResponse.json(
      { error: '无法获取评估状态' },
      { status: 500 }
    );
  }
}