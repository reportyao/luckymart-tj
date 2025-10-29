/**
 * 数据库状态检查和修复脚本
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

console.log('\n' + '='.repeat(60));
console.log('📊 LuckyMart TJ 数据库状态检查');
console.log('='.repeat(60));

async function checkDatabase() {
  console.log('\n1️⃣ 检查商品表...');
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');
  
  if (productsError) {
    console.log('❌ 查询失败:', productsError.message);
  } else {
    console.log(`✅ 共有 ${products.length} 个商品`);
    products.forEach(p => {
      console.log(`   - ${p.name || 'undefined'} (ID: ${p.id.substring(0, 8)}..., 状态: ${p.status})`);
    });
  }

  console.log('\n2️⃣ 检查抽奖轮次表...');
  const { data: rounds, error: roundsError } = await supabase
    .from('lottery_rounds')
    .select('*');
  
  if (roundsError) {
    console.log('❌ 查询失败:', roundsError.message);
  } else {
    console.log(`✅ 共有 ${rounds.length} 个抽奖轮次`);
    rounds.forEach(r => {
      console.log(`   - 轮次 ${r.id.substring(0, 8)}... (状态: ${r.status}, 商品: ${r.product_id.substring(0, 8)}...)`);
    });
    
    // 检查是否有active状态的轮次
    const activeRounds = rounds.filter(r => r.status === 'active');
    if (activeRounds.length === 0) {
      console.log('\n⚠️  没有active状态的抽奖轮次！');
      console.log('   正在修复...');
      
      // 将第一个轮次设置为active
      if (rounds.length > 0) {
        const { error: updateError } = await supabase
          .from('lottery_rounds')
          .update({ status: 'active' })
          .eq('id', rounds[0].id);
        
        if (updateError) {
          console.log('❌ 修复失败:', updateError.message);
        } else {
          console.log('✅ 已将第一个轮次设置为active');
        }
      }
    } else {
      console.log(`✅ 有 ${activeRounds.length} 个active状态的轮次`);
    }
  }

  console.log('\n3️⃣ 检查用户表...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('count');
  
  if (usersError) {
    console.log('❌ 查询失败:', usersError.message);
  } else {
    console.log(`✅ 当前用户数: ${users.length}`);
  }

  console.log('\n4️⃣ 检查订单表...');
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('count');
  
  if (ordersError) {
    console.log('❌ 查询失败:', ordersError.message);
  } else {
    console.log(`✅ 当前订单数: ${orders.length}`);
  }

  console.log('\n5️⃣ 检查转售商品表...');
  const { data: resale, error: resaleError } = await supabase
    .from('resale_listings')
    .select('count');
  
  if (resaleError) {
    console.log('❌ 查询失败:', resaleError.message);
  } else {
    console.log(`✅ 当前转售商品数: ${resale.length}`);
  }

  console.log('\n6️⃣ 检查提现申请表...');
  const { data: withdrawals, error: withdrawalsError } = await supabase
    .from('withdraw_requests')
    .select('count');
  
  if (withdrawalsError) {
    console.log('❌ 查询失败:', withdrawalsError.message);
  } else {
    console.log(`✅ 当前提现申请数: ${withdrawals.length}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 数据库状态检查完成');
  console.log('='.repeat(60));
}

checkDatabase().catch(error => {
  console.error('\n❌ 检查过程出错:', error);
  process.exit(1);
});
