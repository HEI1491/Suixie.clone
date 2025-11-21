<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { useApi } from '@/plugins/api.js'
import { useSnackbar } from '../composables/useSnackbar.js'
import { API_DEFAULTS } from '@/core/constants.js'

const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const router = useRouter()
const api = useApi()
const { showMessage } = useSnackbar()

const qq = ref('')
const code = ref('')
const countdown = ref(0)
const isLoading = ref(false)
let timer = null
const boundStatus = ref('')
const boundQQ = ref('')
const isLoggedIn = ref(!!localStorage.getItem(API_DEFAULTS.tokenStorageKey))
const checkLogin = () => {
  const t = localStorage.getItem(API_DEFAULTS.tokenStorageKey)
  const atStr = localStorage.getItem(API_DEFAULTS.loginTimestampStorageKey)
  const at = atStr ? parseInt(atStr) : 0
  const expired = !at || Date.now() - at > API_DEFAULTS.loginMaxAgeMs
  isLoggedIn.value = !!t && !expired
}

const validateQQ = (v) => /^\d{5,}$/.test(String(v || '').trim())

const sendBindCode = async () => {
  if (countdown.value > 0) return
  checkLogin()
  if (!isLoggedIn.value) {
    showMessage('请先登录账号后再绑定QQ', { type: 'warning' })
    router.push({ path: '/login', query: { redirect: '/qqBind' } })
    return
  }
  if (!validateQQ(qq.value)) {
    showMessage('请输入有效的QQ号', { type: 'warning' })
    return
  }
  isLoading.value = true
  try {
    await api.sendQQBindCode(qq.value.trim())
    countdown.value = 60
    if (timer) clearInterval(timer)
    timer = window.setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    showMessage('绑定码已发送至QQ邮箱', { type: 'success' })
  } catch (e) {
    const reason = e?.reason || e?.message || '发送失败'
    showMessage(reason, { type: 'error' })
  } finally {
    isLoading.value = false
  }
}

const checkBindStatus = async () => {
  try {
    try {
      const prof = await api.getUserProfile()
      const data = prof?.data || null
      const q = String(data?.qq || '').trim()
      if (/^\d{5,}$/.test(q)) {
        boundQQ.value = q
        boundStatus.value = `已绑定QQ：${boundQQ.value}`
        return
      }
    } catch {}
    const targetQQ = (qq.value && validateQQ(qq.value)) ? qq.value.trim() : ''
    if (targetQQ) {
      const res = await api.getProfileByQQ(targetQQ)
      const data = res?.data || null
      const q = String(data?.qq || '').trim()
      if (/^\d{5,}$/.test(q)) {
        boundQQ.value = q
        boundStatus.value = `已绑定QQ：${boundQQ.value}`
        return
      }
    }
    boundQQ.value = ''
    boundStatus.value = '未检测到绑定'
  } catch {
    boundQQ.value = ''
    boundStatus.value = '未检测到绑定'
  }
}

onMounted(async () => {
  try {
    const name = localStorage.getItem(API_DEFAULTS.displayNameStorageKey) || ''
    if (/^\d{5,}$/.test(name)) qq.value = name
  } catch {}
  checkLogin()
  try {
    if (!qq.value && isLoggedIn.value) {
      const prof = await api.getUserProfile()
      const data = prof?.data || null
      if (data && /^\d{5,}$/.test(String(data.qq || ''))) qq.value = String(data.qq)
    }
  } catch {}
  await checkBindStatus()
})

const verifyAndBind = async () => {
  if (!code.value || !/^\d+$/.test(String(code.value))) {
    showMessage('请输入数字绑定码', { type: 'warning' })
    return
  }
  checkLogin()
  if (!isLoggedIn.value) {
    showMessage('请先登录账号后再绑定QQ', { type: 'warning' })
    router.push({ path: '/login', query: { redirect: '/qqBind' } })
    return
  }
  isLoading.value = true
  try {
    const res = await api.verifyQQBind(code.value.trim())
    const bound = res?.qq ? String(res.qq) : ''
    if (bound && validateQQ(bound) && qq.value && bound !== qq.value.trim()) {
      showMessage('绑定成功，但QQ号与输入不一致', { type: 'warning' })
    } else {
      showMessage('绑定成功', { type: 'success' })
    }
    boundQQ.value = bound || qq.value.trim()
    boundStatus.value = boundQQ.value ? `已绑定QQ：${boundQQ.value}` : '未检测到绑定'
    try { await checkBindStatus() } catch {}
    setTimeout(() => router.push('/'), 1200)
  } catch (e) {
    const reason = e?.reason || e?.message || '绑定失败'
    showMessage(reason, { type: 'error' })
  } finally {
    isLoading.value = false
  }
}

const unbind = async () => {}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="register-container no-border">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>
    <div class="form-container">
      <router-link class="text-link btn-home" to="/"><span class="btn-icon">←</span> 返回首页</router-link>
      <div class="completion-message" v-if="boundStatus">
        <p>{{ boundStatus }}</p>
      </div>
      <div class="form-step">
        <h2>绑定QQ</h2>
        <div class="input-group">
          <label for="qq">QQ号</label>
          <input id="qq" v-model="qq" type="text" placeholder="请输入QQ号" />
        </div>
        <div class="input-group">
          <label for="code">绑定码</label>
          <input id="code" v-model="code" type="text" placeholder="请输入绑定码" />
          <div class="verification-actions">
            <button class="btn-resend" @click="sendBindCode" :disabled="countdown > 0">
              {{ countdown > 0 ? `重新发送(${countdown}s)` : '发送绑定码' }}
            </button>
            <button class="btn-resend" @click="checkBindStatus" :disabled="isLoading">检测绑定状态</button>
            <button class="btn-resend" @click="unbind" :disabled="isLoading">解绑</button>
          </div>
        </div>
        <div class="button-group">
          <button class="btn btn-submit" :disabled="isLoading" @click="verifyAndBind">验证并绑定</button>
        </div>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
@import '/src/assets/register.css';
.register-container.no-border { box-shadow: none; border: none; border-radius: 0; max-width: 420px; margin: 100px auto; }
.verification-actions { display: flex; justify-content: flex-end; }
.completion-message { background-color: #f0f9ff; border-radius: 5px; padding: 16px; text-align: center; margin-bottom: 12px; }
</style>