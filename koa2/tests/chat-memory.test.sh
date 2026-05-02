#!/bin/bash
# ============================================
# 聊天记忆模块测试脚本
# ============================================

# 引入公共配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "💭 开始测试聊天记忆模块"
echo "========================================="
echo ""

# 测试变量
TEST_USER_ID="${ADMIN_USER_ID}"
TEST_SESSION_ID=""

# 1. 创建测试会话
echo "📝 测试 1: 创建测试会话 (POST /sessions)"
SESSION_RESPONSE=$(curl -s -X POST ${BASE_URL}/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"userId\":\"${TEST_USER_ID}\",\"title\":\"聊天记忆测试会话\"}")

TEST_SESSION_ID=$(echo ${SESSION_RESPONSE} | jq -r '.data.id')
echo "✅ 测试会话 ID: ${TEST_SESSION_ID}"
echo ""

# 2. 获取聊天记忆（空）
echo "📝 测试 2: 获取聊天记忆-初始状态 (GET /chat-memory?sessionId=:sessionId)"
curl -s -X GET "${BASE_URL}/chat-memory?sessionId=${TEST_SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 3. 保存聊天记忆
echo "📝 测试 3: 保存聊天记忆 (POST /chat-memory)"
curl -s -X POST ${BASE_URL}/chat-memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"sessionId\": \"${TEST_SESSION_ID}\",
    \"userId\": \"${TEST_USER_ID}\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"你好\"},
      {\"role\": \"assistant\", \"content\": \"你好！有什么可以帮助你的？\"}
    ]
  }" | jq .
echo ""

# 4. 再次获取聊天记忆验证保存
echo "📝 测试 4: 验证保存后的聊天记忆 (GET /chat-memory?sessionId=:sessionId)"
curl -s -X GET "${BASE_URL}/chat-memory?sessionId=${TEST_SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 5. 更新聊天记忆
echo "📝 测试 5: 更新聊天记忆 (PUT /chat-memory)"
curl -s -X PUT ${BASE_URL}/chat-memory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"sessionId\": \"${TEST_SESSION_ID}\",
    \"userId\": \"${TEST_USER_ID}\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"你好\"},
      {\"role\": \"assistant\", \"content\": \"你好！有什么可以帮助你的？\"},
      {\"role\": \"user\", \"content\": \"谢谢\"},
      {\"role\": \"assistant\", \"content\": \"不客气！\"}
    ]
  }" | jq .
echo ""

# 6. 验证更新
echo "📝 测试 6: 验证更新后的聊天记忆 (GET /chat-memory?sessionId=:sessionId)"
MEMORY_RESPONSE=$(curl -s -X GET "${BASE_URL}/chat-memory?sessionId=${TEST_SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "消息数量: $(echo ${MEMORY_RESPONSE} | jq '.data.messages | length')"
echo ""

# 7. 删除聊天记忆
echo "📝 测试 7: 删除聊天记忆 (DELETE /chat-memory?sessionId=:sessionId)"
curl -s -X DELETE "${BASE_URL}/chat-memory?sessionId=${TEST_SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 8. 验证删除
echo "📝 测试 8: 验证删除后的聊天记忆 (GET /chat-memory?sessionId=:sessionId)"
curl -s -X GET "${BASE_URL}/chat-memory?sessionId=${TEST_SESSION_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 9. 清理测试会话
echo "📝 测试 9: 清理测试会话 (DELETE /sessions/:sessionId)"
curl -s -X DELETE ${BASE_URL}/sessions/${TEST_SESSION_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

echo "========================================="
echo "✅ 聊天记忆模块测试完成！"
echo "========================================="
