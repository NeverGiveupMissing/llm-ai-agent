#!/bin/bash
# ============================================
# 会话管理模块测试脚本
# ============================================

# 引入公共配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "💬 开始测试会话管理模块"
echo "========================================="
echo ""

# 测试变量
NEW_SESSION_ID=""
TEST_USER_ID="${ADMIN_USER_ID}"

# 1. 获取会话列表
echo "📝 测试 1: 获取会话列表 (GET /sessions?userId=:userId)"
curl -s -X GET "${BASE_URL}/sessions?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 2. 创建新会话
echo "📝 测试 2: 创建新会话 (POST /sessions)"
CREATE_RESPONSE=$(curl -s -X POST ${BASE_URL}/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"userId\": \"${TEST_USER_ID}\",
    \"title\": \"测试会话_$(date +%s)\"
  }")

echo "创建响应: ${CREATE_RESPONSE}"
NEW_SESSION_ID=$(echo ${CREATE_RESPONSE} | jq -r '.data.id')
echo "✅ 新会话 ID: ${NEW_SESSION_ID}"
echo ""

# 3. 获取会话详情（包含消息）
echo "📝 测试 3: 获取会话详情 (GET /sessions/:sessionId/detail)"
curl -s -X GET ${BASE_URL}/sessions/${NEW_SESSION_ID}/detail \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 4. 更新会话标题
echo "📝 测试 4: 更新会话标题 (PUT /sessions/:sessionId)"
curl -s -X PUT ${BASE_URL}/sessions/${NEW_SESSION_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "title": "更新后的会话标题"
  }' | jq .
echo ""

# 5. 更新会话消息数
echo "📝 测试 5: 更新会话消息数 (PUT /sessions/:sessionId)"
curl -s -X PUT ${BASE_URL}/sessions/${NEW_SESSION_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "message_count": 10
  }' | jq .
echo ""

# 6. 置顶会话
echo "📝 测试 6: 置顶会话 (POST /sessions/:sessionId/pin)"
curl -s -X POST ${BASE_URL}/sessions/${NEW_SESSION_ID}/pin \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 7. 取消置顶会话
echo "📝 测试 7: 取消置顶会话 (POST /sessions/:sessionId/pin)"
curl -s -X POST ${BASE_URL}/sessions/${NEW_SESSION_ID}/pin \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 8. 获取分享信息
echo "📝 测试 8: 获取分享信息 (GET /sessions/:sessionId/share)"
curl -s -X GET ${BASE_URL}/sessions/${NEW_SESSION_ID}/share \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 9. 再次获取会话列表验证更新
echo "📝 测试 9: 验证更新后的会话列表 (GET /sessions?userId=:userId)"
curl -s -X GET "${BASE_URL}/sessions?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.data[] | select(.id=="'"${NEW_SESSION_ID}"'")'
echo ""

# 10. 删除会话
echo "📝 测试 10: 删除会话 (DELETE /sessions/:sessionId)"
curl -s -X DELETE ${BASE_URL}/sessions/${NEW_SESSION_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 11. 验证删除
echo "📝 测试 11: 验证删除后的会话列表 (GET /sessions?userId=:userId)"
curl -s -X GET "${BASE_URL}/sessions?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq ".data | length"
echo ""

echo "========================================="
echo "✅ 会话管理模块测试完成！"
echo "========================================="
