// ============================================
// 测试脚本公共常量配置
// ============================================

// API 基础配置
const BASE_URL = "http://localhost:65432/koa2api"

// 管理员账号
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123"

// JWT Token（在此统一修改，所有测试脚本共用）
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MTBjMGM4NC02YzY4LTQwYWEtOWE4OC01Y2YyMWYxMzVhNWQiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzc3NTU4OTQ4LCJleHAiOjE3NzgxNjM3NDh9.5nbLFg351djEwour-3UBIkOMjYXmmj4M4yGV5qIiMvA"

// 管理员用户 ID
const ADMIN_USER_ID = "910c0c84-6c68-40aa-9a88-5cf21f135a5d"

// 请求头配置
const HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${TOKEN}`
}

// 导出配置
module.exports = {
  BASE_URL,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  TOKEN,
  ADMIN_USER_ID,
  HEADERS
}
