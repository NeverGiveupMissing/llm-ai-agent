<template>
  <n-dropdown trigger="hover" :options="exportOptions" @select="handleExport">
    <n-button :size="size" :type="type">
      <template #icon>
        <n-icon><DownloadOutline /></n-icon>
      </template>
      {{ showText ? '导出' : '' }}
    </n-button>
  </n-dropdown>
</template>

<script setup name="MemoryExport">
import { NButton, NIcon, NDropdown, useMessage } from 'naive-ui'
import { DownloadOutline } from '@vicons/ionicons5'

const props = defineProps({
  /**
   * 要导出的记忆数据
   */
  memories: {
    type: Array,
    required: true,
    default: () => [],
  },
  /**
   * 按钮尺寸
   */
  size: {
    type: String,
    default: 'small',
    validator: (value) => ['tiny', 'small', 'medium', 'large'].includes(value),
  },
  /**
   * 按钮类型
   */
  type: {
    type: String,
    default: 'default',
    validator: (value) =>
      ['default', 'primary', 'info', 'success', 'warning', 'error'].includes(value),
  },
  /**
   * 是否显示按钮文字
   */
  showText: {
    type: Boolean,
    default: true,
  },
  /**
   * 导出文件名前缀
   */
  filenamePrefix: {
    type: String,
    default: 'memories',
  },
  /**
   * 类型映射（可选，默认使用内置映射）
   */
  typeMap: {
    type: Object,
    default: () => ({
      fact: { label: '事实', type: 'info' },
      preference: { label: '偏好', type: 'error' },
      goal: { label: '目标', type: 'success' },
      event: { label: '经历', type: 'warning' },
      opinion: { label: '观点', type: 'default' },
    }),
  },
})

const emit = defineEmits(['beforeExport', 'afterExport'])

const msgApi = useMessage()

// 导出选项
const exportOptions = [
  { label: '导出为 Markdown', key: 'markdown' },
  { label: '导出为 TXT', key: 'txt' },
]

/**
 * 获取类型标签
 */
const getTypeLabel = (type) => {
  return props.typeMap[type]?.label || type || '未知'
}

/**
 * 通用文件下载方法
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 导出为 Markdown
 */
const exportToMarkdown = () => {
  const memories = props.memories

  if (!memories || memories.length === 0) {
    msgApi.warning('没有可导出的记忆')
    return
  }

  emit('beforeExport', 'markdown', memories.length)

  let markdown = '# 记忆导出\n\n'
  markdown += `> 导出时间：${new Date().toLocaleString('zh-CN')}\n`
  markdown += `> 记忆总数：${memories.length} 条\n\n`
  markdown += '---\n\n'

  memories.forEach((memory, index) => {
    const typeLabel = getTypeLabel(memory.memory_type)
    const date = memory.created_at ? new Date(memory.created_at).toLocaleString('zh-CN') : '未知'
    const importance = Number(memory.importance) || 0
    const tags = memory.tags?.length > 0 ? memory.tags.join(', ') : '无'
    const source = memory.source === 'auto_extract' ? '自动提取' : '手动创建'

    markdown += `## ${index + 1}. ${typeLabel}\n\n`
    markdown += `**内容**：${memory.content}\n\n`
    markdown += `| 属性 | 值 |\n`
    markdown += `|------|------|\n`
    markdown += `| 重要性 | ${importance}/10 |\n`
    markdown += `| 来源 | ${source} |\n`
    markdown += `| 标签 | ${tags} |\n`
    markdown += `| 创建时间 | ${date} |\n\n`
    markdown += '---\n\n'
  })

  const filename = `${props.filenamePrefix}_${Date.now()}.md`
  downloadFile(markdown, filename, 'text/markdown')
  msgApi.success(`已导出 ${memories.length} 条记忆为 Markdown`)

  emit('afterExport', 'markdown', memories.length)
}

/**
 * 导出为 TXT
 */
const exportToTxt = () => {
  const memories = props.memories

  if (!memories || memories.length === 0) {
    msgApi.warning('没有可导出的记忆')
    return
  }

  emit('beforeExport', 'txt', memories.length)

  let txt = '记忆导出\n'
  txt += '═'.repeat(50) + '\n'
  txt += `导出时间：${new Date().toLocaleString('zh-CN')}\n`
  txt += `记忆总数：${memories.length} 条\n`
  txt += '═'.repeat(50) + '\n\n'

  memories.forEach((memory, index) => {
    const typeLabel = getTypeLabel(memory.memory_type)
    const date = memory.created_at ? new Date(memory.created_at).toLocaleString('zh-CN') : '未知'
    const importance = Number(memory.importance) || 0
    const tags = memory.tags?.length > 0 ? memory.tags.join(', ') : '无'
    const source = memory.source === 'auto_extract' ? '自动提取' : '手动创建'

    txt += `【${index + 1}】${typeLabel}\n`
    txt += '-'.repeat(50) + '\n'
    txt += `内容：${memory.content}\n`
    txt += `重要性：${importance}/10\n`
    txt += `来源：${source}\n`
    txt += `标签：${tags}\n`
    txt += `创建时间：${date}\n`
    txt += '\n'
  })

  const filename = `${props.filenamePrefix}_${Date.now()}.txt`
  downloadFile(txt, filename, 'text/plain')
  msgApi.success(`已导出 ${memories.length} 条记忆为 TXT`)

  emit('afterExport', 'txt', memories.length)
}

/**
 * 处理导出选择
 */
const handleExport = (key) => {
  if (key === 'markdown') {
    exportToMarkdown()
  } else if (key === 'txt') {
    exportToTxt()
  }
}
</script>
