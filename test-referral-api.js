#!/usr/bin/env node

/**
 * 测试 /api/referral/my-code API
 * 
 * 运行方式:
 * 1. 首先启动开发服务器: npm run dev
 * 2. 然后运行测试: node test-referral-api.js
 */

const https = require('https');
const fs = require('fs');

// 配置
const API_BASE_URL = '${API_BASE_URL}';
const TEST_USER_ID = 'test-user-id'; // 需要替换为真实的用户ID;
const TEST_TOKEN = 'test-jwt-token'; // 需要替换为真实的JWT token;

// 模拟的Telegram用户数据
const mockTelegramUser = {
  id: '123456789',
  first_name: '测试用户',
  last_name: '',
  username: 'testuser',
  language_code: 'zh',
  photo_url: ''
};

// 测试配置
const testConfig = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  }
};

// HTTP请求工具函数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          };
          resolve(response);
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 测试用例
async function testReferralAPI() {
  console.log('🧪 开始测试 /api/referral/my-code API\n');

  try {
    // 测试1: 获取邀请码
    console.log('📋 测试1: 获取用户邀请码');
    const response = await makeRequest(`${API_BASE_URL}/api/referral/my-code`, testConfig);
    
    console.log(`状态码: ${response.statusCode}`);
    console.log('响应数据:', JSON.stringify(response.body, null, 2));

    if (response.statusCode === 200) {
      console.log('✅ 测试1通过: 成功获取邀请码\n');
      
      // 验证响应数据结构
      const data = response.body.data;
      if (data.referralCode && data.shareLinks && data.shareTexts) {
        console.log('✅ 数据结构验证通过');
        console.log(`邀请码: ${data.referralCode}`);
        console.log(`Telegram分享链接: ${data.shareLinks.telegram}`);
        console.log(`通用分享链接: ${data.shareLinks.general}`);
        console.log('分享文案:');
        console.log(`- 中文: ${data.shareTexts.zh.substring(0, 100)}...`);
        console.log(`- 俄文: ${data.shareTexts.ru.substring(0, 100)}...`);
        console.log(`- 塔吉克语: ${data.shareTexts.tg.substring(0, 100)}...\n`);
      } else {
        console.log('❌ 数据结构验证失败\n');
      }
    } else {
      console.log('❌ 测试1失败: 无法获取邀请码\n');
    }

    // 测试2: 未授权访问
    console.log('📋 测试2: 未授权访问测试');
    const unauthorizedResponse = await makeRequest(`${API_BASE_URL}/api/referral/my-code`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // 没有 Authorization header
      }
    });
    
    console.log(`状态码: ${unauthorizedResponse.statusCode}`);
    if (unauthorizedResponse.statusCode === 401) {
      console.log('✅ 测试2通过: 正确拒绝未授权访问\n');
    } else {
      console.log('❌ 测试2失败: 未正确处理未授权访问\n');
    }

    // 测试3: 无效Token
    console.log('📋 测试3: 无效Token测试');
    const invalidTokenResponse = await makeRequest(`${API_BASE_URL}/api/referral/my-code`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log(`状态码: ${invalidTokenResponse.statusCode}`);
    if (invalidTokenResponse.statusCode === 401) {
      console.log('✅ 测试3通过: 正确拒绝无效Token\n');
    } else {
      console.log('❌ 测试3失败: 未正确处理无效Token\n');
    }

    console.log('🎉 API测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.log('\n🔧 故障排除建议:');
    console.log('1. 确保开发服务器正在运行 (npm run dev)');
    console.log('2. 确保 TEST_USER_ID 和 TEST_TOKEN 已正确配置');
    console.log('3. 确保数据库中有测试用户数据');
    console.log('4. 检查网络连接和端口配置');
  }
}

// 辅助函数：生成测试Token（仅用于本地测试）
function generateTestJWT() {
  const jwt = require('jsonwebtoken');
  const payload = {
    userId: TEST_USER_ID,
    telegramId: mockTelegramUser.id,
    tokenType: 'access',
    iat: Math.floor(Date.now() / 1000)
  };
  
  const secret = process.env.JWT_SECRET || 'development-secret';
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

// 主函数
async function main() {
  console.log('🚀 LuckyMart TJ - 邀请码API测试工具\n');
  console.log('使用前请确保:');
  console.log('1. 开发服务器已启动 (npm run dev)');
  console.log('2. 数据库已连接并包含测试数据');
  console.log('3. 环境变量已正确配置\n');

  // 如果没有配置token，尝试生成测试token
  if (TEST_TOKEN === 'test-jwt-token') {
    try {
      const generatedToken = generateTestJWT();
      console.log('⚠️  使用生成的测试Token (仅用于本地开发)');
      console.log('Token生成成功，开始测试...\n');
      
      // 更新测试配置
      testConfig.headers.Authorization = `Bearer ${generatedToken}`;
    } catch (error) {
      console.log('⚠️  无法生成测试Token，请手动配置TEST_TOKEN\n');
    }
  }

  await testReferralAPI();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testReferralAPI,
  makeRequest
};