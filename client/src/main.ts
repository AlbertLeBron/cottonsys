import Vue from 'vue'
import VueRouter from 'vue-router'
import router from '@/router/index';
import store from '@/store/index';
import PerfectScrollbar from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'
import PopupMenu from '@/components/base/PopupMenu.vue'
import Dropdown from '@/components/base/Dropdown.vue'
import App from '@/App.vue'
import { loginState } from '@/utils/Constant';
import { EventBus } from '@/EventBus';

Vue.config.productionTip = false

Vue.use(VueRouter)
Vue.use(PerfectScrollbar)

Vue.component('PopupMenu', PopupMenu)
Vue.component('Dropdown', Dropdown)

Vue.prototype.resizeScrollbar = (object: any, scrollbar: any) => {
  object?.contentWindow.addEventListener('resize', () => {
      scrollbar?.update();
  });
};

router.beforeEach(async (to, from, next) => {
  if(!((to.name === 'Login' && from.name === 'Register') || (to.name === 'Register' && from.name === 'Login'))) {
    EventBus.$emit('hideDialog');
  }
  EventBus.$emit('hideAlert');
  const logined = loginState();
  if (logined.status !== 1 && to.meta?.authentication !== 'no') {
    // 将用户重定向到页
    next ({ path: `/home/login?redirect=${to.path}` });
    if(logined.status === 0 || logined.status === 2) EventBus.$emit('showAlert', {title: `登录提醒`, content: `用户尚未登录，请先登录！`});
  } else next();
});

new Vue({
  store,
  router,
  render: h => h(App),
}).$mount('#app')
