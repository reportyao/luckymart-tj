#!/bin/bash

# 行为监控系统验证脚本
# 快速验证系统是否完整

echo "================================"
echo " 行为监控系统验证"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 计数器
TOTAL=0
PASS=0

check_file() {
    local file="$1"
    local desc="$2"
    ((TOTAL++))
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $desc"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗${NC} $desc (缺失: $file)"
        return 1
    fi
}

check_content() {
    local file="$1"
    local pattern="$2"
    local desc="$3"
    if [ -f "$file" ]; then
        if grep -q "$pattern" "$file"; then
            echo -e "  ${GREEN}✓${NC} $desc"
        else
            echo -e "  ${YELLOW}!${NC} $desc (内容可能不完整)"
        fi
    fi
}

echo "1. 核心检测功能文件"
echo "----------------------------------------"
check_file "lib/anti-fraud/behavior-monitor.ts" "核心检测逻辑"
check_content "lib/anti-fraud/behavior-monitor.ts" "detectAbnormalInviteSpeed" "邀请速度检测"
check_content "lib/anti-fraud/behavior-monitor.ts" "detectSuspiciousDevices" "可疑设备检测"
check_content "lib/anti-fraud/behavior-monitor.ts" "detectBatchRegistration" "批量注册检测"
check_content "lib/anti-fraud/behavior-monitor.ts" "detectMutualReferralWashTrading" "对冲刷量检测"
check_content "lib/anti-fraud/behavior-monitor.ts" "filterZombieAccounts" "僵尸号过滤"
echo ""

echo "2. Edge Functions"
echo "----------------------------------------"
check_file "supabase/functions/behavior-monitor-cron/index.ts" "定时任务处理器"
check_file "supabase/functions/behavior-monitor-api/index.ts" "API接口"
check_content "supabase/functions/behavior-monitor-cron/index.ts" "detectAbnormalInviteSpeed" "调用检测函数"
check_content "supabase/functions/behavior-monitor-api/index.ts" "run_all_detections" "运行检测功能"
echo ""

echo "3. 数据库迁移"
echo "----------------------------------------"
check_file "/workspace/supabase/migrations/1846500000_create_behavior_monitoring_tables.sql" "数据库表结构"
check_file "/workspace/supabase/migrations/1846500001_create_behavior_detection_functions.sql" "检测函数"
check_content "/workspace/supabase/migrations/1846500000_create_behavior_monitoring_tables.sql" "fraud_detection_logs" "检测日志表"
check_content "/workspace/supabase/migrations/1846500000_create_behavior_monitoring_tables.sql" "device_blacklist" "黑名单表"
check_content "/workspace/supabase/migrations/1846500000_create_behavior_monitoring_tables.sql" "device_fingerprints" "设备指纹表"
check_content "/workspace/supabase/migrations/1846500001_create_behavior_detection_functions.sql" "detect_abnormal_invite_speed" "邀请检测函数"
echo ""

echo "4. 定时任务配置"
echo "----------------------------------------"
check_file "/workspace/supabase/cron_jobs/behavior_monitor_6h.json" "6小时检测任务"
check_content "/workspace/supabase/cron_jobs/behavior_monitor_6h.json" "cron_expression" "Cron表达式"
check_file "/workspace/supabase/cron_jobs/blacklist_cleanup_daily.json" "黑名单清理任务"
check_file "/workspace/supabase/cron_jobs/realtime_monitor_2h.json" "实时监控任务"
echo ""

echo "5. 测试文件"
echo "----------------------------------------"
check_file "__tests__/behavior-monitor.test.ts" "单元测试"
check_file "test/comprehensive_behavior_monitor_test.sh" "综合测试脚本"
check_file "test/behavior-monitor-test.sh" "集成测试脚本"
check_file "test/init_behavior_monitor_test_data.sql" "测试数据初始化"
echo ""

echo "6. 文档文件"
echo "----------------------------------------"
check_file "DEPLOYMENT_GUIDE_BEHAVIOR_MONITOR.md" "部署指南"
check_file "BEHAVIOR_MONITOR_COMPLETION_REPORT.md" "完成报告"
check_file "lib/anti-fraud/BEHAVIOR_MONITOR_README.md" "技术文档"
echo ""

echo "7. 功能验证"
echo "----------------------------------------"
if [ -f "lib/anti-fraud/behavior-monitor.ts" ]; then
    # 检查关键函数
    if grep -q "class BehaviorMonitor" "lib/anti-fraud/behavior-monitor.ts"; then
        echo -e "${GREEN}✓${NC} BehaviorMonitor类已定义"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} BehaviorMonitor类未找到"
    fi
    ((TOTAL++))
    
    if grep -q "MONITORING_CONFIG" "lib/anti-fraud/behavior-monitor.ts"; then
        echo -e "${GREEN}✓${NC} 配置文件已定义"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} 配置文件未找到"
    fi
    ((TOTAL++))
fi

echo ""
echo "================================"
echo " 验证结果统计"
echo "================================"
echo "总检查项: $TOTAL"
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: $((TOTAL - PASS))"
echo "通过率: $(( PASS * 100 / TOTAL ))%"
echo ""

if [ $PASS -eq $TOTAL ]; then
    echo -e "${GREEN}🎉 系统验证通过！所有必要文件都已创建。${NC}"
    echo ""
    echo "下一步操作："
    echo "1. 应用数据库迁移：supabase db push"
    echo "2. 部署Edge Functions：supabase functions deploy"
    echo "3. 配置定时任务"
    echo "4. 运行测试验证功能"
    exit 0
else
    echo -e "${RED}⚠️ 系统验证失败！有 $((TOTAL - PASS)) 个检查项未通过。${NC}"
    exit 1
fi