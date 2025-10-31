# Service Worker离线翻译缓存系统

## 概述

本系统实现了基于Service Worker的离线翻译文件缓存功能，提供智能的缓存管理、版本控制和离线优先策略。通过缓存翻译文件到浏览器Cache Storage，显著提升应用的离线体验和加载性能。

## 核心特性

### 🚀 主要功能
- **离线优先策略**：网络失败时优先使用缓存的翻译文件
- **智能版本控制**：基于版本号的缓存更新机制
- **LRU缓存清理**：最近最少使用策略，防止缓存溢出
- **容量管理**：50MB缓存限制，自动清理过期数据
- **多语言支持**：支持zh-CN、en-US、ru-RU、tg-TJ四种语言
- **降级机制**：网络失败时提供默认翻译内容

### 📊 缓存策略
- **首次访问**：自动下载并缓存所有翻译文件
- **版本检查**：只有版本变化时才更新缓存
- **智能预加载**：优先缓存当前语言的核心文件
- **定期清理**：每24小时清理一次过期缓存
- **容量控制**：超过80%容量时停止预加载

### 🔧 技术特性
- **Service Worker**：后台处理缓存逻辑
- **Cache Storage**：浏览器原生缓存存储
- **MessageChannel**：主线程与Service Worker通信
- **错误恢复**：网络失败时的优雅降级
- **性能监控**：缓存健康状态实时监控

## 文件结构

```
luckymart-tj/
├── public/
│   └── sw-translations.js          # Service Worker核心文件
├── utils/
│   └── translation-cache.ts        # 缓存管理工具
├── components/
│   ├── ServiceWorkerRegistration.tsx  # SW注册组件
│   └── TranslationCacheDemo.tsx       # 演示组件
└── src/i18n/
    ├── config.ts                   # i18n配置
    ├── I18nProvider.tsx            # i18n提供者
    └── locales/                    # 翻译文件
        ├── zh-CN/
        ├── en-US/
        ├── ru-RU/
        └── tg-TJ/
```

## 快速开始

### 1. 基础集成

```tsx
// app/layout.tsx
import { I18nProvider } from '@/src/i18n/I18nProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <I18nProvider>
          {children}
          <ServiceWorkerRegistration 
            showControls={true}
            autoPreload={true}
          />
        </I18nProvider>
      </body>
    </html>
  );
}
```

### 2. 使用缓存管理器

```tsx
// 组件中使用缓存功能
import { translationCache } from '@/utils/translation-cache';

export function MyComponent() {
  // 检查缓存状态
  const checkCache = async () => {
    const status = await translationCache.getCacheStatus();
    console.log('缓存状态:', status);
  };

  // 预加载翻译
  const preloadTranslations = async () => {
    const result = await translationCache.preloadTranslations(['zh-CN']);
    console.log('预加载结果:', result);
  };

  // 清除缓存
  const clearCache = async () => {
    const result = await translationCache.clearCache();
    console.log('清除结果:', result);
  };

  return (
    <div>
      <button onClick={checkCache}>检查缓存</button>
      <button onClick={preloadTranslations}>预加载</button>
      <button onClick={clearCache}>清除缓存</button>
    </div>
  );
}
```

### 3. 智能缓存初始化

```tsx
// 智能初始化缓存
import { cacheManager } from '@/utils/translation-cache';

export async function initializeApp() {
  // 初始化缓存
  const initialized = await cacheManager.init();
  if (!initialized) {
    console.warn('缓存初始化失败');
    return;
  }

  // 执行智能预加载
  const result = await cacheManager.smartPreload();
  console.log('预加载完成:', result);
}
```

## API参考

### TranslationCacheManager类

#### 主要方法

##### `initialize(): Promise<boolean>`
初始化Service Worker并注册缓存功能。

```typescript
const success = await translationCache.initialize();
if (success) {
  console.log('缓存系统已就绪');
}
```

##### `getCacheStatus(): Promise<CacheStatus>`
获取当前缓存状态信息。

