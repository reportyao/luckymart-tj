import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 性能指标数据验证Schema
const PerformanceMetricsSchema = z.object({
  fcp: z.number().optional(),
  lcp: z.number().optional(),
  fid: z.number().optional(),
  cls: z.number().optional(),
  ttfb: z.number().optional(),
  loadTime: z.number().optional(),
  domContentLoaded: z.number().optional(),
  deviceInfo: z.object({
    userAgent: z.string(),
    connectionType: z.string().optional(),
    deviceMemory: z.number().optional(),
    hardwareConcurrency: z.number().optional(),
    maxTouchPoints: z.number().optional(),
    isMobile: z.boolean(),
    isLowEndDevice: z.boolean()
  }).optional(),
  resourceTimings: z.array(z.any()).optional(),
  errors: z.array(z.object({
    type: z.enum(['javascript', 'resource', 'navigation']),
    message: z.string(),
    filename: z.string().optional(),
    lineno: z.number().optional(),
    colno: z.number().optional(),
    timestamp: z.number(),
    stack: z.string().optional()
  })).optional(),
  timestamp: z.string(),
  sessionId: z.string(),
  pageUrl: z.string(),
  referrer: z.string().optional()
});

// 简单的内存存储
const performanceStore: any[] = [];
const MAX_RECORDS = 1000;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'stats';
    const timeRange = searchParams.get('timeRange') || '24h';
    const deviceType = searchParams.get('deviceType');
    const pageUrl = searchParams.get('pageUrl');

    // 移动端性能数据查询
    if (type === 'mobile-stats') {
      const stats = await getMobilePerformanceStats({ timeRange, deviceType, pageUrl });
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    if (type === 'mobile-issues') {
      const issues = getMobilePerformanceIssues({ timeRange, deviceType, pageUrl });
      return NextResponse.json({
        success: true,
        data: issues
      });
    }

    if (type === 'mobile-recommendations') {
      const recommendations = getMobileOptimizationRecommendations({ timeRange, deviceType, pageUrl });
      return NextResponse.json({
        success: true,
        data: recommendations
      });
    }

    // 兼容原有的API
    if (type === 'stats') {
      const stats = {
        totalRequests: performanceStore.length,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        slowQueries: [],
        mobileStats: getMockMobileStats()
      };

      return NextResponse.json({
        success: true,
        data: {
          timestamp: Date.now(),
          performance: stats,
          summary: stats
        }
      });
    }

    if (type === 'export') {
      const exportData = {
        exportTime: new Date().toISOString(),
        performance: performanceStore.slice(-50)
      };

      return NextResponse.json({
        success: true,
        data: exportData
      });
    }

    // 默认返回基本统计
    return NextResponse.json({
      success: true,
      data: {
        timestamp: Date.now(),
        performance: {
          totalRecords: performanceStore.length,
          mobileStats: getMockMobileStats()
        }
      }
    });

  } catch (error: any) {
    console.error('Performance stats error:', error);
    return NextResponse.json(
      { 
        error: '获取性能统计失败', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// 获取移动端性能统计数据
async function getMobilePerformanceStats(filters: {
  timeRange?: string;
  deviceType?: string;
  pageUrl?: string;
}) {
  // 过滤数据
  let filteredData = performanceStore;
  
  if (filters.deviceType === 'mobile') {
    filteredData = filteredData.filter((item : any) => item.deviceInfo?.isMobile);
  } else if (filters.deviceType === 'desktop') {
    filteredData = filteredData.filter((item : any) => !item.deviceInfo?.isMobile);
  }
  
  if (filters.pageUrl) {
    filteredData = filteredData.filter((item : any) => item.pageUrl === filters.pageUrl);
  }

  // 计算平均值
  const stats = {
    overview: {
      totalSessions: filteredData.length,
      averageFcp: calculateAverage(filteredData, 'fcp'),
      averageLcp: calculateAverage(filteredData, 'lcp'),
      averageFid: calculateAverage(filteredData, 'fid'),
      averageCls: calculateAverage(filteredData, 'cls'),
      averageTtfb: calculateAverage(filteredData, 'ttfb'),
      performanceScore: calculateAverageScore(filteredData)
    },
    deviceBreakdown: {
      mobile: calculateDeviceStats(filteredData, true),
      desktop: calculateDeviceStats(filteredData, false)
    },
    recentIssues: getRecentIssues(filteredData),
    trends: calculateTrends(filteredData)
  };

  return stats;
}

// 获取移动端性能问题
function getMobilePerformanceIssues(filters: {
  timeRange?: string;
  deviceType?: string;
  pageUrl?: string;
}) {
  let filteredData = performanceStore;
  
  if (filters.deviceType === 'mobile') {
    filteredData = filteredData.filter((item : any) => item.deviceInfo?.isMobile);
  }
  
  // 汇总所有问题
  const allIssues = filteredData.flatMap(item => item.issues || []);
  const issueCounts = allIssues.reduce((acc: any,  issue: any) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalIssues: allIssues.length,
    topIssues: Object.entries(issueCounts)
      .map(([type, count]) => ({
        type,
        count,
        severity: getIssueSeverity(type)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  };
}

// 获取移动端优化建议
function getMobileOptimizationRecommendations(filters: {
  timeRange?: string;
  deviceType?: string;
  pageUrl?: string;
}) {
  const stats = getMobilePerformanceStats(filters);
  const issues = getMobilePerformanceIssues(filters);
  
  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    actions: string[];
    estimatedImpact: string;
  }> = [];

  // 基于统计数据生成建议
  if (stats.overview.averageFcp > 3000) {
    recommendations.push({
      priority: 'high',
      category: 'Loading Performance',
      title: '优化首次内容绘制',
      description: 'FCP平均值过高，影响用户感知速度',
      actions: [
        '启用图片懒加载',
        '压缩CSS文件',
        '减少阻塞资源',
        '使用CDN加速'
      ],
      estimatedImpact: '可减少30-50% FCP时间'
    });
  }

  if (stats.overview.averageLcp > 4000) {
    recommendations.push({
      priority: 'high',
      category: 'Loading Performance',
      title: '优化最大内容绘制',
      description: 'LCP平均值过高',
      actions: [
        '优化关键资源加载',
        '使用WebP格式图片',
        '预加载关键内容',
        '移除未使用代码'
      ],
      estimatedImpact: '可减少40-60% LCP时间'
    });
  }

  if (issues.totalIssues > 10) {
    recommendations.push({
      priority: 'high',
      category: 'Error Management',
      title: '修复性能问题',
      description: '检测到多个性能问题需要修复',
      actions: [
        '修复JavaScript错误',
        '优化资源加载',
        '改善布局稳定性',
        '启用错误边界'
      ],
      estimatedImpact: '显著提升用户体验'
    });
  }

  return {
    totalRecommendations: recommendations.length,
    recommendations,
    priority: {
      high: recommendations.filter((r : any) => r.priority === 'high').length,
      medium: recommendations.filter((r : any) => r.priority === 'medium').length,
      low: recommendations.filter((r : any) => r.priority === 'low').length
    }
  };
}

// 辅助函数
function calculateAverage(data: any[], field: string): number {
  const values = data.map((item : any) => item[field]).filter(val => typeof val === 'number');
  return values.length > 0 ? values.reduce((sum: any,  val: any) => sum + val, 0) / values.length : 0;
}

function calculateAverageScore(data: any[]): number {
  const scores = data.map((item : any) => item.score?.overall).filter(score => typeof score === 'number');
  return scores.length > 0 ? scores.reduce((sum: any,  score: any) => sum + score, 0) / scores.length : 0;
}

function calculateDeviceStats(data: any[], isMobile: boolean): { sessions: number; avgScore: number } {
  const deviceData = data.filter((item : any) => item.deviceInfo?.isMobile === isMobile);
  return {
    sessions: deviceData.length,
    avgScore: calculateAverageScore(deviceData)
  };
}

function getRecentIssues(data: any[]): any[] {
  const allIssues = data.slice(-10).flatMap(item => item.issues || []);
  return allIssues.slice(0, 5);
}

function calculateTrends(data: any[]): any {
  return {
    fcp: [
      { time: '00:00', value: calculateAverage(data.slice(-6, -4), 'fcp') },
      { time: '04:00', value: calculateAverage(data.slice(-4, -2), 'fcp') },
      { time: '08:00', value: calculateAverage(data.slice(-2), 'fcp') }
    ],
    lcp: [
      { time: '00:00', value: calculateAverage(data.slice(-6, -4), 'lcp') },
      { time: '04:00', value: calculateAverage(data.slice(-4, -2), 'lcp') },
      { time: '08:00', value: calculateAverage(data.slice(-2), 'lcp') }
    ]
  };
}

function getIssueSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
  const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'fcp-slow': 'high',
    'lcp-slow': 'high',
    'fid-high': 'high',
    'cls-high': 'medium',
    'ttfb-slow': 'medium',
    'high-error-count': 'critical'
  };
  return severityMap[type] || 'low';
}

function getMockMobileStats() {
  return {
    totalSessions: 1250,
    averageFcp: 2100,
    averageLcp: 3200,
    averageFid: 85,
    averageCls: 0.12,
    averageTtfb: 1200,
    performanceScore: 78
  };
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';

    if (type === 'mobile') {
      // 只清除移动端性能数据
      performanceStore.splice(0, performanceStore.length);
      return NextResponse.json({
        success: true,
        message: '移动端性能监控数据已清除'
      });
    }

    if (type === 'old') {
      // 清除7天前的数据
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const initialLength = performanceStore.length;
      for (let i = performanceStore.length - 1; i >= 0; i--) {
        const item = performanceStore[i];
        if (new Date(item.timestamp) < sevenDaysAgo) {
          performanceStore.splice(i, 1);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `已清除 ${initialLength - performanceStore.length} 条旧记录`
      });
    }

    // 清除所有数据
    performanceStore.splice(0, performanceStore.length);

    return NextResponse.json({
      success: true,
      message: '所有性能监控数据已清除'
    });

  } catch (error: any) {
    console.error('Clear performance data error:', error);
    return NextResponse.json(
      { 
        error: '清除数据失败', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 检查是否为移动端性能数据
    if (body.timestamp && body.sessionId) {
      // 处理移动端性能监控数据
      const validatedData = PerformanceMetricsSchema.parse(body);
      
      // 计算性能评分
      const score = calculatePerformanceScore(validatedData);
      
      // 识别性能问题
      const issues = identifyPerformanceIssues(validatedData);
      
      // 生成优化建议
      const recommendations = generateOptimizationRecommendations(validatedData, issues);
      
      // 存储数据
      const record = {
        id: Date.now().toString(),
        ...validatedData,
        score,
        issues,
        recommendations,
        processedAt: new Date()
      };
      
      performanceStore.push(record);
      
      // 保持记录数量限制
      if (performanceStore.length > MAX_RECORDS) {
        performanceStore.splice(0, performanceStore.length - MAX_RECORDS);
      }
      
      // 发送告警（如果有问题）
      if (issues.length > 0) {
        console.log('Performance Alert:', {
          pageUrl: validatedData.pageUrl,
          sessionId: validatedData.sessionId,
          issues: issues.map((i : any) => ({ type: i.type, severity: i.severity })),
          timestamp: new Date()
        });
      }
      
      return NextResponse.json({
        success: true,
        message: '移动端性能数据已接收',
        score,
        recommendations
      });
    } else {
      // 兼容旧的API：记录自定义指标
      const { name, value } = body;
      if (name && typeof value === 'number') {
        const record = {
          id: Date.now().toString(),
          type: 'custom-metric',
          name,
          value,
          timestamp: new Date().toISOString()
        };
        
        performanceStore.push(record);
        
        return NextResponse.json({
          success: true,
          message: `指标 ${name} 已记录: ${value}`
        });
      }
    }

    return NextResponse.json(
      { error: '无效的指标数据' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Record metric error:', error);
    return NextResponse.json(
      { 
        error: '记录指标失败', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// 计算性能评分
function calculatePerformanceScore(data: z.infer<typeof PerformanceMetricsSchema>) {
  const scores = {
    fcp: data.fcp ? getScore(data.fcp, 1800, 3500) : null,
    lcp: data.lcp ? getScore(data.lcp, 2500, 4500) : null,
    fid: data.fid ? getScore(data.fid, 100, 300) : null,
    cls: data.cls ? getScore(data.cls * 1000, 0.1, 0.25) : null,
    ttfb: data.ttfb ? getScore(data.ttfb, 800, 1800) : null
  };
  
  const validScores = Object.values(scores).filter(score => score !== null) as number[];
  const overallScore = validScores.length > 0 
    ? validScores.reduce((sum: any,  score: any) => sum + score, 0) / validScores.length 
    : 0;
  
  return {
    ...scores,
    overall: Math.round(overallScore)
  };
}

// 获取单项指标评分
function getScore(value: number, good: number, poor: number): number {
  if (value <= good) return 100;
  if (value >= poor) return 0;
  return Math.round(((poor - value) / (poor - good)) * 100);
}

// 识别性能问题
function identifyPerformanceIssues(data: z.infer<typeof PerformanceMetricsSchema>) {
  const issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric?: string;
    value?: number;
    threshold?: { good: number; poor: number };
  }> = [];
  
  if (data.fcp && data.fcp > 3500) {
    issues.push({
      type: 'fcp-slow',
      severity: data.fcp > 5000 ? 'critical' : 'high',
      message: '首次内容绘制时间过长',
      metric: 'FCP',
      value: data.fcp,
      threshold: { good: 1800, poor: 3500 }
    });
  }
  
  if (data.lcp && data.lcp > 4500) {
    issues.push({
      type: 'lcp-slow',
      severity: data.lcp > 6000 ? 'critical' : 'high',
      message: '最大内容绘制时间过长',
      metric: 'LCP',
      value: data.lcp,
      threshold: { good: 2500, poor: 4500 }
    });
  }
  
  if (data.fid && data.fid > 300) {
    issues.push({
      type: 'fid-high',
      severity: data.fid > 500 ? 'critical' : 'high',
      message: '首次输入延迟过高',
      metric: 'FID',
      value: data.fid,
      threshold: { good: 100, poor: 300 }
    });
  }
  
  if (data.cls && data.cls > 0.25) {
    issues.push({
      type: 'cls-high',
      severity: data.cls > 0.4 ? 'critical' : 'high',
      message: '累积布局偏移过大',
      metric: 'CLS',
      value: data.cls,
      threshold: { good: 0.1, poor: 0.25 }
    });
  }
  
  if (data.ttfb && data.ttfb > 1800) {
    issues.push({
      type: 'ttfb-slow',
      severity: data.ttfb > 3000 ? 'critical' : 'medium',
      message: '服务器响应时间过长',
      metric: 'TTFB',
      value: data.ttfb,
      threshold: { good: 800, poor: 1800 }
    });
  }
  
  if (data.errors && data.errors.length > 5) {
    issues.push({
      type: 'high-error-count',
      severity: data.errors.length > 10 ? 'critical' : 'high',
      message: `页面错误过多：${data.errors.length}个错误`
    });
  }
  
  return issues;
}

// 生成优化建议
function generateOptimizationRecommendations(data: z.infer<typeof PerformanceMetricsSchema>, issues: any[]) {
  const recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    actions: string[];
    estimatedImpact: string;
  }> = [];
  
  issues.forEach((issue : any) => {
    switch (issue.type) {
      case 'fcp-slow':
        recommendations.push({
          priority: 'high',
          category: 'Loading Performance',
          title: '优化首次内容绘制',
          description: 'FCP时间过长影响用户感知速度',
          actions: [
            '启用图片懒加载和预加载',
            '压缩和优化CSS文件',
            '减少关键渲染路径的阻塞资源',
            '使用CDN加速静态资源'
          ],
          estimatedImpact: '可减少30-50%的FCP时间'
        });
        break;
        
      case 'lcp-slow':
        recommendations.push({
          priority: 'high',
          category: 'Loading Performance',
          title: '优化最大内容绘制',
          description: 'LCP通常是页面主要内容，需要重点优化',
          actions: [
            '优化关键资源加载顺序',
            '使用WebP/AVIF等现代图片格式',
            '预加载hero图像和关键字体',
            '移除未使用的CSS和JavaScript'
          ],
          estimatedImpact: '可减少40-60%的LCP时间'
        });
        break;
        
      case 'fid-high':
        recommendations.push({
          priority: 'high',
          category: 'Interactivity',
          title: '改善首次输入响应',
          description: '主线程阻塞导致交互延迟',
          actions: [
            '将长任务分解为小块',
            '使用Web Workers处理复杂计算',
            '避免在事件处理程序中执行重计算',
            '使用requestIdleCallback处理非关键任务'
          ],
          estimatedImpact: '可减少50-70%的FID时间'
        });
        break;
    }
  });
  
  return recommendations;
}