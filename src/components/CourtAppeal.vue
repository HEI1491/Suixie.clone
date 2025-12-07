<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { ElMessage } from 'element-plus'
import { DocumentChecked } from '@element-plus/icons-vue'

const router = useRouter()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const appealForm = ref({
  plaintiff: '',
  defendant: '',
  reason: '',
  evidence: ''
})
const loading = ref(false)

const submitAppeal = async () => {
  if (!appealForm.value.plaintiff || !appealForm.value.reason) {
    ElMessage.warning('请填写完整的申诉信息')
    return
  }
  
  loading.value = true
  try {
    // 这里模拟提交
    await new Promise(r => setTimeout(r, 1000))
    ElMessage.success('申诉提交成功，请等待法官审核')
    // 保存一些信息以便返回后自动填入
    localStorage.setItem('CASE_DESC', appealForm.value.reason)
    localStorage.setItem('PLAINTIFF_QQ', appealForm.value.plaintiff)
    localStorage.setItem('DEFENDANT_QQ', appealForm.value.defendant)
    router.push('/court')
  } catch {
    ElMessage.error('提交失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push('/court')
</script>

<template>
  <div class="appeal-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <el-card class="appeal-card">
      <template #header>
        <div class="card-header">
           <el-button text @click="goBack">← 返回法庭</el-button>
           <h2>原告申诉</h2>
           <div></div>
        </div>
      </template>

      <el-form label-position="top" :model="appealForm">
        <el-form-item label="原告 QQ / ID" required>
           <el-input v-model="appealForm.plaintiff" placeholder="请输入您的联系方式" />
        </el-form-item>
        
        <el-form-item label="被告 QQ / ID">
           <el-input v-model="appealForm.defendant" placeholder="被举报人信息（可选）" />
        </el-form-item>

        <el-form-item label="申诉理由 / 案件描述" required>
           <el-input 
             v-model="appealForm.reason" 
             type="textarea" 
             rows="4" 
             placeholder="请详细描述案件经过、时间地点及诉求" 
           />
        </el-form-item>

        <el-form-item label="证据链接 (图片/视频)">
           <el-input v-model="appealForm.evidence" placeholder="请提供网盘链接或图床链接" />
        </el-form-item>

        <el-button type="primary" class="submit-btn" :loading="loading" @click="submitAppeal">
           <el-icon><DocumentChecked /></el-icon> 提交申诉
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.appeal-container {
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

.appeal-card {
  width: 100%;
  max-width: 600px;
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
