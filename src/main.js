// 应用主入口文件 - 负责初始化Vue应用和配置

// 引入Vue核心函数和组件
import { createApp } from 'vue';
import App from './App.vue';                    // 根组件
import router from './router/index.js';         // 路由配置
import { createApiPlugin } from './plugins/api.js';  // API插件
import './assets/theme.css';                    // 全局主题样式

// 创建API插件实例
// 从环境变量获取API配置，提供默认值确保开发环境正常运行
const apiPlugin = createApiPlugin({
  baseUrl: import.meta.env.VITE_API_BASE_URL,   // API基础URL
  port: import.meta.env.VITE_API_PORT,         // API端口
  apiKey: import.meta.env.VITE_API_KEY,         // API密钥
});

// 创建Vue应用实例
const app = createApp(App);
// 注册路由插件
app.use(router);
// 注册API插件，使所有组件都能访问API客户端
app.use(apiPlugin);
// 挂载应用到DOM元素
app.mount('#app');
