import { createRouter, createWebHashHistory } from 'vue-router'
import { API_DEFAULTS } from '../core/constants.js'

const home = () => import('../components/home.vue')
const register = () => import('../components/register.vue')
const login = () => import('../components/NewLogin.vue')
const recover = () => import('../components/recover.vue')
const sign = () => import('../components/sign.vue')
const bindCode = () => import('../components/bindCode.vue')
const support = () => import('../components/CustomerService.vue')
const notFound = () => import('../components/NotFound.vue')

const routes = [
    { path: '/', component: home },
    { path: '/register', component: register },
    { path: '/login', component: login },
    { path: '/recover', component: recover, meta: { requiresAuth: true } },
    { path: '/sign', component: sign, meta: { requiresAuth: true } },
    { path: '/bindCode', component: bindCode },
    { path: '/support', component: support },
    { path: '/:pathMatch(.*)*', component: notFound }
]

const router = createRouter({
    history: createWebHashHistory('/'),
    routes
})

router.beforeEach((to, from, next) => {
    if (to.meta && to.meta.requiresAuth) {
        const token = localStorage.getItem(API_DEFAULTS.tokenStorageKey)
        const loginAtStr = localStorage.getItem(API_DEFAULTS.loginTimestampStorageKey)
        const loginAt = loginAtStr ? parseInt(loginAtStr) : 0
        const expired = !loginAt || Date.now() - loginAt > API_DEFAULTS.loginMaxAgeMs
        if (!token || expired) {
            localStorage.removeItem(API_DEFAULTS.tokenStorageKey)
            localStorage.removeItem(API_DEFAULTS.displayNameStorageKey)
            localStorage.removeItem(API_DEFAULTS.loginTimestampStorageKey)
            try { localStorage.setItem(API_DEFAULTS.preLoginMessageKey, '请先登录账号') } catch {}
            next({ path: '/login', query: { redirect: to.fullPath } })
            return
        }
    }
    next()
})


export default router
