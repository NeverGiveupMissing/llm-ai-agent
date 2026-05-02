# 动态路由配置指南

## 📋 概述

项目采用**动态路由架构**，所有菜单和路由配置存储在数据库中，无需修改前端代码即可添加/删除页面。

## 🗄️ 数据库表结构

### permissions 表

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | UUID | 权限ID | `c0000000-0000-0000-0000-000000000001` |
| name | VARCHAR | 菜单名称 | `工作台` |
| code | VARCHAR | 权限编码 | `dashboard:read` |
| type | VARCHAR | 类型：`menu`/`button` | `menu` |
| parent_id | UUID | 父权限ID | `NULL`（顶级菜单） |
| path | VARCHAR | 路由路径 | `dashboard` |
| icon | VARCHAR | 图标名称 | `dashboard` |
| sort_order | INT | 排序 | `10` |

## 🔧 添加新菜单的步骤

### 1. 准备前端组件

确保组件文件存在于 `src/views/` 目录下，**路径必须与数据库中的 path 字段一致**：

```
src/views/my-new-page/index.vue  ✅ path = 'my-new-page'
src/views/user-management/index.vue  ✅ path = 'user-management'
```

### 2. 在数据库中插入菜单记录

```sql
INSERT INTO permissions (id, name, code, type, parent_id, path, icon, sort_order)
VALUES (
  gen_random_uuid(),              -- 自动生成UUID
  '我的新页面',                    -- 菜单名称
  'my-new-page:read',             -- 权限编码
  'menu',                         -- 类型
  NULL,                           -- 顶级菜单（无父级）
  'my-new-page',                  -- ✅ 路由路径（必须与 src/views/ 下的文件夹名一致）
  'document',                     -- 图标（参考 menu.js 中的图标映射）
  20                              -- 排序（数字越小越靠前）
);
```

### 3. 为角色分配权限

```sql
-- 为 admin 角色分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'a0000000-0000-0000-0000-000000000001', id 
FROM permissions 
WHERE code = 'my-new-page:read';
```

### 4. 刷新页面

重新登录或刷新页面，新菜单会自动出现在侧边栏，路由也会自动注册。

**✅ 无需在前端维护任何映射表！**

## 📌 重要注意事项

### 1. 文件夹命名规范

**数据库中的 `path` 字段必须与 `src/views/` 下的文件夹名完全一致**：

```
数据库 path = 'user-management'  ✅  →  src/views/user-management/index.vue
数据库 path = 'ChatLogs'         ✅  →  src/views/ChatLogs/index.vue
数据库 path = 'docs'             ✅  →  src/views/ApiDocs/index.vue  ❌ 错误！应该是 docs
```

**推荐：数据库 path 使用小写连字符（kebab-case）**，例如：
- `user-management`
- `operation-log`
- `permission-management`

### 2. 图标映射

支持的图标名称（在 `menu.js` 中定义）：
- `dashboard` - 工作台
- `chat` - AI对话
- `agent` - 智能体
- `knowledge` - 知识库
- `memory` - 记忆管理
- `tools` - 工具
- `settings` - 系统设置
- `docs` - API文档
- `logs` - 日志

### 3. 子菜单配置

如果要添加子菜单，设置 `parent_id` 为父菜单的 ID：

```sql
-- 先插入父菜单
INSERT INTO permissions (id, name, code, type, path, ...)
VALUES ('parent-uuid', '父菜单', 'parent:read', 'menu', 'parent', ...);

-- 再插入子菜单
INSERT INTO permissions (id, name, code, type, parent_id, path, ...)
VALUES ('child-uuid', '子菜单', 'child:read', 'menu', 'parent-uuid', 'child', ...);
```

### 4. 权限类型

- **menu**：会显示在侧边栏，并注册路由
- **button**：只显示按钮权限，不注册路由

### 5. 调试方法

打开浏览器控制台，查看日志：
- `✅ 菜单树加载成功` - 菜单数据获取成功
- `🛣️ 开始注册动态路由...` - 开始注册路由
- `✅ 成功注册 X 个动态路由` - 注册完成
- `⚠️ 未找到组件: @/views/xxx/index.vue` - 组件文件不存在或路径不匹配

## 🔄 修改现有菜单

```sql
-- 修改菜单名称
UPDATE permissions 
SET name = '新的名称' 
WHERE code = 'dashboard:read';

-- 修改排序
UPDATE permissions 
SET sort_order = 5 
WHERE code = 'my-new-page:read';

-- 禁用菜单（通过设置 path 为空）
UPDATE permissions 
SET path = NULL 
WHERE code = 'my-old-page:read';
```

## 🗑️ 删除菜单

```sql
-- 先删除角色权限关联
DELETE FROM role_permissions 
WHERE permission_id IN (
  SELECT id FROM permissions WHERE code = 'my-page:read'
);

-- 再删除权限记录
DELETE FROM permissions 
WHERE code = 'my-page:read';
```

## 🐛 常见问题

### Q: 菜单没有显示？
A: 检查以下几点：
1. 数据库中 `type` 是否为 `'menu'`
2. `path` 字段是否有值
3. 当前用户的角色是否拥有该权限
4. `src/views/{path}/index.vue` 文件是否存在

### Q: 路由 404？
A: 检查：
1. 数据库 `path` 是否与 `src/views/` 下的文件夹名一致
2. 组件文件路径是否正确（必须是 `index.vue`）
3. 重新登录刷新路由

### Q: 如何调试？
A: 打开浏览器控制台，查看日志：
- `✅ 菜单树加载成功` - 菜单数据获取成功
- `🛣️ 开始注册动态路由...` - 开始注册路由
- `✅ 成功注册 X 个动态路由` - 注册完成
- `⚠️ 未找到组件: @/views/xxx/index.vue` - 组件文件不存在或路径不匹配

## 📖 相关文件

- 前端路由配置：`src/router/index.js`
- 权限状态管理：`src/stores/modules/permission.js`
- 菜单状态管理：`src/stores/modules/menu.js`
- 后端权限服务：`koa2/src/services/permissionService.js`
- 数据库初始化：`koa2/src/config/sql/init-default-data.js`
