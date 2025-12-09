export const parseServerInfo = (infoString) => {
  const status = {
    online: true,
    version: '',
    map: '',
    wave: '',
    gameTime: '',
    tps: '',
    memory: '',
    playerCount: 0,
    totalUnits: 0,
    players: []
  }
  
  // 解析版本
  const versionMatch = infoString.match(/版本 (\d+)/)
  if (versionMatch) {
    status.version = versionMatch[1]
  }
  
  // 解析地图
  const mapMatch = infoString.match(/当前地图为:\s*\[([\d]+)\]([^\n]+)/)
  if (mapMatch) {
    status.map = `${mapMatch[1]} ${mapMatch[2]}`.trim()
  }
  
  // 解析波数和游戏时间
  const waveMatch = infoString.match(/波数:\s*(\d+)\s+本局游戏时间:\s*([\d.]+)分钟/)
  if (waveMatch) {
    status.wave = waveMatch[1]
    status.gameTime = waveMatch[2]
  }
  
  // 解析TPS和内存
  const tpsMemoryMatch = infoString.match(/服务器TPS:\s*(\d+)\s+内存占用\(MB\)\s*(\d+)/)
  if (tpsMemoryMatch) {
    status.tps = tpsMemoryMatch[1]
    status.memory = `${tpsMemoryMatch[2]} MB`
  }
  
  // 解析人数和单位数
  const countMatch = infoString.match(/当前人数:\s*(\d+)\s+总单位数:\s*(\d+)/)
  if (countMatch) {
    status.playerCount = parseInt(countMatch[1])
    status.totalUnits = parseInt(countMatch[2])
  }
  
  // 解析在线玩家
  const playerListMatch = infoString.match(/在线玩家:[\s\S]+/)
  if (playerListMatch) {
    const playerList = playerListMatch[0]
    const playerLines = playerList.split('\n').filter(line => line.trim())
    
    // 跳过第一行("在线玩家:")
    for (let i = 1; i < playerLines.length; i++) {
      const line = playerLines[i].trim()
      if (line) {
        // 创建玩家对象
        const player = {
          name: line,
          level: null, // 初始为null
          isUnbound: false
        }
        
        // 检查是否包含未绑定标签
        if (line.includes('[未绑定]')) {
          player.isUnbound = true
          // 移除未绑定标签并提取名称
          const unboundMatch = line.match(/\[未绑定\](\S+)/)
          if (unboundMatch) {
            player.name = unboundMatch[1]
          } else {
            // 如果没有匹配到，尝试移除标签后获取名称
            player.name = line.replace('[未绑定]', '').trim()
          }
        } else {
          // 尝试匹配等级和名称
          const playerMatch = line.match(/\[lv\.(\d+)\]([^|]+)/)
          if (playerMatch) {
            player.level = playerMatch[1] // 设置等级
            player.name = playerMatch[2]?.trim() || player.name
          } else {
            // 只有名称的情况
            player.name = line.trim()
          }
        }
        
        status.players.push(player)
      }
    }
  }
  
  return status
}

export const fetchServerStatus = async (server, statusUrls) => {
  // 优先尝试使用后端代理 /api/status 接口（如果存在），或者直接连接（如果允许 CORS）
  // 避免使用不稳定的 allorigins.win
  // 后端代理实现假设：/api/proxyStatus?url=... 或直接后端提供状态
  
  // 这里我们尝试直接请求后端提供的 status 接口，假设后端有转发能力，或者我们直接请求目标（如果目标支持CORS）
  // 由于用户反馈 allorigins 500 且卡顿，我们移除它，改用直接 fetch。
  // 注意：如果目标服务器不支持 CORS，这在浏览器端会失败。
  // 但既然用户说 "server status refresh also has problems... 500 Internal Server Error" 指向 allorigins，
  // 我们最好尝试让后端代理，或者如果是在 electron/tauri 环境下直接请求。
  // 鉴于这是一个 Web 项目，如果目标没有 CORS，必须通过自己的后端代理。
  
  // 假设后端 server.js 里的 /api/status 是自身状态，我们需要一个能获取游戏服务器状态的接口。
  // 暂时回退到直接请求，并建议用户配置后端代理。
  // 但为了解决眼下的 500 错误，我们尝试一个备用的公共代理，或者直接请求（如果 dev 环境配置了 proxy）。

  const targetUrl = 'http://ng.rainplay.cn:59046/status';
  
  // 尝试列表
  const candidates = [
    // 0. 优先尝试本地 API 转发 (支持 dev proxy 和 prod nginx)
    '/api/status',
    // 1. 尝试通过本项目后端转发 (需要在 vite.config.js 或 nginx 配置 /api/gameStatus -> target)
    // 假设我们有一个约定好的后端转发接口，如果没有，我们可能需要新增一个
    // 由于我们不能修改后端代码（用户只给了前端任务），我们只能尝试前端的变通方法。
    // 方法 A: 直接请求 (依赖 CORS)
    targetUrl,
    // 方法 B: 使用 cache-busted allorigins (优先使用带时间戳的 allorigins，因为 corsproxy.io 已失效)
    `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&timestamp=${Date.now()}`
  ];

  for (const url of candidates) {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) continue;
        let data;
        // allorigins 返回的格式是 { contents: "..." }
        if (url.includes('allorigins.win')) {
             const proxyData = await res.json();
             try {
                data = typeof proxyData.contents === 'string' ? JSON.parse(proxyData.contents) : proxyData.contents;
             } catch {
                data = proxyData.contents;
             }
        } else {
             // 直接请求通常返回 JSON
             const text = await res.text();
             try { data = JSON.parse(text); } catch { data = { info: text }; }
        }
        
        if (data) {
             if (data.info) {
                server.status = parseServerInfo(data.info);
             } else if (typeof data === 'string' && data.includes('版本')) {
                 server.status = parseServerInfo(data);
             } else {
                server.status = data;
             }
             server.url = targetUrl;
             return;
        }
    } catch (e) {
        console.warn('Status fetch failed for', url, e);
    }
  }

  // Fallback: 如果都失败了，保留原来的 allorigins 但增加超时控制，防止卡顿
  // (其实上面的循环已经包含了 cache-busted allorigins，这里作为兜底可以再试一次不带时间戳的，或者直接省略)
  server.status = { online: false, message: '无法连接到服务器' };
}

export const fetchServerStatusRetry = async (server, statusUrls, attempts = 5, delay = 500) => {
  for (let i = 0; i < attempts; i++) {
    await fetchServerStatus(server, statusUrls)
    if (server.status && server.status.online) return
    await new Promise(r => setTimeout(r, delay * (i + 1)))
  }
}
