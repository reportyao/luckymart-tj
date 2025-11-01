import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin/permissions/AdminPermissionManager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware([;
  AdminPermissions.stats.read
]);

const withWritePermission = AdminPermissionManager.createPermissionMiddleware([;
  AdminPermissions.stats.read
]);

// 模拟风险用户数据
const mockRiskUsers = [;
  {
    id: 'U1001',
    userName: '张三',
    email: 'zhangsan@example.com',
    totalScore: 85,
    riskLevel: 'high',
    accountStatus: 'active',
    registrationDate: '2025-09-15T10:00:00Z',
    lastLoginDate: '2025-10-31T14:30:00Z',
    recentActivity: '异常登录行为',
    totalEvents: 12,
    riskHistory: [
      { date: '2025-10-31T15:30:00Z', event: '异常登录', score: 85 },
      { date: '2025-10-30T09:15:00Z', event: 'IP地理位置异常', score: 65 },
      { date: '2025-10-29T16:45:00Z', event: '设备指纹异常', score: 72 }
    ]
  },
  {
    id: 'U1002',
    userName: '李四',
    email: 'lisi@example.com',
    totalScore: 45,
    riskLevel: 'medium',
    accountStatus: 'active',
    registrationDate: '2025-08-20T08:30:00Z',
    lastLoginDate: '2025-10-31T12:00:00Z',
    recentActivity: '正常',
    totalEvents: 5,
    riskHistory: [
      { date: '2025-10-28T14:20:00Z', event: '大额交易', score: 45 },
      { date: '2025-10-25T11:10:00Z', event: '频繁操作', score: 38 }
    ]
  },
  {
    id: 'U1003',
    userName: '王五',
    email: 'wangwu@example.com',
    totalScore: 95,
    riskLevel: 'critical',
    accountStatus: 'frozen',
    registrationDate: '2025-07-10T14:20:00Z',
    lastLoginDate: '2025-10-31T08:45:00Z',
    recentActivity: '频繁异常操作',
    totalEvents: 25,
    riskHistory: [
      { date: '2025-10-31T13:45:00Z', event: '频繁操作', score: 95 },
      { date: '2025-10-30T22:30:00Z', event: '异常登录', score: 88 },
      { date: '2025-10-29T19:20:00Z', event: '设备指纹异常', score: 90 }
    ]
  }
];

export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const riskLevel = searchParams.get('riskLevel');
    const accountStatus = searchParams.get('accountStatus');
    const search = searchParams.get('search');

    // 筛选数据
    let filteredUsers = mockRiskUsers;

    if (riskLevel && riskLevel !== 'all') {
      filteredUsers = filteredUsers.filter((user : any) => user.riskLevel === riskLevel);
}

    if (accountStatus && accountStatus !== 'all') {
      filteredUsers = filteredUsers.filter((user : any) => user.accountStatus === accountStatus);
    }

    if (search) {
      filteredUsers = filteredUsers.filter((user : any) => 
        user.userName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('获取风险用户失败:', error);
    return NextResponse.json(;
      { success: false, error: '获取数据失败' },
      { status: 500 }
    );
  }
  })(request);
}

export async function PATCH(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(;
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
}

    const userIndex = mockRiskUsers.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(;
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    let newStatus: 'active' | 'frozen' | 'limited' | 'banned';
    switch (action) {
      case 'freeze':
        newStatus = 'frozen';
        break;
      case 'unfreeze':
        newStatus = 'active';
        break;
      case 'limit':
        newStatus = 'limited';
        break;
      case 'ban':
        newStatus = 'banned';
        break;
      default:
        return NextResponse.json(;
          { success: false, error: '无效的操作' },
          { status: 400 }
        );
    }

    (mockRiskUsers?.userIndex ?? null).accountStatus = newStatus;

    return NextResponse.json({
      success: true,
      data: mockRiskUsers[userIndex],
      message: '用户状态更新成功'
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    return NextResponse.json(;
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
  })(request);
}