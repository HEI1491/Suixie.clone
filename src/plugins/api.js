// API插件模块 - 提供Vue应用的API客户端集成

import { inject } from 'vue';
import { createApiClient } from '@/services/apiClient.js';

// 创建唯一的Symbol标识符，用于依赖注入
const API_SYMBOL = Symbol('api-client');

/**
 * 创建API插件
 * 用于在Vue应用中全局提供API客户端
 * @param {Object} options - API客户端配置选项
 * @returns {Object} Vue插件对象
 */
export function createApiPlugin(options = {}) {
  // 创建API客户端实例
  const client = createApiClient(options);

  return {
    /**
     * Vue插件安装函数
     * @param {Object} app - Vue应用实例
     */
    install(app) {
      // 使用provide/inject模式提供API客户端
      app.provide(API_SYMBOL, client);
      // 同时在全局属性上挂载，支持传统的this.$api访问方式
      app.config.globalProperties.$api = client;
    },
  };
}

/**
 * 使用API客户端的Composition API函数
 * 在组件中使用此函数获取API客户端实例
 * @returns {Object} API客户端实例
 * @throws {Error} 当API插件未安装时抛出错误
 */
export function useApi() {
  // 通过依赖注入获取API客户端
  const api = inject(API_SYMBOL);
  if (!api) {
    throw new Error('API client is not available. Did you forget to install the api plugin?');
  }
  return api;
}