<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme.js'
import { botApi, chatWithBot } from '@/api/botapi.js'
import { Service, ChatDotRound, Link, Monitor, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const manualServiceQQ = ref('2124007978')
const botSectionRef = ref(null)
const userMessage = ref('')
const isBotTyping = ref(false)

const openManualService = () => {
  const qqUrl = `https://wpa.qq.com/msgrd?v=3&uin=${manualServiceQQ.value}&site=qq&menu=yes`
  window.open(qqUrl, '_blank', 'noreferrer')
}

const goHome = () => router.push('/')

const focusBotComposer = async () => {
  if (botSectionRef.value) {
    botSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const applyPhrase = async (phrase) => {
  userMessage.value = phrase
  await focusBotComposer()
}

const badges = ['实时看板', '夜间值守', '跨时区友好', '自建工单流']
const quickPhrases = [
  '帮我生成工单：晚高峰延迟 180ms',
  '掉线 3 次，想查服务器状态',
  '账号充值延迟到账，帮我核对订单',
  '整理一下 CDN 切换步骤发我'
]

const statusSignals = [
  { label: '今日处理', value: '27', meta: '+4 工单' },
  { label: '在线节点', value: '8', meta: '多地自选' },
  { label: '平均响应', value: '3′', meta: '人工回复' },
  { label: '机器人命中', value: '92%', meta: 'FAQ 覆盖' }
]

const chatHistory = ref([
  {
    id: 1,
    role: 'assistant',
    content: '嗨，我是 KSNAG，想吹水还是提问题？我会把重点同步给站长。'
  }
])

const syncedDestinations = computed(() => botApi.destinations.join(' · '))
const botMeta = computed(() => `${botApi.model} · 温度 ${botApi.temperature}`)

const handleBotSend = async () => {
  if (!userMessage.value.trim() || isBotTyping.value) return

  const content = userMessage.value.trim()
  chatHistory.value.push({ id: Date.now(), role: 'user', content })
  userMessage.value = ''

  isBotTyping.value = true
  try {
    const reply = await chatWithBot(
      chatHistory.value.map(({ role, content }) => ({ role, content })),
      {
        extraPayload: {
          metadata: {
            page: 'support',
            qq: manualServiceQQ.value
          }
        }
      }
    )
    chatHistory.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: reply
    })
  } catch (error) {
    chatHistory.value.push({
      id: Date.now() + 2,
      role: 'assistant',
      content: 'KSNAG 有点害羞，暂时没能连上。我已经把你的留言记下，稍后我会亲自回复。'
    })
  } finally {
    isBotTyping.value = false
  }
}
</script>

<template>
  <div class="support-shell">
    <!-- 主题切换按钮 -->
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <div class="page-header">
       <h1>客户支持中心</h1>
       <p>我们随时为您提供帮助</p>
    </div>

    <el-row :gutter="24">
      <el-col :xs="24" :lg="16">
        <el-card class="hero-card">
           <div class="hero-content">
              <el-tag type="info" size="small" class="eyebrow">SUÌXIE · 自托管客服</el-tag>
              <h2 class="hero-title">有事就喊我，客服和运维都是我</h2>
              <p class="hero-desc">
                 我盯着服务器状态面板，也守着 {{ manualServiceQQ }} 这个 QQ 号。掉线、补丁、账号、节点调整——你只要告诉我，剩下的我和机器人一起接手。
              </p>
              
              <div class="badge-list">
                 <el-tag v-for="b in badges" :key="b" effect="plain" round>{{ b }}</el-tag>
              </div>

              <div class="hero-actions">
                 <el-button type="primary" size="large" :icon="ChatDotRound" @click="openManualService">
                    立即联系 QQ
                 </el-button>
                 <el-button size="large" :icon="Service" @click="focusBotComposer">
                    和机器人试跑
                 </el-button>
                 <el-button link @click="goHome">返回主页</el-button>
              </div>
           </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <div class="side-panel">
           <el-card class="contact-card" shadow="hover">
              <div class="contact-header">
                 <el-avatar :size="50" icon="UserFilled" class="contact-avatar" />
                 <div>
                    <div class="label">客服K桑QQ</div>
                    <div class="qq-number">{{ manualServiceQQ }}</div>
                 </div>
              </div>
              <div class="contact-status">
                 <el-badge is-dot type="success" class="status-dot">在线服务</el-badge>
                 <span class="status-desc">全节点维护 · 单线程服务</span>
              </div>
           </el-card>

           <div class="status-grid">
              <el-card v-for="s in statusSignals" :key="s.label" class="status-item" shadow="never">
                 <div class="status-val">{{ s.value }}</div>
                 <div class="status-lbl">{{ s.label }}</div>
                 <div class="status-meta">{{ s.meta }}</div>
              </el-card>
           </div>
        </div>
      </el-col>
    </el-row>

    <div class="bot-section" ref="botSectionRef">
       <el-card class="bot-card">
          <el-row :gutter="40">
             <el-col :xs="24" :md="8">
                <div class="bot-info">
                   <el-tag size="small">KSNAG · 吹水机器人</el-tag>
                   <h3>先让 LLM 跑一遍，再由我亲自跟进</h3>
                   <p>KSNAG 接入 botapi 配置，和主站同一套凭据。它会整理日志、提炼关键词、生成工单草稿，然后同步到我这里审核。</p>
                   
                   <div class="quick-phrases">
                      <el-button 
                        v-for="p in quickPhrases" 
                        :key="p" 
                        size="small" 
                        round 
                        @click="applyPhrase(p)"
                      >
                        {{ p }}
                      </el-button>
                   </div>
                   
                   <div class="bot-footer">
                      <p>同步到：{{ syncedDestinations }}</p>
                      <p>模型：{{ botMeta }}</p>
                   </div>
                </div>
             </el-col>

             <el-col :xs="24" :md="16">
                <div class="chat-window">
                   <div class="chat-history">
                      <div v-for="msg in chatHistory" :key="msg.id" :class="['chat-bubble', msg.role]">
                         <div class="bubble-content">
                            <strong>{{ msg.role === 'user' ? '你' : 'KSNAG' }}</strong>
                            <p>{{ msg.content }}</p>
                         </div>
                      </div>
                      <div v-if="isBotTyping" class="chat-bubble assistant">
                         <div class="bubble-content">
                            <strong>KSNAG</strong>
                            <p>正在思考...</p>
                         </div>
                      </div>
                   </div>
                   
                   <div class="chat-input">
                      <el-input 
                        v-model="userMessage" 
                        placeholder="描述你的问题，或者让 KSNAG 帮你吹吹水" 
                        @keyup.enter="handleBotSend"
                        :disabled="isBotTyping"
                      >
                         <template #append>
                            <el-button @click="handleBotSend" :loading="isBotTyping">发送</el-button>
                         </template>
                      </el-input>
                   </div>
                </div>
             </el-col>
          </el-row>
       </el-card>
    </div>

  </div>
</template>

<style scoped>
.support-container {
  min-height: 100vh;
  background: var(--bg-color, #f0f2f5);
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

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  margin: 0;
  font-size: 2.5rem;
  background: linear-gradient(135deg, #409EFF 0%, #303133 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-title {
  font-size: 2rem;
  margin: 15px 0;
}

.hero-desc {
  font-size: 1.1rem;
  color: #606266;
  line-height: 1.6;
}

.badge-list {
  margin: 20px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-card {
  background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
}

.contact-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.contact-avatar {
  background: #409EFF;
}

.qq-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #409EFF;
}

.contact-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #909399;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.status-item {
  text-align: center;
}

.status-val {
  font-size: 1.5rem;
  font-weight: bold;
  color: #303133;
}

.status-lbl {
  font-size: 0.9rem;
  color: #909399;
}

.status-meta {
  font-size: 0.8rem;
  color: #C0C4CC;
}

.bot-section {
  margin-top: 40px;
}

.bot-info h3 {
  font-size: 1.5rem;
  margin: 15px 0;
}

.quick-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0;
}

.bot-footer {
  font-size: 0.9rem;
  color: #909399;
}

.chat-window {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 500px;
}

.chat-history {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chat-bubble {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}

.chat-bubble.assistant {
  align-self: flex-start;
}

.chat-bubble.user {
  align-self: flex-end;
}

.bubble-content {
  padding: 10px 15px;
  border-radius: 12px;
  background: #f4f4f5;
}

.chat-bubble.user .bubble-content {
  background: #ecf5ff;
  color: #303133;
}

.chat-input {
  padding: 15px;
  border-top: 1px solid #dcdfe6;
}
</style>
