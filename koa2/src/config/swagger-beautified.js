const path = require('path')
const fs = require('fs')
const config = require('./index')

/**
 * 统计路由文件中的接口数量
 */
function countRoutes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    // 匹配 router.get/post/put/delete/patch 调用
    const matches = content.match(/router\.(get|post|put|delete|patch)\(/g)
    return matches ? matches.length : 0
  } catch (error) {
    return 0
  }
}

/**
 * 统计所有模块的接口数量
 */
function countAllModuleRoutes() {
  const modulesDir = path.join(__dirname, '..', 'modules')
  const routesDir = path.join(__dirname, '..', 'routes')
  
  const moduleCounts = {}
  let totalCount = 0
  
  // 统计主路由文件
  const mainRouteFile = path.join(routesDir, 'index.js')
  if (fs.existsSync(mainRouteFile)) {
    const count = countRoutes(mainRouteFile)
    if (count > 0) {
      moduleCounts['主路由'] = count
      totalCount += count
    }
  }
  
  // 统计各模块路由文件
  if (fs.existsSync(modulesDir)) {
    const modules = fs.readdirSync(modulesDir)
    modules.forEach(module => {
      const modulePath = path.join(modulesDir, module)
      if (fs.statSync(modulePath).isDirectory()) {
        const routeFile = path.join(modulePath, 'routes.js')
        if (fs.existsSync(routeFile)) {
          const count = countRoutes(routeFile)
          if (count > 0) {
            // 使用模块名称（中文或英文）
            let moduleName = module
            if (module === 'login-log') moduleName = '登录日志'
            else if (module === 'operation-log') moduleName = '操作日志'
            else if (module === 'session-group') moduleName = '会话分组'
            else if (module === 'chat-memory') moduleName = '对话记忆'
            
            moduleCounts[moduleName] = count
            totalCount += count
          }
        }
      }
    })
  }
  
  return { moduleCounts, totalCount }
}

/**
 * 根据模块名称返回对应的 emoji 图标
 */
function getModuleIcon(moduleName) {
  const iconMap = {
    '主路由': '🚀',
    'chat': '💬',
    'logs': '📝',
    'session': '🗂️',
    '会话分组': '📁',
    '对话记忆': '🧠',
    'memory': '🧠',
    'interface': '🔌',
    'menu': '',
    'role': '',
    'user': '👤',
    'button': '🔘',
    '登录日志': '',
    '操作日志': '',
    'database': '💾',
    'api': '🌐',
    'captcha': '️',
    'upload': '',
    'health': '❤️',
    'permission': '',
  }
  return iconMap[moduleName] || ''
}

// 获取接口统计信息
const { moduleCounts, totalCount } = countAllModuleRoutes()

// 构建 tags 数组，包含接口数量
const tagsWithCount = [
  { name: 'chat', description: `聊天相关接口(${moduleCounts['chat'] || 0}个)` },
  { name: 'logs', description: `日志管理接口(${moduleCounts['logs'] || 0}个)` },
]

/**
 * Swagger 配置
 */
const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Chat API',
      version: '1.0.0',
      description: `AI 聊天 API - Node.js Koa2 JavaScript 实现

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 接口总览
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔢 接口总数：${totalCount} 个

📦 模块分布：
` + 
        Object.entries(moduleCounts)
          .map(([name, count]) => `  ├─ ${getModuleIcon(name)} ${name}: ${count} 个接口`)
          .join('\n') +
        `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}${config.api.prefix}`,
        description: '开发服务器',
      },
    ],
    tags: tagsWithCount,
  },
  apis: [
    path.join(__dirname, '..', 'routes', '*.js'),
    path.join(__dirname, '..', 'modules', '*', 'routes.js'),
  ],
}

module.exports = swaggerConfig
