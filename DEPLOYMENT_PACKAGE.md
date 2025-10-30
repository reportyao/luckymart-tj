# LuckyMart TJ 移动端优化 - 完整部署包

## 部署方式选择

### 方式A：压缩包部署（最简单，推荐）⭐

1. **下载压缩包**
   - 位置: `/workspace/luckymart-tj/mobile_optimization_files.tar.gz`
   - 大小: 25KB

2. **上传到服务器**
   ```bash
   scp mobile_optimization_files.tar.gz root@47.243.83.253:/tmp/
   ```

3. **SSH登录并部署**
   ```bash
   ssh root@47.243.83.253
   cd /var/www/luckymart-tj
   pm2 stop luckymart-web
   tar -xzf /tmp/mobile_optimization_files.tar.gz
   pnpm install
   npx prisma generate
   rm -rf .next
   pm2 restart luckymart-web
   pm2 logs luckymart-web --lines 50
   ```

### 方式B：逐个文件复制（备选）

如果无法上传压缩包，可以逐个创建文件。所有文件内容见下方。

---

## 更新的文件清单

### 新增文件（3个）

#### 1. components/ProductImageCarousel.tsx
路径: `/var/www/luckymart-tj/components/ProductImageCarousel.tsx`
内容: 见附件 `files/ProductImageCarousel.tsx`

#### 2. components/MarketingBadgeDisplay.tsx
路径: `/var/www/luckymart-tj/components/MarketingBadgeDisplay.tsx`
内容: 见附件 `files/MarketingBadgeDisplay.tsx`

#### 3. components/MobileNavigation.tsx
路径: `/var/www/luckymart-tj/components/MobileNavigation.tsx`
内容: 见附件 `files/MobileNavigation.tsx`

### 修改文件（6个）

#### 4. app/page.tsx
路径: `/var/www/luckymart-tj/app/page.tsx`
操作: 完整替换
内容: 见附件 `files/page.tsx`

#### 5. app/product/[id]/page.tsx
路径: `/var/www/luckymart-tj/app/product/[id]/page.tsx`
操作: 完整替换
内容: 见附件 `files/product-detail-page.tsx`

#### 6. app/admin/products/create/page.tsx
路径: `/var/www/luckymart-tj/app/admin/products/create/page.tsx`
操作: 完整替换
内容: 见附件 `files/admin-products-create-page.tsx`

#### 7. prisma/schema.prisma
路径: `/var/www/luckymart-tj/prisma/schema.prisma`
修改: products模型添加marketingBadge字段
内容: 见附件 `files/schema.prisma`

#### 8. types/index.ts
路径: `/var/www/luckymart-tj/types/index.ts`
修改: 添加MarketingBadge类型，更新Product类型
内容: 见附件 `files/types-index.ts`

#### 9. contexts/LanguageContext.tsx
路径: `/var/www/luckymart-tj/contexts/LanguageContext.tsx`
修改: 添加nav.menu和nav.language翻译
内容: 见附件 `files/LanguageContext.tsx`

---

## 数据库Migration

### SQL脚本

需要在Supabase Dashboard执行：

```sql
-- 添加营销角标字段到products表
ALTER TABLE products ADD COLUMN IF NOT EXISTS marketing_badge JSONB DEFAULT NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN products.marketing_badge IS '营销角标信息: {textZh, textEn, textRu, color, bgColor, position, animation, enabled}';

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_products_marketing_badge 
ON products USING GIN (marketing_badge) 
WHERE marketing_badge IS NOT NULL;
```

### 执行步骤

1. 登录Supabase Dashboard
2. 进入SQL Editor
3. 粘贴上述SQL并执行
4. 验证字段已添加：
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'products' 
   AND column_name = 'marketing_badge';
   ```

---

## 部署后验证

### 1. 服务状态检查
```bash
pm2 status luckymart-web
pm2 logs luckymart-web --lines 50
```

### 2. 网站访问测试
访问: http://47.243.83.253:3000

### 3. 功能验证清单

#### 首页（移动端）
- [ ] 2列网格布局显示
- [ ] 图片加载正常
- [ ] Hover缩放效果
- [ ] 汉堡菜单可点击
- [ ] 侧边栏正常打开/关闭

#### 首页（桌面端）
- [ ] 4列网格布局
- [ ] 原导航栏保留
- [ ] 图片加载正常

#### 商品详情页
- [ ] 图片轮播显示
- [ ] 触摸滑动工作
- [ ] 左右箭头可用
- [ ] 缩略图导航
- [ ] 点击放大功能

#### 后台管理
- [ ] 访问 /admin/products/create
- [ ] 营销角标配置区显示
- [ ] 启用开关工作
- [ ] 颜色选择器可用
- [ ] 预览效果正确

---

## 常见问题排查

### 问题1: 服务启动失败
```bash
# 查看详细日志
pm2 logs luckymart-web --lines 100

# 检查依赖
cd /var/www/luckymart-tj
pnpm install

# 重新生成Prisma客户端
npx prisma generate

# 清理缓存重启
rm -rf .next
pm2 restart luckymart-web
```

### 问题2: 图片不显示
- 检查Supabase Storage配置
- 验证图片URL格式
- 确认RLS策略允许公开访问

### 问题3: 样式异常
- 清理浏览器缓存
- 强制刷新（Ctrl+F5）
- 检查Tailwind CSS配置

---

## 回滚方案

如遇严重问题：

```bash
# 停止服务
pm2 stop luckymart-web

# 恢复备份（使用最近的备份目录）
BACKUP_DIR="/tmp/luckymart-backup-YYYYMMDD_HHMMSS"
rm -rf /var/www/luckymart-tj
cp -r $BACKUP_DIR /var/www/luckymart-tj

# 重启服务
cd /var/www/luckymart-tj
pm2 restart luckymart-web
```

---

## 联系信息

- 服务器IP: 47.243.83.253
- 项目路径: /var/www/luckymart-tj
- PM2进程: luckymart-web
- 访问地址: http://47.243.83.253:3000

---

**部署日期**: 2025-10-30
**版本**: Mobile Optimization v1.0
