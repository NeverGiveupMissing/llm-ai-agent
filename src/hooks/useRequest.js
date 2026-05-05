import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'

/**
 * ============================================================================
 * 请求封装工具集 - 三种方式按需选择
 * ============================================================================
 *
 * 📌 使用建议：
 * 1. autoMsg     - 最简单，只需包装 API，自动显示消息（适合 80% 场景）
 * 2. useRequest  - 需要 loading 状态和数据响应（适合 15% 场景）
 * 3. withConfirm - 带二次确认的操作（适合删除等危险操作）
 *
 * ============================================================================
 */

// ==================== 方案 1: autoMsg - 自动消息提示 ====================

/**
 * 自动消息包装器 - 最简用法
 *
 * @example
 * import { autoMsg } from '@/hooks/useRequest'
 * import { deleteMemory } from '@/api/memory'
 *
 * const deleteItem = autoMsg(deleteMemory)
 * await deleteItem(id) // 自动显示后端返回的消息
 */
export const autoMsg = (fn) => {
  const message = useMessage()

  return async (...args) => {
    try {
      const res = await fn(...args)
      if (res?.message) {
        message.success(res.message)
      }
      return res
    } catch (err) {
      message.error(err.message || '操作失败')
      throw err
    }
  }
}

// ==================== 方案 2: useRequest - 完整请求管理 ====================

/**
 * 通用请求 Hook - 提供 loading、data 状态管理
 *
 * @param {Function} apiFn - API 函数
 * @param {Object} options - 配置选项
 * @param {boolean} options.autoMsg - 是否自动显示消息（默认 true）
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 失败回调
 * @returns {Object} { loading, data, error, run }
 *
 * @example
 * import { useRequest } from '@/hooks/useRequest'
 * import { getMemoryList } from '@/api/memory'
 *
 * const { loading, data, run: fetchList } = useRequest(getMemoryList)
 *
 * // 模板中使用
 * // <n-spin :show="loading">...</n-spin>
 * // <div v-for="item in data?.list">{{ item.content }}</div>
 *
 * onMounted(() => {
 *   fetchList({ page: 1, pageSize: 10 })
 * })
 */
export const useRequest = (apiFn, options = {}) => {
  const message = useMessage()
  const loading = ref(false)
  const data = ref(null)
  const error = ref(null)

  const { autoMsg: enableAutoMsg = true, onSuccess, onError } = options

  const run = async (...args) => {
    loading.value = true
    error.value = null

    try {
      const res = await apiFn(...args)
      data.value = res

      // 自动显示后端消息
      if (enableAutoMsg && res?.message) {
        message.success(res.message)
      }

      onSuccess?.(res)
      return res
    } catch (err) {
      error.value = err

      if (enableAutoMsg) {
        message.error(err.message || '操作失败')
      }

      onError?.(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    data,
    error,
    run,
  }
}

// ==================== 方案 3: withConfirm - 带确认的包装器 ====================

/**
 * 带二次确认的请求包装器 - 适合删除等危险操作
 *
 * @param {Function} fn - API 函数
 * @param {Object} options - 配置
 * @param {string} options.title - 确认标题
 * @param {string} options.content - 确认内容
 * @param {string} options.positiveText - 确认按钮文字
 * @param {string} options.negativeText - 取消按钮文字
 * @param {Function} options.onConfirm - 确认后的回调
 * @returns {Function} - 返回一个触发确认对话框的函数
 *
 * @example
 * import { withConfirm } from '@/hooks/useRequest'
 * import { deleteMemory } from '@/api/memory'
 *
 * const confirmDelete = withConfirm(deleteMemory, {
 *   title: '确认删除',
 *   content: '确定要删除这条记忆吗？',
 *   onConfirm: () => {
 *     console.log('删除成功')
 *     fetchMemories()
 *   },
 * })
 *
 * // 模板中使用
 * // <n-button @click="() => confirmDelete(memoryId)">删除</n-button>
 */
export const withConfirm = (fn, options = {}) => {
  const {
    title = '确认操作',
    content = '确定要执行此操作吗？',
    positiveText = '确定',
    negativeText = '取消',
    onConfirm,
    autoMsg = true,
  } = options

  const message = useMessage()
  const dialog = window.$dialog || useMessage() // 需要在 main.js 中挂载

  return async (...args) => {
    return new Promise((resolve, reject) => {
      window.$dialog?.warning({
        title,
        content,
        positiveText,
        negativeText,
        onPositiveClick: async () => {
          try {
            const res = await fn(...args)

            if (autoMsg && res?.message) {
              message.success(res.message)
            }

            onConfirm?.(res)
            resolve(res)
          } catch (err) {
            if (autoMsg) {
              message.error(err.message || '操作失败')
            }
            reject(err)
          }
        },
        onNegativeClick: () => {
          reject(new Error('用户取消'))
        },
      })
    })
  }
}

// ==================== 辅助工具：批量包装 API ====================

/**
 * 批量包装多个 API 函数
 *
 * @param {Object} apis - API 函数对象
 * @returns {Object} - 包装后的 API 对象
 *
 * @example
 * import { wrapApis } from '@/hooks/useRequest'
 * import * as memoryApi from '@/api/memory'
 *
 * const api = wrapApis(memoryApi)
 *
 * // 现在所有 API 都自动显示消息
 * await api.deleteMemory(id)
 * await api.createMemory(data)
 */
export const wrapApis = (apis) => {
  const wrapped = {}
  Object.keys(apis).forEach((key) => {
    if (typeof apis[key] === 'function') {
      wrapped[key] = autoMsg(apis[key])
    } else {
      wrapped[key] = apis[key]
    }
  })
  return wrapped
}
