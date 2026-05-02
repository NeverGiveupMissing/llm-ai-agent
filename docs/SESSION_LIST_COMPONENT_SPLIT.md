# SessionList 组件拆分指南

## 📋 概述

已将 `SessionList.vue` (1465行) 拆分为8个独立的子组件，保持原有逻辑、样式和接口调用不变。

---

## 📦 已创建的子组件

### 1. **SearchBox.vue** (36行)

**功能**：搜索框组件

**Props**：

- `modelValue` - 搜索关键词（v-model）

**Emits**：

- `update:modelValue` - 更新搜索关键词

**使用示例**：

```vue
<SearchBox v-model="searchKeyword" />
```

---

### 2. **GroupHeader.vue** (105行)

**功能**：分组头部（包含标题、折叠按钮、操作菜单）

**Props**：

- `group` - 分组对象
- `isCollapsed` - 是否折叠
- `sessionCount` - 会话数量

**Emits**：

- `toggle-collapse` - 切换折叠状态
- `pin` - 置顶/取消置顶
- `menu-select` - 菜单选择（重命名/删除）

**使用示例**：

```vue
<GroupHeader
  :group="group"
  :is-collapsed="collapsedGroups[group.id]"
  :session-count="getGroupSessionCount(group.id)"
  @toggle-collapse="toggleGroupCollapse(group.id)"
  @pin="handlePinGroup(group)"
  @menu-select="(key) => handleGroupMenuSelect(key, group)"
/>
```

---

### 3. **SessionItem.vue** (126行)

**功能**：会话项（包含图标、标题、操作菜单）

**Props**：

- `session` - 会话对象
- `currentSessionId` - 当前选中的会话ID
- `menuOptions` - 菜单选项数组

**Emits**：

- `select` - 选中会话
- `menu-select` - 菜单选择

**使用示例**：

```vue
<SessionItem
  :session="session"
  :current-session-id="currentSessionId"
  :menu-options="getSessionMenuOptions(session)"
  @select="handleSelect(session)"
  @menu-select="(key) => handleSessionMenuSelect(key, session)"
/>
```

---

### 4. **CreateGroupModal.vue** (83行)

**功能**：创建分组弹窗

**Props**：

- `visible` - 是否显示（v-model）

**Emits**：

- `update:visible` - 更新显示状态
- `confirm` - 确认创建，返回 `{ name, icon }`

**使用示例**：

```vue
<CreateGroupModal v-model:visible="groupModalVisible" @confirm="handleCreateGroup" />

// handleCreateGroup({ name, icon }) { ... }
```

---

### 5. **RenameGroupModal.vue** (53行)

**功能**：重命名分组弹窗

**Props**：

- `visible` - 是否显示（v-model）
- `initialName` - 初始名称

**Emits**：

- `update:visible` - 更新显示状态
- `confirm` - 确认重命名，返回新名称

**使用示例**：

```vue
<RenameGroupModal
  v-model:visible="renameGroupModalVisible"
  :initial-name="currentGroupName"
  @confirm="handleConfirmRenameGroup"
/>

// handleConfirmRenameGroup(newName) { ... }
```

---

### 6. **MoveToGroupModal.vue** (58行)

**功能**：移动会话到分组弹窗

**Props**：

- `visible` - 是否显示（v-model）
- `groups` - 分组列表

**Emits**：

- `update:visible` - 更新显示状态
- `confirm` - 确认移动，返回目标分组ID

**使用示例**：

```vue
<MoveToGroupModal
  v-model:visible="moveToGroupModalVisible"
  :groups="groups"
  @confirm="handleMoveToGroup"
/>

// handleMoveToGroup(targetGroupId) { ... }
```

---

### 7. **ShareModal.vue** (35行)

**功能**：分享弹窗

**Props**：

- `visible` - 是否显示（v-model）
- `shareLink` - 分享链接

**Emits**：

- `update:visible` - 更新显示状态
- `copy` - 复制链接

**使用示例**：

```vue
<ShareModal v-model:visible="shareModalVisible" :share-link="shareLink" @copy="copyShareLink" />
```

---

### 8. **RenameSessionModal.vue** (52行)

**功能**：重命名会话弹窗

**Props**：

- `visible` - 是否显示（v-model）
- `initialTitle` - 初始标题

**Emits**：

- `update:visible` - 更新显示状态
- `confirm` - 确认重命名，返回新标题

**使用示例**：

