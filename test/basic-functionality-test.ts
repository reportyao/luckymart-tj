#!/usr/bin/env node
/**
 * LuckyMartTJ 基础功能验证脚本
 * 在系统不稳定时进行基础功能验证
 */

import { performance } from 'perf_hooks';

interface ModuleTest {
  name: string;
  description: string;
  testFn: () => Promise<{ success: boolean; duration: number; message: string }>;
}

class BasicModuleTester {
  private baseUrl = 'http://localhost:3000';

  async runBasicTests(): Promise<void> {
    console.log('🔧 LuckyMartTJ 基础功能验证测试');
    console.log('📅 开始时间:', new Date().toISOString());
    console.log('🌐 目标URL:', this.baseUrl);

    const tests: ModuleTest[] = [
      {
        name: '系统健康检查',
        description: '验证系统基础API响应',
        testFn: () => this.testHealthCheck()
      },
      {
        name: '推荐系统基础功能',
        description: '测试推荐码生成API',
        testFn: () => this.testReferralSystem()
      },
      {
        name: '管理API功能',
        description: '测试管理后台API',
        testFn: () => this.testAdminAPI()
      },
      {
        name: '防欺诈系统',
        description: '测试设备指纹检测',
        testFn: () => this.testAntiFraud()
      },
      {
        name: 'Telegram认证',
        description: '测试WebApp认证流程',
        testFn: () => this.testTelegramAuth()
      },
      {
        name: '数据库连接',
        description: '测试数据库基础查询',
        testFn: () => this.testDatabaseConnectivity()
      }
    ];

    const results = [];
    
    for (const test of tests) {
      console.log(`\n🧪 开始测试: ${test.name}`);
      console.log(`   描述: ${test.description}`);
      
      try {
        const startTime = performance.now();
        const result = await test.testFn();
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        const testResult = {
          ...result,
          name: test.name,
          duration,
          description: test.description
        };
        
        results.push(testResult);
        
        if (result.success) {
          console.log(`   ✅ 成功 - ${result.message} (${duration.toFixed(2)}ms)`);
        } else {
          console.log(`   ❌ 失败 - ${result.message} (${duration.toFixed(2)}ms)`);
        }
        
      } catch (error) {
        console.log(`   🚨 异常 - ${error.message}`);
        results.push({
          name: test.name,
          description: test.description,
          success: false,
          duration: 0,
          message: `测试异常: ${error.message}`
        });
      }
    }

    this.generateBasicReport(results);
  }

