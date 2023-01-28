import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Vconsole from 'vconsole'

/* 引入公共样式 */
import './styles/common.css'

/** px2rem **/
import 'lib-flexible/flexible.js'
import 'amfe-flexible/index.js'

/** vant ui **/
import 'vant/lib/index.css'

import Vue3TouchEvents from "vue3-touch-events"

// vconsole调试
// const vConsole = new Vconsole()
// export default vConsole

const Vue = createApp(App)

Vue.use(store)
Vue.use(router)

Vue.use(Vue3TouchEvents)

Vue.mount('#app')
