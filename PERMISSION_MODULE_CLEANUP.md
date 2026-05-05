# 权限管理模块清理指南

## 📋 清理概述

已将权限管理功能完全迁移至菜单管理模块，现在需要清理冗余的权限管理模块。

## ✅ 已完成的清理

### 1. 后端路由配置
- ✅ 移除 `koa2/src/routes/index.js` 中的 permission 模块引用
  - 删除第 13 行：`const permissionRoutes = require('../modules/permission/routes')`
  - 删除第 45 行：`router.use(permissionRoutes.routes(), permissionRoutes.allowedMethods())`

### 2. 创建数据库清理 SQL
- ✅ 创建 `koa2/database/sql/cleanup_permission_module.sql`
  - 删除权限管理菜单（menu_id: 102）
  - 删除权限管理按钮权限（menu_id: 1012-1016）
  - 清理角色权限关联表中的相关数据

## 📝 需要手动执行的步骤

### 步骤 1：执行数据库清理 SQL

```bash
cd koa2
# 连接到 PostgreSQL 数据库
psql -U postgres -d your_database_name -f database/sql/cleanup_permission_module.sql
```

或者使用数据库管理工具执行 `cleanup_permission_module.sql` 文件。

### 步骤 2：删除后端 permission 模块目录

```bash
cd koa2/src/modules
Remove-Item -Path "permission" -Recurse -Force
```

### 步骤 3：删除前端 permission 页面目录

```bash
cd src/views/system
Remove-Item -Path "permission" -Recurse -Force
```

### 步骤 4：检查并清理菜单数据

执行以下 SQL 验证系统管理下的菜单：

```sql
-- 查看系统管理下的所有菜单
SELECT 
  menu_id,
  menu_name,
  parent_id,
  order_num,
  path,
  menu_type,
  perms
FROM sys_menu
WHERE parent_id IN (6, 200)  -- 6 或 200 是系统管理的 ID
ORDER BY order_num;
```

**应该只保留以下菜单：**
1. 用户管理 (menu_id: 100)
2. 角色管理 (menu_id: 101)
3. 菜单管理 (menu_id: 111)
4. 接口管理 (menu_id: 112)
5. 日志管理（操作日志、聊天日志等）

### 步骤 5：更新 sys_menu.sql 初始化脚本

编辑 `koa2/database/sql/sys_menu.sql`，删除权限管理相关数据：

**删除以下行：**
- 第 104-105 行：权限管理菜单 INSERT 语句
- 第 188-200 行：权限管理按钮权限 INSERT 语句

## 🎯 清理后的系统菜单结构

系统管理（parent_id: 200 或 6）：
```
├── 用户管理 (user:list)
├── 角色管理 (role:list)
├── 菜单管理 (menu:list) ← 所有权限标识都在这里管理
├── 接口管理 (api:list)  ← 新增的接口管理模块
└── 日志管理
    ├── 操作日志 (log:operation)
    ├── 聊天日志 (log:chat)
    └── PM2日志 (log:pm2)
```

## 🔍 验证清单

- [ ] 数据库中没有 menu_id=102 的权限管理菜单
- [ ] 数据库中没有 menu_id=1012-1016 的权限管理按钮
- [ ] `sys_role_menu` 表中没有引用已删除菜单的记录
- [ ] 后端代码中没有 `permission` 模块的引用
- [ ] 前端代码中没有 `permission` 页面的引用
- [ ] 侧边栏"系统管理"下没有"权限管理"菜单项
- [ ] 所有权限标识（perms）都通过"菜单管理"模块管理

##  权限管理说明

**现在所有权限都在菜单管理中统一管理：**

1. **目录权限**：menu_type = 'M'，只有菜单名称、图标、排序等
2. **菜单权限**：menu_type = 'C'，包含路由地址、组件路径、权限标识
3. **按钮权限**：menu_type = 'F'，只有菜单名称和权限标识

**权限标识（perms）示例：**
- `user:list` - 用户列表查询
- `user:create` - 用户新增
- `role:assignPermission` - 角色分配权限
- `menu:list` - 菜单列表查询
- `api:query` - 接口查询

## ️ 注意事项

1. **备份数据库**：执行删除 SQL 前请先备份数据库
2. **清除缓存**：清理完成后重启前后端服务，并清除浏览器缓存
3. **角色权限**：如果之前有角色分配了权限管理菜单的权限，需要重新分配
4. **API 调用**：确保前端没有调用 `/api/permissions/*` 的接口

## 🚀 重启服务

```bash
# 后端
cd koa2
npm run dev

# 前端
npm run dev
```

访问系统管理 → 菜单管理，确认所有权限标识正常显示和管理。
