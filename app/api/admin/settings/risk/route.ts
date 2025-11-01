import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.risk.read() });
const withWritePermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.risk.write() });

// 缓存风控配置以提高性能
let riskCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存;

// 获取缓存的风控配置
async function getCachedRiskConfigs() {
  const now = Date.now();
  if (riskCache && (now - riskCache.timestamp) < CACHE_DURATION) {
    return riskCache.data;
  }
  return null;
}

// 更新缓存
function updateCache(riskConfigs: any) {
  riskCache = {
    data: riskConfigs,
    timestamp: Date.now()
  };
}

// 清除缓存
function clearCache() {
  riskCache = null;
}

// 获取所有风控配置
async function getAllRiskConfigs() {
  const cached = await getCachedRiskConfigs();
  if (cached) return cached; {

  try {
    const configs = await prisma.$queryRaw`;
      SELECT * FROM risk_configs WHERE is_active = true ORDER BY category, priority DESC, config_name
    `;
    
    updateCache(configs);
    return configs;
  }
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取风控配置失败:', error);
    throw error;
  }
}

// 创建风控配置
async function createRiskConfig(data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`;
      INSERT INTO risk_configs (
        config_name, category, risk_type, threshold_value,
        max_attempts, time_window_minutes, min_amount, max_amount,
        geographic_restrictions, device_restrictions, auto_action,
        action_duration_minutes, notification_required, escalation_level,
        weight_score, is_active, priority, operator_id, change_reason
      ) VALUES (
        ${data.config_name}, ${data.category}, ${data.risk_type}, ${data.threshold_value},
        ${data.max_attempts || 3}, ${data.time_window_minutes || 60}, ${data.min_amount}, ${data.max_amount},
        ${data.geographic_restrictions}, ${data.device_restrictions}, ${data.auto_action},
        ${data.action_duration_minutes || 60}, ${data.notification_required || false}, ${data.escalation_level || 1},
        ${data.weight_score || 1.0}, ${data.is_active !== undefined ? data.is_active : true}, ${data.priority || 0},
        ${operatorId}, ${data.change_reason}
      ) RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'创建风控配置失败:', error);
    throw error;
  }
}

// 更新风控配置
async function updateRiskConfig(id: string, data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`;
      UPDATE risk_configs SET
        config_name = ${data.config_name},
        category = ${data.category},
        risk_type = ${data.risk_type},
        threshold_value = ${data.threshold_value},
        max_attempts = ${data.max_attempts},
        time_window_minutes = ${data.time_window_minutes},
        min_amount = ${data.min_amount},
        max_amount = ${data.max_amount},
        geographic_restrictions = ${data.geographic_restrictions},
        device_restrictions = ${data.device_restrictions},
        auto_action = ${data.auto_action},
        action_duration_minutes = ${data.action_duration_minutes},
        notification_required = ${data.notification_required},
        escalation_level = ${data.escalation_level},
        weight_score = ${data.weight_score},
        is_active = ${data.is_active},
        priority = ${data.priority},
        operator_id = ${operatorId},
        change_reason = ${data.change_reason},
        updated_at : NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'更新风控配置失败:', error);
    throw error;
  }
}

// 删除风控配置（软删除）
async function deleteRiskConfig(id: string, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`;
      UPDATE risk_configs SET
        is_active = false,
        operator_id = ${operatorId},
        change_reason = '软删除风控配置',
        updated_at : NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'删除风控配置失败:', error);
    throw error;
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `risk_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('risk_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('risk_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
}
  }
});

async function handleGET(request: NextRequest) {
    }

    export async function GET(request: NextRequest) {
      return withReadPermission(async (request: any: any, admin: any: any) => {
        const url = new URL(request.url);
        const category = url.searchParams.get('category');
        const riskType = url.searchParams.get('risk_type');
        const autoAction = url.searchParams.get('auto_action');
        const isActive = url.searchParams.get('is_active');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM risk_configs WHERE 1=1`;
        const params: any[] = [];

        if (category) {
          query += ` AND category = $${params.length + 1}`;
          params.push(category);
}

    if (riskType) {
      query += ` AND risk_type = $${params.length + 1}`;
      params.push(riskType);
    }

    if (autoAction) {
      query += ` AND auto_action = $${params.length + 1}`;
      params.push(autoAction);
    }

    if (isActive !== null) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY category, priority DESC, config_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const configs = await prisma.$queryRawUnsafe(query, ...params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM risk_configs WHERE 1=1`;
    const countParams: any[] = [];

    if (category) {
      countQuery += ` AND category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (riskType) {
      countQuery += ` AND risk_type = $${countParams.length + 1}`;
      countParams.push(riskType);
    }

    if (autoAction) {
      countQuery += ` AND auto_action = $${countParams.length + 1}`;
      countParams.push(autoAction);
    }

    if (isActive !== null) {
      countQuery += ` AND is_active = $${countParams.length + 1}`;
      countParams.push(isActive === 'true');
    }

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
    const total = parseInt((countResult?.0 ?? null).total);

    return NextResponse.json({ 
  }
      success: true,
      data: configs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
    }
    });
  })(request);
}

export async function POST(request: NextRequest) {
  return withWritePermission(async (request: any: any, admin: any: any) => {
    const data = await request.json();

    // 验证必填字段
    if (!data.config_name || !data.category || !data.risk_type) {
      return NextResponse.json({ 
}
        success: false,
        error: '缺少必填字段：config_name, category, risk_type' 
      }, { status: 400 });
    }

    // 验证风险类型
    const validRiskTypes = ['threshold', 'frequency', 'amount', 'geographic'];
    if (!validRiskTypes.includes(data.risk_type)) {
      return NextResponse.json({ 
        success: false,
        error: '无效的风险类型' 
      }, { status: 400 });
    }

    // 验证自动处理动作
    const validActions = ['block', 'review', 'alert', 'limit'];
    if (data.auto_action && !validActions.includes(data.auto_action)) {
      return NextResponse.json({ 
        success: false,
        error: '无效的自动处理动作' 
      }, { status: 400 });
    }

    // 验证升级级别
    if (data.escalation_level && (data.escalation_level < 1 || data.escalation_level > 5)) {
      return NextResponse.json({ 
        success: false,
        error: '升级级别必须在1-5之间' 
      }, { status: 400 });
    }

    // 验证权重分数
    if (data.weight_score && (data.weight_score < 0.1 || data.weight_score > 5.0)) {
      return NextResponse.json({ 
        success: false,
        error: '权重分数必须在0.1-5.0之间' 
      }, { status: 400 });
    }

    const config = await createRiskConfig(data, admin.username);

    return NextResponse.json({
      success: true,
      message: '风控参数创建成功',
      data: config
    }, { status: 201 });
  })(request);
}

export async function PUT(request: NextRequest) {
  return withWritePermission(async (request: any: any, admin: any: any) => {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: '缺少风控配置ID' 
      }, { status: 400 });
}

    const config = await updateRiskConfig(id, data, admin.username);

    return NextResponse.json({
      success: true,
      message: '风控参数更新成功',
      data: config
    });
  })(request);
}

export async function DELETE(request: NextRequest) {
  return withWritePermission(async (request: any: any, admin: any: any) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: '缺少风控配置ID' 
      }, { status: 400 });
}

    await deleteRiskConfig(id, admin.username);

    return NextResponse.json({
      success: true,
      message: '风控参数删除成功'
    });
  })(request);
}