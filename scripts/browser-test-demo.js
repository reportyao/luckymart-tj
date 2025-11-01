#!/usr/bin/env node
/**
 * 弱网环境优化系统 - 浏览器演示和测试脚本
 * 用于在真实浏览器环境中验证弱网优化功能
 */

const fs = require('fs');
const path = require('path');

console.log('\n🚀 弱网环境优化系统 - 浏览器测试指南\n');

// 生成测试页面HTML
const testPageHTML = `<!DOCTYPE html>;
<html lang:"zh-CN">
<head>
    <meta charset:"UTF-8">
    <meta name:"viewport" content="width=device-width, initial-scale=1.0">
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
        .cache-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 16px 0;
        }
        .cache-item {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        .network-indicator {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 10px 0;
        }
        .signal-strength {
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class:"container">
        <h1>🎯 弱网环境优化系统测试页面</h1>
        <p>此页面用于测试和演示LuckyMart TJ平台的弱网环境优化功能。</p>
        
        <div class="status" id="swStatus">🔄 Service Worker状态: 初始化中...</div>
        <div class="status" id="networkStatus">🌐 网络状态: 检测中...</div>
        
        <div class:"network-indicator">
            <span class:"signal-strength" id="signalStrength">📊</span>
            <span id="connectionInfo">网络信息: 加载中...</span>
        </div>
    </div>

    <div class:"container">
        <h2>🔧 功能测试</h2>
        
        <h3>Service Worker测试</h3>
        <button class:"button" onclick="registerSW()">注册Service Worker</button>
        <button class:"button" onclick="checkSWStatus()">检查SW状态</button>
        <button class:"button" onclick="updateSW()">更新SW</button>
        <button class:"button" onclick="clearCaches()">清空缓存</button>
        
        <h3>缓存测试</h3>
        <button class:"button" onclick="testCacheAPI()">测试Cache API</button>
        <button class:"button" onclick="testIndexedDB()">测试IndexedDB</button>
        <button class:"button" onclick="simulateOfflineData()">模拟离线数据</button>
        
        <h3>网络测试</h3>
        <button class:"button" onclick="simulateSlowNetwork()">模拟慢速网络</button>
        <button class:"button" onclick="simulateOffline()">模拟离线</button>
        <button class:"button" onclick="testRetryMechanism()">测试重试机制</button>
        
        <h3>数据同步测试</h3>
        <button class:"button" onclick="testIncrementalSync()">测试增量同步</button>
        <button class:"button" onclick="testBackgroundSync()">测试后台同步</button>
        
        <div class:"log" id="testLog"></div>
    </div>

    <div class:"container">
        <h2>📊 缓存状态监控</h2>
        <div class:"cache-info" id="cacheInfo">
            <div class:"cache-item">
                <h4>缓存大小</h4>
                <div id:"cacheSize">计算中...</div>
            </div>
            <div class:"cache-item">
                <h4>缓存项数</h4>
                <div id:"cacheCount">计算中...</div>
            </div>
            <div class:"cache-item">
                <h4>离线队列</h4>
                <div id:"offlineQueue">计算中...</div>
            </div>
            <div class:"cache-item">
                <h4>网络质量</h4>
                <div id:"networkQuality">检测中...</div>
            </div>
        </div>
        <button class:"button" onclick="updateCacheInfo()">更新缓存信息</button>
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
        
        function updateNetworkStatus() {
            const statusEl = document.getElementById('networkStatus');
            const isOnline = navigator.onLine;
            
            statusEl.className = \`status \${isOnline ? 'online' : 'offline'}\`;
            statusEl.textContent = isOnline ? '✅ 网络状态: 在线' : '❌ 网络状态: 离线';
            
            // 更新网络信息
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            const infoEl = document.getElementById('connectionInfo');
            const signalEl = document.getElementById('signalStrength');
            
            if (connection) {
                const effectiveType = connection.effectiveType;
                const downlink = connection.downlink;
                
                let signal, quality;
                switch(effectiveType) {
                    case '4g':
                        signal = '🟢';
                        quality = '优秀';
                        break;
                    case '3g':
                        signal = '🟡';
                        quality = '良好';
                        break;
                    case '2g':
                        signal = '🟠';
                        quality = '一般';
                        break;
                    default:
                        signal = '⚫';
                        quality = '未知';
                }
                
                signalEl.textContent = signal;
                infoEl.textContent = \`网络类型: \${effectiveType}, 下行速度: \${downlink} Mbps, 质量: \${quality}\`;
            } else {
                signalEl.textContent = '❓';
                infoEl.textContent = '网络信息不可用';
            }
        }
        
        async function registerSW() {
            try {
                addLog('尝试注册Service Worker...');
                
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    addLog('✅ Service Worker注册成功', 'success');
                    
                    const swStatus = document.getElementById('swStatus');
                    swStatus.className = 'status online';
                    swStatus.textContent = '✅ Service Worker状态: 已注册并激活';
                    
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
                    
                    registrations.forEach((reg, index) => {
                        addLog(\`Registration \${index}: \${reg.scope}\`);
                        addLog(\`  - installing: \${reg.installing ? 'yes' : 'no'}\`);
                        addLog(\`  - waiting: \${reg.waiting ? 'yes' : 'no'}\`);
                        addLog(\`  - active: \${reg.active ? 'yes' : 'no'}\`);
                    });
                } else {
                    addLog('Service Worker不受支持', 'error');
                }
            } catch (error) {
                addLog(\`检查SW状态失败: \${error.message}\`, 'error');
            }
        }
        
        async function updateSW() {
            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                if (registrations.length > 0) {
                    const sw = (registrations?.0 ?? null).installing || (registrations?.0 ?? null).waiting || (registrations?.0 ?? null).active;
                    if (sw) {
                        sw.postMessage({ type: 'SKIP_WAITING' });
                        addLog('✅ 发送SKIP_WAITING消息', 'success');
                    }
                } else {
                    addLog('没有找到Service Worker注册', 'error');
                }
            } catch (error) {
                addLog(\`更新SW失败: \${error.message}\`, 'error');
            }
        }
        
        async function clearCaches() {
            try {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    addLog(\`✅ 成功删除 \${cacheNames.length} 个缓存\`, 'success');
                } else {
                    addLog('Cache API不受支持', 'error');
                }
            } catch (error) {
                addLog(\`清空缓存失败: \${error.message}\`, 'error');
            }
        }
        
        async function testCacheAPI() {
            try {
                if ('caches' in window) {
                    const cache = await caches.open('test-cache');
                    await cache.put('/test-url', new Response('测试响应数据'));
                    addLog('✅ Cache API测试成功 - 数据已缓存', 'success');
                    
                    // 读取缓存
                    const response = await cache.match('/test-url');
                    if (response) {
                        const text = await response.text();
                        addLog(\`✅ 缓存读取成功: \${text}\`);
                    }
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
                    
                    request.onerror = () => {
                        addLog('IndexedDB打开失败', 'error');
                    };
                    
                    request.onsuccess = () => {
                        addLog('✅ IndexedDB测试成功 - 数据库已创建', 'success');
                        request.result.close();
                    };
                    
                    request.onupgradeneeded = () => {
                        const db = request.result;
                        if (!db.objectStoreNames.contains('test-store')) {
                            db.createObjectStore('test-store', { keyPath: 'id' });
                            addLog('创建对象存储: test-store');
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
                // 模拟离线状态下的数据处理
                if ('indexedDB' in window) {
                    const request = indexedDB.open('LuckymartOfflineDB', 1);
                    
                    request.onsuccess = () => {
                        const db = request.result;
                        const transaction = db.transaction(['offlineQueue'], 'readwrite');
                        const store = transaction.objectStore('offlineQueue');
                        
                        // 添加离线数据
                        const offlineData = {
                            id: Date.now().toString(),
                            type: 'offline-test',
                            data: { message: '离线测试数据', timestamp: Date.now() }
                        };
                        
                        store.add(offlineData);
                        addLog('✅ 离线数据已添加到队列', 'success');
                    };
                } else {
                    // 使用localStorage作为后备
                    const offlineData = {
                        id: Date.now().toString(),
                        type: 'offline-test',
                        data: { message: '离线测试数据', timestamp: Date.now() }
                    };
                    
                    const existing = JSON.parse(localStorage.getItem('offline-data') || '[]');
                    existing.push(offlineData);
                    localStorage.setItem('offline-data', JSON.stringify(existing));
                    
                    addLog('✅ 离线数据已添加到localStorage', 'success');
                }
            } catch (error) {
                addLog(\`模拟离线数据失败: \${error.message}\`, 'error');
            }
        }
        
        async function simulateSlowNetwork() {
            try {
                // 模拟慢速网络的检测和优化
                const startTime = performance.now();
                
                // 模拟慢速响应
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const duration = performance.now() - startTime;
                addLog(\`📉 模拟慢速网络响应: \${duration.toFixed(2)}ms\`);
                
                // 模拟缓存优先策略
                if ('caches' in window) {
                    const cache = await caches.open('test-slow-network');
                    const cached = await cache.match('/api/slow-endpoint');
                    
                    if (cached) {
                        addLog('✅ 使用缓存数据跳过慢速网络请求', 'success');
                    } else {
                        addLog('⚠️  没有缓存数据，必须等待慢速网络响应');
                    }
                }
            } catch (error) {
                addLog(\`模拟慢速网络失败: \${error.message}\`, 'error');
            }
        }
        
        async function simulateOffline() {
            addLog('📴 模拟离线状态...');
            
            // 监听网络状态变化
            function handleOnline() {
                addLog('🟢 网络已恢复! 触发数据同步', 'success');
                updateNetworkStatus();
            }
            
            function handleOffline() {
                addLog('🔴 检测到离线状态! 切换到离线模式', 'error');
                updateNetworkStatus();
            }
            
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            
            // 模拟网络状态切换（实际测试中需要手动切换）
            addLog('ℹ️  请手动切换网络状态以测试离线功能');
        }
        
        async function testRetryMechanism() {
            try {
                let attempts = 0;
                const maxAttempts = 3;
                
                addLog('🔄 开始重试机制测试...');
                
                async function attemptRequest() {
                    attempts++;
                    addLog(\`第 \${attempts} 次尝试...\`);
                    
                    // 模拟网络请求失败
                    if (attempts < maxAttempts) {
                        throw new Error('模拟网络错误');
                    }
                    
                    return '请求成功';
                }
                
                // 实现指数退避重试
                let delay = 1000; // 1秒;
                for (let i = 0; i < maxAttempts; i++) {
                    try {
                        const result = await attemptRequest();
                        addLog(\`✅ 重试成功: \${result}\`, 'success');
                        break;
                    } catch (error) {
                        if (i === maxAttempts - 1) {
                            addLog(\`❌ 所有重试均失败: \${error.message}\`, 'error');
                        } else {
                            addLog(\`⚠️  第 \${attempts} 次尝试失败，\${delay}ms 后重试...\`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            delay *= 2; // 指数退避
                        }
                    }
                }
            } catch (error) {
                addLog(\`重试机制测试失败: \${error.message}\`, 'error');
            }
        }
        
        async function testIncrementalSync() {
            try {
                addLog('🔄 测试增量数据同步...');
                
                // 模拟增量更新数据
                const incrementalData = {
                    lastVersion: 100,
                    updates: [
                        { id: 1, version: 101, type: 'update', data: { name: '新名称' } },
                        { id: 2, version: 102, type: 'create', data: { name: '新项目' } }
                    ]
                };
                
                // 模拟合并增量数据
                let localData = { version: 100, items: [{ id: 1, name: '原名称' }] };
                
                incrementalData.updates.forEach(update => {
                    const existingIndex = localData.items.findIndex(item => item.id === update.id);
                    
                    if (update.type === 'update' && existingIndex >= 0) {
                        localData.(items?.existingIndex ?? null) = { ...localData.(items?.existingIndex ?? null), ...update.data };
                    } else if (update.type === 'create') {
                        localData.items.push(update.data);
                    }
                });
                
                localData.version = Math.max(...incrementalData.updates.map(u => u.version));
                
                addLog('✅ 增量同步测试完成', 'success');
                addLog(\`本地数据版本: \${localData.version}\`);
                addLog(\`数据项数: \${localData.items.length}\`);
            } catch (error) {
                addLog(\`增量同步测试失败: \${error.message}\`, 'error');
            }
        }
        
        async function testBackgroundSync() {
            try {
                addLog('🔄 测试后台同步功能...');
                
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    if (registrations.length > 0) {
                        const sw = (registrations?.0 ?? null).active || (registrations?.0 ?? null).installing || (registrations?.0 ?? null).waiting;
                        if (sw) {
                            sw.postMessage({
                                type: 'BACKGROUND_SYNC_TEST',
                                data: { test: true, timestamp: Date.now() }
                            });
                            addLog('✅ 后台同步消息已发送', 'success');
                        }
                    } else {
                        addLog('没有找到活动的Service Worker', 'error');
                    }
                } else {
                    addLog('Service Worker不受支持', 'error');
                }
            } catch (error) {
                addLog(\`后台同步测试失败: \${error.message}\`, 'error');
            }
        }
        
        async function updateCacheInfo() {
            try {
                let cacheSize = 0;
                let cacheCount = 0;
                let offlineQueue = 0;
                let networkQuality = '未知';
                
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    for (const cacheName of cacheNames) {
                        const cache = await caches.open(cacheName);
                        const keys = await cache.keys();
                        cacheCount += keys.length;
                    }
                    document.getElementById('cacheCount').textContent = cacheCount;
                }
                
                // 检查离线队列
                if ('indexedDB' in window) {
                    const request = indexedDB.open('LuckymartOfflineDB', 1);
                    request.onsuccess = () => {
                        const db = request.result;
                        const transaction = db.transaction(['offlineQueue'], 'readonly');
                        const store = transaction.objectStore('offlineQueue');
                        const getAllRequest = store.getAll();
                        
                        getAllRequest.onsuccess = () => {
                            document.getElementById('offlineQueue').textContent = getAllRequest.result.length;
                        };
                    };
                }
                
                // 检查网络质量
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                if (connection) {
                    networkQuality = connection.effectiveType || '未知';
                }
                document.getElementById('networkQuality').textContent = networkQuality;
                
                document.getElementById('cacheSize').textContent = '估算中...';
                
                addLog('✅ 缓存信息已更新');
            } catch (error) {
                addLog(\`更新缓存信息失败: \${error.message}\`, 'error');
            }
        }
        
        // 初始化
        function init() {
            addLog('🚀 弱网环境优化系统测试页面已加载', 'success');
            updateNetworkStatus();
            
            // 监听网络状态变化
            window.addEventListener('online', updateNetworkStatus);
            window.addEventListener('offline', updateNetworkStatus);
            
            // 自动注册Service Worker
            setTimeout(() => {
                registerSW();
            }, 1000);
            
            // 初始更新缓存信息
            setTimeout(() => {
                updateCacheInfo();
            }, 2000);
        }
        
        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', init);
        
        // 控制台日志
        console.log('🎯 弱网环境优化系统测试页面已加载');
        console.log('📋 可用测试功能:');
        console.log('  - registerSW() - 注册Service Worker');
        console.log('  - checkSWStatus() - 检查SW状态');
        console.log('  - testCacheAPI() - 测试Cache API');
        console.log('  - testIndexedDB() - 测试IndexedDB');
        console.log('  - simulateOfflineData() - 模拟离线数据');
        console.log('  - updateCacheInfo() - 更新缓存信息');
    </script>
</body>
</html>`;

