/**
 * 通用 API
 * 路径：src/api/common.js
 */

import { axios } from '@/utils/http'
import { API_PREFIX } from '@/utils/constants'

/**
 * 通用单文件上传
 * @param {File} file - 文件对象
 * @param {string} scene - 业务场景，如 'avatar' | 'database' | 'document'
 * @param {Function} onProgress - 进度回调函数 (percent) => void
 * @returns {Promise} 返回上传结果
 */
export function uploadFile(file, scene = 'common', onProgress = null) {
  const formData = new FormData()
  formData.append('file', file)

  return axios.upload(`${API_PREFIX}/upload/single?scene=${scene}`, formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    },
  })
}

/**
 * 通用多文件上传
 * @param {File[]} files - 文件对象数组
 * @param {string} scene - 业务场景
 * @param {Function} onProgress - 进度回调函数 (percent) => void
 * @returns {Promise} 返回上传结果
 */
export function uploadMultipleFiles(files, scene = 'common', onProgress = null) {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  return axios.post(`${API_PREFIX}/upload/multiple?scene=${scene}`, formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    },
  })
}
