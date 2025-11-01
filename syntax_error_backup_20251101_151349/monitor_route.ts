import { NextRequest, NextResponse } from 'next/server';
import { RiskControlService } from '@/lib/risk-control';
import crypto from 'crypto';

// POST /api/risk/monitor - 启动实时监控会话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, deviceInfo } = body;

    // 验证必填参数
    if (!userId) {
      return NextResponse.json(
        { error: '缺少必要参数: userId' },
        { status: 400 }
      );
    }

    // 获取客户端信息
    const userAgent = request.headers.get('user-agent') || '';
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const ipAddress = xForwardedFor?.split(',')[0]?.trim() || xRealIp || 'unknown';
    
    // 生成设备指纹
    const deviceFingerprint = generateDeviceFingerprint({
      userAgent,
      userId,
      deviceInfo
    });

    // 生成会话令牌
    const sessionToken = crypto.randomUUID();

    try {
      // 创建监控会话
      const session = await RiskControlService.createMonitoringSession({
        userId,
        sessionToken,
        ipAddress,
        userAgent,
        deviceFingerprint
      });

      // 立即进行初步风险评估
      const initialRiskScore = await performInitialRiskAssessment(userId, ipAddress, deviceFingerprint);

      // 更新会话风险评分
      await RiskControlService.updateMonitoringSession(sessionToken, {
        riskScore: initialRiskScore,
        isSuspicious: initialRiskScore > 50
      });

      const response = {
        success: true,
        session: {
          token: sessionToken,
          userId,
          ipAddress,
          userAgent,
          deviceFingerprint,
          startTime: session.session_start,
          initialRiskScore,
          isSuspicious: initialRiskScore > 50,
          sessionDuration: '24小时',
          features: {
            realTimeMonitoring: true,
            behaviorAnalysis: true,
            anomalyDetection: true,
            autoActions: true
          }
        },
        message: '实时监控会话已创建'
      };

      return NextResponse.json(response, { status: 201 });

    } catch (dbError) {
      console.error('创建监控会话失败:', dbError);
      return NextResponse.json(
        { error: '监控服务暂时不可用' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('实时监控API错误:', error);
    return NextResponse.json(
      {
        error: '监控服务启动失败',
        message: '系统正在维护中，请稍后重试'
      },
      { status: 500 }
    );
  }
}

// PUT /api/risk/monitor - 更新监控会话
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, userActions, activityData } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: '缺少必要参数: sessionToken' },
        { status: 400 }
      );
    }

    // 验证会话令牌
    const session = await RiskControlService.validateSessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: '无效或已过期的会话令牌' },
        { status: 401 }
      );
    }

    // 分析用户行为
    const behaviorAnalysis = await analyzeUserBehavior(session.user_id, userActions, activityData);
    
    // 更新监控会话
    const newRiskScore = Math.max(session.risk_score, behaviorAnalysis.riskIncrease);
    await RiskControlService.updateMonitoringSession(sessionToken, {
      riskEventsCount: session.risk_events_count + (behaviorAnalysis.isSuspicious ? 1 : 0),
      riskScore: newRiskScore,
      isSuspicious: newRiskScore > 50,
      sessionData: {
        ...session.session_data,
        lastActivity: new Date(),
        userActions: [...(session.session_data?.userActions || []), ...(userActions || [])],
        behaviorAnalysis
      }
    });

    // 如果风险评分过高，触发自动处理
    if (newRiskScore > 75) {
      await handleHighRiskSession(sessionToken, session, newRiskScore, behaviorAnalysis);
    }

    const response = {
      success: true,
      sessionUpdate: {
        sessionToken,
        lastActivity: new Date().toISOString(),
        riskScore: newRiskScore,
        riskEventsCount: session.risk_events_count + (behaviorAnalysis.isSuspicious ? 1 : 0),
        isSuspicious: newRiskScore > 50,
        behaviorAnalysis,
        autoAction: newRiskScore > 75 ? 'session_limited' : null
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('更新监控会话错误:', error);
    return NextResponse.json(
      { error: '监控会话更新失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/risk/monitor - 结束监控会话
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionToken = searchParams.get('sessionToken');

    if (!sessionToken) {
      return NextResponse.json(
        { error: '缺少必要参数: sessionToken' },
        { status: 400 }
      );
    }

    // 验证会话令牌
    const session = await RiskControlService.validateSessionToken(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: '无效或已过期的会话令牌' },
        { status: 401 }
      );
    }

    // 生成会话报告
    const sessionReport = await generateSessionReport(session);

    // 结束会话
    // 注意：这里需要实际调用数据库更新，但在示例中我们只返回报告

    const response = {
      success: true,
      sessionEnded: {
        sessionToken,
        endTime: new Date().toISOString(),
        duration: sessionReport.duration,
        totalRiskEvents: session.risk_events_count,
        finalRiskScore: session.risk_score,
        report: sessionReport
      },
      message: '监控会话已结束'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('结束监控会话错误:', error);
    return NextResponse.json(
      { error: '结束监控会话失败' },
      { status: 500 }
    );
  }
}

// 辅助函数：生成设备指纹
function generateDeviceFingerprint(data: {
  userAgent: string;
  userId: string;
  deviceInfo?: any;
}): string {
  const fingerprint = [
    data.userId,
    data.userAgent,
    data.deviceInfo?.screen || 'unknown',
    data.deviceInfo?.timezone || 'unknown',
    data.deviceInfo?.language || 'unknown',
    data.deviceInfo?.platform || 'unknown'
  ].join('|');

  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
}

// 辅助函数：执行初步风险评估
async function performInitialRiskAssessment(
  userId: string, 
  ipAddress: string, 
  deviceFingerprint: string
): Promise<number> {
  try {
    // 这里可以调用实际的风险评估逻辑
    // 目前返回基于简单规则的评分
    let riskScore = 0;

    // IP风险评估
    if (ipAddress === 'unknown') {
      riskScore += 20;
    }

    // 设备指纹风险评估
    if (!deviceFingerprint) {
      riskScore += 10;
    }

    // 用户ID格式检查
    if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      riskScore += 15;
    }

    return Math.min(riskScore, 100);
  } catch (error) {
    console.error('初步风险评估失败:', error);
    return 50; // 默认中等风险
  }
}

