import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/getList': {
        target: process.env.VITE_LEADERBOARD_URL || 'http://127.0.0.1:3366',
        changeOrigin: true,
      },
      '/api/status': {
        target: 'http://localhost:7001',
        changeOrigin: true,
      },
      '/status': {
        target: 'http://localhost:7001',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/recover': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/genMailCode': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/signWithQQ': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/qqLogin': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/getSponsor': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/getProfileInfo': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:7001/api',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_WS_TARGET || 'http://localhost:7002',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
