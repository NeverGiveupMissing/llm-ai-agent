/**
 * 会话分组路由
 */

const Router = require('@koa/router')
const SessionGroupController = require('./controller')

const router = new Router({
  prefix: '/session-groups',
})

// ============================================
// 静态路由优先
// ============================================

// 获取用户的所有分组
router.get('/', SessionGroupController.getGroups)

// 创建分组
router.post('/', SessionGroupController.createGroup)

// 移动会话到分组（这个路由没有参数前缀，应该优先）
router.post('/sessions/:sessionId/move', SessionGroupController.moveSessionToGroup)

// ============================================
// 动态路由的具体路径（放在/:id之前）
// ============================================

// 置顶/取消置顶分组
router.post('/:id/pin', SessionGroupController.pinGroup)

// 移动会话到分组（新路由，保持兼容）
router.post('/:sessionId/move-to-group', SessionGroupController.moveSessionToGroup)

// ============================================
// 动态路由（作为兜底，放在最后）
// ============================================

// 更新分组
router.put('/:id', SessionGroupController.updateGroup)

// 删除分组
router.delete('/:id', SessionGroupController.deleteGroup)

module.exports = router