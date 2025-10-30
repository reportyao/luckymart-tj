#!/bin/bash
# 简化部署命令

cd /var/www/luckymart-tj
pm2 stop luckymart-web
tar -xzf /tmp/mobile_optimization_files.tar.gz
pnpm install
npx prisma generate
rm -rf .next
pm2 restart luckymart-web
pm2 logs luckymart-web --lines 50
