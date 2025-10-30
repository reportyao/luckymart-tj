# 🚀 LuckyMart TJ 移动端优化 - 服务器部署命令

## 快速部署 (复制执行)

```bash
# 1. 备份当前版本
BACKUP_DIR="/var/backups/luckymart-tj-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
if [ -d "/var/www/luckymart-tj" ]; then
    cp -r /var/www/luckymart-tj/* $BACKUP_DIR/ 2>/dev/null || true
    echo "✅ 备份完成: $BACKUP_DIR"
fi

# 2. 进入项目目录并拉取代码
cd /var/www/luckymart-tj
git pull origin main

# 3. 安装依赖
npm install

# 4. 数据库迁移
npx prisma generate
npx prisma db push

# 5. 构建项目
npm run build

# 6. 重启服务
pm2 restart luckymart-tj || pm2 start npm --name "luckymart-tj" -- start

# 7. 检查状态
pm2 status
echo "🎉 部署完成！"
echo "📱 移动端优化功能:"
echo "   ✅ 汉堡菜单导航"
echo "   ✅ 多商品网格布局"
echo "   ✅ 商品图片轮播"
echo "   ✅ 营销角标系统"
echo ""
echo "🔗 访问地址: http://47.243.83.253:3000"
```