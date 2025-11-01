import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
#!/usr/bin/env tsx

/**
 * 用户行为分析系统示例数据生成脚本
 * 
 * 功能：
 * - 生成100个测试用户的行为日志
 * - 生成30天的用户参与度统计数据
 * - 生成用户留存分析记录
 * - 生成用户消费分析数据
 * - 生成至少5个用户分群
 * 
 * 使用方法：
 * npm run seed:user-analytics
 */


const prisma = new PrismaClient();

// 配置参数
const TEST_USER_COUNT = 100;
const DAYS_TO_GENERATE = 30;
const BEHAVIOR_TYPES = [;
  'login', 'logout', 'registration', 'recharge', 'lottery_participation', 
  'product_purchase', 'withdrawal', 'invitation', 'page_view', 'click'
];

const ENGAGEMENT_LEVELS = ['very_low', 'low', 'medium', 'high'];
const SPENDING_LEVELS = ['low', 'medium', 'high', 'vip'];
const RISK_LEVELS = ['low', 'medium', 'high'];

// 生成随机数据工具函数
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDecimal(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function getRandomDate(daysAgo: number): Date {
  const now = new Date();
  const randomDays = Math.random() * daysAgo;
  return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
}

function getRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateTestUsers(): Promise<string[]> {
  console.log('生成测试用户...');
  const userIds: string[] = [];
  
  for (let i = 0; i < TEST_USER_COUNT; i++) {
    const user = await prisma.users.create({
      data: {
        telegramId: `test_user_${i + 1}`,
        username: `testuser${i + 1}`,
        firstName: `TestUser${i + 1}`,
        lastName: `User${i + 1}`,
        preferredLanguage: ['tg-TJ', 'en-US', 'ru-RU', 'zh-CN'][getRandomInt(0, 3)],
        balance: getRandomDecimal(0, 1000, 2),
        platformBalance: getRandomDecimal(0, 500, 2),
        luckyCoins: getRandomDecimal(0, 10000, 2),
        vipLevel: getRandomInt(0, 3),
        totalSpent: getRandomDecimal(0, 5000, 2),
        freeDailyCount: getRandomInt(0, 5),
        referredByUserId: Math.random() > 0.7 && userIds.length > 0 
          ? userIds[getRandomInt(0, userIds.length - 1)]
          : null,
        referralCode: getRandomString(8).toUpperCase(),
        createdAt: getRandomDate(60) // 最多60天前注册
      }
    });
    
    userIds.push(user.id);
    
    if ((i + 1) % 10 === 0) {
      console.log(`已创建 ${i + 1}/${TEST_USER_COUNT} 个测试用户`);
    }
  }
  
  console.log(`✅ 成功创建 ${TEST_USER_COUNT} 个测试用户`);
  return userIds;
}

async function generateBehaviorLogs(userIds: string[]): Promise<void> {
  console.log('生成用户行为日志...');
  const logsToCreate: any[] = [];
  
  // 为每个用户生成30天内的行为日志
  for (const userId of userIds) {
    const userCreatedAt = await prisma.users.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });
    
    if (!userCreatedAt) continue; {
    
    const daysSinceRegistration = Math.ceil(;
      (Date.now() - userCreatedAt.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    const activeDays = Math.min(daysSinceRegistration, DAYS_TO_GENERATE);
    
    // 为每个活跃天生成1-10个行为记录
    for (let day = 0; day < activeDays; day++) {
      const behaviorsCount = getRandomInt(1, 10);
      
      for (let i = 0; i < behaviorsCount; i++) {
        const behaviorDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000);
        behaviorDate.setHours(getRandomInt(0, 23), getRandomInt(0, 59), getRandomInt(0, 59));
        
        logsToCreate.push({
          id: uuidv4(),
          user_id: userId,
          behavior_type: BEHAVIOR_TYPES[getRandomInt(0, BEHAVIOR_TYPES.length - 1)],
          behavior_subtype: ['mobile', 'web', 'api'][getRandomInt(0, 2)],
          session_id: `session_${getRandomString(16)}`,
          device_info: {
            platform: ['iOS', 'Android', 'Web', 'Telegram'][getRandomInt(0, 3)],
            version: `${getRandomInt(10, 20)}.${getRandomInt(0, 9)}.${getRandomInt(0, 9)}`
          },
          location_info: {
            country: ['TJ', 'RU', 'US', 'CN'][getRandomInt(0, 3)],
            city: ['Dushanbe', 'Moscow', 'New York', 'Beijing'][getRandomInt(0, 3)]
          },
          ip_address: `${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`,
          user_agent: `TestBot/${getRandomInt(1, 10)} (Platform)`,
          amount: getRandomDecimal(0, 100, 2),
          duration_seconds: getRandomInt(1, 3600),
          metadata: {
            source: 'test_data_generation',
            test_run_id: getRandomString(8)
          },
          created_at: behaviorDate
        });
      }
    }
  }
  
  // 批量插入数据
  const batchSize = 1000;
  for (let i = 0; i < logsToCreate.length; i += batchSize) {
    const batch = logsToCreate.slice(i, i + batchSize);
    await prisma.userBehaviorLogs.createMany({
      data: batch
    });
    console.log(`已插入行为日志 ${Math.min(i + batchSize, logsToCreate.length)}/${logsToCreate.length}`);
  }
  
  console.log(`✅ 成功生成 ${logsToCreate.length} 条用户行为日志`);
}

async function generateEngagementStats(userIds: string[]): Promise<void> {
  console.log('生成用户参与度统计数据...');
  const statsToCreate: any[] = [];
  
  // 为每个用户生成最近30天的参与度数据
  for (const userId of userIds) {
    for (let day = 0; day < DAYS_TO_GENERATE; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(0, 0, 0, 0);
      
      // 根据用户活跃度生成不同的统计数据
      const isActive = Math.random() > 0.3; // 70%的概率活跃;
      const baseEngagement = isActive ? getRandomInt(20, 95) : getRandomInt(0, 30);
      
      statsToCreate.push({
        id: uuidv4(),
        user_id: userId,
        date: date,
        login_count: isActive ? getRandomInt(1, 8) : 0,
        total_session_duration: isActive ? getRandomInt(300, 3600) : 0, // 5分钟到1小时
        page_views: isActive ? getRandomInt(5, 50) : 0,
        interactions_count: isActive ? getRandomInt(3, 25) : 0,
        features_used: isActive ? 
          ['lottery', 'recharge', 'products', 'profile', 'invitation'].slice(0, getRandomInt(1, 5)) : [],
        last_activity_time: isActive ? new Date(date.getTime() + getRandomInt(0, 24) * 60 * 60 * 1000) : null,
        engagement_score: baseEngagement,
        created_at: date,
        updated_at: date
      });
    }
  }
  
  // 批量插入数据
  const batchSize = 500;
  for (let i = 0; i < statsToCreate.length; i += batchSize) {
    const batch = statsToCreate.slice(i, i + batchSize);
    await prisma.userEngagementStats.createMany({
      data: batch
    });
    console.log(`已插入参与度统计 ${Math.min(i + batchSize, statsToCreate.length)}/${statsToCreate.length}`);
  }
  
  console.log(`✅ 成功生成 ${statsToCreate.length} 条用户参与度统计`);
}

async function generateRetentionAnalysis(userIds: string[]): Promise<void> {
  console.log('生成用户留存分析数据...');
  const retentionData: any[] = [];
  
  for (const userId of userIds) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    });
    
    if (!user) continue; {
    
    const registrationDate = user.createdAt;
    const daysSinceRegistration = Math.ceil(;
      (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // 生成留存数据
    const retentionRecord = {
      id: uuidv4(),
      user_id: userId,
      registration_date: registrationDate,
      cohort_date: new Date(registrationDate.getTime() - (registrationDate.getDay() * 24 * 60 * 60 * 1000)),
      cohort_type: 'weekly',
      day_0_retention: true, // 注册当天总是留存
      day_1_retention: daysSinceRegistration >= 1 ? Math.random() > 0.4 : false, // 60%次日留存
      day_3_retention: daysSinceRegistration >= 3 ? Math.random() > 0.6 : false, // 40% 3日留存
      day_7_retention: daysSinceRegistration >= 7 ? Math.random() > 0.7 : false, // 30% 7日留存
      day_14_retention: daysSinceRegistration >= 14 ? Math.random() > 0.8 : false, // 20% 14日留存
      day_30_retention: daysSinceRegistration >= 30 ? Math.random() > 0.85 : false, // 15% 30日留存
      day_60_retention: daysSinceRegistration >= 60 ? Math.random() > 0.9 : false, // 10% 60日留存
      day_90_retention: daysSinceRegistration >= 90 ? Math.random() > 0.92 : false, // 8% 90日留存
      last_activity_date: Math.random() > 0.3 ? new Date() : null,
      total_active_days: getRandomInt(1, Math.min(daysSinceRegistration, 30)),
      created_at: registrationDate,
      updated_at: new Date()
    };
    
    retentionData.push(retentionRecord);
  }
  
  await prisma.retentionAnalysis.createMany({
    data: retentionData
  });
  
  console.log(`✅ 成功生成 ${retentionData.length} 条用户留存分析记录`);
}

async function generateSpendingAnalysis(userIds: string[]): Promise<void> {
  console.log('生成用户消费分析数据...');
  const spendingData: any[] = [];
  
  for (const userId of userIds) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { createdAt: true, totalSpent: true }
    });
    
    if (!user) continue; {
    
    const registrationDate = user.createdAt;
    const totalSpent = user.totalSpent;
    const daysSinceRegistration = Math.ceil(;
      (Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // 计算交易相关指标
    const totalTransactions = getRandomInt(0, Math.min(20, daysSinceRegistration));
    const totalOrders = getRandomInt(0, Math.min(15, daysSinceRegistration));
    const completedOrders = Math.floor(totalOrders * getRandomDecimal(0.8, 1.0, 2));
    const cancelledOrders = totalOrders - completedOrders;
    const averageOrderValue = totalOrders > 0 ? totalSpent / completedOrders : 0;
    const firstPurchaseDate = totalOrders > 0 ? 
      new Date(registrationDate.getTime() + getRandomInt(1, Math.min(30, daysSinceRegistration)) * 24 * 60 * 60 * 1000) : null;
    const lastPurchaseDate = totalOrders > 0 ? 
      new Date(registrationDate.getTime() + getRandomInt(1, daysSinceRegistration) * 24 * 60 * 60 * 1000) : null;
    
    // 计算购买频率
    const purchaseFrequency = totalTransactions > 1 ? 
      Math.floor(daysSinceRegistration / totalTransactions) : daysSinceRegistration;
    
    // 确定消费分群
    let spendingSegment = 'low';
    if (totalSpent >= 5000 || totalOrders >= 50) {
      spendingSegment = 'vip';
    } else if (totalSpent >= 1000 || totalOrders >= 10) {
      spendingSegment = 'high';
    } else if (totalSpent >= 200 || totalOrders >= 3) {
      spendingSegment = 'medium';
    }
    
    // 计算流失风险
    const daysSinceLastActivity = getRandomInt(0, daysSinceRegistration);
    const churnRiskScore = getRandomDecimal(0, 100, 2);
    
    // 生成消费分析记录
    spendingData.push({
      id: uuidv4(),
      user_id: userId,
      registration_date: registrationDate,
      first_purchase_date: firstPurchaseDate,
      last_purchase_date: lastPurchaseDate,
      total_transactions: totalTransactions,
      total_spent: totalSpent,
      total_orders: totalOrders,
      completed_orders: completedOrders,
      cancelled_orders: cancelledOrders,
      average_order_value: averageOrderValue,
      customer_lifetime_value: totalSpent * 1.5, // 简化的CLV计算
      purchase_frequency_days: purchaseFrequency,
      days_since_last_purchase: lastPurchaseDate ? 
        Math.ceil((Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)) : daysSinceRegistration,
      high_value_customer: totalSpent >= 1000,
      churn_risk_score: churnRiskScore,
      spending_segment: spendingSegment,
      last_recharge_amount: getRandomDecimal(0, 200, 2),
      total_recharge_amount: getRandomDecimal(0, totalSpent * 1.2, 2),
      created_at: registrationDate,
      updated_at: new Date()
    });
  }
  
  await prisma.spendingAnalysis.createMany({
    data: spendingData
  });
  
  console.log(`✅ 成功生成 ${spendingData.length} 条用户消费分析记录`);
}

async function generateUserSegments(userIds: string[]): Promise<void> {
  console.log('生成用户分群数据...');
  const segmentData: any[] = [];
  
  // 定义5个不同的用户分群
  const segments = [;
    {
      segment_name: '高价值活跃用户',
      description: '高消费、高活跃度的核心用户群体',
      segment_type: 'behavior_segment',
      criteria: {
        min_total_spent: 1000,
        min_engagement_score: 80,
        min_active_days: 20
      }
    },
    {
      segment_name: '潜力新用户',
      description: '注册时间较短但表现出良好增长潜力的用户',
      segment_type: 'behavior_segment', 
      criteria: {
        max_registration_days: 14,
        min_engagement_score: 50,
        min_lucky_coins: 100
      }
    },
    {
      segment_name: '流失风险用户',
      description: '需要重点关注和召回的用户群体',
      segment_type: 'risk_segment',
      criteria: {
        max_churn_risk_score: 70,
        max_days_since_last_activity: 7
      }
    },
    {
      segment_name: '高消费VIP用户',
      description: '平台的高消费VIP用户群体',
      segment_type: 'spending_segment',
      criteria: {
        spending_segment: 'vip',
        min_total_spent: 5000
      }
    },
    {
      segment_name: '活跃抽奖用户',
      description: '频繁参与彩票活动的用户群体',
      segment_type: 'behavior_segment',
      criteria: {
        min_lottery_participation: 10,
        max_registration_days: 90
      }
    }
  ];
  
  // 为每个分群分配用户
  for (const [index, segment] of segments.entries()) {
    const userCount = getRandomInt(15, 25); // 每个分群15-25个用户;
    const segmentUsers = userIds.slice(0, userCount);
    
    for (const userId of segmentUsers) {
      segmentData.push({
        id: uuidv4(),
        user_id: userId,
        segment_name: segment.segment_name,
        description: segment.description,
        segment_type: segment.segment_type,
        engagement_level: ENGAGEMENT_LEVELS[getRandomInt(0, ENGAGEMENT_LEVELS.length - 1)],
        spending_level: SPENDING_LEVELS[getRandomInt(0, SPENDING_LEVELS.length - 1)],
        risk_level: RISK_LEVELS[getRandomInt(0, RISK_LEVELS.length - 1)],
        value_score: getRandomDecimal(10, 100, 2),
        criteria: segment.criteria,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  await prisma.userSegments.createMany({
    data: segmentData
  });
  
  console.log(`✅ 成功生成 ${segmentData.length} 条用户分群记录，共 ${segments.length} 个分群`);
}

async function main() {
  console.log('🚀 开始生成用户行为分析示例数据...\n');
  
  try {
    // 清理现有数据（可选）
    console.log('清理现有测试数据...');
  }
    await prisma.userSegments.deleteMany({});
    await prisma.spendingAnalysis.deleteMany({});
    await prisma.retentionAnalysis.deleteMany({});
    await prisma.userEngagementStats.deleteMany({});
    await prisma.userBehaviorLogs.deleteMany({});
    console.log('✅ 清理完成\n');
    
    // 生成数据
    const userIds = await generateTestUsers();
    console.log('');
    
    await generateBehaviorLogs(userIds);
    console.log('');
    
    await generateEngagementStats(userIds);
    console.log('');
    
    await generateRetentionAnalysis(userIds);
    console.log('');
    
    await generateSpendingAnalysis(userIds);
    console.log('');
    
    await generateUserSegments(userIds);
    console.log('');
    
    console.log('🎉 示例数据生成完成！');
    console.log(`📊 生成统计：`);
    console.log(`   - 测试用户：${TEST_USER_COUNT} 个`);
    console.log(`   - 数据时间范围：${DAYS_TO_GENERATE} 天`);
    console.log(`   - 行为日志：约 ${TEST_USER_COUNT * DAYS_TO_GENERATE * 5} 条`);
    console.log(`   - 参与度统计：${TEST_USER_COUNT * DAYS_TO_GENERATE} 条`);
    console.log(`   - 留存分析：${TEST_USER_COUNT} 条`);
    console.log(`   - 消费分析：${TEST_USER_COUNT} 条`);
    console.log(`   - 用户分群：${TEST_USER_COUNT * 0.75} 条`);
    
    // 显示数据样本
    console.log('\n📋 数据样本：');
    const sampleBehaviorLog = await prisma.userBehaviorLogs.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('   行为日志样本:', sampleBehaviorLog?.behavior_type || '无数据');
    
    const sampleEngagementStat = await prisma.userEngagementStats.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('   参与度样本:', sampleEngagementStat?.engagement_score || '无数据');
    
    const sampleRetention = await prisma.retentionAnalysis.findFirst();
    console.log('   留存样本:', sampleRetention?.day_7_retention || '无数据');
    
    const sampleSpending = await prisma.spendingAnalysis.findFirst();
    console.log('   消费样本:', sampleSpending?.spending_segment || '无数据');
    
    const sampleSegment = await prisma.userSegments.findFirst();
    console.log('   分群样本:', sampleSegment?.segment_name || '无数据');
    
  } catch (error) {
    console.error('❌ 生成数据时发生错误:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export { generateTestUsers, generateBehaviorLogs, generateEngagementStats, generateRetentionAnalysis, generateSpendingAnalysis, generateUserSegments };
}}