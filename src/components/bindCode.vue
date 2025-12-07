<script setup>
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme.js'
import { Document, Reading, UserFilled, Management } from '@element-plus/icons-vue'

const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const activeTab = ref('general')
const bigManagers = ref([])
const smallManagers = ref([])
</script>

<template>
  <div class="rules-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <div class="rules-header">
       <router-link to="/" class="back-link">← 返回首页</router-link>
       <h1>幽柠规则中心</h1>
       <p class="subtitle">Community Rules & Guidelines</p>
    </div>

    <el-row :gutter="20">
      <!-- Manager Lists -->
      <el-col :xs="24" :sm="8">
        <el-card class="manager-card" shadow="hover">
           <template #header>
             <div class="card-title">
               <el-icon><UserFilled /></el-icon> 大管理名单
             </div>
           </template>
           <el-empty v-if="bigManagers.length === 0" description="暂无名单" :image-size="60" />
           <ul v-else class="manager-list">
             <li v-for="(name, idx) in bigManagers" :key="idx">{{ name }}</li>
           </ul>
        </el-card>

        <el-card class="manager-card" shadow="hover" style="margin-top: 20px">
           <template #header>
             <div class="card-title">
               <el-icon><UserFilled /></el-icon> 小名单管理
             </div>
           </template>
           <el-empty v-if="smallManagers.length === 0" description="暂无名单" :image-size="60" />
           <ul v-else class="manager-list">
             <li v-for="(name, idx) in smallManagers" :key="idx">{{ name }}</li>
           </ul>
        </el-card>
      </el-col>

      <!-- Rules Content -->
      <el-col :xs="24" :sm="16">
        <el-card class="rules-content-card">
           <el-tabs v-model="activeTab" class="rules-tabs">
              <el-tab-pane label="规定总则" name="general">
                 <template #label>
                    <span class="custom-tab-label"><el-icon><Management /></el-icon> 总则</span>
                 </template>
                 <div class="doc-content">
                    <h3>幽柠之域规定总则</h3>
                    <p>本总则规范幽柠之域的基础规则与行为准则，涵盖社区秩序、内容发布与违规处理等。后续将根据运营情况持续完善。</p>
                    <el-divider />
                    <p>（此处为示例内容，具体条款请根据实际情况补充）</p>
                 </div>
              </el-tab-pane>

              <el-tab-pane label="用户协议" name="agreement">
                 <template #label>
                    <span class="custom-tab-label"><el-icon><Document /></el-icon> 协议</span>
                 </template>
                 <div class="doc-content">
                    <h3>幽柠之域用户协议</h3>
                    <p>该协议约定用户在平台的权利与义务、隐私与数据使用、账户安全与申诉流程等内容，进入使用即视为同意相关条款。</p>
                 </div>
              </el-tab-pane>

              <el-tab-pane label="管理规定" name="management">
                 <template #label>
                    <span class="custom-tab-label"><el-icon><UserFilled /></el-icon> 管理</span>
                 </template>
                 <div class="doc-content">
                    <h3>幽柠之域管理规定</h3>
                    <p>管理规定明确管理职责、权限范围、执纪流程与公示机制，保障管理行为透明、规范、可追溯。</p>
                 </div>
              </el-tab-pane>

              <el-tab-pane label="用户指南" name="guide">
                 <template #label>
                    <span class="custom-tab-label"><el-icon><Reading /></el-icon> 指南</span>
                 </template>
                 <div class="doc-content">
                    <h3>幽柠之域用户指南</h3>
                    <p>用户指南提供入门指引、常见问题与使用技巧，帮助新老用户更好地参与互动与维护社区良好氛围。</p>
                 </div>
              </el-tab-pane>
           </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.rules-container {
  min-height: 100vh;
  background: var(--body-bg);
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.theme-toggle-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.rules-header {
  text-align: center;
  margin-bottom: 40px;
}

.rules-header h1 {
  margin: 10px 0;
  color: #303133;
}

.subtitle {
  color: #909399;
  margin: 0;
}

.back-link {
  color: var(--el-color-primary);
  text-decoration: none;
  font-size: 14px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.manager-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.manager-list li {
  padding: 8px 10px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 8px;
}

.doc-content {
  padding: 20px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
}

.doc-content h3 {
  margin-top: 0;
}

.custom-tab-label {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
