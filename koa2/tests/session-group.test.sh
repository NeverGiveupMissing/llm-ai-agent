#!/bin/bash
# ============================================
# 会话分组管理模块测试脚本
# ============================================

# 引入公共配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "📁 开始测试会话分组管理模块"
echo "========================================="
echo ""

# 测试变量
NEW_GROUP_ID=""
GROUP2_ID=""
NEW_SESSION_ID=""
TEST_USER_ID="${ADMIN_USER_ID}"

# 1. 获取所有分组
echo "📝 测试 1: 获取所有分组 (GET /session-groups?userId=:userId)"
curl -s -X GET "${BASE_URL}/session-groups?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 2. 创建新分组
echo "📝 测试 2: 创建新分组 (POST /session-groups)"
CREATE_RESPONSE=$(curl -s -X POST ${BASE_URL}/session-groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"userId\":\"${TEST_USER_ID}\",\"name\":\"测试分组_$(date +%s)\",\"icon\":\"FolderOutline\"}")

echo "创建响应: ${CREATE_RESPONSE}"
NEW_GROUP_ID=$(echo ${CREATE_RESPONSE} | jq -r '.data.id')
echo "✅ 新分组 ID: ${NEW_GROUP_ID}"
echo ""

# 3. 更新分组名称
echo "📝 测试 3: 更新分组名称 (PUT /session-groups/:id)"
curl -s -X PUT ${BASE_URL}/session-groups/${NEW_GROUP_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"name":"更新后的分组名称","icon":"DocumentOutline"}' | jq .
echo ""

# 4. 置顶分组
echo "📝 测试 4: 置顶分组 (POST /session-groups/:id/pin)"
curl -s -X POST ${BASE_URL}/session-groups/${NEW_GROUP_ID}/pin \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 5. 取消置顶分组
echo "📝 测试 5: 取消置顶分组 (POST /session-groups/:id/pin)"
curl -s -X POST ${BASE_URL}/session-groups/${NEW_GROUP_ID}/pin \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 6. 创建测试会话
echo "📝 测试 6: 创建测试会话用于移动测试 (POST /sessions)"
SESSION_RESPONSE=$(curl -s -X POST ${BASE_URL}/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"userId\":\"${TEST_USER_ID}\",\"title\":\"待移动会话\"}")

NEW_SESSION_ID=$(echo ${SESSION_RESPONSE} | jq -r '.data.id')
echo "✅ 测试会话 ID: ${NEW_SESSION_ID}"
echo ""

# 7. 移动会话到分组（使用新路由）
echo "📝 测试 7: 移动会话到分组-新路由 (POST /session-groups/:sessionId/move-to-group)"
curl -s -X POST ${BASE_URL}/session-groups/${NEW_SESSION_ID}/move-to-group \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"groupId\":\"${NEW_GROUP_ID}\"}" | jq .
echo ""

# 8. 验证会话已移动到分组
echo "📝 测试 8: 验证会话分组 (GET /sessions?userId=:userId)"
curl -s -X GET "${BASE_URL}/sessions?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq ".data[] | select(.id==\"${NEW_SESSION_ID}\") | {id: .id, title: .title, group_id: .group_id}"
echo ""

# 9. 移动会话到分组（使用旧路由，保持兼容）
echo "📝 测试 9: 移动会话到分组-旧路由 (POST /session-groups/sessions/:sessionId/move)"
# 先创建另一个分组
GROUP2_RESPONSE=$(curl -s -X POST ${BASE_URL}/session-groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"userId\":\"${TEST_USER_ID}\",\"name\":\"第二个分组\",\"icon\":\"CodeSlashOutline\"}")

GROUP2_ID=$(echo ${GROUP2_RESPONSE} | jq -r '.data.id')
echo "✅ 第二个分组 ID: ${GROUP2_ID}"

curl -s -X POST ${BASE_URL}/session-groups/sessions/${NEW_SESSION_ID}/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"groupId\":\"${GROUP2_ID}\"}" | jq .
echo ""

# 10. 删除分组
echo "📝 测试 10: 删除第一个分组 (DELETE /session-groups/:id)"
curl -s -X DELETE ${BASE_URL}/session-groups/${NEW_GROUP_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 11. 删除第二个分组
echo "📝 测试 11: 删除第二个分组 (DELETE /session-groups/:id)"
curl -s -X DELETE ${BASE_URL}/session-groups/${GROUP2_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 12. 删除测试会话
echo "📝 测试 12: 删除测试会话 (DELETE /sessions/:sessionId)"
curl -s -X DELETE ${BASE_URL}/sessions/${NEW_SESSION_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 13. 验证清理
echo "📝 测试 13: 验证清理后的分组列表 (GET /session-groups)"
curl -s -X GET "${BASE_URL}/session-groups?userId=${TEST_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" | jq ".data | length"
echo ""

echo "========================================="
echo "✅ 会话分组管理模块测试完成！"
echo "========================================="
