<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '@/plugins/api.js'
import { useSnackbar } from '../composables/useSnackbar.js'

const isExpanded = ref(false)
const showSubmenu = ref(false)
const router = useRouter()
const api = useApi()
const { showMessage } = useSnackbar()

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    showSubmenu.value = false
  }
}

async function quickRegister() {
  try {
    const account = 'zhy2347'
    const password = 'zhy@2347'
    const code = prompt('请输入验证码:')

    if (!code) {
      showMessage('验证码不能为空', { type: 'warning' })
      return
    }

    await api.register(account, password, code)
    showMessage('快速注册成功', { type: 'success' })
  } catch (error) {
    const reason = error?.reason || error?.message || '注册失败'
    showMessage(`注册失败: ${reason}`, { type: 'error' })
  }
}

async function quickLogin() {
  try {
    const account = 'zhy2347'
    const password = 'zhy@2347'
    await api.login(account, password)
    showMessage('快速登录成功', { type: 'success' })
  } catch (error) {
    const reason = error?.reason || error?.message || '登录失败'
    showMessage(`登录失败: ${reason}`, { type: 'error' })
  }
}

const checkLoginStatus = () => {
  const token = localStorage.getItem('userToken')
  if (token) {
    showMessage('本地存在登录状态', { type: 'info' })
  } else {
    showMessage('本地不存在登录状态', { type: 'warning' })
  }
}

const emptyFunction = (name: string) => {
  showMessage(`功能 "${name}" 暂未实现`, { type: 'info' })
}

const debugFunctions = [
  {
    name: '????',
    action: () => {
      showSubmenu.value = !showSubmenu.value
    }
  },
  { name: '?????', action: sendVerificationCode },
  { name: '??????', action: quickRegister },
  { name: '??????', action: quickLogin },
  { name: '??????', action: checkLoginStatus },
  { name: '??6', action: () => emptyFunction('??6') },
  { name: '??7', action: () => emptyFunction('??7') },
  { name: '??8', action: () => emptyFunction('??8') }
]

async function sendVerificationCode() {
  try {
    await api.sendCode('1298428557@qq.com')
    showMessage('验证码已发送至 1298428557@qq.com', { type: 'success' })
  } catch (error) {
    const reason = error?.reason || error?.message || '发送失败'
    showMessage(`发送失败: ${reason}`, { type: 'error' })
  }
}

const submenuItems = [
  { name: '??', path: '/' },
  { name: '??', path: '/register' },
  { name: '??', path: '/login' },
  { name: '??', path: '/recover' },
  { name: '??', path: '/sign' }
]

const navigateTo = (path: string) => {
  router.push(path)
  isExpanded.value = false
  showSubmenu.value = false
}
</script>
</script>

<template>
  <div 
    class="debug-container" 
    :class="{ expanded: isExpanded }"
    @click="toggleExpand"
  >
    <div v-if="!isExpanded" class="debug-button">
      DEBUG
    </div>
    <div v-else class="debug-panel">
      <div class="panel-header">
        调试功能列表
      </div>
      <ul class="function-list">
        <li 
          v-for="(func, index) in debugFunctions" 
          :key="index"
          @click.stop="func.action"
          class="function-item"
        >
          {{ func.name }}
          <!-- 子菜单 -->
          <ul v-if="index === 0 && showSubmenu" class="submenu">
            <li 
              v-for="(item, subIndex) in submenuItems" 
              :key="subIndex"
              @click.stop="navigateTo(item.path)"
              class="submenu-item"
            >
              {{ item.name }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.debug-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  cursor: pointer;
}

.debug-button {
  width: 100px;
  height: 100px;
  background-color: #ff6b6b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.debug-panel {
  width: 250px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.panel-header {
  background-color: #4ecdc4;
  color: white;
  padding: 15px;
  text-align: center;
  font-weight: bold;
}

.function-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.function-item {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  position: relative;
}

.function-item:hover {
  background-color: #f5f5f5;
}

.function-item:last-child {
  border-bottom: none;
}

.submenu {
  list-style: none;
  padding: 0;
  margin: 10px 0 0 0;
  background-color: #f9f9f9;
}

.submenu-item {
  padding: 8px 15px 8px 30px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.submenu-item:hover {
  background-color: #e9e9e9;
}

.submenu-item:last-child {
  border-bottom: none;
}
</style>
