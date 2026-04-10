import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/layout/index.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        meta: { title: '首页', parent: '' },
        component: () => import('../views/home/index.vue')
      },
      {
        path: 'member',
        meta: { title: '会员管理', parent: '' },
        component: () => import('../views/member/index.vue')
      },
      {
        path: 'member/register',
        meta: { title: '注册会员', parent: '会员管理' },
        component: () => import('../views/member/register.vue')
      },
      {
        path: 'memberCard',
        meta: { title: '会员卡管理', parent: '' },
        component: () => import('../views/memberCard/index.vue')
      },
      {
        path: 'memberCard/bind',
        meta: { title: '绑定新卡', parent: '会员卡管理' },
        component: () => import('../views/memberCard/bind.vue')
      },
      {
        path: 'cardTemplate',
        meta: { title: '卡模板', parent: '' },
        component: () => import('../views/cardTemplate/index.vue')
      },
      {
        path: 'store',
        meta: { title: '门店管理', parent: '' },
        component: () => import('../views/store/index.vue')
      },
      {
        path: 'staff',
        meta: { title: '员工管理', parent: '' },
        component: () => import('../views/staff/index.vue')
      },
      {
        path: 'serviceItem',
        meta: { title: '服务项目', parent: '' },
        component: () => import('../views/serviceItem/index.vue')
      },
      {
        path: 'consume',
        meta: { title: '收银台', parent: '' },
        component: () => import('../views/consume/pay.vue')
      },
      {
        path: 'consume/records',
        meta: { title: '消费记录', parent: '收银' },
        component: () => import('../views/consume/index.vue')
      },
      {
        path: 'recharge',
        meta: { title: '充值记录', parent: '' },
        component: () => import('../views/recharge/index.vue')
      },
      {
        path: 'points',
        meta: { title: '积分记录', parent: '' },
        component: () => import('../views/points/index.vue')
      },
      {
        path: 'points/goods',
        meta: { title: '积分商品', parent: '积分管理' },
        component: () => import('../views/points/goods.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router