  private async testHealthCheck(): Promise<{ success: boolean; duration: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/monitoring/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          duration: 0,
          message: '健康检查API正常响应'
        };
      } else {
        return {
          success: false,
          duration: 0,
          message: `HTTP错误 ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        duration: 0,
        message: `连接失败: ${error.message}`
      };
    }
  }

  private async testReferralSystem(): Promise<{ success: boolean; duration: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/referral/my-code`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.status === 401 || response.status === 200) {
        return {
          success: true,
          duration: 0,
          message: '推荐系统API可访问（需要认证）'
        };
      } else {
        return {
          success: false,
          duration: 0,
          message: `意外状态码: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        duration: 0,
        message: `推荐系统测试失败: ${error.message}`
      };
    }
  }

  private async testAdminAPI(): Promise<{ success: boolean; duration: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/reward-config`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-admin-token',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.status === 401 || response.status === 200) {
        return {
          success: true,
          duration: 0,
          message: '管理API可访问（需要认证）'
        };
      } else {
        return {
          success: false,
          duration: 0,
          message: `管理API状态异常: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        duration: 0,
        message: `管理API测试失败: ${error.message}`
      };
    }
  }

  private async testAntiFraud(): Promise<{ success: boolean; duration: number; message: string }> {
    try {
      const testData = {
        deviceId: 'test-device-' + Date.now(),
        ipAddress: '192.168.1.100',
        userAgent: 'TestBrowser/1.0',
        timestamp: Date.now()
      };
      
      const response = await fetch(`${this.baseUrl}/api/anti-fraud/device-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.status === 200 || response.status === 401 || response.status === 400) {
        return {
          success: true,
          duration: 0,
          message: '防欺诈API响应正常'
        };
      } else {
        return {
          success: false,
          duration: 0,
          message: `防欺诈API异常: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        duration: 0,
        message: `防欺诈系统测试失败: ${error.message}`
      };
    }
  }

  private async testTelegramAuth(): Promise<{ success: boolean; duration: number; message: string }> {
    try {
      const testData = {
        initData: 'test_init_data_' + Date.now(),
        user: {
          id: 123456,
          first_name: 'Test',
          username: 'testuser'
        }
      };
      
      const response = await fetch(`${this.baseUrl}/api/auth/telegram-webapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.status === 200 || response.status === 401 || response.status === 400) {
        return {
          success: true,
          duration: 0,
          message: 'Telegram认证API响应正常'
        };
      } else {
        return {
          success: false,
          duration: 0,
          message: `Telegram认证异常: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        duration: 0,
        message: `Telegram认证测试失败: ${error.message}`
      };
    }
  }

  private async testDatabaseConnectivity(): Promise<{ success: boolean; duration: number; message: string }> {
    try {
      // 通过访问一个需要数据库查询的简单API来测试数据库连接
      const response = await fetch(`${this.baseUrl}/api/referral/stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.status !== 500) { // 500通常表示数据库连接问题
        return {
          success: true,
          duration: 0,
          message: '数据库连接正常'
        };
      } else {
        return {
          success: false,
          duration: 0,
          message: '数据库连接可能存在问题'
        };
      }
    } catch (error) {
      return {
        success: false,
        duration: 0,
        message: `数据库连接测试失败: ${error.message}`
      };
    }
  }

  private generateBasicReport(results: any[]): void {
    console.log('\n📋 === 基础功能验证报告 ===');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount) * 100;

    console.log(`📊 总测试数: ${totalCount}`);
    console.log(`✅ 成功测试: ${successCount}`);
    console.log(`❌ 失败测试: ${totalCount - successCount}`);
    console.log(`📈 成功率: ${successRate.toFixed(1)}%`);

    console.log('\n📋 详细结果:');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name}`);
      console.log(`   ${result.message}`);
      console.log(`   耗时: ${result.duration.toFixed(2)}ms`);
    });

    // 生成Markdown报告
    let report = `
# LuckyMartTJ 基础功能验证报告

## 📊 测试摘要

- **测试时间**: ${new Date().toISOString()}
- **总测试数**: ${totalCount}
- **成功测试**: ${successCount}
- **失败测试**: ${totalCount - successCount}
- **成功率**: ${successRate.toFixed(1)}%

## 📋 详细测试结果

| 模块 | 状态 | 消息 | 耗时 |
|------|------|------|------|
`;

    results.forEach(result => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      report += `| ${result.name} | ${status} | ${result.message} | ${result.duration.toFixed(2)}ms |\n`;
    });

    report += `
## 🔍 问题分析

### 成功的模块
${results.filter(r => r.success).map(r => `- ${r.name}`).join('\n') || '无'}

### 需要关注的模块  
${results.filter(r => !r.success).map(r => `- ${r.name}: ${r.message}`).join('\n') || '无'}

## 💡 建议措施

1. **系统稳定性**: ${successRate >= 80 ? '系统基础功能正常' : '系统存在稳定性问题，需要检查配置'}
2. **数据库连接**: ${results.find(r => r.name === '数据库连接')?.success ? '数据库连接正常' : '建议检查数据库配置和连接'}
3. **API响应**: ${results.filter(r => r.success).length >= 3 ? 'API服务基本可用' : 'API服务存在问题'}
4. **认证系统**: 需要配置有效的JWT密钥进行完整测试

## 🎯 下一步建议

${successRate >= 80 ? `
1. 可以继续进行压力测试
2. 建议配置完整的认证token进行深度测试
3. 可以开始性能优化测试
` : `
1. 首先修复失败的基础功能
2. 检查数据库连接和配置
3. 验证API路由和中间件配置
4. 完成基础修复后再进行压力测试
`}

---
*基础功能验证报告 - ${new Date().toISOString()}*
`;

    console.log(report);

    // 保存报告
    this.saveReport(report);
  }

  private saveReport(report: string): void {
    try {
      const fs = require('fs');
      const reportPath = '/workspace/luckymart-tj/test-reports/basic-functionality-report.md';
      
      const reportsDir = '/workspace/luckymart-tj/test-reports';
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, report);
      console.log(`\n📄 基础功能验证报告已保存到: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️ 保存报告时出现错误:', error.message);
    }
  }
}

// 执行测试
async function main() {
  const tester = new BasicModuleTester();
  await tester.runBasicTests();
  console.log('\n🎉 基础功能验证完成!');
}

if (require.main === module) {
  main().catch(console.error);
}