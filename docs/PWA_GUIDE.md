# LuckyMart TJ PWA开发指南

## 概述

LuckyMart TJ已成功实现完整的PWA（Progressive Web App）支持，提供原生应用般的用户体验。本指南详细说明了PWA功能的开发、配置和部署。

## PWA功能特性

### ✅ 已实现功能

1. **离线使用功能**
   - Service Worker全局配置
   - 应用离线缓存策略
   - 离线数据同步机制
   - 离线用户引导界面

2. **桌面图标支持**
   - Web App Manifest配置
   - 多尺寸图标支持：72x72、96x96、128x128、144x144、152x152、192x192、384x384、512x512
   - iOS Safari和Android Chrome支持
   - 快捷方式支持

3. **推送通知支持**
   - Web Push通知API集成
   - 通知权限请求
   - 通知消息模板
   - 通知点击处理
   - 服务端推送服务

4. **应用安装优化**
   - Install Prompt显示时机
   - 自定义安装提示界面
   - 安装成功确认界面
   - 跨浏览器兼容性

5. **应用生命周期管理**
   - Background Sync后台同步
   - 应用更新提示
   - 数据同步冲突解决
   - Service Worker消息通信

6. **性能优化**
   - 应用启动速度优化
   - 资源预加载和缓存
   - 代码分割和懒加载
   - 图片和资源优化

## 核心组件

### PWAInstaller组件
- 位置：`/components/PWAInstaller.tsx`
- 功能：处理应用安装提示和安装流程
- 特性：智能时机显示、跨浏览器支持

### NotificationManager组件
- 位置：`/components/NotificationManager.tsx`
- 功能：管理推送通知权限和设置
- 特性：权限管理、通知类型设置

### OfflineIndicator组件
- 位置：`/components/OfflineIndicator.tsx`
- 功能：显示离线状态和同步进度
- 特性：网络状态监控、离线队列管理

### UpdatePrompt组件
- 位置：`/components/UpdatePrompt.tsx`
- 功能：处理应用更新提示和更新流程
- 特性：智能更新检测、进度显示

### ServiceWorkerRegistration组件
- 位置：`/components/ServiceWorkerRegistration.tsx`
- 功能：Service Worker注册和管理
- 特性：缓存管理、状态监控

## 配置文件

### manifest.json
- 位置：`/public/manifest.json`
- 作用：Web App Manifest配置
- 包含：应用信息、图标、快捷方式、主题色

### sw.js (Service Worker)
- 位置：`/public/sw.js`
- 作用：处理离线缓存、网络请求拦截
- 特性：缓存策略、后台同步、推送通知

### pwa.config.js
- 位置：`/pwa.config.js`
- 作用：PWA专用配置
- 包含：缓存规则、离线策略、通知配置

### next.config.js
- 位置：`/next.config.js`
- 作用：Next.js PWA配置
- 包含：PWA启用、缓存策略、安全头

## API路由

### 通知相关API
- `/api/notifications/vapid-public-key` - 获取VAPID公钥
- `/api/notifications/subscribe` - 订阅推送通知
- `/api/notifications/unsubscribe` - 取消推送订阅
- `/api/notifications/test` - 发送测试通知

## Hooks

### usePWA Hook
- 位置：`/hooks/usePWA.ts`
- 功能：PWA状态管理
- 提供：安装状态、更新状态、缓存管理、推送订阅

## 页面

### 离线页面
- 位置：`/app/offline/page.tsx`
- 功能：离线模式显示
- 特性：网络状态检测、离线功能说明

### PWA设置页面
- 位置：`/app/pwa-settings/page.tsx`
- 功能：PWA设置管理
- 包含：安装状态、更新管理、缓存管理、通知设置

## 开发指南

### 本地开发

1. **启动开发服务器**
```bash
npm run dev
```

2. **访问PWA设置页面**
```
http://localhost:3000/pwa-settings
```

3. **测试离线功能**
- 在开发者工具中模拟离线
- 检查Service Worker是否正常注册
- 验证离线页面显示

### 生产部署

1. **环境变量配置**
```env
NEXT_PUBLIC_PWA_ENABLED=true
NEXT_PUBLIC_PWA_DEBUG=false
```

2. **构建优化**
```bash
npm run build
npm run start
```

3. **HTTPS要求**
- PWA功能需要HTTPS环境
- 本地开发可以使用localhost
- 生产环境必须配置SSL证书

### 测试清单

#### 功能测试
- [ ] 应用可以安装到设备
- [ ] 离线时显示离线页面
- [ ] 推送通知正常工作
- [ ] 应用更新功能正常
- [ ] 缓存策略生效

#### 兼容性测试
- [ ] Chrome/Edge (Android/Desktop)
- [ ] Safari (iOS/macOS)
- [ ] Firefox (Android/Desktop)
- [ ] 微信内置浏览器

#### 性能测试
- [ ] 首屏加载时间 < 3秒
- [ ] 离线页面加载时间 < 2秒
- [ ] 缓存命中率 > 80%
- [ ] Service Worker激活时间 < 5秒

## 浏览器兼容性

| 浏览器 | 版本要求 | PWA支持 | 推送通知 | 离线缓存 |
|--------|----------|---------|----------|----------|
| Chrome | 40+ | ✅ | ✅ | ✅ |
| Firefox | 44+ | ✅ | ✅ | ✅ |
| Safari | 11.1+ | ✅ | ✅ | ✅ |
| Edge | 17+ | ✅ | ✅ | ✅ |
| 微信 | 最新版 | ⚠️ | ⚠️ | ✅ |

## 故障排除

### 常见问题

1. **Service Worker未注册**
   - 检查HTTPS环境
   - 确认sw.js文件存在
   - 查看浏览器控制台错误

2. **安装提示不显示**
   - 检查浏览器支持
   - 确认manifest.json配置
   - 检查时机逻辑

3. **推送通知失败**
   - 确认权限已授权
   - 检查VAPID配置
   - 验证Service Worker注册

4. **离线功能异常**
   - 检查缓存策略配置
   - 确认离线页面存在
   - 验证网络状态检测

### 调试工具

1. **Chrome DevTools**
   - Application面板 → Service Workers
   - Application面板 → Cache Storage
   - Lighthouse PWA审计

2. **Firefox DevTools**
   - Storage面板 → Cache
   - Service Workers面板

3. **Safari Develop菜单**
   - Service Workers面板
   - Storage面板

## 最佳实践

### 性能优化
- 使用合适的缓存策略
- 压缩静态资源
- 预加载关键资源
- 懒加载非关键内容

### 用户体验
- 智能显示安装提示
- 平滑的离线体验
- 及时的状态反馈
- 清晰的错误提示

### 安全考虑
- 使用HTTPS
- 验证推送通知源
- 限制缓存大小
- 定期清理过期数据

## 维护更新

### 版本管理
- 遵循语义化版本
- 更新manifest.json版本
- 维护changelog

### 监控指标
- 安装率
- 离线使用率
- 通知点击率
- 缓存命中率

### 持续优化
- 定期性能测试
- 用户反馈收集
- 浏览器兼容性更新
- 功能特性增强