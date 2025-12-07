<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { useMusicStore } from '@/stores/music.js'
import { useUserStore } from '@/stores/user.js'
import { createApiClient } from '@/services/apiClient.js'
import { fetchServerStatusRetry } from '@/utils/serverUtils.js'
import BeianFooter from '@/components/BeianFooter.vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { themePreference, resolvedTheme, themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const musicStore = useMusicStore()
const userStore = useUserStore()
const apiClient = createApiClient()

const showHitokoto = ref(true)
const hitokotoCollapsed = ref(false)

// 服务器状态相关
const statusUrls = [
  (typeof window !== 'undefined' ? window.location.origin : '') + '/status',
]
const servers = ref([
  { id: 1, name: '幽柠之域', url: statusUrls[0], status: null, expanded: false, mapExpanded: false }
])
const serverLoading = ref(false)

// 神人榜相关
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

// 一言相关
const hitokotoContent = ref('')
const hitokotoFrom = ref('')
const hitokotoCache = ref([])
const currentCacheIndex = ref(-1)

const fetchHitokoto = async () => {
  try {
    if (hitokotoCache.value.length > 0 && currentCacheIndex.value < hitokotoCache.value.length - 1) {
      currentCacheIndex.value++
      const cachedData = hitokotoCache.value[currentCacheIndex.value]
      hitokotoContent.value = (cachedData as any).hitokoto
      hitokotoFrom.value = (cachedData as any).from
      return
    }
    
    const response = await fetch('https://v1.hitokoto.cn/')
    const data = await response.json()
    
    hitokotoContent.value = data.hitokoto || '暂无一言数据'
    hitokotoFrom.value = (data as any).from || ''

    ;(hitokotoCache.value as any[]).push({ hitokoto: hitokotoContent.value, from: hitokotoFrom.value })
    if (hitokotoCache.value.length > 3) {
      hitokotoCache.value.shift()
    }
    currentCacheIndex.value = hitokotoCache.value.length - 1
  } catch (error) {
    console.error('获取一言失败:', error)
    if (hitokotoCache.value.length > 0) {
      currentCacheIndex.value = (currentCacheIndex.value + 1) % hitokotoCache.value.length
      const cachedData = hitokotoCache.value[currentCacheIndex.value]
      hitokotoContent.value = (cachedData as any).hitokoto
      hitokotoFrom.value = (cachedData as any).from
    } else {
      hitokotoContent.value = '获取一言失败，请稍后重试'
      hitokotoFrom.value = ''
    }
  }
}

const features = ref([
  { id: 0, title: '每日签到', path: 'sign', icon: '📅' },
  { id: 1, title: '幽柠规则', path: 'bindCode', icon: '📜' },
  { id: 2, title: '找回密码', path: 'recover', icon: '🔑' },
  { id: 3, title: '联系客服', path: 'support', icon: '🆘' },
  { id: 4, title: '幽柠法庭', path: 'court', icon: '⚖️' }
])

const navigateTo = (path: string) => {
  router.push(`/${path}`)
}

const syncAuth = async () => {
  const t = apiClient.readToken() || ''
  if (!t) {
    userStore.logout()
    return
  }
  
  // Try to get profile if name is missing
  if (!userStore.displayName) {
    try {
      const res = await apiClient.getUserProfile()
      const data = res.data || {}
      const name = data.username || data.nickname || data.qq || data.email
      if (name) {
        userStore.login(t, name)
      }
    } catch (e) {
      console.error('Failed to fetch user profile', e)
    }
  }
}

const logout = () => {
  userStore.logout()
  apiClient.clearToken()
  router.push('/')
  ElMessage.success('已退出登录')
}

// 切换主题模式 - 添加扩散动效
const toggleDarkMode = (event: MouseEvent) => {
  // 确保 event 和 currentTarget 存在
  if (event && event.currentTarget) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // 获取点击坐标，如果不可用（如键盘触发），则默认从中心开始
    const x = event.clientX ? (event.clientX - rect.left) : (rect.width / 2);
    const y = event.clientY ? (event.clientY - rect.top) : (rect.height / 2);
    
    // 创建扩散动画元素
    const ripple = document.createElement('div');
    ripple.classList.add('theme-ripple');
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    target.appendChild(ripple);
    
    // 清理动画元素
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }
  
  // 切换主题
  cycleThemePreference();
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
    void appEl.offsetWidth
    appEl.classList.add('super-spin')
  }
}

