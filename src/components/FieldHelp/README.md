# FieldHelp 字段提示组件

## 📦 组件说明

`FieldHelp` 是一个高可用的字段提示组件，基于 Naive UI 的 `n-tooltip` 封装，提供统一的视觉风格和交互体验。

##  特性

- 🎨 **优雅的 UI**：中性灰度图标，悬停时平滑过渡
- 🔧 **高度可配置**：支持位置、触发方式、内容自定义
-  **无障碍**：符合 WCAG 标准，支持键盘导航
- 📱 **响应式**：适配不同屏幕尺寸
- 🎯 **智能显示**：无内容时自动隐藏

## 🚀 快速开始

### 基础用法

```vue
<template>
  <n-form-item label="字段名称">
    <n-input v-model:value="value" />
    <field-help content="这是提示信息" />
  </n-form-item>
</template>
```

### 完整示例

```vue
<template>
  <field-help
    content="选择是外链则路由地址需要以 http(s):// 开头"
    placement="top"
    trigger="hover"
  />
</template>
```

##  API

### Props

| 参数 | 说明 | 类型 | 默认值 | 可选值 |
|------|------|------|--------|--------|
| content | 提示内容 | `string` | `''` | - |
| placement | 弹出位置 | `string` | `'top'` | `top`, `bottom`, `left`, `right`, `top-start`, `top-end`, `bottom-start`, `bottom-end`, `left-start`, `left-end`, `right-start`, `right-end` |
| trigger | 触发方式 | `string` | `'hover'` | `hover`, `click`, `focus`, `manual` |

### 主题样式

组件内置了柔和的样式覆盖：

```javascript
{
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#fff',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
}
```

## 💡 使用场景

### 1. 表单字段提示

```vue
<template #field-is_frame>
  <div style="display: flex; align-items: center; gap: 8px">
    <n-radio-group v-model:value="formData.is_frame">
      <n-radio value="0">否</n-radio>
      <n-radio value="1">是</n-radio>
    </n-radio-group>
    <field-help content="选择是外链则路由地址需要以 http(s):// 开头" />
  </div>
</template>
```

### 2. 条件显示

```vue
<field-help
  v-if="showHelp"
  content="此字段仅在特定条件下可用"
/>
```

### 3. 动态内容

```vue
<field-help
  :content="dynamicHelpText"
/>

<script setup>
const dynamicHelpText = computed(() => {
  return formData.is_disabled 
    ? '此字段已被禁用' 
    : '请输入有效的值'
})
</script>
```

## 🎨 样式定制

### 全局样式覆盖

```css
/* 自定义图标颜色 */
.field-help-icon {
  color: var(--your-custom-color);
}

.field-help-icon:hover {
  color: var(--your-hover-color);
}
```

### 尺寸调整

```vue
<field-help 
  content="提示内容"
  style="font-size: 20px"
/>
```

##  最佳实践

### ✅ 推荐做法

1. **简洁明了**：提示内容保持在 20 字以内
2. **上下文相关**：提示内容应与字段直接相关
3. **使用下划线命名**：字段引用使用 `is_frame` 而非 `isFrame`
4. **条件显示**：只在必要时显示提示

```vue
<!-- ✅ 好的示例 -->
<field-help content="is_frame 为 1 时表示外链" />

<!--  不推荐的示例 -->
<field-help content="这个字段控制是否是一个外部链接，如果是的话需要填写完整的 URL" />
```

### 🚫 避免做法

1. **过长文本**：超过 50 字的提示
2. **技术术语**：用户不理解的术语
3. **重复提示**：与标签或其他提示重复的内容

## 🔧 故障排查

### 提示不显示

- 检查 `content` 是否为空字符串
- 确认组件是否正确导入
- 检查是否有 CSS 冲突

### 位置不正确

- 尝试调整 `placement` 参数
- 检查父容器的 `overflow` 属性

### 样式异常

- 检查是否有全局样式覆盖
- 确认 Naive UI 主题是否正确配置

## 📦 组件路径

```
src/components/FieldHelp/index.vue
```

## 🔄 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0.0 | 2026-05-06 | 初始版本，支持基础提示功能 |

##  贡献

如需改进或添加功能，请提交 Issue 或 Pull Request。
