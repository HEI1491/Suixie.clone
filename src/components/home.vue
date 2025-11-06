<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import '../assets/register.css'

const router = useRouter()
const isDarkMode = ref(false) // 深色模式控制
const showHitokoto = ref(true) // 控制一言窗口显示
const hitokotoCollapsed = ref(false) // 控制一言窗口是否收纳于左侧

// 服务器状态相关
const servers = ref([
  { id: 1, name: '幽柠之域', url: 'http://183.131.51.178:7878/status', status: null, expanded: false, mapExpanded: false }
])
const serverLoading = ref(false)

const hitokotoContent = ref('') // 一言内容
const hitokotoFrom = ref('') // 一言来源
const hitokotoCache = ref([]) // 缓存的一言数据
const currentCacheIndex = ref(-1) // 当前显示的缓存索引

// 功能按钮数据
const features = ref([
  { id: 0, title: '每日签到', path: 'sign', icon: '📅' },
  { id: 1, title: '获取绑定码', path: 'bindCode', icon: '🔐' },
  { id: 2, title: '赞助网页', path: 'sponsor', icon: '💖' },
  { id: 3, title: '找回密码', path: 'recover', icon: '🔑' },
  { id: 4, title: '联系客服', path: 'support', icon: '🆘' }
])

// 导航到指定路径
const navigateTo = (path: string) => {
  router.push(path)
}

// 切换主题模式 - 添加扩散动效-虽然是没生效吧
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
  
  // 切换主题状态
  isDarkMode.value = !isDarkMode.value;
  
  // 动画结束后更新主题并清理
  setTimeout(() => {
    updateTheme();
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }, 300); // 等待动画扩散到一定程度再改变主题
}

// 更新主题
const updateTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
}

// 检测系统主题偏好
const detectSystemTheme = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDarkMode.value = prefersDark
  updateTheme()
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
  if (!server.url) {
    server.status = { online: false, message: '未配置服务器地址' }
    return
  }
  
  try {
    const response = await fetch(server.url)
    const data = await response.json()
    
    // 解析info字符串
    if (data.info) {
      server.status = parseServerInfo(data.info)
    } else {
      server.status = data
    }
  } catch (error) {
    console.error(`获取${server.name}状态失败:`, error)
    server.status = { online: false, message: '无法连接到服务器' }
  }
}

// 获取所有服务器状态
const fetchAllServerStatus = async () => {
  serverLoading.value = true
  await Promise.all(servers.value.map(server => fetchServerStatus(server)))
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
    // 检测系统主题
    detectSystemTheme()
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectSystemTheme)
    
    // 获取一言数据
    fetchHitokoto()
    
    // 获取服务器状态
    fetchAllServerStatus()
    
    // 每60秒刷新一次服务器状态（从API获取数据而不是刷新网页）
    const statusInterval = setInterval(fetchAllServerStatus, 60000)
    
    // 清理定时器
    onUnmounted(() => {
      clearInterval(statusInterval)
    })
  })

// 清理事件监听器
onUnmounted(() => {
  window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', detectSystemTheme)
})
</script>

<template>
  <div class="home-container" :class="{ 'dark-mode': isDarkMode }">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <!-- 网站Logo -->
      <div class="site-logo">
        <div class="logo-content">
          <img src="/vite.svg" alt="Logo" class="logo-icon">
          <span class="logo-text">幽柠之域</span>
        </div>
        <div class="logo-subtitle">网站98%为ai创作</div>
      </div>
      <div class="auth-buttons">
        <button class="header-btn theme-toggle" @click="toggleDarkMode" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
        <button class="header-btn login-btn" @click="navigateTo('login')">登录</button>
        <button class="header-btn register-btn" @click="navigateTo('register')">注册</button>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 功能按钮网格 -->
      <div class="features-grid">
        <button 
          v-for="feature in features" 
          :key="feature.id"
          class="feature-button"
          @click="navigateTo(feature.path)"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <div class="feature-title">{{ feature.title }}</div>
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
                <div class="server-status-indicator" @click="fetchServerStatus(server)" title="点击刷新服务器状态">
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
  justify-content: flex-start;
  align-items: center;
  padding: 10px 20px;
  width: 100%;
}

/* 确保认证按钮在右侧 */
.auth-buttons {
  margin-left: auto;
}

/* 深色模式下的样式调整 */
.home-container.dark-mode .logo-text {
  color: #10a250;
}

