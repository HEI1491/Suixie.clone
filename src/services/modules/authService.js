import { ApiError } from '@/core/errors.js';
import { validators } from '../validators.js';

export function createAuthService({ http, tokenStore, mailAuthCode }) {
  if (!http) {
    throw new Error('createAuthService requires an http client instance');
  }

  return {
    async sendCode(mail) {
      validators.email(mail);
      const payload = await http.request('/genMailCode', {
        method: 'GET',
        searchParams: { mail, authCode: mailAuthCode || undefined },
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
      if (!account) {
        throw new ApiError('Missing account', { status: 400 });
      }
      if (!password) {
        throw new ApiError('Missing password', { status: 400 });
      }

      // 自动推断登录类型
      let type = 'username';
      if (validators.email(account, true)) { // true = silent check
        type = 'email';
      } else if (/^\d+$/.test(account) && account.length >= 5 && account.length <= 11) {
        // 假设5-11位纯数字可能是QQ号，或者是GID？
        // 既然不确定，这里优先尝试 username，或者可以尝试 QQ
        // 根据 javalin/login.kts，支持 username, email, gid, qq
        // 纯数字也可能是用户名，所以保持默认 username 比较安全，除非用户明确是 QQ 登录（通常有单独按钮）
        // 如果是邮箱，肯定包含 @
      }

      // 如果 account 包含 @，则强制设为 email
      if (account.includes('@')) {
        type = 'email';
      }

      const payload = await http.request('/login', {
        method: 'POST',
        body: {
          type,
          identifier: account,
          password,
        },
      });

      const token = (payload && payload.data && payload.data.token) || payload.token || '';
      if (token) {
        tokenStore?.write(token);
      }

      return {
        status: 200,
        token,
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

      {
        const token = (payload && payload.data && payload.data.token) || payload.token || '';
        if (token) tokenStore?.write(token);
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
      // 统一使用 /user/sign
      return this.sign();
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
      const token = (payload && payload.data && payload.data.token) || payload.token || '';
      if (token) tokenStore?.write(token);
      return { status: 200, token };
    },

    async getQQBindStatus() {
      const payload = await http.request('/user/bindStatus', {
        method: 'GET',
        searchParams: { type: 'qq' },
      });
      return { status: 200, bound: !!payload.bound, qq: payload.qq || '' };
    },

    async bindQQ(qq, code) {
      if (!qq) throw new ApiError('Missing qq', { status: 400 });
      if (!code) throw new ApiError('Missing code', { status: 400 });
      const payload = await http.request('/user/bindQQ', {
        method: 'POST',
        body: { qq, code },
      });
      return { status: 200, qq: payload.qq };
    },

    async unbindQQ() {
      const payload = await http.request('/user/unbindQQ', { method: 'POST' });
      return { status: 200, success: !!payload.success };
    },
  };
}
