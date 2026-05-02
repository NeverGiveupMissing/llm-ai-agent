# 🧪 API 自动化测试套件

## 📁 目录结构

```
tests/
├── constants.sh          # 公共常量配置（Token、URL等）
├── constants.js          # 公共常量配置（Node.js 版本）
├── run-all-tests.sh      # 主入口脚本（交互式选择）
├── user.test.sh          # 用户管理模块测试
├── role.test.sh          # 角色管理模块测试
├── permission.test.sh    # 权限管理模块测试
├── session.test.sh       # 会话管理模块测试
├── session-group.test.sh # 会话分组管理模块测试
├── operation-log.test.sh # 操作日志模块测试
├── memory.test.sh        # 记忆管理模块测试
├── chat-memory.test.sh   # 聊天记忆模块测试
└── README.md             # 本文档
```

## 🚀 快速开始

### 1. 前置要求

确保已安装 `jq` 工具（用于格式化 JSON 输出）：

```bash
# CentOS/RHEL
yum install jq -y

# Ubuntu/Debian  
apt-get install jq -y

# macOS
brew install jq
```

### 2. 配置 Token

**只需修改一处，所有测试脚本共用！**

编辑 `constants.sh` 文件：

```bash
# 修改这一行
export TOKEN="你的新Token"
```

### 3. 运行测试

#### 方式一：交互式运行（推荐）

```bash
cd tests
bash run-all-tests.sh
```

会出现菜单让您选择要测试的模块。

#### 方式二：直接运行单个模块

```bash
# 测试用户管理
bash user.test.sh

# 测试角色管理
bash role.test.sh

# 测试权限管理
bash permission.test.sh

# 测试会话管理
bash session.test.sh

# 测试会话分组管理
bash session-group.test.sh

# 测试操作日志
bash operation-log.test.sh

# 测试记忆管理
bash memory.test.sh

# 测试聊天记忆
bash chat-memory.test.sh
```

## 📋 测试模块说明

### 用户管理模块 (user.test.sh)

包含 17 个测试用例：
- ✅ 获取当前用户信息
- ✅ 获取用户列表（分页、搜索、状态过滤）
- ✅ 创建新用户
- ✅ 获取用户详情
- ✅ 更新用户信息
- ✅ 启用/禁用用户
- ✅ 分配/移除角色
- ✅ 重置密码
- ✅ 删除用户

### 角色管理模块 (role.test.sh)

包含 11 个测试用例：
- ✅ 获取角色列表（搜索）
- ✅ 获取角色详情
- ✅ 获取角色权限
- ✅ 创建新角色
- ✅ 更新角色
- ✅ 分配/移除权限
- ✅ 批量分配权限
- ✅ 获取角色的用户
- ✅ 删除角色

### 权限管理模块 (permission.test.sh)

包含多个测试用例：
- ✅ 获取菜单树
- ✅ 创建权限
- ✅ 更新权限
- ✅ 删除权限

### 会话管理模块 (session.test.sh)

包含 11 个测试用例：
- ✅ 获取会话列表
- ✅ 创建新会话
- ✅ 获取会话详情（包含消息）
- ✅ 更新会话标题和消息数
- ✅ 置顶/取消置顶会话
- ✅ 获取分享信息
- ✅ 删除会话

### 会话分组管理模块 (session-group.test.sh)

包含 13 个测试用例：
- ✅ 获取所有分组
- ✅ 创建新分组
- ✅ 更新分组名称和图标
- ✅ 置顶/取消置顶分组
- ✅ 移动会话到分组（新旧路由）
- ✅ 删除分组和会话

### 操作日志模块 (operation-log.test.sh)

包含 10 个测试用例：
- ✅ 获取操作日志列表（分页、筛选）
- ✅ 按用户名筛选
- ✅ 按日期范围筛选
- ✅ 按状态筛选
- ✅ 组合筛选
- ✅ 获取统计信息
- ✅ 验证分页功能

### 记忆管理模块 (memory.test.sh)

包含 10 个测试用例：
- ✅ 获取记忆列表
- ✅ 创建新记忆
- ✅ 获取记忆详情
- ✅ 更新记忆内容
- ✅ 获取记忆统计
- ✅ 检索相关记忆
- ✅ 删除记忆

### 聊天记忆模块 (chat-memory.test.sh)

包含 9 个测试用例：
- ✅ 获取聊天记忆
- ✅ 保存聊天记忆
- ✅ 更新聊天记忆
- ✅ 删除聊天记忆
- ✅ 验证数据一致性

## 🔧 自定义配置

所有配置在 `constants.sh` 中统一管理：

```bash
# API 基础 URL
export BASE_URL="http://localhost:65432/koa2api"

# 管理员账号
export ADMIN_USERNAME="admin"
export ADMIN_PASSWORD="admin123"

# JWT Token（统一修改处）
export TOKEN="your-token-here"

# 管理员用户 ID
export ADMIN_USER_ID="your-user-id-here"
```

## 📊 测试输出

每个测试用例会显示：
- 📝 测试编号和接口说明
- ✅ 成功标记
- 📄 JSON 格式的响应数据（通过 jq 格式化）

## 🎯 添加新测试模块

1. 创建新的测试脚本，如 `chat.test.sh`
2. 在文件开头引入常量：
   ```bash
   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
   source "${SCRIPT_DIR}/constants.sh"
   ```
3. 编写测试用例
4. 在 `run-all-tests.sh` 中添加菜单选项

## ⚠️ 注意事项

1. **Token 过期**：Token 有过期时间，过期后需要重新登录获取新 Token
2. **测试数据清理**：部分测试会创建临时数据，测试完成后会自动清理
3. **执行顺序**：某些测试依赖前面的步骤（如创建用户后才能测试更新）
4. **权限要求**：所有接口都需要 admin 权限

## 🐛 故障排查

### 问题：所有接口返回 401 Unauthorized

**原因**：Token 过期或无效

**解决**：重新登录获取新 Token，更新 `constants.sh`

### 问题：JSON 输出未格式化

**原因**：未安装 jq 工具

**解决**：安装 jq（见前置要求）

### 问题：接口返回 404 Not Found

**原因**：API 前缀或路径错误

**解决**：检查 `constants.sh` 中的 `BASE_URL` 是否正确

## 📝 更新日志

- 2026-05-01: 
  - ✅ 新增会话管理模块测试 (session.test.sh)
  - ✅ 新增会话分组管理模块测试 (session-group.test.sh)
  - ✅ 新增操作日志模块测试 (operation-log.test.sh)
  - ✅ 新增记忆管理模块测试 (memory.test.sh)
  - ✅ 新增聊天记忆模块测试 (chat-memory.test.sh)
  - ✅ 更新 run-all-tests.sh 添加新模块选项
  - ✅ 更新 README.md 文档

- 2026-04-30: 初始版本，包含用户管理和角色管理测试

---

**提示**：每次更新 Token 只需修改 `constants.sh` 一处即可！
