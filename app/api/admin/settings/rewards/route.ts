import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.rewards.read() });
const withWritePermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.rewards.write() });

// 缓存奖励配置以提高性能
let rewardsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取缓存的奖励配置
async function getCachedRewards() {
  const now = Date.now();
  if (rewardsCache && (now - rewardsCache.timestamp) < CACHE_DURATION) {
    return rewardsCache.data;
  }
  return null;
}

// 更新缓存
function updateCache(rewards: any) {
  rewardsCache = {
    data: rewards,
    timestamp: Date.now()
  };
}

// 清除缓存
function clearCache() {
  rewardsCache = null;
}

// 获取所有奖励配置
async function getAllRewardConfigs() {
  const cached = await getCachedRewards();
  if (cached) return cached;

  try {
    const rewards = await prisma.$queryRaw`
      SELECT * FROM reward_configs WHERE is_active = true ORDER BY category, priority DESC, config_name
    `;
    
    updateCache(rewards);
    return rewards;
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取奖励配置失败:', error);
    throw error;
  }
}

// 创建奖励配置
async function createRewardConfig(data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      INSERT INTO reward_configs (
        config_name, category, name_zh, name_en, name_ru,
        description_zh, description_en, description_ru,
        reward_type, reward_amount, reward_percentage,
        min_threshold, max_amount, daily_limit, total_limit, valid_days,
        is_active, priority, start_time, end_time, timezone,
        operator_id, change_reason
      ) VALUES (
        ${data.config_name}, ${data.category}, ${data.name_zh}, ${data.name_en}, ${data.name_ru},
        ${data.description_zh}, ${data.description_en}, ${data.description_ru},
        ${data.reward_type}, ${data.reward_amount}, ${data.reward_percentage},
        ${data.min_threshold}, ${data.max_amount}, ${data.daily_limit}, ${data.total_limit}, ${data.valid_days},
        ${data.is_active !== undefined ? data.is_active : true}, ${data.priority || 0}, 
        ${data.start_time ? new Date(data.start_time) : null}, 
        ${data.end_time ? new Date(data.end_time) : null}, 
        ${data.timezone || 'UTC'},
        ${operatorId}, ${data.change_reason}
      ) RETURNING *
    `;
    
    clearCache();
    return result[0];
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'创建奖励配置失败:', error);
    throw error;
  }
}

// 更新奖励配置
async function updateRewardConfig(id: string, data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      UPDATE reward_configs SET
        config_name = ${data.config_name},
        category = ${data.category},
        name_zh = ${data.name_zh},
        name_en = ${data.name_en},
        name_ru = ${data.name_ru},
        description_zh = ${data.description_zh},
        description_en = ${data.description_en},
        description_ru = ${data.description_ru},
        reward_type = ${data.reward_type},
        reward_amount = ${data.reward_amount},
        reward_percentage = ${data.reward_percentage},
        min_threshold = ${data.min_threshold},
        max_amount = ${data.max_amount},
        daily_limit = ${data.daily_limit},
        total_limit = ${data.total_limit},
        valid_days = ${data.valid_days},
        is_active = ${data.is_active},
        priority = ${data.priority},
        start_time = ${data.start_time ? new Date(data.start_time) : null},
        end_time = ${data.end_time ? new Date(data.end_time) : null},
        timezone = ${data.timezone},
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
    });'更新奖励配置失败:', error);
    throw error;
  }
}

// 删除奖励配置（软删除）
async function deleteRewardConfig(id: string, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      UPDATE reward_configs SET
        is_active = false,
        operator_id = ${operatorId},
        change_reason = '软删除奖励配置',
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
    });'删除奖励配置失败:', error);
    throw error;
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `rewards_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('rewards_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('rewards_route.ts request failed', error as Error, {
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
        const isActive = url.searchParams.get('is_active');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM reward_configs WHERE 1=1`;
        const params: any[] = [];

        if (category) {
          query += ` AND category = $${params.length + 1}`;
          params.push(category);
}

    if (isActive !== null) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY category, priority DESC, config_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const rewards = await prisma.$queryRawUnsafe(query, ...params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM reward_configs WHERE 1=1`;
    const countParams: any[] = [];

    if (category) {
      countQuery += ` AND category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (isActive !== null) {
      countQuery += ` AND is_active = $${countParams.length + 1}`;
      countParams.push(isActive === 'true');
    }

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
    const total = parseInt(countResult[0].total);

    return NextResponse.json({ 
      success: true,
      data: rewards,
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
    if (!data.config_name || !data.category || !data.reward_type) {
      return NextResponse.json({ 
        success: false,
        error: '缺少必填字段：config_name, category, reward_type' 
      }, { status: 400 });
    }

    // 验证奖励类型
    const validRewardTypes = ['coins', 'balance', 'vip_days', 'percentage'];
    if (!validRewardTypes.includes(data.reward_type)) {
      return NextResponse.json({ 
        success: false,
        error: '无效的奖励类型' 
      }, { status: 400 });
    }

    const reward = await createRewardConfig(data, admin.username);

    return NextResponse.json({
      success: true,
      message: '奖励参数创建成功',
      data: reward
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
        error: '缺少奖励配置ID' 
      }, { status: 400 });
    }

    const reward = await updateRewardConfig(id, data, admin.username);

    return NextResponse.json({
      success: true,
      message: '奖励参数更新成功',
      data: reward
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
        error: '缺少奖励配置ID' 
      }, { status: 400 });
    }

    await deleteRewardConfig(id, admin.username);

    return NextResponse.json({
      success: true,
      message: '奖励参数删除成功'
    });
  })(request);
}