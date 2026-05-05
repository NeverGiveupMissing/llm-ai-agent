/**
 * 文件上传中间件
 * 路径：koa2/src/middlewares/upload.middleware.js
 * 基于 @koa/multer 封装的通用文件上传中间件
 */

const multer = require('@koa/multer')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * 磁盘存储配置
 * 文件名格式：时间戳-UUID.后缀
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 提取原文件后缀
    const ext = path.extname(file.originalname)
    // 生成：时间戳-UUID.后缀
    const filename = `${Date.now()}-${uuidv4().slice(0, 8)}${ext}`
    cb(null, filename)
  },
})

/**
 * 文件过滤器（可选）
 * 可以根据业务需求定制允许的文件类型
 */
const fileFilter = (req, file, cb) => {
  // 默认允许所有文件类型
  // 如需限制，可在此添加逻辑：
  // const allowedTypes = ['image/jpeg', 'image/png', 'application/sql']
  // if (allowedTypes.includes(file.mimetype)) {
  //   cb(null, true)
  // } else {
  //   cb(new Error('不支持的文件类型'), false)
  // }
  cb(null, true)
}

/**
 * 创建上传实例
 * @param {Object} options - 配置选项
 * @param {number} options.fileSize - 文件大小限制（字节），默认 50MB
 * @param {number} options.files - 最多文件数量，默认 1
 * @returns {Object} multer 实例
 */
function createUpload(options = {}) {
  const {
    fileSize = 50 * 1024 * 1024, // 默认 50MB
    files = 1, // 默认单文件
  } = options

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize,
      files,
    },
  })
}

// 导出默认实例（单文件上传，50MB 限制）
const upload = createUpload()

// 导出创建函数（支持自定义配置）
module.exports = {
  upload,
  createUpload,
  uploadDir,
}
