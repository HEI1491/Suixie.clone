<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/plugins/api.js'
import { useTheme } from '@/composables/useTheme.js'
import { ElMessage } from 'element-plus'
import { Iphone, Key } from '@element-plus/icons-vue'

const router = useRouter()
const api = useApi()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const formData = ref({
  qq: '',
  code: ''
})
const loading = ref(false)
const countdown = ref(0)
let timer = null

const startCountdown = () => {
  countdown.value = 60
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

const sendCode = async () => {
  if (!formData.value.qq) {
    ElMessage.warning('请输入QQ号')
    return
  }
  try {
    await api.sendQQBindCode(formData.value.qq)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error) {
    ElMessage.error(error.reason || error.message || '发送失败')
  }
}

const handleBind = async () => {
  if (!formData.value.qq || !formData.value.code) {
    ElMessage.warning('请填写完整')
    return
  }
  loading.value = true
  try {
    await api.bindQQ(formData.value.qq, formData.value.code)
    ElMessage.success('绑定成功')
    router.push('/profile')
  } catch (error) {
    ElMessage.error(error.reason || error.message || '绑定失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push('/profile')
</script>

<template>
  <div class="bind-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <el-card class="bind-card">
      <template #header>
        <div class="card-header">
           <el-button text @click="goBack">← 返回</el-button>
           <h2>绑定QQ</h2>
           <div></div>
        </div>
      </template>

      <el-form label-position="top">
        <el-form-item label="QQ号">
           <el-input v-model="formData.qq" placeholder="请输入QQ号" :prefix-icon="Iphone" />
        </el-form-item>
        
        <el-form-item label="验证码">
           <el-input v-model="formData.code" placeholder="请输入QQ邮箱验证码" :prefix-icon="Key">
              <template #append>
                 <el-button @click="sendCode" :disabled="countdown > 0">
                    {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                 </el-button>
              </template>
           </el-input>
        </el-form-item>

        <el-button type="primary" class="submit-btn" :loading="loading" @click="handleBind">
           确认绑定
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.bind-container {
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

.bind-card {
  width: 100%;
  max-width: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
}
</style>
