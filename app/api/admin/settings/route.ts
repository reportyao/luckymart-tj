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
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
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
      return NextResponse.json({ error: '权限不足' }, { status: 403 });
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
    if (typeof data.minWithdrawAmount === 'number') {
      updatePromises.push(updateSetting('min_withdraw_amount', data.minWithdrawAmount, 'number'));
    }
    if (typeof data.withdrawFeeRate === 'number') {
      updatePromises.push(updateSetting('withdraw_fee_rate', data.withdrawFeeRate, 'number'));
    }
    if (typeof data.freeDrawsPerDay === 'number') {
      updatePromises.push(updateSetting('free_draws_per_day', data.freeDrawsPerDay, 'number'));
    }
    if (typeof data.enableNotifications === 'boolean') {
      updatePromises.push(updateSetting('enable_notifications', data.enableNotifications, 'boolean'));
    }
    if (typeof data.enableTelegramBot === 'boolean') {
      updatePromises.push(updateSetting('enable_telegram_bot', data.enableTelegramBot, 'boolean'));
    }
    if (typeof data.maintenanceMode === 'boolean') {
      updatePromises.push(updateSetting('maintenance_mode', data.maintenanceMode, 'boolean'));
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
