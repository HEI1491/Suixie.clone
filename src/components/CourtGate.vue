<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { ElMessage } from 'element-plus'
import { Lock, Key, Unlock, Edit } from '@element-plus/icons-vue'

const router = useRouter()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const courtVisibility = ref(localStorage.getItem('COURT_VISIBILITY') || '公开')
const selectedRole = ref('法官')
const secret = ref('')
const caseDesc = ref('')
const plaintiffQQ = ref('')
const defendantQQ = ref('')

const roleOptions = [
  { label: '法官', value: '法官', icon: 'User' },
  { label: '原告', value: '原告', icon: 'UserFilled' },
  { label: '被告', value: '被告', icon: 'User' },
  { label: '观众', value: '观众', icon: 'View' }
]

const saveAndEnter = () => {
  if (!secret.value) {
    ElMessage.warning('请输入秘钥')
    return
  }
  localStorage.setItem(`COURT_SECRET_${selectedRole.value}`, secret.value)
  localStorage.setItem('COURT_VISIBILITY', courtVisibility.value)
  
  if (selectedRole.value === '原告') {
    if (caseDesc.value) localStorage.setItem('CASE_DESC', caseDesc.value)
    if (plaintiffQQ.value) localStorage.setItem('PLAINTIFF_QQ', plaintiffQQ.value)
    if (defendantQQ.value) localStorage.setItem('DEFENDANT_QQ', defendantQQ.value)
  }
  
  const roleMap = { '法官': 'judge', '原告': 'plaintiff', '被告': 'defendant', '观众': 'audience' }
  router.push(`/court/${roleMap[selectedRole.value]}`)
}

const goAppeal = () => router.push('/court/appeal')
const goHome = () => router.push('/')
</script>

<template>
  <div class="gate-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <div class="gate-card-wrapper">
      <el-card class="gate-card">
        <template #header>
          <div class="card-header">
             <el-button text @click="goHome">← 返回首页</el-button>
             <h2>幽柠法庭 · 获取秘钥</h2>
             <el-button type="primary" text @click="goAppeal">原告申诉</el-button>
          </div>
        </template>

        <div class="role-selector">
           <el-radio-group v-model="selectedRole" size="large">
              <el-radio-button v-for="role in roleOptions" :key="role.value" :label="role.value">
                 {{ role.label }}
              </el-radio-button>
           </el-radio-group>
        </div>

        <el-form label-position="top" class="gate-form">
           <el-form-item label="案件类型">
              <el-select v-model="courtVisibility">
                 <el-option label="公开案件" value="公开" />
                 <el-option label="私有案件" value="私有" />
              </el-select>
           </el-form-item>

           <div v-if="selectedRole === '原告'">
              <el-form-item label="案件申述请求">
                 <el-input v-model="caseDesc" type="textarea" rows="3" placeholder="请在这里填写一个原告案件申述请求" />
              </el-form-item>
           </div>

           <el-form-item label="输入秘钥">
              <el-input v-model="secret" type="password" placeholder="请输入秘钥" show-password :prefix-icon="Key" />
           </el-form-item>

           <el-button type="primary" class="enter-btn" size="large" @click="saveAndEnter">
              <el-icon><Unlock /></el-icon> 入场
           </el-button>
           
           <div class="hint-text" v-if="courtVisibility === '私有'">
              <el-icon><Lock /></el-icon> 私有案件不允许观众进入
           </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.gate-container {
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

.gate-card-wrapper {
  width: 100%;
  max-width: 500px;
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

.role-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.gate-form {
  margin-top: 20px;
}

.enter-btn {
  width: 100%;
  margin-top: 10px;
}

.hint-text {
  text-align: center;
  margin-top: 15px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
</style>
