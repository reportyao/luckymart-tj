
set -e
cd /var/www/luckymart-tj
echo "========== 停止服务 =========="
pm2 stop luckymart-web 2>/dev/null || true

echo "========== 备份代码 =========="
BACKUP_DIR="/tmp/luckymart-backup-$(date +%Y%m%d_%H%M%S)"
cp -r /var/www/luckymart-tj "$BACKUP_DIR"
echo "备份完成: $BACKUP_DIR"

echo "========== 更新文件 =========="
# 这里列出需要更新的文件
cat > /tmp/update_files.txt << 'EOFLIST'
components/ProductImageCarousel.tsx
components/MarketingBadgeDisplay.tsx
components/MobileNavigation.tsx
app/page.tsx
app/product/[id]/page.tsx
app/admin/products/create/page.tsx
prisma/schema.prisma
types/index.ts
contexts/LanguageContext.tsx
EOFLIST

echo "========== 安装依赖 =========="
pnpm install

echo "========== 生成Prisma客户端 =========="
npx prisma generate

echo "========== 清理缓存 =========="
rm -rf .next

echo "========== 重启服务 =========="
pm2 restart luckymart-web || pm2 start npm --name "luckymart-web" -- run dev

sleep 3
echo "========== 检查状态 =========="
pm2 status luckymart-web
pm2 logs luckymart-web --lines 20 --nostream
