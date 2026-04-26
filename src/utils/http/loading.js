import { h, render } from 'vue'
import { NSpin } from 'naive-ui'

let loadingContainer = null
let loadingCount = 0

/**
 * 创建 Loading 遮罩层 DOM
 */
const createLoadingElement = () => {
  const container = document.createElement('div')
  container.className = 'global-loading-overlay'
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `

  const vnode = h(
    'div',
    {
      style: {
        color: '#fff',
        textAlign: 'center',
      },
    },
    [
      h(NSpin, {
        size: 'large',
        strokeWidth: 4,
        style: { color: '#fff' },
      }),
      h(
        'div',
        {
          style: {
            marginTop: '16px',
            fontSize: '16px',
          },
        },
        '加载中...',
      ),
    ],
  )

  render(vnode, container)
  document.body.appendChild(container)
  return container
}

/**
 * 显示全局 Loading 遮罩层
 */
export const showLoading = () => {
  if (loadingCount === 0) {
    loadingContainer = createLoadingElement()
  }
  loadingCount++
}

/**
 * 隐藏全局 Loading 遮罩层
 */
export const hideLoading = () => {
  loadingCount--
  if (loadingCount <= 0) {
    loadingCount = 0
    if (loadingContainer) {
      render(null, loadingContainer)
      loadingContainer.remove()
      loadingContainer = null
    }
  }
}

/**
 * 重置 Loading（异常情况）
 */
export const resetLoading = () => {
  loadingCount = 0
  if (loadingContainer) {
    render(null, loadingContainer)
    loadingContainer.remove()
    loadingContainer = null
  }
}