```typescript
const status = await translationCache.getCacheStatus();
console.log('总文件数:', status.totalFiles);
console.log('缓存大小:', status.size);
```

##### `preloadTranslations(languages?: SupportedLanguage[]): Promise<PreloadResult>`
预加载指定语言的翻译文件。

```typescript
const result = await translationCache.preloadTranslations(['zh-CN', 'en-US']);
console.log('成功:', result.success.length);
console.log('失败:', result.failed.length);
```

##### `clearCache(): Promise<ClearCacheResult>`
清除所有缓存数据。

```typescript
const result = await translationCache.clearCache();
if (result.success) {
  console.log('缓存已清除');
}
```

##### `isTranslationCached(language, namespace): Promise<boolean>`
检查特定翻译文件是否已缓存。

```typescript
const isCached = await translationCache.isTranslationCached('zh-CN', 'common');
```

##### `getCacheStats(): Promise<CacheStats>`
获取详细的缓存统计信息。

```typescript
const stats = await translationCache.getCacheStats();
console.log('按语言统计:', stats.languages);
```

### ServiceWorkerRegistration组件

#### Props

```typescript
interface ServiceWorkerRegistrationProps {
  showControls?: boolean;    // 显示控制面板，默认true
  showStatus?: boolean;      // 显示状态信息，默认true
  autoPreload?: boolean;     // 自动预加载，默认true
  compact?: boolean;         // 紧凑模式，默认false
}
```

#### 使用示例

```tsx
// 完整控制面板
<ServiceWorkerRegistration 
  showControls={true}
  showStatus={true}
  autoPreload={false}
/>

// 紧凑状态指示器
<ServiceWorkerRegistration 
  showControls={false}
  showStatus={true}
  compact={true}
/>
```

## 缓存策略详解

### 版本控制

```javascript
// Service Worker中的版本管理
const CACHE_VERSION = '1.0.0';
const CACHE_NAME = `translations-cache-v${CACHE_VERSION}`;

// 自动清理旧版本缓存
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('translations-cache-') && name !== CACHE_NAME
  );
  await Promise.all(oldCaches.map(name => caches.delete(name)));
}
```

### LRU清理策略

```javascript
// 最近最少使用清理
function recordAccess(cacheKey) {
  accessLog.set(cacheKey, Date.now());
}

async function cleanupCache(cache) {
  const sortedEntries = Array.from(accessLog.entries())
    .sort(([, a], [, b]) => a - b);
  
  const entriesToDelete = Math.ceil(sortedEntries.length * 0.2);
  
  for (let i = 0; i < entriesToDelete; i++) {
    const [cacheKey] = sortedEntries[i];
    await cache.delete(cacheKey);
  }
}
```

### 离线优先策略

```javascript
// 离线优先处理
async function handleTranslationRequest(request) {
  // 首先尝试缓存
  const cachedResponse = await getFromCache(cacheKey);
  if (cachedResponse) {
    return cachedResponse; // 立即返回缓存
  }
  
  // 缓存未命中，从网络获取
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await addToCache(cacheKey, networkResponse);
    }
    return networkResponse;
  } catch (error) {
    // 网络失败，返回过期缓存或默认内容
    const staleResponse = await getStaleFromCache(cacheKey);
    return staleResponse || createFallbackResponse(url);
  }
}
```

## 最佳实践

### 1. 预加载策略

```tsx
// 智能预加载实现
async function smartPreload() {
  const stats = await cacheManager.stats();
  
  // 缓存为空时预加载所有文件
  if (!stats || stats.totalFiles === 0) {
    return cacheManager.preload();
  }
  
  // 缓存较大时只预加载当前语言
  if (stats.size > '40MB') {
    return cacheManager.preload([currentLanguage]);
  }
  
  // 否则跳过预加载
  return { success: [], failed: [], total: 0 };
}
```

### 2. 缓存监控

```tsx
// 定期检查缓存健康状态
useEffect(() => {
  const checkHealth = async () => {
    const health = await cacheManager.health();
    if (health.status !== 'healthy') {
      console.warn('缓存健康状态异常:', health.message);
    }
  };

  checkHealth();
  const interval = setInterval(checkHealth, 30000); // 每30秒检查
  
  return () => clearInterval(interval);
}, []);
```

