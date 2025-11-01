import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { prisma } from '@/lib/prisma';
import { getLogger } from '@/lib/logger';
import { withErrorHandling } from '@/lib/middleware';
import { getLogger } from '@/lib/logger';
import { respond } from '@/lib/responses';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.operations.read() });
const withWritePermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.operations.write() });

// 缓存运营配置以提高性能
let operationCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取缓存的运营配置
async function getCachedOperationConfigs() {
  const now = Date.now();
  if (operationCache && (now - operationCache.timestamp) < CACHE_DURATION) {
    return operationCache.data;
  }
  return null;
}

// 更新缓存
function updateCache(operationConfigs: any) {
  operationCache = {
    data: operationConfigs,
    timestamp: Date.now()
  };
}

// 清除缓存
function clearCache() {
  operationCache = null;
}

// 获取所有运营配置
async function getAllOperationConfigs() {
  const cached = await getCachedOperationConfigs();
  if (cached) return cached;

  try {
    const configs = await prisma.$queryRaw`
      SELECT * FROM operation_configs WHERE is_active = true ORDER BY category, priority DESC, config_name
    `;
    
    updateCache(configs);
    return configs;
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'获取运营配置失败:', error);
    throw error;
  }
}

// 创建运营配置
async function createOperationConfig(data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      INSERT INTO operation_configs (
        config_name, category, name_zh, name_en, name_ru,
        description_zh, description_en, description_ru,
        discount_percentage, discount_amount, promo_code, usage_limit,
        min_purchase_amount, max_discount_amount, daily_limit, monthly_limit,
        user_level_restrictions, platform_fee_rate, minimum_fee, maximum_fee,
        fee_calculation_method, target_audience, channel_restrictions,
        geographic_targeting, start_time, end_time, timezone,
        is_active, priority, operator_id, change_reason
      ) VALUES (
        ${data.config_name}, ${data.category}, ${data.name_zh}, ${data.name_en}, ${data.name_ru},
        ${data.description_zh}, ${data.description_en}, ${data.description_ru},
        ${data.discount_percentage}, ${data.discount_amount}, ${data.promo_code}, ${data.usage_limit},
        ${data.min_purchase_amount}, ${data.max_discount_amount}, ${data.daily_limit}, ${data.monthly_limit},
        ${data.user_level_restrictions}, ${data.platform_fee_rate}, ${data.minimum_fee}, ${data.maximum_fee},
        ${data.fee_calculation_method}, ${data.target_audience}, ${data.channel_restrictions},
        ${data.geographic_targeting}, ${data.start_time ? new Date(data.start_time) : null}, 
        ${data.end_time ? new Date(data.end_time) : null}, 
        ${data.timezone || 'UTC'},
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
    });'创建运营配置失败:', error);
    throw error;
  }
}

// 更新运营配置
async function updateOperationConfig(id: string, data: any, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      UPDATE operation_configs SET
        config_name = ${data.config_name},
        category = ${data.category},
        name_zh = ${data.name_zh},
        name_en = ${data.name_en},
        name_ru = ${data.name_ru},
        description_zh = ${data.description_zh},
        description_en = ${data.description_en},
        description_ru = ${data.description_ru},
        discount_percentage = ${data.discount_percentage},
        discount_amount = ${data.discount_amount},
        promo_code = ${data.promo_code},
        usage_limit = ${data.usage_limit},
        min_purchase_amount = ${data.min_purchase_amount},
        max_discount_amount = ${data.max_discount_amount},
        daily_limit = ${data.daily_limit},
        monthly_limit = ${data.monthly_limit},
        user_level_restrictions = ${data.user_level_restrictions},
        platform_fee_rate = ${data.platform_fee_rate},
        minimum_fee = ${data.minimum_fee},
        maximum_fee = ${data.maximum_fee},
        fee_calculation_method = ${data.fee_calculation_method},
        target_audience = ${data.target_audience},
        channel_restrictions = ${data.channel_restrictions},
        geographic_targeting = ${data.geographic_targeting},
        start_time = ${data.start_time ? new Date(data.start_time) : null},
        end_time = ${data.end_time ? new Date(data.end_time) : null},
        timezone = ${data.timezone},
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
    });'更新运营配置失败:', error);
    throw error;
  }
}

