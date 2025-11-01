# 异步操作错误处理最佳实践指南

## 📋 概述

本指南提供了异步操作错误处理的完整最佳实践，包括Promise错误处理、文件操作错误处理、定时器和事件处理错误处理等内容。所有工具都已集成到统一的异步错误处理库中。

## 🏗️ 架构设计

### 核心组件

1. **AsyncErrorHandler** - 统一的异步错误处理核心库
2. **PromiseErrorDecorators** - Promise错误处理装饰器和工具
3. **TimerEventBestPractices** - 定时器和事件处理最佳实践
4. **EnhancedScripts** - 增强版的修复脚本

### 错误处理流程

```
异步操作
    ↓
错误检测与分类
    ↓
错误记录与监控
    ↓
错误恢复与重试
    ↓
用户友好的错误反馈
```

## 🛠️ 使用指南

### 1. 基础错误处理装饰器

#### 装饰器模式
```typescript
import { withErrorHandling } from '@/lib/promise-error-decorators';

// 使用装饰器包装异步函数
const safeAsyncFunction = withErrorHandling(async (data: any) => {
  // 你的异步逻辑
  const result = await someAsyncOperation(data);
  return result;
}, {
  maxRetries: 3,
  retryDelay: 1000,
  onError: (error, context) => {
    console.error('操作失败:', error.message, context);
  }
});

// 调用方式
try {
  const result = await safeAsyncFunction(testData);
  console.log('操作成功:', result);
} catch (error) {
  console.error('所有重试都失败了:', error);
}
```

#### 配置选项
```typescript
interface ErrorHandlingOptions {
  rethrow?: boolean;              // 是否重新抛出错误，默认true
  defaultValue?: any;             // 错误时的默认值
  onError?: (error, context) => void;    // 错误回调
  onSuccess?: (result, context) => void; // 成功回调
  timeout?: number;               // 超时时间
  maxRetries?: number;            // 最大重试次数
  retryDelay?: number;            // 重试延迟
  validateResult?: (result) => boolean;  // 结果验证函数
}
```

### 2. Promise包装器

#### 单个Promise安全执行
```typescript
import { PromiseWrapper } from '@/lib/promise-error-decorators';

const result = await PromiseWrapper.safe(async () => {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('请求失败');
  return response.json();
}, {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
  validateResult: (data) => data && data.success
});

if (result.success) {
  console.log('获取数据成功:', result.result);
} else {
  console.error('获取数据失败:', result.error?.message);
}
```

#### 并行执行多个任务
```typescript
const tasks = [
  () => fetch('/api/user'),
  () => fetch('/api/posts'),
  () => fetch('/api/comments')
];

const { results, summary } = await PromiseWrapper.parallel(tasks, {
  concurrency: 3,
  stopOnError: false,
  onProgress: (completed, total) => {
    console.log(`进度: ${completed}/${total}`);
  }
});

console.log('成功:', summary.successful);
console.log('失败:', summary.failed);
```

#### 链式依赖任务
```typescript
const steps = [
  {
    name: 'validateInput',
    task: (input) => validateUserInput(input),
    required: true
  },
  {
    name: 'fetchUser',
    task: (input) => fetchUserById(input.userId),
    required: true
  },
  {
    name: 'processData',
    task: (user) => processUserData(user),
    required: false, // 可选步骤
    skipOnError: true // 前一步出错时跳过
  }
];

const chainResult = await PromiseWrapper.chain(steps, {
  continueOnError: true,
  onStepComplete: (name, result) => {
    console.log(`步骤完成: ${name}`);
  },
  onStepError: (name, error) => {
    console.error(`步骤失败: ${name}`, error.message);
  }
});
```

### 3. 文件操作错误处理

#### 基础文件操作
```typescript
import { FileErrorHandler } from '@/lib/async-error-handler';

// 安全读取文件
const readResult = await FileErrorHandler.readFile('/path/to/file.txt', {
  maxRetries: 3,
  retryDelay: 1000
});

if (readResult.success) {
  console.log('文件内容:', readResult.content);
} else {
  console.error('读取失败:', readResult.error?.message);
  console.error('错误类型:', readResult.error?.code);
}

// 安全写入文件
const writeResult = await FileErrorHandler.writeFile('/path/to/file.txt', '新内容', {
  maxRetries: 2
});

if (writeResult.success) {
  console.log('写入成功');
} else {
  console.error('写入失败:', writeResult.error?.message);
}
```

#### 批量文件修复
```typescript
const files = ['/path/to/file1.ts', '/path/to/file2.ts'];

const fixFunction = (content: string) => {
  // 应用修复逻辑
  const modifiedContent = content.replace(/old/g, 'new');
  return {
    content: modifiedContent,
    modified: modifiedContent !== content
  };
};

const result = await FileErrorHandler.batchFixFiles(files, fixFunction);

console.log('成功处理:', result.successful.length);
console.log('修复文件:', result.modified.length);
console.log('失败文件:', result.failed.length);
```

