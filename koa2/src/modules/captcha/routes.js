// 说明：验证码路由
const Router = require('@koa/router')
const captchaController = require('./controller')

const router = new Router({
  prefix: '/captcha',
})

/**
 * @swagger
 * tags:
 *   name: 验证码
 *   description: 验证码相关接口
 */

/**
 * @swagger
 * /captcha/image:
 *   get:
 *     tags: [验证码]
 *     summary: 获取验证码图片
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 msg:
 *                   type: string
 *                   example: 成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     uuid:
 *                       type: string
 *                       description: 验证码唯一标识
 *                     img:
 *                       type: string
 *                       description: SVG 图片数据
 */
router.get('/image', captchaController.getCaptcha)

module.exports = router
