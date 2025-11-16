// Token存储管理模块 - 负责用户认证token的本地存储

/**
 * 创建token存储管理器
 * 提供安全的token读写操作，包含错误处理机制
 * @param {string} storageKey - 本地存储中使用的键名
 * @returns {Object} token存储管理器对象
 */
export function createTokenStore(storageKey) {
  // 设置默认存储键名，如果没有提供则使用'userToken'
  const key = storageKey || 'userToken';

  /**
   * 安全执行函数
   * 包装函数执行，捕获异常并返回默认值
   * @param {Function} fn - 要执行的函数
   * @returns {any} 函数执行结果，失败时返回null
   */
  const safeExecute = (fn) => {
    try {
      return fn();
    } catch {
      // 发生错误时返回null，避免应用崩溃
      return null;
    }
  };

  // 返回token存储管理器对象
  return {
    /**
     * 读取存储的token
     * @returns {string|null} 返回存储的token，失败时返回null
     */
    read() {
      return safeExecute(() => localStorage.getItem(key));
    },

    /**
     * 写入token到本地存储
     * @param {string} token - 要存储的token，传入null或空字符串将删除存储
     */
    write(token) {
      safeExecute(() => {
        if (token) {
          // 存储有效的token
          localStorage.setItem(key, token);
        } else {
          // 删除存储的token（用户登出时）
          localStorage.removeItem(key);
        }
      });
    },

    /**
     * 清除存储的token
     * 等同于write(null)，用于用户登出场景
     */
    clear() {
      safeExecute(() => localStorage.removeItem(key));
    },
  };
}