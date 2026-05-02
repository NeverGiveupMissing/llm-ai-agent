# 用户个人中心完整实现指南

## 📋 概述

本文档描述了用户个人中心页面的完整实现，包括个人信息查看/修改、头像上传、修改密码和退出登录功能。

---

## 🎯 核心功能

### 1. **个人中心** ✅

**支持的功能**：

- ✅ 查看用户信息（用户名、邮箱、头像）
- ✅ 修改昵称
- ✅ 修改邮箱（带格式验证）
- ✅ 修改手机号（带格式验证）
- ✅ 修改个人简介
- ✅ 上传/更换头像

---

### 2. **修改密码** ✅

**功能**：

- ✅ 输入旧密码进行验证
- ✅ 输入新密码（至少6位）
- ✅ 确认新密码
- ✅ 表单验证（两次密码必须一致）
- ✅ 修改成功后自动退出登录

---

### 3. **退出登录** ✅

**功能**：

- ✅ 二次确认对话框
- ✅ 清空 Token
- ✅ 清空所有 Pinia Store
- ✅ 重置动态路由
- ✅ 跳转到登录页面

**实现流程**：

```javascript
// userStore.logout() 完整流程
1. 清空 token（this.token = ''）
2. 移除 localStorage 中的数据
3. 重置用户信息（恢复默认值）
4. 调用 permissionStore.resetPermission() - 清空权限状态
5. 调用 menuStore.resetMenu() - 清空菜单状态
6. 路由跳转到 /login
```

---

## 🏗️ 组件结构

### 文件组织

```
src/views/profile/
├── index.vue (127行)                      # 主页面组件
└── components/
    ├── UserInfoCard.vue (84行)            # 用户信息卡片（头像上传）
    ├── ProfileForm.vue (164行)            # 个人资料表单
    ├── ChangePasswordForm.vue (138行)     # 修改密码表单
    └── LogoutSection.vue (27行)           # 退出登录区域
```

**总行数**：540行（拆分前411行）  
**所有组件都符合 ≤300行 规范** ✅

---

## 📦 组件详解

### 1. **index.vue** - 主页面组件（127行）

**职责**：

- 协调子组件
- 管理数据状态
- 获取用户信息
- 处理退出登录

**Props**：无

**Emits**：无

**依赖的子组件**：

- `UserInfoCard` - 用户信息卡片
- `ProfileForm` - 个人资料表单
- `ChangePasswordForm` - 修改密码表单
- `LogoutSection` - 退出登录区域

**核心代码**：

```vue
<template>
  <n-card title="个人中心">
    <n-space vertical :size="24">
      <!-- 用户信息卡片 -->
      <UserInfoCard
        :avatar="userInfo.avatar"
        :username="userInfo.username"
        :email="userInfo.email"
        @upload-success="handleAvatarUploadSuccess"
      />

      <!-- 个人资料表单 -->
      <ProfileForm
        :user-data="userData"
        @update-success="handleProfileUpdateSuccess"
        @reset="handleResetProfile"
      />

      <!-- 修改密码表单 -->
      <ChangePasswordForm @password-changed="handlePasswordChanged" />

      <!-- 退出登录 -->
      <LogoutSection @logout="handleLogout" />
    </n-space>
  </n-card>
</template>

<script setup>
import { useUserStore } from '@/stores/modules/user'
import { getCurrentUser } from '@/api/auth'

const userStore = useUserStore()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()

// 获取用户信息
const fetchUserInfo = async () => {
  const res = await getCurrentUser()
  if (res.code === 200) {
    userStore.setUserInfo(res.data)
    userData.value = res.data
  }
}

// 退出登录
const handleLogout = () => {
  dialog.warning({
    title: '确认退出',
    content: '确定要退出登录吗？',
    onPositiveClick: () => {
      userStore.logout()
      router.push('/login')
      message.success('已退出登录')
    },
  })
}

onMounted(() => {
  fetchUserInfo()
})
</script>
```

