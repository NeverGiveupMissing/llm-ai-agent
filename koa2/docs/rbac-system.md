# RBAC 权限系统 - Model + Service 层

## 已完成文件清单

### Models 层 (数据库操作封装)

#### 1. `models/userModel.js` ✅
**功能：** 用户数据管理
- `create(userData)` - 创建新用户
- `getByUsername(username)` - 根据用户名查询
- `getById(userId)` - 根据 ID 查询
- `list(params)` - 分页获取用户列表
- `count(params)` - 获取用户总数
- `update(userId, updates)` - 更新用户信息
- `delete(userId)` - 删除用户
- `assignRole(userId, roleId)` - 分配角色
- `removeRole(userId, roleId)` - 移除角色
- `getUserRoles(userId)` - 获取用户所有角色

#### 2. `models/roleModel.js` ✅
**功能：** 角色数据管理
- `create(roleData)` - 创建新角色
- `getByName(name)` - 根据名称查询
- `getById(roleId)` - 根据 ID 查询
- `list(params)` - 分页获取角色列表
- `count(params)` - 获取角色总数
- `update(roleId, updates)` - 更新角色信息
- `delete(roleId)` - 删除角色（系统角色保护）
- `assignPermission(roleId, permissionId)` - 分配权限
- `removePermission(roleId, permissionId)` - 移除权限
- `assignPermissions(roleId, permissionIds)` - 批量分配权限
- `getRolePermissions(roleId)` - 获取角色所有权限
- `getRoleUsers(roleId, params)` - 获取角色的所有用户

#### 3. `models/permissionModel.js` ✅
**功能：** 权限数据管理与验证
- `getByCode(code)` - 根据代码查询权限
- `getById(permissionId)` - 根据 ID 查询
- `list(params)` - 获取权限列表（支持筛选）
- `listByModule()` - 按模块分组获取权限
- `getUserPermissions(userId)` - 获取用户所有权限
- `hasPermission(userId, permissionCode)` - 检查单个权限
- `hasAnyPermission(userId, permissionCodes)` - 检查任一权限
- `hasAllPermissions(userId, permissionCodes)` - 检查所有权限

### Services 层 (业务逻辑封装)

#### 4. `services/userService.js` ✅
**功能：** 用户业务逻辑
- `createUser(userData)` - 创建用户（含密码加密、默认角色分配）
- `login(username, password)` - 用户登录（密码验证、状态检查）
- `getUserDetail(userId)` - 获取用户详情（含角色信息）
- `listUsers(params)` - 获取用户列表（含角色信息）
- `updateUser(userId, updates)` - 更新用户信息
- `deleteUser(userId)` - 删除用户
- `assignRole(userId, roleId)` - 为用户分配角色
- `removeRole(userId, roleId)` - 移除用户角色

#### 5. `services/roleService.js` ✅
**功能：** 角色业务逻辑
- `createRole(roleData)` - 创建角色
- `getRoleDetail(roleId)` - 获取角色详情（含权限列表）
- `listRoles(params)` - 获取角色列表
- `updateRole(roleId, updates)` - 更新角色信息
- `deleteRole(roleId)` - 删除角色
- `assignPermission(roleId, permissionId)` - 分配权限
- `removePermission(roleId, permissionId)` - 移除权限
- `assignPermissions(roleId, permissionIds)` - 批量分配权限
- `getRoleUsers(roleId, params)` - 获取角色的所有用户

#### 6. `services/permissionService.js` ✅ (刚完成)
**功能：** 权限业务逻辑与中间件
- `listPermissions(params)` - 获取权限列表
- `getPermissionsByModule()` - 按模块分组获取权限
- `getPermissionDetail(permissionId)` - 获取权限详情
- `getUserPermissions(userId)` - 获取用户的所有权限
- `checkPermission(userId, permissionCode)` - 检查用户权限
- `checkAnyPermission(userId, permissionCodes)` - 检查任一权限
- `checkAllPermissions(userId, permissionCodes)` - 检查所有权限
- `requirePermission(permissionCode)` - 权限验证中间件（单个）
- `requireAnyPermission(permissionCodes)` - 权限验证中间件（任一）
- `requireAllPermissions(permissionCodes)` - 权限验证中间件（所有）

### 数据库迁移文件

#### 7. `config/migration-rbac-system.sql` ✅
**功能：** RBAC 系统数据库表结构
- `users` - 用户表
- `roles` - 角色表
- `permissions` - 权限表
- `user_roles` - 用户-角色关联表
- `role_permissions` - 角色-权限关联表
- 预置数据：admin/user 角色 + 基础权限

## 代码风格对齐

所有文件严格遵循项目现有代码风格：

✅ **命名规范**
- 文件名：`camelCase.js`（如 `userModel.js`）
- 类名：`PascalCase`（如 `UserModel`）
- 方法名：`camelCase`（如 `getUserDetail`）

