<template>
  <div class="support-shell">
    <button
      class="theme-toggle fixed"
      @click="cycleThemePreference"
      :title="themeToggleLabel"
    >
      {{ themeIcon }}
    </button>

    <!-- 新增页面头部动画 -->
    <div class="page-header">
      <div class="header-bg-animation"></div>
      <div class="header-content">
        <h1 class="page-title">客户支持中心</h1>
        <p class="page-subtitle">我们随时为您提供帮助</p>
      </div>
    </div>

    <section class="support-hero">
      <div class="hero-main">
        <div class="hero-header">
          <p class="eyebrow">SUÌXIE · 自托管客服</p>
          <h1 class="hero-title">有事就喊我，客服和运维都是我</h1>
          <p class="hero-description">
          我盯着服务器状态面板，也守着 {{ manualServiceQQ }} 这个 QQ 号。掉线、补丁、账号、节点调整——你只要告诉我，剩下的我和机器人一起接手。
          </p>
        </div>
        <div class="hero-features">
          <ul class="badge-list">
            <li v-for="badge in badges" :key="badge" class="badge-item">
              <span class="badge-icon">✓</span>
              {{ badge }}
            </li>
          </ul>
        </div>
        <div class="hero-actions">
          <button class="btn primary btn-contact" @click="openManualService">
            <span class="btn-icon">💬</span>
            立即联系 QQ
          </button>
          <button class="btn outline btn-bot" @click="focusBotComposer">
            <span class="btn-icon">🤖</span>
            和机器人试跑
          </button>
          <button class="text-link btn-home" @click="goHome">
            <span class="btn-icon">←</span>
            返回主页
          </button>
        </div>
      </div>
      <div class="hero-aside">
        <div class="contact-card qq-card">
          <div class="card-header">
            <div class="card-icon">👨‍💻</div>
            <div class="card-title-area">
              <p class="label">客服K桑QQ</p>
              <strong class="qq-number">{{ manualServiceQQ }}</strong>
            </div>
          </div>
          <div class="card-content">
            <small class="service-info">全节点维护 · 单线程服务</small>
            <div class="availability-indicator">
              <span class="status-dot online"></span>
              <span class="status-text">在线服务</span>
            </div>
          </div>

        </div>
        <div class="status-dashboard">
          <h3 class="dashboard-title">服务状态</h3>
          <div class="status-grid">
          <article v-for="signal in statusSignals" :key="signal.label" class="status-card">
            <div class="status-value">{{ signal.value }}</div>
            <div class="status-label">{{ signal.label }}</div>
            <div class="status-meta">{{ signal.meta }}</div>
          </article>
        </div>
      </div>
      </div>
    </section>

    <section class="bot-hub" ref="botSectionRef">
      <aside class="bot-brief">
        <p class="eyebrow">KSNAG · 吹水机器人</p>
        <h2>先让 LLM 跑一遍，再由我亲自跟进</h2>
        <p>
          KSNAG 接入 botapi 配置，和主站同一套凭据。它会整理日志、提炼关键词、生成工单草稿，然后同步到我这里审核。
        </p>
        <ul class="bot-points">
          <li>关键词总结 + 待办列表</li>
          <li>自动生成工单草稿</li>
          <li>支持 Markdown / 代码块</li>
        </ul>
        <div class="quick-phrases">
          <button
            v-for="phrase in quickPhrases"
            :key="phrase"
            class="chip"
            @click="applyPhrase(phrase)"
          >
            {{ phrase }}
          </button>
        </div>
        <p class="sync-tip">同步到：{{ syncedDestinations }}</p>
        <p class="bot-meta">模型：{{ botMeta }}</p>
      </aside>
      <div class="bot-console">
        <div class="bot-history">
          <div
            v-for="bubble in chatHistory"
            :key="bubble.id"
            class="bubble"
            :class="bubble.role"
          >
            <strong>{{ bubble.role === 'user' ? '你' : 'KSNAG' }}</strong>
            <p>{{ bubble.content }}</p>
          </div>
          <div v-if="isBotTyping" class="bubble assistant typing">
            <strong>KSNAG</strong>
            <p>正在思考...</p>
          </div>
        </div>
        <form class="bot-input" @submit.prevent="handleBotSend">
          <input
            ref="messageInputRef"
            v-model="userMessage"
            type="text"
            placeholder="描述你的问题，或者让 KSNAG 帮你吹吹水，它都会记录"
            :disabled="isBotTyping"
          />
          <button class="btn primary" :disabled="!userMessage.trim() || isBotTyping">发送</button>
        </form>
        <p class="bot-hint">
          提示：输入“生成工单”或“整理日志”，KSNAG 会自动生成工单草稿并告诉我。
        </p>
      </div>
    </section>

    
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'
import { botApi, chatWithBot } from '../api/botapi.js'

