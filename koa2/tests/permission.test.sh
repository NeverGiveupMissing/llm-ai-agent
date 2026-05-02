#!/bin/bash
# ============================================
# 权限管理模块测试脚本
# ============================================

# 引入公共配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "🔐 开始测试权限管理模块"
echo "========================================="
echo ""

# 1. 获取权限树
echo " 测试 1: 获取权限树 (GET /permissions/tree)"
curl -s -X GET ${BASE_URL}/permissions/tree \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 2. 获取权限列表
echo "📝 测试 2: 获取权限列表 (GET /permissions)"
curl -s -X GET "${BASE_URL}/permissions?page=1&limit=50" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 3. 按模块分组获取权限
echo "📝 测试 3: 按模块分组获取权限 (GET /permissions/by-module)"
curl -s -X GET ${BASE_URL}/permissions/by-module \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 4. 获取权限详情
echo " 测试 4: 获取权限详情 (GET /permissions/:permissionId)"
PERMISSION_ID=$(curl -s -X GET ${BASE_URL}/permissions \
  -H "Authorization: Bearer ${TOKEN}" | jq -r '.data[0].id')

curl -s -X GET ${BASE_URL}/permissions/${PERMISSION_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 5. 创建菜单类型权限
echo "📝 测试 5: 创建菜单权限 (POST /permissions)"
CREATE_RESPONSE=$(curl -s -X POST ${BASE_URL}/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "数据看板",
    "code": "dashboard:view",
    "type": "menu",
    "path": "/dashboard",
    "icon": "DashboardOutlined",
    "sortOrder": 1,
    "description": "数据看板菜单"
  }')

echo "创建响应: ${CREATE_RESPONSE}"
NEW_PERMISSION_ID=$(echo ${CREATE_RESPONSE} | jq -r '.data.id')
echo "✅ 新权限 ID: ${NEW_PERMISSION_ID}"
echo ""

# 6. 创建子菜单权限
echo "📝 测试 6: 创建子菜单权限 (POST /permissions)"
curl -s -X POST ${BASE_URL}/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"name\": \"数据看板详情\",
    \"code\": \"dashboard:detail\",
    \"type\": \"menu\",
    \"parentId\": \"${NEW_PERMISSION_ID}\",
    \"path\": \"/dashboard/detail\",
    \"icon\": \"FileOutlined\",
    \"sortOrder\": 1,
    \"description\": \"数据看板详情页面\"
  }" | jq .
echo ""

# 7. 创建按钮权限
echo "📝 测试 7: 创建按钮权限 (POST /permissions)"
curl -s -X POST ${BASE_URL}/permissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"name\": \"导出数据\",
    \"code\": \"dashboard:export\",
    \"type\": \"button\",
    \"parentId\": \"${NEW_PERMISSION_ID}\",
    \"sortOrder\": 2,
    \"description\": \"导出数据按钮权限\"
  }" | jq .
echo ""

# 8. 更新权限
echo "📝 测试 8: 更新权限 (PUT /permissions/:permissionId)"
curl -s -X PUT ${BASE_URL}/permissions/${NEW_PERMISSION_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "数据分析看板",
    "description": "更新后的描述"
  }' | jq .
echo ""

# 9. 获取当前用户的菜单树
echo "📝 测试 9: 获取当前用户的菜单树 (GET /permissions/menu-tree)"
curl -s -X GET ${BASE_URL}/permissions/menu-tree \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 10. 获取当前用户的所有权限
echo "📝 测试 10: 获取当前用户的所有权限 (GET /permissions/my-permissions)"
curl -s -X GET ${BASE_URL}/permissions/my-permissions \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 11. 检查用户权限
echo "📝 测试 11: 检查用户权限 (POST /permissions/check)"
curl -s -X POST ${BASE_URL}/permissions/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"permissionCode":"dashboard:view"}' | jq .
echo ""

# 12. 删除权限（会因有子权限而失败）
echo "📝 测试 12: 删除权限 - 应该失败（有子权限）(DELETE /permissions/:permissionId)"
curl -s -X DELETE ${BASE_URL}/permissions/${NEW_PERMISSION_ID} \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 13. 查看权限树（验证更新）
echo "📝 测试 13: 再次获取权限树验证 (GET /permissions/tree)"
curl -s -X GET ${BASE_URL}/permissions/tree \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

echo "========================================="
echo "✅ 权限管理模块测试完成！"
echo "========================================="
