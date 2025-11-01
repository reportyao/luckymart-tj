import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.features.read() });
const withWritePermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.features.write() });

// 缓存功能开关以提高性能
let featuresCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取缓存的功能开关
async function getCachedFeatures() {
  const now = Date.now();
  if (featuresCache && (now - featuresCache.timestamp) < CACHE_DURATION) {
    return featuresCache.data;
  }
  return null;
}

// 更新缓存
function updateCache(features: any) {
  featuresCache = {
    data: features,
    timestamp: Date.now()
  };
}

// 清除缓存
function clearCache() {
  featuresCache = null;
}

// 获取所有功能开关
async function getAllFeatureFlags() {
  const cached = await getCachedFeatures();
  if (cached) return cached;

  try {
    const flags = await prisma.$queryRaw`
      SELECT * FROM feature_flags WHERE is_active = true ORDER BY category, priority DESC, flag_name
    `;
    
    updateCache(flags);
    return flags;
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取功能开关失败:', error);
    throw error;
  }
}

// 创建功能开关
async function createFeatureFlag(data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      INSERT INTO feature_flags (
        flag_name, flag_key, name_zh, name_en, name_ru,
        description_zh, description_en, description_ru,
        is_enabled, enabled_for_all, user_whitelist, user_blacklist,
        rollout_percentage, target_version, min_version, max_version,
        experiment_group, control_group, test_duration_hours,
        start_time, end_time, timezone, category, tags,
        is_active, priority, operator_id, change_reason
      ) VALUES (
        ${data.flag_name}, ${data.flag_key}, ${data.name_zh}, ${data.name_en}, ${data.name_ru},
        ${data.description_zh}, ${data.description_en}, ${data.description_ru},
        ${data.is_enabled || false}, ${data.enabled_for_all || false}, ${data.user_whitelist}, ${data.user_blacklist},
        ${data.rollout_percentage || 0.0}, ${data.target_version}, ${data.min_version}, ${data.max_version},
        ${data.experiment_group}, ${data.control_group}, ${data.test_duration_hours},
        ${data.start_time ? new Date(data.start_time) : null}, 
        ${data.end_time ? new Date(data.end_time) : null}, 
        ${data.timezone || 'UTC'}, ${data.category}, ${data.tags},
        ${data.is_active !== undefined ? data.is_active : true}, ${data.priority || 0},
        ${operatorId}, ${data.change_reason}
      ) RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'创建功能开关失败:', error);
    throw error;
  }
}

// 更新功能开关
async function updateFeatureFlag(id: string, data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      UPDATE feature_flags SET
        flag_name = ${data.flag_name},
        flag_key = ${data.flag_key},
        name_zh = ${data.name_zh},
        name_en = ${data.name_en},
        name_ru = ${data.name_ru},
        description_zh = ${data.description_zh},
        description_en = ${data.description_en},
        description_ru = ${data.description_ru},
        is_enabled = ${data.is_enabled},
        enabled_for_all = ${data.enabled_for_all},
        user_whitelist = ${data.user_whitelist},
        user_blacklist = ${data.user_blacklist},
        rollout_percentage = ${data.rollout_percentage},
        target_version = ${data.target_version},
        min_version = ${data.min_version},
        max_version = ${data.max_version},
        experiment_group = ${data.experiment_group},
        control_group = ${data.control_group},
        test_duration_hours = ${data.test_duration_hours},
        start_time = ${data.start_time ? new Date(data.start_time) : null},
        end_time = ${data.end_time ? new Date(data.end_time) : null},
        timezone = ${data.timezone},
        category = ${data.category},
        tags = ${data.tags},
        is_active = ${data.is_active},
        priority = ${data.priority},
        operator_id = ${operatorId},
        change_reason = ${data.change_reason},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'更新功能开关失败:', error);
    throw error;
  }
}

// 删除功能开关（软删除）
async function deleteFeatureFlag(id: string, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      UPDATE feature_flags SET
        is_active = false,
        operator_id = ${operatorId},
        change_reason = '软删除功能开关',
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'删除功能开关失败:', error);
    throw error;
  }
}

