import {createRouter, createWebHashHistory, } from 'vue-router'

const home = () => import('../components/home.vue')
const register = () => import('../components/register.vue')
const  login = () => import('../components/NewLogin.vue')
const recover = () => import('../components/recover.vue')
const sign = () => import('../components/sign.vue')
const bindCode = () => import('../components/bindCode.vue')
const sponsor = () => import('../components/Sponsor.vue')
const support = () => import('../components/CustomerService.vue')
const notFound = () => import('../components/NotFound.vue')

const routes = [
    { path: '/', component: home },
    { path: '/register', component: register },
    { path: '/login', component: login },
    { path: '/recover', component: recover },
    { path: '/sign', component: sign },
    { path: '/bindCode', component: bindCode },
    { path: '/sponsor', component: sponsor },
    { path: '/support', component: support },
    // 404路由，捕获所有未匹配的路径
    { path: '/:pathMatch(.*)*', component: notFound }
]

const router = createRouter({
    history: createWebHashHistory('/'),
    routes
})


export default router
