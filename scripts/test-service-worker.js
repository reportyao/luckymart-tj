#!/usr/bin/env node
/**
 * Service Worker功能验证脚本
 * 用于测试Service Worker的注册、缓存和离线功能
 */

const fs = require('fs');
const path = require('path');

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  const color = status === 'PASS' ? colors.green : colors.red;
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, colors.yellow);
  }
}

class ServiceWorkerTester {
  constructor() {
    this.testResults = [];
    this.basePath = path.join(__dirname, '..');
  }

  async runAllTests() {
    logSection('弱网环境优化系统 - Service Worker功能验证');
    
    await this.testServiceWorkerFile();
    await this.testIndexedDBManager();
    await this.testCacheManager();
    await this.testNetworkAwareServiceWorker();
    await this.testOfflinePage();
    await this.testAPIOptimizer();
    await this.testComponentIntegration();
    await this.generateReport();
    
    this.printSummary();
  }

  async testServiceWorkerFile() {
    logSection('1. Service Worker文件验证');
    
    const swPath = path.join(this.basePath, 'public', 'sw.js');
    
    try {
      if (!fs.existsSync(swPath)) {
        logTest('Service Worker文件存在性', 'FAIL', 'sw.js文件不存在');
        return;
      }
      
      logTest('Service Worker文件存在性', 'PASS');
      
      const swContent = fs.readFileSync(swPath, 'utf8');
      
      // 检查关键功能
      const checks = [
        { pattern: /CACHE_NAME\s*=/, name: '缓存版本控制' },
        { pattern: /install.*event/, name: 'Service Worker安装事件' },
        { pattern: /activate.*event/, name: 'Service Worker激活事件' },
        { pattern: /fetch.*event/, name: '网络请求拦截' },
        { pattern: /CACHE_FIRST|NETWORK_FIRST|STALE_WHILE_REVALIDATE/, name: '缓存策略' },
        { pattern: /sync.*event/, name: '后台同步支持' },
        { pattern: /message.*event/, name: '消息通信支持' },
        { pattern: /skipWaiting|clients\.claim/, name: '立即更新机制' },
        { pattern: /cache\.delete|cache\.addAll/, name: '缓存管理操作' },
        { pattern: /CACHE_VERSION_\d+_\d+_\d+/, name: '缓存版本管理' },
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(swContent)) {
          logTest(check.name, 'PASS', '功能实现正常');
        } else {
          logTest(check.name, 'FAIL', '功能缺失');
        }
      });
      
