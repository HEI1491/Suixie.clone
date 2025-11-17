import { ApiError } from '@/core/errors.js';
import { validators } from '../validators.js';

export function createAuthService({ http, tokenStore }) {
  if (!http) {
    throw new Error('createAuthService requires an http client instance');
  }

  return {
    async sendCode(mail) {
      validators.email(mail);
      const payload = await http.request('/genMailCode', {
        method: 'GET',
        searchParams: { mail },
      });

      if (typeof payload.code === 'undefined') {
        throw new ApiError('Invalid response format', {
          status: 500,
          payload,
        });
      }

      return { status: 200, code: payload.code };
    },

    async login(account, password) {
      validators.username(account);
      if (!password) {
        throw new ApiError('Missing password', { status: 400 });
      }

      const payload = await http.request('/login', {
        method: 'POST',
        body: {
          type: 'username',
          identifier: account,
          password,
        },
      });

      if (payload.token) {
        tokenStore?.write(payload.token);
      }

      return {
        status: 200,
        token: payload.token,
      };
    },

    async changePassword(oldPassword, newPassword) {
      if (!oldPassword || !newPassword) {
        throw new ApiError('Missing password', { status: 400 });
      }
      const payload = await http.request('/user/changePwd', {
        method: 'GET',
        searchParams: { oldPassword, newPassword },
      });
      return { status: 200 };
    },

    async register(account, password, code) {
      validators.username(account);
      validators.password(password);
      validators.code(code);

      const payload = await http.request('/register', {
        method: 'GET',
        searchParams: {
          username: account,
          password,
          mailCode: code,
        },
      });

      if (payload.token) {
        tokenStore?.write(payload.token);
      }

      return {
        status: 200,
        message: 'Registration successful',
      };
    },

    async recover(account) {
      validators.username(account);

      await http.request('/recover', {
        method: 'GET',
        searchParams: { username: account },
      });

      return {
        status: 200,
        message: 'Recovery successful',
      };
    },

    async sign() {
      const payload = await http.request('/user/sign', { method: 'GET' });
      return { status: 200, message: payload.result || 'Sign successful' };
    },

    async signUser() {
      const payload = await http.request('/user/sign', { method: 'GET' });
      return { status: 200, message: payload.result || 'Sign successful' };
    },

    async signWithQQ(qq) {
      if (!qq) {
        throw new ApiError('Missing qq', { status: 400 });
      }
      const payload = await http.request('/signWithQQ', {
        method: 'GET',
        searchParams: { qq },
      });
      return {
        status: 200,
        message: payload.result || 'Sign successful',
      };
    },

    async sendQQBindCode(qq) {
      if (!qq) {
        throw new ApiError('Missing qq', { status: 400 });
      }
      await http.request('/sendQQBindCode', {
        method: 'GET',
        searchParams: { qq },
      });
      return { status: 200, message: 'Code sent' };
    },

    async verifyQQBind(code) {
      if (!code) {
        throw new ApiError('Missing code', { status: 400 });
      }
      const payload = await http.request('/verCode4Bind', {
        method: 'GET',
        searchParams: { code },
      });
      return { status: 200, qq: payload.qq };
    },

    async qqLogin(qq, code) {
      if (!qq) throw new ApiError('Missing qq', { status: 400 });
      if (!code) throw new ApiError('Missing code', { status: 400 });
      const payload = await http.request('/qqLogin', {
        method: 'GET',
        searchParams: { qq, code },
      });
      if (payload.token) tokenStore?.write(payload.token);
      return { status: 200, token: payload.token };
    },
  };
}