// 辅助函数：分析用户行为
async function analyzeUserBehavior(
  userId: string,
  userActions?: any[],
  activityData?: any
): Promise<{
  isSuspicious: boolean;
  riskIncrease: number;
  analysis: any;
}> {
  try {
    let riskIncrease = 0;
    const analysis = {
      actions: userActions || [],
      activityPatterns: activityData || {},
      suspiciousIndicators: []
    };

    // 分析行为模式
    if (userActions && userActions.length > 0) {
      // 快速连续操作
      const actionTimes = userActions.map((action: any) => new Date(action.timestamp));
      const intervals = actionTimes.slice(1).map((time, index) => 
        time.getTime() - actionTimes[index].getTime()
      );

      const avgInterval = intervals.reduce((sum: any,  interval: any) => sum + interval, 0) / intervals.length;
      if (avgInterval < 1000) { // 小于1秒的平均间隔
        riskIncrease += 30;
        analysis.suspiciousIndicators.push('rapid_action_sequence');
      }

      // 异常操作类型
      const actionTypes = new Set(userActions.map((action: any) => action.type));
      if (actionTypes.size > 10) { // 太多不同类型的操作
        riskIncrease += 20;
        analysis.suspiciousIndicators.push('diverse_action_pattern');
      }
    }

    // 分析活动数据
    if (activityData) {
      // 时间模式分析
      const currentHour = new Date().getHours();
      if (currentHour < 6 || currentHour > 23) { // 深夜活动
        riskIncrease += 10;
        analysis.suspiciousIndicators.push('unusual_time_activity');
      }
    }

    const isSuspicious = riskIncrease > 30;
    
    return {
      isSuspicious,
      riskIncrease,
      analysis
    };
  } catch (error) {
    console.error('行为分析失败:', error);
    return {
      isSuspicious: false,
      riskIncrease: 0,
      analysis: { error: '分析失败' }
    };
  }
}

// 辅助函数：处理高风险会话
async function handleHighRiskSession(
  sessionToken: string,
  session: any,
  riskScore: number,
  behaviorAnalysis: any
): Promise<void> {
  try {
    // 创建风险事件
    const incident = await RiskControlService.createRiskIncident({
      userId: session.user_id,
      incidentType: 'suspicious_session',
      severity: riskScore > 90 ? 'critical' : 'high',
      riskScore,
      title: '高风险监控会话',
      description: `用户会话${sessionToken}检测到异常行为模式`,
      triggerConditions: {
        sessionToken,
        behaviorAnalysis,
        riskScore,
        timestamp: new Date()
      },
      metadata: {
        sessionToken,
        deviceFingerprint: session.device_fingerprint,
        ipAddress: session.ip_address
      }
    });

    // 自动执行限制措施
    await RiskControlService.executeAutomaticAction(incident.id, [
      'limit_session',
      'require_verification'
    ]);

  } catch (error) {
    console.error('处理高风险会话失败:', error);
  }
}

// 辅助函数：生成会话报告
async function generateSessionReport(session: any): Promise<any> {
  const startTime = new Date(session.session_start);
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  
  return {
    sessionId: session.id,
    userId: session.user_id,
    startTime,
    endTime,
    duration: Math.round(duration / 1000), // 秒数
    riskEventsCount: session.risk_events_count,
    finalRiskScore: session.risk_score,
    sessionData: session.session_data,
    summary: {
      totalDuration: `${Math.floor(duration / 60000)}分钟`,
      riskLevel: session.risk_score > 75 ? '高风险' : session.risk_score > 50 ? '中风险' : '低风险',
      recommendations: session.risk_score > 50 ? ['建议人工审核', '增加监控频率'] : ['监控正常']
    }
  };
}