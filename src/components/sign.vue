<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { createApiClient } from '@/services/apiClient.js'
import { API_DEFAULTS } from '@/core/constants.js'

const router = useRouter()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const lastSignDate = ref<Date | null>(null)
const message = ref('')
const showMessage = ref(false)
const animationClass = ref('')
const isAnimating = ref(false)
const animationDuration = ref(400)
const signStatus = ref<null | 'success' | 'error'>(null)
const qq = ref('')
const isLoggedIn = ref(!!localStorage.getItem(API_DEFAULTS.tokenStorageKey))
const useQQFlow = ref(!isLoggedIn.value)
const profile = ref<any>(null)
const expPercent = ref(0)
const signGain = ref<number | null>(null)
const totalExp = ref<number | null>(null)
const beforeExp = ref<number | null>(null)
const autoRedirect = ref(true)
const qqError = ref('')

onMounted(() => {
  const storedDate = localStorage.getItem('lastSignDate')
  if (storedDate) lastSignDate.value = new Date(storedDate)

  nextTick(() => {
    setTimeout(() => {
      isAnimating.value = true
      animationClass.value = 'slide-in'
      setTimeout(() => {
        isAnimating.value = false
        animationClass.value = ''
      }, animationDuration.value)
    }, 0)
  })
})

async function handleSign() {
  try {
    const api = createApiClient()
    await prefetchProfile()
    qqError.value = ''
    if (isLoggedIn.value && !useQQFlow.value) {
      try {
        await api.signUser()
        await tryLoadProfile()
        if (signGain.value == null && beforeExp.value != null && profile.value?.currentExp != null) {
          signGain.value = Math.max(0, profile.value.currentExp - (beforeExp.value as number))
        }
        showMessageWithDelay('签到成功', 'success')
        return
      } catch (e: any) {
        const reason = e?.reason || e?.message || ''
        const status = (e && typeof e.status === 'number') ? e.status : 0
        if (status === 401 || /please\s+login/i.test(String(reason)) || /timeout/i.test(String(reason)) || /Invalid server response/i.test(String(reason))) {
          useQQFlow.value = true
          showMessage.value = false
          signStatus.value = null
          qqError.value = '无法通过登录签到，转为QQ签到'
        } else {
          useQQFlow.value = true
          showMessage.value = false
          signStatus.value = null
          qqError.value = '无法通过登录签到，转为QQ签到'
          return
        }
      }
    }
    if (!qq.value) {
      qqError.value = '请输入QQ号'
      showMessage.value = false
      signStatus.value = null
      return
    }
    await api.signWithQQ(qq.value)
    await tryLoadProfile()
    if (signGain.value == null && beforeExp.value != null && profile.value?.currentExp != null) {
      signGain.value = Math.max(0, profile.value.currentExp - (beforeExp.value as number))
    }
    showMessageWithDelay('签到成功', 'success')
  } catch (err: any) {
    const reason = err?.reason || err?.message || '签到失败'
    if (/not found/i.test(String(reason)) || /please\s+login/i.test(String(reason))) {
      useQQFlow.value = true
      signStatus.value = null
      showMessage.value = false
      qqError.value = '无法通过登录签到，转为QQ签到'
    } else {
      useQQFlow.value = true
      showMessage.value = false
      signStatus.value = null
      qqError.value = '无法通过登录签到，转为QQ签到'
    }
  }
}

function showMessageWithDelay(msg: string, status: 'success' | 'error', redirect = true) {
  message.value = msg
  signStatus.value = status
  showMessage.value = true

  autoRedirect.value = !!redirect
  if (autoRedirect.value) {
    setTimeout(() => {
      signStatus.value = null
      showMessage.value = false
      isAnimating.value = true
      animationClass.value = 'slide-out'
      setTimeout(() => {
        router.push('/')
      }, animationDuration.value)
    }, 3000)
  }
}

async function tryLoadProfile() {
  try {
    const api = createApiClient()
    let q = ''
    if (useQQFlow.value && qq.value) q = qq.value.trim()
    else {
      const name = localStorage.getItem(API_DEFAULTS.displayNameStorageKey) || ''
      if (/^\d{5,}$/.test(name)) q = name
    }
    if (!q) return
    const res = await api.getProfileByQQ(q)
    profile.value = res?.data || null
    if (profile.value && profile.value.nextLevelExp) {
      expPercent.value = Math.min(100, Math.round((profile.value.currentExp * 100) / (profile.value.nextLevelExp || 1)))
    }
  } catch {}
}