---

### 2. **UserInfoCard.vue** - 用户信息卡片（84行）

**职责**：

- 显示用户头像、用户名、邮箱
- 处理头像上传

**Props**：

```javascript
{
  avatar: String,      // 头像URL
  username: String,    // 用户名
  email: String,       // 邮箱
}
```

**Emits**：

```javascript
;['upload-success'] // 参数：新头像URL
```

**关键功能**：

- ✅ 80px大头像展示
- ✅ 点击头像上传新头像
- ✅ 支持JPG/PNG/GIF/WEBP格式
- ✅ 最大5MB文件大小

---

### 3. **ProfileForm.vue** - 个人资料表单（164行）

**职责**：

- 显示和编辑个人资料
- 表单验证
- 数据提交

**Props**：

```javascript
{
  userData: Object,  // 用户详细数据
}
```

**Emits**：

```javascript
;['update-success', 'reset'] // 更新成功、重置
```

**表单字段**：

- **用户名**（禁用，不可修改）
- **邮箱**（必填，邮箱格式验证）
- **昵称**（可选）
- **手机号**（可选，手机号格式验证）
- **个人简介**（可选，最多200字，带字数统计）

**验证规则**：

```javascript
const formRules = {
  email: {
    type: 'email',
    message: '请输入有效的邮箱地址',
    trigger: ['blur', 'input'],
  },
  phone: {
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入有效的手机号',
    trigger: ['blur', 'input'],
  },
}
```

---

### 4. **ChangePasswordForm.vue** - 修改密码表单（138行）

**职责**：

- 显示修改密码表单
- 密码验证（旧密码、新密码、确认密码）
- 密码修改

**Props**：无

**Emits**：

```javascript
;['password-changed'] // 密码修改成功
```

**表单字段**：

- **旧密码**（必填）
- **新密码**（必填，至少6位）
- **确认密码**（必填，必须与新密码一致）

**验证规则**：

```javascript
const validateConfirmPassword = (rule, value) => {
  if (!value) return new Error('请再次输入新密码')
  if (value !== formData.newPassword) {
    return new Error('两次输入的密码不一致')
  }
  return true
}

const formRules = {
  oldPassword: { required: true, message: '请输入旧密码' },
  newPassword: { required: true, min: 6, message: '密码长度不能少于6位' },
  confirmPassword: { required: true, validator: validateConfirmPassword },
}
```

---

### 5. **LogoutSection.vue** - 退出登录区域（27行）

**职责**：

- 显示退出登录按钮
- 触发退出登录事件

**Props**：无

**Emits**：

```javascript
;['logout'] // 退出登录
```

---

## 🔄 数据流向

### 完整流程图

```
用户进入个人中心
  ↓
onMounted → fetchUserInfo()
  ↓
调用 GET /nodeapi/users/me
  ↓
获取用户完整信息
  ↓
userStore.setUserInfo(data) 更新 Store
  ↓
Props 下发给各子组件
  ↓
├─→ UserInfoCard - 显示头像、用户名、邮箱
├─→ ProfileForm - 显示个人资料表单
├─→ ChangePasswordForm - 显示密码修改表单
└─→ LogoutSection - 显示退出登录按钮
```

### 头像上传流程

```
用户点击头像
  ↓
选择图片文件
  ↓
触发 n-upload
  ↓
handleUploadAvatar()
  ↓
创建 FormData
  ↓
POST /nodeapi/users/me/avatar
  ↓
后端验证 → 保存 → 删除旧头像
  ↓
emit('upload-success', newAvatarUrl)
  ↓
index.vue 接收事件
  ↓
userStore.setUserInfo({ avatar: newUrl })
  ↓
头像更新
```

### 密码修改流程

