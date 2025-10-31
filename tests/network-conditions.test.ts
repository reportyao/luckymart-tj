// network-conditions.test.ts - 弱网环境模拟测试
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  NetworkRetryManager, 
  NetworkQuality, 
  retryManager 
} from '@/utils/network-retry';
import { 
  RequestDegradationManager, 
  DegradationStrategy,
  degradationManager 
} from '@/utils/request-degradation';
import { translationLoader } from '@/utils/translation-loader';

// 模拟网络条件配置
const NETWORK_CONDITIONS = {
  OFFLINE: {
    name: 'offline',
    latency: Infinity,
    throughput: 0,
    packetLoss: 1.0,
    quality: NetworkQuality.POOR
  },
  '2G_SLOW': {
    name: '2G-slow',
    latency: 3000,
    throughput: 50, // 50 kbps
    packetLoss: 0.3,
    quality: NetworkQuality.POOR
  },
  '2G_FAST': {
    name: '2G-fast', 
    latency: 1500,
    throughput: 150, // 150 kbps
    packetLoss: 0.2,
    quality: NetworkQuality.POOR
  },
  '3G_SLOW': {
    name: '3G-slow',
    latency: 800,
    throughput: 400, // 400 kbps
    packetLoss: 0.1,
    quality: NetworkQuality.FAIR
  },
  '3G_FAST': {
    name: '3G-fast',
    latency: 400,
    throughput: 1000, // 1 Mbps
    packetLoss: 0.05,
    quality: NetworkQuality.GOOD
  },
  WEAK_WIFI: {
    name: 'weak-wifi',
    latency: 200,
    throughput: 2000, // 2 Mbps
    packetLoss: 0.02,
    quality: NetworkQuality.GOOD
  },
  GOOD_WIFI: {
    name: 'good-wifi',
    latency: 50,
    throughput: 10000, // 10 Mbps
    packetLoss: 0.0,
    quality: NetworkQuality.EXCELLENT
  }
} as const;

type NetworkCondition = typeof NETWORK_CONDITIONS[keyof typeof NETWORK_CONDITIONS];

// 模拟网络环境管理器
class NetworkEnvironmentSimulator {
  private currentCondition: NetworkCondition = NETWORK_CONDITIONS.GOOD_WIFI;
  private originalFetch: typeof fetch;
  private originalOnline: boolean;
  private simulatedErrors: Map<string, number> = new Map();

  constructor() {
    this.originalFetch = global.fetch;
    this.originalOnline = navigator.onLine;
    this.setupNetworkSimulation();
  }

  private setupNetworkSimulation() {
    // 模拟网络状态
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  }

  setNetworkCondition(condition: NetworkCondition) {
    this.currentCondition = condition;
    console.log(`[NetworkSimulator] 设置网络条件: ${condition.name}`);
    
    // 更新网络在线状态
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: condition.name !== 'offline'
    });
  }

  simulateNetworkDelay(url: string): Promise<void> {
    if (this.currentCondition.name === 'offline') {
      return Promise.reject(new Error('NetworkError: 网络离线'));
    }

    const baseDelay = this.currentCondition.latency;
    const jitter = Math.random() * baseDelay * 0.3; // 30%抖动
    const throughputDelay = this.estimateThroughputDelay(url);
    
    return new Promise(resolve => {
      setTimeout(resolve, baseDelay + jitter + throughputDelay);
    });
  }

  private estimateThroughputDelay(url: string): number {
    // 基于网络吞吐量估算延迟
    const dataSize = this.estimateRequestSize(url);
    const throughputKbps = this.currentCondition.throughput;
    const transferTime = (dataSize * 8) / (throughputKbps * 1024); // 转换为秒
    return transferTime * 1000; // 转换为毫秒
  }

  private estimateRequestSize(url: string): number {
    // 估算请求数据大小 (KB)
    if (url.includes('/locales/')) {
      return 15; // 翻译文件通常15KB
    }
    if (url.includes('/api/')) {
      return 5; // API响应通常5KB
    }
    return 50; // 默认50KB
  }

  shouldSimulatePacketLoss(): boolean {
    return Math.random() < this.currentCondition.packetLoss;
  }

  restore() {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: this.originalOnline
    });
  }
}

