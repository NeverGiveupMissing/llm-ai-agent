/**
 * 上传路由
 * 路径：koa2/src/modules/upload/routes.js
 */

const Router = require('@koa/router')
const { upload } = require('../../middlewares/upload.middleware')
const uploadController = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')

const router = new Router({
  prefix: '/upload',
})

/**
 * @swagger
 * tags:
 *   name: 文件上传
 *   description: 通用文件上传接口
 */

/**
 * @swagger
 * /upload/single:
 *   post:
 *     tags: [文件上传]
 *     summary: 单文件上传
 *     description: 通用单文件上传接口，支持所有文件类型
 *     parameters:
 *       - in: query
 *         name: scene
 *         schema:
 *           type: string
 *           enum: [avatar, database, document, image, common]
 *         description: 业务场景标识
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 上传成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/single', authMiddleware(), upload.single('file'), uploadController.uploadSingle)

/**
 * @swagger
 * /upload/multiple:
 *   post:
 *     tags: [文件上传]
 *     summary: 多文件上传
 *     description: 通用多文件上传接口，最多支持 10 个文件
 *     parameters:
 *       - in: query
 *         name: scene
 *         schema:
 *           type: string
 *         description: 业务场景标识
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: 上传成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post(
  '/multiple',
  authMiddleware(),
  upload.array('files', 10),
  uploadController.uploadMultiple,
)

module.exports = router
