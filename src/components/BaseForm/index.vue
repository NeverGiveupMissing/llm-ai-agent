<template>
  <n-form
    ref="formRef"
    :model="modelValue"
    :rules="mergedRules"
    :label-width="labelWidth"
    :label-placement="labelPlacement"
    :disabled="disabled"
    :size="size"
    :inline="inline"
    :show-feedback="showFeedback"
  >
    <!-- inline 模式：使用 n-flex -->
    <template v-if="inline">
      <n-flex :wrap="true" :size="8">
        <n-form-item
          v-for="field in visibleFields"
          :key="field.key"
          :label="field.label"
          :path="field.key"
          :style="{ width: field.width || 'auto', minWidth: '180px' }"
        >
          <!-- radio -->
          <n-radio-group
            v-if="field.type === 'radio'"
            v-model:value="modelValue[field.key]"
            :disabled="getDisabled(field)"
          >
            <n-space>
              <n-radio v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </n-radio>
            </n-space>
          </n-radio-group>

          <!-- checkbox -->
          <n-checkbox-group
            v-else-if="field.type === 'checkbox'"
            v-model:value="modelValue[field.key]"
            :disabled="getDisabled(field)"
          >
            <n-space>
              <n-checkbox v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </n-checkbox>
            </n-space>
          </n-checkbox-group>

          <!-- switch with slots -->
          <n-switch
            v-else-if="field.type === 'switch'"
            v-model:value="modelValue[field.key]"
            :checked-value="field.checkedValue"
            :unchecked-value="field.uncheckedValue"
            :disabled="getDisabled(field)"
          >
            <template #checked>{{ field.checkedText }}</template>
            <template #unchecked>{{ field.uncheckedText }}</template>
          </n-switch>

          <!-- custom slot -->
          <slot
            v-else-if="field.type === 'custom'"
            :name="`field-${field.key}`"
            :field="field"
            :form-data="modelValue"
          />

          <!-- 其他类型使用动态组件 -->
          <component
            v-else
            :is="getComponent(field.type)"
            v-model:value="modelValue[field.key]"
            v-bind="getFieldProps(field)"
          />
        </n-form-item>

        <!-- 按钮区域插槽 -->
        <slot name="actions" />
      </n-flex>
    </template>

    <!-- 网格模式：使用 n-grid -->
    <template v-else>
      <n-grid :cols="cols" :x-gap="12" :y-gap="0">
        <n-form-item-gi
          v-for="field in visibleFields"
          :key="field.key"
          :span="field.span || 1"
          :label="field.label"
          :path="field.key"
        >
          <!-- radio -->
          <n-radio-group
            v-if="field.type === 'radio'"
            v-model:value="modelValue[field.key]"
            :disabled="getDisabled(field)"
          >
            <n-space>
              <n-radio v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </n-radio>
            </n-space>
          </n-radio-group>

          <!-- checkbox -->
          <n-checkbox-group
            v-else-if="field.type === 'checkbox'"
            v-model:value="modelValue[field.key]"
            :disabled="getDisabled(field)"
          >
            <n-space>
              <n-checkbox v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </n-checkbox>
            </n-space>
          </n-checkbox-group>

          <!-- switch with slots -->
          <n-switch
            v-else-if="field.type === 'switch'"
            v-model:value="modelValue[field.key]"
            :checked-value="field.checkedValue"
            :unchecked-value="field.uncheckedValue"
            :disabled="getDisabled(field)"
          >
            <template #checked>{{ field.checkedText }}</template>
            <template #unchecked>{{ field.uncheckedText }}</template>
          </n-switch>

          <!-- custom slot -->
          <slot
            v-else-if="field.type === 'custom'"
            :name="`field-${field.key}`"
            :field="field"
            :form-data="modelValue"
          />

          <!-- 其他类型使用动态组件 -->
          <component
            v-else
            :is="getComponent(field.type)"
            v-model:value="modelValue[field.key]"
            v-bind="getFieldProps(field)"
          />
        </n-form-item-gi>

        <!-- 按钮区域插槽（占据整行） -->
        <n-form-item-gi v-if="$slots.actions" :span="cols">
          <slot name="actions" />
        </n-form-item-gi>
      </n-grid>
    </template>
  </n-form>
