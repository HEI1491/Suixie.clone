<script setup>
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'

const router = useRouter()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()

const goHome = () => router.push('/')
const goBack = () => router.back()
</script>

<template>
  <div class="not-found-container">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <el-result
      icon="warning"
      title="404"
      sub-title="抱歉，您访问的页面不存在"
    >
      <template #extra>
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上一页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--body-bg);
  position: relative;
}

.theme-toggle-wrapper {
  position: absolute;
  top: 20px;
  right: 20px;
}
</style>
