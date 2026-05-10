// 说明：验证码模型 - 管理验证码的存储和验证
// 使用内存 Map 存储（生产环境建议改用 Redis）

class CaptchaModel {
  constructor() {
    // 存储验证码：key = uuid, value = { code, expireTime }
    this.captchaStore = new Map()
    // 验证码有效期：5 分钟
    this.EXPIRE_TIME = 5 * 60 * 1000
  }

  /**
   * 生成验证码
   * @param {string} uuid - 唯一标识
   * @param {string} code - 验证码文本
   */
  setCaptcha(uuid, code) {
    this.captchaStore.set(uuid, {
      code: code.toLowerCase(), // 验证码不区分大小写
      expireTime: Date.now() + this.EXPIRE_TIME,
    })
  }

  /**
   * 验证验证码
   * @param {string} uuid - 唯一标识
   * @param {string} code - 用户输入的验证码
   * @returns {boolean} 验证结果
   */
  verifyCaptcha(uuid, code) {
    const captcha = this.captchaStore.get(uuid)

    if (!captcha) {
      return false
    }

    // 检查是否过期
    if (Date.now() > captcha.expireTime) {
      this.captchaStore.delete(uuid)
      return false
    }

    // 验证成功后删除验证码（防止重复使用）
    this.captchaStore.delete(uuid)

    // 不区分大小写比较
    return captcha.code === code.toLowerCase()
  }

  /**
   * 清理过期验证码
   */
  cleanExpired() {
    const now = Date.now()
    for (const [uuid, captcha] of this.captchaStore.entries()) {
      if (now > captcha.expireTime) {
        this.captchaStore.delete(uuid)
      }
    }
  }

  /**
   * 获取存储大小（用于调试）
   */
  getSize() {
    return this.captchaStore.size
  }
}

module.exports = new CaptchaModel()
