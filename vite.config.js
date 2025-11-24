// 引入Vite配置函数和必要的插件
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'  // Vue插件，用于处理.vue文件
import { resolve } from 'path'        // Node.js路径解析模块

// Vite配置文件
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:7001'
  const useMock = env.VITE_USE_DEV_MOCK === '1'
  return {
    base: '/',
    plugins: [
      vue(),
      {
        name: 'dev-mock',
        configureServer(server) {
          const sendJson = (res, obj) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(obj))
          }
          server.middlewares.use('/api/status', (req, res) => {
            sendJson(res, {
              online: true,
              version: '220',
              map: '123 幽柠之域试验地图',
              wave: '12',
              gameTime: '14.0',
              tps: '20',
              memory: '512 MB',
              playerCount: 3,
              totalUnits: 150,
              players: ['[lv.12]PlayerA', '[lv.3]PlayerB', '[未绑定]Guest']
            })
          })
          server.middlewares.use('/api/fsb', (req, res) => {
            sendJson(res, {
              data: [
                { uuid: 'u-001', uid: 'uid001', gid: 'g001', qq: '2124007978', last_ip: '127.0.0.1' },
                { uuid: 'u-002', uid: 'uid002', gid: 'g002', qq: '10086', last_ip: '10.0.0.2' }
              ]
            })
          })
          server.middlewares.use('/api/getSponsor', (req, res) => {
            sendJson(res, { data: { sponsors: [{ name: 'Mock Sponsor', amount: 10 }] } })
          })
          server.middlewares.use('/api/getProfileInfo', (req, res) => {
            const url = new URL(req.url || '', 'http://localhost')
            const qq = url.searchParams.get('qq') || '2124007978'
            const result = [
              `当前绑定账号[]:user_${qq}`,
              `绑定的qq[]:${qq}`,
              '绑定的gid[]:G123',
              '总在线时间[]:123 分钟',
              '当前等级[]:5',
              '当前柠檬币[]:10',
              '当前经验(下一级所需经验)[]:120(200)',
              '注册时间[]:2024-01-02'
            ].join('\n')
            sendJson(res, { result })
          })
          server.middlewares.use('/api/user/profileInfo', (req, res) => {
            sendJson(res, {
              data: {
                username: 'dev-user',
                email: 'dev@example.com',
                qq: '2124007978',
                gid: 'G123',
                level: '5',
                currentExp: 120,
                nextLevelExp: 200,
                coin: 10,
                onlineMinutes: 123,
                registerTime: '2024-01-02'
              }
            })
          })
          server.middlewares.use('/api/genMailCode', (req, res) => {
            sendJson(res, { code: '123456' })
          })
          server.middlewares.use('/api/login', async (req, res) => {
            let body = ''
            req.on('data', (c) => { body += c })
            req.on('end', () => {
              sendJson(res, { token: 'mock.jwt.token' })
            })
          })
          server.middlewares.use('/api/user/sign', (req, res) => {
            sendJson(res, { result: 'Sign successful' })
          })
          server.middlewares.use('/api/sendQQBindCode', (req, res) => {
            sendJson(res, { status: 200 })
          })
          server.middlewares.use('/api/verCode4Bind', (req, res) => {
            sendJson(res, { qq: '2124007978' })
          })
          server.middlewares.use('/api/qqLogin', (req, res) => {
            sendJson(res, { token: 'mock.jwt.token' })
          })
        }
      }
    ],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: useMock ? undefined : {
        '/api/getList': {
          target: 'http://127.0.0.1:3366',
          changeOrigin: true,
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        }
      }
    }
  }
})
