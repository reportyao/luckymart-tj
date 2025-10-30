#!/usr/bin/env python3
"""
LuckyMart TJ 移动端优化自动化部署脚本
"""

import subprocess
import sys
import time

# 服务器信息
SERVER_IP = "47.243.83.253"
SERVER_USER = "root"
SERVER_PASSWORD = "Lingjiu123@"
PROJECT_DIR = "/var/www/luckymart-tj"

print("="*60)
print("LuckyMart TJ 移动端优化 - 自动化部署")
print("="*60)
print()

# 文件列表
files_to_deploy = {
    'components/ProductImageCarousel.tsx': '图片轮播组件',
    'components/MarketingBadgeDisplay.tsx': '营销角标组件',
    'components/MobileNavigation.tsx': '移动端导航组件',
    'app/page.tsx': '首页优化',
    'app/product/[id]/page.tsx': '商品详情页优化',
    'app/admin/products/create/page.tsx': '后台商品创建页优化',
    'prisma/schema.prisma': '数据库Schema更新',
    'types/index.ts': '类型定义更新',
    'contexts/LanguageContext.tsx': '语言翻译更新',
    'deploy_mobile_optimization.sh': '部署脚本',
}

print("📦 待部署文件清单:")
for i, (file, desc) in enumerate(files_to_deploy.items(), 1):
    print(f"  {i}. {file} - {desc}")
print()

print("🔧 部署步骤:")
print("  1. 上传压缩包到服务器")
print("  2. 解压文件到项目目录")
print("  3. 生成Prisma客户端")
print("  4. 重启服务")
print()

print("⚠️  注意事项:")
print("  - 数据库Migration需要Supabase授权（暂时跳过）")
print("  - 部署后需要手动验证功能")
print()

# 提示用户手动部署
print("="*60)
print("手动部署步骤（推荐）:")
print("="*60)
print()
print("1. 下载压缩包:")
print(f"   /workspace/luckymart-tj/mobile_optimization_files.tar.gz")
print()
print("2. 上传到服务器:")
print(f"   scp mobile_optimization_files.tar.gz {SERVER_USER}@{SERVER_IP}:/tmp/")
print()
print("3. SSH登录服务器:")
print(f"   ssh {SERVER_USER}@{SERVER_IP}")
print()
print("4. 解压和部署:")
print(f"""
   cd {PROJECT_DIR}
   pm2 stop luckymart-web
   tar -xzf /tmp/mobile_optimization_files.tar.gz
   pnpm install
   npx prisma generate
   rm -rf .next
   pm2 restart luckymart-web
   pm2 logs luckymart-web
""")
print()
print("5. 验证部署:")
print(f"   访问 http://{SERVER_IP}:3000")
print()
print("="*60)

# 创建简化版部署指令文件
deploy_commands = f"""#!/bin/bash
# 简化部署命令

cd {PROJECT_DIR}
pm2 stop luckymart-web
tar -xzf /tmp/mobile_optimization_files.tar.gz
pnpm install
npx prisma generate
rm -rf .next
pm2 restart luckymart-web
pm2 logs luckymart-web --lines 50
"""

with open('/workspace/luckymart-tj/quick_deploy_commands.sh', 'w') as f:
    f.write(deploy_commands)

print("✅ 已生成快速部署命令文件:")
print("   /workspace/luckymart-tj/quick_deploy_commands.sh")
print()
print("💡 提示: 由于workspace环境限制，建议使用上述手动方式部署")
print()
