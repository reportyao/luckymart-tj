import { NextRequest, NextResponse } from 'next/server';
import { getRiskTelegramBot, RiskAlertMessage } from '@/lib/risk-telegram-bot';

// POST /api/risk/alert - 发送风险预警通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      incidentId,
      userId,
      severity,
      incidentType,
      riskScore,
      title,
      description,
      triggeredRules,
      metadata,
      channels = ['telegram'], // 通知渠道
      priority = 'normal',
      immediate : false // 是否立即发送
    } = body;

    // 验证必填参数
    if (!incidentId || !userId || !severity) {
      return NextResponse.json(;
        { error: '缺少必要参数: incidentId, userId, severity' },
        { status: 400 }
      );
}

    // 验证通知渠道
    const validChannels = ['telegram', 'email', 'sms', 'webhook'];
    const selectedChannels = channels.filter((channel : any) => validChannels.includes(channel));
    
    if (selectedChannels.length === 0) {
      return NextResponse.json(;
        { error: '未指定有效的通知渠道' },
        { status: 400 }
      );
    }

    // 构建风险预警消息
    const alertMessage: RiskAlertMessage = {
      incidentId,
      userId,
      severity: severity as 'low' | 'medium' | 'high' | 'critical',
      incidentType: incidentType || 'general',
      riskScore: riskScore || 0,
      title: title || '风控预警',
      description: description || `用户 ${userId} 的 ${incidentType || '行为'} 触发风险检测`,
      triggeredRules: triggeredRules || [],
      timestamp: new Date(),
      metadata: {
        ...metadata,
        channels: selectedChannels,
        priority,
        immediate
      }
    };

    const results = {
      successful: 0,
      failed: 0,
      details: [] as Array<{
        channel: string;
        success: boolean;
        message?: string;
        error?: string;
        notificationId?: string;
      }>
    };

    // 按渠道发送通知
    for (const channel of selectedChannels) {
      try {
        let success = false;
        let message = '';
        let notificationId = '';

        switch (channel) {
          case 'telegram':
            const bot = getRiskTelegramBot();
            success = await bot.sendRiskAlert(alertMessage);
            message = success ? 'Telegram通知发送成功' : 'Telegram通知发送失败';
            break;

          case 'email':
            success = await sendEmailNotification(alertMessage);
            message = success ? '邮件通知发送成功' : '邮件通知发送失败';
            break;

          case 'sms':
            success = await sendSmsNotification(alertMessage);
            message = success ? '短信通知发送成功' : '短信通知发送失败';
            break;

          case 'webhook':
            success = await sendWebhookNotification(alertMessage);
            message = success ? 'Webhook通知发送成功' : 'Webhook通知发送失败';
            break;

          default:
            throw new Error(`不支持的通知渠道: ${channel}`);
        }

        if (success) {
          results.successful++;
        } else {
          results.failed++;
        }

        results.details.push({
          channel,
          success,
          message,
          notificationId
        });

      } catch (error) {
        results.failed++;
        results.details.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : '未知错误'
        });
      }
    }

    // 记录通知尝试到数据库
    try {
      await recordNotificationAttempts(incidentId, selectedChannels, results);
    } catch (dbError) {
      console.error('记录通知尝试失败:', dbError);
      // 不影响主流程，继续执行
    }

    const response = {
      success: results.successful > 0,
      data: {
        incidentId,
        totalChannels: selectedChannels.length,
        results,
        summary: {
          successful: results.successful,
          failed: results.failed,
          successRate: `${((results.successful / selectedChannels.length) * 100).toFixed(1)}%`
        }
      },
      message: results.successful > 0 
        ? `成功发送 ${results.successful} 个通知，失败 ${results.failed} 个`
        : '所有通知发送失败'
    };

    const statusCode = results.successful > 0 ? 200 : 500;
    return NextResponse.json(response, { status: statusCode });
  }

  } catch (error) {
    console.error('发送风险预警通知错误:', error);
    return NextResponse.json(;
      {
        error: '发送预警通知失败',
        message: '系统正在处理其他请求，请稍后重试'
      },
      { status: 500 }
    );
  }
}

