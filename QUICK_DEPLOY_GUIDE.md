# 开奖触发机制优化 - 快速部署指南

## 🚀 一键部署 (推荐)

### 1. 上传文件到服务器
将以下文件上传到您的服务器 `/var/www/luckymart-tj/` 目录：

```
✅ app/api/lottery/participate/route.ts
✅ lib/lottery.ts  
✅ supabase/functions/auto-draw/index.ts
✅ app/api/lottery/monitoring/route.ts
✅ app/api/admin/lottery/data-fix/route.ts
✅ LOTTERY_TRIGGER_OPTIMIZATION_COMPLETE.md
✅ deploy_lottery_optimization.sh
```

### 2. 执行一键部署
```bash
# SSH到服务器
ssh root@YOUR_SERVER_IP

# 进入项目目录
cd /var/www/luckymart-tj

# 设置执行权限
chmod +x deploy_lottery_optimization.sh

# 执行部署
./deploy_lottery_optimization.sh
```

### 3. 验证部署
```bash
# 检查服务状态
./deploy_lottery_optimization.sh verify

# 查看日志
pm2 logs luckymart-web
```

## 📋 手动部署 (备选)

如果一键部署失败，请按以下步骤手动部署：

### 1. 备份现有文件
```bash
cp app/api/lottery/participate/route.ts app/api/lottery/participate/route.ts.backup
cp lib/lottery.ts lib/lottery.ts.backup
cp supabase/functions/auto-draw/index.ts supabase/functions/auto-draw/index.ts.backup
```

### 2. 安装依赖
```bash
pnpm install
npx prisma generate
```

### 3. 重启服务
```bash
pm2 restart luckymart-web
supabase functions deploy auto-draw
```

## 🧪 测试验证

### 1. 功能测试
```bash
# 测试监控API (需要管理员权限)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://YOUR_SERVER:3000/api/lottery/monitoring?action=overview"

# 测试数据一致性检查
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "full_system_check", "dryRun": true}' \
  http://YOUR_SERVER:3000/api/admin/lottery/data-fix
```

### 2. 业务测试
1. 创建一个几乎满期的夺宝期次
2. 购买最后一份份额
3. 验证是否立即开奖
4. 检查管理后台是否显示正确状态

## ⚠️ 故障排除

### 问题1: 服务启动失败
```bash
# 查看详细错误
pm2 logs luckymart-web --err

# 检查依赖
pnpm install --force

# 重新生成Prisma客户端
npx prisma generate
```

### 问题2: API返回401未授权
- 确保使用正确的管理员JWT Token
- 检查Token是否过期
- 验证管理员账号是否存在

### 问题3: Edge Function部署失败
```bash
# 检查Supabase CLI版本
supabase --version

# 重新部署
supabase functions deploy auto-draw --debug
```

## 🔄 紧急回滚

如果部署后出现严重问题，可以快速回滚：

```bash
# 执行回滚
./deploy_lottery_optimization.sh rollback

# 或者手动恢复备份
cp app/api/lottery/participate/route.ts.backup app/api/lottery/participate/route.ts
cp lib/lottery.ts.backup lib/lottery.ts
cp supabase/functions/auto-draw/index.ts.backup supabase/functions/auto-draw/index.ts

# 重启服务
pm2 restart luckymart-web
```

## 📊 监控和维护

### 日常监控
```bash
# 查看系统状态
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:3000/api/lottery/monitoring?action=overview"

# 检查数据一致性
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "full_system_check", "dryRun": true}' \
  http://localhost:3000/api/admin/lottery/data-fix"
```

### 管理后台
- **监控面板**: `http://YOUR_SERVER:3000/admin/lottery/monitoring`
- **开奖管理**: `http://YOUR_SERVER:3000/admin/lottery`
- **系统设置**: `http://YOUR_SERVER:3000/admin/settings`

## 📞 技术支持

如果在部署过程中遇到问题，请检查：

1. **服务器环境**: Node.js 18+, pnpm, PM2
2. **数据库连接**: Supabase连接正常
3. **权限设置**: 管理员账号和JWT配置
4. **网络配置**: 服务器防火墙和端口开放

## ✅ 部署成功的标志

部署成功后，您应该能看到：

1. ✅ PM2服务状态为 "online"
2. ✅ 监控API返回数据正常
3. ✅ 参与夺宝时售罄即开奖
4. ✅ 管理后台显示实时状态
5. ✅ 无严重错误日志

---

**祝您部署顺利！** 🎉

如有问题，请参考完整技术文档：`LOTTERY_TRIGGER_OPTIMIZATION_COMPLETE.md`
