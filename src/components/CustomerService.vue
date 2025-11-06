<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const aiServiceUrl = ref('https://example.com/ai-service')
const manualServiceQQ = ref('123456789')

const openAiService = () => {
  window.open(aiServiceUrl.value, '_blank')
}

const openManualService = () => {
  const qqUrl = `https://wpa.qq.com/msgrd?v=3&uin=${manualServiceQQ.value}&site=qq&menu=yes`
  window.open(qqUrl, '_blank')
}

onMounted(() => {
  document.title = '和幽柠聊聊 - 私人小站客服'
})
</script>

<template>
  <div class="support-wrapper">
    <header class="support-header">
      <button class="back-button" @click="router.back()">← 返回</button>
      <div class="header-avatar" aria-hidden="true">🌿</div>
      <h1 class="support-title">幽柠的小客栈</h1>
      <p class="support-description">
        欢迎光临我的小角落～如果你遇到问题，先和我家的 AI 小精灵聊聊，或者直接戳我 QQ，超快回复！
      </p>
    </header>

    <section class="support-card">
      <div class="card-content">
        <span class="tag">我的 AI 小帮手</span>
        <h2 class="card-title">「幽幽」的小树洞</h2>
        <p class="card-subtitle">
          这是我自己折腾出来的轻量 AI 助理，懂得不少常见问题，也会安慰人。如果你有好玩的想法，尽管来聊聊。
        </p>
        <ul class="feature-list">
          <li>随时随地敲它，回复超快</li>
          <li>支持用口语聊天，不用刻意</li>
          <li>喜欢听你吐槽，也会给小建议</li>
        </ul>
        <button class="primary-action" @click="openAiService">和幽幽聊聊</button>
        <p class="action-tip">Tip：AI 的地址可以在后台自由换成你喜欢的模型。</p>
      </div>
      <div class="card-illustration">
        <div class="doodle notebook"></div>
        <div class="doodle spark"></div>
        <span class="bot-icon">🌱</span>
      </div>
    </section>

    <section class="support-card secondary">
      <div class="card-content">
        <span class="tag alt">想找真人？</span>
        <h2 class="card-title">戳我 QQ 直接说</h2>
        <p class="card-subtitle">
          有些事情和真人聊更踏实。点下面的小按钮就能打开 QQ，或者记下号码慢慢来。
        </p>
        <div class="manual-info">
          <span class="manual-label">QQ：</span>
          <span class="manual-value">{{ manualServiceQQ }}</span>
        </div>
        <button class="secondary-action" @click="openManualService">联系幽柠本人</button>
        <p class="action-tip">工作日白天在，晚上和周末也会抽空看消息～</p>
      </div>
      <div class="card-illustration">
        <div class="doodle envelope"></div>
        <span class="bot-icon human">😄</span>
      </div>
    </section>

    <footer class="support-footer">
      <h3>小栈留言板</h3>
      <ul>
        <li>游戏打不开？记得截图或者复制报错信息给我。</li>
        <li>想提新功能？直接告诉我你的想法，手绘草图也行！</li>
        <li>
          想多了解？可以先翻翻
          <a href="https://example.com/help" target="_blank" rel="noopener">这个笔记合集</a>，都是我自己写的教程。
        </li>
      </ul>
    </footer>
  </div>
</template>

