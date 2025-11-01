import fetch from 'node-fetch';
/**
 * calculate-rebate API 测试脚本
 */


// 配置
const API_BASE_URL = '${API_BASE_URL}';
const API_ENDPOINT = '/api/referral/calculate-rebate';

// 测试数据
const testCases = [;
  {
    name: '正常返利计算测试',
    request: {
      order_id: 'test-order-001',
      user_id: 'test-user-001',
      order_amount: 100.50,
      is_first_purchase: false
    },
    expectedStatus: 200
  },
  {
    name: '首次消费延迟发放测试',
    request: {
      order_id: 'test-order-002',
      user_id: 'test-user-002',
      order_amount: 50.00,
      is_first_purchase: true
    },
    expectedStatus: 200
  },
  {
    name: '无效订单ID测试',
    request: {
      order_id: 'invalid-order',
      user_id: 'test-user-003',
      order_amount: 100.00,
      is_first_purchase: false
    },
    expectedStatus: 404
  },
  {
    name: '负数金额测试',
    request: {
      order_id: 'test-order-004',
      user_id: 'test-user-004',
      order_amount: -50.00,
      is_first_purchase: false
    },
    expectedStatus: 400
  },
  {
    name: '缺少必需参数测试',
    request: {
      user_id: 'test-user-005',
      order_amount: 100.00,
      is_first_purchase: false
    },
    expectedStatus: 400
  }
];

/**
 * 测试单个API调用
 */
async function testApiCall(testCase: any): Promise<{
  success: boolean;
  response: any;
  duration: number;
}> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🧪 测试: ${testCase.name}`);
  }
    console.log('请求参数:', JSON.stringify(testCase.request, null, 2));
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': `test-${Date.now()}`,
        'X-Trace-ID': `trace-${Date.now()}`
      },
      body: JSON.stringify(testCase.request)
    });

    const duration = Date.now() - startTime;
    const responseData = await response.json();

    console.log(`状态码: ${response.status}`);
    console.log(`响应时间: ${duration}ms`);
    console.log('响应数据:', JSON.stringify(responseData, null, 2));

    const success = response.status === testCase.expectedStatus;
    
    if (success) {
      console.log('✅ 测试通过');
  }
    } else {
      console.log(`❌ 测试失败: 期望状态码 ${testCase.expectedStatus}，实际 ${response.status}`);
    }

    return {
      success,
      response: responseData,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ 测试失败 (${duration}ms):`, error);
    
    return {
      success: false,
      response: { error: error.message },
      duration
    };
  }
}

/**
 * 运行所有测试
 */
async function runTests(): Promise<void> {
  console.log('🚀 开始测试 calculate-rebate API');
  console.log(`API地址: ${API_BASE_URL}${API_ENDPOINT}`);
  console.log(`测试用例数量: ${testCases.length}`);

  const results = [];
  let passedTests = 0;
  let failedTests = 0;
  let totalDuration = 0;

  for (const testCase of testCases) {
    const result = await testApiCall(testCase);
    results.push(result);
    
    if (result.success) {
      passedTests++;
    } else {
      failedTests++;
    }
    
    totalDuration += result.duration;
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 生成测试报告
  console.log('\n📊 测试报告');
  console.log('='.repeat(50));
  console.log(`总测试用例: ${testCases.length}`);
  console.log(`通过: ${passedTests} ✅`);
  console.log(`失败: ${failedTests} ❌`);
  console.log(`成功率: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
  console.log(`总耗时: ${totalDuration}ms`);
  console.log(`平均耗时: ${(totalDuration / testCases.length).toFixed(1)}ms`);

  if (failedTests === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查上述错误信息。');
  }

  // 保存详细测试报告
  const report = {
    timestamp: new Date().toISOString(),
    api_endpoint: API_ENDPOINT,
    summary: {
      total: testCases.length,
      passed: passedTests,
      failed: failedTests,
      success_rate: (passedTests / testCases.length) * 100,
      total_duration: totalDuration,
      avg_duration: totalDuration / testCases.length
    },
    test_cases: testCases.map((testCase, index) => ({
      name: testCase.name,
      expected_status: testCase.expectedStatus,
      request: testCase.request,
      result: results[index]
    }))
  };

  console.log('\n📋 详细测试报告已生成');
  
  return report;
}

/**
 * 健康检查
 */
async function healthCheck(): Promise<boolean> {
  try {
    console.log('🏥 执行健康检查...');
    
    const response = await fetch(`${API_BASE_URL}/api/monitoring/health`);
    
    if (response.ok) {
      console.log('✅ API服务正常运行');
      return true;
    } else {
      console.log(`❌ API服务异常: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 无法连接到API服务:', error.message);
    return false;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🔍 calculate-rebate API 测试工具');
  console.log('='.repeat(50));

  // 健康检查
  const isHealthy = await healthCheck();
  if (!isHealthy) {
    console.log('\n❌ API服务不可用，请确保服务器正在运行');
    process.exit(1);
  }

  // 运行测试
  const report = await runTests();

  // 返回适当的退出码
  process.exit(report.summary.failed === 0 ? 0 : 1);
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

export ;