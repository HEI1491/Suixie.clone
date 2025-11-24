// HTTP客户端模块 - 处理所有HTTP请求的核心模块

import { ApiError } from '@/core/errors.js';
import { API_DEFAULTS } from '@/core/constants.js';

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
  if (/^https?:\/\//i.test(path)) {
    let full = path;
    if (searchParams && Object.keys(searchParams).length > 0) {
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
      const queryString = params.toString();
      if (queryString) {
        full = `${full}${full.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    return full;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let full = '';
  if (!baseUrl) {
    full = normalizedPath;
  } else if (/^https?:\/\//i.test(baseUrl)) {
    const b = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const p = normalizedPath.startsWith('/') ? normalizedPath.slice(1) : normalizedPath;
    full = `${b}/${p}`;
  } else {
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    full = `${base}${normalizedPath}`;
  }
  if (searchParams && Object.keys(searchParams).length > 0) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
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
  const ct = (response.headers && response.headers.get && response.headers.get('content-type')) || '';
  const isJson = typeof ct === 'string' && ct.toLowerCase().includes('application/json');
  if (isJson) {
    try {
      return await response.json();
    } catch {
      throw new ApiError('Invalid server response', { status: response.status || 0 });
    }
  }
  try {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return { status: response.ok ? 200 : (response.status || 0), text };
    }
  } catch {
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
      try {
        const t = localStorage.getItem(API_DEFAULTS.tokenStorageKey) || '';
        if (t) headers.set('Authorization', `Bearer ${t}`);
      } catch {}
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

      const bases = [];
      const add = (b) => {
        const v = normalizeBaseUrl(b);
        if (!bases.includes(v)) bases.push(v);
      };
      if (!normalizedBaseUrl) {
        add('');
        add('/api');
        try {
          const envTarget = (typeof import.meta !== 'undefined' && import.meta.env) ? (import.meta.env.VITE_PROXY_TARGET || '') : '';
          if (envTarget) {
            add(envTarget);
            try {
              add(new URL('api/', envTarget).toString());
            } catch { add(envTarget.endsWith('/') ? (envTarget + 'api/') : (envTarget + '/api/')); }
          } else {
            add('http://localhost:7001');
            add('http://localhost:7001/api');
          }
        } catch {}
      } else if (/^https?:\/\//i.test(normalizedBaseUrl)) {
        add(normalizedBaseUrl);
        const endsWithApi = /\/api\/?$/.test(normalizedBaseUrl);
        if (!endsWithApi) {
          add(new URL('api/', normalizedBaseUrl).toString());
        }
      } else {
        add(normalizedBaseUrl);
        if (normalizedBaseUrl.replace(/\/$/, '') !== '/api') add('/api');
        else add('');
      }

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
          const successStatuses = new Set(['success', 'successed', 'ok', 'OK', 'SUCCESS', 'Success']);
          if (!response.ok) {
            const err = new ApiError(
              payload?.reason || response.statusText || 'Request failed',
              { status: response.status, payload },
            );
            if (response.status === 404) {
              continue;
            }
            throw err;
          }
          const hasStatusField = Object.prototype.hasOwnProperty.call(payload || {}, 'status');
          const hasCodeField = Object.prototype.hasOwnProperty.call(payload || {}, 'code');
          const hasSuccessField = Object.prototype.hasOwnProperty.call(payload || {}, 'success');
          const hasTokenField = Object.prototype.hasOwnProperty.call(payload || {}, 'token');
          if (hasStatusField || hasCodeField || hasSuccessField) {
            const st = payload.status;
            const code = payload.code;
            const succ = payload.success;
            const isSuccess = (typeof st === 'string' && (successStatuses.has(st) || st === '200'))
              || (typeof st === 'number' && st === 200)
              || (typeof st === 'boolean' && st === true)
              || (typeof code === 'number' && code === 200)
              || (typeof code === 'string' && code === '200')
              || (typeof succ === 'boolean' && succ === true);
            if (!isSuccess && !(hasTokenField && payload.token)) {
              throw new ApiError(
                payload?.reason || response.statusText || 'Request failed',
                { status: response.status, payload },
              );
            }
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