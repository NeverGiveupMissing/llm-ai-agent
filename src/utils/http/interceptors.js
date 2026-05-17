import { showLoading, hideLoading } from './loading'
import { message, dialog } from './message'
// ✅ 移除静态导入 router，改用懒加载避免循环依赖
// import router from '@/router'
import { useUserStore } from '@/stores/modules/user'
import { usePermissionStore } from '@/stores/modules/permission'
import { checkIsAdmin } from '@/utils/permission'

/**
 * 处理业务错误
 * @param {Object} data - 响应数据
 * @param {Object} config - 请求配置
 * @returns {Promise} 返回数据或抛出错误
 */
const handleBusinessError = (data, config) => {
  // ✅ 增强非空校验：如果 data 为 undefined 或 null，抛出明确错误
  if (data === undefined || data === null) {
    const errorMsg = `响应数据为空 (URL: ${config?.url || 'unknown'})`
    console.error('❌ [BusinessError]', errorMsg)
    return Promise.reject(new Error(errorMsg))
  }

  // ✅ 增强格式校验：data 必须是对象
  if (typeof data !== 'object') {
    const errorMsg = `数据格式错误：期望对象，实际类型 ${typeof data} (URL: ${config?.url || 'unknown'})`
    console.error('❌ [BusinessError]', errorMsg, 'Data:', data)
    return Promise.reject(new Error(errorMsg))
  }

  if (data.code !== 200) {
    return Promise.reject(new Error(data.message || '请求失败'))
  }
  return data
}

/**
 * 不需要 Token 的接口白名单
 */
const NO_TOKEN_URLS = ['/captcha/image', '/login', '/register']

/**
 * 请求拦截器
 */
export const requestInterceptor = (config) => {
  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
    console.log('🔑 [请求拦截器] Token 已添加:', config.url)
  } else {
    // 检查是否在白名单中
    const isNoTokenUrl = NO_TOKEN_URLS.some((url) => config.url?.includes(url))
    if (!isNoTokenUrl) {
      console.warn('⚠️ [请求拦截器] 缺少 Token:', config.url)
    }
  }

  // ✅ 导出请求权限校验
  if (config.url?.includes('/export')) {
    try {
      const userStore = useUserStore()
      const permissionStore = usePermissionStore()

      // 检查是否是超级管理员
      const isAdmin = checkIsAdmin(userStore.userInfo.roles)

      if (!isAdmin) {
        // 不是 admin，检查是否有导出权限
        const hasExportPermission = permissionStore.hasAnyPermission([
          'system:common:export',
          'database:export', // 数据库导出特定权限
        ])

        if (!hasExportPermission) {
          message.error('您没有导出权限，请联系管理员')
          throw new Error('没有导出权限')
        }
      }
    } catch (error) {
      // Store 可能未初始化，忽略错误
      console.warn('⚠️ 权限校验失败:', error.message)
    }
  }

  if (!config.skipLoading) {
    showLoading()
  }

  return config
}

/**
 * 响应拦截器
 * 兼容 fetch Response 和 axios response 对象
 *
 * 错误处理策略：
 * - 401: 仅在状态码为 401 时清空 Token 并跳转登录页
 * - 403: 仅提示"权限不足"，严禁跳转登录页，保持用户留在当前页面
 * - 500: 显示具体的系统报错信息，帮助开发者定位问题
 */
