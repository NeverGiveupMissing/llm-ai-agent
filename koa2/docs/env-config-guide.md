# 环境变量配置完整指南

## 📋 概述

本项目使用 `.env` 文件管理所有环境变量，包括数据库连接、JWT 认证、AI API 配置等。

## 📁 配置文件说明

| 文件 | 用途 | 是否提交到 Git |
|------|------|---------------|
| `.env` | 开发环境配置 | ❌ 否（已忽略） |
| `.env.production` | 生产环境配置 | ❌ 否（已忽略） |
| `.env.example` | 配置模板 | ✅ 是 |

## ⚙️ 配置项详解

### 1. AI API 配置

```env
# API 密钥（从服务商获取）
API_KEY=your-api-key-here

# API 基础 URL
BASE_URL=https://api.openai.com/v1

# 使用的模型
MODEL=gpt-4o
```

**支持的 API 服务商：**
- **OpenAI**: `https://api.openai.com/v1`
- **Kimi (月之暗面)**: `https://api.moonshot.cn/v1`
- **其他兼容 OpenAI 格式的服务商**

**常用模型：**
- GPT-4o: `gpt-4o`
- GPT-3.5 Turbo: `gpt-3.5-turbo`
- Kimi: `moonshot-v1-8k`, `moonshot-v1-32k`, `moonshot-v1-128k`

### 2. PostgreSQL 数据库配置

```env
# 数据库主机地址
DB_HOST=localhost
# 本地开发: localhost 或 127.0.0.1
# 远程服务器: 服务器 IP 地址

# 数据库端口（默认 5432）
DB_PORT=5432

# 数据库用户名
DB_USER=postgres

# 数据库密码
DB_PASSWORD=your-password

# 数据库名称
DB_NAME=postgres
```

**注意事项：**
- 确保 PostgreSQL 服务正在运行
- 确保数据库用户有创建表和索引的权限
- 远程连接需要配置 `pg_hba.conf` 允许访问

### 3. JWT 认证配置 ⚠️ 重要

```env
# JWT 密钥（用于签名和验证 Token）
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Token 过期时间
JWT_EXPIRES_IN=7d
```

**安全建议：**

#### 开发环境
可以使用简单的密钥，但建议至少 16 位：
```env
JWT_SECRET=dev-secret-key-2026
```

#### 生产环境 ⚠️ 必须修改！
使用强随机字符串（至少 32 位）：

**Linux/Mac 生成方法：**
```bash
openssl rand -hex 32
# 输出示例: a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

**Windows PowerShell 生成方法：**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**在线生成工具：**
- https://generate-secret.vercel.app/32
- https://randomkeygen.com/

**Token 过期时间选项：**
- `1h` - 1 小时（适合高安全场景）
- `7d` - 7 天（默认，平衡安全性和便利性）
- `30d` - 30 天（适合内部系统）
- `1y` - 1 年（不推荐）

### 4. 记忆功能配置

```env
# 每次检索返回的最大记忆数量
MEMORY_MAX_RETRIEVE=5

# 最小相似度阈值（0-1 之间）
MEMORY_MIN_SIMILARITY=0.7

# 每个用户最大记忆数量
MEMORY_MAX_PER_USER=100

# 嵌入模型（用于向量搜索）
EMBEDDING_MODEL=text-embedding-ada-002
```

**参数说明：**
- `MEMORY_MAX_RETRIEVE`: 控制上下文长度，值越大响应越慢
- `MEMORY_MIN_SIMILARITY`: 值越高匹配越严格，建议 0.6-0.8
- `MEMORY_MAX_PER_USER`: 防止单个用户占用过多存储空间
- `EMBEDDING_MODEL`: 目前仅支持 OpenAI 的嵌入模型

### 5. 服务配置

```env
# 服务器监听地址
HOST=127.0.0.1
# 本地开发: 127.0.0.1（仅本地访问）
# 生产环境: 0.0.0.0（允许外网访问）

# 服务器端口
PORT=65432

# 运行环境
NODE_ENV=development
# 开发环境: development
# 生产环境: production
```

## 🚀 快速开始

### 步骤 1: 复制模板文件

```bash
cd koa2
cp .env.example .env
```

### 步骤 2: 编辑配置文件

使用文本编辑器打开 `.env` 文件，修改以下关键配置：

```env
# 1. 设置你的 AI API 密钥
API_KEY=sk-your-actual-api-key

# 2. 确认数据库配置（如果数据库在本地，通常无需修改）
DB_HOST=localhost
DB_PASSWORD=your-database-password

# 3. 生成 JWT 密钥（开发环境可以简单些）
JWT_SECRET=dev-secret-key-2026

