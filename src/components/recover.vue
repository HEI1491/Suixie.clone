<script setup lang="ts">
import { ref } from 'vue'
import { createApiClient } from '@/services/apiClient.js'
import { useTheme } from '@/composables/useTheme.js'

const qq = ref('')
const result = ref('')
const loading = ref(false)
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const fetchProfile = async () => {
  if (!qq.value) {
    result.value = '请输入QQ号'
    return
  }
  loading.value = true
  result.value = ''
  try {
    const api = createApiClient()
    const payload = await api.request('/getProfileInfo', { method: 'GET', searchParams: { qq: qq.value } })
    result.value = payload.result || '查询成功'
  } catch (err) {
    result.value = err?.reason || err?.message || '查询失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>
    <h2>找回密码</h2>
    <p class="desc">通过QQ查询账号资料以辅助找回。</p>
    <div class="input-group">
      <label for="qq">QQ号</label>
      <input id="qq" v-model="qq" type="text" placeholder="请输入QQ号" />
    </div>
    <button class="action" @click="fetchProfile" :disabled="loading">{{ loading ? '查询中...' : '查询资料' }}</button>
    <pre v-if="result" class="result">{{ result }}</pre>
    <router-link class="text-link btn-home" to="/"><span class="btn-icon">←</span> 返回首页</router-link>
  </div>
  
</template>

<style scoped>
.container {
  max-width: 600px;
  margin: 80px auto;
  padding: 20px;
}
.theme-toggle.fixed { width: 48px; height: 48px; font-size: 1.4rem; background-color: #e9ecef; color: #333; position: fixed; top: 18px; right: 24px; border-radius: 50%; border: none; z-index: 20; cursor: pointer; }
[data-theme='dark'] .theme-toggle.fixed { background-color: #343a40; color: #f8f9fa; }

.desc { color: var(--text-muted); margin-bottom: 12px; }

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

.action {
  background: var(--btn-primary-bg);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
}

.result {
  margin-top: 16px;
  white-space: pre-wrap;
  background: var(--card-bg);
  padding: 12px;
  border-radius: 8px;
}

/* back button uses global .text-link .btn-home .btn-icon */
</style>