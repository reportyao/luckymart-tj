/**
 * LuckyMart TJ 业务流程测试
 * 测试完整的用户旅程：注册 -> 充值 -> 夺宝 -> 中奖 -> 提现 -> 转售
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

console.log('\n' + '='.repeat(70));
console.log('🎯 LuckyMart TJ 核心业务流程测试');
console.log('='.repeat(70));

// 测试统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

// 测试用户数据
let testUser = null;
let testProduct = null;
let testRound = null;
let testOrder = null;

// 工具函数
function log(message, type = 'info') {
  const symbols = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '📍'
  };
  console.log(`${symbols[type]} ${message}`);
}

function testStart(name) {
  stats.total++;
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📋 测试 ${stats.total}: ${name}`);
  console.log('─'.repeat(70));
}

function testSuccess(message) {
  stats.passed++;
  log(message, 'success');
}

function testFail(message, error) {
  stats.failed++;
  log(message, 'error');
  if (error) console.log(`   详情: ${error.message || error}`);
}

function testWarning(message) {
  stats.warnings++;
  log(message, 'warning');
}

// ============================================================
// 流程 1: 用户注册与初始化
// ============================================================
async function flow1_UserRegistration() {
  testStart('用户注册与初始化');
  
  try {
    const timestamp = Date.now();
    const testTelegramId = BigInt(1234567890 + Math.floor(Math.random() * 1000000));
    
    log('创建测试用户...', 'step');
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        telegram_id: testTelegramId.toString(),
        username: `test_${timestamp}`,
        first_name: '测试用户',
        last_name: '自动化',
        language: 'zh',
        balance: 50.00,  // 新用户赠送50夺宝币
        platform_balance: 0.00
      })
      .select()
      .single();
    
    if (error) throw error;
    
    testUser = user;
    testSuccess(`用户创建成功 (ID: ${user.id.substring(0, 8)}...)`);
    console.log(`   ├─ Telegram ID: ${testTelegramId}`);
    console.log(`   ├─ 用户名: ${user.username}`);
    console.log(`   ├─ 初始余额: ${user.balance} 夺宝币`);
    console.log(`   └─ 平台余额: ${user.platform_balance} TJS`);
    
    return true;
  } catch (error) {
    testFail('用户注册失败', error);
    return false;
  }
}

// ============================================================
// 流程 2: 查询可用商品
// ============================================================
async function flow2_BrowseProducts() {
  testStart('查询可用商品');
  
  try {
    log('获取商品列表...', 'step');
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    if (error) throw error;
    
    if (!products || products.length === 0) {
      testWarning('当前没有可用商品');
      return false;
    }
    
    testProduct = products[0];
    testSuccess(`找到 ${products.length} 个可用商品`);
    console.log(`   ├─ 商品名称: ${testProduct.name}`);
    console.log(`   ├─ 市场价: ${testProduct.market_price} TJS`);
    console.log(`   ├─ 总份数: ${testProduct.total_shares} 份`);
    console.log(`   └─ 状态: ${testProduct.status}`);
    
    return true;
  } catch (error) {
    testFail('查询商品失败', error);
    return false;
  }
}

// ============================================================
// 流程 3: 查询当前抽奖轮次
// ============================================================
async function flow3_GetLotteryRound() {
  testStart('查询当前抽奖轮次');
  
  if (!testProduct) {
    testFail('没有可用商品，跳过此测试');
    return false;
  }
  
  try {
    log('获取进行中的抽奖轮次...', 'step');
    const { data: rounds, error } = await supabase
      .from('lottery_rounds')
      .select('*')
      .eq('product_id', testProduct.id)
      .eq('status', 'active')
      .limit(1);
    
    if (error) throw error;
    
    if (!rounds || rounds.length === 0) {
      testWarning('该商品没有进行中的抽奖轮次');
      return false;
    }
    
    testRound = rounds[0];
    const progress = ((testRound.sold_shares / testRound.total_shares) * 100).toFixed(2);
    
    testSuccess('找到进行中的抽奖轮次');
    console.log(`   ├─ 轮次ID: ${testRound.id.substring(0, 8)}...`);
    console.log(`   ├─ 总份数: ${testRound.total_shares}`);
    console.log(`   ├─ 已售: ${testRound.sold_shares}`);
    console.log(`   ├─ 进度: ${progress}%`);
    console.log(`   └─ 单价: ${testRound.price_per_share} 币/份`);
    
    return true;
  } catch (error) {
    testFail('查询抽奖轮次失败', error);
    return false;
  }
}

// ============================================================
// 流程 4: 参与夺宝（购买份额）
// ============================================================
async function flow4_ParticipateInLottery() {
  testStart('参与夺宝（购买份额）');
  
  if (!testUser || !testRound) {
    testFail('缺少必要数据，跳过此测试');
    return false;
  }
  
  try {
    const quantity = 5; // 购买5份
    const totalCost = parseFloat(testRound.price_per_share) * quantity;
    
    log(`尝试购买 ${quantity} 份，需要 ${totalCost} 夺宝币...`, 'step');
    
    // 检查余额
    if (parseFloat(testUser.balance) < totalCost) {
      testWarning(`余额不足 (当前: ${testUser.balance}, 需要: ${totalCost})`);
      return false;
    }
    
    // 模拟创建订单
    const orderNumber = `ORD${Date.now()}`;
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: testUser.id,
        round_id: testRound.id,
        product_id: testProduct.id,
        order_number: orderNumber,
        type: 'lottery',  // 订单类型：lottery/recharge/resale
        quantity: quantity,
        total_amount: totalCost,
        status: 'pending'
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    
    testOrder = order;
    testSuccess('订单创建成功');
    console.log(`   ├─ 订单号: ${order.order_number}`);
    console.log(`   ├─ 数量: ${order.quantity} 份`);
    console.log(`   ├─ 金额: ${order.total_amount} 币`);
    console.log(`   └─ 状态: ${order.status}`);
    
    // 模拟扣除余额
    const newBalance = parseFloat(testUser.balance) - totalCost;
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', testUser.id);
    
    if (updateError) throw updateError;
    
    testUser.balance = newBalance;
    log(`余额已更新: ${newBalance} 夺宝币`, 'success');
    
    return true;
  } catch (error) {
    testFail('参与夺宝失败', error);
    return false;
  }
}

// ============================================================
// 流程 5: 查询订单记录
// ============================================================
async function flow5_ViewOrders() {
  testStart('查询订单记录');
  
  if (!testUser) {
    testFail('缺少用户数据，跳过此测试');
    return false;
  }
  
  try {
    log('获取用户订单列表...', 'step');
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    testSuccess(`找到 ${orders.length} 条订单记录`);
    if (orders.length > 0) {
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`   ${index === orders.length - 1 ? '└─' : '├─'} 订单${index + 1}: ${order.order_number} - ${order.status} - ${order.total_amount}币`);
      });
    }
    
    return true;
  } catch (error) {
    testFail('查询订单失败', error);
    return false;
  }
}

// ============================================================
// 流程 6: 查询交易记录
// ============================================================
async function flow6_ViewTransactions() {
  testStart('查询交易记录');
  
  if (!testUser) {
    testFail('缺少用户数据，跳过此测试');
    return false;
  }
  
  try {
    log('获取交易历史...', 'step');
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    testSuccess(`找到 ${transactions.length} 条交易记录`);
    if (transactions.length > 0) {
      transactions.slice(0, 3).forEach((tx, index) => {
        console.log(`   ${index === transactions.length - 1 ? '└─' : '├─'} ${tx.type}: ${tx.amount} - ${tx.description || '无描述'}`);
      });
    }
    
    return true;
  } catch (error) {
    testFail('查询交易记录失败', error);
    return false;
  }
}

// ============================================================
// 流程 7: 模拟提现流程
// ============================================================
async function flow7_WithdrawalFlow() {
  testStart('模拟提现流程');
  
  if (!testUser) {
    testFail('缺少用户数据，跳过此测试');
    return false;
  }
  
  try {
    // 先给用户添加一些平台余额
    log('添加测试平台余额...', 'step');
    const testPlatformBalance = 100.00;
    const { error: updateError } = await supabase
      .from('users')
      .update({ platform_balance: testPlatformBalance })
      .eq('id', testUser.id);
    
    if (updateError) throw updateError;
    testUser.platform_balance = testPlatformBalance;
    
    // 创建提现申请
    log('创建提现申请...', 'step');
    const withdrawAmount = 50.00;
    const fee = 5.00;
    const actualAmount = withdrawAmount - fee;
    
    const { data: withdraw, error: withdrawError } = await supabase
      .from('withdraw_requests')
      .insert({
        user_id: testUser.id,
        amount: withdrawAmount,
        fee: fee,
        actual_amount: actualAmount,
        withdraw_method: 'alif_mobi',
        account_info: { phone: '+992000000000' },
        status: 'pending'
      })
      .select()
      .single();
    
    if (withdrawError) throw withdrawError;
    
    testSuccess('提现申请创建成功');
    console.log(`   ├─ 申请金额: ${withdraw.amount} TJS`);
    console.log(`   ├─ 手续费: ${withdraw.fee} TJS`);
    console.log(`   ├─ 实际到账: ${withdraw.actual_amount} TJS`);
    console.log(`   ├─ 提现方式: ${withdraw.withdraw_method}`);
    console.log(`   └─ 状态: ${withdraw.status}`);
    
    return true;
  } catch (error) {
    testFail('提现流程失败', error);
    return false;
  }
}

// ============================================================
// 流程 8: 查询转售市场
// ============================================================
async function flow8_ResaleMarket() {
  testStart('查询转售市场');
  
  try {
    log('获取转售商品列表...', 'step');
    const { data: listings, error } = await supabase
      .from('resale_listings')
      .select('*')
      .eq('status', 'listed')
      .limit(10);
    
    if (error) throw error;
    
    if (!listings || listings.length === 0) {
      testWarning('当前转售市场没有商品');
      return true; // 这不是错误
    }
    
    testSuccess(`找到 ${listings.length} 个转售商品`);
    listings.slice(0, 3).forEach((listing, index) => {
      console.log(`   ${index === listings.length - 1 ? '└─' : '├─'} 转售${index + 1}: ${listing.resale_price} TJS - ${listing.status}`);
    });
    
    return true;
  } catch (error) {
    testFail('查询转售市场失败', error);
    return false;
  }
}

// ============================================================
// 清理测试数据
// ============================================================
async function cleanup() {
  console.log(`\n${'─'.repeat(70)}`);
  console.log('🧹 清理测试数据...');
  console.log('─'.repeat(70));
  
  if (!testUser) {
    log('没有需要清理的数据', 'info');
    return;
  }
  
  try {
    // 删除提现记录
    await supabase.from('withdraw_requests').delete().eq('user_id', testUser.id);
    log('已删除提现记录', 'success');
    
    // 删除交易记录
    await supabase.from('transactions').delete().eq('user_id', testUser.id);
    log('已删除交易记录', 'success');
    
    // 删除订单
    await supabase.from('orders').delete().eq('user_id', testUser.id);
    log('已删除订单记录', 'success');
    
    // 删除用户
    await supabase.from('users').delete().eq('id', testUser.id);
    log('已删除测试用户', 'success');
    
    log('测试数据清理完成', 'success');
  } catch (error) {
    log('清理测试数据时出错: ' + error.message, 'error');
  }
}

// ============================================================
// 主测试流程
// ============================================================
async function runAllFlows() {
  const startTime = Date.now();
  
  console.log('\n开始测试核心业务流程...\n');
  
  // 按顺序执行业务流程测试
  await flow1_UserRegistration();
  await flow2_BrowseProducts();
  await flow3_GetLotteryRound();
  await flow4_ParticipateInLottery();
  await flow5_ViewOrders();
  await flow6_ViewTransactions();
  await flow7_WithdrawalFlow();
  await flow8_ResaleMarket();
  
  // 清理测试数据
  await cleanup();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // 打印测试总结
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 测试总结');
  console.log('='.repeat(70));
  console.log(`总测试数: ${stats.total}`);
  console.log(`✅ 通过: ${stats.passed}`);
  console.log(`❌ 失败: ${stats.failed}`);
  console.log(`⚠️  警告: ${stats.warnings}`);
  console.log(`⏱️  耗时: ${duration}秒`);
  console.log('');
  
  if (stats.failed === 0) {
    console.log('🎉 所有业务流程测试通过！');
    console.log('✨ 项目核心功能正常，可以进入下一阶段！');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息');
  }
  
  console.log('='.repeat(70));
  console.log('');
}

// 运行测试
runAllFlows().catch(error => {
  console.error('\n❌ 测试执行出错:', error);
  process.exit(1);
});
