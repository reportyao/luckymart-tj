import { NextRequest, NextResponse } from 'next/server';
import { AdminPermissionManager } from '@/lib/admin-permission-manager';
import { AdminPermissions } from '@/lib/admin-permissions';
import { prisma } from '@/lib/prisma';

const withReadPermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.SETTINGS_READ);
const withWritePermission = AdminPermissionManager.createPermissionMiddleware(AdminPermissions.SETTINGS_WRITE);

// 缓存系统设置以提高性能（修复内存泄漏）
class SettingsCache {
  private cache: Map<string, { data: any; timestamp: number; accessCount: number }>;
  private maxSize: number;
  private maxAge: number;
  private maxAccessCount: number;

  constructor(maxSize: number = 100, maxAge: number = 5 * 60 * 1000, maxAccessCount: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAge;
    this.maxAccessCount = maxAccessCount;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    
    // 检查是否过期
    if (now - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // 检查访问次数
    if (item.accessCount >= this.maxAccessCount) {
      this.cache.delete(key);
      return null;
    }
    
    // 增加访问计数
    item.accessCount++;
    
    return item.data;
  }

  set(key: string, data: any): void {
    const now = Date.now();
    
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.removeOldest();
    }
    
    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 0
    });
  }

  clear(): void {
    this.cache.clear();
  }

  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime || oldestKey === null) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // 获取缓存统计信息
  getStats(): { size: number; maxSize: number; hitRate: number } {
    const size = this.cache.size;
    let totalAccess = 0;
    let hits = 0;
    
    for (const item of this.cache.values()) {
      totalAccess += item.accessCount;
      hits += Math.min(item.accessCount, 1); // 假设所有访问都是命中
    }
    
    return {
      size,
      maxSize: this.maxSize,
      hitRate: totalAccess > 0 ? hits / totalAccess : 0
    };
  }
}

const settingsCache = new SettingsCache(50, 5 * 60 * 1000, 1000); // 最大50个条目，5分钟过期，最多1000次访问

// 获取缓存的系统设置
async function getCachedSettings() {
  return settingsCache.get('system_settings');
}

// 更新缓存
function updateCache(settings: any) {
  settingsCache.set('system_settings', settings);
}

// 从数据库获取所有设置
async function getAllSettings() {
  const cached = await getCachedSettings();
  if (cached) {return cached;}

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
  settingsCache.clear();
}

export async function GET(request: NextRequest) {
  return withReadPermission(async (request, admin) => {
    const settings = await getAllSettings();

    return NextResponse.json({ 
      success: true,
      settings 
    });
  })(request);
}

export async function POST(request: NextRequest) {
  return withWritePermission(async (request, admin) => {
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
  })(request);
}