### 3. 错误处理

```tsx
// 优雅的错误处理
try {
  const result = await translationCache.preloadTranslations(['zh-CN']);
  
  if (result.failed.length > 0) {
    console.warn('部分文件预加载失败:', result.failed);
    // 可以显示用户友好的错误信息
    showNotification('部分翻译文件加载失败，已使用缓存版本');
  }
} catch (error) {
  console.error('预加载失败:', error);
  // 确保应用不会因为缓存问题而崩溃
  showNotification('翻译加载出现问题，请检查网络连接');
}
```

## 性能优化

### 1. 缓存大小控制

```javascript
// 智能大小控制
const CACHE_CONFIG = {
  maxSize: 50 * 1024 * 1024, // 50MB
  cleanupThreshold: 40 * 1024 * 1024 // 40MB清理阈值
};

async function addToCache(cacheKey, response) {
  const cacheSize = await getCacheSize();
  if (cacheSize > CACHE_CONFIG.cleanupThreshold) {
    await cleanupCache(cache); // 提前清理
  }
}
```

### 2. 预加载优化

```javascript
// 核心文件优先预加载
const ESSENTIAL_FILES = [
  'locales/zh-CN/common.json',
  'locales/en-US/common.json',
  'locales/tg-TJ/common.json'
];

async function preloadEssentialTranslations(cache) {
  // 并行预加载核心文件，提升速度
  await Promise.all(
    ESSENTIAL_FILES.map(path => preloadSingleFile(cache, path))
  );
}
```

### 3. 网络优化

```javascript
// 离线检测和缓存策略调整
if (!navigator.onLine) {
  // 离线时只使用缓存，不发起网络请求
  return getFromCache(cacheKey);
}

// 在线时进行后台更新
if (isUpdateAvailable()) {
  updateCacheInBackground();
}
```

## 故障排除

### 常见问题

#### 1. Service Worker注册失败

```typescript
// 检查浏览器支持
if (!('serviceWorker' in navigator)) {
  console.error('浏览器不支持Service Worker');
  return;
}

// 检查权限
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  console.error('Service Worker需要HTTPS或localhost环境');
  return;
}
```

#### 2. 缓存未生效

```typescript
// 检查缓存状态
const status = await translationCache.getCacheStatus();
if (!status || status.totalFiles === 0) {
  // 执行手动预加载
  await translationCache.preloadTranslations();
}
```

#### 3. 内存泄漏

```typescript
// 定期清理资源
useEffect(() => {
  const cleanup = () => {
    // 清理消息通道
    if (messageChannel) {
      messageChannel.port1.close();
    }
  };

  return cleanup;
}, []);
```

### 调试工具

```tsx
// 启用详细日志
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  // 监听Service Worker事件
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('SW消息:', event.data);
  });
  
  // 监听缓存事件
  caches.open(CACHE_NAME).then(cache => {
    cache.keys().then(keys => {
      console.log('缓存键:', keys.map(k => k.url));
    });
  });
}
```

## 部署注意事项

### 1. HTTPS要求
Service Worker需要在HTTPS环境下运行，确保生产环境已启用HTTPS。

### 2. 缓存策略
生产环境中建议：
- 设置合理的缓存过期时间
- 实施渐进式缓存更新
- 监控缓存大小和性能

### 3. 用户隐私
确保缓存策略符合用户隐私要求，提供清除缓存选项。

## 未来规划

- [ ] 支持Service Worker更新提示
- [ ] 实现翻译文件增量更新
- [ ] 添加缓存使用统计
- [ ] 支持离线翻译文件同步
- [ ] 实现翻译文件压缩
- [ ] 添加缓存预取策略

## 贡献指南

1. Fork本项目
2. 创建功能分支
3. 提交代码更改
4. 创建Pull Request

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

---

如有问题或建议，请创建Issue或联系开发团队。