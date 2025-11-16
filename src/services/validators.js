// 输入验证器模块 - 提供各种表单验证功能

import { ApiError } from '@/core/errors.js';
import { EMAIL_REGEX, PASSWORD_REGEX, CODE_REGEX } from '@/core/constants.js';

/**
 * 验证器对象 - 包含各种输入验证函数
 * 每个验证函数在验证失败时都会抛出ApiError
 */
export const validators = {
  /**
   * 邮箱地址验证
   * 检查邮箱格式是否正确，以及是否为空
   * @param {string} value - 要验证的邮箱地址
   * @throws {ApiError} 当邮箱格式无效或为空时抛出错误
   */
  email(value) {
    // 检查是否为空
    if (!value) {
      throw new ApiError('Missing email', { status: 400 });
    }
    // 检查格式是否正确
    if (!EMAIL_REGEX.test(value)) {
      throw new ApiError('Invalid email format', { status: 400 });
    }
  },

  /**
   * 密码验证
   * 检查密码强度是否符合要求
   * @param {string} value - 要验证的密码
   * @throws {ApiError} 当密码为空或强度不够时抛出错误
   */
  password(value) {
    // 检查是否为空
    if (!value) {
      throw new ApiError('Missing password', { status: 400 });
    }
    // 检查强度是否符合要求（至少8位，包含字母和数字）
    if (!PASSWORD_REGEX.test(value)) {
      throw new ApiError('Weak password', { status: 400 });
    }
  },

  /**
   * 验证码验证
   * 检查验证码是否为纯数字
   * @param {string|number} value - 要验证的验证码
   * @throws {ApiError} 当验证码为空或格式不正确时抛出错误
   */
  code(value) {
    // 检查是否为空
    if (!value) {
      throw new ApiError('Missing mail code', { status: 400 });
    }
    // 检查是否为纯数字
    if (!CODE_REGEX.test(String(value))) {
      throw new ApiError('Mail code must be numeric', { status: 400 });
    }
  },

  /**
   * 用户名验证
   * 检查用户名是否为空
   * @param {string} value - 要验证的用户名
   * @throws {ApiError} 当用户名为空时抛出错误
   */
  username(value) {
    // 检查是否为空
    if (!value) {
      throw new ApiError('Missing username', { status: 400 });
    }
  },
};