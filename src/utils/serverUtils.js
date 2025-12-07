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
  // 优先尝试通过 mindustry.icu 直接获取状态
  const directUrl = 'https://mindustry.icu/status';
  
  try {
    const response = await fetch(directUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.info) {
        server.status = parseServerInfo(data.info);
      } else {
        server.status = data;
      }
      server.url = directUrl;
      return;
    }
  } catch (e) {
    console.warn('Direct fetch failed, falling back to proxy urls', e);
  }

  if (!server.url) {
    server.status = { online: false, message: '未配置服务器地址' }
    return
  }
  for (const u of statusUrls) {
    try {
      const response = await fetch(u, { credentials: 'include' })
      if (!response.ok) throw new Error(String(response.status))
      const data = await response.json()
      if (data.info) {
        server.status = parseServerInfo(data.info)
      } else {
        server.status = data
      }
      server.url = u
      return
    } catch (_) {}
  }
  server.status = { online: false, message: '无法连接到服务器' }
}

export const fetchServerStatusRetry = async (server, statusUrls, attempts = 5, delay = 500) => {
  for (let i = 0; i < attempts; i++) {
    await fetchServerStatus(server, statusUrls)
    if (server.status && server.status.online) return
    await new Promise(r => setTimeout(r, delay * (i + 1)))
  }
}
