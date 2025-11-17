// 引入Vite配置函数和必要的插件
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'  // Vue插件，用于处理.vue文件
import { resolve } from 'path'        // Node.js路径解析模块

// Vite配置文件
// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:7001'
  return {
    base: '/',
    plugins: [vue()],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        }
      }
    }
  }
})
