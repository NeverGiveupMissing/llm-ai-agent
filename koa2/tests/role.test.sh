#!/bin/bash
# ============================================
# 角色管理模块测试脚本
# ============================================

# 引入公共配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "👥 开始测试角色管理模块"
echo "========================================="
echo ""

# 1. 获取角色列表
echo "📝 测试 1: 获取角色列表 (GET /roles)"
curl -s -X GET ${BASE_URL}/roles \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 2. 获取角色列表（搜索）
echo "📝 测试 2: 获取角色列表 - 搜索 (GET /roles?keyword=admin)"
curl -s -X GET "${BASE_URL}/roles?keyword=admin" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 3. 获取角色详情
echo "📝 测试 3: 获取角色详情 (GET /roles/:roleId)"
ADMIN_ROLE_ID=$(curl -s -X GET ${BASE_URL}/roles \
  -H "Authorization: Bearer ${TOKEN}" | jq -r '.data[0].id')

curl -s -X GET ${BASE_URL}/roles/${ADMIN_ROLE_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 4. 获取角色的权限
echo "📝 测试 4: 获取角色的权限 (GET /roles/:roleId/permissions)"
curl -s -X GET ${BASE_URL}/roles/${ADMIN_ROLE_ID}/permissions \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 5. 创建新角色
echo "📝 测试 5: 创建新角色 (POST /roles)"
CREATE_RESPONSE=$(curl -s -X POST ${BASE_URL}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "test_role_'$(date +%s)'",
    "displayName": "测试角色",
    "description": "这是一个测试角色"
  }')

echo "创建响应: ${CREATE_RESPONSE}"
NEW_ROLE_ID=$(echo ${CREATE_RESPONSE} | jq -r '.data.id')
echo "✅ 新角色 ID: ${NEW_ROLE_ID}"
echo ""

# 6. 更新角色
echo "📝 测试 6: 更新角色 (PUT /roles/:roleId)"
curl -s -X PUT ${BASE_URL}/roles/${NEW_ROLE_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "displayName": "更新后的测试角色",
    "description": "描述已更新"
  }' | jq .
echo ""

# 7. 为角色分配权限
echo "📝 测试 7: 为角色分配权限 (POST /roles/:roleId/permissions)"
# 先获取一个权限 ID
PERMISSION_ID=$(curl -s -X GET ${BASE_URL}/permissions \
  -H "Authorization: Bearer ${TOKEN}" | jq -r '.data[0].id')

curl -s -X POST ${BASE_URL}/roles/${NEW_ROLE_ID}/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"permissionId\":\"${PERMISSION_ID}\"}" | jq .
echo ""

# 8. 批量分配权限
echo "📝 测试 8: 批量分配权限 (PUT /roles/:roleId/permissions)"
PERMISSION_IDS=$(curl -s -X GET ${BASE_URL}/permissions \
  -H "Authorization: Bearer ${TOKEN}" | jq -c '[.data[:3][] | .id]')

curl -s -X PUT ${BASE_URL}/roles/${NEW_ROLE_ID}/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"permissionIds\":${PERMISSION_IDS}}" | jq .
echo ""

# 9. 移除角色权限
echo "📝 测试 9: 移除角色权限 (DELETE /roles/:roleId/permissions/:permissionId)"
curl -s -X DELETE ${BASE_URL}/roles/${NEW_ROLE_ID}/permissions/${PERMISSION_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 10. 获取角色的用户
echo "📝 测试 10: 获取角色的用户 (GET /roles/:roleId/users)"
curl -s -X GET "${BASE_URL}/roles/${NEW_ROLE_ID}/users?page=1&limit=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 11. 删除角色
echo "📝 测试 11: 删除角色 (DELETE /roles/:roleId)"
curl -s -X DELETE ${BASE_URL}/roles/${NEW_ROLE_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

echo "========================================="
echo "✅ 角色管理模块测试完成！"
echo "========================================="
