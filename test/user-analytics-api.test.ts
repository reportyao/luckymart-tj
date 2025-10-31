/**
 * 用户行为分析系统API测试脚本
 * 
 * 功能：
 * - 测试所有5个用户行为分析API端点
 * - 测试GET和POST请求
 * - 测试管理员权限验证
 * - 测试错误处理
 * - 提供详细的测试报告
 * 
 * 使用方法：
 * npm run test:user-analytics-api
 * 或者：
 * npx tsx test/user-analytics-api.test.ts
 */

import axios, { AxiosResponse } from 'axios';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// 测试配置
const BASE_URL = process.env.API_BASE_URL || '${API_BASE_URL}';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test_admin_token';
const INVALID_TOKEN = 'invalid_token';

// 接口响应类型定义
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface BehaviorLog {
  id: string;
  user_id: string;
  behavior_type: string;
  created_at: string;
}

interface EngagementStat {
  id: string;
  user_id: string;
  date: string;
  engagement_score: number;
}

interface RetentionData {
  id: string;
  user_id: string;
  registration_date: string;
  day_7_retention: boolean;
}

interface SpendingData {
  id: string;
  user_id: string;
  total_spent: number;
  spending_segment: string;
}

interface UserSegment {
  id: string;
  user_id: string;
  segment_name: string;
  segment_type: string;
}