✅ **导出方式**
```javascript
module.exports = new UserModel()  // 单例模式
```

✅ **数据库操作**
```javascript
const { pool } = require('../../config/db')
const result = await pool.query(query, values)
return result.rows[0] || null
```

✅ **错误处理**
```javascript
if (!user) {
  throw new Error('用户不存在')
}
```

✅ **返回格式**
```javascript
return {
  success: true,
  data: {...},
  message: '操作成功',
}
```

✅ **注释规范**
```javascript
/**
 * 方法说明
 * @param {Type} paramName - 参数说明
 * @returns {Type} 返回值说明
 */
```

## 依赖说明

### 需要安装的 NPM 包

```bash
npm install bcrypt uuid
```

- `bcrypt` - 密码加密（userService.js 使用）
- `uuid` - UUID 生成（所有 Model 使用）

### 现有依赖

- `pg` - PostgreSQL 数据库驱动（已存在）
- `dayjs` - 日期处理（已存在）

## 下一步工作（Step 3）

### 需要创建的文件

1. **Controller 层**
   - `modules/auth/controller.js` - 认证控制器（登录、注册）
   - `modules/user/controller.js` - 用户管理控制器
   - `modules/role/controller.js` - 角色管理控制器
   - `modules/permission/controller.js` - 权限管理控制器

2. **Routes 层**
   - `modules/auth/routes.js` - 认证路由
   - `modules/user/routes.js` - 用户路由
   - `modules/role/routes.js` - 角色路由
   - `modules/permission/routes.js` - 权限路由

3. **中间件**
   - `middlewares/auth.middleware.js` - JWT 认证中间件
   - `middlewares/permission.middleware.js` - 权限验证中间件

4. **路由注册**
   - 更新 `routes/index.js` 注册新路由

## 数据库初始化

执行 SQL 迁移文件：

```bash
# 方式 1：直接执行 SQL
psql -U postgres -d your_database -f src/config/migration-rbac-system.sql

# 方式 2：在 Node.js 中执行
node -e "require('./src/config/init-db').initDatabase()"
```

## API 接口设计（预览）

### 认证接口
- `POST /koa2api/auth/register` - 用户注册
- `POST /koa2api/auth/login` - 用户登录
- `POST /koa2api/auth/logout` - 用户登出
- `GET /koa2api/auth/profile` - 获取当前用户信息

### 用户管理
- `GET /koa2api/users` - 用户列表
- `GET /koa2api/users/:id` - 用户详情
- `PUT /koa2api/users/:id` - 更新用户
- `DELETE /koa2api/users/:id` - 删除用户
- `POST /koa2api/users/:id/roles` - 分配角色
- `DELETE /koa2api/users/:id/roles/:roleId` - 移除角色

### 角色管理
- `GET /koa2api/roles` - 角色列表
- `GET /koa2api/roles/:id` - 角色详情
- `POST /koa2api/roles` - 创建角色
- `PUT /koa2api/roles/:id` - 更新角色
- `DELETE /koa2api/roles/:id` - 删除角色
- `POST /koa2api/roles/:id/permissions` - 分配权限
- `DELETE /koa2api/roles/:id/permissions/:permissionId` - 移除权限

### 权限管理
- `GET /koa2api/permissions` - 权限列表
- `GET /koa2api/permissions/by-module` - 按模块分组
- `GET /koa2api/permissions/:id` - 权限详情
- `GET /koa2api/permissions/check/:code` - 检查权限

## 权限中间件使用示例

```javascript
const permissionService = require('../../services/permissionService')

// 单个权限验证
router.get('/api/users', permissionService.requirePermission('user:read'), controller.list)

// 任一权限验证
router.post('/api/users', permissionService.requireAnyPermission(['user:create', 'admin']), controller.create)

// 所有权限验证
router.delete('/api/users/:id', permissionService.requireAllPermissions(['user:delete', 'user:manage']), controller.delete)
```

## 注意事项

1. **密码加密**：所有密码必须使用 bcrypt 加密存储
2. **系统角色保护**：admin 和 user 角色不可删除
3. **事务处理**：批量操作使用数据库事务保证一致性
4. **权限缓存**：生产环境建议实现权限缓存机制（Redis）
5. **JWT Token**：后续需要实现 JWT 认证中间件
6. **错误处理**：统一使用 ResponseUtil 返回标准格式

## 验证清单

- [x] 所有 Model 文件符合现有代码风格
- [x] 所有 Service 文件符合现有代码风格
- [x] 数据库迁移 SQL 完整
- [x] 权限验证中间件已实现
- [ ] Controller 层（待创建）
- [ ] Routes 层（待创建）
- [ ] JWT 认证中间件（待创建）
- [ ] 本地测试验证
- [ ] 生产环境部署
