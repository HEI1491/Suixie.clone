<script setup>
import { ref, onMounted, computed } from 'vue'
import { API_DEFAULTS } from '@/core/constants.js'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { useApi } from '@/plugins/api.js'
import { useSnackbar } from '@/composables/useSnackbar.js'

const router = useRouter()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const api = useApi()
const { showMessage } = useSnackbar()

const loading = ref(true)
const error = ref('')
const profile = ref({ username: '', email: '', qq: '', gid: '', level: '', currentExp: 0, nextLevelExp: 0, coin: 0, onlineMinutes: 0, registerTime: '' })
const isLoggedIn = ref(false)
const fallbackQQ = ref('')
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
  const rem = next - cur
  return Math.max(0, isNaN(rem) ? 0 : rem)
})

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const t = localStorage.getItem(API_DEFAULTS.tokenStorageKey)
    const atStr = localStorage.getItem(API_DEFAULTS.loginTimestampStorageKey)
    const at = atStr ? parseInt(atStr) : 0
    const expired = !at || Date.now() - at > API_DEFAULTS.loginMaxAgeMs
    isLoggedIn.value = !!t && !expired
    const res = await api.getUserProfile()
    const data = res?.data || {}
    profile.value = {
      username: data.username || '',
      email: data.email || '',
      qq: data.qq || '',
      gid: data.gid || '',
      level: data.level || '',
      currentExp: typeof data.currentExp === 'number' ? data.currentExp : 0,
      nextLevelExp: typeof data.nextLevelExp === 'number' ? data.nextLevelExp : 0,
      coin: typeof data.coin === 'number' ? data.coin : 0,
      onlineMinutes: typeof data.onlineMinutes === 'number' ? data.onlineMinutes : 0,
      registerTime: data.registerTime || '',
    }
  } catch (e) {
    const reason = e?.reason || e?.message || ''
    const name = localStorage.getItem(API_DEFAULTS.displayNameStorageKey) || ''
    fallbackQQ.value = /^\d{5,}$/.test(name) ? name : ''
    if (fallbackQQ.value) {
      try {
        const res2 = await api.getProfileByQQ(fallbackQQ.value)
        const data2 = res2?.data || {}
        profile.value = {
          username: data2.username || '',
          email: '',
          qq: data2.qq || fallbackQQ.value,
          gid: data2.gid || '',
          level: data2.level || '',
          currentExp: typeof data2.currentExp === 'number' ? data2.currentExp : 0,
          nextLevelExp: typeof data2.nextLevelExp === 'number' ? data2.nextLevelExp : 0,
          coin: typeof data2.coin === 'number' ? data2.coin : 0,
          onlineMinutes: typeof data2.onlineMinutes === 'number' ? data2.onlineMinutes : 0,
          registerTime: data2.registerTime || '',
        }
        usingQQFallback.value = true
        error.value = ''
        showMessage('未登录，已显示QQ资料', { type: 'info' })
      } catch (e2) {
        error.value = reason || e2?.reason || e2?.message || '获取资料失败'
        showMessage(error.value, { type: 'error' })
      }
    } else {
      error.value = reason || '获取资料失败'
      showMessage(error.value, { type: 'error' })
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="register-container no-border">
    <button class="theme-toggle fixed" @click="cycleThemePreference" :title="themeToggleLabel">{{ themeIcon }}</button>
    <div class="form-container">
      <router-link class="text-link btn-home" to="/"><span class="btn-icon">←</span> 返回首页</router-link>
      <div class="form-step">
        <h2>个人主页</h2>
        <div v-if="loading" class="completion-message"><p>正在加载...</p></div>
        <div v-else>
          <div v-if="usingQQFallback" class="completion-message"><p>当前显示为QQ资料，登录后可查看完整账户信息</p></div>
          <div class="summary">
            <div class="sum-line"><span class="sum-label">账号</span><span class="sum-value">{{ profile.username || '-' }}</span></div>
            <div class="sum-line"><span class="sum-label">绑定邮箱</span><span class="sum-value">{{ profile.email || '-' }}</span></div>
            <div class="sum-line"><span class="sum-label">QQ号</span><span class="sum-value">{{ profile.qq || '-' }}</span></div>
            <div class="sum-line"><span class="sum-label">GID</span><span class="sum-value">{{ profile.gid || '-' }}</span></div>
            <div class="sum-line"><span class="sum-label">游戏等级</span><span class="sum-value">{{ profile.level || '-' }}</span></div>
            <div class="sum-line"><span class="sum-label">当前经验</span><span class="sum-value">{{ profile.currentExp }}</span></div>
            <div class="sum-line"><span class="sum-label">下一级所需经验</span><span class="sum-value">{{ profile.nextLevelExp }}</span></div>
            <div class="sum-line"><span class="sum-label">经验进度</span><span class="sum-value">{{ expPercent }}%</span></div>
            <div class="sum-line"><span class="sum-label">下一等级剩余经验</span><span class="sum-value">{{ remainingExp }}</span></div>
            <div class="sum-line"><span class="sum-label">柠檬币</span><span class="sum-value">{{ profile.coin }}</span></div>
            <div class="sum-line"><span class="sum-label">在线时长(分钟)</span><span class="sum-value">{{ profile.onlineMinutes }}</span></div>
            <div class="sum-line"><span class="sum-label">注册时间</span><span class="sum-value">{{ profile.registerTime || '-' }}</span></div>
          </div>
          <div v-if="error" class="button-group" style="margin-top: 10px;">
            <router-link class="btn btn-submit" to="/login?redirect=/profile">去登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '/src/assets/register.css';
.register-container.no-border { box-shadow: none; border: none; border-radius: 0; max-width: 520px; margin: 100px auto; }
.completion-message { background-color: #f0f9ff; border-radius: 5px; padding: 16px; text-align: center; margin-bottom: 12px; }
.summary { margin-top: 12px; padding: 12px; background: var(--card-bg); border-radius: 12px; box-shadow: var(--shadow-md); }
.sum-line { display: flex; justify-content: space-between; padding: 8px 10px; background: var(--btn-secondary-bg); border-radius: 10px; margin-bottom: 8px; }
.sum-label { color: var(--text-muted); }
.sum-value { color: var(--text-primary); font-weight: 600; }
</style>