### 4. 定时器错误处理

#### 创建带重试的定时器
```typescript
import { EnhancedTimerFactory, globalTimerManager } from '@/lib/timer-event-best-practices';

// 创建重试定时器
EnhancedTimerFactory.createRetryTimer(
  'dataSync',
  async () => {
    // 数据同步逻辑
    await syncDataWithServer();
  },
  30000, // 30秒间隔
  {
    maxRetries: 3,
    retryDelay: 5000,
    backoffMultiplier: 2,
    onMaxRetriesReached: (id, error) => {
      console.error(`定时器 ${id} 达到最大重试次数:`, error.message);
      // 触发告警或备用方案
    }
  }
);

// 创建周期性定时器
EnhancedTimerFactory.createPeriodicTimer(
  'healthCheck',
  async () => {
    const isHealthy = await checkSystemHealth();
    if (!isHealthy) {
      throw new Error('系统健康检查失败');
    }
  },
  60000, // 1分钟间隔
  {
    maxConsecutiveFailures: 3,
    stopOnMaxFailures: true,
    onConsecutiveFailure: (id, count) => {
      console.warn(`连续失败 ${count} 次: ${id}`);
    }
  }
);
```

#### 健康检查定时器
```typescript
EnhancedTimerFactory.createHealthCheckTimer(
  'databaseHealth',
  async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  },
  30000, // 30秒检查一次
  {
    failureThreshold: 3,
    onHealthCheckFailed: (id, failureCount) => {
      console.error(`数据库健康检查失败 ${failureCount} 次: ${id}`);
      // 触发数据库连接恢复
    }
  }
);
```

### 5. 事件错误处理

#### 注册事件处理器
```typescript
import { eventHandlerEnhancer } from '@/lib/timer-event-best-practices';

// 注册带错误处理的事件处理器
eventHandlerEnhancer.registerEventHandler(
  'userAction',
  async (data) => {
    await processUserAction(data);
  },
  {
    maxRetries: 3,
    retryDelay: 2000,
    onError: (error, eventData) => {
      console.error('用户动作处理失败:', error.message, eventData);
    }
  }
);

// 安全触发事件
await eventHandlerEnhancer.emitEvent('userAction', {
  userId: '123',
  action: 'click',
  timestamp: Date.now()
});
```

#### 事件队列处理器
```typescript
const batchProcessor = eventHandlerEnhancer.createEventQueueProcessor(
  'bulkNotifications',
  async (notifications) => {
    // 批量发送通知
    await sendBulkNotifications(notifications);
  },
  {
    batchSize: 10,
    batchTimeout: 5000
  }
);

// 添加通知到队列
batchProcessor({
  userId: '123',
  message: '通知内容',
  type: 'info'
});
```

### 6. 网络请求错误处理

#### 安全的网络请求
```typescript
import { NetworkErrorHandler } from '@/lib/promise-error-decorators';

// 单个请求
const fetchResult = await NetworkErrorHandler.fetch('/api/data', {
  method: 'GET',
  headers: { 'Authorization': 'Bearer token' }
}, {
  maxRetries: 3,
  retryDelay: 1000,
  validateResponse: (response) => response.status < 500
});

if (fetchResult.success) {
  const data = await fetchResult.response!.json();
  console.log('数据:', data);
} else {
  console.error('请求失败:', fetchResult.error?.message);
}

// 批量请求
const batchResult = await NetworkErrorHandler.batchFetch([
  { url: '/api/users', id: 'users' },
  { url: '/api/posts', id: 'posts' },
  { url: '/api/comments', id: 'comments' }
], {
  concurrency: 3,
  onProgress: (completed, total) => {
    console.log(`请求进度: ${completed}/${total}`);
  }
});

console.log('批量请求结果:', batchResult.summary);
```

## 📊 监控和指标

### 操作监控
```typescript
import { AsyncOperationMonitor } from '@/lib/promise-error-decorators';

// 开始监控
AsyncOperationMonitor.startOperation('dataProcessing');

// 完成操作
AsyncOperationMonitor.completeOperation('dataProcessing', true);

// 获取操作统计
const stats = AsyncOperationMonitor.getStats();
console.log('操作统计:', stats);
```

### 定时器和事件监控
```typescript
import { timerEventMonitor } from '@/lib/timer-event-best-practices';

// 获取监控报告
const report = timerEventMonitor.getReport();
console.log('监控报告:', report);
```

### API错误监控
```typescript
import { apiErrorMonitor } from '@/lib/async-error-handler';

// 记录API错误
apiErrorMonitor.recordError(error, {
  endpoint: '/api/users',
  method: 'GET',
  statusCode: 500,
  userId: '123',
  requestId: 'req-456',
  duration: 1500
});

// 获取错误报告
const errorReport = apiErrorMonitor.getErrorReport();
console.log('错误报告:', errorReport);
```

## 🛡️ 资源管理

