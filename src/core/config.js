// API配置管理模块 - 负责解析和合并API配置

import { API_DEFAULTS } from './constants.js';

/**
 * 读取环境变量配置
 * 使用try-catch处理环境变量读取失败的情况
 * @returns {Object} 环境变量对象
 */
function readEnv() {
  try {
    return import.meta?.env ?? {};
  } catch {
    return {};
  }
}

/**
 * 标准化基础URL
 * 处理URL末尾的冒号，并拼接端口
 * @param {string} baseUrl - 基础URL
 * @param {string|number} port - 端口号
 * @returns {string} 标准化的URL
 */
function normalizeBaseUrl(baseUrl, port) {
  const candidate = (baseUrl ?? '').trim() || API_DEFAULTS.baseUrl;
  if (candidate.endsWith(':') && port) {
    return `${candidate}${port}`;
  }
  return candidate;
}

/**
 * 解析API配置
 * 合并环境变量、默认配置和自定义配置
 * @param {Object} overrides - 自定义配置对象
 * @returns {Object} 完整的API配置对象
 */
export function resolveApiConfig(overrides = {}) {
  // 读取环境变量
  const env = readEnv();

  // 配置优先级：自定义配置 > 环境变量 > 默认配置
  const baseUrl = overrides.baseUrl ?? env.VITE_API_BASE_URL ?? API_DEFAULTS.baseUrl;
  const port = overrides.port ?? env.VITE_API_PORT ?? API_DEFAULTS.port;
  const apiKey = overrides.apiKey ?? env.VITE_API_KEY ?? API_DEFAULTS.apiKey;
  const tokenStorageKey = overrides.tokenStorageKey ?? env.VITE_TOKEN_STORAGE_KEY ?? API_DEFAULTS.tokenStorageKey;
  const mailAuthCode = overrides.mailAuthCode ?? env.VITE_MAIL_AUTH_CODE ?? '';

  // 返回标准化的配置对象
  return {
    baseUrl: normalizeBaseUrl(baseUrl, port),  // 标准化的API基础URL
    apiKey,                                    // API访问密钥
    tokenStorageKey,                          // 本地存储中token的键名
    mailAuthCode,
  };
}