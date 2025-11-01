import { createClient } from '@supabase/supabase-js';
// 成本监控系统API测试

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseUrl);

// 测试配置
const API_BASE = '/api/admin/costs';

async function testCostMonitoringAPIs() {
  console.log('🚀 开始成本监控系统API测试...\n');

  try {
    // 1. 测试每日成本统计API
    await testDailyCostAPI();
    
    // 2. 测试ROI分析API
    await testROIAnalysisAPI();
    
    // 3. 测试成本细分API
    await testCostBreakdownAPI();
    
    // 4. 测试成本趋势分析API
    await testCostTrendsAPI();
    
    // 5. 测试成本计算函数
    await testCostCalculationFunctions();
    
    console.log('\n✅ 所有API测试完成！');
  }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
}

// 测试每日成本统计API
async function testDailyCostAPI() {
  console.log('📊 测试每日成本统计API...');
  
  // GET请求 - 获取成本统计数据
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(`${API_BASE}/daily?date=${today}&limit=10`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`GET /daily 失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ GET /daily 成功:', {
    dataCount: data.data?.length || 0,
    hasSummary: !!data.summary
  });
  
  // POST请求 - 计算成本数据
  const postResponse = await fetch(`${API_BASE}/daily`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      date: today,
      forceRecalculate: false
    })
  });
  
  const postData = await postResponse.json();
  console.log('✅ POST /daily 成功:', postData.success ? '成本计算完成' : postData.error);
  
  console.log('📊 每日成本统计API测试完成\n');
}

// 测试ROI分析API
async function testROIAnalysisAPI() {
  console.log('📈 测试ROI分析API...');
  
  // GET请求 - 获取ROI分析数据
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(;
    `${API_BASE}/roi?startDate=${today}&endDate=${today}&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`GET /roi 失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ GET /roi 成功:', {
    dataCount: data.data?.length || 0,
    totalRevenue: data.summary?.totalRevenue || 0,
    roi: data.summary?.roiPercentage || 0
  });
  
  // POST请求 - 计算ROI数据
  const postResponse = await fetch(`${API_BASE}/roi`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      analysisType: 'period',
      analysisPeriod: 'daily',
      date: today
    })
  });
  
  const postData = await postResponse.json();
  console.log('✅ POST /roi 成功:', postData.success ? 'ROI计算完成' : postData.error);
  
  console.log('📈 ROI分析API测试完成\n');
}

// 测试成本细分API
async function testCostBreakdownAPI() {
  console.log('📋 测试成本细分API...');
  
  // GET请求 - 获取成本细分数据
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(;
    `${API_BASE}/breakdown?startDate=${today}&endDate=${today}`,
    {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`GET /breakdown 失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ GET /breakdown 成功:', {
    dataCount: data.data?.length || 0,
    hasBreakdown: !!data.breakdownByUserType,
    totalCost: data.summary?.totalCost || 0
  });
  
  // POST请求 - 计算成本细分数据
  const postResponse = await fetch(`${API_BASE}/breakdown`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      breakdownType: 'user_type',
      date: today
    })
  });
  
  const postData = await postResponse.json();
  console.log('✅ POST /breakdown 成功:', postData.success ? '成本细分计算完成' : postData.error);
  
  console.log('📋 成本细分API测试完成\n');
}

// 测试成本趋势分析API
async function testCostTrendsAPI() {
  console.log('📊 测试成本趋势分析API...');
  
  // GET请求 - 获取成本趋势数据
  const response = await fetch(`${API_BASE}/trends?period=7d&groupBy=daily`, {
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`GET /trends 失败: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('✅ GET /trends 成功:', {
    dataCount: data.data?.length || 0,
    totalCost: data.summary?.totalCost || 0,
    trendDirection: data.trendAnalysis?.trendDirection || 'unknown'
  });
  
  console.log('📊 成本趋势分析API测试完成\n');
}

// 测试成本计算函数
async function testCostCalculationFunctions() {
  console.log('🔧 测试成本计算函数...');
  
  const today = new Date().toISOString().split('T')[0];
  
  // 测试激励成本计算函数
  const { data: incentiveData, error: incentiveError } = await supabase;
    .rpc('calculate_daily_incentive_cost', { target_date: today });
  
  if (incentiveError) {
    console.log('❌ 激励成本计算函数错误:', incentiveError);
  } else {
    console.log('✅ 激励成本计算函数成功:', incentiveData);
  }
  
  // 测试邀请裂变成本计算函数
  const { data: referralData, error: referralError } = await supabase;
    .rpc('calculate_daily_referral_cost', { target_date: today });
  
  if (referralError) {
    console.log('❌ 邀请裂变成本计算函数错误:', referralError);
  } else {
    console.log('✅ 邀请裂变成本计算函数成功:', referralData);
  }
  
  // 测试成本数据聚合函数
  const { data: aggregateData, error: aggregateError } = await supabase;
    .rpc('aggregate_daily_cost_statistics', { target_date: today });
  
  if (aggregateError) {
    console.log('❌ 成本数据聚合函数错误:', aggregateError);
  } else {
    console.log('✅ 成本数据聚合函数成功');
  }
  
  console.log('🔧 成本计算函数测试完成\n');
}

// 数据库连接测试
async function testDatabaseConnection() {
  console.log('🗄️ 测试数据库连接...');
  
  // 测试基本表查询
  const { data, error } = await supabase;
    .from('cost_statistics')
    .select('count')
    .limit(1);
  
  if (error) {
    console.log('❌ 数据库连接失败:', error);
    return false;
  } else {
    console.log('✅ 数据库连接成功');
    return true;
  }
}

// 主测试函数
async function main() {
  try {
    // 测试数据库连接
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('数据库连接失败，终止测试');
  }
    }
    
    // 运行API测试
    await testCostMonitoringAPIs();
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}

export ;