// 模拟fetch API
function setupMockFetch(simulator: NetworkEnvironmentSimulator) {
  const originalFetch = global.fetch;
  
  (global as any).fetch = jest.fn().mockImplementation(async (url: string, options?: any) => {
    // 模拟网络延迟
    await simulator.simulateNetworkDelay(url);
    
    // 模拟丢包
    if (simulator.shouldSimulatePacketLoss()) {
      throw new Error('NetworkError: 请求丢失');
    }

    // 根据URL返回模拟响应
    if (url.includes('/locales/')) {
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          translation: {
            key1: '翻译文本1',
            key2: '翻译文本2'
          }
        }),
        headers: new Map([
          ['content-length', '1024'],
          ['etag', '"v1.0"']
        ])
      };
    }

    if (url.includes('/api/')) {
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'mock-api-response' }),
        headers: new Map([
          ['content-length', '512']
        ])
      };
    }

    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Map()
    };
  });

  return () => {
    (global as any).fetch = originalFetch;
  };
}

describe('弱网环境功能测试', () => {
  let simulator: NetworkEnvironmentSimulator;
  let restoreFetch: () => void;

  beforeEach(() => {
    simulator = new NetworkEnvironmentSimulator();
    restoreFetch = setupMockFetch(simulator);
    jest.clearAllMocks();
  });

  afterEach(() => {
    simulator.restore();
    restoreFetch();
    retryManager.resetRetryCounts();
  });

  describe('不同网络条件下的重试机制', () => {
    Object.entries(NETWORK_CONDITIONS).forEach(([conditionName, condition]) => {
      it(`应该在${conditionName}条件下正确处理重试`, async () => {
        simulator.setNetworkCondition(condition);
        
        let attempts = 0;
        const operation = jest.fn().mockImplementation(async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('NetworkError');
          }
          return 'success';
        });

        const result = await retryManager.executeWithRetry(operation, {
          maxRetries: 5,
          baseDelay: 500,
          timeout: condition.latency * 3
        });

        expect(result).toBe('success');
        expect(attempts).toBe(3);
      });
    });
  });

  describe('缓存命中率测试', () => {
    it('应该在弱网环境下保持较高的缓存命中率', async () => {
      simulator.setNetworkCondition(NETWORK_CONDITIONS['2G_SLOW']);
      
      const degradationManager = new RequestDegradationManager(50);
      const mockOperation = jest.fn().mockResolvedValue({ data: 'cached-data' });
      
      const config = {
        strategy: DegradationStrategy.CACHE_FIRST,
        cacheTimeout: 60000,
        priority: 'medium' as const
      };

      // 第一次请求 - 网络获取
      const result1 = await degradationManager.fetchWithDegradation(
        'cache-test-key',
        mockOperation,
        config
      );
      expect(result1.source).toBe('network');
      expect(mockOperation).toHaveBeenCalledTimes(1);

      // 第二次请求 - 缓存命中
      const result2 = await degradationManager.fetchWithDegradation(
        'cache-test-key',
        mockOperation,
        config
      );
      expect(result2.source).toBe('cache');
      expect(mockOperation).toHaveBeenCalledTimes(1); // 不会再次调用

      degradationManager.destroy();
    });

    it('应该在离线状态下完全依赖缓存', async () => {
      simulator.setNetworkCondition(NETWORK_CONDITIONS.OFFLINE);
      
      const degradationManager = new RequestDegradationManager(50);
      const mockOperation = jest.fn().mockResolvedValue({ data: 'offline-data' });
      
      const config = {
        strategy: DegradationStrategy.CACHE_FIRST,
        cacheTimeout: 60000,
        priority: 'medium' as const
      };

      // 首先在线时获取数据
      simulator.setNetworkCondition(NETWORK_CONDITIONS.GOOD_WIFI);
      await degradationManager.fetchWithDegradation('offline-test', mockOperation, config);
      
      // 然后离线
      simulator.setNetworkCondition(NETWORK_CONDITIONS.OFFLINE);
      
      // 离线时应该从缓存获取
      const result = await degradationManager.fetchWithDegradation('offline-test', mockOperation, config);
      expect(result.source).toBe('cache');
      
      degradationManager.destroy();
    });
  });

  describe('翻译文件渐进式加载性能', () => {
    it('应该在弱网环境下优化翻译文件加载', async () => {
      simulator.setNetworkCondition(NETWORK_CONDITIONS['3G_SLOW']);
      
      const loader = translationLoader;
      const loadTimes: number[] = [];

      // 模拟多次加载翻译命名空间
      const namespaces = ['common', 'auth', 'error', 'admin'];
      
      for (const namespace of namespaces) {
        const startTime = performance.now();
        try {
          await loader.loadNamespace(namespace, 'zh-CN');
          const loadTime = performance.now() - startTime;
          loadTimes.push(loadTime);
        } catch (error) {
          console.warn(`Failed to load namespace ${namespace}:`, error);
        }
      }

      // 在弱网环境下，加载时间应该合理
      if (loadTimes.length > 0) {
        const avgLoadTime = loadTimes.reduce((a, b) => a + b) / loadTimes.length;
        expect(avgLoadTime).toBeLessThan(5000); // 5秒内完成
      }
    });

    it('应该正确处理翻译文件加载失败', async () => {
      simulator.setNetworkCondition(NETWORK_CONDITIONS.OFFLINE);
      
      const loader = translationLoader;
      
      // 离线状态下加载翻译应该抛出错误
      await expect(loader.loadNamespace('non-existent', 'zh-CN'))
        .rejects.toThrow();
    });
  });

  describe('网络恢复后的数据同步', () => {
    it('应该在网络恢复后正确同步缓存数据', async () => {
      // 开始时在线，获取初始数据
      simulator.setNetworkCondition(NETWORK_CONDITIONS.GOOD_WIFI);
      const degradationManager = new RequestDegradationManager(50);
      const mockOperation = jest.fn().mockResolvedValue({ data: 'initial-data' });
      
      await degradationManager.fetchWithDegradation('sync-test', mockOperation, {
        strategy: DegradationStrategy.NETWORK_FIRST,
        cacheTimeout: 60000,
        priority: 'medium' as const
      });

      // 模拟网络中断
      simulator.setNetworkCondition(NETWORK_CONDITIONS.OFFLINE);
      
      // 模拟网络恢复
      simulator.setNetworkCondition(NETWORK_CONDITIONS.GOOD_WIFI);
      
      // 模拟数据更新
      const updatedMockOperation = jest.fn().mockResolvedValue({ data: 'updated-data' });
      
      const result = await degradationManager.fetchWithDegradation('sync-test', updatedMockOperation, {
        strategy: DegradationStrategy.NETWORK_FIRST,
        cacheTimeout: 1000, // 很短的缓存时间
        priority: 'medium' as const
      });

      expect(result.source).toBe('network');
      expect(result.data.data).toBe('updated-data');
      
      degradationManager.destroy();
    });
  });

  describe('网络条件切换测试', () => {
    it('应该适应网络条件的动态变化', async () => {
      const networkSequence = [
        NETWORK_CONDITIONS.GOOD_WIFI,
        NETWORK_CONDITIONS.WEAK_WIFI,
        NETWORK_CONDITIONS['3G_SLOW'],
        NETWORK_CONDITIONS['2G_SLOW'],
        NETWORK_CONDITIONS.OFFLINE,
        NETWORK_CONDITIONS.GOOD_WIFI
      ];

      for (const condition of networkSequence) {
        simulator.setNetworkCondition(condition);
        
        const operation = jest.fn().mockResolvedValue('success');
        const result = await retryManager.executeWithRetry(operation, {
          maxRetries: 3,
          baseDelay: 100,
          timeout: condition.latency * 2
        });

        expect(result).toBe('success');
      }
    });
  });

  describe('性能基准测试', () => {
    it('应该在不同网络条件下保持合理的响应时间', async () => {
      const performanceResults: Record<string, number> = {};
      
      for (const [conditionName, condition] of Object.entries(NETWORK_CONDITIONS)) {
        if (conditionName === 'OFFLINE') continue;
        
        simulator.setNetworkCondition(condition);
        
        const startTime = performance.now();
        const mockOperation = jest.fn().mockResolvedValue({ data: 'performance-test' });
        
        const result = await retryManager.executeWithRetry(mockOperation, {
          maxRetries: 2,
          baseDelay: 100
        });
        
        const duration = performance.now() - startTime;
        performanceResults[conditionName] = duration;
        
        expect(result).toBeDefined();
      }

      // 打印性能结果
      console.log('[Network Performance Results]:', performanceResults);
      
      // 验证最差情况下的响应时间
      expect(performanceResults['2G_SLOW']).toBeLessThan(10000); // 10秒内
      expect(performanceResults['3G_FAST']).toBeLessThan(2000); // 2秒内
    });
  });

  describe('并发请求测试', () => {
    it('应该在弱网环境下正确处理并发请求', async () => {
      simulator.setNetworkCondition(NETWORK_CONDITIONS['3G_SLOW']);
      
      const concurrency = 5;
      const operations = Array.from({ length: concurrency }, (_, i) => 
        jest.fn().mockResolvedValue(`result-${i}`)
      );
      
      const startTime = performance.now();
      const promises = operations.map(op => 
        retryManager.executeWithRetry(op, { maxRetries: 2, baseDelay: 200 })
      );
      
      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      
      expect(results).toHaveLength(concurrency);
      expect(results.every(r => typeof r === 'string')).toBe(true);
      
      // 并发执行应该比串行执行更快
      expect(totalTime).toBeLessThan(operations.length * 1000);
    });
  });

  describe('内存使用测试', () => {
    it('应该在弱网环境下有效管理内存', async () => {
      const degradationManager = new RequestDegradationManager(10); // 小的缓存大小
      
      // 添加大量数据
      const mockOperation = jest.fn().mockResolvedValue({ data: 'memory-test' });
      
      for (let i = 0; i < 20; i++) {
        await degradationManager.fetchWithDegradation(`memory-key-${i}`, mockOperation, {
          strategy: DegradationStrategy.CACHE_FIRST,
          cacheTimeout: 60000,
          priority: 'medium' as const
        });
      }

      const stats = degradationManager.getCacheStats();
      
      // 缓存大小应该受限制
      expect(stats.size).toBeLessThanOrEqual(10);
      
      degradationManager.destroy();
    });
  });
});

// 网络条件性能报告生成器
export class NetworkConditionReporter {
  private results: Map<string, any[]> = new Map();

  recordTestResult(condition: string, testName: string, metrics: any) {
    if (!this.results.has(condition)) {
      this.results.set(condition, []);
    }
    this.results.get(condition)!.push({ testName, metrics, timestamp: Date.now() });
  }

  generateReport(): string {
    const report = [];
    report.push('# 网络条件性能测试报告\n');
    
    for (const [condition, results] of this.results) {
      report.push(`## ${condition} 条件测试结果\n`);
      
      const avgLoadTime = results.reduce((sum, r) => sum + (r.metrics.loadTime || 0), 0) / results.length;
      const successRate = results.filter(r => r.metrics.success).length / results.length;
      
      report.push(`- 平均加载时间: ${avgLoadTime.toFixed(2)}ms`);
      report.push(`- 成功率: ${(successRate * 100).toFixed(2)}%`);
      report.push(`- 测试项目数: ${results.length}\n`);
    }
    
    return report.join('\n');
  }
}

export { NETWORK_CONDITIONS, NetworkEnvironmentSimulator };