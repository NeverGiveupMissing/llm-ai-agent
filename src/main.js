import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import naive from 'naive-ui'
import { registerGlobalComponents } from './components'

// 创建 pinia 实例
const pinia = createPinia()

// 创建应用
const app = createApp(App)

// 按顺序使用插件
app.use(pinia) // 1. 先使用 pinia
app.use(router) // 2. 再使用路由
app.use(naive) // 3. 最后使用 naive-ui

// 注册全局公共组件
registerGlobalComponents(app)

// 初始化菜单（可选，如果 state 中已定义则不需要）
import { useMenuStore } from './stores/modules/menu'
const menuStore = useMenuStore()
console.log('菜单选项:', menuStore.menuOptions) // 调试：查看菜单是否有数据

// 挂载应用
app.mount('#app')
