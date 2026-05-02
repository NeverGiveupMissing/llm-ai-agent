# 数据库初始化模块说明

## 目录结构

```
config/
├── constants.js              # 常量配置
├── db.js                     # 数据库连接池
├── index.js                  # 配置聚合中心
├── swagger.js                # Swagger 配置
└── sql/                      # SQL 执行模块目录
    ├── README.md
    ├── init-db.js                    # 主入口文件，协调所有初始化流程
    ├── init-memories-table.js        # 初始化 memories 表
    ├── init-chat-sessions-table.js   # 初始化 chat_sessions 表及相关字段
    ├── init-chat-memories-table.js   # 初始化 chat_memories 表
    ├── init-chat-messages-table.js   # 初始化 chat_messages 表
    ├── init-session-groups-table.js  # 初始化 session_groups 表
    ├── init-rbac-tables.js           # 初始化 RBAC 权限系统所有表
    └── init-default-data.js          # 初始化默认数据（角色、权限、管理员）
```

## 模块职责

### init-db.js（主入口）
- 启用 vector 扩展
- 按顺序调用各个初始化模块
- 错误处理和日志输出

### SQL 初始化模块
每个模块负责特定表或功能组的初始化：

1. **init-memories-table.js**: 记忆表及索引
2. **init-chat-sessions-table.js**: 会话表、索引及动态字段检查
3. **init-chat-memories-table.js**: 对话记忆关联表
4. **init-chat-messages-table.js**: 消息表及索引
5. **init-session-groups-table.js**: 会话分组表及索引
6. **init-rbac-tables.js**: RBAC 系统所有表（users, roles, permissions, user_roles, role_permissions）
7. **init-default-data.js**: 初始数据插入（角色、权限、管理员用户）

## 优势

1. **模块化**: 每个表或功能组独立管理
2. **可维护性**: 修改特定表的逻辑只需编辑对应文件
3. **可读性**: 主入口文件简洁清晰
4. **可测试性**: 可以单独测试某个表的初始化逻辑
5. **符合规范**: 遵循大型文件模块化拆分规范

## 使用方法

```bash
# 通过 npm script 运行
npm run db:init

# 或直接运行
node src/config/sql/init-db.js
```
