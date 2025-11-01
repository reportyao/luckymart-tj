import { NextRequest, NextResponse } from 'next/server';
import { RiskControlService } from '@/lib/risk-control';

// GET /api/risk/events - 查询风险事件记录
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 提取查询参数
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const incidentType = searchParams.get('incidentType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // 日期范围过滤
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // 搜索关键词
    const search = searchParams.get('search');

    // 构建查询条件
    const where: any = {};
    if (userId) where.userId = userId; {
    if (status) where.status = status; {
    if (severity) where.severity = severity; {
    if (incidentType) where.incident_type = incidentType; {
    
    // 日期范围过滤
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
}
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // 搜索过滤
    if (search) {
      where.OR : [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 获取风险事件
    const result = await RiskControlService.getRiskIncidents({
      userId,
      status,
      severity,
      limit,
      offset
    });

    // 转换数据格式并添加额外信息
    const incidentsWithDetails = await Promise.all(;
      result.incidents.map(async (incident: any) => {
        // 获取相关的风险处理记录
        const actions = await getRiskActionsForIncident(incident.id);
        
        // 获取相关的通知记录
        const notifications = await getNotificationsForIncident(incident.id);
        
        // 计算事件持续时间
        const duration = incident.resolved_at;
          ? new Date(incident.resolved_at).getTime() - new Date(incident.created_at).getTime()
          : new Date().getTime() - new Date(incident.created_at).getTime();
        
        return {
          ...incident,
          duration: Math.round(duration / 1000), // 秒数
          actions,
          notifications,
          priority: calculateEventPriority(incident),
          canResolve: incident.status === 'open' || incident.status === 'investigating',
          canEscalate: incident.status === 'open' && incident.severity !== 'critical'
        };
      })
    );

    // 生成统计信息
    const stats = await generateIncidentStats(where);

    const response = {
      success: true,
      data: {
        incidents: incidentsWithDetails,
        pagination: {
          total: result.total,
          limit,
          offset,
          hasMore: result.hasMore,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(result.total / limit)
        },
        filters: {
          userId,
          status,
          severity,
          incidentType,
          dateFrom,
          dateTo,
          search
        },
        stats,
        availableFilters: {
          statuses: ['open', 'investigating', 'resolved', 'false_positive', 'escalated'],
          severities: ['low', 'medium', 'high', 'critical'],
          incidentTypes: ['login', 'transaction', 'registration', 'withdrawal', 'suspicious_session']
        }
      }
    };

    return NextResponse.json(response);
  }

  } catch (error) {
    console.error('查询风险事件错误:', error);
    return NextResponse.json(;
      {
        error: '查询风险事件失败',
        message: '系统正在处理其他请求，请稍后重试'
      },
      { status: 500 }
    );
  }
}

// POST /api/risk/events - 创建新的风险事件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      incidentType,
      severity,
      title,
      description,
      triggerConditions,
      metadata,
      autoActionTaken
    } = body;

    // 验证必填参数
    if (!userId || !incidentType || !title) {
      return NextResponse.json(;
}
        { error: '缺少必要参数: userId, incidentType, title' },
        { status: 400 }
      );
    }

    // 计算风险评分（如果未提供）
    const riskScore = body.riskScore || calculateRiskScore(severity, incidentType);

    // 创建风险事件
    const incident = await RiskControlService.createRiskIncident({
      userId,
      incidentType,
      severity: severity || 'medium',
      riskScore,
      title,
      description: description || '',
      triggerConditions: triggerConditions || {},
      metadata: metadata || {}
    });

    // 如果指定了自动行动，立即执行
    if (autoActionTaken) {
      await RiskControlService.executeAutomaticAction(incident.id, [autoActionTaken]);
    }

    const response = {
      success: true,
      data: {
        incident: {
          ...incident,
          duration: 0,
          actions: [],
          notifications: [],
          priority: calculateEventPriority(incident),
          canResolve: true,
          canEscalate: incident.severity !== 'critical'
        }
      },
      message: '风险事件创建成功'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('创建风险事件错误:', error);
    return NextResponse.json(;
      {
        error: '创建风险事件失败',
        message: '请检查参数格式并重试'
      },
      { status: 500 }
    );
  }
}