/* 全局样式 */
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 80px 20px 20px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.home-container.dark-mode {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #eee;
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
  justify-content: flex-end;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.home-container.dark-mode .top-header {
  background: rgba(23, 23, 23, 0.8);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.auth-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
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
  border-color: #ddd;
  background: rgba(255, 255, 255, 0.1);
}

.home-container.dark-mode .theme-toggle:hover {
  border-color: #444;
  background: rgba(255, 255, 255, 0.05);
}

.login-btn {
  background: #4A90E2;
  color: white;
}

.login-btn:hover {
  background: #357ABD;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.register-btn {
  background: white;
  color: #333;
  border: 1px solid #ddd;
}

.register-btn:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 深色模式下的按钮样式 */
.home-container.dark-mode .login-btn {
  background: #357ABD;
}

.home-container.dark-mode .login-btn:hover {
  background: #2968A6;
}

.home-container.dark-mode .register-btn {
  background: #333;
  color: #eee;
  border: 1px solid #555;
}

.home-container.dark-mode .register-btn:hover {
  background: #444;
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

/* 主要内容区域 */
.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
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
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  text-align: center;
}

.feature-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.home-container.dark-mode .feature-button {
  background: rgba(30, 30, 30, 0.9);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  color: #eee;
}

.home-container.dark-mode .feature-button:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.feature-icon {
  font-size: 3rem;
  opacity: 0.9;
  transition: transform 0.3s ease;
}

.feature-button:hover .feature-icon {
  transform: scale(1.1);
}

.feature-title {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: #333;
}

.home-container.dark-mode .feature-title {
  color: #eee;
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

/* 随机一言小窗口样式 */
.hitokoto-window {
  width: 300px;
  max-width: 90%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
  background: white;
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
  background: #f8f9fa;
  transform: translateX(2px);
}

.home-container.dark-mode .hitokoto-window {
  background: #2D2D2D;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.home-container.dark-mode .hitokoto-window:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.home-container.dark-mode .hitokoto-window.collapsed {
  box-shadow: 2px 0 12px rgba(0,0,0,0.3);
}

.home-container.dark-mode .hitokoto-opener {
  background: #2D2D2D;
  color: #eee;
}

.home-container.dark-mode .hitokoto-opener:hover {
  background: #3D3D3D;
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
  color: #333;
  font-style: italic;
}

.home-container.dark-mode .hitokoto-text {
  color: #eee;
}

.hitokoto-from {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
  text-align: right;
}

.home-container.dark-mode .hitokoto-from {
  color: #aaa;
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
  color: #333;
}

.home-container.dark-mode .hitokoto-close {
  color: #777;
}

.home-container.dark-mode .hitokoto-close:hover {
  background: rgba(255,255,255,0.1);
  color: #eee;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home-container {
    padding: 70px 15px 20px;
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
    padding: 10px 15px;
  }
  
  .header-btn {
    padding: 6px 12px;
    font-size: 0.9rem;
    min-width: 70px;
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
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.home-container.dark-mode .server-status-container {
  background: rgba(30, 30, 30, 0.9);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.server-status-title {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.home-container.dark-mode .server-status-title {
  color: #eee;
}

.server-loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.home-container.dark-mode .server-loading {
  color: #aaa;
}

.server-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.server-item {
  padding: 15px;
  border-radius: 12px;
  background: #f8f9fa;
  transition: all 0.3s ease;
}

.home-container.dark-mode .server-item {
  background: rgba(40, 40, 40, 0.9);
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
  color: #333;
}

.home-container.dark-mode .server-name {
  color: #eee;
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
  color: #666;
}

.home-container.dark-mode .server-details {
  color: #aaa;
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
  color: #888;
  flex-shrink: 0;
  margin-right: 8px;
  min-width: 50px;
}

.home-container.dark-mode .detail-label {
  color: #999;
}

.detail-value {
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.home-container.dark-mode .detail-value {
  color: #eee;
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

.home-container.dark-mode .map-expanded-container {
  background: rgba(0, 0, 0, 0.2);
}

.map-expanded-title {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 5px;
}

.home-container.dark-mode .map-expanded-title {
  color: #aaa;
}

.map-expanded-content {
  font-weight: 500;
  color: #333;
  word-break: break-all;
}

.home-container.dark-mode .map-expanded-content {
  color: #eee;
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

.home-container.dark-mode .player-list {
  background: rgba(0, 0, 0, 0.2);
}

.player-item {
  padding: 8px 12px;
  margin-bottom: 5px;
  background: white;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #333;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-level {
  font-weight: 600;
  color: #4A90E2;
  font-size: 0.85rem;
}

.player-level.unbound {
  color: #f44336;
}

.player-name {
  flex: 1;
  word-break: break-all;
}

.home-container.dark-mode .player-item {
  background: rgba(60, 60, 60, 0.9);
  color: #eee;
}

.home-container.dark-mode .player-level {
  color: #64b5f6;
}

.home-container.dark-mode .player-level.unbound {
  color: #ef5350;
}

.player-item:last-child {
  margin-bottom: 0;
}

.refresh-button {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #4A90E2;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.refresh-button:hover {
  background: #357ABD;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.home-container.dark-mode .refresh-button {
  background: #357ABD;
}

.home-container.dark-mode .refresh-button:hover {
  background: #2968A6;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
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

/* 平滑的主题切换过渡 */
.home-container {
  transition: background-color 0.5s ease, color 0.5s ease;
}</style>