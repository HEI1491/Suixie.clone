import { createRouter, createWebHashHistory } from 'vue-router'
import Court from '../components/Court.vue'
import { API_DEFAULTS } from '../core/constants.js'
import { validators } from '../services/validators.js'

const home = () => import('../components/home.vue')
const register = () => import('../components/register.vue')
const login = () => import('../components/NewLogin.vue')
const recover = () => import('../components/recover.vue')
const sign = () => import('../components/sign.vue')
const bindCode = () => import('../components/bindCode.vue')
const qqBind = () => import('../components/qqBind.vue')
const support = () => import('../components/CustomerService.vue')
// Court 页面改为静态导入，避免动态导入在重定向时的中止日志
const court = Court
const courtGate = () => import('../components/CourtGate.vue')
const courtAppeal = () => import('../components/CourtAppeal.vue')
const notFound = () => import('../components/NotFound.vue')
const profile = () => import('../components/profile.vue')

const routes = [
    { path: '/', component: home },
    { path: '/register', component: register },
    { path: '/login', component: login },
    { path: '/recover', component: recover, meta: { requiresAuth: true } },
    { path: '/sign', component: sign, meta: { requiresAuth: true } },
    { path: '/bindCode', component: bindCode },
    { path: '/qqBind', component: qqBind },
    { path: '/profile', component: profile, meta: { requiresAuth: true } },
    { path: '/support', component: support },
    { path: '/court', redirect: '/court/gate' },
    { path: '/court/gate', component: courtGate },
    { path: '/court/appeal', component: courtAppeal, meta: { requiresAuth: true } },
    { path: '/court/:role', component: court, props: true, beforeEnter: (to) => {
        const seg = to.params.role
        const map = { judge: '法官', plaintiff: '原告', defendant: '被告', audience: '观众' }
        const role = map[seg] || seg
        const secret = localStorage.getItem(`COURT_SECRET_${role}`) || ''
        try { validators.secretForRole(role, secret) } catch { return { path: '/court/gate', query: { role: seg } } }
      } },
    { path: '/:pathMatch(.*)*', component: notFound }
]

const router = createRouter({
    history: createWebHashHistory('/'),
    routes
})

router.onError((err) => {
    const msg = String(err && (err.message || err))
    if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('net::ERR_ABORTED')) return
    console.error(err)
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
