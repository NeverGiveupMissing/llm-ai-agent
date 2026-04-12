// 统一导出

import http from '@/utils/http'

// 导入各模块
import * as chatApi from './modules/chat'
import * as userApi from './modules/user'

// 统一导出
export const api = {
  chat: chatApi,
  user: userApi,
}

// 也可以分别导出
export { chatApi, userApi }

// 默认导出
export default api
