/**
 * Naive UI Message 实例
 * 文件路径：src/utils/http/message.js
 * 用途：提供全局唯一的 message 实例，避免重复创建导致提示重复弹出
 */

import { createDiscreteApi } from 'naive-ui'

export const { message } = createDiscreteApi(['message'])