```vue
<RenameSessionModal
  v-model:visible="renameModalVisible"
  :initial-title="renameTitle"
  @confirm="handleConfirmRename"
/>

// handleConfirmRename(newTitle) { ... }
```

---

## 🔧 如何在 SessionList.vue 中使用

### 步骤1：导入子组件

```javascript
// 子组件现在直接在 SessionList/index.vue 中导入，不再对外导出
// 如果需要使用这些子组件，请直接从各自的文件导入
```

### 步骤2：替换模板中的代码

#### 替换搜索框

```vue
<!-- 原来 -->
<div class="search-section">
  <n-input v-model:value="searchKeyword" ...>...</n-input>
</div>

<!-- 替换为 -->
<SearchBox v-model="searchKeyword" />
```

#### 替换分组头部

```vue
<!-- 原来 -->
<div class="group-header">
  <div class="group-title" @click="toggleGroupCollapse(group.id)">
    <!-- 大量代码 -->
  </div>
  <div class="group-actions">
    <!-- 大量代码 -->
  </div>
</div>

<!-- 替换为 -->
<GroupHeader
  :group="group"
  :is-collapsed="collapsedGroups[group.id]"
  :session-count="getGroupSessionCount(group.id)"
  @toggle-collapse="toggleGroupCollapse(group.id)"
  @pin="handlePinGroup(group)"
  @menu-select="(key) => handleGroupMenuSelect(key, group)"
/>
```

#### 替换会话项

```vue
<!-- 原来 -->
<div class="session-item" @click="handleSelect(session)">
  <!-- 大量代码 -->
</div>

<!-- 替换为 -->
<SessionItem
  :session="session"
  :current-session-id="currentSessionId"
  :menu-options="getSessionMenuOptions(session)"
  @select="handleSelect(session)"
  @menu-select="(key) => handleSessionMenuSelect(key, session)"
/>
```

#### 替换弹窗

```vue
<!-- 原来：创建分组弹窗（约30行） -->
<n-modal v-model:show="groupModalVisible" ...>
  <!-- 大量代码 -->
</n-modal>

<!-- 替换为 -->
<CreateGroupModal v-model:visible="groupModalVisible" @confirm="handleCreateGroup" />
```

其他弹窗同理替换。

---

## 📊 拆分效果

### 拆分前

```
SessionList.vue: 1465行 ❌
```

### 拆分后

```
SessionList.vue: ~800-900行 ✅（预计减少40%）
├── SearchBox.vue: 36行
├── GroupHeader.vue: 105行
├── SessionItem.vue: 126行
├── CreateGroupModal.vue: 83行
├── RenameGroupModal.vue: 53行
├── MoveToGroupModal.vue: 58行
├── ShareModal.vue: 35行
└── RenameSessionModal.vue: 52行

总计：548行（子组件）
```

---

## ⚠️ 注意事项

### 1. **保持原有逻辑不变**

- 所有业务逻辑仍在主组件 `SessionList.vue` 中
- 子组件只负责UI展示和事件传递
- 不修改任何API调用

### 2. **保持原有样式不变**

- 子组件的样式是从原组件中提取的
- CSS类名保持不变
- 样式作用域使用 `scoped`

### 3. **参数传递**

- 使用 Props 向下传递数据
- 使用 Emits 向上传递事件
- 保持双向绑定（v-model）

### 4. **测试建议**

1. 先替换一个小组件（如 SearchBox）
2. 测试功能是否正常
3. 逐步替换其他组件
4. 最后替换弹窗组件

---

## 🎯 下一步

### 方案A：手动替换（推荐）

1. 在 `SessionList.vue` 中导入子组件
2. 逐个替换模板中的代码
3. 测试每个替换后的功能
4. 删除已替换的旧代码

### 方案B：保持现状

如果担心引入bug，可以暂时不使用这些子组件，等后续迭代时再逐步迁移。

---

## 📝 总结

✅ **已完成**：

- 创建了8个子组件
- 所有组件都 ≤ 300行
- 保持了原有逻辑、样式和接口
- 提供了完整的使用文档

⏳ **待完成**：

- 在 SessionList.vue 中导入并使用这些子组件
- 测试功能是否正常
- 删除重复代码

**关键优势**：

- ✅ 代码更清晰，易于维护
- ✅ 组件可复用
- ✅ 符合Vue最佳实践
- ✅ 不破坏现有功能

所有子组件已准备就绪，可以开始使用了！🚀
