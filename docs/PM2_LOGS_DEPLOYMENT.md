# PM2 日志管理功能 - 部署指南

## 📋 功能概述

PM2 日志管理功能允许您通过 Web 界面直接查看和管理 PM2 进程日志，无需 SSH 连接服务器。

### 功能特性
- ✅ 查看 PM2 输出日志（out.log）
- ✅ 查看 PM2 错误日志（error.log）  
- ✅ 自定义返回行数（10-1000行）
- ✅ 一键清空所有日志
- ✅ 实时刷新
- ✅ 权限控制（需要 `pm2-logs:read` 和 `pm2-logs:clear` 权限）

---

## 🚀 部署步骤

### 步骤 1：更新数据库

在服务器上执行数据库初始化脚本，这会自动添加 PM2 日志菜单和权限：

```bash
ssh root@iZuf6j7o0kttc816hmtt1zZ << 'EOF'
cd /www/wwwroot/api.yumanyi.top
npm run db:init
EOF
```

**说明**：
- `init-db.js` 已经集成了 PM2 日志菜单配置
- 会自动插入菜单权限和按钮权限
- 会自动分配给 admin 角色
- 使用 `ON CONFLICT DO NOTHING` 保证幂等性

---

### 步骤 2：同步最新代码到服务器

```bash
# 方式 1：使用 Git（推荐）
ssh root@iZuf6j7o0kttc816hmtt1zZ << 'EOF'
cd /www/wwwroot/api.yumanyi.top
git pull origin main
npm install
EOF

# 方式 2：使用 SCP 上传单个文件
scp koa2/src/modules/logs/routes.js root@iZuf6j7o0kttc816hmtt1zZ:/www/wwwroot/api.yumanyi.top/src/modules/logs/
scp koa2/src/modules/logs/controller.js root@iZuf6j7o0kttc816hmtt1zZ:/www/wwwroot/api.yumanyi.top/src/modules/logs/
scp koa2/src/modules/logs/service.js root@iZuf6j7o0kttc816hmtt1zZ:/www/wwwroot/api.yumanyi.top/src/modules/logs/
scp koa2/src/config/init-db.js root@iZuf6j7o0kttc816hmtt1zZ:/www/wwwroot/api.yumanyi.top/src/config/
```

---

### 步骤 3：重启后端服务

```bash
ssh root@iZuf6j7o0kttc816hmtt1zZ << 'EOF'
cd /www/wwwroot/api.yumanyi.top
npm run pm2:restart
EOF
```

---

### 步骤 4：重新登录系统

1. 退出当前登录
2. 重新登录（admin / admin123）
3. 系统会自动加载新的菜单数据
4. 在侧边栏找到 **"PM2日志管理"** 菜单

---

##  使用说明

### 查看日志

1. 点击左侧菜单 **"PM2日志管理"**
2. 选择日志类型：
   - **输出日志 (out)** - 正常输出和调试信息
   - **错误日志 (error)** - 错误和异常信息
3. 设置返回行数（默认 100 行）
4. 点击 **"刷新"** 按钮

### 清空日志

1. 点击 **"清空日志"** 按钮
2. 确认操作（会清空 PM2 和项目 logs 目录的所有日志）
3. 清空后自动重新加载

---

##  API 接口

### 1. 获取 PM2 日志

```http
GET /koa2api/logs/pm2?type=out&lines=100
Authorization: Bearer <your_token>
```

**参数：**
- `type`: 日志类型（`out` 或 `error`），默认 `out`
- `lines`: 返回行数（10-1000），默认 `100`
- `process`: 进程名称，默认 `ai-api`

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "success": true,
    "type": "out",
    "process": "ai-api",
    "totalLines": 1523,
    "returnedLines": 100,
    "logs": "2024-01-01 12:00:00: Server started...\n...",
    "filePath": "/root/.pm2/logs/ai-api-out.log"
  }
}
```

### 2. 清空 PM2 日志

```http
POST /koa2api/logs/pm2/clear
Authorization: Bearer <your_token>
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "成功清空 4 个日志文件",
    "clearedCount": 4
  }
}
```

---

## 🔒 权限说明

### 菜单权限
- **权限代码**: `pm2-logs:view`
- **权限名称**: PM2日志管理
- **类型**: menu
- **分配给**: admin 角色（自动）

### 按钮权限
1. **查看PM2日志**
   - 权限代码: `pm2-logs:read`
   - 用于: 查看日志接口
   
2. **清空PM2日志**
   - 权限代码: `pm2-logs:clear`
   - 用于: 清空日志接口

---

## 📁 相关文件

### 后端文件
- `koa2/src/modules/logs/routes.js` - 路由定义
- `koa2/src/modules/logs/controller.js` - 控制器
- `koa2/src/modules/logs/service.js` - 服务层
- `koa2/src/config/init-db.js` - 数据库初始化（包含菜单配置）

### 前端文件
- `src/api/pm2.js` - API 调用
- `src/views/pm2-logs/index.vue` - 页面组件

---

##  常见问题

### Q1: 菜单不显示？
**A**: 确保已执行 `npm run db:init`，并重新登录系统。

### Q2: 提示权限不足？
**A**: 检查当前用户角色是否有 `pm2-logs:read` 权限。

### Q3: 日志文件不存在？
**A**: 确保 PM2 已正确安装并运行，日志路径通常为 `~/.pm2/logs/`。

### Q4: 清空日志后服务异常？
**A**: 清空日志不影响 PM2 进程，服务会继续正常运行并生成新日志。

---

## 🎉 完成

部署完成后，您就可以在 Web 界面方便地查看和管理 PM2 日志了！
