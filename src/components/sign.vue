<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import { useApi } from '@/plugins/api.js'
import { useTheme } from '@/composables/useTheme.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Medal, Coin, Trophy, Refresh, Star } from '@element-plus/icons-vue'

const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const api = useApi()

const lastSignDate = ref(null)
const signStatus = ref('loading') // loading, success, signed, error
const signGain = ref(null)
const qq = ref('')
const loading = ref(false)
const audio = ref(null)

const isSignedToday = computed(() => {
  if (!lastSignDate.value) return false
  const now = new Date()
  return now.getFullYear() === lastSignDate.value.getFullYear() &&
         now.getMonth() === lastSignDate.value.getMonth() &&
         now.getDate() === lastSignDate.value.getDate()
})

onMounted(() => {
  const storedDate = localStorage.getItem('lastSignDate')
  if (storedDate) lastSignDate.value = new Date(storedDate)
  
  if (isSignedToday.value) {
    signStatus.value = 'signed'
  } else {
    handleSign()
  }
})

onBeforeUnmount(() => {
  if (audio.value) {
    audio.value.pause()
    audio.value = null
  }
})

const handleSign = async () => {
  if (isSignedToday.value) {
    ElMessage.info('今天已经签到过了')
    return
  }

  loading.value = true
  signStatus.value = 'loading'
  
  try {
    // 1. Try prefetch profile to get current exp
    let beforeExp = 0
    try {
       const prof = await api.getUserProfile()
       beforeExp = prof?.data?.currentExp || 0
    } catch {}

    // 2. Try normal sign
    try {
      await api.signUser()
      // Wait a bit for server to update
      await new Promise(r => setTimeout(r, 800))
      
      // 3. Get profile again to calc gain
      const profAfter = await api.getUserProfile()
      const afterExp = profAfter?.data?.currentExp || 0
      
      if (afterExp > beforeExp) {
        signGain.value = afterExp - beforeExp
      } else {
        signGain.value = null // Unknown gain
      }
      
      if (signGain.value !== null && signGain.value < 20) {
        const a = new Audio('/力竭.mp3')
        a.play().catch(e => console.error('Audio play failed:', e))
        audio.value = a
        ElMessageBox.alert('签力竭了', '提示', {
          confirmButtonText: '确定'
        })
      }

      completeSign()
      return
    } catch (e) {
      // If unauthorized, fallback to QQ sign
      const reason = e?.reason || e?.message || ''
      if (e.status === 401 || /please\s+login/i.test(String(reason))) {
         signStatus.value = 'qq_needed'
      } else {
         throw e
      }
    }
  } catch (error) {
    ElMessage.error(error.reason || error.message || '签到失败')
    signStatus.value = 'error'
  } finally {
    loading.value = false
  }
}

const handleQQSign = async () => {
  if (!qq.value) {
    ElMessage.warning('请输入QQ号')
    return
  }
  loading.value = true
  try {
    await api.signWithQQ(qq.value)
    ElMessage.success('QQ签到成功')
    completeSign()
  } catch (error) {
    ElMessage.error(error.reason || error.message || 'QQ签到失败')
  } finally {
    loading.value = false
  }
}

const completeSign = () => {
  lastSignDate.value = new Date()
  localStorage.setItem('lastSignDate', lastSignDate.value.toISOString())
  signStatus.value = 'success'
}
</script>

<template>
  <div class="sign-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <el-card class="sign-card">
      <template #header>
        <div class="card-header">
           <router-link to="/" class="back-link">← 返回首页</router-link>
           <h2>每日签到</h2>
        </div>
      </template>

      <div class="sign-content">
        <!-- 签到成功 -->
        <div v-if="signStatus === 'success' || signStatus === 'signed'" class="status-box success">
           <el-icon class="status-icon" color="#67C23A"><Trophy /></el-icon>
           <h3>{{ signStatus === 'signed' ? '今日已签到' : '签到成功！' }}</h3>
           <p v-if="signGain" class="gain-text">+{{ signGain }} 经验值</p>
           <p v-else class="gain-text">获得随机奖励</p>
           <p class="date-text">{{ new Date().toLocaleDateString() }}</p>
        </div>

        <!-- 需要QQ补签 -->
        <div v-else-if="signStatus === 'qq_needed'" class="status-box">
           <el-icon class="status-icon" color="#E6A23C"><Lock /></el-icon>
           <h3>未登录账号</h3>
           <p>您可以登录后签到，或者输入QQ号进行签到</p>
           
           <div class="qq-input-area">
             <el-input v-model="qq" placeholder="请输入QQ号" :prefix-icon="User" />
             <el-button type="primary" :loading="loading" @click="handleQQSign" style="margin-top: 10px; width: 100%">QQ签到</el-button>
             <el-divider>或者</el-divider>
             <router-link to="/login?redirect=/sign">
               <el-button style="width: 100%">去登录</el-button>
             </router-link>
           </div>
        </div>

        <!-- 加载中 -->
        <div v-else-if="signStatus === 'loading'" class="status-box">
           <el-icon class="status-icon is-loading" color="#409EFF"><Refresh /></el-icon>
           <h3>正在签到...</h3>
        </div>

        <!-- 失败 -->
        <div v-else class="status-box error">
           <el-icon class="status-icon" color="#F56C6C"><CircleClose /></el-icon>
           <h3>签到失败</h3>
           <el-button type="primary" @click="handleSign">重试</el-button>
        </div>

      </div>
    </el-card>
  </div>
</template>

<style scoped>
.sign-container {
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

.sign-card {
  width: 100%;
  max-width: 450px;
  text-align: center;
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

.status-box {
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.status-icon {
  font-size: 60px;
}

.gain-text {
  font-size: 24px;
  color: #E6A23C;
  font-weight: bold;
  margin: 10px 0;
}

.date-text {
  color: var(--el-text-color-secondary);
}

.qq-input-area {
  width: 100%;
  max-width: 300px;
  margin-top: 20px;
}
</style>
