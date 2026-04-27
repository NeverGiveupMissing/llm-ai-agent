/**
 * 会话分组路由
 */

const Router = require('@koa/router')
const SessionGroupController = require('./controller')

const router = new Router({
  prefix: '/session-groups',
})

// 获取用户的所有分组
router.get('/', SessionGroupController.getGroups)

// 创建分组
router.post('/', SessionGroupController.createGroup)

// 更新分组
router.put('/:id', SessionGroupController.updateGroup)

// 删除分组
router.delete('/:id', SessionGroupController.deleteGroup)

// 置顶/取消置顶分组
router.post('/:id/pin', SessionGroupController.pinGroup)

// 移动会话到分组
router.post('/sessions/:sessionId/move', SessionGroupController.moveSessionToGroup)

// 移动会话到分组（新路由，保持兼容）
router.post('/:sessionId/move-to-group', SessionGroupController.moveSessionToGroup)

module.exports = router
