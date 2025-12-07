<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useApi } from '@/plugins/api.js';
import { API_DEFAULTS } from '@/core/constants.js';
import { useTheme } from '@/composables/useTheme.js';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const api = useApi();
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme();

const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
});
const loading = ref(false);

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }

  loading.value = true;
  try {
    const result = await api.login(loginForm.username, loginForm.password);
    if (result.status === 200) {
        const token = api.readToken?.() || localStorage.getItem(API_DEFAULTS.tokenStorageKey);
        if (!token) {
             ElMessage.error('登录失败：未获取到凭证');
             return;
        }
        
        // Save info
        localStorage.setItem(API_DEFAULTS.displayNameStorageKey, loginForm.username);
        localStorage.setItem(API_DEFAULTS.loginTimestampStorageKey, String(Date.now()));
        
        // Auto sign-in if possible
        try { await api.sign(); } catch {}

        ElMessage.success(`欢迎回来 ${loginForm.username}`);
        
        const redirect = route.query.redirect || '/';
        router.push(redirect);
    }
  } catch (error) {
    const msg = error?.reason || error?.message || '登录失败';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="theme-toggle-wrapper">
       <el-button circle @click="cycleThemePreference" :title="themeToggleLabel">
          {{ themeIcon }}
       </el-button>
    </div>

    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2>欢迎回来</h2>
          <p>请登录您的账户</p>
        </div>
      </template>

      <el-form :model="loginForm" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input 
            v-model="loginForm.username" 
            placeholder="账号" 
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item>
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码" 
            :prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <div class="form-options">
          <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
          <router-link to="/recover" class="link-text">忘记密码?</router-link>
        </div>

        <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin" size="large">
          登录
        </el-button>

        <div class="form-footer">
          <span>没有账户? </span>
          <router-link to="/register" class="link-text">立即注册</router-link>
        </div>
        
        <div class="other-methods">
           <el-divider>其他登录方式</el-divider>
           <div class="methods-icons">
              <el-tooltip content="邮箱登录 (暂未开放)">
                <el-button circle disabled>📧</el-button>
              </el-tooltip>
              <el-tooltip content="QQ登录 (维护中)">
                <el-button circle disabled>🐧</el-button>
              </el-tooltip>
           </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-color, #f0f2f5);
  position: relative;
}

.theme-toggle-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin: 0;
  color: #303133;
}

.login-header p {
  margin: 10px 0 0;
  color: #909399;
  font-size: 14px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.link-text {
  color: #409EFF;
  text-decoration: none;
  font-size: 14px;
}

.link-text:hover {
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #606266;
}

.other-methods {
  margin-top: 30px;
}

.methods-icons {
  display: flex;
  justify-content: center;
  gap: 15px;
}
</style>