### 优雅关闭
```typescript
import { gracefulShutdownManager } from '@/lib/timer-event-best-practices';

// 注册关闭处理器
gracefulShutdownManager.addShutdownHandler(async () => {
  // 清理数据库连接
  await prisma.$disconnect();
  
  // 清理外部服务连接
  await cleanupExternalServices();
  
  // 保存状态
  await saveApplicationState();
});

// 手动触发关闭
await gracefulShutdownManager.shutdown();
```

### 定时器清理检查
```typescript
// 检查定时器泄露
globalTimerManager.checkForLeaks();

// 获取定时器统计
const timerStats = globalTimerManager.getStats();
console.log('活跃定时器:', timerStats.activeCount);

// 优雅关闭时清理所有定时器
globalTimerManager.shutdown();
```

## 🚨 错误类型和处理策略

### 错误分类

1. **可重试错误**
   - 网络超时
   - 临时服务不可用
   - 数据库连接失败
   - 限流触发

2. **不可重试错误**
   - 权限不足
   - 数据格式错误
   - 业务逻辑错误
   - 参数验证失败

3. **用户友好错误**
   - 需要向用户显示的错误
   - 提供明确的错误信息和解决建议

### 处理策略

```typescript
const errorHandlingStrategies = {
  // 网络错误：自动重试 + 指数退避
  network: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  },
  
  // 文件操作：错误分类 + 具体错误信息
  fileOperation: {
    detailedErrorTypes: true,
    provideSolutions: true
  },
  
  // 数据库操作：事务回滚 + 连接恢复
  database: {
    transactionRetry: true,
    connectionRecovery: true
  },
  
  // 定时器：重试 + 熔断机制
  timer: {
    retryWithBackoff: true,
    circuitBreaker: true
  },
  
  // 事件处理：异步处理 + 队列重试
  event: {
    asyncProcessing: true,
    queueRetry: true
  }
};
```

## 📈 性能优化

### 异步操作性能监控
```typescript
// 性能监控示例
const performanceConfig = {
  trackExecutionTime: true,
  trackMemoryUsage: true,
  trackSuccessRate: true,
  alertThresholds: {
    executionTime: 5000, // 5秒
    memoryUsage: 100 * 1024 * 1024, // 100MB
    successRate: 0.95 // 95%
  }
};
```

### 并发控制
```typescript
// 限制并发数量
const controlledExecution = await PromiseWrapper.parallel(operations, {
  concurrency: 5, // 最多5个并发
  stopOnError: false
});
```

## 🔧 工具集成

### 在React组件中使用
```typescript
import React, { useEffect } from 'react';
import { withErrorHandling } from '@/lib/promise-error-decorators';

const DataComponent: React.FC = () => {
  useEffect(() => {
    const loadData = withErrorHandling(async () => {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('数据加载失败');
      return response.json();
    }, {
      onError: (error) => {
        // 错误处理：显示用户友好的错误信息
        showErrorNotification(error.message);
      }
    });

    loadData();
  }, []);

  return <div>加载中...</div>;
};
```

### 在Next.js API路由中使用
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/promise-error-decorators';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const data = await fetchData();
  return NextResponse.json({ data });
}, {
  onError: (error, context) => {
    // 记录错误到监控系统
    logger.error('API错误', { error, context });
  }
});
```

### 在后台任务中使用
```typescript
import { EnhancedTimerFactory } from '@/lib/timer-event-best-practices';

class BackgroundJobProcessor {
  async processJobs() {
    const jobs = await this.getPendingJobs();
    
    const results = await PromiseWrapper.parallel(
      jobs.map(job => () => this.processJob(job)),
      {
        concurrency: 3,
        onProgress: (completed, total) => {
          console.log(`处理进度: ${completed}/${total}`);
        }
      }
    );

    return results;
  }
}
```

## 🎯 最佳实践总结

### 1. 统一错误处理模式
- 使用装饰器包装所有异步函数
- 建立统一的错误类型和错误码
- 提供一致的错误日志格式

### 2. 适当的重试策略
- 区分可重试和不可重试错误
- 使用指数退避避免服务雪崩
- 设置合理的重试次数和延迟

### 3. 资源管理
- 确保定时器和事件监听器的清理
- 实现优雅关闭机制
- 监控资源使用情况

### 4. 用户体验
- 提供用户友好的错误信息
- 实现错误恢复和降级方案
- 记录详细的调试信息

### 5. 监控和告警
- 实时监控错误率和恢复成功率
- 建立分级告警机制
- 分析错误模式并持续优化

## 📚 相关文档

- [异步错误处理API参考](./async-error-handler.md)
- [Promise装饰器使用指南](./promise-error-decorators.md)
- [定时器最佳实践](./timer-event-best-practices.md)
- [错误监控配置](./api-error-monitor.md)

---

*本指南基于LuckyMartTJ项目的实践经验编写，持续更新以反映最新的最佳实践。*