// 删除运营配置（软删除）
async function deleteOperationConfig(id: string, operatorId: string) {
  try {
    const result = await prisma.$queryRaw`
      UPDATE operation_configs SET
        is_active = false,
        operator_id = ${operatorId},
        change_reason = '软删除运营配置',
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
    });'删除运营配置失败:', error);
    throw error;
  }
}

// 验证促销代码唯一性
async function validatePromoCode(promoCode: string, excludeId?: string) {
  try {
    let query = `SELECT COUNT(*) as count FROM operation_configs WHERE promo_code = $1 AND is_active = true`;
    const params = [promoCode];
    
    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }
    
    const result = await prisma.$queryRawUnsafe(query, ...params);
    return parseInt(result[0].count) === 0;
  } catch (error) {
    logger.error("API Error", error as Error, {
      requestId,
      endpoint: request.url
    });'验证促销代码失败:', error);
    return false;
export const GET = withErrorHandling(async (request: NextRequest) => {
  const logger = getLogger();
  const requestId = `operation_route.ts_{Date.now()}_{Math.random().toString(36).substr(2, 9)}`;
  
  logger.info('operation_route.ts request started', {
    requestId,
    method: request.method,
    url: request.url
  });

  try {
    return await handleGET(request);
  } catch (error) {
    logger.error('operation_route.ts request failed', error as Error, {
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
        const promoCode = url.searchParams.get('promo_code');
        const isActive = url.searchParams.get('is_active');
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let query = `SELECT * FROM operation_configs WHERE 1=1`;
        const params: any[] = [];

        if (category) {
          query += ` AND category = $${params.length + 1}`;
          params.push(category);
}

    if (promoCode) {
      query += ` AND promo_code = $${params.length + 1}`;
      params.push(promoCode);
    }

    if (isActive !== null) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(isActive === 'true');
    }

    query += ` ORDER BY category, priority DESC, config_name LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const configs = await prisma.$queryRawUnsafe(query, ...params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM operation_configs WHERE 1=1`;
    const countParams: any[] = [];

    if (category) {
      countQuery += ` AND category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (promoCode) {
      countQuery += ` AND promo_code = $${countParams.length + 1}`;
      countParams.push(promoCode);
    }

    if (isActive !== null) {
      countQuery += ` AND is_active = $${countParams.length + 1}`;
      countParams.push(isActive === 'true');
    }

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
    const total = parseInt(countResult[0].total);

    return NextResponse.json({ 
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
  return withWritePermission(async (request: any, admin: any) => {
    const data = await request.json();

    // 验证必填字段
    if (!data.config_name || !data.category) {
      return NextResponse.json({ 
        success: false,
        error: '缺少必填字段：config_name, category' 
      }, { status: 400 });
    }

    // 验证促销代码唯一性
    if (data.promo_code) {
      const isUnique = await validatePromoCode(data.promo_code);
      if (!isUnique) {
        return NextResponse.json({ 
          success: false,
          error: '促销代码已存在' 
        }, { status: 400 });
      }
    }

    // 验证折扣百分比
    if (data.discount_percentage !== undefined) {
      if (data.discount_percentage < 0 || data.discount_percentage > 100) {
        return NextResponse.json({ 
          success: false,
          error: '折扣百分比必须在0-100之间' 
        }, { status: 400 });
      }
    }

    // 验证费率计算方法
    if (data.fee_calculation_method) {
      const validMethods = ['percentage', 'fixed', 'tiered'];
      if (!validMethods.includes(data.fee_calculation_method)) {
        return NextResponse.json({ 
          success: false,
          error: '无效的费率计算方法' 
        }, { status: 400 });
      }
    }

    // 验证平台费率
    if (data.platform_fee_rate !== undefined) {
      if (data.platform_fee_rate < 0 || data.platform_fee_rate > 1) {
        return NextResponse.json({ 
          success: false,
          error: '平台费率必须在0-1之间（表示0%-100%）' 
        }, { status: 400 });
      }
    }

    const config = await createOperationConfig(data, admin.username);

    return NextResponse.json({
      success: true,
      message: '运营参数创建成功',
      data: config
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
        error: '缺少运营配置ID' 
      }, { status: 400 });
    }

    // 验证促销代码唯一性（排除当前记录）
    if (data.promo_code) {
      const isUnique = await validatePromoCode(data.promo_code, id);
      if (!isUnique) {
        return NextResponse.json({ 
          success: false,
          error: '促销代码已存在' 
        }, { status: 400 });
      }
    }

    // 验证折扣百分比
    if (data.discount_percentage !== undefined) {
      if (data.discount_percentage < 0 || data.discount_percentage > 100) {
        return NextResponse.json({ 
          success: false,
          error: '折扣百分比必须在0-100之间' 
        }, { status: 400 });
      }
    }

    // 验证费率计算方法
    if (data.fee_calculation_method) {
      const validMethods = ['percentage', 'fixed', 'tiered'];
      if (!validMethods.includes(data.fee_calculation_method)) {
        return NextResponse.json({ 
          success: false,
          error: '无效的费率计算方法' 
        }, { status: 400 });
      }
    }

    // 验证平台费率
    if (data.platform_fee_rate !== undefined) {
      if (data.platform_fee_rate < 0 || data.platform_fee_rate > 1) {
        return NextResponse.json({ 
          success: false,
          error: '平台费率必须在0-1之间（表示0%-100%）' 
        }, { status: 400 });
      }
    }

    const config = await updateOperationConfig(id, data, admin.username);

    return NextResponse.json({
      success: true,
      message: '运营参数更新成功',
      data: config
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
        error: '缺少运营配置ID' 
      }, { status: 400 });
    }

    await deleteOperationConfig(id, admin.username);

    return NextResponse.json({
      success: true,
      message: '运营参数删除成功'
    });
  })(request);
}

// 验证促销代码的专用接口
export async function OPTIONS(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    const url = new URL(request.url);
    const promoCode = url.searchParams.get('code');
    const excludeId = url.searchParams.get('exclude_id');

    if (!promoCode) {
      return NextResponse.json({ 
        success: false,
        error: '缺少促销代码参数' 
      }, { status: 400 });
    }

    const isUnique = await validatePromoCode(promoCode, excludeId || undefined);

    return NextResponse.json({
      success: true,
      data: {
        promo_code: promoCode,
        is_unique: isUnique
      }
    });
  })(request);
}