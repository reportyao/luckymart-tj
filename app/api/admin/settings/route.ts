import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

// 从数据库获取所有设置
async function getAllSettings() {
  const cached = await getCachedSettings();
  if (cached) return cached;

  const settings = await prisma.systemSettings.findMany();
  const settingsMap: any = {};
  
  settings.forEach(setting => {
    let value = setting.settingValue;
    
    // 根据类型转换值
    switch (setting.settingType) {
      case 'number':
        value = parseFloat(value);
        break;
      case 'boolean':
        value = value === 'true';
        break;
      case 'json':
        value = JSON.parse(value);
        break;
    }
    
    settingsMap[setting.settingKey] = value;
  });
  
  updateCache(settingsMap);
  return settingsMap;
}

// 更新单个设置
async function updateSetting(key: string, value: any, type: string = 'string') {
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
  
  await prisma.systemSettings.upsert({
    where: { settingKey: key },
    update: { 
      settingValue: stringValue,
      settingType: type,
      updatedAt: new Date()
    },
    create: {
      settingKey: key,
      settingValue: stringValue,
      settingType: type
    }
  });
  
  // 清除缓存
  settingsCache = null;
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ 
        success: false,
        error: '管理员权限验证失败' 
      }, { status: 403 });
    }

    // 检查设置查看权限
    const hasPermission = admin.permissions.includes('settings:read') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json({ 
        success: false,
        error: '权限不足：无法查看系统设置' 
      }, { status: 403 });
    }

    const settings = await getAllSettings();

    return NextResponse.json({ 
      success: true,
      settings 
    });

  } catch (error: any) {
    console.error('获取系统设置失败:', error);
    return NextResponse.json(
      { error: '获取系统设置失败' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const admin = getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ 
        success: false,
        error: '管理员权限验证失败' 
      }, { status: 403 });
    }

    // 检查设置管理权限（超级管理员或设置权限）
    const hasPermission = admin.permissions.includes('settings:write') || admin.role === 'super_admin';
    if (!hasPermission) {
      return NextResponse.json({ 
        success: false,
        error: '权限不足：无法修改系统设置' 
      }, { status: 403 });
    }

    const data = await request.json();

    // 批量更新设置
    const updatePromises = [];
    
    // 基础设置
    if (data.siteName !== undefined) {
      updatePromises.push(updateSetting('site_name', data.siteName, 'string'));
    }
    if (typeof data.minRechargeAmount === 'number') {
      updatePromises.push(updateSetting('min_recharge_amount', data.minRechargeAmount, 'number'));
    }
    if (typeof data.maxRechargeAmount === 'number') {
      updatePromises.push(updateSetting('max_recharge_amount', data.maxRechargeAmount, 'number'));
    }
    if (typeof data.minWithdrawAmount === 'number') {
      updatePromises.push(updateSetting('min_withdraw_amount', data.minWithdrawAmount, 'number'));
    }
    if (typeof data.maxWithdrawAmount === 'number') {
      updatePromises.push(updateSetting('max_withdraw_amount', data.maxWithdrawAmount, 'number'));
    }
    if (typeof data.withdrawFeeRate === 'number') {
      updatePromises.push(updateSetting('withdraw_fee_rate', data.withdrawFeeRate, 'number'));
    }
    if (typeof data.freeDrawsPerDay === 'number') {
      updatePromises.push(updateSetting('free_draws_per_day', data.freeDrawsPerDay, 'number'));
    }
    
    // 转售价格限制设置
    if (typeof data.resale_min_discount_rate === 'number') {
      updatePromises.push(updateSetting('resale_min_discount_rate', data.resale_min_discount_rate, 'number'));
    }
    if (typeof data.resale_max_discount_rate === 'number') {
      updatePromises.push(updateSetting('resale_max_discount_rate', data.resale_max_discount_rate, 'number'));
    }
    if (typeof data.resale_min_price === 'number') {
      updatePromises.push(updateSetting('resale_min_price', data.resale_min_price, 'number'));
    }
    if (typeof data.resale_max_price === 'number') {
      updatePromises.push(updateSetting('resale_max_price', data.resale_max_price, 'number'));
    }
    if (typeof data.resale_platform_fee_rate === 'number') {
      updatePromises.push(updateSetting('resale_platform_fee_rate', data.resale_platform_fee_rate, 'number'));
    }
    
    // 输入验证设置
    if (typeof data.max_account_length === 'number') {
      updatePromises.push(updateSetting('max_account_length', data.max_account_length, 'number'));
    }
    if (typeof data.max_description_length === 'number') {
      updatePromises.push(updateSetting('max_description_length', data.max_description_length, 'number'));
    }
    if (typeof data.max_phone_length === 'number') {
      updatePromises.push(updateSetting('max_phone_length', data.max_phone_length, 'number'));
    }
    if (typeof data.max_address_length === 'number') {
      updatePromises.push(updateSetting('max_address_length', data.max_address_length, 'number'));
    }
    
    // 功能开关
    if (typeof data.enableNotifications === 'boolean') {
      updatePromises.push(updateSetting('enable_notifications', data.enableNotifications, 'boolean'));
    }
    if (typeof data.enableTelegramBot === 'boolean') {
      updatePromises.push(updateSetting('enable_telegram_bot', data.enableTelegramBot, 'boolean'));
    }
    if (typeof data.maintenanceMode === 'boolean') {
      updatePromises.push(updateSetting('maintenance_mode', data.maintenanceMode, 'boolean'));
    }
    if (typeof data.enable_price_limits === 'boolean') {
      updatePromises.push(updateSetting('enable_price_limits', data.enable_price_limits, 'boolean'));
    }
    if (typeof data.enable_input_sanitization === 'boolean') {
      updatePromises.push(updateSetting('enable_input_sanitization', data.enable_input_sanitization, 'boolean'));
    }
    if (typeof data.enable_amount_validation === 'boolean') {
      updatePromises.push(updateSetting('enable_amount_validation', data.enable_amount_validation, 'boolean'));
    }
    
    // 银行充值信息（需要加密存储）
    if (data.rechargeBankName !== undefined) {
      updatePromises.push(updateSetting('recharge_bank_name', data.rechargeBankName, 'string'));
    }
    if (data.rechargeBankAccountNumber !== undefined) {
      updatePromises.push(updateSetting('recharge_bank_account_number', data.rechargeBankAccountNumber, 'string'));
    }
    if (data.rechargeBankAccountHolder !== undefined) {
      updatePromises.push(updateSetting('recharge_bank_account_holder', data.rechargeBankAccountHolder, 'string'));
    }
    if (data.rechargeBankBranch !== undefined) {
      updatePromises.push(updateSetting('recharge_bank_branch', data.rechargeBankBranch, 'string'));
    }
    if (data.rechargeInstructions !== undefined) {
      updatePromises.push(updateSetting('recharge_instructions', data.rechargeInstructions, 'string'));
    }

    // 等待所有更新完成
    await Promise.all(updatePromises);

    // 获取更新后的设置
    const updatedSettings = await getAllSettings();

    return NextResponse.json({
      success: true,
      message: '系统设置更新成功',
      settings: updatedSettings
    });

  } catch (error: any) {
    console.error('更新系统设置失败:', error);
    return NextResponse.json(
      { error: '更新系统设置失败' }, 
      { status: 500 }
    );
  }
}