```
用户填写修改密码表单
  ↓
点击"修改密码"
  ↓
前端表单验证
  ↓
POST /nodeapi/users/me/change-password
  ↓
后端验证旧密码
  ↓
encrypt 新密码
  ↓
UPDATE 数据库
  ↓
emit('password-changed')
  ↓
index.vue 显示提示
  ↓
延迟 1.5 秒
  ↓
自动调用 handleLogout()
  ↓
清空所有状态 → 跳转 /login
```

---

## 🛠️ 后端API接口

### 1. 获取当前用户信息

**接口**：`GET /nodeapi/users/me`

**权限要求**：已登录（Bearer Token）

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "管理员",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "个人简介",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. 更新用户信息

**接口**：`PUT /nodeapi/users/me`

**权限要求**：已登录（Bearer Token）

**请求参数**：

```json
{
  "email": "newemail@example.com",
  "nickname": "新昵称",
  "phone": "13900139000",
  "bio": "新的个人简介"
}
```

**注意**：

- ✅ 可修改：email, nickname, phone, bio
- ❌ 不可修改：username, password, avatar（用专用接口）

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "username": "admin",
    "email": "newemail@example.com",
    "nickname": "新昵称",
    "phone": "13900139000",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "新的个人简介"
  }
}
```

---

### 3. 修改密码

**接口**：`POST /nodeapi/users/me/change-password`

**权限要求**：已登录（Bearer Token）

**请求参数**：

```json
{
  "oldPassword": "old_password",
  "newPassword": "new_password_min_6_chars"
}
```

**响应示例**：

```json
{
  "code": 200,
  "message": "密码修改成功"
}
```

**错误情况**：

```json
{
  "code": 400,
  "message": "旧密码不正确"
}
```

---

### 4. 上传头像

**接口**：`POST /nodeapi/users/me/avatar`

**权限要求**：已登录（Bearer Token）

**请求格式**：multipart/form-data

**请求参数**：

```
avatar: File (图片文件)
```

**支持的格式**：JPG、PNG、GIF、WEBP

**文件大小限制**：5MB

**响应示例**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "avatar": "https://example.com/uploads/avatars/avatar_uuid_timestamp.jpg"
  }
}
```

**错误情况**：

```json
{
  "code": 400,
  "message": "只支持 JPG、PNG、GIF、WEBP 格式的图片"
}
```

```json
{
  "code": 400,
  "message": "图片大小不能超过 5MB"
}
```

---

## 📊 数据库表结构

### users 表扩展字段

```sql
-- 已有字段
id UUID PRIMARY KEY
username VARCHAR(100)
email VARCHAR(100)
password_hash VARCHAR(255)
avatar_url VARCHAR(255)
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ

-- 新增字段
nickname VARCHAR(64)       -- 用户昵称
phone VARCHAR(20)          -- 手机号
bio TEXT                   -- 个人简介
```

---

## 🔒 安全特性

### 1. 文件上传安全

- ✅ **文件类型白名单**：JPG/PNG/GIF/WEBP
- ✅ **文件大小限制**：最大5MB
- ✅ **唯一文件名**：avatar*{userId}*{timestamp}.{ext}
- ✅ **旧文件自动清理**：上传新头像时删除旧头像
- ✅ **隔离存储**：专用目录 uploads/avatars/

### 2. 密码安全

- ✅ **旧密码验证**：必须输入正确的旧密码才能修改
- ✅ **密码长度验证**：至少6位
- ✅ **bcrypt加密**：使用bcrypt对密码进行加密
- ✅ **自动退出**：修改密码后自动退出登录

### 3. 数据验证

- ✅ **邮箱验证**：RFC标准邮箱格式
- ✅ **手机号验证**：中国大陆手机号格式
- ✅ **长度限制**：个人简介最多200字
- ✅ **SQL防护**：参数化查询，防止SQL注入

### 4. 权限控制

- ✅ **身份认证**：所有接口需要JWT Token
- ✅ **数据隔离**：只能修改自己的信息
- ✅ **字段权限**：某些字段（username）不可修改

