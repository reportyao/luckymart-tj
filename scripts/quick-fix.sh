#!/bin/bash

# 快速修复代码质量问题的脚本
set -e

echo "🔧 开始快速修复代码质量问题..."

# 修复中文函数名问题
find . -name "*.ts" -exec sed -i 's/async function发放Rewards/async function distributeRewards/g' {} \;
find . -name "*.ts" -exec sed -i 's/async function发放RebateRewards/async function distributeRebateRewards/g' {} \;
find . -name "*.ts" -exec sed -i 's/async function发放Reward/async function distributeReward/g' {} \;

# 修复类型注解问题
find . -name "*.ts" -exec sed -i 's/: any/: unknown/g' {} \;

echo "✅ 快速修复完成！"

echo "🚀 开始运行代码质量检查..."

# 运行完整质量检查
npm run quality:full

echo "📊 生成代码质量报告..."
./scripts/generate-quality-report.sh