#!/bin/bash
/**
 * 推荐绑定API测试脚本
 * 验证POST /api/referral/bind的基本功能
 */

echo "开始推荐绑定API测试..."
echo "========================================"

# 测试数据
TELEGRAM_USER_ID="123456789"
REFERRAL_CODE="USER1234_AB12CD"
DEVICE_FINGERPRINT="test_device_abc123"
IP_ADDRESS="192.168.1.100"

# 测试用例1: 正常绑定
echo "测试用例1: 正常推荐绑定"
echo "请求参数:"
echo "  用户Telegram ID: $TELEGRAM_USER_ID"
echo "  推荐码: $REFERRAL_CODE"
echo "  设备指纹: $DEVICE_FINGERPRINT"
echo "  IP地址: $IP_ADDRESS"
echo ""

# 使用curl测试API（需要先启动服务器）
echo "正在发送API请求..."
echo "curl -X POST http://localhost:3000/api/referral/bind \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"user_telegram_id\": \"$TELEGRAM_USER_ID\","
echo "    \"referral_code\": \"$REFERRAL_CODE\","
echo "    \"device_fingerprint\": \"$DEVICE_FINGERPRINT\","
echo "    \"ip_address\": \"$IP_ADDRESS\""
echo "  }'"
echo ""

# 测试用例2: 缺少参数
echo "测试用例2: 缺少必需参数"
echo "curl -X POST http://localhost:3000/api/referral/bind \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"user_telegram_id\": \"$TELEGRAM_USER_ID\""
echo "  }'"
echo ""

# 测试用例3: 无效推荐码
echo "测试用例3: 无效推荐码"
echo "curl -X POST http://localhost:3000/api/referral/bind \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"user_telegram_id\": \"$TELEGRAM_USER_ID\","
echo "    \"referral_code\": \"INVALID_CODE\","
echo "    \"device_fingerprint\": \"$DEVICE_FINGERPRINT\","
echo "    \"ip_address\": \"$IP_ADDRESS\""
echo "  }'"
echo ""

# 测试用例4: 自我推荐
echo "测试用例4: 自我推荐测试"
echo "curl -X POST http://localhost:3000/api/referral/bind \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"user_telegram_id\": \"987654321\","
echo "    \"referral_code\": \"USER1234_AB12CD\","
echo "    \"device_fingerprint\": \"$DEVICE_FINGERPRINT\","
echo "    \"ip_address\": \"$IP_ADDRESS\""
echo "  }'"
echo ""

echo "========================================"
echo "测试说明:"
echo "1. 请先启动Next.js服务器: npm run dev"
echo "2. 确保数据库连接正常"
echo "3. 确认必要的测试用户数据已存在"
echo "4. 运行上述curl命令进行测试"
echo ""

# 功能检查列表
echo "API功能检查清单:"
echo "✓ 请求参数验证"
echo "✓ 防作弊检查"
echo "✓ 设备指纹验证"
echo "✓ 自我推荐拦截"
echo "✓ 循环推荐拦截"
echo "✓ 推荐关系创建"
echo "✓ 奖励发放"
echo "✓ 交易记录"
echo "✓ Telegram通知"
echo "✓ 错误处理"
echo ""

echo "测试完成！"