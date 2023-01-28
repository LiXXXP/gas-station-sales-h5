import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

import util from '../utils/util'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/home',
    name: 'home',
    meta: {
      keepAlive: false, // 缓存
      requireAuth: false, // 需要登录
    },
    component: () => import('../views/home/home.vue')
  },
  {
    path: '/station',
    name: 'station',
    meta: {
      title: '站点简介',
      keepAlive: false, // 缓存
      requireAuth: true, // 需要登录
    },
    component: () => import('../views/station/station.vue')
  },
  {
    path: '/ambitus',
    name: 'ambitus',
    meta: {
      title: '周边信息',
      keepAlive: false, // 缓存
      requireAuth: true, // 需要登录
    },
    component: () => import('../views/ambitus/ambitus.vue')
  },
  {
    path: '/updating',
    name: 'updating',
    meta: {
      title: '站点信息更新',
      keepAlive: false, // 缓存
      requireAuth: true, // 需要登录
    },
    component: () => import('../views/updating/updating.vue')
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  /* 设置title */
  if (to.meta.title) {
    //@ts-ignore
    document.title = to.meta.title
  }

  if(util.getUrlParam('lat')) {
    localStorage.setItem('lat', util.getUrlParam('lat') || '')
    localStorage.setItem('lng', util.getUrlParam('lng') || '')
  }

  if (util.getUrlParam('accessToken')) {
    localStorage.setItem('accessToken', util.getUrlParam('accessToken') || '')
    localStorage.setItem('userId', util.getUrlParam('userId') || '')
  }

  if (to.meta.requireAuth) {
    if (!localStorage.getItem("accessToken")) {
      //@ts-ignore
      wx.miniProgram.navigateTo({ url: '/pages/index/index' })
    } else {
      next()
    }
  } else {
    next()
  }

})

export default router;