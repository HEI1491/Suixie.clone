<script setup>
import { ref } from 'vue'
import { useApi } from '@/plugins/api.js'
import { useTheme } from '@/composables/useTheme.js'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'

const oldPassword = ref('')
const newPassword = ref('')
const loading = ref(false)
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const api = useApi()

const changePassword = async () => {
  if (!oldPassword.value || !newPassword.value) {
    ElMessage.warning('请输入旧密码和新密码')
    return
  }
  if (newPassword.value.length < 8) {
    ElMessage.warning('新密码长度至少8位')
    return
  }
  loading.value = true
  try {
    await api.changePassword(oldPassword.value, newPassword.value)
    ElMessage.success('修改密码成功')
    oldPassword.value = ''
    newPassword.value = ''
  } catch (err) {
    const reason = err?.reason || err?.message || '修改密码失败'
    ElMessage.error(reason)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="recover-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <el-card class="recover-card">
      <template #header>
        <div class="card-header">
           <router-link to="/" class="back-link">← 返回首页</router-link>
           <h2>修改密码</h2>
        </div>
      </template>
      
      <p class="desc">输入旧密码以修改新密码。</p>
      
      <el-form label-position="top">
        <el-form-item label="旧密码">
           <el-input 
             v-model="oldPassword" 
             type="password" 
             placeholder="请输入旧密码" 
             :prefix-icon="Lock" 
             show-password 
           />
        </el-form-item>
        <el-form-item label="新密码">
           <el-input 
             v-model="newPassword" 
             type="password" 
             placeholder="请输入新密码(至少8位)" 
             :prefix-icon="Lock" 
             show-password 
           />
        </el-form-item>
        
        <el-button type="primary" class="submit-btn" :loading="loading" @click="changePassword">
          确认修改
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.recover-container {
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

.recover-card {
  width: 100%;
  max-width: 480px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}

.back-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-size: 14px;
}

.desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.submit-btn {
  width: 100%;
  margin-top: 10px;
}
</style>