// PUT /api/risk/events - 更新风险事件状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      incidentId,
      status,
      assignedTo,
      resolutionNotes,
      adminId
    } = body;

    if (!incidentId || !status) {
      return NextResponse.json(;
        { error: '缺少必要参数: incidentId, status' },
        { status: 400 }
      );
}

    // 更新事件状态
    const updatedIncident = await updateIncidentStatus(;
      incidentId,
      status,
      assignedTo,
      resolutionNotes,
      adminId
    );

    const response = {
      success: true,
      data: {
        incident: updatedIncident
      },
      message: '风险事件状态更新成功'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('更新风险事件错误:', error);
    return NextResponse.json(;
      {
        error: '更新风险事件失败',
        message: '请检查事件ID和状态是否正确'
      },
      { status: 500 }
    );
  }
}

// 辅助函数：获取风险处理记录
async function getRiskActionsForIncident(incidentId: string) {
  try {
    // 这里需要实际查询数据库
    // 为了演示，返回模拟数据
    return [];
  } catch (error) {
    console.error('获取风险处理记录失败:', error);
    return [];
  }
}

// 辅助函数：获取通知记录
async function getNotificationsForIncident(incidentId: string) {
  try {
    // 这里需要实际查询数据库
    // 为了演示，返回模拟数据
    return [];
  } catch (error) {
    console.error('获取通知记录失败:', error);
    return [];
  }
}

// 辅助函数：计算事件优先级
function calculateEventPriority(incident: any): number {
  const severityWeights = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25
  };

  const statusWeights = {
    open: 50,
    investigating: 30,
    resolved: 10,
    false_positive: 5,
    escalated: 80
  };

  const baseWeight = severityWeights[incident.severity as keyof typeof severityWeights] || 25;
  const statusWeight = statusWeights[incident.status as keyof typeof statusWeights] || 0;
  
  // 新事件优先级更高
  const hoursOld = (Date.now() - new Date(incident.created_at).getTime()) / (1000 * 60 * 60);
  const ageWeight = Math.max(0, 10 - hoursOld);

  return Math.min(100, baseWeight + statusWeight + ageWeight);
}

// 辅助函数：生成统计信息
async function generateIncidentStats(where: any) {
  try {
    // 这里需要实际查询数据库统计信息
    // 为了演示，返回模拟数据
    return {
      total: 150,
      bySeverity: {
        critical: 5,
        high: 25,
        medium: 80,
        low: 40
      },
      byStatus: {
        open: 15,
        investigating: 30,
        resolved: 95,
        false_positive: 8,
        escalated: 2
      },
      byType: {
        login: 45,
        transaction: 65,
        registration: 20,
        withdrawal: 12,
        suspicious_session: 8
      },
      avgResolutionTime: 4.2, // 小时
      trends: {
        last24h: { total: 25, change: '+15%' },
        last7d: { total: 180, change: '-5%' },
        last30d: { total: 750, change: '+2%' }
      }
    };
  } catch (error) {
    console.error('生成统计信息失败:', error);
    return null;
  }
}

// 辅助函数：计算风险评分
function calculateRiskScore(severity: string, incidentType: string): number {
  const severityScores = {
    critical: 90,
    high: 70,
    medium: 50,
    low: 25
  };

  const typeMultipliers = {
    login: 1.0,
    transaction: 1.2,
    registration: 0.8,
    withdrawal: 1.1,
    suspicious_session: 1.3
  };

  const baseScore = severityScores[severity as keyof typeof severityScores] || 50;
  const multiplier = typeMultipliers[incidentType as keyof typeof typeMultipliers] || 1.0;

  return Math.round(baseScore * multiplier);
}

// 辅助函数：更新事件状态
async function updateIncidentStatus(
  incidentId: string,
  status: string,
  assignedTo?: string,
  resolutionNotes?: string,
  adminId?: string
) {
  try {
    // 这里需要实际更新数据库
    // 为了演示，返回模拟更新的事件
    return {
      id: incidentId,
      status,
      assignedTo,
      resolutionNotes,
      resolvedAt: status === 'resolved' ? new Date() : null,
      resolvedBy: adminId,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('更新事件状态失败:', error);
    throw error;
  }
}
}}