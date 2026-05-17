import { h, render } from 'vue'
import { NSpin } from 'naive-ui'
import { useRoute } from 'vue-router'

let loadingContainer = null
let loadingCount = 0

/**
 * 判断当前是否在登录页面
 */
const isLoginPage = () => {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return path === '/login' || path === '/' || path === ''
}

/**
 * 创建 Loading 遮罩层 DOM
 */
const createLoadingElement = () => {
  const isLogin = isLoginPage()
  
  if (isLogin) {
    // 登录页面样式：紫色背景 + 白色圆环 + 文字
    const container = document.createElement('div')
    container.className = 'login-loading-overlay'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #7B83EB;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      pointer-events: auto;
    `

    const vnode = h(
      'div',
      {
        style: {
          textAlign: 'center',
          color: '#fff',
        },
      },
      [
        h('div', {
          class: 'login-loading-circle',
          style: {
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'login-spin 1s linear infinite',
            margin: '0 auto 20px',
          },
        }),
        h(
          'div',
          {
            style: {
              fontSize: '16px',
              color: '#fff',
              fontWeight: '400',
            },
          },
          '正在加载系统资源，请耐心等待',
        ),
      ],
    )

    // 添加动画样式
    if (!document.getElementById('login-loading-style')) {
      const styleEl = document.createElement('style')
      styleEl.id = 'login-loading-style'
      styleEl.textContent = `
        @keyframes login-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `
      document.head.appendChild(styleEl)
    }

    render(vnode, container)
    document.body.appendChild(container)
    return container
  } else {
    // 全局默认样式：半透明白色背景 + 蓝色小圆圈
    const container = document.createElement('div')
    container.className = 'global-loading-overlay'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      pointer-events: auto;
    `

    const vnode = h('div', {
      class: 'loading-spinner',
      style: {
        width: '32px',
        height: '32px',
        border: '3px solid rgba(24, 144, 255, 0.2)',
        borderTopColor: '#1890ff',
        borderRadius: '50%',
        animation: 'loading-spin 0.8s linear infinite',
      },
    })

    // 添加动画样式（如果不存在）
    if (!document.getElementById('loading-animation-style')) {
      const styleEl = document.createElement('style')
      styleEl.id = 'loading-animation-style'
      styleEl.textContent = `
        @keyframes loading-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `
      document.head.appendChild(styleEl)
    }

    render(vnode, container)
    document.body.appendChild(container)
    return container
  }
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
    // 移除动画样式
    const globalStyleEl = document.getElementById('loading-animation-style')
    if (globalStyleEl) {
      globalStyleEl.remove()
    }
    const loginStyleEl = document.getElementById('login-loading-style')
    if (loginStyleEl) {
      loginStyleEl.remove()
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
  // 移除动画样式
  const globalStyleEl = document.getElementById('loading-animation-style')
  if (globalStyleEl) {
    globalStyleEl.remove()
  }
  const loginStyleEl = document.getElementById('login-loading-style')
  if (loginStyleEl) {
    loginStyleEl.remove()
  }
}
