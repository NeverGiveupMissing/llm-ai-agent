// 说明：验证码控制器
const captchaService = require('./service')

class CaptchaController {
  /**
   * 获取验证码图片
   * GET /captcha/image
   */
  async getCaptcha(ctx) {
    try {
      const { uuid, img } = captchaService.generateCaptcha()

      ctx.body = {
        code: 200,
        msg: '成功',
        data: {
          uuid,
          img,
        },
      }
    } catch (error) {
      console.error('获取验证码失败:', error)
      ctx.status = 500
      ctx.body = {
        code: 500,
        msg: '获取验证码失败',
      }
    }
  }
}

module.exports = new CaptchaController()
