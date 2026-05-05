import { showLoading, hideLoading } from './loading'
import { message } from './message'
import router from '@/router'
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
  if (data.code !== 200) {
    return Promise.reject(new Error(data.message || '请求失败'))
  }
  return data
}

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
    console.warn('⚠️ [请求拦截器] 缺少 Token:', config.url)
  }

  if (config.method?.toUpperCase() === 'GET' && config.params) {
    config.params._t = Date.now()
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
 */
export const responseInterceptor = async (response) => {
  if (!response.config?.skipLoading) {
    hideLoading()
  }

  if (response.status === 401) {
    // ✅ 企业级方案：不要立即删除 Token，先检查是否真的过期
    // 可能是并行请求的竞态条件导致的临时 401
    const token = localStorage.getItem('access_token')
    
    // ✅ 显示具体错误信息
    const errorMessage = response.data?.msg || response.data?.message || '登录已过期'
    message.error(errorMessage)
    
    if (token) {
      // Token 存在但返回 401，说明确实过期了
      console.warn('️ Token 已失效，清除并跳转到登录页')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      
      if (!window.location.pathname.includes('/login')) {
        // 延迟跳转，让用户看到错误提示
        setTimeout(() => {
          router.replace('/login')
        }, 1000)
      }
    }
    // 如果 Token 不存在，说明已经清除过了，不需要重复处理
    
    return Promise.reject(new Error(errorMessage))
  }

  if (response.status === 403) {
    if (!window.location.pathname.includes('/403')) {
      router.push('/403')
    }
    return Promise.reject(new Error('暂无权限访问'))
  }

  if (response.status === 404) {
    return Promise.reject(new Error('请求的资源不存在'))
  }

  if (response.status === 429) {
    return Promise.reject(new Error('请求过于频繁'))
  }

  if (response.status === 500) {
    return Promise.reject(new Error('服务器错误，请稍后重试'))
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
        return Promise.reject(new Error('后端响应格式错误，非 JSON 数据'))
      }
      return Promise.reject(error)
    }
  }

  return await response.text()
}
