import { ApiError } from '@/core/errors.js';
import { EMAIL_REGEX, PASSWORD_REGEX, CODE_REGEX } from '@/core/constants.js';

export const validators = {
  email(value, silent = false) {
    if (!value) {
      if (silent) return false;
      throw new ApiError('Missing email', { status: 400 });
    }
    if (!EMAIL_REGEX.test(value)) {
      if (silent) return false;
      throw new ApiError('Invalid email format', { status: 400 });
    }
    return true;
  },
  password(value) {
    if (!value) {
      throw new ApiError('Missing password', { status: 400 });
    }
    if (!PASSWORD_REGEX.test(value)) {
      throw new ApiError('Weak password', { status: 400 });
    }
  },
  code(value) {
    if (!value) {
      throw new ApiError('Missing mail code', { status: 400 });
    }
    if (!CODE_REGEX.test(String(value))) {
      throw new ApiError('Mail code must be numeric', { status: 400 });
    }
  },
  username(value) {
    if (!value) {
      throw new ApiError('Missing username', { status: 400 });
    }
  },
  qq(value) {
    const v = String(value || '').trim();
    if (!/^\d{5,12}$/.test(v)) {
      throw new ApiError('Invalid qq', { status: 400 });
    }
  },
  secretForRole(role, secret) {
    const s = String(secret || '').trim();
    if (!s) {
      throw new ApiError('Missing secret', { status: 400 });
    }
    if (role === '原告') {
      if (!/^P-(\d{5,12})-(\d{5,12})-[a-z0-9]+$/i.test(s)) {
        throw new ApiError('Invalid secret', { status: 400 });
      }
      return;
    }
    if (role === '法官') {
      if (!/^J-[a-z0-9]+$/i.test(s)) {
        throw new ApiError('Invalid secret', { status: 400 });
      }
      return;
    }
    if (role === '被告') {
      if (!/^D-(\d{5,12})-[a-z0-9]+$/i.test(s)) {
        throw new ApiError('Invalid secret', { status: 400 });
      }
      return;
    }
    if (role === '观众') {
      if (!/^A-[a-z0-9]+$/i.test(s)) {
        throw new ApiError('Invalid secret', { status: 400 });
      }
    }
  },
};
