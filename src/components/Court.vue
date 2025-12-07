<script setup>
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause, ChatDotRound } from '@element-plus/icons-vue'
import { useMusicStore } from '@/stores/music.js'

// --- Mocking wsCourt logic for now as it's complex and file structure might differ ---
// In real scenario, import { wsCourt } from '@/services/wsCourt.ts'
// Here we implement a simplified version compatible with the refactor
class MockWsCourt {
  constructor() {
    this.connected = false
    this.messages = []
    this.onMessage = null
  }
  connect(url) {
    this.connected = true
    console.log('Mock WS connected to', url)
  }
  send(data) {
    console.log('Mock WS send', data)
    // Echo back for demo
    if (data.type === 'chat') {
        const msg = { type: 'chat', role: data.role, content: data.content, timestamp: Date.now() }
        this.messages.push(msg)
        if (this.onMessage) this.onMessage(msg)
    }
  }
  close() {
    this.connected = false
  }
}
const wsCourt = new MockWsCourt()
// -------------------------------------------------------------------------------------

const route = useRoute()
const router = useRouter()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const musicStore = useMusicStore()

const role = computed(() => route.params.role || 'audience')
const roleName = computed(() => {
  const map = { judge: '法官', plaintiff: '原告', defendant: '被告', audience: '观众' }
  return map[role.value] || '观众'
})

const secret = ref('')
const courtVisibility = ref('公开')
const caseDesc = ref('暂无案件描述')
const plaintiffQQ = ref('未知')
const defendantQQ = ref('未知')

const messages = ref([])
const inputMsg = ref('')
const bgmPlaying = ref(false)
const bgmAudio = ref(null)

const evidenceList = ref([]) // Mock evidence

const sendMessage = () => {
  if (!inputMsg.value.trim()) return
  wsCourt.send({
    type: 'chat',
    role: roleName.value,
    content: inputMsg.value
  })
  inputMsg.value = ''
}

const toggleBgm = () => {
  if (!bgmAudio.value) return
  if (bgmPlaying.value) {
    bgmAudio.value.pause()
    bgmPlaying.value = false
  } else {
    bgmAudio.value.play().catch(() => {})
    bgmPlaying.value = true
  }
}

const goGate = () => router.push('/court')

onMounted(() => {
  // Load context
  const storedSecret = localStorage.getItem(`COURT_SECRET_${roleName.value}`)
  if (!storedSecret && role.value !== 'audience') { // Audience might not need secret in public mode
     // In real logic, redirect if secret missing for key roles
  }
  secret.value = storedSecret || ''
  courtVisibility.value = localStorage.getItem('COURT_VISIBILITY') || '公开'
  caseDesc.value = localStorage.getItem('CASE_DESC') || '暂无案件描述'
  plaintiffQQ.value = localStorage.getItem('PLAINTIFF_QQ') || '未知'
  defendantQQ.value = localStorage.getItem('DEFENDANT_QQ') || '未知'

  // Pause global music
  if (!musicStore.musicPaused) musicStore.toggleMusic()

  // Init BGM
  bgmAudio.value = new Audio('/court_theme.mp3')
  bgmAudio.value.loop = true
  
  // WS Setup
  wsCourt.onMessage = (msg) => {
    messages.value.push(msg)
    nextTick(() => {
      const el = document.querySelector('.chat-history')
      if (el) el.scrollTop = el.scrollHeight
    })
  }
  wsCourt.connect('ws://localhost:8080/court') // Mock URL
})

onUnmounted(() => {
  if (bgmAudio.value) {
    bgmAudio.value.pause()
    bgmAudio.value = null
  }
  wsCourt.close()
})
</script>