// 测试类
class UserAnalyticsApiTester {
  private baseURL: string;
  private adminHeaders: Record<string, string>;
  private invalidHeaders: Record<string, string>;
  private testResults: Array<{ test: string; status: 'PASS' | 'FAIL'; message?: string; duration: number }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.adminHeaders = {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    };
    this.invalidHeaders = {
      'Authorization': `Bearer ${INVALID_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  // 记录测试结果
  private recordResult(testName: string, status: 'PASS' | 'FAIL', message?: string, duration?: number) {
    this.testResults.push({
      test: testName,
      status,
      message,
      duration: duration || 0
    });
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${testName}${message ? `: ${message}` : ''}${duration ? ` (${duration}ms)` : ''}`);
  }

  // 测试请求执行器
  private async testRequest<T>(
    testName: string,
    requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>,
    expectStatus: number = 200,
    shouldSucceed: boolean = true
  ): Promise<T | null> {
    const startTime = Date.now();
    try {
      const response = await requestFn();
      const duration = Date.now() - startTime;
      
      const isSuccess = response.status === expectStatus;
      const hasCorrectStructure = typeof response.data.success === 'boolean';
      
      if (shouldSucceed && isSuccess && hasCorrectStructure) {
        this.recordResult(testName, 'PASS', undefined, duration);
        return response.data.data || null;
      } else if (!shouldSucceed && !isSuccess) {
        this.recordResult(testName, 'PASS', `正确返回错误状态码 ${expectStatus}`, duration);
        return null;
      } else {
        this.recordResult(testName, 'FAIL', `期望状态码 ${expectStatus}，实际 ${response.status}`, duration);
        return null;
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      if (!shouldSucceed && error.response?.status === expectStatus) {
        this.recordResult(testName, 'PASS', `正确返回错误状态码 ${expectStatus}`, duration);
        return null;
      } else {
        const errorMessage = error.response?.data?.error || error.message || '未知错误';
        this.recordResult(testName, 'FAIL', errorMessage, duration);
        return null;
      }
    }
  }

  // 测试用户行为统计API - GET请求
  async testBehaviorApiGet(): Promise<void> {
    console.log('\n📊 测试用户行为统计 API - GET');
    
    // 测试1: 获取所有用户行为数据（分页）
    const data1 = await this.testRequest<{
      behaviorLogs: BehaviorLog[];
      pagination: any;
      statistics: any;
      behaviorTypeDistribution: any[];
      heatmap: any[];
    }>(
      '获取用户行为数据（分页）',
      () => axios.get(`${this.baseURL}/api/admin/users/behavior?limit=10&offset=0`, { headers: this.adminHeaders })
    );
    
    // 测试2: 按用户ID过滤
    if (data1?.behaviorLogs && data1.behaviorLogs.length > 0) {
      const userId = data1.behaviorLogs[0].user_id;
      await this.testRequest(
        '按用户ID过滤行为数据',
        () => axios.get(`${this.baseURL}/api/admin/users/behavior?userId=${userId}`, { headers: this.adminHeaders })
      );
    }
    
    // 测试3: 按日期范围过滤
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await this.testRequest(
      '按日期范围过滤',
      () => axios.get(`${this.baseURL}/api/admin/users/behavior?startDate=${yesterday}&endDate=${today}`, { headers: this.adminHeaders })
    );
    
    // 测试4: 按行为类型过滤
    await this.testRequest(
      '按行为类型过滤',
      () => axios.get(`${this.baseURL}/api/admin/users/behavior?behaviorType=login`, { headers: this.adminHeaders })
    );
    
    // 测试5: 无效的权限令牌
    await this.testRequest(
      '无效权限令牌测试',
      () => axios.get(`${this.baseURL}/api/admin/users/behavior`, { headers: this.invalidHeaders }),
      403,
      false
    );
  }

  // 测试用户行为统计API - POST请求
  async testBehaviorApiPost(): Promise<void> {
    console.log('\n📝 测试用户行为统计 API - POST');
    
    // 测试1: 记录新的用户行为
    const newBehavior = {
      userId: 'test-user-id',
      behaviorType: 'login',
      behaviorSubtype: 'mobile',
      sessionId: 'test-session-123',
      deviceInfo: {
        platform: 'iOS',
        version: '15.0'
      },
      metadata: {
        source: 'api_test',
        test_run: 'user_analytics_test'
      }
    };
    
    await this.testRequest(
      '记录新用户行为',
      () => axios.post(`${this.baseURL}/api/admin/users/behavior`, newBehavior, { headers: this.adminHeaders })
    );
    
    // 测试2: 记录充值行为
    const rechargeBehavior = {
      userId: 'test-user-id',
      behaviorType: 'recharge',
      amount: 100.50,
      metadata: {
        payment_method: 'telegram_payments',
        currency: 'USD'
      }
    };
    
    await this.testRequest(
      '记录充值行为',
      () => axios.post(`${this.baseURL}/api/admin/users/behavior`, rechargeBehavior, { headers: this.adminHeaders })
    );
    
    // 测试3: 无效数据测试
    await this.testRequest(
      '无效数据测试',
      () => axios.post(`${this.baseURL}/api/admin/users/behavior`, { invalid: 'data' }, { headers: this.adminHeaders }),
      400,
      false
    );
  }

  // 测试用户参与度统计API - GET请求
  async testEngagementApiGet(): Promise<void> {
    console.log('\n🎯 测试用户参与度统计 API - GET');
    
    // 测试1: 获取参与度统计数据
    await this.testRequest<{
      engagementStats: EngagementStat[];
      summary: any;
      distribution: any[];
      trends: any[];
    }>(
      '获取参与度统计数据',
      () => axios.get(`${this.baseURL}/api/admin/users/engagement?limit=20`, { headers: this.adminHeaders })
    );
    
    // 测试2: 按特定日期获取
    const today = new Date().toISOString().split('T')[0];
    await this.testRequest(
      '按特定日期获取',
      () => axios.get(`${this.baseURL}/api/admin/users/engagement?date=${today}`, { headers: this.adminHeaders })
    );
    
    // 测试3: 排序和筛选
    await this.testRequest(
      '按参与度评分排序',
      () => axios.get(`${this.baseURL}/api/admin/users/engagement?sortBy=engagement_score&sortOrder=desc&limit=10`, { headers: this.adminHeaders })
    );
  }

  // 测试用户参与度统计API - PUT请求
  async testEngagementApiPut(): Promise<void> {
    console.log('\n🔄 测试用户参与度统计 API - PUT');
    
    // 测试1: 更新参与度统计
    const updateData = {
      userId: 'test-user-id',
      date: new Date().toISOString().split('T')[0],
      loginCount: 3,
      sessionDuration: 1800, // 30分钟
      pageViews: 25,
      interactionsCount: 15
    };
    
    await this.testRequest(
      '更新参与度统计',
      () => axios.put(`${this.baseURL}/api/admin/users/engagement`, updateData, { headers: this.adminHeaders })
    );
    
    // 测试2: 更新不存在的用户
    await this.testRequest(
      '更新不存在的用户',
      () => axios.put(`${this.baseURL}/api/admin/users/engagement`, {
        userId: 'non-existent-user-id',
        date: new Date().toISOString().split('T')[0]
      }, { headers: this.adminHeaders }),
      404,
      false
    );
  }

  // 测试用户留存分析API
  async testRetentionApi(): Promise<void> {
    console.log('\n🔁 测试用户留存分析 API');
    
    // 测试1: 获取留存概览
    await this.testRequest<{
      overview: any;
      cohortAnalysis: any[];
      retentionFunnel: any[];
    }>(
      '获取留存概览',
      () => axios.get(`${this.baseURL}/api/admin/users/retention?type=overview`, { headers: this.adminHeaders })
    );
    
    // 测试2: 获取同期群分析
    await this.testRequest(
      '获取同期群分析',
      () => axios.get(`${this.baseURL}/api/admin/users/retention?type=cohort&cohortType=weekly`, { headers: this.adminHeaders })
    );
    
    // 测试3: 获取特定用户留存数据
    await this.testRequest(
      '获取特定用户留存数据',
      () => axios.get(`${this.baseURL}/api/admin/users/retention?type=user&userId=test-user-id`, { headers: this.adminHeaders })
    );
    
    // 测试4: POST请求更新留存分析
    const updateRetentionData = {
      userId: 'test-user-id',
      registrationDate: '2023-01-01',
      day1Retention: true,
      day7Retention: false,
      day30Retention: false
    };
    
    await this.testRequest(
      '更新留存分析数据',
      () => axios.post(`${this.baseURL}/api/admin/users/retention`, updateRetentionData, { headers: this.adminHeaders })
    );
    
    // 测试5: 无效的type参数
    await this.testRequest(
      '无效type参数测试',
      () => axios.get(`${this.baseURL}/api/admin/users/retention?type=invalid`, { headers: this.adminHeaders }),
      400,
      false
    );
  }

  // 测试用户消费分析API
  async testSpendingApi(): Promise<void> {
    console.log('\n💰 测试用户消费分析 API');
    
    // 测试1: 获取消费概览
    await this.testRequest<{
      overview: any;
      rfmAnalysis: any[];
      highValueCustomers: any[];
    }>(
      '获取消费概览',
      () => axios.get(`${this.baseURL}/api/admin/users/spending?type=overview`, { headers: this.adminHeaders })
    );
    
    // 测试2: 获取用户消费详情
    await this.testRequest(
      '获取用户消费详情',
      () => axios.get(`${this.baseURL}/api/admin/users/spending?type=user&userId=test-user-id`, { headers: this.adminHeaders })
    );
    
    // 测试3: 获取消费分群数据
    await this.testRequest(
      '获取消费分群数据',
      () => axios.get(`${this.baseURL}/api/admin/users/spending?type=segments`, { headers: this.adminHeaders })
    );
    
    // 测试4: POST请求更新消费分析
    const updateSpendingData = {
      userId: 'test-user-id',
      totalSpent: 500.00,
      totalTransactions: 10,
      averageOrderValue: 50.00,
      customerLifetimeValue: 750.00
    };
    
    await this.testRequest(
      '更新消费分析数据',
      () => axios.post(`${this.baseURL}/api/admin/users/spending`, updateSpendingData, { headers: this.adminHeaders })
    );
  }

  // 测试用户分群API
  async testSegmentsApi(): Promise<void> {
    console.log('\n👥 测试用户分群 API');
    
    // 测试1: GET获取用户分群
    await this.testRequest<{
      segmentUsers: UserSegment[];
      segmentDistribution: any[];
      behaviorSegmentation: any[];
      spendingSegmentation: any[];
    }>(
      '获取用户分群',
      () => axios.get(`${this.baseURL}/api/admin/users/segments?limit=20`, { headers: this.adminHeaders })
    );
    
    // 测试2: 按分群类型过滤
    await this.testRequest(
      '按分群类型过滤',
      () => axios.get(`${this.baseURL}/api/admin/users/segments?segmentType=behavior_segment`, { headers: this.adminHeaders })
    );
    
    // 测试3: POST创建新分群
    const newSegment = {
      segmentName: '测试分群',
      description: 'API测试创建的分群',
      segmentType: 'behavior_segment',
      criteria: {
        minEngagementScore: 70,
        maxDaysInactive: 7
      }
    };
    
    await this.testRequest(
      '创建新用户分群',
      () => axios.post(`${this.baseURL}/api/admin/users/segments`, newSegment, { headers: this.adminHeaders })
    );
    
    // 测试4: PUT更新分群
    const updateSegmentData = {
      segmentId: 'test-segment-id',
      segmentName: '更新后的分群名称',
      description: '更新的分群描述',
      criteria: {
        minEngagementScore: 80,
        maxDaysInactive: 5
      }
    };
    
    await this.testRequest(
      '更新用户分群',
      () => axios.put(`${this.baseURL}/api/admin/users/segments`, updateSegmentData, { headers: this.adminHeaders })
    );
    
    // 测试5: DELETE删除分群
    await this.testRequest(
      '删除用户分群',
      () => axios.delete(`${this.baseURL}/api/admin/users/segments?segmentId=test-segment-id`, { headers: this.adminHeaders })
    );
  }

  // 运行所有测试
  async runAllTests(): Promise<void> {
    console.log('🚀 开始用户行为分析API测试...\n');
    console.log(`📡 测试地址: ${this.baseURL}`);
    console.log(`🔑 测试令牌: ${ADMIN_TOKEN.substring(0, 10)}...\n`);

    const startTime = Date.now();
    
    try {
      await this.testBehaviorApiGet();
      await this.testBehaviorApiPost();
      await this.testEngagementApiGet();
      await this.testEngagementApiPut();
      await this.testRetentionApi();
      await this.testSpendingApi();
      await this.testSegmentsApi();
      
      const totalTime = Date.now() - startTime;
      this.printTestReport(totalTime);
      
    } catch (error) {
      console.error('❌ 测试执行过程中发生错误:', error);
    }
  }

  // 打印测试报告
  private printTestReport(totalTime: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 测试报告');
    console.log('='.repeat(60));
    
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const totalTests = this.testResults.length;
    
    console.log(`📊 测试统计:`);
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   ✅ 通过: ${passedTests}`);
    console.log(`   ❌ 失败: ${failedTests}`);
    console.log(`   成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   总耗时: ${totalTime}ms`);
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   - ${result.test}: ${result.message}`);
        });
    }
    
    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试都通过了！');
    } else {
      console.log(`\n⚠️  有 ${failedTests} 个测试失败，请检查API实现`);
    }
    
    console.log('='.repeat(60));
  }
}

// Jest测试用例
describe('用户行为分析API测试', () => {
  let tester: UserAnalyticsApiTester;

  beforeAll(async () => {
    tester = new UserAnalyticsApiTester(BASE_URL);
    console.log('🧪 测试环境准备完成\n');
  });

  afterAll(async () => {
    console.log('\n🧹 测试环境清理完成');
  });

  test('用户行为统计API测试', async () => {
    await tester.testBehaviorApiGet();
    await tester.testBehaviorApiPost();
  });

  test('用户参与度统计API测试', async () => {
    await tester.testEngagementApiGet();
    await tester.testEngagementApiPut();
  });

  test('用户留存分析API测试', async () => {
    await tester.testRetentionApi();
  });

  test('用户消费分析API测试', async () => {
    await tester.testSpendingApi();
  });

  test('用户分群API测试', async () => {
    await tester.testSegmentsApi();
  });

  test('完整API测试套件', async () => {
    await tester.runAllTests();
  });
});

// 如果直接运行此文件
if (require.main === module) {
  const tester = new UserAnalyticsApiTester(BASE_URL);
  tester.runAllTests().catch(console.error);
}

export { UserAnalyticsApiTester };