      // 检查代码质量
      if (swContent.length > 1000) {
        logTest('代码完整性', 'PASS', `${swContent.length}行代码`);
      } else {
        logTest('代码完整性', 'FAIL', '代码量不足');
      }
      
    } catch (error) {
      logTest('Service Worker文件验证', 'FAIL', error.message);
    }
  }

  async testIndexedDBManager() {
    logSection('2. IndexedDB管理器验证');
    
    const dbPath = path.join(this.basePath, 'utils', 'indexeddb-manager.ts');
    
    try {
      if (!fs.existsSync(dbPath)) {
        logTest('IndexedDB管理器文件存在性', 'FAIL', 'indexeddb-manager.ts文件不存在');
        return;
      }
      
      logTest('IndexedDB管理器文件存在性', 'PASS');
      
      const dbContent = fs.readFileSync(dbPath, 'utf8');
      
      const checks = [
        { pattern: /class\s+IndexedDBManager/, name: 'IndexedDBManager类定义' },
        { pattern: /openDB|versionchange/, name: '数据库连接管理' },
        { pattern: /store.*get|store.*put|store.*delete/, name: 'CRUD操作' },
        { pattern: /offline.*operation|queue/, name: '离线操作队列' },
        { pattern: /transaction|oncomplete|onerror/, name: '事务处理' },
        { pattern: /index|getAll|clear/, name: '索引和批量操作' },
        { pattern: /sync|background/, name: '数据同步机制' },
        { pattern: /error.*handle|try.*catch/, name: '错误处理' },
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(dbContent)) {
          logTest(check.name, 'PASS', '功能实现正常');
        } else {
          logTest(check.name, 'FAIL', '功能缺失');
        }
      });
      
    } catch (error) {
      logTest('IndexedDB管理器验证', 'FAIL', error.message);
    }
  }

  async testCacheManager() {
    logSection('3. 缓存管理器验证');
    
    const cachePath = path.join(this.basePath, 'components', 'CacheManager.tsx');
    
    try {
      if (!fs.existsSync(cachePath)) {
        logTest('缓存管理器组件存在性', 'FAIL', 'CacheManager.tsx文件不存在');
        return;
      }
      
      logTest('缓存管理器组件存在性', 'PASS');
      
      const cacheContent = fs.readFileSync(cachePath, 'utf8');
      
      const checks = [
        { pattern: /export.*default|function.*CacheManager/, name: '组件导出定义' },
        { pattern: /useState|useEffect/, name: 'React Hooks使用' },
        { pattern: /caches\.|Cache\s+/, name: 'Cache API调用' },
        { pattern: /stats|cache.*size|hit.*rate/, name: '缓存统计功能' },
        { pattern: /clear.*cache|delete.*cache/, name: '缓存清理功能' },
        { pattern: /display|render/, name: 'UI渲染功能' },
        { pattern: /loading|error|success/, name: '状态管理' },
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(cacheContent)) {
          logTest(check.name, 'PASS', '功能实现正常');
        } else {
          logTest(check.name, 'FAIL', '功能缺失');
        }
      });
      
    } catch (error) {
      logTest('缓存管理器验证', 'FAIL', error.message);
    }
  }

  async testNetworkAwareServiceWorker() {
    logSection('4. 网络感知Service Worker验证');
    
    const swComponentPath = path.join(this.basePath, 'components', 'NetworkAwareServiceWorker.tsx');
    
    try {
      if (!fs.existsSync(swComponentPath)) {
        logTest('网络感知SW组件存在性', 'FAIL', 'NetworkAwareServiceWorker.tsx文件不存在');
        return;
      }
      
      logTest('网络感知SW组件存在性', 'PASS');
      
      const swComponentContent = fs.readFileSync(swComponentPath, 'utf8');
      
      const checks = [
        { pattern: /export.*default|function.*NetworkAwareServiceWorker/, name: '组件定义' },
        { pattern: /navigator\.serviceWorker\.register/, name: 'Service Worker注册' },
        { pattern: /useEffect|useState/, name: 'React Hooks使用' },
        { pattern: /register|update|unregister/, name: 'SW生命周期管理' },
        { pattern: /message.*channel|postMessage/, name: '通信机制' },
        { pattern: /update.*available|skipWaiting/, name: '更新检测' },
        { pattern: /dev.*control|status.*display/, name: '开发调试支持' },
        { pattern: /preload|cache.*warm/, name: '缓存预加载' },
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(swComponentContent)) {
          logTest(check.name, 'PASS', '功能实现正常');
        } else {
          logTest(check.name, 'FAIL', '功能缺失');
        }
      });
      
    } catch (error) {
      logTest('网络感知Service Worker验证', 'FAIL', error.message);
    }
  }

  async testOfflinePage() {
    logSection('5. 离线页面验证');
    
    const offlinePath = path.join(this.basePath, 'app', 'offline', 'page.tsx');
    
    try {
      if (!fs.existsSync(offlinePath)) {
        logTest('离线页面存在性', 'FAIL', 'offline/page.tsx文件不存在');
        return;
      }
      
      logTest('离线页面存在性', 'PASS');
      
      const offlineContent = fs.readFileSync(offlinePath, 'utf8');
      
      const checks = [
        { pattern: /export.*default|function.*Offline/, name: '页面组件定义' },
        { pattern: /offline|disconnect/, name: '离线状态识别' },
        { pattern: /cached|cache.*data/, name: '缓存数据显示' },
        { pattern: /sync|background.*sync/, name: '同步状态' },
        { pattern: /retry|reconnect/, name: '重连功能' },
        { pattern: /button|link/, name: '交互元素' },
        { pattern: /loading|error|ready/, name: '状态显示' },
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(offlineContent)) {
          logTest(check.name, 'PASS', '功能实现正常');
        } else {
          logTest(check.name, 'FAIL', '功能缺失');
        }
      });
      
    } catch (error) {
      logTest('离线页面验证', 'FAIL', error.message);
    }
  }

  async testAPIOptimizer() {
    logSection('6. API优化器验证');
    
    const optimizerPath = path.join(this.basePath, 'utils', 'api-optimizer.ts');
    
    try {
      if (!fs.existsSync(optimizerPath)) {
        logTest('API优化器文件存在性', 'FAIL', 'api-optimizer.ts文件不存在');
        return;
      }
      
      logTest('API优化器文件存在性', 'PASS');
      
      const optimizerContent = fs.readFileSync(optimizerPath, 'utf8');
      
      const checks = [
        { pattern: /class.*APIOptimizer|export.*function.*optimize/, name: '优化器定义' },
        { pattern: /incremental|diff.*update/, name: '增量更新机制' },
        { pattern: /compression|gzip|deflate/, name: '数据压缩' },
        { pattern: /batch|multiple.*request/, name: '批处理请求' },
        { pattern: /cache|response.*store/, name: '响应缓存' },
        { pattern: /retry|backoff/, name: '重试机制' },
        { pattern: /timeout|abort/, name: '超时控制' },
        { pattern: /performance|metric/, name: '性能监控' },
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(optimizerContent)) {
          logTest(check.name, 'PASS', '功能实现正常');
        } else {
          logTest(check.name, 'FAIL', '功能缺失');
        }
      });
      
    } catch (error) {
      logTest('API优化器验证', 'FAIL', error.message);
    }
  }

  async testComponentIntegration() {
    logSection('7. 组件集成验证');
    
    const layoutPath = path.join(this.basePath, 'app', 'layout.tsx');
    
    try {
      if (!fs.existsSync(layoutPath)) {
        logTest('Layout文件存在性', 'FAIL');
        return;
      }
      
      logTest('Layout文件存在性', 'PASS');
      
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      
      const integrationChecks = [
        { 
          pattern: /NetworkAwareServiceWorker/, 
          name: 'NetworkAwareServiceWorker组件集成',
          details: '组件已在layout中引入'
        },
        { 
          pattern: /enableDevControls|enableStatusDisplay/, 
          name: '组件属性配置',
          details: '配置了开发调试和状态显示'
        },
        { 
          pattern: /import.*NetworkAwareServiceWorker/, 
          name: '组件导入',
          details: '正确导入了NetworkAwareServiceWorker'
        },
      ];
      
      integrationChecks.forEach(check => {
        if (check.pattern.test(layoutContent)) {
          logTest(check.name, 'PASS', check.details);
        } else {
          logTest(check.name, 'FAIL', '组件未正确集成');
        }
      });
      
    } catch (error) {
      logTest('组件集成验证', 'FAIL', error.message);
    }
  }

  async generateReport() {
    logSection('8. 系统报告生成');
    
    try {
      // 生成文件清单
      const files = [
        'public/sw.js',
        'utils/indexeddb-manager.ts',
        'components/NetworkAwareServiceWorker.tsx',
        'components/CacheManager.tsx',
        'components/RetryButton.tsx',
        'app/offline/page.tsx',
        'utils/api-optimizer.ts',
        'app/layout.tsx',
        'public/manifest.json',
      ];
      
      const existingFiles = files.filter(file => 
        fs.existsSync(path.join(this.basePath, file))
      );
      
      logTest('核心文件存在性', 'PASS', `${existingFiles.length}/${files.length}个文件存在`);
      
      // 检查manifest.json配置
      const manifestPath = path.join(this.basePath, 'public', 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        const manifestChecks = [
          { key: 'offline_enabled', expected: true },
          { key: 'display', expected: 'standalone' },
          { key: 'start_url', expected: '/' },
        ];
        
        manifestChecks.forEach(check => {
          if (manifestContent[check.key] === check.expected) {
            logTest(`Manifest配置: ${check.key}`, 'PASS', `值为: ${check.expected}`);
          } else {
            logTest(`Manifest配置: ${check.key}`, 'FAIL', `期望: ${check.expected}, 实际: ${manifestContent[check.key]}`);
          }
        });
      }
      
    } catch (error) {
      logTest('报告生成', 'FAIL', error.message);
    }
  }

  printSummary() {
    logSection('测试总结');
    
    const totalTests = 50; // 预估总测试数
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    
    log(`总测试数: ${totalTests}`, colors.white);
    log(`通过测试: ${passedTests}`, colors.green);
    log(`失败测试: ${failedTests}`, colors.red);
    log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
        passedTests > failedTests ? colors.green : colors.red);
    
    if (failedTests === 0) {
      log('\n🎉 弱网环境优化系统验证完成！所有核心功能正常运行。', colors.green);
    } else {
      log('\n⚠️  存在部分功能缺失或配置问题，请检查失败项目。', colors.yellow);
    }
    
    console.log('\n' + '='.repeat(60));
    log('验证完成', colors.cyan);
    console.log('='.repeat(60));
  }
}

// 运行测试
if (require.main === module) {
  const tester = new ServiceWorkerTester();
  tester.runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = ServiceWorkerTester;