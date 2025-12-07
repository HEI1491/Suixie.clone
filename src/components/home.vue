<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { API_DEFAULTS } from '@/core/constants.js'
import BeianFooter from '@/components/BeianFooter.vue'
import '../assets/register.css'

const router = useRouter()
const { themePreference, resolvedTheme, themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const showHitokoto = ref(true) // 控制一言窗口显示
const hitokotoCollapsed = ref(false) // 控制一言窗口是否收纳于左侧

// 注入全局音乐控制（提供安全默认值，防止注入失败导致页面逻辑中断）
const musicCtx = inject('music', {
  musicPaused: ref(true),
  currentMusic: ref(null as string | null),
  musicProgress: ref(0),
  toggleMusic: async () => {},
  nextMusic: async () => {}
}) as {
  musicPaused: ReturnType<typeof ref<boolean>>,
  currentMusic: ReturnType<typeof ref<string | null>>,
  musicProgress: ReturnType<typeof ref<number>>,
  toggleMusic: () => Promise<void> | void,
  nextMusic: () => Promise<void> | void
}
const { musicPaused, currentMusic, musicProgress, toggleMusic, nextMusic } = musicCtx

// 服务器状态相关
const statusUrls = [
  (typeof window !== 'undefined' ? window.location.origin : '') + '/status',
  // 移除 404 的 /api/status
  // (typeof window !== 'undefined' ? window.location.origin : '') + '/api/status'
]
const servers = ref([
  { id: 1, name: '幽柠之域', url: statusUrls[0], status: null, expanded: false, mapExpanded: false }
])
const serverLoading = ref(false)

// 神人榜相关
import { createApiClient } from '@/services/apiClient.js'
const apiClient = createApiClient()
const shenrenLoading = ref(false)
const shenrenError = ref('')
const shenrenList = ref([])

const fetchShenrenList = async () => {
  shenrenLoading.value = true
  shenrenError.value = ''
  try {
    const res = await apiClient.getShenrenList()
    shenrenList.value = res.list || []
  } catch (err) {
    shenrenError.value = err?.reason || err?.message || '获取神人榜失败'
    shenrenList.value = []
  } finally {
    shenrenLoading.value = false
  }
}

const hitokotoContent = ref('') // 一言内容
const hitokotoFrom = ref('') // 一言来源
const hitokotoCache = ref([]) // 缓存的一言数据
const currentCacheIndex = ref(-1) // 当前显示的缓存索引

// 功能按钮数据
const features = ref([
  { id: 0, title: '每日签到', path: 'sign', icon: '📅' },
  { id: 1, title: '幽柠规则', path: 'bindCode', icon: '📜' },
  { id: 2, title: '找回密码', path: 'recover', icon: '🔑' },
  { id: 3, title: '联系客服', path: 'support', icon: '🆘' },
  { id: 4, title: '幽柠法庭', path: 'court', icon: '⚖️' }
  // { id: 4, title: '绑定QQ', path: 'qqBind', icon: '🔗' }
])

// 导航到指定路径
const navigateTo = (path: string) => {
  router.push(`/${path}`)
}

const tokenKey = API_DEFAULTS.tokenStorageKey
const nameKey = API_DEFAULTS.displayNameStorageKey
const tsKey = API_DEFAULTS.loginTimestampStorageKey
const maxAge = API_DEFAULTS.loginMaxAgeMs
const userId = ref<string | null>(null)
const userName = ref<string | null>(null)
const isLoggedIn = computed(() => !!userId.value)
const parseJwtSub = (token: string) => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.sub ?? null
  } catch {
    return null
  }
}
const syncAuth = async () => {
  const t = apiClient.readToken() || ''
  const atStr = localStorage.getItem(tsKey)
  let at = atStr ? parseInt(atStr) : 0
  
  // 如果有 token 但没有时间戳（可能是 cookie 恢复或注入的），重置时间戳
  if (t && !at) {
    at = Date.now()
    localStorage.setItem(tsKey, at.toString())
  }

  const expired = !at || Date.now() - at > maxAge
  if (!t || expired) {
    apiClient.clearToken()
    localStorage.removeItem(nameKey)
    localStorage.removeItem(tsKey)
    userId.value = null
    userName.value = null
    return
  }
  userId.value = parseJwtSub(t)
  
  // 尝试获取用户名
  let name = localStorage.getItem(nameKey)
  if (!name && userId.value) {
    try {
      const res = await apiClient.getUserProfile()
      const data = res.data || {}
      // 优先显示用户名，其次是昵称、QQ、邮箱
      name = data.username || data.nickname || data.qq || data.email
      if (name) {
        localStorage.setItem(nameKey, name)
      }
    } catch (e) {
      console.error('Failed to fetch user profile', e)
    }
  }
  userName.value = name
}
const logout = () => {
  apiClient.clearToken()
  localStorage.removeItem(nameKey)
  localStorage.removeItem(tsKey)
  syncAuth()
  router.push('/')
}

