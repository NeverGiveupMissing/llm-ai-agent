# 数据库管理模块 - 数据更新问题修复说明

## 问题描述
在执行数据更新操作后，虽然后端显示更新成功（1行受影响），但前端查询到的数据仍然是旧数据。

**根本原因**：PostgreSQL 的 `updated_at` 字段不会自动更新，导致虽然数据已修改，但时间戳未变，前端可能误判为数据未更新。

## 问题原因分析

1. **主键查询不够准确**
   - 原来使用 `LIKE '%pkey%'` 匹配约束名，可能不准确
   - 改为使用标准的 `constraint_type = 'PRIMARY KEY'` 查询

2. **数据刷新时序问题**
   - 更新成功后立即调用查询接口，可能读取到缓存的旧数据
   - PostgreSQL 事务隔离级别可能导致读写不一致

3. **缺少返回更新后的数据**
   - 原来的 UPDATE 语句没有使用 `RETURNING` 子句
   - 前端只能重新查询，无法直接使用更新结果

4. **updated_at 字段未自动更新** ⚠️ **核心问题**
   - PostgreSQL 不会自动更新 `updated_at` 时间戳
   - 需要在 UPDATE 语句中显式设置 `updated_at = NOW()`
   - 导致虽然数据已修改，但时间戳仍是旧值

## 修复方案

### 后端修改 (koa2/src/modules/database/service.js)

1. **优化主键查询逻辑**
```javascript
// 修改前
const pkQuery = `
  SELECT column_name 
  FROM information_schema.key_column_usage
  WHERE table_name = $1 
    AND constraint_name LIKE '%pkey%'
  LIMIT 1
`

// 修改后
const pkQuery = `
  SELECT kcu.column_name 
  FROM information_schema.key_column_usage kcu
  JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
  WHERE kcu.table_name = $1 
    AND kcu.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY'
  LIMIT 1
`
```

2. **UPDATE 语句添加 RETURNING 子句和自动更新 updated_at**
```javascript
// 修改前
const query = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause}`

// 修改后 - 自动检测并添加 updated_at 字段
const hasUpdatedAt = await checkColumnExists(tableName, 'updated_at')
let setClauseParts = setFields.map((field, index) => `"${field}" = $${index + 1}`)

if (hasUpdatedAt && !setFields.includes('updated_at')) {
  setClauseParts.push(`"updated_at" = NOW()`)  // 自动更新时间戳
}

const setClause = setClauseParts.join(', ')
const query = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause} RETURNING *`
```

3. **返回更新后的完整数据**
```javascript
return {
  affectedRows: result.rowCount,
  message: `更新成功，影响 ${result.rowCount} 行`,
  updatedRow: result.rows[0] || null, // 新增：返回更新后的数据
}
```

### 前端修改 (src/views/database-management/components/TableDataPanel.vue)

1. **优先使用后端返回的更新数据**
```javascript
if (res.data && res.data.updatedRow) {
  // 直接更新本地数据，无需重新查询
  const index = tableData.value.findIndex(row => row[pk] === primaryValue)
  if (index !== -1) {
    tableData.value[index] = res.data.updatedRow
  }
} else {
  // 降级方案：重新加载数据
  setTimeout(async () => {
    await loadTableData()
  }, 100)
}
```

2. **删除操作添加延迟刷新**
```javascript
// 延迟一小段时间再刷新，确保数据库事务已提交
setTimeout(async () => {
  await loadTableData()
}, 100)
```

## 测试步骤

### 1. 重启后端服务
```bash
cd koa2
pm2 restart all
# 或者
npm run dev
```

### 2. 清除浏览器缓存
- 按 `Ctrl + Shift + Delete` 清除缓存
- 或者使用无痕模式测试

### 3. 测试更新操作
1. 打开数据库管理页面
2. 选择 `chat_sessions` 表
3. 找到一条记录，点击某个字段进行编辑
4. 修改字段值（如 title）
5. 点击"保存"按钮
6. 观察：
   - 控制台应输出：`📊 更新后的数据: {...}`
   - 表格中应立即显示更新后的值
   - 不应有闪烁或短暂显示旧数据的情况

### 4. 验证日志输出
后端日志应显示：
```
📝 执行 SQL: UPDATE "chat_sessions" SET "title" = $1, "updated_at" = NOW() WHERE "id" = $2 RETURNING * [ '新对话11', '3c1a3366-f270-41e9-929b-1fa2bbd0fbda' ]
✅ 更新结果: 1 行受影响
📊 更新后的数据: { id: '...', title: '新对话11', updated_at: '2026-05-02 16:46:xx.xxx', ... }
```

注意：`updated_at` 应该是当前时间，而不是旧时间！

前端控制台应显示：
```
📝 准备更新数据: { table: 'chat_sessions', pk: 'id', primaryValue: '...', updates: {...} }
✅ 更新成功响应: { code: 200, data: { updatedRow: {...} } }
🔄 使用后端返回的更新数据
```

## 预期效果

✅ 更新操作完成后，表格立即显示最新数据  
✅ 无需等待网络请求刷新  
✅ 无数据不一致问题  
✅ 用户体验更流畅  

## 注意事项

1. **RETURNING 子句兼容性**
   - PostgreSQL 完全支持 `RETURNING` 子句
   - MySQL 需要使用其他方式（如 LAST_INSERT_ID）

2. **性能优化**
   - 直接更新本地数据避免了额外的网络请求
   - 减少了数据库查询压力

3. **事务一致性**
   - 100ms 的延迟确保了事务提交完成
   - 对于高并发场景可能需要调整延迟时间

## 如果问题仍然存在

1. 检查 PostgreSQL 的事务隔离级别：
```sql
SHOW default_transaction_isolation;
-- 应该是 read committed
```

2. 检查是否有其他进程在修改同一张表

3. 查看浏览器 Network 面板，确认请求顺序：
   - PUT 请求应先完成
   - GET 请求应在之后发起

4. 尝试增加延迟时间（从 100ms 改为 200ms 或 500ms）

## 相关文件

- 后端服务：`koa2/src/modules/database/service.js`
- 前端组件：`src/views/database-management/components/TableDataPanel.vue`
- API 接口：`src/api/database.js`
- 控制器：`koa2/src/modules/database/controller.js`