// 获取所有服务器状态
const fetchAllServerStatus = async () => {
  serverLoading.value = true
  await Promise.all(servers.value.map(server => fetchServerStatusRetry(server, statusUrls)))
  serverLoading.value = false
}

const toggleServerExpanded = (server) => {
  server.expanded = !server.expanded
}

const toggleMapExpanded = (server) => {
  server.mapExpanded = !server.mapExpanded
}

const truncateMapName = (mapName) => {
  if (!mapName) return 'N/A'
  const maxLength = 15
  return mapName.length > maxLength ? mapName.substring(0, maxLength) + '...' : mapName
}

onMounted(() => {
    fetchHitokoto()
    fetchAllServerStatus()
    fetchShenrenList()
    syncAuth()
    
    const statusInterval = setInterval(fetchAllServerStatus, 60000)
    const shenrenInterval = setInterval(fetchShenrenList, 300000)
    
    onUnmounted(() => {
      clearInterval(statusInterval)
      clearInterval(shenrenInterval)
    })
})
</script>

<template>
  <el-container class="home-container">
    <el-header class="top-header">
      <div class="header-content">
        <div class="site-logo" @click="playEasterEgg" title="点击播放彩蛋">
          <img src="/vite.svg" alt="Logo" class="logo-icon">
          <span class="logo-text">幽柠之域</span>
        </div>
        
        <div class="header-actions">
           <el-button circle @click="toggleDarkMode" :title="themeToggleLabel">
            {{ themeIcon }}
          </el-button>
          <el-button circle @click="musicStore.toggleMusic" :title="musicStore.musicPaused ? '随机播放音乐' : '暂停音乐'">
            {{ musicStore.musicPaused ? '🎵' : '⏸️' }}
          </el-button>
          <el-button circle @click="musicStore.nextMusic" title="下一首">⏭️</el-button>
          
          <div class="music-progress" v-if="musicStore.currentMusic && !musicStore.musicPaused">
             <el-progress :percentage="musicStore.musicProgress" :show-text="false" :stroke-width="4" />
          </div>

          <template v-if="!userStore.isLoggedIn">
            <el-button type="primary" @click="navigateTo('login')">登录</el-button>
            <el-button @click="navigateTo('register')">注册</el-button>
          </template>
          <template v-else>
             <el-dropdown>
                <el-button type="primary">
                  账号 {{ userStore.displayName || 'User' }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="navigateTo('profile')">个人中心</el-dropdown-item>
                    <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
          </template>
        </div>
      </div>
    </el-header>

    <el-main>
      <div class="main-content-wrapper">
        <!-- 功能按钮 -->
        <div class="features-grid">
          <el-card 
            v-for="feature in features" 
            :key="feature.id" 
            class="feature-card" 
            shadow="hover" 
            @click="navigateTo(feature.path)"
          >
            <div class="feature-content">
              <span class="feature-icon">{{ feature.icon }}</span>
              <span class="feature-title">{{ feature.title }}</span>
            </div>
          </el-card>
        </div>

        <!-- 危险区域 -->
        <div class="danger-zone">
          <el-button type="danger" plain @click="triggerSpinEffect">
            ⚠️ 千万别点
          </el-button>
        </div>

        <!-- 服务器状态 -->
        <el-card class="server-status-card">
          <template #header>
            <div class="card-header">
              <span>服务器状态</span>
              <el-button text type="primary" @click="fetchAllServerStatus" :loading="serverLoading">刷新</el-button>
            </div>
          </template>
          
          <div v-if="serverLoading" class="loading-state">
             <el-skeleton :rows="3" animated />
          </div>
          <div v-else v-for="server in servers" :key="server.id" class="server-item">
             <div class="server-info-row">
                <h3>{{ server.name }}</h3>
                <el-tag :type="server.status?.online ? 'success' : 'danger'">
                  {{ server.status?.online ? '在线' : '离线' }}
                </el-tag>
             </div>
             
             <div v-if="server.status?.online" class="server-details">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="版本">{{ server.status.version || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="地图">
                    <span @click="toggleMapExpanded(server)" class="clickable-text" :title="server.status.map">
                      {{ truncateMapName(server.status.map) }}
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="波数">{{ server.status.wave || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="在线">{{ server.status.playerCount }} / {{ server.status.totalUnits }}</el-descriptions-item>
                  <el-descriptions-item label="TPS">{{ server.status.tps || 'N/A' }}</el-descriptions-item>
                  <el-descriptions-item label="内存">{{ server.status.memory || 'N/A' }}</el-descriptions-item>
                </el-descriptions>
                
                <div v-if="server.mapExpanded" class="full-map-name">
                  完整地图: {{ server.status.map }}
                </div>

                <div class="player-list-toggle" v-if="server.status.players?.length > 0">
                   <el-button text bg size="small" @click="toggleServerExpanded(server)">
                     {{ server.expanded ? '收起玩家列表' : `查看在线玩家 (${server.status.playerCount}人)` }}
                   </el-button>
                </div>
                
                <el-collapse-transition>
                  <div v-show="server.expanded" class="player-list">
                    <el-table :data="server.status.players" stripe style="width: 100%" size="small">
                      <el-table-column prop="name" label="玩家" />
                      <el-table-column prop="level" label="等级" width="80" />
                      <el-table-column label="状态" width="80">
                         <template #default="scope">
                            <el-tag v-if="scope.row.isUnbound" type="warning" size="small">未绑定</el-tag>
                            <el-tag v-else type="success" size="small">已绑定</el-tag>
                         </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-collapse-transition>
             </div>
             <div v-else>
               <p>{{ server.status?.message || '无法获取状态' }}</p>
             </div>
          </div>
        </el-card>
        
        <!-- 一言 -->
        <el-card class="hitokoto-card" shadow="hover" v-if="showHitokoto">
           <div class="hitokoto-content">
             <p class="hitokoto-text">"{{ hitokotoContent }}"</p>
             <p class="hitokoto-from">—— {{ hitokotoFrom }}</p>
           </div>
           <div class="hitokoto-actions">
              <el-button text size="small" @click="fetchHitokoto">换一句</el-button>
           </div>
        </el-card>

        <!-- 神人榜 -->
        <el-card class="shenren-card" v-if="shenrenList.length > 0">
           <template #header>
             <div class="card-header">
               <span>神人榜</span>
               <el-button text type="primary" @click="fetchShenrenList" :loading="shenrenLoading">刷新</el-button>
             </div>
           </template>
           <el-table :data="shenrenList" style="width: 100%" stripe>
              <el-table-column prop="rank" label="排名" width="60" />
              <el-table-column prop="name" label="ID" />
              <el-table-column prop="reason" label="上榜原因" />
              <el-table-column prop="date" label="时间" width="100" />
           </el-table>
        </el-card>
      </div>
    </el-main>

    <el-footer>
      <BeianFooter />
    </el-footer>
  </el-container>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: var(--bg-color, #f5f7fa);
}

.top-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.site-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 10px;
}

.logo-icon {
  height: 32px;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #409EFF;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.music-progress {
  width: 100px;
  margin: 0 10px;
}

.main-content-wrapper {
  max-width: 1200px;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.feature-card {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px;
}

.feature-icon {
  font-size: 2rem;
}

.danger-zone {
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-item {
  margin-bottom: 20px;
}

.server-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.clickable-text {
  color: #409EFF;
  cursor: pointer;
}

.player-list-toggle {
  margin-top: 10px;
  text-align: center;
}

.hitokoto-text {
  font-size: 1.1rem;
  font-style: italic;
  color: #606266;
  text-align: center;
}

.hitokoto-from {
  text-align: right;
  color: #909399;
  margin-top: 5px;
}
</style>