# 4. 确认服务端口
PORT=65432
```

### 步骤 3: 初始化数据库

```bash
npm run db:init
```

### 步骤 4: 启动服务

```bash
npm run dev
```

## 🔒 安全最佳实践

### 1. 保护敏感信息

✅ **应该做的：**
- 将 `.env` 添加到 `.gitignore`
- 使用 `.env.example` 作为模板
- 定期轮换 JWT_SECRET
- 不在代码中硬编码密钥

❌ **不应该做的：**
- 不要将 `.env` 提交到 Git
- 不要在日志中打印密钥
- 不要在前端代码中暴露密钥
- 不要使用默认的 JWT_SECRET

### 2. 生产环境配置检查清单

- [ ] 修改 `JWT_SECRET` 为强随机字符串（至少 32 位）
- [ ] 缩短 `JWT_EXPIRES_IN`（建议 1-7 天）
- [ ] 设置 `HOST=0.0.0.0`（允许外网访问）
- [ ] 设置 `NODE_ENV=production`
- [ ] 使用强数据库密码
- [ ] 配置防火墙限制数据库访问
- [ ] 启用 HTTPS
- [ ] 配置 CORS 白名单

### 3. 密钥管理建议

**方案 1：环境变量（推荐）**
```bash
# Linux/Mac
export JWT_SECRET=$(openssl rand -hex 32)
node src/app.js

# Windows PowerShell
$env:JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
node src/app.js
```

**方案 2：密钥管理服务**
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault

**方案 3：PM2 生态系统文件**
在 `ecosystem.config.js` 中配置：
```javascript
module.exports = {
  apps: [{
    name: 'ai-api',
    script: 'src/app.js',
    env: {
      JWT_SECRET: 'your-secret-here',
      // ... 其他环境变量
    }
  }]
}
```

## 🐛 常见问题

### Q1: 提示 "JWT_SECRET 未配置"

**A:** 检查 `.env` 文件中是否有 `JWT_SECRET` 配置，并确保没有拼写错误。

### Q2: 数据库连接失败

**症状：**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决：**
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 启动 PostgreSQL
sudo systemctl start postgresql

# 测试连接
psql -h localhost -U postgres -d postgres
```

### Q3: Token 立即过期

**A:** 检查系统时间是否正确，JWT 依赖准确的系统时间。

```bash
# 查看系统时间
date

# 同步时间（Linux）
sudo ntpdate pool.ntp.org
```

### Q4: 如何更换 JWT_SECRET？

**A:** 
1. 生成新的密钥
2. 更新 `.env` 文件
3. 重启服务
4. 所有现有 Token 将失效，用户需要重新登录

### Q5: 开发环境和生产环境配置不同怎么办？

**A:** 使用不同的 `.env` 文件：
- 开发环境：`.env`
- 生产环境：`.env.production`

启动时指定：
```bash
# 开发环境
npm run dev

# 生产环境
NODE_ENV=production node src/app.js
# 或使用 PM2
pm2 start ecosystem.config.js --env production
```

## 📊 配置验证

### 验证数据库连接

```bash
# 运行数据库初始化脚本（会测试连接）
npm run db:init
```

### 验证 JWT 配置

```bash
# 启动服务后，尝试注册和登录
curl -X POST http://localhost:65432/koa2api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

curl -X POST http://localhost:65432/koa2api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

### 验证 AI API 配置

访问聊天界面，发送一条消息，检查后端日志是否有错误。

## 📝 配置示例

### 开发环境完整示例

```env
# AI API 配置
API_KEY=sk-dev-key-for-testing
BASE_URL=https://api.openai.com/v1
MODEL=gpt-3.5-turbo

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=dev-password
DB_NAME=postgres

# JWT 配置
JWT_SECRET=dev-secret-2026-not-for-production
JWT_EXPIRES_IN=7d

# 记忆功能配置
MEMORY_MAX_RETRIEVE=5
MEMORY_MIN_SIMILARITY=0.7
MEMORY_MAX_PER_USER=100
EMBEDDING_MODEL=text-embedding-ada-002

# 服务配置
HOST=127.0.0.1
PORT=65432
NODE_ENV=development
```

### 生产环境完整示例

```env
# AI API 配置
API_KEY=sk-prod-key-xxxxxxxxxxxx
BASE_URL=https://api.openai.com/v1
MODEL=gpt-4o

# 数据库配置
DB_HOST=192.168.1.100
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=strong-password-here
DB_NAME=ai_platform

# JWT 配置
JWT_SECRET=a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
JWT_EXPIRES_IN=1d

# 记忆功能配置
MEMORY_MAX_RETRIEVE=10
MEMORY_MIN_SIMILARITY=0.75
MEMORY_MAX_PER_USER=500
EMBEDDING_MODEL=text-embedding-ada-002

# 服务配置
HOST=0.0.0.0
PORT=65432
NODE_ENV=production
```

## 🎯 下一步

配置完成后：

1. ✅ ~~编辑 .env 文件~~
2. ⏳ 安装依赖：`npm install`
3. ⏳ 初始化数据库：`npm run db:init`
4. ⏳ 启动服务：`npm run dev`
5. ⏳ 测试 API 接口

## 📞 技术支持

如遇到配置问题：
1. 检查 `.env` 文件格式是否正确
2. 确认所有必需的配置项都已填写
3. 查看后端日志获取详细错误信息
4. 参考本文档的"常见问题"部分
