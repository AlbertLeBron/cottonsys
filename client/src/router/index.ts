import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Introduction from '../views/Introduction.vue';

const originalPush = VueRouter.prototype.push,
      originalReplace = VueRouter.prototype.replace;
 
VueRouter.prototype.push = function push(location: any) {
  return (originalPush.call(this, location) as any).catch((err: any) => err);
};
 
VueRouter.prototype.replace = function push(location: any) {
  return (originalReplace.call(this, location) as any).catch((err: any) => err);
};

export default new VueRouter({
    routes: [
            {
                path: '/',
                redirect: '/home/introduction',
                meta: {authentication: 'no'}
            },
            {
                path: '/home',
                redirect: '/home/introduction',
                name: 'Home',
                component: Home, 
                children: [{
                    path: 'introduction',
                    name: 'Introduction',
                    component: Introduction,
                    meta: {authentication: 'no'}
                }, {
                    path: 'about',
                    name: 'About',
                    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
                    meta: {authentication: 'no'}
                },{
                    path: 'login',
                    name: 'Login',
                    component: Introduction,
                    meta: {authentication: 'no'}
                },{
                    path: 'register',
                    name: 'Register',
                    component: Introduction,
                    meta: {authentication: 'no'}
                }] 
            },
            {
                path: '/work',
                redirect: '/work/book',
                name: 'Work',
                component: () => import(/* webpackChunkName: "about" */ '../views/Work.vue'), 
                children: [{
                    path: 'book',
                    name: 'Book',
                    component: () => import(/* webpackChunkName: "about" */ '../views/Book.vue')
                }]
            },
            {
                path: '*',
                redirect: '/',
                meta: {authentication: 'no'}
            }
        ]
});