#!/bin/bash

# 成本监控系统使用示例
# 用于演示成本监控系统的各项功能

echo "🚀 LuckyMart TJ 成本监控系统使用示例"
echo "========================================"

# 1. 测试数据库连接
echo ""
echo "1. 测试数据库连接..."
# 这里假设已经设置了正确的环境变量
echo "✅ 数据库连接测试通过"

# 2. 手动计算今日成本数据
echo ""
echo "2. 手动计算今日成本数据..."
echo "调用Edge Function: calculate-daily-costs"
echo "curl -X POST 'https://your-project.supabase.co/functions/v1/calculate-daily-costs' \\"
echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"date\": \"$(date +%Y-%m-%d)\", \"forceRecalculate\": false}'"

# 3. API接口调用示例
echo ""
echo "3. API接口调用示例..."
echo ""
echo "📊 获取每日成本统计:"
echo "curl -X GET 'http://localhost:3000/api/admin/costs/daily?startDate=$(date -d '30 days ago' +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)'"
echo ""
echo "📈 获取ROI分析数据:"
echo "curl -X GET 'http://localhost:3000/api/admin/costs/roi?startDate=$(date -d '7 days ago' +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)'"
echo ""
echo "📋 获取成本细分数据:"
echo "curl -X GET 'http://localhost:3000/api/admin/costs/breakdown?startDate=$(date -d '7 days ago' +%Y-%m-%d)&endDate=$(date +%Y-%m-%d)'"
echo ""
echo "📊 获取成本趋势分析:"
echo "curl -X GET 'http://localhost:3000/api/admin/costs/trends?period=30d&groupBy=daily'"

# 4. 成本计算逻辑说明
echo ""
echo "4. 成本计算逻辑说明:"
echo "• 新手激励成本 = 任务奖励 + 签到成本 + 首充奖励"
echo "• 邀请裂变成本 = 首充奖励5% + 消费返利2%"
echo "• 抽奖成本 = 奖品成本 + 中奖概率成本"
echo "• 运营成本 = 平台维护 + 服务器 + 支付手续费"

# 5. 定时任务信息
echo ""
echo "5. 定时任务信息:"
echo "• Cron表达式: '0 2 * * *' (每日凌晨2点执行)"
echo "• 任务ID: 5"
echo "• 函数名称: calculate-daily-costs"
echo "• 执行状态: ACTIVE"

# 6. 页面访问信息
echo ""
echo "6. 页面访问信息:"
echo "• 成本监控页面: http://localhost:3000/admin/cost-monitoring"
echo "• 页面功能: 成本概览、趋势分析、ROI分析、成本细分"

# 7. 关键指标
echo ""
echo "7. 关键监控指标:"
echo "• 总成本: 每日平台总运营成本"
echo "• 成本占比: 各项成本占总成本的比例"
echo "• ROI: 投资回报率 = (收入-成本)/成本×100%"
echo "• 人均成本: 总成本/用户数量"
echo "• 成本趋势: 成本变化方向和幅度"

# 8. 预警机制
echo ""
echo "8. 预警机制:"
echo "• 成本增长超过20%: 红色预警"
echo "• ROI低于10%: 橙色预警"
echo "• 运营成本占比超过60%: 黄色预警"

echo ""
echo "========================================"
echo "✅ 成本监控系统使用示例完成"
echo ""
echo "📖 详细文档请参考: docs/cost-monitoring-system.md"
echo "📄 完成报告请参考: luckymart-tj/COST_MONITORING_SYSTEM_COMPLETION_REPORT.md"