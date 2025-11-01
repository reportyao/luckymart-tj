/**
 * 钱包功能测试脚本
 * 
 * 使用方法：
 * 1. 确保钱包功能的API端点已部署
 * 2. 获得有效的JWT token
 * 3. 运行: node test-wallet.js
 */

const fs = require('fs');
const https = require('https');

const API_BASE_URL = '${API_BASE_URL}/api';
const JWT_TOKEN = 'your-jwt-token-here'; // 替换为实际token;

// 测试配置
const TEST_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`
  }
};

// 测试结果记录
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// HTTP请求工具函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      ...options,
      headers: {
        ...TEST_CONFIG.headers,
        ...options.headers
      }
    };

    const req = https.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: response
          });
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(TEST_CONFIG.timeout);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 记录测试结果
function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const result = {
    name: testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`${status} ${testName} ${message ? '- ' + message : ''}`);
  } else {
    testResults.failed++;
    console.log(`${status} ${testName} ${message ? '- ' + message : ''}`);
  }
}

// 测试1: 获取余额
async function testGetBalance() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/user/wallet/balance`);
    
    if (response.statusCode === 200 && response.data.success) {
      const { balance, luckyCoins, currency } = response.data.data;
      
      logTest(
        '获取钱包余额',
        true,
        `余额: ${balance} ${currency}, 幸运币: ${luckyCoins}`
      );
      
      return response.data.data;
    } else {
      logTest('获取钱包余额', false, response.data.error || '未知错误');
      return null;
    }
  } catch (error) {
    logTest('获取钱包余额', false, error.message);
    return null;
  }
}

// 测试2: 获取交易记录
async function testGetTransactions() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/user/wallet/transactions`);
    
    if (response.statusCode === 200 && response.data.success) {
      const transactions = response.data.data;
      logTest(
        '获取交易记录',
        true,
        `获取到 ${transactions.length} 条交易记录`
      );
      return transactions;
    } else {
      logTest('获取交易记录', false, response.data.error || '未知错误');
      return [];
    }
  } catch (error) {
    logTest('获取交易记录', false, error.message);
    return [];
  }
}

// 测试3: 测试余额转幸运币
async function testTransfer() {
  try {
    const balanceData = await testGetBalance();
    if (!balanceData || balanceData.balance < 1) {
      logTest('余额转幸运币', false, '余额不足或无法获取余额');
      return false;
    }

    // 测试转换 1 TJS
    const transferAmount = 1;
    const response = await makeRequest(;
      `${API_BASE_URL}/user/wallet/transfer`,
      {
        method: 'POST',
        body: {
          amount: transferAmount,
          luckyCoins: transferAmount
        }
      }
    );

    if (response.statusCode === 200 && response.data.success) {
      logTest(
        '余额转幸运币',
        true,
        `成功转换 ${transferAmount} TJS 到 ${transferAmount} LC`
      );
      return true;
    } else {
      logTest('余额转幸运币', false, response.data.error || '转换失败');
      return false;
    }
  } catch (error) {
    logTest('余额转幸运币', false, error.message);
    return false;
  }
}

// 测试4: 测试认证
async function testAuthentication() {
  try {
    // 测试无效token
    const invalidResponse = await makeRequest(;
      `${API_BASE_URL}/user/wallet/balance`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token'
        }
      }
    );

    if (invalidResponse.statusCode === 401) {
      logTest('认证测试', true, '正确拒绝了无效token');
      return true;
    } else {
      logTest('认证测试', false, '未能正确验证token');
      return false;
    }
  } catch (error) {
    logTest('认证测试', false, error.message);
    return false;
  }
}

// 测试5: 测试API响应格式
async function testApiResponseFormat() {
  try {
    const response = await makeRequest(`${API_BASE_URL}/user/wallet/balance`);
    
    if (response.statusCode === 200 && response.data.success !== undefined) {
      logTest('API响应格式', true, '响应格式正确');
      return true;
    } else {
      logTest('API响应格式', false, '响应格式错误');
      return false;
    }
  } catch (error) {
    logTest('API响应格式', false, error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🧪 开始钱包功能测试...\n');
  
  if (JWT_TOKEN === 'your-jwt-token-here') {
    console.log('❌ 错误: 请先设置 JWT_TOKEN 常量');
    process.exit(1);
  }

  // 运行所有测试
  await testAuthentication();
  await testApiResponseFormat();
  await testGetBalance();
  await testGetTransactions();
  await testTransfer();

  // 输出测试结果
  console.log('\n📊 测试结果总结:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📈 成功率: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

  // 输出详细结果
  console.log('\n📋 详细测试结果:');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}${test.message ? ': ' + test.message : ''}`);
  });

  // 保存测试结果到文件
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.passed + testResults.failed,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2) + '%'
    },
    tests: testResults.tests
  };

  fs.writeFileSync(
    'wallet-test-results.json',
    JSON.stringify(reportData, null, 2)
  );

  console.log('\n💾 详细测试结果已保存到 wallet-test-results.json');

  // 根据测试结果决定退出码
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});