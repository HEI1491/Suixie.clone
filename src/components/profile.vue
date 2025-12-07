<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/plugins/api.js'
import { useTheme } from '@/composables/useTheme.js'
import { ElMessage } from 'element-plus'
import { User, Message, Iphone, Trophy, Coin, Timer, Calendar } from '@element-plus/icons-vue'
import { API_DEFAULTS } from '@/core/constants.js'

const router = useRouter()
const api = useApi()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const loading = ref(true)
const profile = ref({})
const usingQQFallback = ref(false)

const expPercent = computed(() => {
  const cur = Number(profile.value.currentExp || 0)
  const next = Number(profile.value.nextLevelExp || 0)
  if (!next) return 0
  return Math.min(100, Math.round((cur * 100) / next))
})

const remainingExp = computed(() => {
  const cur = Number(profile.value.currentExp || 0)
  const next = Number(profile.value.nextLevelExp || 0)
  return Math.max(0, next - cur)
})

onMounted(async () => {
  loading.value = true
  try {
    const t = api.readToken()
    if (!t) throw new Error('未登录')

    const res = await api.getUserProfile()
    const data = res?.data || {}
    
    profile.value = {
      username: data.username || '',
      email: data.email || '',
      qq: data.qq || '',
      gid: data.gid || '',
      level: data.level || '',
      currentExp: Number(data.currentExp) || 0,
      nextLevelExp: Number(data.nextLevelExp) || 0,
      coin: Number(data.coin) || 0,
      onlineMinutes: Number(data.onlineMinutes) || 0,
      registerTime: data.registerTime || '',
    }
  } catch (e) {
    const reason = e?.reason || e?.message || ''
    const status = e?.status || 0

    if (status === 401 || status === 403) {
      ElMessage.error('请先登录')
      router.push('/login?redirect=/profile')
      return
    }

    const name = localStorage.getItem(API_DEFAULTS.displayNameStorageKey) || ''
    const fallbackQQ = /^\d{5,}$/.test(name) ? name : ''

    if (fallbackQQ) {
      try {
        const res2 = await api.getProfileByQQ(fallbackQQ)
        const data2 = res2?.data || {}
        profile.value = {
          username: data2.username || '',
          email: '',
          qq: data2.qq || fallbackQQ,
          gid: data2.gid || '',
          level: data2.level || '',
          currentExp: Number(data2.currentExp) || 0,
          nextLevelExp: Number(data2.nextLevelExp) || 0,
          coin: Number(data2.coin) || 0,
          onlineMinutes: Number(data2.onlineMinutes) || 0,
          registerTime: data2.registerTime || '',
        }
        usingQQFallback.value = true
        ElMessage.info('未登录或获取资料失败，已显示QQ资料')
      } catch (e2) {
        const errReason = reason || e2?.reason || e2?.message || '获取资料失败'
        ElMessage.error(errReason)
      }
    } else {
      if (e.message === '未登录') {
        ElMessage.error('请先登录')
        router.push('/login?redirect=/profile')
      } else {
        ElMessage.error(reason || '获取资料失败')
      }
    }
  } finally {
    loading.value = false
  }
})

const goHome = () => router.push('/')
const goLogin = () => router.push('/login?redirect=/profile')
</script>

<template>
  <div class="profile-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <el-card class="profile-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button text @click="goHome">← 返回首页</el-button>
          <h2>个人主页</h2>
          <div></div>
        </div>
      </template>

      <div v-if="usingQQFallback" class="fallback-alert">
        <el-alert title="当前显示为QQ资料，登录后可查看完整账户信息" type="info" show-icon :closable="false" />
      </div>

      <div class="profile-content" v-if="profile.username || profile.qq">
        <el-descriptions border :column="1">
          <el-descriptions-item>
            <template #label><div class="cell-item"><el-icon><User /></el-icon> 账号</div></template>
            {{ profile.username || '-' }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label><div class="cell-item"><el-icon><Message /></el-icon> 绑定邮箱</div></template>
            {{ profile.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label><div class="cell-item"><el-icon><Iphone /></el-icon> QQ号</div></template>
            {{ profile.qq || '-' }}
          </el-descriptions-item>
           <el-descriptions-item label="GID">{{ profile.gid || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">游戏数据</el-divider>

        <el-descriptions border :column="2">
           <el-descriptions-item label="等级">{{ profile.level || '-' }}</el-descriptions-item>
           <el-descriptions-item label="柠檬币">
              <span class="coin-text">{{ profile.coin }}</span>
           </el-descriptions-item>
           <el-descriptions-item label="在线时长">{{ profile.onlineMinutes }} 分钟</el-descriptions-item>
           <el-descriptions-item label="注册时间">{{ profile.registerTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="exp-section">
           <div class="exp-info">
              <span>当前经验: {{ profile.currentExp }}</span>
              <span>下一级所需: {{ profile.nextLevelExp }}</span>
           </div>
           <el-progress :percentage="expPercent" :format="(p) => `${p}%`" striped striped-flow />
           <div class="exp-remain">距离升级还需 {{ remainingExp }} 经验</div>
        </div>

      </div>
      
      <div v-else-if="!loading" class="empty-state">
        <el-empty description="无法获取资料" />
        <el-button type="primary" @click="goLogin">去登录</el-button>
      </div>

    </el-card>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--body-bg);
  padding: 20px;
}

.theme-toggle-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
}

.profile-card {
  width: 100%;
  max-width: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.cell-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.fallback-alert {
  margin-bottom: 20px;
}

.coin-text {
  color: #E6A23C;
  font-weight: bold;
}

.exp-section {
  margin-top: 20px;
  padding: 15px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.exp-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.exp-remain {
  margin-top: 5px;
  text-align: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.empty-state {
  text-align: center;
  padding: 20px;
}
</style>
