#!/bin/bash
# ============================================
# 操作日志模块测试脚本
# ============================================

# 引入公共配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/constants.sh"

echo "========================================="
echo "📋 开始测试操作日志模块"
echo "========================================="
echo ""

# 1. 获取操作日志列表（默认分页）
echo "📝 测试 1: 获取操作日志列表-默认分页 (GET /logs?page=1&limit=20)"
curl -s -X GET "${BASE_URL}/logs?page=1&limit=20" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 2. 获取操作日志列表（按用户名筛选）
echo "📝 测试 2: 获取操作日志列表-按用户名筛选 (GET /logs?username=admin)"
curl -s -X GET "${BASE_URL}/logs?username=admin" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 3. 获取操作日志列表（按日期范围筛选）
echo "📝 测试 3: 获取操作日志列表-按日期范围筛选 (GET /logs?startDate=&endDate=)"
START_DATE=$(date -d "7 days ago" +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -v-7d +%Y-%m-%dT%H:%M:%S.000Z)
END_DATE=$(date +%Y-%m-%dT%H:%M:%S.000Z)
curl -s -X GET "${BASE_URL}/logs?startDate=${START_DATE}&endDate=${END_DATE}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 4. 获取操作日志列表（按状态筛选）
echo "📝 测试 4: 获取操作日志列表-按状态筛选 (GET /logs?status=success)"
curl -s -X GET "${BASE_URL}/logs?status=success" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 5. 获取操作日志列表（组合筛选）
echo "📝 测试 5: 获取操作日志列表-组合筛选 (GET /logs?username=admin&status=success&page=1&limit=10)"
curl -s -X GET "${BASE_URL}/logs?username=admin&status=success&page=1&limit=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 6. 获取统计信息（全部）
echo "📝 测试 6: 获取统计信息-全部 (GET /logs/stats)"
curl -s -X GET "${BASE_URL}/logs/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 7. 获取统计信息（按日期范围）
echo "📝 测试 7: 获取统计信息-按日期范围 (GET /logs/stats?startDate=&endDate=)"
curl -s -X GET "${BASE_URL}/logs/stats?startDate=${START_DATE}&endDate=${END_DATE}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
echo ""

# 8. 验证统计数据格式
echo "📝 测试 8: 验证统计数据格式"
STATS_RESPONSE=$(curl -s -X GET "${BASE_URL}/logs/stats" \
  -H "Authorization: Bearer ${TOKEN}")

echo "总操作数: $(echo ${STATS_RESPONSE} | jq '.data.total')"
echo "成功操作数: $(echo ${STATS_RESPONSE} | jq '.data.success')"
echo "失败操作数: $(echo ${STATS_RESPONSE} | jq '.data.failed')"
echo "平均响应时间: $(echo ${STATS_RESPONSE} | jq '.data.avgDuration') ms"
echo "模块统计数量: $(echo ${STATS_RESPONSE} | jq '.data.moduleStats | length')"
echo "用户统计数量: $(echo ${STATS_RESPONSE} | jq '.data.userStats | length')"
echo ""

# 9. 获取日志列表并验证分页
echo "📝 测试 9: 验证分页功能 (GET /logs?page=1&limit=5)"
PAGE1_RESPONSE=$(curl -s -X GET "${BASE_URL}/logs?page=1&limit=5" \
  -H "Authorization: Bearer ${TOKEN}")

echo "第1页记录数: $(echo ${PAGE1_RESPONSE} | jq '.data.list | length')"
echo "总记录数: $(echo ${PAGE1_RESPONSE} | jq '.data.total')"
echo "当前页: $(echo ${PAGE1_RESPONSE} | jq '.data.page')"
echo "每页条数: $(echo ${PAGE1_RESPONSE} | jq '.data.limit')"
echo ""

# 10. 获取第2页验证分页
echo "📝 测试 10: 获取第2页 (GET /logs?page=2&limit=5)"
PAGE2_RESPONSE=$(curl -s -X GET "${BASE_URL}/logs?page=2&limit=5" \
  -H "Authorization: Bearer ${TOKEN}")

echo "第2页记录数: $(echo ${PAGE2_RESPONSE} | jq '.data.list | length')"
echo ""

echo "========================================="
echo "✅ 操作日志模块测试完成！"
echo "========================================="