const router = useRouter()
const { themePreference, resolvedTheme, themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
const manualServiceQQ = ref('2124007978')
const botSectionRef = ref(null)
const messageInputRef = ref(null)
const userMessage = ref('')
const isBotTyping = ref(false)

const openManualService = () => {
  const qqUrl = `https://wpa.qq.com/msgrd?v=3&uin=${manualServiceQQ.value}&site=qq&menu=yes`
  window.open(qqUrl, '_blank', 'noreferrer')
}

const goHome = () => {
  router.push('/')
}

const focusBotComposer = async () => {
  if (botSectionRef.value) {
    botSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  await nextTick()
  messageInputRef.value?.focus()
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
            theme: themePreference.value || resolvedTheme.value,
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

<style scoped>
:global(:root) {
  color-scheme: light;
  --body-bg: linear-gradient(180deg, #f4f7fb 0%, #e8f0f7 60%, #dde8f3 100%);
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --tag-bg: rgba(168, 213, 255, 0.15);
  --card-bg: linear-gradient(135deg, #ffffff, #f8fafc);
  --card-outline: rgba(168, 213, 255, 0.3);
  --accent: #4a90e2;
  --accent-soft: rgba(168, 213, 255, 0.2);
  --bot-panel-bg: rgba(255, 255, 255, 0.85);
  --bot-border: rgba(168, 213, 255, 0.2);
  --bubble-assistant-bg: rgba(200, 230, 255, 0.85);
  --bubble-user-bg: rgba(74, 144, 226, 0.12);
  --bubble-user-text: #1a202c;
  --faq-card-bg: rgba(255, 255, 255, 0.92);
  --faq-border: rgba(168, 213, 255, 0.15);
}

:global([data-theme='dark']) {
  color-scheme: dark;
  --body-bg: linear-gradient(180deg, #0a1929 0%, #0f172a 60%, #1e293b 100%);
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --tag-bg: rgba(168, 213, 255, 0.12);
  --card-bg: linear-gradient(135deg, #0f172a, #1e293b);
  --card-outline: rgba(168, 213, 255, 0.25);
  --accent: #a8d5ff;
  --accent-soft: rgba(168, 213, 255, 0.2);
  --bot-panel-bg: rgba(30, 41, 59, 0.9);
  --bot-border: rgba(168, 213, 255, 0.25);
  --bubble-assistant-bg: rgba(30, 41, 59, 0.75);
  --bubble-user-bg: rgba(168, 213, 255, 0.2);
  --bubble-user-text: #f8fafc;
  --faq-card-bg: rgba(30, 41, 59, 0.88);
  --faq-border: rgba(168, 213, 255, 0.18);
}

:global(body) {
  background: var(--body-bg);
  font-family: 'Poppins', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text-primary);
  transition: background 0.6s ease;
}

.support-shell {
  max-width: 1160px;
  margin: 0 auto;
  padding: 48px 20px 80px;
  color: var(--text-primary);
}

.support-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  padding: 48px;
  border-radius: 32px;
  background: var(--card-bg);
  border: 1px solid var(--card-outline);
  box-shadow: 0 30px 80px rgba(20, 40, 80, 0.12);
  position: relative;
  overflow: hidden;
}

.hero-main h1 {
  font-size: clamp(2.2rem, 4vw, 3.1rem);
  line-height: 1.2;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.hero-main p {
  color: var(--text-secondary);
  line-height: 1.7;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
  padding: 0;
  list-style: none;
}

.badge-list li {
  background: var(--tag-bg);
  border-radius: 999px;
  padding: 6px 16px;
  font-size: 0.9rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 18px;
  align-items: center;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 12px 26px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn.primary {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
}

.btn.ghost {
  background: transparent;
  color: var(--text-primary);
  border: 1px dashed var(--card-outline);
}

.btn.outline {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--card-outline);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-link {
  background: none;
  border: none;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.text-link:hover {
  text-decoration: underline wavy;
}

.hero-aside {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.qq-card {
  padding: 24px;
  border-radius: 24px;
  background: var(--accent-soft);
  border: 1px solid var(--card-outline);
}

.qq-card strong {
  font-size: 2rem;
  display: block;
  margin: 8px 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 14px;
}

.status-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid var(--card-outline);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-card strong {
  font-size: 1.6rem;
}

.label {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.bot-hub {
  margin-top: 48px;
  padding: 40px;
  border-radius: 32px;
  background: var(--card-bg);
  border: 1px solid var(--card-outline);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 28px;
}

.bot-brief h2 {
  margin: 10px 0 12px;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.bot-points {
  padding-left: 18px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.quick-phrases {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0;
}

.chip {
  border: 1px solid var(--card-outline);
  border-radius: 999px;
  padding: 6px 14px;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.chip:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.sync-tip,
.bot-meta {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.bot-console {
  background: var(--bot-panel-bg);
  border-radius: 28px;
  border: 1px solid var(--bot-border);
  display: flex;
  flex-direction: column;
  padding: 18px;
  min-height: 380px;
}

.bot-history {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 6px;
}

.bubble {
  border-radius: 18px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid transparent;
}

.bubble.assistant {
  background: var(--bubble-assistant-bg);
  border-color: var(--card-outline);
}

.bubble.user {
  background: var(--bubble-user-bg);
  color: var(--bubble-user-text);
  margin-left: auto;
  border-color: rgba(74, 144, 226, 0.25);
}

.bubble.typing p {
  opacity: 0.8;
  font-style: italic;
}

.bot-input {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.bot-input input {
  flex: 1;
  border-radius: 18px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  padding: 10px 16px;
  font-size: 0.95rem;
  background: transparent;
  color: var(--text-primary);
}

.bot-input input::placeholder {
  color: var(--text-secondary);
}

.bot-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 8px;
}


.theme-toggle.fixed {
  width: 48px;
  height: 48px;
  font-size: 1.4rem;
  background-color: #e9ecef;
  color: #333;
  position: fixed;
  top: 18px;
  right: 24px;
  border-radius: 50%;
  border: none;
  z-index: 20;
  cursor: pointer;
}

[data-theme='dark'] .theme-toggle.fixed {
  background-color: #343a40;
  color: #f8f9fa;
}

@media (max-width: 720px) {
  .support-hero,
  .bot-hub {
    padding: 28px;
  }

  .theme-toggle.fixed {
    top: 12px;
    right: 12px;
  }
}



/* 新增优化样式 */

/* 页面头部动画 */
.page-header {
  position: relative;
  text-align: center;
  padding: 60px 20px 40px;
  margin-bottom: 40px;
  overflow: hidden;
}

.header-bg-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--accent-soft) 0%, transparent 50%);
  animation: headerFloat 6s ease-in-out infinite;
  z-index: -1;
}

@keyframes headerFloat {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
}

.page-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  margin: 0 0 16px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--text-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.9;
}

/* 英雄区域优化 */
.hero-header {
  margin-bottom: 32px;
}

.hero-title {
  font-size: clamp(2.2rem, 4vw, 3.1rem);
  line-height: 1.2;
  margin-bottom: 16px;
  color: var(--text-primary);
  font-weight: 700;
}

.hero-description {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 1.1rem;
  margin-bottom: 24px;
}

.hero-features {
  margin: 32px 0;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--tag-bg);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.badge-item:hover {
  transform: translateX(5px);
  background: var(--accent-soft);
}

.badge-icon {
  color: var(--accent);
  font-weight: bold;
  font-size: 1.1rem;
}

/* 按钮优化 */
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 32px;
  align-items: center;
}

.btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn-icon {
  margin-right: 8px;
  font-size: 1.1rem;
}

.btn-contact {
  background: linear-gradient(135deg, var(--accent) 0%, #357abd 100%);
  box-shadow: 0 15px 35px rgba(74, 144, 226, 0.3);
}

.btn-contact:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(74, 144, 226, 0.4);
}

.btn-bot {
  border: 2px solid var(--card-outline);
  background: transparent;
}

.btn-bot:hover {
  background: var(--accent-soft);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.btn-home {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.btn-home:hover {
  transform: translateX(-5px);
}

/* 联系卡片优化 */
.contact-card {
  padding: 28px;
  border-radius: 24px;
  background: var(--card-bg);
  border: 1px solid var(--card-outline);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.contact-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--accent), var(--accent-soft));
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.card-icon {
  font-size: 2.5rem;
  background: var(--accent-soft);
  padding: 12px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title-area {
  flex: 1;
}

.qq-number {
  font-size: 2.2rem;
  color: var(--accent);
  margin: 8px 0;
  font-weight: 700;
}

.service-info {
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: block;
  margin-bottom: 12px;
}

.availability-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

/* 状态仪表板优化 */
.status-dashboard {
  margin-top: 24px;
}

.dashboard-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: var(--text-primary);
  text-align: center;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.status-card {
  padding: 20px;
  border-radius: 20px;
  background: var(--card-bg);
  border: 1px solid var(--card-outline);
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.status-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.status-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 4px;
}

.status-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.status-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  opacity: 0.8;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .page-header {
    padding: 40px 20px 30px;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .btn {
    justify-content: center;
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
  }
  
  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
  
  .contact-card {
    padding: 20px;
  }
  
  .qq-number {
    font-size: 1.8rem;
  }
}
</style>
