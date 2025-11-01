import { config } from 'dotenv';
import { getAppConfig, validateEnvironment } from '../config/env-config';
#!/usr/bin/env tsx
/**
 * 环境变量配置验证脚本
 * 用于验证所有必需的环境变量是否正确配置
 */


// 加载.env文件
config();

interface ValidationResult {
  category: string;
  item: string;
  status: '✅' | '⚠️' | '❌';
  message: string;
  suggestion?: string;
}

interface ValidationReport {
  timestamp: string;
  overallScore: number;
  criticalIssues: number;
  warnings: number;
  results: ValidationResult[];
}

function validateSupabaseConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const config = getAppConfig();
  
  // 检查Supabase URL
  if (config.supabase.url && !config.supabase.url.includes('your-project') && config.supabase.url.includes('supabase.co')) {
    results.push({
      category: 'Supabase',
      item: '项目URL',
      status: '✅',
      message: 'Supabase项目URL已正确配置'
    });
  } else {
    results.push({
      category: 'Supabase',
      item: '项目URL',
      status: '❌',
      message: 'Supabase项目URL未配置或仍在使用默认值',
      suggestion: '从Supabase控制台获取真实的项目URL'
    });
  }
  
  // 检查Supabase密钥
  if (config.supabase.anonKey && !config.supabase.anonKey.includes('your-') && config.supabase.anonKey.startsWith('eyJ')) {
    results.push({
      category: 'Supabase',
      item: '匿名密钥',
      status: '✅',
      message: 'Supabase匿名密钥已配置'
    });
  } else {
    results.push({
      category: 'Supabase',
      item: '匿名密钥',
      status: '❌',
      message: 'Supabase匿名密钥未配置或仍在使用默认值',
      suggestion: '从Supabase项目设置中获取匿名密钥'
    });
  }
  
  if (config.supabase.serviceRoleKey && !config.supabase.serviceRoleKey.includes('your-') && config.supabase.serviceRoleKey.startsWith('eyJ')) {
    results.push({
      category: 'Supabase',
      item: '服务角色密钥',
      status: '✅',
      message: 'Supabase服务角色密钥已配置'
    });
  } else {
    results.push({
      category: 'Supabase',
      item: '服务角色密钥',
      status: '❌',
      message: 'Supabase服务角色密钥未配置或仍在使用默认值',
      suggestion: '从Supabase项目设置中获取服务角色密钥'
    });
  }
  
  return results;
}

function validateSecurityConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // 检查JWT密钥
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret && !jwtSecret.includes('your-') && jwtSecret.length > 20) {
    results.push({
      category: '安全',
      item: 'JWT密钥',
      status: '✅',
      message: 'JWT密钥已正确配置'
    });
  } else {
    results.push({
      category: '安全',
      item: 'JWT密钥',
      status: jwtSecret ? '⚠️' : '❌',
      message: jwtSecret ? 'JWT密钥长度可能不足' : 'JWT密钥未配置',
      suggestion: '设置一个至少20字符的复杂JWT密钥'
    });
  }
  
  // 检查Bot JWT密钥
  const botJwtSecret = process.env.BOT_JWT_SECRET;
  if (botJwtSecret && !botJwtSecret.includes('your-bot-jwt-secret-key')) {
    results.push({
      category: '安全',
      item: 'Bot JWT密钥',
      status: '✅',
      message: 'Bot专用JWT密钥已配置'
    });
  } else {
    results.push({
      category: '安全',
      item: 'Bot JWT密钥',
      status: '⚠️',
      message: 'Bot专用JWT密钥未配置或仍在使用默认值',
      suggestion: '为Bot设置专用的JWT密钥以提高安全性'
    });
  }
  
  return results;
}

function validateTelegramConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // 检查Bot Token
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken && !botToken.includes('your_telegram_bot_token_here') && botToken.length > 20) {
    results.push({
      category: 'Telegram',
      item: 'Bot Token',
      status: '✅',
      message: 'Telegram Bot Token已配置'
    });
  } else {
    results.push({
      category: 'Telegram',
      item: 'Bot Token',
      status: '❌',
      message: 'Telegram Bot Token未配置',
      suggestion: '从 @BotFather 获取Bot Token'
    });
  }
  
  // 检查Mini App URL
  const miniAppUrl = process.env.MINI_APP_URL;
  if (miniAppUrl) {
    results.push({
      category: 'Telegram',
      item: 'Mini App URL',
      status: '✅',
      message: `Mini App URL已配置: ${miniAppUrl}`
    });
  } else {
    results.push({
      category: 'Telegram',
      item: 'Mini App URL',
      status: '⚠️',
      message: 'Mini App URL未配置',
      suggestion: '设置Telegram Mini App的访问URL'
    });
  }
  
  return results;
}

function validateDatabaseConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // 检查数据库URL
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.includes('username:password@host:port')) {
    results.push({
      category: '数据库',
      item: '连接字符串',
      status: '✅',
      message: '数据库连接字符串已配置'
    });
  } else {
    results.push({
      category: '数据库',
      item: '连接字符串',
      status: '❌',
      message: '数据库连接字符串未配置或仍在使用模板值',
      suggestion: '配置真实的PostgreSQL连接字符串'
    });
  }
  
  return results;
}

function validateAdminConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // 检查管理员用户名
  const adminUsername = process.env.ADMIN_USERNAME;
  if (adminUsername && !adminUsername.includes('your_admin_username')) {
    results.push({
      category: '管理',
      item: '管理员用户名',
      status: '✅',
      message: '管理员用户名已配置'
    });
  } else {
    results.push({
      category: '管理',
      item: '管理员用户名',
      status: '❌',
      message: '管理员用户名未配置',
      suggestion: '设置管理员用户名'
    });
  }
  
  // 检查管理员密码
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && !adminPassword.includes('your_secure_admin_password') && adminPassword.length >= 8) {
    results.push({
      category: '管理',
      item: '管理员密码',
      status: '✅',
      message: '管理员密码已配置'
    });
  } else {
    results.push({
      category: '管理',
      item: '管理员密码',
      status: adminPassword ? '⚠️' : '❌',
      message: adminPassword ? '管理员密码强度可能不足' : '管理员密码未配置',
      suggestion: '设置至少8字符的强密码'
    });
  }
  
  return results;
}

function validateRedisConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // 检查Redis主机
  const redisHost = process.env.REDIS_HOST;
  if (redisHost && redisHost !== 'localhost') {
    results.push({
      category: '缓存',
      item: 'Redis主机',
      status: '✅',
      message: 'Redis主机已配置'
    });
  } else {
    results.push({
      category: '缓存',
      item: 'Redis主机',
      status: '⚠️',
      message: 'Redis主机使用默认值',
      suggestion: '配置生产环境的Redis实例'
    });
  }
  
  // 检查Redis密码
  const redisPassword = process.env.REDIS_PASSWORD;
  if (redisPassword && !redisPassword.includes('your_redis_password')) {
    results.push({
      category: '缓存',
      item: 'Redis密码',
      status: '✅',
      message: 'Redis密码已配置'
    });
  } else {
    results.push({
      category: '缓存',
      item: 'Redis密码',
      status: '⚠️',
      message: 'Redis密码未配置或仍在使用默认值',
      suggestion: '设置Redis访问密码以提高安全性'
    });
  }
  
  return results;
}

function validatePaymentConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  // 检查支付配置
  const alifMobiPhone = process.env.ALIF_MOBI_PHONE;
  const dcBankAccount = process.env.DC_BANK_ACCOUNT;
  
  if (alifMobiPhone) {
    results.push({
      category: '支付',
      item: 'Alif Mobi',
      status: '✅',
      message: `Alif Mobi配置已设置: ${alifMobiPhone}`
    });
  }
  
  if (dcBankAccount) {
    results.push({
      category: '支付',
      item: 'DC Bank',
      status: '✅',
      message: `DC Bank配置已设置: ${dcBankAccount}`
    });
  }
  
  return results;
}

