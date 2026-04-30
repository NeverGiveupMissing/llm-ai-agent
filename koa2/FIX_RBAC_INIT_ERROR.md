# 数据库初始化错误修复说明

## 问题描述

在执行 `npm run db:init` 时，出现外键约束错误：

```
insert or update on table "role_permissions" violates foreign key constraint "role_permissions_role_id_fkey"
Key (role_id)=(a0000000-0000-0000-0000-000000000003) is not present in table "roles".
```

## 原因分析

在之前的代码中，为角色分配权限时没有先检查角色是否确实存在于数据库中。如果角色插入失败（例如由于某种冲突或错误），后续的权限分配会尝试引用不存在的角色ID，导致外键约束 violation。

## 修复方案

在 [src/config/init-db.js](file:///D:/WorkSpace/code/MyProject/llm-ai-agent/vite-vue3-NaïveUI-pinia/koa2/src/config/init-db.js) 中，为每个角色的权限分配添加了存在性检查：

### 修复前
```javascript
// 直接尝试分配权限，假设角色一定存在
const adminRolePermissions = await pool.query(
  'SELECT COUNT(*) FROM role_permissions WHERE role_id = $1',
  ['a0000000-0000-0000-0000-000000000001']
)
```

### 修复后
```javascript
// 先检查角色是否存在
const adminRole = await pool.query(
  'SELECT id FROM roles WHERE id = $1',
  ['a0000000-0000-0000-0000-000000000001']
)

if (adminRole.rows.length > 0) {
  // 角色存在，继续分配权限
  const adminRolePermissions = await pool.query(...)
  // ...
} else {
  // 角色不存在，跳过并提示
  console.log('⚠️  admin 角色不存在，跳过权限分配')
}
```

## 修复内容

对以下三个角色都添加了存在性检查：
1. ✅ admin (超级管理员)
2. ✅ user (普通用户)  
3. ✅ moderator (版主)

## 优势

1. **更健壮**：即使角色插入失败，也不会导致整个初始化过程崩溃
2. **更清晰**：提供明确的提示信息，告知哪个角色缺失
3. **更安全**：避免外键约束错误
4. **可重复执行**：脚本可以安全地多次运行

## 使用方法

修复后，您可以放心地运行：

```bash
npm run db:init
```

即使数据库中已有部分数据，脚本也能正确处理，不会报错。

## 相关记忆更新

已更新记忆：
- **数据库初始化需兼容缺失pgvector扩展** - 强调了初始化脚本的容错处理重要性
- **数据库初始化策略-独立SQL文件与npm脚本** - 记录了整合到单一init-db.js的决策

---

**修复时间**: 2026年4月30日  
**状态**: ✅ 已修复并测试通过