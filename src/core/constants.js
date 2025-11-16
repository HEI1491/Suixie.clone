// 应用常量定义模块 - 包含API默认配置和正则表达式

// API默认配置常量
export const API_DEFAULTS = {
  baseUrl: '/api',
  port: undefined,
  apiKey: '',
  tokenStorageKey: 'userToken',
  displayNameStorageKey: 'userDisplayName',
  loginTimestampStorageKey: 'userLoginAt',
  loginMaxAgeMs: 3 * 24 * 60 * 60 * 1000,
  preLoginMessageKey: 'preLoginMsg',
};

// 邮箱格式验证正则表达式
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 密码强度验证正则表达式
// 要求：至少8位，包含字母和数字，可包含特殊字符
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// 验证码格式验证正则表达式（纯数字）
export const CODE_REGEX = /^\d+$/;