function validateApiConfig(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const config = getAppConfig();
  
  // 检查API基础URL
  if (config.api.baseUrl) {
    results.push({
      category: 'API',
      item: '基础URL',
      status: '✅',
      message: `API基础URL已配置: ${config.api.baseUrl}`
    });
  } else {
    results.push({
      category: 'API',
      item: '基础URL',
      status: '⚠️',
      message: 'API基础URL未配置',
      suggestion: '设置API基础URL'
    });
  }
  
  // 检查WebSocket URL
  if (config.api.wsUrl) {
    results.push({
      category: 'API',
      item: 'WebSocket URL',
      status: '✅',
      message: `WebSocket URL已配置: ${config.api.wsUrl}`
    });
  }
  
  return results;
}

function generateReport(results: ValidationResult[]): ValidationReport {
  const criticalIssues = results.filter(r => r.status === '❌').length;
  const warnings = results.filter(r => r.status === '⚠️').length;
  const success = results.filter(r => r.status === '✅').length;
  
  // 计算总体评分 (满分100)
  const totalItems = results.length;
  const overallScore = Math.round((success / totalItems) * 100);
  
  return {
    timestamp: new Date().toISOString(),
    overallScore,
    criticalIssues,
    warnings,
    results
  };
}

function printReport(report: ValidationReport): void {
  console.log('\n🔍 LuckyMart-TJ 环境配置验证报告');
  console.log('=' .repeat(60));
  console.log(`📅 检查时间: ${report.timestamp}`);
  console.log(`📊 总体评分: ${report.overallScore}/100`);
  console.log(`❌ 关键问题: ${report.criticalIssues}`);
  console.log(`⚠️  警告项: ${report.warnings}`);
  console.log(`✅ 正常项: ${report.results.filter(r => r.status === '✅').length}`);
  console.log('=' .repeat(60));
  
  // 按类别分组显示结果
  const categories = [...new Set(report.results.map(r => r.category))];
  
  categories.forEach(category => {
    console.log(`\n📁 ${category} 配置`);
    console.log('-'.repeat(40));
    
    const categoryResults = report.results.filter(r => r.category === category);
    categoryResults.forEach(result => {
      console.log(`${result.status} ${result.item}: ${result.message}`);
      if (result.suggestion) {
        console.log(`   💡 建议: ${result.suggestion}`);
      }
    });
  });
  
  // 总结和建议
  console.log('\n📋 总结与建议');
  console.log('='.repeat(60));
  
  if (report.criticalIssues > 0) {
    console.log(`🔴 发现 ${report.criticalIssues} 个关键问题需要立即修复`);
  }
  
  if (report.warnings > 0) {
    console.log(`🟡 发现 ${report.warnings} 个警告项建议优化`);
  }
  
  if (report.overallScore >= 90) {
    console.log('🎉 配置状态优秀！');
  } else if (report.overallScore >= 70) {
    console.log('👍 配置状态良好，建议优化警告项');
  } else if (report.overallScore >= 50) {
    console.log('⚠️  配置状态一般，需要修复关键问题');
  } else {
    console.log('🚨 配置状态较差，需要紧急修复多个关键问题');
  }
}

async function main(): Promise<void> {
  try {
    console.log('🚀 开始环境配置验证...\n');
  }
    
    // 执行所有验证
    const allResults: ValidationResult[] = [;
      ...validateSupabaseConfig(),
      ...validateSecurityConfig(),
      ...validateTelegramConfig(),
      ...validateDatabaseConfig(),
      ...validateAdminConfig(),
      ...validateRedisConfig(),
      ...validatePaymentConfig(),
      ...validateApiConfig(),
    ];
    
    // 生成报告
    const report = generateReport(allResults);
    
    // 显示报告
    printReport(report);
    
    // 如果有关键问题，退出码为1
    if (report.criticalIssues > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行验证
main();