export const responseInterceptor = async (response) => {
  if (!response.config?.skipLoading) {
    hideLoading()
  }

  // ✅ 401 处理：认证失败（未登录、Token 失效或账号停用）
  // 仿照若依体验，弹出确认框询问是否重新登录
  if (response.status === 401) {
    const token = localStorage.getItem('access_token')
    const errorMsg = response.data?.message || response.data?.msg || '请先登录'

    // ✅ 判断是否为账号停用
    const isAccountDisabled = errorMsg.includes('停用') || errorMsg.includes('disabled')

    if (isAccountDisabled) {
      // 账号停用：直接提示，不提供重新登录选项
      console.warn('⚠️ [401] 账号已停用:', errorMsg)
      dialog.warning({
        title: '系统提示',
        content: errorMsg,
        positiveText: '我知道了',
        maskClosable: false,
        closeOnEsc: false,
        onPositiveClick: () => {
          const userStore = useUserStore()
          userStore.logout() // 清除 Pinia 状态和 localStorage
          import('@/router').then(({ default: router }) => {
            router.replace('/login')
          })
        },
      })
      const error = new Error(errorMsg)
      error._401Handled = true
      return Promise.reject(error)
    }

    // 如果已经没有 Token 了，直接跳转，不弹窗
    if (!token) {
      console.warn('⚠️ [401] 无 Token，直接跳转登录页')
      if (!window.location.pathname.includes('/login')) {
        // ✅ 懒加载 router 避免循环依赖
        import('@/router').then(({ default: router }) => {
          router.replace('/login')
        })
      }
      const error = new Error(errorMsg)
      error._401Handled = true
      return Promise.reject(error)
    }

    // 弹出确认框（Token 过期场景）
    dialog.warning({
      title: '系统提示',
      content: '登录状态已过期，您可以继续留在该页面，或者重新登录',
      positiveText: '重新登录',
      negativeText: '取消',
      onPositiveClick: () => {
        console.log('✅ [401] 用户选择重新登录')
        const userStore = useUserStore()
        userStore.logout() // 清除 Pinia 状态和 localStorage
        // ✅ 懒加载 router 避免循环依赖
        import('@/router').then(({ default: router }) => {
          router.replace('/login')
        })
      },
      onNegativeClick: () => {
        console.log('ℹ️ [401] 用户选择取消，留在当前页')
      },
    })

    const error = new Error(errorMsg)
    error._401Handled = true
    return Promise.reject(error)
  }

  // ✅ 403 处理：权限不足（已登录但无权访问）
  // 仅提示错误信息，严禁跳转登录页，保持用户留在当前页面
  if (response.status === 403) {
    let errorMessage = '您没有执行该操作的权限 (Error Code: 403)'
    try {
      const errorData = response.data || {}
      // ✅ 直接使用后端返回的 msg 字段（格式已统一）
      errorMessage = errorData.message || errorMessage
    } catch (e) {}

    // ✅ 直接显示后端返回的错误信息，包含路径和方法
    message.error(errorMessage)

    // ✅ 不跳转到 403 页面，用户留在当前页面
    const error = new Error(errorMessage)
    error._403Handled = true // ✅ 添加标记，告诉业务代码不要重复提示
    return Promise.reject(error)
  }

  if (response.status === 404) {
    const error = new Error('请求的资源不存在')
    error._404Handled = true
    return Promise.reject(error)
  }

  if (response.status === 429) {
    const error = new Error('请求过于频繁，请稍后再试')
    error._429Handled = true
    return Promise.reject(error)
  }

  // ✅ 500 处理：服务器错误
  // 显示具体的报错信息，帮助开发者定位问题
  if (response.status === 500) {
    let errorMessage = '服务器内部错误，请稍后重试'
    try {
      const errorData = response.data || {}
      // 优先使用后端返回的具体错误信息
      errorMessage = errorData.message || errorData.msg || errorMessage

      // ✅ 如果是 PostgreSQL 类型错误，显示更友好的提示
      if (errorMessage.includes('invalid input syntax for type integer')) {
        errorMessage = '参数类型错误：请确保传入的 ID 为数字格式'
      }
    } catch (e) {}

    console.error('❌ [500] 服务器错误详情:', response.data)
    message.error(`系统错误 (Error Code: 500): ${errorMessage}`)

    const error = new Error(errorMessage)
    error._500Handled = true // ✅ 添加标记
    return Promise.reject(error)
  }

  // ✅ 304 Not Modified 处理：浏览器缓存命中
  // 304 状态码表示资源未修改，浏览器应使用缓存，但 axios 会将其视为成功
  // 需要确保响应数据不为空
  if (response.status === 304) {
    console.warn('⚠️ [304] 缓存命中，尝试使用缓存数据')
    // 如果 data 为 undefined 或 null，尝试使用浏览器缓存
    if (!response.data) {
      // axios 在 304 时不会返回 data，这是一个已知问题
      // 返回一个空对象，避免后续处理出错
      return { code: 200, data: null, message: '使用缓存数据' }
    }
  }

  const isAxiosResponse = response.data !== undefined && typeof response.json !== 'function'

  if (isAxiosResponse) {
    return handleBusinessError(response.data, response.config)
  }

  if (!response.ok) {
    let errorMessage = `请求失败: ${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch (e) {
      // 忽略读取错误
    }

    return Promise.reject(new Error(errorMessage))
  }

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    try {
      const data = await response.json()
      return handleBusinessError(data, response.config)
    } catch (error) {
      if (error.name === 'SyntaxError') {
        // ✅ 深度链路调试：打印原始响应数据，查看是哪个 HTML 页面挡住了 JSON
        console.warn('🔍 [拦截器深度调试] JSON 解析失败！')
        console.warn('🔍 [拦截器深度调试] 请求 URL:', response.config?.url || 'unknown')
        console.warn('🔍 [拦截器深度调试] 响应状态码:', response.status)
        console.warn('🔍 [拦截器深度调试] Content-Type:', contentType)
        console.warn(
          '🔍 [拦截器深度调试] 原始响应数据 (前 500 字符):',
          String(response.data).substring(0, 500),
        )
        console.warn('🔍 [拦截器深度调试] 完整响应数据:', response.data)

        return Promise.reject(new Error('后端响应格式错误，非 JSON 数据（可能是 HTML 错误页）'))
      }
      return Promise.reject(error)
    }
  }

  // ✅ 深度链路调试：非 JSON 响应也打印出来
  console.warn('🔍 [拦截器深度调试] 非 JSON 响应！')
  console.warn('🔍 [拦截器深度调试] 请求 URL:', response.config?.url || 'unknown')
  console.warn('🔍 [拦截器深度调试] 响应状态码:', response.status)
  console.warn('🔍 [拦截器深度调试] Content-Type:', contentType)
  const textData = await response.text()
  console.warn('🔍 [拦截器深度调试] 原始响应数据 (前 500 字符):', textData.substring(0, 500))
  console.warn('🔍 [拦截器深度调试] 完整响应数据:', textData)
  return textData
}