<style scoped>
.support-wrapper {
  min-height: 100vh;
  padding: 40px 20px 80px;
  background: linear-gradient(180deg, rgba(255, 240, 220, 0.65), rgba(255, 255, 255, 0.95));
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.support-header {
  max-width: 960px;
  margin: 0 auto;
  text-align: center;
  position: relative;
}

.header-avatar {
  width: 76px;
  height: 76px;
  margin: 0 auto 12px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 12px 30px rgba(255, 180, 120, 0.35);
}

.support-title {
  font-size: 2.6rem;
  margin: 6px 0 12px;
  color: #5f3c2c;
  letter-spacing: 0.05em;
}

.support-description {
  color: #705a4b;
  margin: 0;
  line-height: 1.8;
}

.back-button {
  position: absolute;
  left: 0;
  top: 8px;
  background: transparent;
  border: none;
  color: #5f3c2c;
  font-size: 1rem;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  transition: background 0.2s ease;
}

.back-button:hover {
  background: rgba(95, 60, 44, 0.12);
}

.support-card {
  max-width: 960px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 28px;
  padding: 36px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  box-shadow: 0 20px 45px rgba(222, 140, 90, 0.15);
  border: 1px solid rgba(255, 182, 121, 0.45);
  position: relative;
  overflow: hidden;
}

.support-card.secondary {
  background: linear-gradient(135deg, rgba(255, 230, 214, 0.9), rgba(255, 255, 255, 0.95));
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tag {
  align-self: flex-start;
  padding: 4px 12px;
  border-radius: 12px;
  background: rgba(255, 205, 158, 0.3);
  color: #a05c31;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

.tag.alt {
  background: rgba(166, 196, 255, 0.35);
  color: #34548c;
}

.card-title {
  font-size: 1.9rem;
  margin: 0;
  color: #50372b;
}

.card-subtitle {
  margin: 0;
  color: #6e584c;
  line-height: 1.6;
}

.feature-list {
  margin: 0;
  padding-left: 20px;
  color: #5d4a40;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.primary-action,
.secondary-action {
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.primary-action {
  background: linear-gradient(135deg, #ffb36a, #f77f94);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(247, 127, 148, 0.25);
}

.primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(247, 127, 148, 0.3);
}

.secondary-action {
  background: #ffffff;
  color: #4a4a4a;
  border: 2px dashed rgba(74, 74, 74, 0.4);
  box-shadow: 0 10px 20px rgba(90, 74, 70, 0.18);
}

.secondary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(90, 74, 70, 0.25);
}

.action-tip {
  font-size: 0.9rem;
  color: #897c72;
}

.manual-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1.1rem;
  color: #50372b;
  font-weight: 600;
}

.manual-label {
  font-weight: 500;
  color: #a05c31;
}

.manual-value {
  letter-spacing: 0.08em;
}

.card-illustration {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.bot-icon {
  font-size: 3rem;
  position: relative;
  z-index: 2;
}

.bot-icon.human {
  font-size: 3.5rem;
}

.doodle {
  position: absolute;
  background-repeat: no-repeat;
  background-size: contain;
  opacity: 0.9;
}

.doodle.notebook {
  width: 160px;
  height: 160px;
  top: 10px;
  right: 10px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 194, 145, 0.55), rgba(255, 245, 230, 0.95));
  box-shadow: 0 16px 35px rgba(255, 177, 125, 0.35);
}

.doodle.spark {
  width: 110px;
  height: 110px;
  bottom: 20px;
  left: 30px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 235, 180, 0.9), rgba(255, 183, 197, 0.1));
}

.doodle.envelope {
  width: 160px;
  height: 120px;
  top: 40px;
  right: 30px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(186, 210, 255, 0.6), rgba(246, 250, 255, 0.9));
  box-shadow: 0 16px 35px rgba(110, 143, 210, 0.25);
}

.support-footer {
  max-width: 960px;
  margin: 0 auto 40px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 10px 24px rgba(222, 140, 90, 0.15);
  border: 1px dashed rgba(255, 194, 145, 0.6);
}

.support-footer h3 {
  margin-top: 0;
  color: #5f3c2c;
}

.support-footer ul {
  margin: 12px 0 0;
  padding-left: 20px;
  color: #705a4b;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.support-footer a {
  color: #f77f94;
  font-weight: 600;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .support-wrapper {
    padding: 24px 16px 60px;
  }

  .support-card {
    padding: 26px;
  }

  .support-title {
    font-size: 2.2rem;
  }

  .back-button {
    position: relative;
    margin-bottom: 12px;
  }

  .header-avatar {
    width: 64px;
    height: 64px;
  }
}
</style>
