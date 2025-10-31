#!/usr/bin/env node
/**
 * 弱网环境优化系统 - 浏览器演示和测试脚本
 * 用于在真实浏览器环境中验证弱网优化功能
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 弱网环境优化系统 - 浏览器测试指南\n');

// 写入测试页面
const testPagePath = path.join(__dirname, '..', 'public', 'weak-network-test.html');
fs.writeFileSync(testPagePath, `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>弱网环境优化系统测试页面</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status {
            padding: 12px 16px;
            border-radius: 8px;
            margin: 10px 0;
            font-weight: 500;
        }
        .status.online {
            background-color: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .status.offline {
            background-color: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }
        .button {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin: 8px;
            font-size: 14px;
            font-weight: 500;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .button:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }
        .log {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 弱网环境优化系统测试页面</h1>
        <p>此页面用于测试和演示LuckyMart TJ平台的弱网环境优化功能。</p>
        
        <div class="status" id="swStatus">🔄 Service Worker状态: 初始化中...</div>
        <div class="status" id="networkStatus">🌐 网络状态: 检测中...</div>
    </div>

    <div class="container">
        <h2>🔧 功能测试</h2>
        <button class="button" onclick="registerSW()">注册Service Worker</button>
        <button class="button" onclick="checkSWStatus()">检查SW状态</button>
        <button class="button" onclick="testCacheAPI()">测试Cache API</button>
        <button class="button" onclick="testIndexedDB()">测试IndexedDB</button>
        <button class="button" onclick="simulateOfflineData()">模拟离线数据</button>
        
        <div class="log" id="testLog"></div>
    </div>

    <script>
        let logContainer = document.getElementById('testLog');
        
        function addLog(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.innerHTML = \`[\${timestamp}] \${message}\`;
            logEntry.style.color = type === 'error' ? 'red' : type === 'success' ? 'green' : 'black';
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        async function registerSW() {
            try {
                addLog('尝试注册Service Worker...');
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    addLog('✅ Service Worker注册成功', 'success');
                    return registration;
                } else {
                    addLog('❌ 浏览器不支持Service Worker', 'error');
                }
            } catch (error) {
                addLog(\`❌ Service Worker注册失败: \${error.message}\`, 'error');
            }
        }
        
        async function checkSWStatus() {
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    addLog(\`找到 \${registrations.length} 个Service Worker注册\`);
                } else {
                    addLog('Service Worker不受支持', 'error');
                }
            } catch (error) {
                addLog(\`检查SW状态失败: \${error.message}\`, 'error');
            }
        }
        
        async function testCacheAPI() {
            try {
                if ('caches' in window) {
                    const cache = await caches.open('test-cache');
                    await cache.put('/test-url', new Response('测试响应数据'));
                    addLog('✅ Cache API测试成功', 'success');
                } else {
                    addLog('Cache API不受支持', 'error');
                }
            } catch (error) {
                addLog(\`Cache API测试失败: \${error.message}\`, 'error');
            }
        }
        
        async function testIndexedDB() {
            try {
                if ('indexedDB' in window) {
                    const request = indexedDB.open('TestDB', 1);
                    request.onsuccess = () => {
                        addLog('✅ IndexedDB测试成功', 'success');
                        request.result.close();
                    };
                    request.onupgradeneeded = () => {
                        const db = request.result;
                        if (!db.objectStoreNames.contains('test-store')) {
                            db.createObjectStore('test-store', { keyPath: 'id' });
                        }
                    };
                } else {
                    addLog('IndexedDB不受支持', 'error');
                }
            } catch (error) {
                addLog(\`IndexedDB测试失败: \${error.message}\`, 'error');
            }
        }
        
        async function simulateOfflineData() {
            try {
                if ('indexedDB' in window) {
                    const request = indexedDB.open('LuckymartOfflineDB', 1);
                    request.onsuccess = () => {
                        const db = request.result;
                        const transaction = db.transaction(['offlineQueue'], 'readwrite');
                        const store = transaction.objectStore('offlineQueue');
                        
                        const offlineData = {
                            id: Date.now().toString(),
                            type: 'offline-test',
                            data: { message: '离线测试数据', timestamp: Date.now() }
                        };
                        
                        store.add(offlineData);
                        addLog('✅ 离线数据已添加到队列', 'success');
                    };
                } else {
                    const offlineData = { id: Date.now().toString(), message: '测试数据' };
                    const existing = JSON.parse(localStorage.getItem('offline-data') || '[]');
                    existing.push(offlineData);
                    localStorage.setItem('offline-data', JSON.stringify(existing));
                    addLog('✅ 离线数据已添加到localStorage', 'success');
                }
            } catch (error) {
                addLog(\`模拟离线数据失败: \${error.message}\`, 'error');
            }
        }
        
        function init() {
            addLog('🚀 弱网环境优化系统测试页面已加载', 'success');
            
            if (navigator.onLine) {
                document.getElementById('networkStatus').className = 'status online';
                document.getElementById('networkStatus').textContent = '✅ 网络状态: 在线';
            } else {
                document.getElementById('networkStatus').className = 'status offline';
                document.getElementById('networkStatus').textContent = '❌ 网络状态: 离线';
            }
            
            setTimeout(() => registerSW(), 1000);
        }
        
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>`);

console.log(`✅ 测试页面已生成: ${testPagePath}\n`);

// 生成使用说明
console.log(`
## 🌐 浏览器测试指南

### 1. 启动应用
\`\`\`bash
cd /workspace/luckymart-tj
npm run dev
\`\`\`

### 2. 访问测试页面
在浏览器中打开: http://localhost:3000/weak-network-test.html

### 3. 测试功能
点击测试按钮验证以下功能：

#### Service Worker测试
- 🔧 Service Worker注册和状态检查
- 💾 Cache API操作测试
- 🗄️ IndexedDB功能测试
- 📱 离线数据模拟

#### 验证弱网优化效果
1. **检查网络状态** - 观察页面顶部的网络状态指示器
2. **监控缓存状态** - 查看缓存项和离线队列
3. **测试离线功能** - 断网后刷新页面验证缓存
4. **开发者工具** - 打开DevTools查看Service Worker和缓存

### 4. 开发者工具验证

#### Service Worker面板
- 打开 Chrome DevTools
- 切换到 Application > Service Workers
- 验证 SW 注册状态和缓存存储

#### Network面板  
- 查看网络请求的缓存状态 (from cache)
- 验证离线状态下的缓存响应

#### Application面板
- 查看 Cache Storage 中的缓存内容
- 检查 IndexedDB 中的离线数据

---

🎉 通过以上测试，您可以全面验证弱网环境优化系统的各项功能！
`);

console.log('\n✨ 弱网环境优化系统集成完成！');
console.log('📁 核心文件已创建并集成到应用布局中');
console.log('🧪 测试页面已生成，可用于功能验证');
console.log('📖 请按照上述指南进行浏览器测试\n');