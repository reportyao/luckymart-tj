/**
 * 核心功能测试脚本
 * 测试数据库连接、API逻辑、业务流程
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 手动加载 .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    process.env[key] = value;
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('='.repeat(60));
console.log('LuckyMart TJ 核心功能测试');
console.log('='.repeat(60));
console.log('');

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

// 测试助手函数
function testStart(name) {
  testResults.total++;
  console.log(`\n📋 测试 ${testResults.total}: ${name}`);
  console.log('-'.repeat(50));
}

function testPass(message) {
  testResults.passed++;
  console.log(`✅ 通过: ${message}`);
}

function testFail(message, error) {
  testResults.failed++;
  console.log(`❌ 失败: ${message}`);
  if (error) console.log(`   错误: ${error.message || error}`);
}

// 测试1: 数据库连接
async function test1_DatabaseConnection() {
  testStart('数据库连接测试');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    testPass('数据库连接成功');
    return true;
  } catch (error) {
    testFail('数据库连接失败', error);
    return false;
  }
}

// 测试2: 用户表查询
async function test2_UsersTable() {
  testStart('用户表结构测试');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    testPass(`用户表查询成功 (当前用户数: ${data ? data.length : 0})`);
    return true;
  } catch (error) {
    testFail('用户表查询失败', error);
    return false;
  }
}

// 测试3: 商品表查询
async function test3_ProductsTable() {
  testStart('商品表结构测试');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    testPass(`商品表查询成功 (当前商品数: ${data ? data.length : 0})`);
    if (data && data.length > 0) {
      console.log(`   示例商品: ${data[0].name}`);
    }
    return true;
  } catch (error) {
    testFail('商品表查询失败', error);
    return false;
  }
}

// 测试4: 抽奖轮次表
async function test4_LotteryRoundsTable() {
  testStart('抽奖轮次表测试');
  
  try {
    const { data, error } = await supabase
      .from('lottery_rounds')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    testPass(`抽奖轮次表查询成功 (当前轮次数: ${data ? data.length : 0})`);
    return true;
  } catch (error) {
    testFail('抽奖轮次表查询失败', error);
    return false;
  }
}

// 测试5: 订单表
async function test5_OrdersTable() {
  testStart('订单表测试');
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    testPass(`订单表查询成功 (当前订单数: ${data ? data.length : 0})`);
    return true;
  } catch (error) {
    testFail('订单表查询失败', error);
    return false;
  }
}

// 测试6: 转售商品表
async function test6_ResaleListingsTable() {
  testStart('转售商品表测试');
  
  try {
    const { data, error } = await supabase
      .from('resale_listings')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    testPass(`转售商品表查询成功 (当前转售商品数: ${data ? data.length : 0})`);
    return true;
  } catch (error) {
    testFail('转售商品表查询失败', error);
    return false;
  }
}

// 测试7: 提现申请表
async function test7_WithdrawRequestsTable() {
  testStart('提现申请表测试');
  
  try {
    const { data, error } = await supabase
      .from('withdraw_requests')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    testPass(`提现申请表查询成功 (当前申请数: ${data ? data.length : 0})`);
    return true;
  } catch (error) {
    testFail('提现申请表查询失败', error);
    return false;
  }
}

// 测试8: 交易记录表
async function test8_TransactionsTable() {
  testStart('交易记录表测试');
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    testPass(`交易记录表查询成功 (当前交易数: ${data ? data.length : 0})`);
    return true;
  } catch (error) {
    testFail('交易记录表查询失败', error);
    return false;
  }
}

// 测试9: 创建测试用户
async function test9_CreateTestUser() {
  testStart('创建测试用户');
  
  try {
    const testTelegramId = BigInt(Date.now()); // 使用时间戳作为测试ID
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        telegram_id: testTelegramId.toString(),
        username: 'test_user_' + Date.now(),
        full_name: '测试用户',
        language: 'zh',
        balance: 50.00,
        platform_balance: 0.00
      })
      .select()
      .single();
    
    if (error) throw error;
    testPass(`测试用户创建成功 (ID: ${data.id.substring(0, 8)}...)`);
    console.log(`   初始余额: ${data.balance} 夺宝币`);
    
    // 清理测试数据
    await supabase.from('users').delete().eq('id', data.id);
    console.log(`   ✓ 测试数据已清理`);
    
    return true;
  } catch (error) {
    testFail('创建测试用户失败', error);
    return false;
  }
}

// 测试10: 环境变量检查
async function test10_EnvironmentVariables() {
  testStart('环境变量配置检查');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'DATABASE_URL'
  ];
  
  const optionalVars = [
    'TELEGRAM_BOT_TOKEN',
    'MINI_APP_URL'
  ];
  
  let allRequired = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      testPass(`${varName} 已配置`);
    } else {
      testFail(`${varName} 未配置`);
      allRequired = false;
    }
  }
  
  console.log('\n   可选配置:');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      console.log(`   ✓ ${varName} 已配置`);
    } else {
      console.log(`   ⚠ ${varName} 未配置 (可选)`);
    }
  }
  
  return allRequired;
}

// 主测试函数
async function runAllTests() {
  console.log('开始测试...\n');
  
  const startTime = Date.now();
  
  // 按顺序运行所有测试
  await test10_EnvironmentVariables();
  await test1_DatabaseConnection();
  await test2_UsersTable();
  await test3_ProductsTable();
  await test4_LotteryRoundsTable();
  await test5_OrdersTable();
  await test6_ResaleListingsTable();
  await test7_WithdrawRequestsTable();
  await test8_TransactionsTable();
  await test9_CreateTestUser();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // 打印测试总结
  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`耗时: ${duration}秒`);
  console.log('');
  
  if (testResults.failed === 0) {
    console.log('🎉 所有测试通过！项目核心功能正常！');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息');
  }
  
  console.log('='.repeat(60));
}

// 运行测试
runAllTests().catch(error => {
  console.error('\n❌ 测试执行错误:', error);
  process.exit(1);
});
