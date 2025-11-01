import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager, AdminPermissions } from '@/lib/admin-permission-manager';
import { prisma } from '@/lib/prisma';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.settings.read() });
const withWritePermission = AdminPermissionManager.createPermissionMiddleware({ customPermissions: AdminPermissions.settings.write() });

// 缓存系统设置以提高性能
let settingsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取缓存的系统设置
async function getCachedSettings() {
  const now = Date.now();
  if (settingsCache && (now - settingsCache.timestamp) < CACHE_DURATION) {
    return settingsCache.data;
  }
  return null;
}

// 更新缓存
function updateCache(settings: any) {
  settingsCache = {
    data: settings,
    timestamp: Date.now()
  };
}

// 记录操作日志
async function logSettingChange(
  settingKey: string,
  oldValue: string | null,
  newValue: string | null,
  changeType: string,
  operatorId: string,
  operatorName: string,
  changeReason?: string,
  request?: NextRequest
) {
  try {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request?.headers.get('user-agent') || 'unknown';

    await prisma.$executeRaw`
      INSERT INTO system_setting_logs 
      (setting_key, old_value, new_value, change_type, operator_id, operator_name, change_reason, ip_address, user_agent)
      VALUES (${settingKey}, ${oldValue}, ${newValue}, ${changeType}, ${operatorId}, ${operatorName}, ${changeReason}, ${ipAddress}::inet, ${userAgent})
    `;
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
}

// 获取所有系统参数
async function getAllSystemSettings() {
  const cached = await getCachedSettings();
  if (cached) return cached;

  try {
    const settings = await prisma.$queryRaw`
      SELECT * FROM system_settings WHERE is_active = true ORDER BY category, setting_key
    `;
    
    const settingsMap: any = {};
    
    settings.forEach((setting: any) : any => {
      let value = setting.setting_value;
      
      // 根据类型转换值
      switch (setting.setting_type) {
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.error('解析JSON设置失败:', setting.setting_key, e);
          }
          break;
      }
      
      settingsMap[setting.setting_key] = {
        value,
        type: setting.setting_type,
        category: setting.category,
        sub_category: setting.sub_category,
        description: setting.description,
        is_encrypted: setting.is_encrypted,
        operator_id: setting.operator_id,
        change_reason: setting.change_reason,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      };
    });
    
    updateCache(settingsMap);
    return settingsMap;
  } catch (error) {
    console.error('获取系统设置失败:', error);
    throw error;
  }
}

// 更新单个系统参数
async function updateSystemSetting(
  key: string, 
  value: any, 
  type: string = 'string',
  category: string = 'general',
  subCategory?: string,
  operatorId?: string,
  operatorName?: string,
  changeReason?: string,
  request?: NextRequest
) {
  try {
    // 获取旧值
    const oldSetting = await prisma.$queryRaw`
      SELECT setting_value FROM system_settings WHERE setting_key = ${key}
    `;
    const oldValue = oldSetting.length > 0 ? oldSetting[0].setting_value : null;

    let stringValue = value;
    
    // 根据类型转换值
    switch (type) {
      case 'number':
        stringValue = value.toString();
        break;
      case 'boolean':
        stringValue = value.toString();
        break;
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = value.toString();
    }
    
    // 执行更新或插入
    await prisma.$queryRaw`
      INSERT INTO system_settings 
      (setting_key, setting_value, setting_type, category, sub_category, operator_id, change_reason, is_active)
      VALUES (${key}, ${stringValue}, ${type}, ${category}, ${subCategory}, ${operatorId}, ${changeReason}, true)
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = ${stringValue},
        setting_type = ${type},
        category = ${category},
        sub_category = ${subCategory},
        operator_id = ${operatorId},
        change_reason = ${changeReason},
        updated_at = NOW()
    `;
    
    // 记录操作日志
    if (operatorId && operatorName) {
      await logSettingChange(
        key,
        oldValue,
        stringValue,
        oldSetting.length > 0 ? 'update' : 'create',
        operatorId,
        operatorName,
        changeReason,
        request
      );
    }
    
    // 清除缓存
    settingsCache = null;
    
  } catch (error) {
    console.error('更新系统设置失败:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  return withReadPermission(async (request: any, admin: any) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const subCategory = url.searchParams.get('sub_category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM system_settings WHERE is_active = true
    `;
    const params: any[] = [];

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (subCategory) {
      query += ` AND sub_category = $${params.length + 1}`;
      params.push(subCategory);
    }

    query += ` ORDER BY category, sub_category, setting_key LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const settings = await prisma.$queryRawUnsafe(query, ...params);

    // 获取总数
    let countQuery = `SELECT COUNT(*) as total FROM system_settings WHERE is_active = true`;
    const countParams: any[] = [];

    if (category) {
      countQuery += ` AND category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (subCategory) {
      countQuery += ` AND sub_category = $${countParams.length + 1}`;
      countParams.push(subCategory);
    }

    const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
    const total = parseInt(countResult[0].total);

    return NextResponse.json({ 
      success: true,
      data: settings,
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
    const { settings, operator_id, operator_name, change_reason } = data;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ 
        success: false,
        error: '无效的设置数据' 
      }, { status: 400 });
    }

    const updatePromises = settings.map((setting: any) : any => 
      updateSystemSetting(
        setting.key,
        setting.value,
        setting.type || 'string',
        setting.category || 'general',
        setting.sub_category,
        operator_id || admin.username,
        operator_name || admin.username,
        change_reason,
        request
      )
    );

    await Promise.all(updatePromises);

    // 获取更新后的设置
    const updatedSettings = await getAllSystemSettings();

    return NextResponse.json({
      success: true,
      message: '系统参数更新成功',
      data: updatedSettings
    });
  })(request);
}

export async function PUT(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const data = await request.json();
    const { key, value, type, category, sub_category, change_reason } = data;

    if (!key) {
      return NextResponse.json({ 
        success: false,
        error: '设置键不能为空' 
      }, { status: 400 });
    }

    await updateSystemSetting(
      key,
      value,
      type || 'string',
      category || 'general',
      sub_category,
      admin.username,
      admin.username,
      change_reason,
      request
    );

    return NextResponse.json({
      success: true,
      message: '系统参数更新成功'
    });
  })(request);
}

export async function DELETE(request: NextRequest) {
  return withWritePermission(async (request: any, admin: any) => {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key) {
      return NextResponse.json({ 
        success: false,
        error: '设置键不能为空' 
      }, { status: 400 });
    }

    // 获取旧值用于日志记录
    const oldSetting = await prisma.$queryRaw`
      SELECT setting_value FROM system_settings WHERE setting_key = ${key}
    `;
    const oldValue = oldSetting.length > 0 ? oldSetting[0].setting_value : null;

    // 软删除 - 设置为不活跃状态
    await prisma.$queryRaw`
      UPDATE system_settings 
      SET is_active = false, updated_at = NOW()
      WHERE setting_key = ${key}
    `;

    // 记录删除日志
    if (oldSetting.length > 0) {
      await logSettingChange(
        key,
        oldValue,
        null,
        'delete',
        admin.username,
        admin.username,
        '软删除系统参数',
        request
      );
    }

    // 清除缓存
    settingsCache = null;

    return NextResponse.json({
      success: true,
      message: '系统参数删除成功'
    });
  })(request);
}