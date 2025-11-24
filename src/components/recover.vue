<script setup lang="ts">
import { ref } from 'vue'
import { createApiClient } from '@/services/apiClient.js'
import { useTheme } from '@/composables/useTheme.js'
import { useSnackbar } from '@/composables/useSnackbar.js'

const oldPassword = ref('')
const newPassword = ref('')
const loading = ref(false)
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const { showMessage } = useSnackbar()

const changePassword = async () => {
  if (!oldPassword.value || !newPassword.value) {
    showMessage('请输入旧密码和新密码', { type: 'warning' })
    return
  }
  if (newPassword.value.length < 8) {
    showMessage('新密码长度至少8位', { type: 'warning' })
    return
  }
  loading.value = true
  try {
    const api = createApiClient()
    await api.services.changePassword(oldPassword.value, newPassword.value)
    showMessage('修改密码成功', { type: 'success' })
    oldPassword.value = ''
    newPassword.value = ''
  } catch (err) {
    const reason = err?.reason || err?.message || '修改密码失败'
    showMessage(reason, { type: 'error' })
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
    <h2>修改密码</h2>
    <p class="desc">输入旧密码以修改新密码。</p>
    <div class="input-group">
      <label for="oldPassword">旧密码</label>
      <input id="oldPassword" v-model="oldPassword" type="password" placeholder="请输入旧密码" />
    </div>
    <div class="input-group">
      <label for="newPassword">新密码</label>
      <input id="newPassword" v-model="newPassword" type="password" placeholder="请输入新密码(至少8位)" />
    </div>
    <button class="action" @click="changePassword" :disabled="loading">{{ loading ? '修改中...' : '确认修改' }}</button>
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