</template>

<script setup>
import { ref, computed, h } from 'vue'
import {
  NInput,
  NInputNumber,
  NSelect,
  NRadioGroup,
  NRadio,
  NSpace,
  NCheckboxGroup,
  NCheckbox,
  NSwitch,
  NDatePicker,
  NTreeSelect,
} from 'naive-ui'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  rules: { type: Object, default: () => ({}) },
  labelWidth: { type: String, default: '80px' },
  labelPlacement: { type: String, default: 'left' },
  cols: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'medium' },
  inline: { type: Boolean, default: false },
  showFeedback: { type: Boolean, default: true },
})

// 过滤隐藏字段
const visibleFields = computed(() => {
  return props.fields.filter((field) => {
    if (typeof field.hidden === 'function') {
      return !field.hidden(props.modelValue)
    }
    return !field.hidden
  })
})

// 获取禁用状态
const getDisabled = (field) => {
  if (props.disabled) return true
  if (typeof field.disabled === 'function') {
    return field.disabled(props.modelValue)
  }
  return !!field.disabled
}

// 自动生成必填规则
const mergedRules = computed(() => {
  const rules = { ...props.rules }
  props.fields.forEach((field) => {
    if (field.required && !rules[field.key]) {
      rules[field.key] = {
        required: true,
        message: `请${
          ['select', 'radio', 'checkbox', 'tree-select'].includes(field.type) ? '选择' : '输入'
        }${field.label}`,
        trigger: ['select', 'radio', 'checkbox'].includes(field.type) ? 'change' : 'blur',
      }
    }
    if (field.rules) {
      rules[field.key] = field.rules
    }
  })
  return rules
})

// 暴露验证方法
const formRef = ref(null)
defineExpose({
  validate: () => formRef.value?.validate(),
  restoreValidation: () => formRef.value?.restoreValidation(),
})

/**
 * 获取组件
 */
const getComponent = (type) => {
  const componentMap = {
    input: NInput,
    password: NInput,
    textarea: NInput,
    number: NInputNumber,
    'input-number': NInputNumber, // ✅ 兼容两种写法
    select: NSelect,
    radio: NRadioGroup,
    checkbox: NCheckboxGroup,
    switch: NSwitch,
    date: NDatePicker,
    datetime: NDatePicker,
    'date-range': NDatePicker,
    'tree-select': NTreeSelect,
  }
  return componentMap[type] || NInput
}

/**
 * 获取字段属性
 */
const getFieldProps = (field) => {
  const baseProps = {
    placeholder:
      field.placeholder ||
      `请${['select', 'radio', 'checkbox', 'tree-select'].includes(field.type) ? '选择' : '输入'}${field.label}`,
    disabled: getDisabled(field),
    clearable: field.clearable !== false,
  }

  // 根据类型添加特定属性
  switch (field.type) {
    case 'password':
      return {
        ...baseProps,
        type: 'password',
        showPasswordOn: 'click',
        maxlength: field.maxlength,
      }
    case 'textarea':
      return {
        ...baseProps,
        type: 'textarea',
        rows: field.rows || 3,
        showCount: field.showCount,
        maxlength: field.maxlength,
      }
    case 'number':
      return {
        ...baseProps,
        style: { width: '100%' },
      }
    case 'select':
    case 'tree-select':
      return {
        ...baseProps,
        options: field.options,
      }
    case 'radio':
      return {
        ...baseProps,
      }
    case 'checkbox':
      return {
        ...baseProps,
      }
    case 'switch':
      return {
        ...baseProps,
        checkedValue: field.checkedValue,
        uncheckedValue: field.uncheckedValue,
      }
    case 'date':
      return {
        ...baseProps,
        type: 'date',
        style: { width: '100%' },
      }
    case 'datetime':
      return {
        ...baseProps,
        type: 'datetime',
        style: { width: '100%' },
      }
    case 'date-range':
      return {
        ...baseProps,
        type: 'daterange',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        style: { width: '100%' },
      }
    default:
      return {
        ...baseProps,
        maxlength: field.maxlength,
      }
  }
}
</script>
