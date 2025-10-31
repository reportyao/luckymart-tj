import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware([
  AdminPermissions.stats.read
]);

const withWritePermission = AdminPermissionManager.createPermissionMiddleware([
  AdminPermissions.stats.read
]);

// 模拟风险事件数据
const mockRiskEvents = [
  {
    id: 'RE001',
    userId: 'U1001',
    userName: '张三',
    eventType: '异常登录',
    riskLevel: 'high',
    status: 'pending',
    description: '用户从非常用设备登录，IP地址异常',
    timestamp: '2025-10-31T15:30:00Z',
    riskScore: 85
  },
  {
    id: 'RE002',
    userId: 'U1002',
    userName: '李四',
    eventType: '大额交易',
    riskLevel: 'medium',
    status: 'approved',
    description: '单笔交易金额超过用户历史平均值的3倍',
    timestamp: '2025-10-31T14:15:00Z',
    riskScore: 72
  },
  {
    id: 'RE003',
    userId: 'U1003',
    userName: '王五',
    eventType: '频繁操作',
    riskLevel: 'critical',
    status: 'manual_review',
    description: '短时间内进行大量账户操作，疑似机器人行为',
    timestamp: '2025-10-31T13:45:00Z',
    riskScore: 95
  }
];

export async function GET(request: NextRequest) {
  return withReadPermission(async (request, admin) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const riskLevel = searchParams.get('riskLevel');
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const search = searchParams.get('search');

    // 筛选数据
    let filteredEvents = mockRiskEvents;

    if (riskLevel && riskLevel !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.riskLevel === riskLevel);
    }

    if (status && status !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.status === status);
    }

    if (eventType && eventType !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.eventType === eventType);
    }

    if (search) {
      filteredEvents = filteredEvents.filter(event => 
        event.userName.toLowerCase().includes(search.toLowerCase()) ||
        event.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        events: paginatedEvents,
        total: filteredEvents.length,
        page,
        limit,
        totalPages: Math.ceil(filteredEvents.length / limit)
      }
    });
  } catch (error) {
    console.error('获取风险事件失败:', error);
    return NextResponse.json(
      { success: false, error: '获取数据失败' },
      { status: 500 }
    );
  }
  })(request);
}

export async function POST(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
  try {
    const body = await request.json();
    const { userId, eventType, riskLevel, description, riskScore } = body;

    if (!userId || !eventType || !description || riskScore === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
    }

    const newEvent = {
      id: `RE${String(mockRiskEvents.length + 1).padStart(3, '0')}`,
      userId,
      userName: `用户${userId}`,
      eventType,
      riskLevel,
      status: 'pending',
      description,
      timestamp: new Date().toISOString(),
      riskScore
    };

    mockRiskEvents.push(newEvent);

    return NextResponse.json({
      success: true,
      data: newEvent,
      message: '风险事件创建成功'
    });
  } catch (error) {
    console.error('创建风险事件失败:', error);
    return NextResponse.json(
      { success: false, error: '创建失败' },
      { status: 500 }
    );
  }
  })(request);
}