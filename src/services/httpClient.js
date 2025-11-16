// HTTP客户端模块 - 处理所有HTTP请求的核心模块

import { ApiError } from '@/core/errors.js';

/**
 * 标准化基础URL
 * 确保URL以斜杠结尾，便于后续路径拼接
 * @param {string} baseUrl - 基础URL
 * @returns {string} 标准化的基础URL
 */
function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return '';
  }
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

/**
 * 构建完整的请求URL
 * 将基础URL、路径和查询参数拼接成完整的URL
 * @param {string} baseUrl - 基础URL
 * @param {string} path - 请求路径
 * @param {Object} searchParams - 查询参数对象
 * @returns {string} 完整的请求URL
 */
function buildUrl(baseUrl, path, searchParams) {
  // 确保路径以斜杠开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // 支持相对基本路径（例如 '/api'）
  let full = '';
  if (!baseUrl) {
    full = normalizedPath;
  } else if (/^https?:\/\//i.test(baseUrl)) {
    full = new URL(normalizedPath, baseUrl).toString();
  } else {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    full = `${base}${normalizedPath}`;
  }

  // 处理查询参数
  if (searchParams && Object.keys(searchParams).length > 0) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      // 过滤掉undefined和null值
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    const queryString = params.toString();
    if (queryString) {
      full = `${full}?${queryString}`;
    }
  }

  return full;
}

/**
 * 解析JSON响应数据
 * 处理响应解析失败的情况，提供友好的错误信息
 * @param {Response} response - Fetch API响应对象
 * @returns {Promise<Object>} 返回解析后的数据
 * @throws {ApiError} 当响应格式无效时抛出错误
 */
async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    // 解析失败时抛出API错误
    throw new ApiError('Invalid server response', { status: response.status || 0 });
  }
}

/**
 * 创建HTTP客户端
 * 提供统一的HTTP请求接口，处理请求头、错误处理等
 * @param {Object} options - 配置选项
 * @param {string} options.baseUrl - API基础URL
 * @param {string} options.apiKey - API访问密钥
 * @returns {Object} HTTP客户端对象
 */
export function createHttpClient({ baseUrl, apiKey, timeoutMs = 8000 }) {
  // 标准化基础URL
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    /**
     * 发送HTTP请求
     * @param {string} path - 请求路径
     * @param {Object} options - 请求选项
     * @param {string} options.method - HTTP方法，默认为GET
     * @param {Object} options.body - 请求体数据
     * @param {Object} options.searchParams - URL查询参数
     * @param {Object} options.headers - 自定义请求头
     * @returns {Promise<Object>} 返回响应数据
     * @throws {ApiError} 当请求失败时抛出错误
     */
    async request(path, { method = 'GET', body, searchParams, headers: customHeaders } = {}) {
      // 构建请求头
      const headers = new Headers({
        ...customHeaders,
      });
      headers.set('Accept', 'application/json');
      // 仅在使用 cors.sh 代理时附加 API 密钥请求头
      if (apiKey && normalizedBaseUrl.includes('cors.sh')) {
        headers.set('x-cors-api-key', apiKey);
      }

      // 处理请求体
      let payloadBody;
      if (body !== undefined) {
        // 设置内容类型为JSON
        headers.set('Content-Type', 'application/json');
        // 序列化请求体
        payloadBody = JSON.stringify(body);
      }

      // 构建完整的请求URL
      const bases = [];
      bases.push(normalizedBaseUrl);
      const alt = normalizedBaseUrl.replace(/\/?api\/?$/i, '/');
      if (!bases.includes(alt)) bases.push(alt);
      if (!bases.includes('')) bases.push('');

      for (const b of bases) {
        const url = buildUrl(b, path, searchParams);
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          const response = await fetch(url, {
            method,
            headers,
            body: payloadBody,
            credentials: 'include',
            signal: controller.signal,
          });
          clearTimeout(timer);
          const payload = await parseJson(response);
          const successStatuses = new Set(['success', 'successed']);
          if (!response.ok || !successStatuses.has(payload.status)) {
            throw new ApiError(
              payload?.reason || response.statusText || 'Request failed',
              { status: response.status, payload },
            );
          }
          return payload;
        } catch (error) {
          if (error instanceof ApiError) throw error;
          if (error?.name === 'AbortError') {
            throw new ApiError('Request timeout', { status: 0 });
          }
        }
      }
      throw new ApiError('Invalid server response');
    },
  };
}