---

## ✅ 权限控制覆盖情况

### 个人中心页面权限

| 功能         | 权限编码 | 说明                     |
| ------------ | -------- | ------------------------ |
| 查看个人信息 | -        | 已登录即可               |
| 修改个人资料 | -        | 已登录即可，只能改自己   |
| 修改密码     | -        | 已登录即可，需验证旧密码 |
| 退出登录     | -        | 已登录即可               |

**特点**：

- ✅ 个人中心功能不需要额外权限
- ✅ 用户只能修改自己的信息
- ✅ 后端验证用户ID确保数据安全

---

## 🧪 完整测试场景

### 测试1：查看个人资料

```bash
操作步骤：
1. 登录系统
2. 进入个人中心
3. 检查是否显示：
   - 头像
   - 用户名
   - 邮箱
   - 昵称
   - 手机号
   - 个人简介

预期结果：
✅ 所有信息正常显示
```

### 测试2：修改个人资料

```bash
操作步骤：
1. 进入个人中心
2. 修改以下字段：
   - 邮箱：test@example.com
   - 昵称：测试用户
   - 手机号：13800138000
   - 个人简介：这是测试简介
3. 点击"保存修改"

预期结果：
✅ 提示"资料修改成功"
✅ 数据已保存
✅ 刷新页面后数据仍然存在
```

### 测试3：上传头像

```bash
操作步骤：
1. 进入个人中心
2. 点击头像
3. 选择JPG/PNG图片
4. 等待上传完成

预期结果：
✅ 提示"头像上传成功"
✅ 头像已更新
✅ uploads/avatars/ 目录下有新文件
✅ 旧头像文件已删除
```

### 测试4：修改密码

```bash
操作步骤：
1. 进入个人中心
2. 滚动到"修改密码"
3. 输入：
   - 旧密码：正确的密码
   - 新密码：newpass123
   - 确认密码：newpass123
4. 点击"修改密码"

预期结果：
✅ 提示"密码修改成功，请重新登录"
✅ 1.5秒后自动退出
✅ 跳转到登录页
✅ 使用新密码可以重新登录
```

### 测试5：退出登录

```bash
操作步骤：
1. 进入个人中心
2. 点击"退出登录"
3. 确认对话框中点击"确定"

预期结果：
✅ 提示"已退出登录"
✅ Token已清空
✅ 所有Store已重置
✅ 跳转到登录页
```

### 测试6：表单验证

```bash
操作步骤：
1. 进入个人中心
2. 在邮箱字段输入无效邮箱：abc
3. 在手机号字段输入无效手机号：123
4. 点击"保存修改"

预期结果：
✅ 提示"请输入有效的邮箱地址"
✅ 提示"请输入有效的手机号"
✅ 表单无法提交
```

### 测试7：错误密码修改

```bash
操作步骤：
1. 进入个人中心
2. 在修改密码表单输入：
   - 旧密码：错误的密码
   - 新密码：newpass123
   - 确认密码：newpass123
3. 点击"修改密码"

预期结果：
✅ 提示"旧密码不正确"
✅ 密码未修改
✅ 保持在个人中心页面
```

---

## ⚠️ 注意事项

### 1. 退出登录顺序

```javascript
// ✅ 正确
userStore.logout() // 先清空状态
router.push('/login') // 再跳转

// ❌ 错误（会被路由守卫拦截）
router.push('/login')
userStore.logout()
```

### 2. 密码修改后自动退出

```javascript
// 延迟退出，让用户看到提示
if (res.code === 200) {
  message.success('密码修改成功，请重新登录')
  setTimeout(() => {
    userStore.logout()
    router.push('/login')
  }, 1500)
}
```

### 3. 权限数据加载时机

```javascript
// 确保权限已加载
onMounted(async () => {
  await permissionStore.fetchUserPermissions()
  // 再加载个人中心数据
  await fetchUserInfo()
})
```

### 4. 文件上传错误处理

