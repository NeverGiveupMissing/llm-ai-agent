import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
import { registerGlobalComponents } from './components'
import permissionDirective from './directives/permission'

// ✅ 静默 Vue Router 的警告（仅在开发环境下保留其他警告）
const originalWarn = console.warn
console.warn = (...args) => {
  // 过滤掉动态路由未注册的警告
  if (args[0]?.includes?.('[Vue Router warn]') && args[0]?.includes?.('No match found')) {
    return
  }
  originalWarn.apply(console, args)
}

// 引入全局样式
import './styles/markdown-styles.css'

// 引入路由守卫（会自动执行）
import './router/guard'

// 创建 pinia 实例
const pinia = createPinia()

// 创建应用
const app = createApp(App)

console.log('🚀 Vue 应用开始初始化...')
console.log('📦 Pinia 实例:', pinia)
console.log('🛣️ Router 实例:', router)

// 按顺序使用插件
app.use(pinia) // 1. 先使用 pinia
app.use(router) // 2. 再使用路由
app.use(naive) // 3. 最后使用 naive-ui

// 注册全局公共组件
registerGlobalComponents(app)

// 注册权限指令
app.directive('permission', permissionDirective)

// ✅ 恢复用户信息（从 localStorage）
import { useUserStore } from './stores/modules/user'
const userStore = useUserStore()
if (userStore.token) {
  userStore.restoreUserInfo()
  console.log('✅ 已恢复用户信息:', userStore.userInfo)
}

// 初始化菜单（可选，如果 state 中已定义则不需要）
import { useMenuStore } from './stores/modules/menu'
const menuStore = useMenuStore()
console.log('菜单选项:', menuStore.menuOptions) // 调试：查看菜单是否有数据

// 挂载应用
console.log('✅ Vue 应用准备挂载到 #app')
app.mount('#app')
console.log('✅ Vue 应用已成功挂载！')

// 调试：检查 DOM 结构
setTimeout(() => {
  const appElement = document.getElementById('app')
  console.log('🔍 DOM 检查:', appElement?.innerHTML?.substring(0, 500))
  
  // 检查路由当前状态
  const currentRoute = router.currentRoute.value
  console.log('🛣️ 当前路由:', currentRoute)
  console.log('🛣️ 当前路由 name:', currentRoute.name)
  console.log('🛣️ 当前路由 matched:', currentRoute.matched)
  console.log('🛣️ 路由 matched 长度:', currentRoute.matched?.length)
  
  if (currentRoute.matched && currentRoute.matched.length > 0) {
    console.log('✅ 路由已匹配！组件信息:')
    currentRoute.matched.forEach((route, index) => {
      console.log(`  [${index}]`, route.name, '->', route.path, route.components)
    })
  } else {
    console.error('❌ 没有匹配任何路由！')
  }
}, 500)