# LuckyMart TJ PWA快速部署指南

## 快速开始

### 1. 环境准备
```bash
# 确保Node.js版本 ≥ 18
node --version

# 安装依赖
npm install

# 安装web-push依赖（如果npm install失败）
# 手动添加到package.json的dependencies中
"web-push": "^3.6.7"
```

### 2. PWA配置确认

#### 检查manifest.json
- 位置：`/public/manifest.json`
- 确保所有图标文件存在
- 验证配置正确性

#### 检查Service Worker
- 位置：`/public/sw.js`
- 确认文件可访问
- 验证缓存策略配置

### 3. 开发环境测试

```bash
# 启动开发服务器
npm run dev

# 访问PWA设置页面
# http://localhost:3000/pwa-settings

# 测试功能
# 1. 检查Service Worker是否注册
# 2. 测试离线功能
# 3. 验证安装提示
# 4. 测试推送通知
```

### 4. 生产部署

#### 构建应用
```bash
npm run build
npm run start
```

#### HTTPS配置（必须）
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        try_files $uri $uri/ @fallback;
    }
}
```

#### VAPID密钥配置
在API路由中配置真实的VAPID密钥：
```typescript
const vapidPublicKey = 'YOUR_REAL_VAPID_PUBLIC_KEY';
const vapidPrivateKey = 'YOUR_REAL_VAPID_PRIVATE_KEY';
```

### 5. PWA验证清单

#### 必检项目
- [ ] HTTPS环境
- [ ] manifest.json可访问
- [ ] Service Worker注册成功
- [ ] 图标文件完整
- [ ] 离线页面可访问

#### 功能验证
- [ ] 可以安装到设备
- [ ] 离线时显示离线页面
- [ ] 推送通知权限请求
- [ ] 应用更新功能
- [ ] 缓存策略生效

#### 性能检查
- [ ] Lighthouse PWA评分 > 90
- [ ] 离线页面加载 < 2秒
- [ ] 缓存命中率 > 80%
- [ ] 首屏加载 < 3秒

### 6. 故障排除

#### 常见问题
1. **Service Worker未注册**
   ```javascript
   // 检查控制台错误
   // 确认HTTPS环境
   // 验证sw.js文件存在
   ```

2. **图标不显示**
   ```bash
   # 确认图标文件存在
   ls /public/icons/
   
   # 检查文件权限
   chmod 644 /public/icons/*
   ```

3. **推送通知失败**
   ```javascript
   // 检查权限状态
   // 确认VAPID密钥正确
   // 验证Service Worker注册
   ```

4. **安装提示不显示**
   ```javascript
   // 检查浏览器支持
   // 验证manifest.json配置
   // 确认时机逻辑
   ```

#### 调试工具
- Chrome DevTools → Application → Service Workers
- Chrome DevTools → Application → Cache Storage
- Lighthouse PWA Audit

### 7. 监控和维护

#### 性能监控
- 使用Lighthouse定期检查
- 监控缓存命中率
- 跟踪离线使用率

#### 日志监控
- Service Worker错误日志
- 缓存操作日志
- 推送通知状态

### 8. 维护计划

#### 定期任务
- **每周**：检查PWA评分
- **每月**：分析用户行为数据
- **每季度**：更新依赖包
- **按需**：优化缓存策略

#### 版本更新
```bash
# 更新manifest.json版本
# 触发Service Worker更新
# 通知用户更新
```

---

## 联系支持

如有问题，请参考：
- 开发指南：`/docs/PWA_GUIDE.md`
- 完成报告：`/docs/PWA_COMPLETION_REPORT.md`
- 技术支持：联系开发团队