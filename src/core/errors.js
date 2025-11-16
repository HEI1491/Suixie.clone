// 错误处理模块 - 定义应用中的错误类型和断言函数

/**
 * API错误类 - 用于封装API请求相关的错误信息
 * 扩展自原生Error类，添加了状态码和响应数据
 */
export class ApiError extends Error {
  /**
   * 创建API错误实例
   * @param {string} message - 错误消息
   * @param {Object} options - 错误选项
   * @param {number} options.status - HTTP状态码
   * @param {any} options.payload - 错误响应数据
   */
  constructor(message, { status = 0, payload } = {}) {
    super(message);
    this.name = 'ApiError';      // 错误类型名称
    this.status = status;        // HTTP状态码
    this.payload = payload;      // 错误响应数据
    this.reason = message;       // 错误原因（与message相同）
  }
}

/**
 * 断言函数 - 用于验证条件并抛出错误
 * @param {boolean} condition - 需要验证的条件
 * @param {string} message - 条件不满足时的错误消息
 * @param {Object} meta - 额外的错误元数据
 * @throws {ApiError} 当条件不满足时抛出ApiError
 */
export function assert(condition, message, meta) {
  if (!condition) {
    throw new ApiError(message, meta);
  }
}