```javascript
// 处理各种上传错误
const handleUploadAvatar = async ({ file, onFinish, onError }) => {
  try {
    // 客户端验证
    if (file.file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过 5MB')
      onError()
      return
    }

    // 发送请求
    const res = await uploadAvatar(formData)

    if (res.code === 200) {
      onFinish()
    } else {
      message.error(res.message)
      onError()
    }
  } catch (error) {
    message.error('头像上传失败')
    onError()
  }
}
```

---

## 📁 文件目录结构

### 前端文件

```
src/
├── api/
│   ├── auth.js
│   │   ├── getCurrentUser()
│   │   ├── updateUserInfo()
│   │   └── changePassword()
│   └── user.js
│       └── uploadAvatar()
├── views/
│   └── profile/
│       ├── index.vue (127行)
│       └── components/
│           ├── UserInfoCard.vue (84行)
│           ├── ProfileForm.vue (164行)
│           ├── ChangePasswordForm.vue (138行)
│           └── LogoutSection.vue (27行)
└── stores/
    └── modules/
        └── user.js
            ├── logout()
            └── setUserInfo()
```

### 后端文件

```
koa2/
├── src/
│   ├── app.js
│   │   └── koa-body 中间件配置
│   ├── modules/
│   │   └── user/
│   │       ├── routes.js
│   │       │   ├── GET /users/me
│   │       │   ├── PUT /users/me
│   │       │   ├── POST /users/me/change-password
│   │       │   └── POST /users/me/avatar
│   │       └── controller.js
│   ├── services/
│   │   └── userService.js
│   │       └── uploadAvatar()
│   ├── models/
│   │   └── userModel.js
│   └── config/
│       └── init-db.js
└── uploads/
    └── avatars/
        └── avatar_uuid_timestamp.{jpg|png|gif|webp}
```

---

## 🚀 部署建议

### 1. 环境变量配置

```env
# .env
VITE_API_BASE_URL=http://localhost:3000/nodeapi
VITE_UPLOAD_URL=http://localhost:3000/uploads

# .env.production
VITE_API_BASE_URL=https://api.example.com/nodeapi
VITE_UPLOAD_URL=https://api.example.com/uploads
```

### 2. 后端配置

```javascript
// koa2/src/app.js
// 配置上传目录权限
const uploadsDir = path.join(process.cwd(), 'uploads')
app.use(serve(uploadsDir, { maxAge: 1000 * 60 * 60 * 24 * 7 }))

// 配置CORS
app.use(
  cors({
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)
```

### 3. Nginx反向代理

```nginx
location /uploads {
  alias /var/www/uploads;
  expires 7d;
  add_header Cache-Control "public, max-age=604800";
}

location /api {
  proxy_pass http://localhost:3000;
  proxy_set_header Authorization $http_authorization;
  client_max_body_size 10M;
}
```

---

## 📚 相关文档

- [用户管理 API 接口文档](USER_MANAGEMENT_API.md)
- [前端权限Store文档](FRONTEND_PERMISSION_STORE.md)
- [动态路由和路由守卫文档](DYNAMIC_ROUTES_IMPLEMENTATION.md)
- [v-permission 指令完全指南](V_PERMISSION_COMPLETE_GUIDE.md)

---

## 🎉 总结

✅ **完整的功能实现**：

- 个人资料查看和修改
- 头像上传和替换
- 密码修改（需验证旧密码）
- 退出登录（自动清空所有状态）

✅ **高质量的代码**：

- 组件拆分清晰（5个组件，最大164行）
- 表单验证完善
- 错误处理到位

✅ **完善的安全性**：

- 身份认证（JWT Token）
- 文件上传验证
- 数据隐私保护
- SQL注入防护

✅ **优秀的用户体验**：

- 清晰的页面布局
- 友好的提示信息
- 实时反馈
- 自动退出登录

**所有功能已经可以直接使用！** 🚀