async function prefetchProfile() {
  try {
    const api = createApiClient()
    const q = resolveQQ()
    if (!q) return
    const res = await api.getProfileByQQ(q)
    const data = res?.data
    beforeExp.value = (data && typeof data.currentExp === 'number') ? data.currentExp : null
  } catch {}
}

function resolveQQ(): string {
  if (useQQFlow.value && qq.value) return qq.value.trim()
  const name = localStorage.getItem(API_DEFAULTS.displayNameStorageKey) || ''
  if (/^\d{5,}$/.test(name)) return name
  return ''
}

// 移除从文本解析签到经验，统一以经验差计算
</script>

<template>
  <div class="register-container no-border" :class="animationClass">
    <!-- 主题切换按钮 -->
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>
    <div class="form-container">
      <router-link class="text-link btn-home" to="/"><span class="btn-icon">←</span> 返回首页</router-link>
      <div :class="['form-step', animationClass]">
        <h2>每日签到</h2>
      <div class="input-group" v-if="!showMessage && (useQQFlow || !isLoggedIn)">
        <label for="qq">QQ号</label>
        <input id="qq" v-model="qq" type="text" placeholder="请输入QQ号" />
        <div class="input-error" v-if="qqError">{{ qqError }}</div>
      </div>
      <div class="completion-message" v-if="showMessage">
        <p>{{ message }}</p>
        <div v-if="signStatus==='success'" class="summary">
          <div class="sum-line"><span class="sum-label">等级</span><span class="sum-value">{{ profile?.level || '-' }}</span></div>
          <div class="sum-line"><span class="sum-label">当前经验</span><span class="sum-value">{{ (totalExp ?? profile?.currentExp) ?? '-' }}</span></div>
          <div class="sum-line"><span class="sum-label">签到经验</span><span class="sum-value">{{ signGain ?? '-' }}</span></div>
        </div>
        <p v-if="autoRedirect">即将返回首页...</p>
      </div>
      <div v-else>
          <p style="text-align: center; margin-bottom: 30px;">
            点击下方按钮完成今日签到
          </p>
          <div class="button-group">
            <button 
              class="btn btn-submit sign-button"
              :class="{ 
              'sign-success': signStatus === 'success',
              'sign-error': signStatus === 'error',
              'sign-in-progress': showMessage
              }"
              @click="handleSign"
            >
              <span v-if="showMessage">{{ message }}</span>
              <span v-else>签到</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 使用register.css中的样式 */
@import '/src/assets/register.css';

.register-container.no-border {
  box-shadow: none;
  border: none;
  border-radius: 0;
  max-width: 400px;
  margin: 100px auto;
}

.completion-message {
  background-color: #f0f9ff;
  border-radius: 5px;
  padding: 30px;
  text-align: center;
}

.completion-message p:first-child {
  font-size: 20px;
  font-weight: bold;
  color: var(--success-color);
  margin-bottom: 15px;
}

.completion-message p {
  font-size: 16px;
  color: var(--text-muted);
}

/* 添加滑出动画 */
.form-step.slide-out {
  animation: slideOutRight 0.4s ease-in forwards;
}

@keyframes slideOutRight {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100px);
    opacity: 0;
  }
}

/* 添加进入和离开动画样式 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.slide-in {
  animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.slide-out {
  animation: slideOut 0.4s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
}

/* 签到按钮动画样式 */
.sign-button {
  width: 100%;
  transition: all 0.3s ease;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.input-group input {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-primary);
}

.input-error {
  margin-top: 4px;
  color: var(--error-color);
  font-size: 0.85rem;
}

.sign-button.sign-in-progress {
  transform: scale(1.1);
  width: 100%;
  height: 60px;
  font-size: 18px;
  font-weight: bold;
}

.sign-button.sign-success {
  border-color: var(--success-color);
  color: var(--success-color);
}

.sign-button.sign-error {
  border-color: var(--error-color);
  color: var(--error-color);
}

.summary { margin-top: 12px; padding: 12px; background: var(--card-bg); border-radius: 12px; box-shadow: var(--shadow-md); text-align: left; }
.sum-line { display: flex; justify-content: space-between; padding: 8px 10px; background: var(--btn-secondary-bg); border-radius: 10px; margin-bottom: 8px; }
.sum-label { color: var(--text-muted); }
.sum-value { color: var(--text-primary); font-weight: 600; }
</style>

/* back button uses global .text-link .btn-home .btn-icon */

