# 接口管理模块迁移指南

## 📋 迁移概述

本次迁移将接口管理模块从 `api` 全面重命名为 `interface`，包括：
- 数据库表：`sys_api` → `sys_interface`
- 后端模块目录：`koa2/src/modules/api/` → `koa2/src/modules/interface/`
- HTTP 路由前缀：`/apis` → `/interfaces`
- 权限标识：`api:*` → `interface:*`

---

## 🚀 执行步骤

### 步骤 1：执行数据库迁移脚本

```bash
# 进入 koa2 目录
cd koa2

# 连接数据库并执行迁移脚本
psql -U your_username -d your_database -f database/sql/migrate_sys_api_to_interface.sql
```

或者使用 Node.js 脚本：

```bash
# 如果有初始化脚本
npm run db:init
```

### 步骤 2：重命名后端模块目录

**手动操作：**

```bash
# Windows PowerShell
cd koa2/src/modules
Rename-Item -Path "api" -NewName "interface"

# Linux/Mac
cd koa2/src/modules
mv api interface
```

或者在文件资源管理器中手动重命名。

### 步骤 3：重启后端服务

```bash
# 如果使用 PM2
pm2 restart <你的应用名>

# 或者开发模式
cd koa2
npm run dev
```

### 步骤 4：重启前端开发服务器

```bash
# 前端项目根目录
npm run dev
```

### 步骤 5：验证迁移结果

1. **打开浏览器**，访问接口管理页面
2. **强制刷新**：`Ctrl + F5` 或 `Cmd + Shift + R`
3. **检查以下功能**：
   - ✅ 数据列表正常显示
   - ✅ 分页功能正常
   - ✅ 搜索功能正常
   - ✅ 新增接口功能正常
   - ✅ 编辑接口功能正常
   - ✅ 删除接口功能正常
   - ✅ 浏览器控制台无报错

---

## 🔍 问题排查

### 问题 1：页面显示"无数据"

**可能原因：**
- 后端服务未重启
- 数据库迁移未执行
- 前端缓存未清除

**解决方案：**
```bash
# 1. 检查后端日志
pm2 logs <应用名>

# 2. 验证数据库表
psql -U your_username -d your_database -c "SELECT COUNT(*) FROM sys_interface;"

# 3. 清除浏览器缓存并强制刷新
```

### 问题 2：API 请求 404 错误

**可能原因：**
- 后端目录未重命名
- 路由导入路径未更新

**解决方案：**
```bash
# 检查目录是否存在
ls -la koa2/src/modules/interface/

# 检查路由配置
cat koa2/src/routes/index.js | grep interface
```

### 问题 3：权限验证失败

**可能原因：**
- 数据库权限标识未更新
- 前端权限标识不匹配

**解决方案：**
```sql
-- 检查权限标识
SELECT menu_id, menu_name, perms 
FROM sys_menu 
WHERE menu_id IN (112, 1120, 1121, 1122, 1123);

-- 如果还有 api: 前缀，手动更新
UPDATE sys_menu 
SET perms = REPLACE(perms, 'api:', 'interface:')
WHERE perms LIKE 'api:%';
```

---

## 📝 迁移检查清单

执行迁移时，请逐项勾选：

- [ ] 数据库迁移脚本已执行
- [ ] 数据库表 `sys_interface` 存在
- [ ] 后端目录已重命名为 `interface`
- [ ] 后端服务已重启
- [ ] 前端开发服务器已重启
- [ ] 浏览器已强制刷新
- [ ] 接口列表数据正常显示
- [ ] 分页功能正常
- [ ] 增删改查功能正常
- [ ] 浏览器控制台无报错
- [ ] 后端日志无异常

---

## 📊 迁移前后对比

| 项目 | 迁移前 | 迁移后 | 状态 |
|------|--------|--------|------|
| **数据库表名** | `sys_api` | `sys_interface` | ✅ 需执行 SQL |
| **后端模块目录** | `koa2/src/modules/api/` | `koa2/src/modules/interface/` | ✅ 需手动重命名 |
| **HTTP 路由前缀** | `/apis` | `/interfaces` | ✅ 已修改 |
| **权限标识前缀** | `api:*` | `interface:*` | ✅ 需执行 SQL |
| **前端 API 路径** | `/koa2api/apis` | `/koa2api/interfaces` | ✅ 已修改 |
| **前端视图目录** | `src/views/system/api/` | `src/views/system/interface/` | ✅ 已创建 |
| **前端 API 文件** | `src/api/api.js` | `src/api/interface.js` | ✅ 已修改 |

---

## ⚠️ 注意事项

1. **备份数据库**：执行迁移前务必备份数据库
   ```bash
   pg_dump -U your_username -d your_database > backup_before_migration.sql
   ```

2. **测试环境验证**：建议先在测试环境验证迁移脚本

3. **回滚方案**：如果迁移失败，可以使用备份恢复
   ```bash
   psql -U your_username -d your_database < backup_before_migration.sql
   ```

4. **权限影响**：迁移后需要重新分配接口管理权限给用户角色

---

## 🎯 迁移完成确认

当所有检查项都打勾后，迁移完成！🎉

如有问题，请查看：
- 后端日志：`pm2 logs`
- 浏览器 Network 面板
- 数据库查询结果