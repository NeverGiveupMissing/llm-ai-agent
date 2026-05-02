# 动态路由快速参考

## 🎯 核心概念

**前端不再硬编码业务路由！** 所有路由都从后端数据库的 `permissions` 表动态获取。

## 📁 文件结构

```
src/router/
├── routes.js          # 只定义静态路由和转换函数
├── guard.js           # 路由守卫，动态注册路由
└── index.js           # Vue Router 实例

src/stores/modules/
├── permission.js      # 存储菜单树和权限列表
└── menu.js            # 存储侧边栏菜单配置
```

## 🔄 工作流程

```
用户登录
  ↓
获取菜单树 (GET /permissions/menu-tree)
  ↓
generateRoutesFromMenu(menuTree)
  ↓
router.addRoute() 动态注册
  ↓
用户可以访问页面
```

## 💻 关键代码

### 1. 路由转换函数

```javascript
// src/router/routes.js
export function generateRoutesFromMenu(menuTree) {
  const rootRoute = {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [],
  }

  menuTree.forEach((menu) => {
    const route = {
      path: menu.path.slice(1),
      name: menu.code,
      component: () => import(`@/views/${menu.component}/index.vue`),
      meta: {
        title: menu.name,
        icon: menu.icon,
        permission: menu.code,
      },
    }
    rootRoute.children.push(route)
  })

  return [rootRoute]
}
```

### 2. 路由守卫

```javascript
// src/router/guard.js
router.beforeEach(async (to) => {
  if (!permissionStore.isRoutesGenerated) {
    permissionStore.isRoutesGenerated = true

    await permissionStore.fetchUserPermissions()

    const dynamicRoutes = generateRoutesFromMenu(permissionStore.menuTree)

    dynamicRoutes.forEach((route) => {
      router.addRoute(route)
    })

    return { ...to, replace: true }
  }

  return true
})
```

### 3. Permission Store

```javascript
// src/stores/modules/permission.js
async function fetchUserPermissions() {
  const [menuTreeRes, permissionsRes] = await Promise.all([
    getMenuTree(), // 菜单树
    getMyPermissions(), // 权限列表
  ])

  setMenuTree(menuTreeRes.data)
  setPermissions(permissionsRes.data.map((p) => p.code))
}
```

## 📊 数据库字段映射

| 数据库字段  | 路由字段            | 示例                                        |
| ----------- | ------------------- | ------------------------------------------- |
| `path`      | `route.path`        | `/dashboard`                                |
| `code`      | `route.name`        | `dashboard:view`                            |
| `component` | `route.component`   | `dashboard` → `@/views/dashboard/index.vue` |
| `name`      | `route.meta.title`  | `工作台`                                    |
| `icon`      | `route.meta.icon`   | `dashboard`                                 |
| `hidden`    | `route.meta.hidden` | `false`                                     |

## ➕ 新增菜单步骤

### 第1步：在数据库中添加菜单

```sql
INSERT INTO permissions (name, code, type, path, component, icon, sort_order)
VALUES (
  '新功能',
  'feature:view',
  'menu',
  '/feature',
  'feature',
  'flash',
  20
);
```

### 第2步：创建Vue组件

```bash
mkdir -p src/views/feature
touch src/views/feature/index.vue
```

```vue
<template>
  <div>新功能页面</div>
</template>
```

### 第3步：分配权限给角色

```sql
INSERT INTO role_permissions (role_id, permission_id)
SELECT
  (SELECT id FROM roles WHERE code = 'admin'),
  (SELECT id FROM permissions WHERE code = 'feature:view');
```

### 第4步：刷新页面

✅ 完成！新菜单会自动出现在侧边栏。

## ❌ 不需要做的事

- ❌ 修改 `routes.js` 添加路由配置
- ❌ 修改 `guard.js` 添加路由守卫逻辑
- ❌ 修改 `menu.js` 添加菜单项
- ❌ 重新部署前端代码

## ✅ 只需要做的事

- ✅ 在数据库中添加菜单记录
- ✅ 创建对应的 Vue 组件文件
- ✅ 给角色分配权限

## 🔍 调试技巧

### 查看动态路由

```javascript
// 浏览器控制台
import router from '@/router'
console.log(router.getRoutes())
```

### 查看菜单树

```javascript
// 浏览器控制台
import { usePermissionStore } from '@/stores/modules/permission'
const store = usePermissionStore()
console.log('菜单树:', store.menuTree)
console.log('权限:', store.permissions)
```

### 查看已注册的路由

```javascript
// 浏览器控制台
import router from '@/router'
router.getRoutes().forEach((route) => {
  console.log(route.path, route.name)
})
```

## ⚠️ 常见问题

### Q1: 新增菜单后看不到？

**检查清单**：

1. ✅ 数据库中是否插入了记录？
2. ✅ 是否给角色分配了权限？
3. ✅ Vue组件文件是否存在？
4. ✅ 组件路径是否正确？
5. ✅ 是否刷新了页面？

### Q2: 点击菜单报404？

**原因**：组件文件不存在或路径错误

**解决**：

```javascript
// 确保这个文件存在
src / views / { component } / index.vue
```

### Q3: 如何隐藏菜单但保留路由？

**方法**：设置 `hidden = true`

```sql
UPDATE permissions
SET hidden = true
WHERE code = 'feature:view';
```

### Q4: 如何调整菜单顺序？

**方法**：修改 `sort_order`

```sql
UPDATE permissions
SET sort_order = 5
WHERE code = 'feature:view';
```

## 🎨 图标列表

支持的图标名称（来自 Naive UI）：

```
dashboard, chat, agent, knowledge, memory,
tools, settings, docs, logs, people, shield,
key, flash, person, add, edit, delete, ...
```

完整列表见：https://www.naiveui.com/en-US/os-theme/components/icon

## 📝 权限代码规范

**格式**：`模块:操作`

```
✅ dashboard:view
✅ chat:view
✅ user:create
✅ user:update
✅ user:delete
✅ role:read
✅ permission:manage

❌ view_dashboard
❌ create_user
❌ UserRead
```

## 🚀 性能优化

### 1. 缓存菜单树

```javascript
// Pinia Store 自动缓存
const menuTree = ref([]) // 只在登录时获取一次
```

### 2. 懒加载组件

```javascript
// 路由使用动态导入
component: () => import('@/views/dashboard/index.vue')
```

### 3. 避免重复请求

```javascript
// 路由守卫中检查标志位
if (permissionStore.isRoutesGenerated) {
  return true // 已生成，直接放行
}
```

## 🔗 相关文档

- [完整架构说明](./DYNAMIC_ROUTES_ARCHITECTURE.md)
- [v-permission指令完全指南](./V_PERMISSION_COMPLETE_GUIDE.md)
- [RBAC系统文档](../koa2/docs/rbac-system.md)

---

**记住**：路由配置在后端，前端只负责渲染！🎉
