#!/bin/bash
# ============================================
# 测试脚本公共常量配置（Shell 版本）
# ============================================

# API 基础配置
export BASE_URL="http://localhost:65432/koa2api"

# 管理员账号
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="admin123"

# JWT Token（在此统一修改，所有测试脚本共用）
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MTBjMGM4NC02YzY4LTQwYWEtOWE4OC01Y2YyMWYxMzVhNWQiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzc3NTU4OTQ4LCJleHAiOjE3NzgxNjM3NDh9.5nbLFg351djEwour-3UBIkOMjYXmmj4M4yGV5qIiMvA"

# 管理员用户 ID
export ADMIN_USER_ID="910c0c84-6c68-40aa-9a88-5cf21f135a5d"

echo "✅ 已加载测试配置"
echo "   BASE_URL: ${BASE_URL}"
echo "   TOKEN: ${TOKEN:0:20}..."
echo ""
