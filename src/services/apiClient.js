// API客户端主模块 - 提供统一的API访问接口

import { resolveApiConfig } from '@/core/config.js';
import { createHttpClient } from './httpClient.js';
import { createTokenStore } from './tokenStore.js';
import { createAuthService } from './modules/authService.js';
import { createContentService } from './modules/contentService.js';

/**
 * API客户端类 - 应用程序与后端API交互的主要接口
 * 整合了HTTP客户端、token存储和各种服务模块
 */
export class ApiClient {
  /**
   * 创建API客户端实例
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    // 解析并合并配置（自定义配置 > 环境变量 > 默认配置）
    this.config = resolveApiConfig(options);
    
    // 创建token存储实例，用于管理用户认证token
    this.tokenStore = createTokenStore(this.config.tokenStorageKey);
    
    // 创建HTTP客户端实例，处理实际的HTTP请求
    this.http = createHttpClient({
      baseUrl: this.config.baseUrl,    // API基础URL
      apiKey: this.config.apiKey,      // API访问密钥
    });

    // 集成各种服务模块
    this.services = {
      // 认证相关服务（登录、注册、找回密码等）
      ...createAuthService({ http: this.http, tokenStore: this.tokenStore }),
      // 内容相关服务（获取赞助商信息、封神榜等）
      ...createContentService({ http: this.http }),
    };
  }

  /**
   * 通用HTTP请求方法
   * @param {string} path - 请求路径
   * @param {Object} options - 请求选项
   * @returns {Promise} 返回Promise对象
   */
  request(path, options) {
    return this.http.request(path, options);
  }

  /**
   * 读取存储的token
   * @returns {string|null} 返回token或null
   */
  readToken() {
    return this.tokenStore.read();
  }

  /**
   * 设置token到存储
   * @param {string} token - 要存储的token
   */
  setToken(token) {
    this.tokenStore.write(token);
  }

  /**
   * 清除存储的token
   */
  clearToken() {
    this.tokenStore.clear();
  }

  // 以下是认证相关服务的代理方法

  /**
   * 发送验证码
   * @param {string} mail - 邮箱地址
   * @returns {Promise} 返回Promise对象
   */
  sendCode(...args) {
    return this.services.sendCode(...args);
  }

  /**
   * 用户登录
   * @param {string} account - 账号
   * @param {string} password - 密码
   * @returns {Promise} 返回Promise对象
   */
  login(...args) {
    return this.services.login(...args);
  }

  /**
   * 用户注册
   * @param {string} account - 账号
   * @param {string} password - 密码
   * @param {string} code - 验证码
   * @returns {Promise} 返回Promise对象
   */
  register(...args) {
    return this.services.register(...args);
  }

  /**
   * 找回密码
   * @param {string} account - 账号
   * @returns {Promise} 返回Promise对象
   */
  recover(...args) {
    return this.services.recover(...args);
  }

  /**
   * 用户签到
   * @param {string} account - 账号
   * @returns {Promise} 返回Promise对象
   */
  sign(...args) {
    return this.services.sign(...args);
  }

  signUser(...args) {
    return this.services.signUser(...args);
  }

  signWithQQ(...args) {
    return this.services.signWithQQ(...args);
  }

  sendQQBindCode(...args) {
    return this.services.sendQQBindCode(...args);
  }

  verifyQQBind(...args) {
    return this.services.verifyQQBind(...args);
  }

  qqLogin(...args) {
    return this.services.qqLogin(...args);
  }

  // 以下是内容相关服务的代理方法

  /**
   * 获取赞助商信息
   * @returns {Promise} 返回Promise对象
   */
  getSponsor(...args) {
    return this.services.getSponsor(...args);
  }

  /**
   * 获取封神榜列表
   * @returns {Promise} 返回Promise对象
   */
  getFengshenList(...args) {
    return this.services.getFengshenList(...args);
  }

  getProfileByQQ(...args) {
    return this.services.getProfileByQQ(...args);
  }

  getUserProfile(...args) {
    return this.services.getUserProfile(...args);
  }
}

/**
 * 创建API客户端实例的工厂函数
 * @param {Object} options - 配置选项
 * @returns {ApiClient} 返回API客户端实例
 */
export function createApiClient(options) {
  return new ApiClient(options);
}

// 导出ApiError类，方便外部使用
export { ApiError } from '@/core/errors.js';