import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

// 主题偏好存储键
const THEME_STORAGE_KEY = 'suixie_theme_pref'

// 全局主题状态
const themePreference = ref(localStorage.getItem(THEME_STORAGE_KEY) || 'system')
const systemTheme = ref('light')

// 媒体查询监听器
let mediaQuery

// 计算当前实际应用的主题
const resolvedTheme = computed(() => {
  if (themePreference.value === 'system') {
    return systemTheme.value
  }
  return themePreference.value
})

// 主题切换标签
const themeToggleLabel = computed(() => {
  if (themePreference.value === 'system') return '主题：跟随系统'
  if (themePreference.value === 'light') return '主题：浅色'
  return '主题：深色'
})

// 主题图标
const themeIcon = computed(() => {
  return resolvedTheme.value === 'dark' ? '☀️' : '🌙'
})

// 应用主题到DOM
const applyTheme = (theme) => {
  // 移除所有主题类
  document.documentElement.classList.remove('dark-mode', 'light-mode')
  document.documentElement.removeAttribute('data-theme')
  
  // 应用新主题
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode')
    document.documentElement.setAttribute('data-theme', 'dark')
    // 强制给 body 和 #app 添加 dark-mode 类，以确保样式穿透
    document.body.classList.add('dark-mode')
    const app = document.getElementById('app')
    if (app) app.classList.add('dark-mode')
  } else if (theme === 'light') {
    document.documentElement.classList.add('light-mode')
    document.documentElement.setAttribute('data-theme', 'light')
    document.body.classList.remove('dark-mode')
    const app = document.getElementById('app')
    if (app) app.classList.remove('dark-mode')
  }
}

// 处理系统主题变化
const handleSystemThemeChange = (event) => {
  systemTheme.value = event.matches ? 'dark' : 'light'
}

// 初始化主题
const initTheme = () => {
  if (window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemTheme.value = mediaQuery.matches ? 'dark' : 'light'
    
    // 添加系统主题变化监听
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange)
    }
  }
  
  // 应用初始主题
  applyTheme(resolvedTheme.value)
}

// 清理监听器
const cleanupTheme = () => {
  if (mediaQuery) {
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    } else if (mediaQuery.removeListener) {
      mediaQuery.removeListener(handleSystemThemeChange)
    }
  }
}

// 循环切换主题偏好
const cycleThemePreference = () => {
  const order = ['system', 'light', 'dark']
  const index = order.indexOf(themePreference.value)
  const nextPreference = order[(index + 1) % order.length]
  themePreference.value = nextPreference
  localStorage.setItem(THEME_STORAGE_KEY, nextPreference)
}

// 设置特定主题
const setThemePreference = (preference) => {
  if (['system', 'light', 'dark'].includes(preference)) {
    themePreference.value = preference
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  }
}

// 监听主题变化并应用
watch(resolvedTheme, (newTheme) => {
  applyTheme(newTheme)
})

// 导出主题管理功能
export function useTheme() {
  onMounted(() => {
    initTheme()
  })
  
  onBeforeUnmount(() => {
    cleanupTheme()
  })
  
  return {
    themePreference,
    systemTheme,
    resolvedTheme,
    themeToggleLabel,
    themeIcon,
    cycleThemePreference,
    setThemePreference
  }
}