# 性能和稳定性测试套件

## 概述

这是一个综合的性能和稳定性测试套件，包含性能监控、压力测试、稳定性测试、性能分析等多个组件，旨在确保系统的高性能和稳定性。

## 组件架构

```
luckymart-tj/
├── tests/
│   └── performance-stability.test.ts      # 综合性能测试套件
├── utils/
│   ├── performance-monitor.ts             # 性能监控工具
│   ├── performance-analyzer.ts            # 性能分析工具
│   ├── performance-benchmarks.ts          # 性能基准配置
│   ├── stress-tester.ts                   # 压力测试工具
│   └── translation-loader.ts              # 翻译加载工具
├── scripts/
│   └── run-performance-tests.ts           # 测试执行脚本
└── docs/
    └── PERFORMANCE_TESTING_GUIDE.md       # 本使用指南
```

## 主要功能

### 1. 性能监控 (Performance Monitor)
- 实时性能指标收集
- Core Web Vitals监控 (LCP, FID, CLS)
- 内存使用监控
- 网络请求监控
- 渲染性能监控
- 性能告警和优化建议

### 2. 压力测试 (Stress Tester)
- 高并发用户模拟
- 数据库压力测试
- API响应时间测试
- 系统资源使用监控
- 性能瓶颈识别

### 3. 稳定性测试 (Stability Tests)
- 长时间运行测试
- 内存泄漏检测
- 异常情况处理
- 系统恢复能力测试

### 4. 性能分析 (Performance Analyzer)
- 性能数据分析和趋势识别
- 瓶颈根因分析
- 优化机会识别
- 预测性分析

### 5. 性能基准 (Performance Benchmarks)
- Core Web Vitals标准
- 移动端性能目标
- 国际化性能目标
- API性能标准
- 数据库性能标准

## 快速开始

### 环境要求

```bash
Node.js >= 16.0
npm >= 8.0
Jest >= 29.0
```

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
# 运行综合性能测试套件
npm test -- --testPathPattern=performance-stability

# 运行完整测试套件（包括性能测试）
node scripts/run-performance-tests.ts
```

### 运行特定类型测试

```bash
# 只运行性能监控测试
npm test performance-stability.test.ts

# 运行移动端性能测试
npm test -- --testPathPattern=mobile

# 运行国际化性能测试
npm test -- --testPathPattern=multilingual
```

## 详细使用指南

### 1. 性能监控

#### 基本使用

```typescript
import { ComprehensivePerformanceMonitor } from '../utils/performance-monitor';

// 创建监控实例
const monitor = new ComprehensivePerformanceMonitor({
  enabled: true,
  interval: 5000,        // 5秒间隔
  retentionDays: 7,      // 保留7天数据
  enableRealTimeMonitoring: true,
  enableBundleAnalysis: true
});

// 开始监控
monitor.startMonitoring();

// 获取性能报告
const report = monitor.generateReport();
console.log(`性能评分: ${report.overallScore}/100`);

// 停止监控
monitor.stopMonitoring();
```

#### 配置选项

```typescript
const config = {
  enabled: true,                    // 是否启用监控
  interval: 5000,                   // 监控间隔(ms)
  retentionDays: 7,                 // 数据保留天数
  alertThresholds: {                // 告警阈值
    loadTime: 4000,                 // 加载时间 < 4s
    translationLoadTime: 300,       // 翻译加载 < 300ms
    memoryUsage: 80 * 1024 * 1024,  // 内存使用 < 80MB
    errorRate: 0.05,                // 错误率 < 5%
    cacheHitRate: 0.7               // 缓存命中率 > 70%
  },
  enableRealTimeMonitoring: true,   // 实时监控
  enableUserTracking: true,         // 用户跟踪
  enableBundleAnalysis: true,       // Bundle分析
  enableMobileOptimization: true    // 移动端优化
};
```

#### 性能指标

监控收集以下关键指标：

- **加载性能**: LCP, FCP, FID, TTI, CLS
- **内存指标**: 堆使用量, GC收集次数, 翻译缓存大小
- **网络指标**: 请求数, 缓存命中率, 响应时间
- **渲染指标**: 帧率, 丢帧数, 绘制时间
- **用户体验**: 交互延迟, 滚动平滑度, 跳出率

### 2. 压力测试

#### 基本使用

```typescript
import { StressTester } from '../utils/stress-tester';

// 创建压力测试器
const tester = new StressTester({
  maxConcurrentUsers: 50,    // 最大50并发用户
  testDuration: 60000,       // 测试60秒
  rampUpTime: 10000,         // 10秒内逐渐增加
  baseUrl: 'http://localhost:3000'
});

