import { createBlogRouter, createBlogRoutes } from '@framework/router'

const AdminConfigView = () => import('../admin/AdminConfigView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

export function createSiteRouter(options = {}) {
  const routes = [
    {
      path: '/admin',
      redirect: '/admin/config',
      meta: { standalone: true }
    },
    {
      path: '/admin/config',
      name: 'AdminConfig',
      component: AdminConfigView,
      meta: {
        title: '站点管理',
        standalone: true
      }
    },
    ...createBlogRoutes(options.routePatterns, options.menuConfig),
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFoundView,
      meta: {
        title: '页面未找到'
      }
    }
  ]

  return createBlogRouter({
    ...options,
    routes
  })
}

export default createSiteRouter