// GET /api/risk/alert - 查询通知状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const incidentId = searchParams.get('incidentId');
    const notificationType = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!incidentId) {
      return NextResponse.json(;
}
        { error: '缺少必要参数: incidentId' },
        { status: 400 }
      );
    }

    // 查询通知记录
    const notifications = await getNotificationsByIncident(incidentId, {
      type: notificationType,
      status,
      limit,
      offset
    });

    const response = {
      success: true,
      data: {
        incidentId,
        notifications,
        pagination: {
          total: notifications.length,
          limit,
          offset,
          hasMore: notifications.length === limit
        },
        summary: {
          total: notifications.length,
          sent: notifications.filter((n : any) => n.status === 'sent').length,
          failed: notifications.filter((n : any) => n.status === 'failed').length,
          pending: notifications.filter((n : any) => n.status === 'pending').length
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('查询通知状态错误:', error);
    return NextResponse.json(;
      {
        error: '查询通知状态失败',
        message: '请检查参数并重试'
      },
      { status: 500 }
    );
  }
}

// PUT /api/risk/alert - 确认通知已读
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, acknowledgedBy } = body;

    if (!notificationId) {
      return NextResponse.json(;
        { error: '缺少必要参数: notificationId' },
        { status: 400 }
      );
}

    // 更新通知状态为已确认
    const updated = await acknowledgeNotification(notificationId, acknowledgedBy);

    const response = {
      success: true,
      data: {
        notification: updated
      },
      message: '通知已确认'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('确认通知错误:', error);
    return NextResponse.json(;
      {
        error: '确认通知失败',
        message: '请检查通知ID是否正确'
      },
      { status: 500 }
    );
  }
}

// 辅助函数：发送邮件通知
async function sendEmailNotification(alert: RiskAlertMessage): Promise<boolean> {
  try {
    // 邮件发送逻辑（需要集成邮件服务，如SendGrid、AWS SES等）
    // 这里返回模拟结果
    console.log('发送邮件通知:', alert.incidentId);
    return true;
  } catch (error) {
    console.error('发送邮件通知失败:', error);
    return false;
  }
}

// 辅助函数：发送短信通知
async function sendSmsNotification(alert: RiskAlertMessage): Promise<boolean> {
  try {
    // 短信发送逻辑（需要集成短信服务，如阿里云、腾讯云等）
    // 这里返回模拟结果
    console.log('发送短信通知:', alert.incidentId);
    return true;
  } catch (error) {
    console.error('发送短信通知失败:', error);
    return false;
  }
}

// 辅助函数：发送Webhook通知
async function sendWebhookNotification(alert: RiskAlertMessage): Promise<boolean> {
  try {
    const webhookUrl = process.env.RISK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('未配置RISK_WEBHOOK_URL');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Risk-Control-System/1.0'
      },
      body: JSON.stringify({
        type: 'risk_alert',
        timestamp: new Date().toISOString(),
        data: alert
      })
    });

    return response.ok;
  } catch (error) {
    console.error('发送Webhook通知失败:', error);
    return false;
  }
}

// 辅助函数：记录通知尝试
async function recordNotificationAttempts(
  incidentId: string,
  channels: string[],
  results: any
): Promise<void> {
  try {
    // 这里需要实际保存到数据库
    // 为了演示，仅打印日志
    console.log('记录通知尝试:', {
      incidentId,
      channels,
      results
    });
  } catch (error) {
    console.error('记录通知尝试失败:', error);
  }
}

// 辅助函数：查询事件通知
async function getNotificationsByIncident(
  incidentId: string,
  filters: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    // 这里需要实际查询数据库
    // 为了演示，返回模拟数据
    return [;
      {
        id: 'notif_1',
        incidentId,
        notificationType: 'telegram',
        recipient: 'risk_alerts',
        channelId: 'telegram_chat_id',
        messageContent: '风控预警通知...',
        priority: 'high',
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date()
      }
    ];
  } catch (error) {
    console.error('查询通知失败:', error);
    return [];
  }
}

// 辅助函数：确认通知
async function acknowledgeNotification(
  notificationId: string,
  acknowledgedBy?: string
) {
  try {
    // 这里需要实际更新数据库
    // 为了演示，返回模拟更新的通知
    return {
      id: notificationId,
      status: 'acknowledged',
      acknowledgedAt: new Date(),
      acknowledgedBy
    };
  } catch (error) {
    console.error('确认通知失败:', error);
    throw error;
  }
}

// 批量发送通知
export async function batchSendAlerts(alerts: RiskAlertMessage[]): Promise<{
  successful: number;
  failed: number;
  results: Array<{ alert: RiskAlertMessage; success: boolean; error?: string }>;
}> {
  const results: Array<{ alert: RiskAlertMessage; success: boolean; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  for (const alert of alerts) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/risk/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });

      const result = await response.json();
      const success = result.success;

      if (success) {
        successful++;
      } else {
        failed++;
}

      results.push({ alert, success, error: result.error });
    } catch (error) {
      failed++;
      results.push({
        alert,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // 添加短暂延迟避免频率限制
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return ;
}