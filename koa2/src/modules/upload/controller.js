/**
 * 通用上传控制器
 * 路径：koa2/src/modules/upload/controller.js
 */

const { asyncHandler } = require('../../utils/async-handler')
const { BadRequestError } = require('../../utils/app-error')
const path = require('path')

class UploadController {
  /**
   * 通用单文件上传接口
   * POST /api/upload/single?scene=avatar
   */
  uploadSingle = asyncHandler(async (ctx) => {
    const file = ctx.file

    if (!file) {
      throw new BadRequestError('请选择要上传的文件')
    }

    // 获取业务场景参数
    const scene = ctx.query.scene || 'common'

    // 构建文件信息
    const fileInfo = {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      // 拼接静态资源访问路径（已配置 koa-static 访问 /uploads 目录）
      url: `/uploads/${file.filename}`,
      scene,
    }

    ctx.success(fileInfo, '上传成功')
  })

  /**
   * 通用多文件上传接口
   * POST /api/upload/multiple?scene=gallery
   */
  uploadMultiple = asyncHandler(async (ctx) => {
    const files = ctx.files

    if (!files || files.length === 0) {
      throw new BadRequestError('请选择要上传的文件')
    }

    // 获取业务场景参数
    const scene = ctx.query.scene || 'common'

    // 构建文件信息数组
    const filesInfo = files.map((file) => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      scene,
    }))

    ctx.success(filesInfo, `成功上传 ${files.length} 个文件`)
  })
}

module.exports = new UploadController()
