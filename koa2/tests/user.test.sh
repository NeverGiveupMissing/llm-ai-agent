#!/bin/bash
# ============================================
# 用户管理模块测试脚本
# ============================================

# 引入公共配置（通过 source 命令）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "👤 开始测试用户管理模块"
echo "========================================="
echo ""

# 测试变量
NEW_USER_ID=""
NEW_USERNAME=""

# 1. 获取当前用户信息
echo "📝 测试 1: 获取当前用户信息 (GET /users/me)"
curl -s -X GET ${BASE_URL}/users/me \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 2. 获取用户列表（分页）
echo "📝 测试 2: 获取用户列表 - 分页 (GET /users?page=1&limit=10)"
curl -s -X GET "${BASE_URL}/users?page=1&limit=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 3. 获取用户列表（搜索）
echo "📝 测试 3: 获取用户列表 - 搜索 (GET /users?keyword=admin)"
curl -s -X GET "${BASE_URL}/users?keyword=admin" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 4. 获取用户列表（状态过滤）
echo "📝 测试 4: 获取用户列表 - 状态过滤 (GET /users?status=active)"
curl -s -X GET "${BASE_URL}/users?status=active" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 5. 创建新用户
echo "📝 测试 5: 创建新用户 (POST /users/register)"
REGISTER_RESPONSE=$(curl -s -X POST ${BASE_URL}/users/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "username": "testuser_'$(date +%s)'",
    "password": "test123",
    "email": "test@example.com"
  }')

echo "注册响应: ${REGISTER_RESPONSE}"
NEW_USER_ID=$(echo ${REGISTER_RESPONSE} | jq -r '.data.id')
NEW_USERNAME=$(echo ${REGISTER_RESPONSE} | jq -r '.data.username')
echo "✅ 新用户 ID: ${NEW_USER_ID}"
echo "✅ 新用户名称: ${NEW_USERNAME}"
echo ""

# 6. 获取用户详情
echo "📝 测试 6: 获取用户详情 (GET /users/:userId)"
curl -s -X GET ${BASE_URL}/users/${NEW_USER_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 7. 更新用户信息
echo "📝 测试 7: 更新用户信息 (PUT /users/:userId)"
curl -s -X PUT ${BASE_URL}/users/${NEW_USER_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "email": "updated@example.com"
  }' | jq .
echo ""

# 8. 禁用用户
echo "📝 测试 8: 禁用用户 (PUT /users/:userId)"
curl -s -X PUT ${BASE_URL}/users/${NEW_USER_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "inactive"
  }' | jq .
echo ""

# 9. 启用用户
echo "📝 测试 9: 启用用户 (PUT /users/:userId)"
curl -s -X PUT ${BASE_URL}/users/${NEW_USER_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "active"
  }' | jq .
echo ""

# 10. 获取所有角色
echo "📝 测试 10: 获取所有角色 (GET /roles)"
ROLES_RESPONSE=$(curl -s -X GET ${BASE_URL}/roles \
  -H "Authorization: Bearer ${TOKEN}")

echo "角色列表:"
echo ${ROLES_RESPONSE} | jq '.data[] | {id: .id, name: .name}'
echo ""

# 提取角色 ID
ADMIN_ROLE_ID=$(echo ${ROLES_RESPONSE} | jq -r '.data[] | select(.name=="admin") | .id')
USER_ROLE_ID=$(echo ${ROLES_RESPONSE} | jq -r '.data[] | select(.name=="user") | .id')
echo "✅ Admin Role ID: ${ADMIN_ROLE_ID}"
echo "✅ User Role ID: ${USER_ROLE_ID}"
echo ""

# 11. 分配单个角色
echo "📝 测试 11: 分配单个角色 (POST /users/:userId/roles)"
curl -s -X POST ${BASE_URL}/users/${NEW_USER_ID}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"roleId\":\"${ADMIN_ROLE_ID}\"}" | jq .
echo ""

# 12. 批量分配角色
echo "📝 测试 12: 批量分配角色 (PUT /users/:userId/roles)"
curl -s -X PUT ${BASE_URL}/users/${NEW_USER_ID}/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"roleIds\":[\"${ADMIN_ROLE_ID}\",\"${USER_ROLE_ID}\"]}" | jq .
echo ""

# 13. 查看用户角色
echo "📝 测试 13: 查看用户角色 (GET /users/:userId)"
curl -s -X GET ${BASE_URL}/users/${NEW_USER_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq '.data.roles'
echo ""

# 14. 移除用户角色
echo "📝 测试 14: 移除用户角色 (DELETE /users/:userId/roles/:roleId)"
curl -s -X DELETE ${BASE_URL}/users/${NEW_USER_ID}/roles/${USER_ROLE_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 15. 重置用户密码
echo "📝 测试 15: 重置用户密码 (POST /users/:userId/reset-password)"
curl -s -X POST ${BASE_URL}/users/${NEW_USER_ID}/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"newPassword":"newpass123"}' | jq .
echo ""

# 16. 用新密码登录验证
echo "📝 测试 16: 用新密码登录验证 (POST /users/login)"
curl -s -X POST ${BASE_URL}/users/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${NEW_USERNAME}\",\"password\":\"newpass123\"}" | jq .
echo ""

# 17. 删除用户
echo "📝 测试 17: 删除用户 (DELETE /users/:userId)"
curl -s -X DELETE ${BASE_URL}/users/${NEW_USER_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

echo "========================================="
echo "✅ 用户管理模块测试完成！"
echo "========================================="
