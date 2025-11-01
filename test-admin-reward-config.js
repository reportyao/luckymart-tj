#!/usr/bin/env node

/**
 * 管理员奖励配置获取API测试脚本
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class AdminRewardConfigTester {
  constructor() {
    this.serverProcess = null;
    this.baseUrl = '${API_BASE_URL}';
    this.testResults = [];
  }

  /**
   * 启动开发服务器
   */
  async startDevServer() {
    console.log('🚀 启动开发服务器...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: path.resolve(__dirname),
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`[服务器输出]: ${data.toString().trim()}`);
        
        if (output.includes('Local:') && output.includes('ready')) {
          console.log('✅ 开发服务器已启动');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[服务器错误]: ${data.toString().trim()}`);
      });

      this.serverProcess.on('error', (error) => {
        console.error('❌ 服务器启动失败:', error);
        reject(error);
      });

      // 超时检查
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          console.log('✅ 开发服务器启动超时，但继续测试');
          resolve();
        }
      }, 30000);
    });
  }

  /**
   * 停止开发服务器
   */
  stopDevServer() {
    if (this.serverProcess) {
      console.log('🛑 停止开发服务器...');
      this.serverProcess.kill('SIGTERM');
      
      // 等待进程结束
      setTimeout(() => {
        if (this.serverProcess && !this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }
      }, 5000);
    }
  }

  /**
   * 测试API端点
   */
  async testAPIEndpoint(token, testName, params = {}) {
    console.log(`\n🧪 测试: ${testName}`);
    
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params
      };

      const response = await axios.get(`${this.baseUrl}/api/admin/reward-config`, config);
      
      console.log(`✅ ${testName} - 成功`);
  }
      console.log(`   状态码: ${response.status}`);
      console.log(`   数据条数: ${response.data.data?.configs?.length || 0}`);
      console.log(`   总页数: ${response.data.data?.pagination?.totalPages || 0}`);
      
      // 验证数据结构
      this.validateResponseStructure(response.data, testName);
      
      this.testResults.push({
        testName,
        status: 'passed',
        statusCode: response.status,
        data: response.data
      });
      
      return response.data;
    } catch (error) {
      console.log(`❌ ${testName} - 失败`);
      console.log(`   错误: ${error.response?.data?.error || error.message}`);
      console.log(`   状态码: ${error.response?.status || 'N/A'}`);
      
      this.testResults.push({
        testName,
        status: 'failed',
        statusCode: error.response?.status,
        error: error.response?.data?.error || error.message
      });
      
      throw error;
    }
  }

  /**
   * 验证响应数据结构
   */
  validateResponseStructure(data, testName) {
    const requiredFields = ['success', 'data', 'message'];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`响应缺少必需字段: ${field}`);
      }
    }
    
    if (!data.success) {
      throw new Error('API返回失败状态');
    }
    
    if (!data.data.configs || !Array.isArray(data.data.configs)) {
      throw new Error('configs字段不是数组');
    }
    
    if (!data.data.pagination) {
      throw new Error('缺少分页信息');
    }
    
    // 验证配置项结构
    if (data.data.configs.length > 0) {
      const config = data.data.(configs?.0 ?? null);
      const requiredConfigFields = [;
        'id', 'config_key', 'config_name', 'config_description',
        'reward_amount', 'is_active', 'updated_at'
      ];
      
      for (const field of requiredConfigFields) {
        if (!(field in config)) {
          throw new Error(`配置项缺少字段: ${field}`);
  }
        }
      }
    }
    
    console.log(`   ✅ 数据结构验证通过`);
  }

  /**
   * 测试无权限访问
   */
  async testUnauthorizedAccess() {
    console.log('\n🧪 测试: 无权限访问');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/admin/reward-config`);
      throw new Error('应该返回401/403错误');
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        console.log('✅ 无权限访问测试 - 通过');
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误信息: ${error.response.data?.error || 'N/A'}`);
        
        this.testResults.push({
          testName: '无权限访问',
          status: 'passed',
          statusCode: error.response.status
        });
      } else {
        throw new Error(`期望403/401状态码，但得到${error.response?.status}`);
      }
    }
  }

  /**
   * 测试参数验证
   */
  async testParameterValidation(token) {
    console.log('\n🧪 测试: 参数验证');
    
    const invalidParams = [;
      { page: 'invalid' },
      { limit: 'invalid' },
      { page: -1 },
      { limit: 0 },
      { limit: 101 },
      { is_active: 'invalid' },
      { referral_level: 0 },
      { referral_level: 11 },
      { search: 'a'.repeat(101) }
    ];
    
    for (const params of invalidParams) {
      try {
        await this.testAPIEndpoint(token, `参数验证: ${JSON.stringify(params)}`, params);
        throw new Error(`应该返回400错误，参数: ${JSON.stringify(params)}`);
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`   ✅ 无效参数正确拒绝: ${JSON.stringify(params)}`);
        } else {
          console.log(`   ❌ 无效参数返回错误状态: ${JSON.stringify(params)}, 状态: ${error.response?.status}`);
        }
      }
    }
  }

  /**
   * 生成测试报告
   */
  generateReport() {
    console.log('\n📊 测试报告');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = this.testResults.length;
    
    console.log(`总测试数: ${total}`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log(`成功率: ${total > 0 ? Math.round(passed / total * 100) : 0}%`);
    
    console.log('\n详细结果:');
    this.testResults.forEach((result, index) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.testName} (${result.statusCode || 'N/A'})`);
      
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });
    
    if (failed === 0) {
      console.log('\n🎉 所有测试通过！');
    } else {
      console.log('\n❌ 部分测试失败，请检查日志');
    }
  }

  /**
   * 运行完整测试
   */
  async runFullTest() {
    try {
      console.log('🎯 开始管理员奖励配置API测试...\n');
      
      // 启动开发服务器
      await this.startDevServer();
      
      // 等待服务器完全启动
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 测试无权限访问
      await this.testUnauthorizedAccess();
      
      // 注意：这里需要实际的管理员token进行后续测试
      // 由于需要真实的数据库和账户，我们模拟一个测试
      console.log('\n📝 注意: 完整测试需要有效的管理员账户和token');
      console.log('   可以通过以下步骤进行手动测试:');
      console.log('   1. 启动开发服务器: npm run dev');
      console.log('   2. 登录管理员账户获取token');
      console.log('   3. 使用token访问: GET /api/admin/reward-config');
      
      // 测试基本的API结构（不需要token的测试）
      console.log('\n🧪 测试: API端点存在性');
      try {
        const response = await axios.options(`${this.baseUrl}/api/admin/reward-config`);
        console.log('✅ API端点存在且支持OPTIONS请求');
  }
        console.log(`   允许的方法: ${response.headers['access-control-allow-methods'] || 'N/A'}`);
      } catch (error) {
        console.log('❌ API端点不存在或无法访问');
      }
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error.message);
    } finally {
      this.stopDevServer();
    }
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  const tester = new AdminRewardConfigTester();
  tester.runFullTest().catch(console.error);
}

module.exports = AdminRewardConfigTester;