// 切换主题模式 - 添加扩散动效
const toggleDarkMode = (event: MouseEvent) => {
  // 获取点击位置
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 创建扩散动画元素
  const ripple = document.createElement('div');
  ripple.classList.add('theme-ripple');
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  target.appendChild(ripple);
  
  // 切换主题
  cycleThemePreference();
  
  // 清理动画元素
  ripple.addEventListener('animationend', () => {
    ripple.remove();
  });
}

const easterAudio = ref<HTMLAudioElement | null>(null)
const playEasterEgg = () => {
  if (!easterAudio.value) easterAudio.value = new Audio('/彩蛋.mp3')
  if (easterAudio.value) {
    easterAudio.value.currentTime = 0
    easterAudio.value.play().catch(() => {})
  }
}

// 触发高速旋转特效
const triggerSpinEffect = () => {
  const appEl = document.getElementById('app')
  if (appEl) {
    appEl.style.transition = 'transform 1s ease-in'
    // 强制重绘
    void appEl.offsetWidth
    appEl.classList.add('super-spin')
  }
}

// 解析服务器info字符串
const parseServerInfo = (infoString) => {
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

// 获取服务器状态
const fetchServerStatus = async (server) => {
  // 优先尝试通过 mindustry.icu 直接获取状态
  // 修正：使用 /status 而不是 /api/status
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

const fetchServerStatusRetry = async (server, attempts = 5, delay = 500) => {
  for (let i = 0; i < attempts; i++) {
    await fetchServerStatus(server)
    if (server.status && server.status.online) return
    // 增加延迟，每次重试等待时间稍长，避免请求过于密集
    // 第一次等待500ms，第二次等待1000ms，以此类推
    await new Promise(r => setTimeout(r, delay * (i + 1)))
  }
}

// 获取所有服务器状态
const fetchAllServerStatus = async () => {
  serverLoading.value = true
  await Promise.all(servers.value.map(server => fetchServerStatusRetry(server)))
  serverLoading.value = false
}

// 切换服务器在线玩家展开状态
const toggleServerExpanded = (server) => {
  server.expanded = !server.expanded
}

// 切换地图名称展开状态
const toggleMapExpanded = (server) => {
  server.mapExpanded = !server.mapExpanded
}

// 截断地图名称为固定长度
const truncateMapName = (mapName) => {
  if (!mapName) return 'N/A'
  // 固定显示最多15个字符
  const maxLength = 15
  return mapName.length > maxLength ? mapName.substring(0, maxLength) + '...' : mapName
}



// 获取一言数据
const fetchHitokoto = async () => {
  try {
    // 检查是否有缓存且还有未显示的缓存数据
    if (hitokotoCache.value.length > 0 && currentCacheIndex.value < hitokotoCache.value.length - 1) {
      currentCacheIndex.value++
      const cachedData = hitokotoCache.value[currentCacheIndex.value]
      hitokotoContent.value = (cachedData as { hitokoto: string }).hitokoto
      hitokotoFrom.value = (cachedData as { from: string }).from
      return
    }
    
    // 如果没有更多缓存数据，则从API获取新数据
    const response = await fetch('https://v1.hitokoto.cn/')
    const data = await response.json()
    
    // 更新当前显示的内容
    hitokotoContent.value = data.hitokoto || '暂无一言数据'
    hitokotoFrom.value = (data as { from?: string }).from || ''

    
    // 更新缓存，保持最多3条
    (hitokotoCache.value as { hitokoto: string; from: string }[]).push({ hitokoto: hitokotoContent.value, from: hitokotoFrom.value })
    if (hitokotoCache.value.length > 3) {
      hitokotoCache.value.shift() // 移除最旧的数据
    }
    currentCacheIndex.value = hitokotoCache.value.length - 1
  } catch (error) {
    console.error('获取一言失败:', error)
    // 如果出错，尝试使用缓存数据
    if (hitokotoCache.value.length > 0) {
      currentCacheIndex.value = (currentCacheIndex.value + 1) % hitokotoCache.value.length
      const cachedData = hitokotoCache.value[currentCacheIndex.value]
      hitokotoContent.value = (cachedData as { hitokoto: string }).hitokoto
      hitokotoFrom.value = (cachedData as { from: string }).from
    } else {
      hitokotoContent.value = '获取一言失败，请稍后重试'
      hitokotoFrom.value = ''
    }
  }
}

// 收纳一言窗口到左侧
const closeHitokoto = () => {
  hitokotoCollapsed.value = true
}

// 重新打开一言窗口
const openHitokoto = () => {
  hitokotoCollapsed.value = false
}

onMounted(() => {
    if (musicEl.value) {
      try { musicEl.value.preload = 'none' } catch {}
      musicEl.value.onended = () => {
        if (!musicPaused.value) playRandomMusic()
      }
      musicEl.value.ontimeupdate = () => {
        if (musicEl.value && musicEl.value.duration) {
          musicProgress.value = (musicEl.value.currentTime / musicEl.value.duration) * 100
        } else {
          musicProgress.value = 0
        }
      }
    }
    // 获取一言数据
    fetchHitokoto()
    
    // 获取服务器状态
    fetchAllServerStatus()
    
    // 获取神人榜
    fetchShenrenList()
    // loadMusicList() // 移至 App.vue
    syncAuth()
    const onStorage = (e: StorageEvent) => {
      if (e.key === tokenKey) syncAuth()
    }
    window.addEventListener('storage', onStorage)
    
    // 每60秒刷新一次服务器状态（从API获取数据而不是刷新网页）
    const statusInterval = setInterval(fetchAllServerStatus, 60000)

    // 每300秒刷新一次神人榜
    const shenrenInterval = setInterval(fetchShenrenList, 300000)
    
    // 清理定时器
  onUnmounted(() => {
    clearInterval(statusInterval)
    clearInterval(shenrenInterval)
    window.removeEventListener('storage', onStorage as any)
  })
})

onUnmounted(() => {
  // try { musicEl.value?.pause() } catch {} // 移至 App.vue
  // musicEl.value = null
})

</script>

<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <!-- 网站Logo -->
      <div class="site-logo">
        <div class="logo-content" @click="playEasterEgg" title="点击播放彩蛋">
          <img src="/vite.svg" alt="Logo" class="logo-icon">
          <span class="logo-text">幽柠之域</span>
        </div>
      </div>
      <div class="auth-buttons">
        <button class="header-btn theme-toggle" @click="toggleDarkMode" :title="themeToggleLabel">
          {{ themeIcon }}
        </button>
        <button class="header-btn theme-toggle" @click="toggleMusic" :title="musicPaused ? '随机播放音乐' : '暂停音乐'">
          {{ musicPaused ? '🎵' : '⏸️' }}
        </button>
        <button class="header-btn theme-toggle" @click="nextMusic" title="下一首">⏭️</button>
        <div class="music-progress-container" v-if="currentMusic && !musicPaused" title="播放进度">
          <div class="music-progress-bar" :style="{ width: musicProgress + '%' }"></div>
        </div>
        <template v-if="!isLoggedIn">
          <button class="header-btn login-btn" @click="navigateTo('login')">登录</button>
          <button class="header-btn register-btn" @click="navigateTo('register')">注册</button>
        </template>
        <template v-else>
          <button class="header-btn account-btn" @click="navigateTo('profile')">账号 {{ userName || userId }}</button>
          <button class="header-btn logout-btn" @click="logout">退出</button>
        </template>
      </div>
      <div v-if="!isLoggedIn" class="login-hint-art">因反向代理不稳定，登录失败请重试</div>
    </header>
    <!-- <audio ref="musicEl" style="display:none"></audio> --> <!-- 移至 App.vue -->
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 功能按钮网格 -->
      <div class="features-grid">
        <button 
          v-for="feature in features" 
          :key="feature.id"
          :class="['feature-button', feature.path === 'bindCode' ? 'feature-rules' : '']"
          @click="navigateTo(feature.path)"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <div class="feature-title">{{ feature.title }}</div>
        </button>
      </div>
      
      <!-- 独立按钮区域：千万别点 -->
      <div class="danger-zone">
        <button class="danger-spin-btn" @click="triggerSpinEffect">
          <span class="danger-icon">⚠️</span>
          <span class="danger-text">千万别点</span>
        </button>
      </div>
      
      <!-- 服务器状态显示 -->
      <div class="server-status-container">
        <h2 class="server-status-title">服务器状态</h2>
        <div v-if="serverLoading" class="server-loading">
          正在获取服务器状态...
        </div>
        <div v-else class="server-list">
          <div
            v-for="server in servers"
            :key="server.id"
            class="server-item"
            :class="{ 'online': server.status?.online, 'offline': !server.status?.online }"
          >
            <div class="server-header">
              <div class="server-info">
                <div class="server-name">{{ server.name }}</div>
                <div class="server-status-indicator" @click="fetchServerStatusRetry(server)" title="点击刷新服务器状态">
                  {{ server.status?.online ? '在线' : '离线' }}
                </div>
              </div>

              <button
                v-if="server.status?.online && server.status?.players?.length > 0"
                class="expand-button"
                @click="toggleServerExpanded(server)"
              >
                {{ server.expanded ? '收起' : `展开 (${server.status.playerCount || server.status.players.length}人)` }}
              </button>
            </div>
            
            <div class="server-details">
              <div v-if="server.status?.online">
                <div class="server-details-grid">
                  <div class="detail-item">
                    <span class="detail-label">版本:</span>
                    <span class="detail-value">{{ server.status.version || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">地图:</span>
                    <span
                      class="detail-value map-name"
                      @click="toggleMapExpanded(server)"
                      :title="server.status.map || 'N/A'"
                    >
                      {{ truncateMapName(server.status.map) }}
                    </span>
                  </div>
                  <!-- 展开后的地图名称显示 -->
                  <div v-if="server.mapExpanded" class="map-expanded-container">
                    <div class="map-expanded-title">完整地图名称:</div>
                    <div class="map-expanded-content">{{ server.status.map || 'N/A' }}</div>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">波数:</span>
                    <span class="detail-value">{{ server.status.wave || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">游戏时间:</span>
                    <span class="detail-value">{{ server.status.gameTime || 'N/A' }}分钟</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">TPS:</span>
                    <span class="detail-value">{{ server.status.tps || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">内存:</span>
                    <span class="detail-value">{{ server.status.memory || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">在线玩家:</span>
                    <span class="detail-value">{{ server.status.playerCount || server.status.players?.length || 0 }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">总单位数:</span>
                    <span class="detail-value">{{ server.status.totalUnits || 'N/A' }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="offline-message">
                {{ server.status?.message || '未知状态' }}
              </div>
            </div>
            
            <!-- 折叠式在线玩家列表 -->
            <div v-if="server.expanded && server.status?.online && server.status?.players?.length > 0" class="player-list">
              <div
                v-for="(player, index) in server.status.players"
                :key="index"
                class="player-item"
              >
                <span v-if="typeof player === 'object'">
                    <span class="player-level" :class="{ 'unbound': player.isUnbound }">
                      {{ player.isUnbound ? '[未绑定]' : (player.level ? `[Lv.${player.level}]` : '') }}
                    </span>
                    <span class="player-name">{{ player.name }}</span>
                  </span>
                <span v-else>{{ player }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能卡片区，只保留神人榜独立卡片 -->
      <section class="card-grid">
        <!-- 神人榜独立卡片 -->
        <article class="info-card shenren-card">
          <header class="info-card-header">
            <span class="info-card-icon">🏆</span>
            <h2 class="info-card-title">神人榜</h2>
          </header>

          <!-- 加载 & 错误 -->
          <div v-if="shenrenLoading" class="info-card-body">
            <p class="info-card-status">正在获取神人榜数据...</p>
          </div>
          <div v-else-if="shenrenError" class="info-card-body">
            <p class="info-card-status error">{{ shenrenError }}</p>
          </div>

          <!-- 有数据：仅展示前若干条摘要，避免撑爆卡片 -->
          <div v-else-if="shenrenList.length > 0" class="info-card-body shenren-list">
            <div
              class="shenren-item"
              v-for="(item, index) in shenrenList.slice(0, 6)"
              :key="item.id || index"
            >
              <div class="shenren-line">
                <span class="shenren-label">排名</span>
                <span class="shenren-value rank">{{ index + 1 }}</span>
              </div>
              <div class="shenren-line">
                <span class="shenren-label">玩家</span>
                <span class="shenren-value name">{{ item.name || '-' }}</span>
              </div>
              <div class="shenren-line">
                <span class="shenren-label">经验</span>
                <span class="shenren-value">{{ item.totalExp || 0 }}</span>
              </div>
              <div class="shenren-line">
                <span class="shenren-label">总时长</span>
                <span class="shenren-value">{{ Math.floor((item.totalTime || 0) / 60) }}分钟</span>
              </div>
            </div>
            <p v-if="shenrenList.length > 6" class="shenren-tip">
              仅展示前 {{ Math.min(shenrenList.length, 6) }} 名，如需完整榜单可前往后台或专用面板查看。
            </p>
          </div>

          <!-- 无数据 -->
          <div v-else class="info-card-body">
            <p class="info-card-status">当前暂无神人记录。</p>
          </div>

          <footer class="info-card-footer">
            <button class="info-card-link" @click.stop="fetchShenrenList">
              刷新神人榜
            </button>
          </footer>
        </article>

      </section>
    </main>
    
    <!-- 随机一言小窗口 -->
    <div v-if="showHitokoto" class="hitokoto-container">
      <!-- 展开状态的一言窗口 -->
      <div class="hitokoto-window" :class="{ 'collapsed': hitokotoCollapsed }">
        <div class="hitokoto-content" @click="fetchHitokoto" title="点击刷新">
          <p class="hitokoto-text">{{ hitokotoContent }}</p>
          <p v-if="hitokotoFrom" class="hitokoto-from">—— {{ hitokotoFrom }}</p>
        </div>
        <button class="hitokoto-close" @click="closeHitokoto" title="收纳">×</button>
      </div>
      
      <!-- 收纳状态下的打开按钮 -->
      <div class="hitokoto-opener" :class="{ 'visible': hitokotoCollapsed }" @click="openHitokoto" title="打开一言">
        <span>💬</span>
      </div>
    </div>
    
    <!-- 备案信息页脚 -->
    <BeianFooter />
  </div>
</template>

<style scoped>
/* 网站Logo样式 */
.site-logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  padding: 10px;
  gap: 2px;
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #10a250;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #10a250;
}

.logo-subtitle {
  font-size: 2px;
  color: #666;
  margin-left: 40px; /* 对齐文字部分 */
}

/* 顶部导航栏样式调整 */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 认证按钮容器 */
.auth-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  max-width: 50%; /* 限制按钮容器最大宽度，防止在小屏幕上超出 */
}

/* 深色模式下的样式调整 */
.home-container.dark-mode .logo-text {
  color: #10a250;
}

/* 全局样式 */
.home-container {
  min-height: 100vh;
  overflow-x: hidden; /* 防止页面滚动 */
  background: var(--body-bg);
  padding: 80px 20px 20px;
  transition: background var(--transition-slow), color var(--transition-normal);
  box-sizing: border-box;
}

/* 头部样式 */
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1001;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  background: var(--header-bg);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.login-hint-art {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -28px;
  padding: 6px 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  font-size: 0.95rem;
  line-height: 1.2;
  text-align: center;
  background: linear-gradient(90deg, #f56565, #ed8936, #f6ad55);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 8px rgba(246, 173, 85, 0.45);
  white-space: nowrap;
  pointer-events: none;
  animation: hintFade 0.6s ease;
  z-index: 1002;
}

@media (max-width: 768px) {
  .login-hint-art {
    bottom: -24px;
    font-size: 0.85rem;
    padding: 4px 10px;
    white-space: normal;
    width: 90%;
  }
}

@media (max-width: 480px) {
  .login-hint-art {
    bottom: -22px;
    font-size: 0.8rem;
    width: calc(100% - 32px);
    padding: 4px 8px;
    letter-spacing: 0.2px;
  }
}

.home-container.dark-mode .login-hint-art {
  background: linear-gradient(90deg, #63b3ed, #9f7aea, #f6ad55);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 8px rgba(99, 179, 237, 0.35);
}

@keyframes hintFade {
  0% { opacity: 0; transform: translateX(-50%) translateY(6px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.auth-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.header-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 80px;
}

.theme-toggle {
  background: transparent;
  border: 1px solid transparent;
  font-size: 1.2rem;
  min-width: 40px;
  padding: 8px;
}

.theme-toggle:hover {
  border-color: var(--border-light);
  background: rgba(255, 255, 255, 0.1);
}

.login-btn {
  background: var(--btn-primary-bg);
  color: white;
}

.login-btn:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.register-btn {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.register-btn:hover {
  background: var(--btn-secondary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.account-btn {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.logout-btn {
  background: var(--btn-secondary-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

/* 主要内容区域 */
.main-content {
  max-width: 980px;
  margin: 0 auto;
  padding: 20px 0;
  min-height: calc(100vh - 120px); /* 计算内容区域高度，确保不超出视口 */
  box-sizing: border-box;
}

/* 功能按钮网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  justify-items: center;
}

.feature-button {
  width: 100%;
  max-width: 200px;
  padding: 30px 20px;
  border: none;
  border-radius: 16px;
  background: var(--card-bg);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  text-align: center;
}

.feature-button:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-xl);
}

.feature-icon {
  font-size: 3rem;
  opacity: 0.9;
  transition: transform 0.3s ease;
}

.feature-button:hover .feature-icon {
  transform: scale(1.1);
}

.feature-rules {
  border: 1px solid var(--card-outline);
}
.feature-rules .feature-icon {
  background: var(--accent-soft);
  border-radius: 50%;
  padding: 10px;
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: var(--text-primary);
}

/* 独立危险按钮区域 */
.danger-zone {
  margin: 30px 0;
  display: flex;
  justify-content: center;
}

.danger-spin-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  border: none;
  border-radius: 50px;
  color: white;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(255, 75, 43, 0.3);
}

.danger-spin-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 75, 43, 0.4);
}

.danger-spin-btn:active {
  transform: translateY(1px);
}

.danger-icon {
  font-size: 1.2rem;
}

/* 一言容器 - 用于控制整体布局 */
.hitokoto-container {
  position: fixed;
  bottom: 20px;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

/* 音乐进度条 */
.music-progress-container {
  width: 60px;
  height: 6px;
  background: var(--body-bg);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  margin-left: 12px;
  overflow: hidden;
  align-self: center;
}
.music-progress-bar {
  height: 100%;
  background: #3b82f6; /* 使用显眼的蓝色，确保对比度 */
  border-radius: 2px;
  transition: width 0.2s linear;
}

/* 随机一言小窗口样式 */
.hitokoto-window {
  width: 300px;
  max-width: 90%;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 15px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  opacity: 1;
  position: relative;
}

/* 收纳到左侧的样式 */
.hitokoto-window.collapsed {
  transform: translateX(calc(-100% + 40px));
  border-radius: 0 12px 12px 0;
  box-shadow: 2px 0 12px rgba(0,0,0,0.15);
  opacity: 0;
}

/* 收纳状态下的打开按钮 */
.hitokoto-opener {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 40px;
  background: var(--card-bg);
  border-radius: 0 12px 12px 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateX(-100%);
}

/* 按钮可见状态 */
.hitokoto-opener.visible {
  opacity: 1;
  transform: translateX(0);
}

/* 按钮悬停效果 */
.hitokoto-opener:hover {
  background: var(--btn-secondary-hover);
  transform: translateX(2px);
}



.hitokoto-content {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.6;
  cursor: pointer;
}

.hitokoto-content:hover {
  opacity: 0.9;
}

.hitokoto-text {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-style: italic;
}

.hitokoto-from {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: right;
}

.hitokoto-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hitokoto-close:hover {
  background: rgba(0,0,0,0.1);
  color: var(--text-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    padding: 70px 15px 20px;
  }
  
  .top-header {
    padding: 10px 15px;
  }
  
  .auth-buttons {
    max-width: 60%; /* 在小屏幕上增加按钮容器宽度 */
  }
  
  .header-btn {
    padding: 6px 12px;
    font-size: 0.9rem;
    min-width: 60px; /* 减小按钮最小宽度 */
  }
  
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .feature-button {
    padding: 25px 15px;
  }
  
  .feature-icon {
    font-size: 2.5rem;
  }
  
  .feature-title {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .home-container {
    padding: 70px 10px 20px;
  }
  
  .top-header {
    padding: 10px;
    flex-wrap: wrap; /* 允许头部内容换行 */
  }
  
  .site-logo {
    flex: 1; /* 让logo占据更多空间 */
    min-width: 150px; /* 确保logo有最小宽度 */
  }
  
  .auth-buttons {
    max-width: 100%; /* 在极小屏幕上允许按钮容器占据全部宽度 */
    flex-wrap: wrap;
    justify-content: flex-end; /* 按钮右对齐 */
  }
  
  .header-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
    min-width: 50px; /* 进一步减小按钮最小宽度 */
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .feature-button {
    padding: 20px 10px;
  }
  
  .feature-icon {
    font-size: 2rem;
  }
  
  .feature-title {
    font-size: 1rem;
  }
  
  .hitokoto-window {
    bottom: 15px;
    left: 15px;
    right: 15px;
    width: auto;
    padding: 12px;
  }
  
  .hitokoto-window.collapsed {
    transform: translateX(calc(-100% + 30px));
    opacity: 0;
  }
  
  .hitokoto-opener {
    width: 30px;
    height: 30px;
  }
  
  .hitokoto-content {
    font-size: 0.9rem;
  }
  
  .hitokoto-from {
    font-size: 0.8rem;
  }
}

/* 修复主页横向滚动问题 */
:global(html), :global(body) {
  overflow-x: hidden;
}

.home-container {
  overflow-x: hidden;
}

/* 为触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .feature-button {
    padding: 30px 20px;
    min-height: 120px;
  }
}

/* 主题切换扩散动效 */
.theme-toggle {
  position: relative;
  overflow: hidden;
}

.theme-ripple {
  position: absolute;
  border-radius: 50%;
  width: 0;
  height: 0;
  background: currentColor;
  opacity: 0.3;
  transform: translate(-50%, -50%);
  animation: ripple-expand 0.8s ease-out;
  pointer-events: none;
  z-index: 1;
}

@keyframes ripple-expand {
  0% {
    width: 0;
    height: 0;
    opacity: 0.3;
  }
  100% {
    width: 500px;
    height: 500px;
    opacity: 0;
  }
}

/* 服务器状态样式 */
.server-status-container {
  margin-top: 40px;
  padding: 20px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-normal);
}

.server-status-title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text-primary);
  text-align: center;
}

.server-loading {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
}

.server-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.server-item {
  padding: 15px;
  border-radius: 12px;
  background: var(--btn-secondary-bg);
  transition: all var(--transition-normal);
}

.server-item.online {
  border-left: 4px solid #4CAF50;
}

.server-item.offline {
  border-left: 4px solid #f44336;
  opacity: 0.7;
}

.server-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.server-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.server-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.server-status-indicator {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.server-item.online .server-status-indicator {
  background: #4CAF50;
  color: white;
}

.server-item.offline .server-status-indicator {
  background: #f44336;
  color: white;
}

/* 服务器状态指示器包含刷新功能 */
.server-status-indicator {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 服务器状态标题容器 */

.expand-button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #4A90E2;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.expand-button:hover {
  background: #357ABD;
  transform: translateY(-1px);
}

.home-container.dark-mode .expand-button {
  background: #357ABD;
}

.home-container.dark-mode .expand-button:hover {
  background: #2968A6;
}

.server-details {
  font-size: 0.95rem;
  color: var(--text-muted);
}

.server-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  flex-wrap: nowrap;
}

.detail-label {
  flex-shrink: 0;
  margin-right: 8px;
  white-space: nowrap;
}

.detail-value {
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0; /* 允许内容在空间不足时收缩 */
}

.detail-label {
  font-weight: 500;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: 8px;
  min-width: 50px;
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

/* 地图名称折叠样式 */
.map-name {
  max-width: 150px;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
  display: inline-block;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

/* 点击展开后的样式 - 保持左右布局但显示完整内容 */
.map-expanded-container {
  grid-column: span 2;
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
}

.map-expanded-title {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.map-expanded-content {
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-all;
}

.map-name:hover {
  opacity: 0.8;
}

/* 响应式地图名称 */
@media (max-width: 768px) {
  .map-name {
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .map-name {
    max-width: 100px;
  }
}

.offline-message {
  color: #f44336;
  font-style: italic;
}

.player-list {
  margin-top: 15px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  animation: slideDown 0.3s ease-out;
}

.player-item {
  padding: 8px 12px;
  margin-bottom: 5px;
  background: var(--card-bg);
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-level {
  font-weight: 600;
  color: var(--link-color);
  font-size: 0.85rem;
}

.player-level.unbound {
  color: var(--error-color);
}

.player-name {
  flex: 1;
  word-break: break-all;
}

.player-item:last-child {
  margin-bottom: 0;
}

.refresh-button {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: var(--btn-primary-bg);
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all var(--transition-normal);
  width: 100%;
}

.refresh-button:hover {
  background: var(--btn-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式服务器状态样式 */
@media (max-width: 768px) {
  .server-status-container {
    padding: 15px;
  }
  
  .server-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .server-info {
    width: 100%;
    justify-content: space-between;
  }
  
  .expand-button {
    align-self: flex-end;
  }
  
  .server-meta {
    flex-direction: column;
    gap: 5px;
  }
}

/* 信息卡片通用布局（参考联系客服） */
.card-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.info-card {
  padding: 16px 16px 12px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: default;
  transition: all var(--transition-normal);
}

.info-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-card-icon {
  font-size: 1.4rem;
}

.info-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.info-card-desc {
  margin: 4px 0 0;
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.info-card-body {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.info-card-status {
  margin: 4px 0;
  color: var(--text-muted);
}

.info-card-status.error {
  color: var(--error-color);
}

.info-card-footer {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.info-card-link {
  padding: 4px 10px;
  font-size: 0.8rem;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--link-color);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.info-card-link:hover {
  background: rgba(74, 144, 226, 0.08);
  transform: translateY(-1px);
}

/* 神人榜卡片内行样式 */
.shenren-card {
  border: 1px solid rgba(148, 163, 253, 0.16);
}

.court-sessions {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.session-row {
  display: grid;
  grid-template-columns: 40px 80px 80px 80px auto;
  align-items: center;
  gap: 8px;
  background: var(--btn-secondary-bg);
  border-radius: 8px;
  padding: 8px;
}
.session-status.open { color: #4CAF50; }
.session-status.connecting { color: #357ABD; }
.session-status.closed { color: #999; }
.session-status.error { color: #f44336; }

.shenren-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
}

.shenren-item {
  padding: 6px 8px;
  border-radius: 10px;
  background: var(--btn-secondary-bg);
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: all var(--transition-fast);
}

.shenren-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.shenren-line {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 0.78rem;
}

.shenren-label {
  color: var(--text-muted);
  white-space: nowrap;
}

.shenren-value {
  flex: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shenren-value.rank {
  font-weight: bold;
  color: #f6ad55;
}

.shenren-value.name {
  font-weight: 500;
  color: var(--text-primary);
}

.shenren-tip {
  margin: 4px 2px 0;
  font-size: 0.72rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .info-card {
    padding: 14px;
  }

  .shenren-line {
    font-size: 0.76rem;
  }
}

/* 平滑的主题切换过渡 */
.home-container {
  transition: background-color 0.5s ease, color 0.5s ease;
}</style>
