const svgCaptcha = require('svg-captcha')
const captchaModel = require('./model')
const { v4: uuidv4 } = require('uuid')

class CaptchaService {
  generateCaptcha() {
    const uuid = uuidv4()

    const captcha = svgCaptcha.createMathExpr({
      mathMin: 1,
      mathMax: 10,
      mathOperator: '+', // 建议只用加法，更清晰
      fontSize: 50, // 字号加大，充满容器
      noise: 0, // 【关键】设为 0，彻底去掉那两条遮挡线
      width: 120,
      height: 40,
      background: '#ffffff', // 使用纯白背景，方便前端滤镜处理
      color: true, // 开启彩色，方便前端通过 filter 转换颜色
    })

    captchaModel.setCaptcha(uuid, captcha.text)

    return { uuid, img: captcha.data }
  }

  verifyCaptcha(uuid, code) {
    if (!uuid || !code) return false
    return captchaModel.verifyCaptcha(uuid, code)
  }

  cleanExpired() {
    captchaModel.cleanExpired()
  }
}

module.exports = new CaptchaService()