// 切换功能开关状态
async function toggleFeatureFlag(id: string, enabled: boolean, operatorId: string, reason?: string) {
  try {
    const result = await prisma.$queryRaw`
      UPDATE feature_flags SET
        is_enabled = ${enabled},
        operator_id = ${operatorId},
        change_reason = ${reason || (enabled ? '启用功能' : '禁用功能')},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'切换功能开关失败:', error);
    throw error;
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `features_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('features_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('features_route.ts request failed', error as Error, {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
});

async function handleGET(request: NextRequest) {
    }

    export async function GET(request: NextRequest) {
      return withReadPermission(async (request: any, admin: any) => {
        const url = new URL(request.url);
        const category = url.searchParams.get('category');
        const isEnabled = url.searchParams.get('is_enabled');
        const isActive = url.searchParams.get('is_active');
        const flagKey = url.searchParams.get('flag_key');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM feature_flags WHERE 1=1`;
        const params: any[] = [];

        if (category) {
          query += ` AND category = $${params.length + 1}`;
          params.push(category);
}

    if (isEnabled !== null) {
      query += ` AND is_enabled = $${params.length + 1}`;
      params.push(isEnabled === 'true');
    }

    if (isActive !== null) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(isActive === 'true');
    }

    if (flagKey) {
      query += ` AND flag_key = $${params.length + 1}`;
      params.push(flagKey);
    }

    query += ` ORDER BY category, priority DESC, flag_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const flags = await prisma.$queryRawUnsafe(query, ...params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM feature_flags WHERE 1=1`;
    const countParams: any[] = [];

    if (category) {
      countQuery += ` AND category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (isEnabled !== null) {
      countQuery += ` AND is_enabled = $${countParams.length + 1}`;
      countParams.push(isEnabled === 'true');
    }

    if (isActive !== null) {
      countQuery += ` AND is_active = $${countParams.length + 1}`;
      countParams.push(isActive === 'true');
    }

    if (flagKey) {
      countQuery += ` AND flag_key = $${countParams.length + 1}`;
      countParams.push(flagKey);
    }

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
    const total = parseInt(countResult[0].total);

    return NextResponse.json({ 
      success: true,
      data: flags,
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
  return withWritePermission(async (request: any, admin: any) => {
    const data = await request.json();

    // 验证必填字段
    if (!data.flag_name || !data.flag_key || !data.category) {
      return NextResponse.json({ 
        success: false,
        error: '缺少必填字段：flag_name, flag_key, category' 
      }, { status: 400 });
    }

    // 验证推出百分比
    if (data.rollout_percentage !== undefined) {
      if (data.rollout_percentage < 0 || data.rollout_percentage > 100) {
        return NextResponse.json({ 
          success: false,
          error: '推出百分比必须在0-100之间' 
        }, { status: 400 });
      }
    }

    const flag = await createFeatureFlag(data, admin.username);

    return NextResponse.json({
      success: true,
      message: '功能开关创建成功',
      data: flag
    }, { status: 201 });
  })(request);
}

export async function PUT(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: '缺少功能开关ID' 
      }, { status: 400 });
    }

    const flag = await updateFeatureFlag(id, data, admin.username);

    return NextResponse.json({
      success: true,
      message: '功能开关更新成功',
      data: flag
    });
  })(request);
}

export async function DELETE(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: '缺少功能开关ID' 
      }, { status: 400 });
    }

    await deleteFeatureFlag(id, admin.username);

    return NextResponse.json({
      success: true,
      message: '功能开关删除成功'
    });
  })(request);
}

// PATCH方法用于快速切换功能开关状态
export async function PATCH(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const data = await request.json();
    const { id, enabled, reason } = data;

    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        success: false,
        error: '缺少必需参数：id, enabled' 
      }, { status: 400 });
    }

    const flag = await toggleFeatureFlag(id, enabled, admin.username, reason);

    return NextResponse.json({
      success: true,
      message: `功能开关${enabled ? '启用' : '禁用'}成功`,
      data: flag
    });
  })(request);
}