#!/bin/bash
# ============================================
# 记忆管理模块测试脚本
# ============================================

# 引入公共配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "🧠 开始测试记忆管理模块"
echo "========================================="
echo ""

# 测试变量
NEW_MEMORY_ID=""
TEST_USER_ID="${ADMIN_USER_ID}"

# 1. 获取记忆列表
echo "📝 测试 1: 获取记忆列表 (GET /memories?userId=:userId)"
curl -s -X GET "${BASE_URL}/memories?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 2. 创建新记忆
echo "📝 测试 2: 创建新记忆 (POST /memories)"
CREATE_RESPONSE=$(curl -s -X POST ${BASE_URL}/memories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"userId\":\"${TEST_USER_ID}\",\"content\":\"这是一条测试记忆\",\"type\":\"preference\",\"category\":\"测试分类\"}")

echo "创建响应: ${CREATE_RESPONSE}"
NEW_MEMORY_ID=$(echo ${CREATE_RESPONSE} | jq -r '.data.id')
echo "✅ 新记忆 ID: ${NEW_MEMORY_ID}"
echo ""

# 3. 获取记忆详情
echo "📝 测试 3: 获取记忆详情 (GET /memories/:memoryId)"
curl -s -X GET ${BASE_URL}/memories/${NEW_MEMORY_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 4. 更新记忆内容
echo "📝 测试 4: 更新记忆内容 (PUT /memories/:memoryId)"
curl -s -X PUT ${BASE_URL}/memories/${NEW_MEMORY_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"content":"这是更新后的记忆内容","type":"fact"}' | jq .
echo ""

# 5. 获取记忆统计
echo "📝 测试 5: 获取记忆统计 (GET /memories/stats?userId=:userId)"
STATS_RESPONSE=$(curl -s -X GET "${BASE_URL}/memories/stats?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "统计响应: ${STATS_RESPONSE}"
echo "总记忆数: $(echo ${STATS_RESPONSE} | jq '.data.total')"
echo "按类型统计: $(echo ${STATS_RESPONSE} | jq '.data.byType')"
echo "按类别统计: $(echo ${STATS_RESPONSE} | jq '.data.byCategory')"
echo ""

# 6. 检索相关记忆
echo "📝 测试 6: 检索相关记忆 (POST /memories/retrieve)"
curl -s -X POST ${BASE_URL}/memories/retrieve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"userId\":\"${TEST_USER_ID}\",\"query\":\"测试\",\"limit\":5,\"threshold\":0.5}" | jq .
echo ""

# 7. 再次获取记忆列表验证更新
echo "📝 测试 7: 验证更新后的记忆列表 (GET /memories?userId=:userId)"
curl -s -X GET "${BASE_URL}/memories?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq ".data[] | select(.id==\"${NEW_MEMORY_ID}\") | {id: .id, content: .content, type: .type}"
echo ""

# 8. 删除记忆
echo "📝 测试 8: 删除记忆 (DELETE /memories/:memoryId)"
curl -s -X DELETE ${BASE_URL}/memories/${NEW_MEMORY_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 9. 验证删除
echo "📝 测试 9: 验证删除后的记忆列表 (GET /memories?userId=:userId)"
curl -s -X GET "${BASE_URL}/memories?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq ".data | length"
echo ""

# 10. 清空所有记忆（谨慎使用）
echo "📝 测试 10: 清空所有记忆 (DELETE /memories/clear?userId=:userId)"
echo "⚠️  此操作将删除所有记忆，跳过执行"
# curl -s -X DELETE "${BASE_URL}/memories/clear?userId=${TEST_USER_ID}" \
#   -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

echo "========================================="
echo "✅ 记忆管理模块测试完成！"
echo "========================================="
