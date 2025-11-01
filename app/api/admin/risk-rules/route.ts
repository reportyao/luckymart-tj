import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin/permissions/AdminPermissions';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

const withReadPermission =  AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.stats.read });

const withWritePermission =  AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.stats.read });

// 模拟风控规则数据
const mockRiskRules = [
  {
    id: 'RR001',
    name: '异常登录检测',
    description: '检测用户从异常地理位置或设备登录',
    category: 'login',
    riskType: '异常登录',
    condition: 'IP地址不在常用范围内 或 设备指纹不匹配',
    threshold: 70,
    action: 'alert',
    isActive: true,
    createdAt: '2025-10-01T10:00:00Z',
    lastModified: '2025-10-30T14:30:00Z',
    executionCount: 156,
    successRate: 92.5
  },
  {
    id: 'RR002',
    name: '大额交易监控',
    description: '监控单笔交易金额异常的行为',
    category: 'transaction',
    riskType: '大额交易',
    condition: '单笔交易金额 > 用户历史平均值的3倍',
    threshold: 80,
    action: 'review',
    isActive: true,
    createdAt: '2025-10-02T09:00:00Z',
    lastModified: '2025-10-29T16:20:00Z',
    executionCount: 89,
    successRate: 87.2
  },
  {
    id: 'RR003',
    name: '频繁操作检测',
    description: '检测用户在短时间内进行大量操作',
    category: 'behavior',
    riskType: '频繁操作',
    condition: '5分钟内操作次数 > 20次',
    threshold: 85,
    action: 'block',
    isActive: true,
    createdAt: '2025-10-03T11:30:00Z',
    lastModified: '2025-10-28T10:15:00Z',
    executionCount: 234,
    successRate: 95.8
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `risk-rules_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('risk-rules_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('risk-rules_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
    ];

    export async function GET(request: NextRequest) {
      return withReadPermission(async (request: any, admin: any) => {
      try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');
        const search = searchParams.get('search');

        // 筛选数据
        let filteredRules = mockRiskRules;

        if (category && category !== 'all') {
          filteredRules = filteredRules.filter((rule : any) => rule.category === category);
        }

        if (isActive !== null && isActive !== 'all') {
          const active = isActive === 'active';
          filteredRules = filteredRules.filter((rule : any) => rule.isActive === active);
        }

        if (search) {
          filteredRules = filteredRules.filter((rule : any) => 
            rule.name.toLowerCase().includes(search.toLowerCase()) ||
            rule.description.toLowerCase().includes(search.toLowerCase())
          );
        }

        // 分页
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedRules = filteredRules.slice(startIndex, endIndex);

        return NextResponse.json({
          success: true,
          data: {
            rules: paginatedRules,
            total: filteredRules.length,
            page,
            limit,
            totalPages: Math.ceil(filteredRules.length / limit)
          }
        });
      } catch (error) {
        logger.error("API Error", error as Error, {
          requestId,
          endpoint: request.url
        });'获取风控规则失败:', error);
        return NextResponse.json(
          { success: false, error: '获取数据失败' },
          { status: 500 }
        );
      }
}
}

export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
  try {
    const body = await request.json();
    const { name, description, category, riskType, condition, threshold, action, isActive } = body;

    if (!name || !description || !riskType || !condition || threshold === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const newRule = {
      id: `RR${String(mockRiskRules.length + 1).padStart(3, '0')}`,
      name,
      description,
      category: category || 'login',
      riskType,
      condition,
      threshold,
      action: action || 'alert',
      isActive: isActive !== false,
      createdAt: now,
      lastModified: now,
      executionCount: 0,
      successRate: 0
    };

    mockRiskRules.push(newRule);

    return NextResponse.json({
      success: true,
      data: newRule,
      message: '风控规则创建成功'
    });
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'创建风控规则失败:', error);
    return NextResponse.json(
      { success: false, error: '创建失败' },
      { status: 500 }
    );
  }
  })(request);
}

export async function PATCH(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
  try {
    const body = await request.json();
    const { ruleId, updates } = body;

    if (!ruleId || !updates) {
      return NextResponse.json(
        { success: false, error: '缺少必需参数' },
        { status: 400 }
      );
    }

    const ruleIndex = mockRiskRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return NextResponse.json(
        { success: false, error: '规则不存在' },
        { status: 404 }
      );
    }

    const updatedRule = {
      ...mockRiskRules[ruleIndex],
      ...updates,
      lastModified: new Date().toISOString()
    };

    mockRiskRules[ruleIndex] = updatedRule;

    return NextResponse.json({
      success: true,
      data: updatedRule,
      message: '风控规则更新成功'
    });
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'更新风控规则失败:', error);
    return NextResponse.json(
      { success: false, error: '更新失败' },
      { status: 500 }
    );
  }
  })(request);
}

export async function DELETE(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: '缺少规则ID' },
        { status: 400 }
      );
    }

    const ruleIndex = mockRiskRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return NextResponse.json(
        { success: false, error: '规则不存在' },
        { status: 404 }
      );
    }

    mockRiskRules.splice(ruleIndex, 1);

    return NextResponse.json({
      success: true,
      message: '风控规则删除成功'
    });
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'删除风控规则失败:', error);
    return NextResponse.json(
      { success: false, error: '删除失败' },
      { status: 500 }
    );
  }
  })(request);
}