// 运行负载测试
const results = await tester.runLoadTest();
console.log(`平均响应时间: ${results.averageResponseTime}ms`);
console.log(`错误率: ${(results.errorRate * 100).toFixed(2)}%`);
```

#### 场景测试

```typescript
import { LoadTestScenario } from '../utils/stress-tester';

const scenarios: LoadTestScenario[] = [
  {
    name: 'browse_products',
    weight: 60,
    endpoints: ['/products', '/products?page=1'],
    method: 'GET'
  },
  {
    name: 'search_products',
    weight: 30,
    endpoints: ['/api/search'],
    method: 'POST',
    payload: { query: '手机', limit: 20 }
  },
  {
    name: 'user_actions',
    weight: 10,
    endpoints: ['/api/auth/me', '/api/cart/add'],
    method: 'GET'
  }
];

const results = await tester.runScenarioTest(scenarios, 100, 300000);
```

#### 数据库压力测试

```typescript
// 数据库压力测试
const dbResults = await tester.runDatabaseStressTest({
  concurrentConnections: 20,
  queriesPerConnection: 100,
  queryType: 'MIXED'
});

console.log(`数据库查询成功: ${dbResults.successfulQueries}/${dbResults.totalQueries}`);
```

#### 稳定性测试

```typescript
// 长期稳定性测试（1小时）
const stabilityResults = await tester.runStabilityTest(3600000);

console.log(`系统可用性: ${stabilityResults.availability.toFixed(2)}%`);
console.log(`平均故障间隔: ${stabilityResults.meanTimeBetweenFailures}ms`);
```

### 3. 性能分析

#### 数据分析

```typescript
import { PerformanceAnalyzer, PerformanceDataPoint } from '../utils/performance-analyzer';

const analyzer = new PerformanceAnalyzer();

// 准备测试数据
const dataPoints: PerformanceDataPoint[] = [
  {
    timestamp: Date.now(),
    metrics: {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      loadTime: 3000
    }
  }
  // ... 更多数据点
];

// 分析性能数据
const analysis = analyzer.analyze(dataPoints);

console.log(`总体评分: ${analysis.summary.overallScore.toFixed(1)}/100`);
console.log(`性能等级: ${analysis.summary.grade}`);
```

#### 实时监控

```typescript
// 启动实时性能监控
const stopMonitoring = analyzer.startRealTimeMonitoring((analysis) => {
  console.log(`实时性能评分: ${analysis.summary.overallScore.toFixed(1)}`);
  
  if (analysis.summary.criticalIssues.length > 0) {
    console.log('⚠️ 发现关键性能问题:', analysis.summary.criticalIssues);
  }
}, 30000); // 30秒间隔

// 停止监控
setTimeout(stopMonitoring, 300000); // 5分钟后停止
```

#### 生成报告

```typescript
// 生成性能分析报告
const report = analyzer.generateReport(dataPoints);

// 保存报告
import { writeFileSync } from 'fs';
writeFileSync('performance-analysis.md', report);
```

### 4. 性能基准

#### 基准配置

```typescript
import { 
  PERFORMANCE_BENCHMARKS, 
  PerformanceScorer,
  getTargetByCategory 
} from '../utils/performance-benchmarks';

// 获取前端性能目标
const frontendTarget = getTargetByCategory('frontendCoreWebVitals');

if (frontendTarget) {
  console.log(`目标: ${frontendTarget.description}`);
  console.log(`总体目标: ${frontendTarget.overallTarget}/100`);
}

// 计算性能分数
const metrics = {
  LCP: 2800,
  FID: 120,
  CLS: 0.08
};

const { score, grade } = PerformanceScorer.calculateOverallScore(metrics, frontendTarget);
console.log(`性能分数: ${score.toFixed(1)}/100 (${grade})`);
```

#### 设备适配

```typescript
import { DEVICE_PROFILES } from '../utils/performance-benchmarks';

// 使用移动设备配置
const mobileProfile = DEVICE_PROFILES.highEndMobile;
console.log(`设备: ${mobileProfile.name}`);
console.log(`CPU核心: ${mobileProfile.characteristics.cpuCores}`);
console.log(`内存: ${mobileProfile.characteristics.memory}GB`);
```

### 5. 测试用例

#### 编写性能测试

```typescript
import { describe, test, expect } from '@jest/globals';
import { performance } from 'perf_hooks';

