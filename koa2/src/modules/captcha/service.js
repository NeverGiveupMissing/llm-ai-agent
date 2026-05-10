// 说明：验证码服务 - 生成图形验证码
const svgCaptcha = require('svg-captcha')
const captchaModel = require('./model')
const { v4: uuidv4 } = require('uuid')

class CaptchaService {
  /**
   * 生成验证码图片
   * @returns {Object} { uuid, img (Base64), code }
   */
  generateCaptcha() {
    // 生成唯一标识
    const uuid = uuidv4()

    // 生成图形验证码
    const captcha = svgCaptcha.create({
      size: 4, // 验证码长度
      ignoreChars: '0o1i', // 排除易混淆字符
      noise: 2, // 干扰线条数量
      color: true, // 随机颜色
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40,
      fontSize: 36,
    })

    // 保存验证码到存储
    captchaModel.setCaptcha(uuid, captcha.text)

    return {
      uuid,
      img: captcha.data, // SVG 字符串
      code: captcha.text, // 调试用，生产环境不返回
    }
  }

  /**
   * 验证验证码
   * @param {string} uuid - 验证码 UUID
   * @param {string} code - 用户输入的验证码
   * @returns {boolean} 验证结果
   */
  verifyCaptcha(uuid, code) {
    if (!uuid || !code) {
      return false
    }
    return captchaModel.verifyCaptcha(uuid, code)
  }

  /**
   * 清理过期验证码
   */
  cleanExpired() {
    captchaModel.cleanExpired()
  }
}

module.exports = new CaptchaService()