<template>
  <div class="court-room">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <div class="court-header">
       <div class="left">
         <el-button text @click="goGate">退出法庭</el-button>
         <el-tag effect="dark" :type="role === 'judge' ? 'danger' : 'primary'">
            当前身份：{{ roleName }}
         </el-tag>
         <el-tag type="info" class="visibility-tag">{{ courtVisibility }}</el-tag>
       </div>
       <div class="center">
         <h2>幽柠法庭</h2>
       </div>
       <div class="right">
          <el-button circle @click="toggleBgm" :type="bgmPlaying ? 'primary' : ''">
             <el-icon><VideoPlay v-if="!bgmPlaying" /><VideoPause v-else /></el-icon>
          </el-button>
       </div>
    </div>

    <div class="court-layout">
       <!-- Left: Case Info -->
       <div class="sidebar left-sidebar">
          <el-card class="info-card">
             <template #header>案件信息</template>
             <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="原告">{{ plaintiffQQ }}</el-descriptions-item>
                <el-descriptions-item label="被告">{{ defendantQQ }}</el-descriptions-item>
             </el-descriptions>
             <div class="case-desc">
                <h4>案情描述</h4>
                <p>{{ caseDesc }}</p>
             </div>
          </el-card>

          <el-card class="evidence-card">
             <template #header>证据展示</template>
             <el-empty v-if="evidenceList.length === 0" description="暂无证据" :image-size="60" />
          </el-card>
       </div>

       <!-- Center: Court Interaction -->
       <div class="main-area">
          <div class="judge-seat">
             <div class="seat-label">法官席</div>
             <el-avatar :size="60" icon="UserFilled" class="judge-avatar" />
          </div>

          <div class="parties-area">
             <div class="party-seat plaintiff">
                <el-avatar :size="50" icon="User" />
                <div class="name">原告</div>
             </div>
             <div class="vs-divider">VS</div>
             <div class="party-seat defendant">
                <el-avatar :size="50" icon="User" />
                <div class="name">被告</div>
             </div>
          </div>

          <div class="chat-box">
             <div class="chat-history">
                <div v-for="(msg, i) in messages" :key="i" class="chat-msg" :class="{ 'my-msg': msg.role === roleName }">
                   <span class="msg-role">[{{ msg.role }}]</span>
                   <span class="msg-content">{{ msg.content }}</span>
                </div>
                <div v-if="messages.length === 0" class="empty-chat">
                   法庭肃静...
                </div>
             </div>
             <div class="chat-input-wrapper">
                <el-input v-model="inputMsg" placeholder="发言..." @keyup.enter="sendMessage">
                   <template #append>
                      <el-button @click="sendMessage">
                         <el-icon><ChatDotRound /></el-icon>
                      </el-button>
                   </template>
                </el-input>
             </div>
          </div>
       </div>

       <!-- Right: Tools / Jury -->
       <div class="sidebar right-sidebar">
          <el-card class="actions-card">
             <template #header>法庭操作</template>
             <div v-if="role === 'judge'" class="judge-actions">
                <el-button type="danger" plain style="width: 100%">休庭</el-button>
                <el-button type="success" plain style="width: 100%; margin: 10px 0 0">宣判</el-button>
             </div>
             <div v-else class="audience-actions">
                <el-button disabled style="width: 100%">举手发言</el-button>
             </div>
          </el-card>
       </div>
    </div>
  </div>
</template>

<style scoped>
.court-room {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #2c3e50; /* Dark theme by default for court atmosphere */
  color: #fff;
  overflow: hidden;
}

.theme-toggle-wrapper {
  position: absolute;
  top: 10px;
  right: 60px;
  z-index: 200;
}

.court-header {
  height: 60px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.court-header h2 {
  margin: 0;
  letter-spacing: 2px;
}

.court-layout {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  position: relative;
}

.judge-seat {
  text-align: center;
  margin-bottom: 30px;
}

.seat-label {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 5px;
}

.judge-avatar {
  background: #F56C6C;
  border: 2px solid #fff;
}

.parties-area {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 30px;
}

.party-seat {
  text-align: center;
}

.vs-divider {
  font-size: 24px;
  font-weight: bold;
  opacity: 0.5;
  font-style: italic;
}

.chat-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.chat-history {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.chat-msg {
  margin-bottom: 8px;
  padding: 5px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 14px;
}

.msg-role {
  font-weight: bold;
  margin-right: 8px;
  color: #409EFF;
}

.empty-chat {
  text-align: center;
  opacity: 0.5;
  margin-top: 50px;
}

.chat-input-wrapper {
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
}

/* Card overrides for dark court theme */
:deep(.el-card) {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
}
:deep(.el-card__header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
}
:deep(.el-descriptions__body) {
  background: transparent;
  color: #fff;
}
:deep(.el-descriptions__label) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #ddd !important;
}
:deep(.el-descriptions__content) {
  color: #fff !important;
}
</style>
