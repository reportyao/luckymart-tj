/**
 * 翻译预加载系统使用示例
 * 演示如何集成和使用渐进式翻译加载功能
 */

import React, { useState, useEffect } from 'react';
import { 
  TranslationPreloader,
  useTranslationPreloader,
  useSmartTranslation 
} from '../hooks/useTranslationPreloader';
import { performanceMonitor } from '../utils/performance-monitor';

// 示例1: 基础集成
export function BasicTranslationExample() {
  return (
    <TranslationPreloader
      locale="zh-CN"
      config={{
        enableRoutePrediction: true,
        enableBehaviorPrediction: true,
        enableIntersectionObserver: true
      }}
      onPredictionUpdate={(prediction) => {
        console.log('预测更新:', prediction);
      }}
      onPreloadComplete={(stats) => {
        console.log('预加载完成:', stats);
      }}
    >
      <TranslationDashboard />
    </TranslationPreloader>
  );
}

// 示例2: 智能翻译Hook使用
export function SmartTranslationExample() {
  const {
    t,
    preloadedNamespaces,
    performanceMetrics,
    loadNamespace,
    preloadRoutes,
    getPerformanceReport
  } = useSmartTranslation('common', {
    locale: 'zh-CN',
    enablePreloading: true,
    enablePerformanceMonitoring: true
  });

  return (
    <div className="smart-translation-demo">
      <h2>智能翻译示例</h2>
      
      {/* 显示翻译文本 */}
      <div>
        <h3>{t('app_name', 'LuckyMart TJ')}</h3>
        <p>{t('welcome', '欢迎')}</p>
      </div>

      {/* 显示预加载状态 */}
      <div>
        <h4>已预加载的命名空间:</h4>
        <ul>
          {Array.from(preloadedNamespaces).map(ns => (
            <li key={ns}>{ns}</li>
          ))}
        </ul>
      </div>

      {/* 显示性能指标 */}
      <div>
        <h4>性能指标:</h4>
        <div>
          <span>加载时间: {Math.round(performanceMetrics.loadTime)}ms</span>
          <span>缓存命中率: {Math.round(performanceMetrics.cacheHitRate * 100)}%</span>
          <span>内存使用: {Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB</span>
        </div>
      </div>

      {/* 手动操作 */}
      <div>
        <button onClick={() => loadNamespace('lottery')}>
          手动加载彩票翻译
        </button>
        <button onClick={() => preloadRoutes(['/orders', '/profile'])}>
          预加载订单和个人中心路由
        </button>
        <button onClick={() => console.log(getPerformanceReport())}>
          查看性能报告
        </button>
      </div>
    </div>
  );
}

// 示例3: 路由翻译组件
export function RouteTranslationComponent({ route }: { route: string }) {
  const {
    getTranslationsForRoute,
    translations,
    isPreloading,
    preloadNamespaces
  } = useTranslationPreloader({
    locale: 'zh-CN',
    enablePreloading: true,
    enablePerformanceMonitoring: true
  });

  const [routeTranslations, setRouteTranslations] = useState<any[]>([]);

  useEffect(() => {
    if (route) {
      const newTranslations = getTranslationsForRoute(route);
      setRouteTranslations(newTranslations);
    }
  }, [route, getTranslationsForRoute]);

  return (
    <div className="route-translation">
      <h3>路由: {route}</h3>
      
      {isPreloading && <div>加载中...</div>}
      
      <div>
        {routeTranslations.map(({ namespace, translations: nsTranslations }) => (
          <div key={namespace}>
            <h4>命名空间: {namespace}</h4>
            <pre>{JSON.stringify(nsTranslations, null, 2)}</pre>
          </div>
        ))}
      </div>

      <button 
        onClick={() => preloadNamespaces(['admin', 'wallet'])}
        disabled={isPreloading}
      >
        预加载更多命名空间
      </button>
    </div>
  );
}

// 示例4: 性能监控面板
export function PerformanceMonitoringPanel() {
  const {
    performanceMetrics,
    hasPerformanceIssues,
    activeRecommendations,
    getPerformanceReport,
    startMonitoring,
    stopMonitoring,
    isMonitoring,
    resetPerformanceData,
    exportPerformanceData
  } = useTranslationPreloader({
    locale: 'zh-CN',
    enablePerformanceMonitoring: true,
    monitoringConfig: {
      interval: 5000,
      alertThresholds: {
        loadTime: 300,
        cacheHitRate: 0.8,
        memoryUsage: 8 * 1024 * 1024,
        errorRate: 0.03
      }
    }
  });

  const [report, setReport] = useState<any>(null);

  const generateReport = () => {
    const newReport = getPerformanceReport();
    setReport(newReport);
  };

  return (
    <div className="performance-panel">
      <h3>性能监控面板</h3>
      
      {/* 监控控制 */}
      <div className="controls">
        <button onClick={startMonitoring} disabled={isMonitoring}>
          开始监控
        </button>
        <button onClick={stopMonitoring} disabled={!isMonitoring}>
          停止监控
        </button>
        <button onClick={generateReport}>
          生成报告
        </button>
        <button onClick={resetPerformanceData}>
          重置数据
        </button>
        <button onClick={() => console.log(exportPerformanceData())}>
          导出数据
        </button>
      </div>

      {/* 性能状态指示器 */}
      <div className="metrics">
        <div className={`metric ${hasPerformanceIssues ? 'warning' : 'good'}`}>
          <h4>性能状态</h4>
          <p>{hasPerformanceIssues ? '⚠️ 存在性能问题' : '✅ 性能良好'}</p>
        </div>

        <div className="metric">
          <h4>加载时间</h4>
          <p>{Math.round(performanceMetrics.loadTime)}ms</p>
          <small>目标: &lt; 200ms</small>
        </div>

        <div className="metric">
          <h4>缓存命中率</h4>
          <p>{Math.round(performanceMetrics.cacheHitRate * 100)}%</p>
          <small>目标: &gt; 85%</small>
        </div>

        <div className="metric">
          <h4>内存使用</h4>
          <p>{Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB</p>
          <small>限制: &lt; 10MB</small>
        </div>

        <div className="metric">
          <h4>预加载准确率</h4>
          <p>{Math.round(performanceMetrics.preloadAccuracy * 100)}%</p>
          <small>目标: &gt; 70%</small>
        </div>
      </div>

      {/* 优化建议 */}
      {activeRecommendations.length > 0 && (
        <div className="recommendations">
          <h4>优化建议</h4>
          {activeRecommendations.map((rec, index) => (
            <div key={index} className={`recommendation ${rec.priority}`}>
              <h5>{rec.title}</h5>
              <p>{rec.description}</p>
              <div className="recommendation-meta">
                <span>优先级: {rec.priority}</span>
                <span>预期改进: {rec.expectedImprovement}%</span>
                <span>实施难度: {rec.effort}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详细报告 */}
      {report && (
        <div className="detailed-report">
          <h4>详细报告</h4>
          <div className="report-section">
            <h5>基础指标</h5>
            <pre>{JSON.stringify(report.metrics, null, 2)}</pre>
          </div>
          
          <div className="report-section">
            <h5>性能趋势</h5>
            {report.trends.map((trend: any, index: number) => (
              <div key={index} className={`trend ${trend.direction}`}>
                <span>{trend.metric}</span>
                <span>{trend.direction}</span>
                <span>{Math.round(trend.changeRate * 100)}%</span>
              </div>
            ))}
          </div>

          {report.alerts.length > 0 && (
            <div className="report-section">
              <h5>警报</h5>
              {report.alerts.map((alert: any, index: number) => (
                <div key={index} className={`alert ${alert.level}`}>
                  <h6>{alert.message}</h6>
                  <p>阈值: {alert.threshold}, 当前值: {alert.currentValue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 示例5: 多语言应用主组件
export function MultiLanguageApp() {
  return (
    <TranslationPreloader
      locale="zh-CN"
      config={{
        enableRoutePrediction: true,
        enableBehaviorPrediction: true,
        enableIntersectionObserver: true,
        enableRealTimeOptimization: true
      }}
    >
      <AppContent />
    </TranslationPreloader>
  );
}

// 应用内容组件
function AppContent() {
  const {
    currentLocale,
    availableLocales,
    translations,
    preloadedNamespaces,
    performanceMetrics,
    t,
    loadNamespace,
    optimizePerformance
  } = useTranslationPreloader({
    locale: 'zh-CN',
    enablePreloading: true,
    enablePerformanceMonitoring: true,
    enableRealTimeOptimization: true
  });

  const [currentRoute, setCurrentRoute] = useState('/');

  // 路由切换
  const switchRoute = (route: string) => {
    setCurrentRoute(route);
    // 预加载新路由的相关翻译
    // 在实际应用中，这应该在路由变化时自动触发
  };

  return (
    <div className="app">
      <header>
        <h1>{t('app_name', 'LuckyMart TJ')}</h1>
        
        {/* 语言切换 */}
        <div className="language-switcher">
          <label>语言:</label>
          <select value={currentLocale} onChange={(e) => console.log('Language changed:', e.target.value)}>
            {availableLocales.map(locale => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </select>
        </div>

        {/* 性能指示器 */}
        <div className="performance-indicator">
          <span className={performanceMetrics.loadTime > 200 ? 'slow' : 'fast'}>
            加载: {Math.round(performanceMetrics.loadTime)}ms
          </span>
          <span className={performanceMetrics.cacheHitRate > 0.8 ? 'good' : 'poor'}>
            缓存: {Math.round(performanceMetrics.cacheHitRate * 100)}%
          </span>
        </div>
      </header>

      <nav>
        <button onClick={() => switchRoute('/')}>
          {t('nav.home', '首页')}
        </button>
        <button onClick={() => switchRoute('/orders')}>
          {t('nav.orders', '我的订单')}
        </button>
        <button onClick={() => switchRoute('/profile')}>
          {t('nav.profile', '个人中心')}
        </button>
        <button onClick={() => switchRoute('/lottery')}>
          {t('nav.lottery', '夺宝')}
        </button>
        <button onClick={() => switchRoute('/referral')}>
          {t('nav.referral', '邀请')}
        </button>
      </nav>

      <main>
        <RouteTranslationComponent route={currentRoute} />
      </main>

      <aside>
        <h3>预加载状态</h3>
        <ul>
          {Array.from(preloadedNamespaces).map(ns => (
            <li key={ns}>{ns}</li>
          ))}
        </ul>

        <button onClick={optimizePerformance}>
          优化性能
        </button>

        <button onClick={() => loadNamespace('admin')}>
          加载管理后台翻译
        </button>
      </aside>
    </div>
  );
}

// 示例6: 开发调试组件
export function DevelopmentDebugPanel() {
  const {
    translations,
    loadingStates,
    preloadedNamespaces,
    predictedRoutes,
    predictionConfidence,
    performanceMetrics,
    getPerformanceReport,
    exportPerformanceData
  } = useTranslationPreloader({
    locale: 'zh-CN',
    enablePreloading: true,
    enablePerformanceMonitoring: true
  });

  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // 定期更新调试信息
    const interval = setInterval(() => {
      const report = getPerformanceReport();
      setDebugInfo({
        translations: Object.keys(translations).length,
        loadingStates: Object.keys(loadingStates).length,
        preloadedNamespaces: preloadedNamespaces.size,
        predictedRoutes: predictedRoutes.length,
        confidence: predictionConfidence,
        performance: performanceMetrics,
        report
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [translations, loadingStates, preloadedNamespaces, predictedRoutes, predictionConfidence, performanceMetrics, getPerformanceReport]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="debug-panel" style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      maxHeight: '400px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h4>🔧 调试信息</h4>
      
      <div>
        <strong>翻译文件:</strong> {debugInfo.translations}
      </div>
      
      <div>
        <strong>加载状态:</strong> {debugInfo.loadingStates}
      </div>
      
      <div>
        <strong>已预加载:</strong> {debugInfo.preloadedNamespaces}
      </div>
      
      <div>
        <strong>预测路由:</strong> {debugInfo.predictedRoutes}
      </div>
      
      <div>
        <strong>置信度:</strong> {Math.round((debugInfo.confidence || 0) * 100)}%
      </div>

      <details>
        <summary>性能详情</summary>
        <pre style={{ fontSize: '10px' }}>
          {JSON.stringify(debugInfo.performance, null, 2)}
        </pre>
      </details>

      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => console.log(debugInfo.report)}
          style={{ marginRight: '5px', fontSize: '10px' }}
        >
          详细报告
        </button>
        <button 
          onClick={() => console.log(exportPerformanceData())}
          style={{ fontSize: '10px' }}
        >
          导出数据
        </button>
      </div>
    </div>
  );
}

// 示例7: 懒加载路由组件
export function LazyRouteLoader({ route }: { route: string }) {
  const {
    getTranslationsForRoute,
    preloadRoutes,
    isPreloading
  } = useTranslationPreloader({
    locale: 'zh-CN',
    enablePreloading: true
  });

  const [routeData, setRouteData] = useState<any[]>([]);

  useEffect(() => {
    // 在路由即将变化时预加载
    const timer = setTimeout(() => {
      const translations = getTranslationsForRoute(route);
      setRouteData(translations);
    }, 100);

    return () => clearTimeout(timer);
  }, [route, getTranslationsForRoute]);

  return (
    <div className="lazy-route-loader">
      {isPreloading && (
        <div className="loading-indicator">
          正在预加载翻译文件...
        </div>
      )}
      
      <div>
        {routeData.map(({ namespace, translations: nsTranslations }) => (
          <div key={namespace} className="namespace-block">
            <h5>命名空间: {namespace}</h5>
            <div className="translation-preview">
              {Object.keys(nsTranslations).slice(0, 5).map(key => (
                <div key={key} className="translation-item">
                  <code>{key}</code>: {nsTranslations[key]}
                </div>
              ))}
              {Object.keys(nsTranslations).length > 5 && (
                <div>... 还有 {Object.keys(nsTranslations).length - 5} 项</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 导出所有示例
export const TranslationExamples = {
  BasicTranslationExample,
  SmartTranslationExample,
  RouteTranslationComponent,
  PerformanceMonitoringPanel,
  MultiLanguageApp,
  DevelopmentDebugPanel,
  LazyRouteLoader
};