// 写入测试页面
const testPagePath = path.join(__dirname, 'public', 'weak-network-test.html');
fs.writeFileSync(testPagePath, testPageHTML);

console.log(`✅ 测试页面已生成: ${testPagePath}\n`);

// 生成使用说明
const usageInstructions = `;
## 🌐 浏览器测试指南

### 1. 启动应用
\`\`\`bash
cd /workspace/luckymart-tj
npm run dev
\`\`\`

### 2. 访问测试页面
在浏览器中打开: ${API_BASE_URL}/weak-network-test.html

### 3. 测试功能
点击测试按钮验证以下功能：

#### Service Worker测试
- 🔧 Service Worker注册和状态检查
- 🔄 Service Worker更新机制
- 🗑️ 缓存清理功能

#### 缓存测试  
- 💾 Cache API操作测试
- 🗄️ IndexedDB功能测试
- 📱 离线数据模拟

#### 网络测试
- 🐌 慢速网络模拟
- 📴 离线状态模拟  
- 🔄 重试机制验证

#### 数据同步测试
- 📊 增量数据同步测试
- ⚡ 后台同步验证

### 4. 验证弱网优化效果

#### 检查网络状态
- 观察页面顶部的网络状态指示器
- 查看信号强度和网络类型显示

#### 监控缓存状态  
- 在"缓存状态监控"区域查看实时统计
- 检查缓存大小、项数和离线队列

#### 测试离线功能
1. 断网或切换到飞行模式
2. 刷新页面，验证离线页面是否显示
3. 检查缓存数据是否正常加载

#### 测试缓存策略
1. 在在线状态下访问应用页面
2. 断网后再次访问，验证缓存内容
3. 检查不同资源的缓存命中率

### 5. 开发者工具验证

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

### 6. 性能测试

#### 模拟不同网络条件
- 使用 Chrome DevTools Network 面板
- 模拟 Slow 3G、Fast 3G 等慢速网络
- 验证缓存策略对性能的影响

#### 测量关键指标
- 🎯 缓存命中率: 目标 > 80%
- 🚀 离线响应时间: 目标 < 100ms  
- 📊 网络请求减少: 目标 60-80%

### 7. 故障排查

#### 常见问题
1. **Service Worker 不注册**
   - 检查浏览器支持
   - 查看控制台错误信息

2. **缓存不生效**
   - 验证缓存策略配置
   - 检查请求URL匹配规则

3. **离线功能异常**
   - 确认网络状态检测
   - 验证离线页面路径

#### 调试工具
- 使用控制台日志进行诊断
- 监控 Service Worker 消息通信
- 检查 IndexedDB 数据存储

---

🎉 通过以上测试，您可以全面验证弱网环境优化系统的各项功能！
`;

console.log(usageInstructions);

console.log('\n✨ 弱网环境优化系统集成完成！');
console.log('📁 核心文件已创建并集成到应用布局中');
console.log('🧪 测试页面已生成，可用于功能验证');
console.log('📖 请按照上述指南进行浏览器测试\n');