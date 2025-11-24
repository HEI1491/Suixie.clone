import { ApiError } from '@/core/errors.js';

export function createContentService({ http }) {
  if (!http) {
    throw new Error('createContentService requires an http client instance');
  }

  return {
    async getSponsor() {
      const payload = await http.request('/getSponsor');
      if (!payload?.data) {
        throw new ApiError('Invalid sponsor response', {
          status: 500,
          payload,
        });
      }

      return {
        status: 200,
        ...payload.data,
      };
    },

    async getShenrenList() {
      try {
        const payload = await http.request('/api/getList', { method: 'GET' });
        const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        
        return {
          status: 200,
          list: list.map((item) => ({
            id: item?.id ?? '',
            name: item?.lastName ?? '未知',
            totalExp: item?.totalExp ?? 0,
            totalTime: item?.totalTime ?? 0,
            lastTime: item?.lastTime ?? '',
          })),
        };
      } catch (_) {
        return { status: 200, list: [] };
      }
    },

    async getProfileByQQ(qq) {
      if (!qq) throw new ApiError('Missing qq', { status: 400 });
      const payload = await http.request('/getProfileInfo', {
        method: 'GET',
        searchParams: { qq },
      });
      const text = String(payload?.result || '');
      const pick = (label) => {
        const re = new RegExp(label + '\\[]:(.*)');
        const m = text.match(re);
        return m ? m[1].trim() : '';
      };
      const username = pick('当前绑定账号');
      const qqStr = pick('绑定的qq');
      const gid = pick('绑定的gid');
      const online = pick('总在线时间');
      const level = pick('当前等级');
      const coin = pick('当前柠檬币');
      const regTime = pick('注册时间');
      let currentExp = 0;
      let nextLevelExp = 0;
      {
        const m = text.match(/当前经验\(下一级所需经验\)\[]:(\d+)\((\d+)\)/);
        if (m) {
          currentExp = parseInt(m[1]);
          nextLevelExp = parseInt(m[2]);
        }
      }
      return {
        status: 200,
        data: {
          username,
          qq: qqStr,
          gid,
          onlineMinutes: parseFloat((online || '0').replace(/[^\d.]/g, '')),
          level,
          coin: parseInt((coin || '0').replace(/\D/g, '')),
          currentExp,
          nextLevelExp,
          registerTime: regTime,
        },
      };
    },

    async getServerStatus() {
      // Assuming the backend is configured to handle /status directly or via /api/status
      // The backend code javalin/serverStatus.kts defines get("status")
      // If httpClient adds /api prefix, it becomes /api/status.
      // If the backend is mounted at root, it might be just /status.
      // Let's try without leading slash to let httpClient handle it, or check if it should be 'status'
      const payload = await http.request('status', { method: 'GET' });
      return { status: 200, info: String(payload?.info || '') };
    },

    async broadcast(pwd, msg) {
      if (!pwd || !msg) throw new ApiError('Missing parameters', { status: 400 });
      const payload = await http.request('/broadcast', {
        method: 'GET',
        searchParams: { pwd, msg },
      });
      return { status: 200 };
    },

    async getUserProfile() {
      const payload = await http.request('/user/profileInfo', {
        method: 'GET',
      });
      if (!payload?.data) {
        throw new ApiError('Invalid profile response', { status: 500, payload });
      }
      return { status: 200, data: payload.data };
    },
  };
}
