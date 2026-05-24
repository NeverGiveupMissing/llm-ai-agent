/**
 * IP 地理位置查询工具
 * 使用免费 IP 查询 API 获取地理位置信息
 */

const https = require('https')
const http = require('http')

/**
 * 获取客户端真实 IP 地址
 * 支持从反向代理头获取真实 IP
 * @param {Object} ctx - Koa context
 * @returns {string} 真实 IP 地址
 */
function getRealIP(ctx) {
  // 1. 优先从 X-Forwarded-For 头获取（Nginx 反向代理场景）
  const forwardedFor = ctx.get('X-Forwarded-For')
  if (forwardedFor) {
    // X-Forwarded-For 格式：client, proxy1, proxy2
    // 取第一个 IP 就是真实客户端 IP
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0] || ctx.ip
  }
  
  // 2. 从 X-Real-IP 头获取
  const realIP = ctx.get('X-Real-IP')
  if (realIP) {
    return realIP
  }
  
  // 3. 使用 Koa 默认的 ctx.ip
  return ctx.ip || ctx.request.ip || '127.0.0.1'
}

/**
 * 根据 IP 地址查询地理位置
 * 使用免费的 ip-api.com 服务
 * @param {string} ip - IP 地址
 * @returns {Promise<string>} 地理位置信息，如 "中国 北京"
 */
async function queryIPLocation(ip) {
  // 如果是内网 IP 或 localhost，返回本地
  if (isPrivateIP(ip)) {
    return '内网'
  }
  
  try {
    // 使用 ip-api.com 免费服务（不需要 key，但有速率限制）
    return await queryFromIPApi(ip)
  } catch (error) {
    console.warn('IP 地理位置查询失败:', error.message)
    return ''
  }
}

/**
 * 使用 ip-api.com 查询 IP 地理位置
 * @param {string} ip 
 * @returns {Promise<string>}
 */
function queryFromIPApi(ip) {
  return new Promise((resolve, reject) => {
    const url = `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`
    
    http.get(url, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          
          if (result.status === 'success') {
            // 组合地理位置：国家 + 省份 + 城市
            const location = [
              result.country || '',
              result.regionName || '',
              result.city || ''
            ].filter(Boolean).join(' ')
            
            resolve(location)
          } else {
            reject(new Error(result.message || '查询失败'))
          }
        } catch (error) {
          reject(error)
        }
      })
    }).on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * 判断是否为私有 IP（内网 IP）
 * @param {string} ip 
 * @returns {boolean}
 */
function isPrivateIP(ip) {
  if (!ip) return true
  
  // IPv4 私有地址范围
  const privateRanges = [
    /^10\./,                          // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,                    // 192.168.0.0/16
    /^127\./,                         // 127.0.0.0/8 (loopback)
    /^::1$/,                          // IPv6 loopback
    /^fe80:/,                         // IPv6 link-local
  ]
  
  return privateRanges.some(range => range.test(ip))
}

module.exports = {
  getRealIP,
  queryIPLocation,
  isPrivateIP,
}
