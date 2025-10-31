#!/bin/bash
# 测试Instagram海报生成API

# 设置API端点
API_URL="http://localhost:3000/api/referral/generate-instagram-poster"
USER_ID="test-user-123"

# 测试数据
cat <<EOF > test_request.json
{
  "prize_name": "iPhone 15 Pro Max 256GB",
  "prize_image_url": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800",
  "language": "ru"
}
EOF

echo "🚀 测试Instagram海报生成API"
echo "================================"
echo ""

# 检查服务器是否运行
if ! curl -s http://localhost:3000 > /dev/null; then
  echo "❌ Next.js服务器未运行，请先启动:"
  echo "   npm run dev"
  exit 1
fi

# 测试海报生成
echo "📤 发送请求..."
echo "   URL: $API_URL"
echo "   用户ID: $USER_ID"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -d @test_request.json \
  "$API_URL")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "📥 响应状态: $HTTP_CODE"
echo "📄 响应内容:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# 检查响应
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API测试成功!"
  
  # 提取海报信息
  POSTER_URL=$(echo "$BODY" | jq -r '.poster_url // empty')
  QR_CODE_URL=$(echo "$BODY" | jq -r '.qr_code_url // empty')
  REFERRAL_CODE=$(echo "$BODY" | jq -r '.referral_code // empty')
  
  if [ -n "$POSTER_URL" ]; then
    echo "📊 海报信息:"
    echo "   - 海报URL: $POSTER_URL"
    echo "   - QR码URL: $QR_CODE_URL"
    echo "   - 邀请码: $REFERRAL_CODE"
    echo ""
    
    # 测试海报统计API
    echo "📈 测试海报统计API..."
    POSTER_ID=$(echo "$BODY" | jq -r '.poster_url | split("/") | last')
    
    STATS_RESPONSE=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -d "{\"poster_id\":\"$POSTER_ID\",\"viewer_telegram_id\":\"$USER_ID\"}" \
      "http://localhost:3000/api/referral/poster-stats")
    
    echo "📊 统计响应: $STATS_RESPONSE"
  fi
  
else
  echo "❌ API测试失败!"
  echo "💡 请检查:"
  echo "   1. Next.js服务器是否正常运行"
  echo "   2. 环境变量是否正确设置"
  echo "   3. 数据库连接是否正常"
  echo "   4. Supabase存储桶是否存在"
fi

# 清理测试文件
rm -f test_request.json

echo ""
echo "✨ 测试完成!"