describe('性能测试示例', () => {
  test('API响应时间测试', async () => {
    const startTime = performance.now();
    
    const response = await fetch('/api/health');
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    expect(response.ok).toBe(true);
    expect(responseTime).toBeLessThan(500); // 500ms内响应
  });

  test('内存使用测试', () => {
    if (typeof window === 'undefined') {
      console.log('跳过Node.js环境内存测试');
      return;
    }

    const initialMemory = (performance as any).memory.usedJSHeapSize;
    
    // 模拟大量DOM操作
    const container = document.createElement('div');
    for (let i = 0; i < 1000; i++) {
      const element = document.createElement('div');
      container.appendChild(element);
    }
    
    const finalMemory = (performance as any).memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
  });
});
```

## 性能目标

### Core Web Vitals
- **LCP (最大内容绘制)**: < 2.5秒 (优秀: < 1.2秒)
- **FID (首次输入延迟)**: < 100毫秒 (优秀: < 50毫秒)
- **CLS (累计布局偏移)**: < 0.1 (优秀: < 0.05)

### 移动端性能
- **页面加载时间**: < 3秒 (优秀: < 1.5秒)
- **内存使用**: < 80MB (优秀: < 40MB)
- **触摸响应**: < 100毫秒 (优秀: < 50毫秒)

### API性能
- **响应时间**: < 200毫秒 (优秀: < 100毫秒)
- **并发处理**: > 1000 req/s
- **可用性**: > 99.9%

### 国际化性能
- **翻译加载**: < 200毫秒 (优秀: < 100毫秒)
- **缓存命中率**: > 85% (优秀: > 95%)
- **语言切换**: < 150毫秒 (优秀: < 80毫秒)

## 报告和输出

### 测试报告格式

测试完成后会生成以下报告：

1. **JSON报告**: `test-reports/performance-stability/comprehensive-report-TIMESTAMP.json`
2. **Markdown报告**: `test-reports/performance-stability/comprehensive-report-TIMESTAMP.md`
3. **JUnit XML**: `test-reports/performance-stability/junit.xml`
4. **覆盖率报告**: `test-reports/performance-stability/coverage.html`

### 报告内容

- 执行摘要
- 各阶段测试详情
- 性能指标对比
- 瓶颈分析
- 优化建议
- 趋势分析
- 改进计划

## 故障排除

### 常见问题

#### 1. 监控数据不准确
```typescript
// 确保在浏览器环境中运行
if (typeof window !== 'undefined') {
  const monitor = new ComprehensivePerformanceMonitor();
  // ...
}
```

#### 2. 压力测试连接失败
```typescript
// 检查服务器状态和URL
const tester = new StressTester({
  baseUrl: 'http://localhost:3000',
  timeout: 30000  // 增加超时时间
});
```

#### 3. 内存监控权限错误
```javascript
// 在Chrome中需要启用特定标志
// --enable-precise-memory-info
```

### 调试模式

```bash
# 启用详细日志
DEBUG=performance:* npm test

# 只运行特定测试
npm test -- --testNamePattern="页面加载性能"

# 启用覆盖率报告
npm test -- --coverage
```

## 最佳实践

### 1. 测试环境
- 使用独立的测试数据库
- 模拟真实的网络条件
- 设置合适的测试数据量

### 2. 测试频率
- 每次代码提交运行单元测试
- 每日运行集成测试
- 每周运行完整性能测试
- 每月进行压力测试

### 3. 性能优化
- 优先解决关键路径性能问题
- 定期监控性能趋势
- 建立性能回归报警
- 持续优化热点代码

### 4. 监控策略
- 实时监控关键指标
- 设置合理的告警阈值
- 定期审查性能基准
- 保持监控工具更新

## 扩展功能

### 自定义指标

```typescript
// 添加自定义性能指标
const customMonitor = new ComprehensivePerformanceMonitor({
  customMetrics: {
    'customMetric1': { threshold: 1000, weight: 10 },
    'customMetric2': { threshold: 500, weight: 15 }
  }
});
```

### 外部集成

```typescript
// 集成到CI/CD管道
// .github/workflows/performance-tests.yml
name: Performance Tests
on: [push, pull_request]
jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Performance Tests
        run: node scripts/run-performance-tests.ts
```

### 性能警告

```typescript
// 设置性能警告
const monitor = new ComprehensivePerformanceMonitor({
  alertThresholds: {
    loadTime: 3000,
    memoryUsage: 100 * 1024 * 1024
  }
});

// 监听警告事件
monitor.on('alert', (alert) => {
  console.warn(`性能警告: ${alert.message}`);
  // 发送通知到监控系统
});
```

## 相关资源

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Jest 测试框架](https://jestjs.io/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Lighthouse 性能审计](https://developers.google.com/web/tools/lighthouse)

## 支持和贡献

如有问题或建议，请：

1. 查看现有的 [Issues](../../issues)
2. 创建新的 Issue 描述问题
3. 提交 Pull Request 贡献代码
4. 更新文档和测试用例

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../../LICENSE) 文件。