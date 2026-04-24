import { createDiscreteApi } from 'naive-ui'

const { loadingBar } = createDiscreteApi(['loadingBar'])

let loadingCount = 0

/**
 * 显示全局 Loading
 */
export const showLoading = () => {
  if (loadingCount === 0) {
    loadingBar.start()
  }
  loadingCount++
}

/**
 * 隐藏全局 Loading
 */
export const hideLoading = () => {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    loadingBar.finish()
  }
}

/**
 * 重置 Loading（异常情况）
 */
export const resetLoading = () => {
  loadingCount = 0
  loadingBar.finish()
}
