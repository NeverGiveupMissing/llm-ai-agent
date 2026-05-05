const Router = require('@koa/router')
const router = new Router({ prefix: '/interfaces' })

const controller = require('./controller')
const { authMiddleware } = require('../../middlewares/auth.middleware')
const { requirePermission } = require('../../middlewares/checkPermission')

// 应用认证中间件
router.use(authMiddleware())

// 获取接口列表（分页）
router.get('/', authMiddleware(), requirePermission('interface:query'), controller.list)

// 获取所有接口
router.get('/all', authMiddleware(), controller.all)

// 获取接口详情
router.get('/:id', authMiddleware(), requirePermission('interface:query'), controller.detail)

// 创建接口
router.post('/', authMiddleware(), requirePermission('interface:create'), controller.create)

// 更新接口
router.put('/:id', authMiddleware(), requirePermission('interface:update'), controller.update)

// 删除接口
router.delete('/:id', authMiddleware(), requirePermission('interface:delete'), controller.delete)

module.exports = router