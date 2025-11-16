<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme.js'

const tabs = [
  { key: 'general', label: '幽柠之域规定总则' },
  { key: 'agreement', label: '幽柠之域用户协议' },
  { key: 'management', label: '幽柠之域管理规定' },
  { key: 'guide', label: '幽柠之域用户指南' },
]
const activeTab = ref('general')
const bigManagers = ref<string[]>([])
const smallManagers = ref<string[]>([])
const { themeToggleLabel, themeIcon, cycleThemePreference } = useTheme()
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
    <header class="rules-header">
      <h1 class="rules-title">幽柠规则中心</h1>
      <router-link class="text-link btn-home" to="/"><span class="btn-icon">←</span> 返回首页</router-link>
    </header>

    <section class="lists-grid">
      <article class="list-card">
        <h2 class="list-title">大管理名单</h2>
        <ul class="list-body">
          <li v-for="(name, idx) in bigManagers" :key="idx" class="list-item">{{ name }}</li>
          <li v-if="bigManagers.length === 0" class="list-empty">暂无名单</li>
        </ul>
      </article>
      <article class="list-card">
        <h2 class="list-title">小名单管理</h2>
        <ul class="list-body">
          <li v-for="(name, idx) in smallManagers" :key="idx" class="list-item">{{ name }}</li>
          <li v-if="smallManagers.length === 0" class="list-empty">暂无名单</li>
        </ul>
      </article>
    </section>

    <nav class="doc-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab-btn"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </nav>

    <section class="doc-content">
      <div v-if="activeTab === 'general'" class="doc-section">
        <h3>幽柠之域规定总则</h3>
        <p>本总则规范幽柠之域的基础规则与行为准则，涵盖社区秩序、内容发布与违规处理等。后续将根据运营情况持续完善。</p>
      </div>
      <div v-else-if="activeTab === 'agreement'" class="doc-section">
        <h3>幽柠之域用户协议</h3>
        <p>该协议约定用户在平台的权利与义务、隐私与数据使用、账户安全与申诉流程等内容，进入使用即视为同意相关条款。</p>
      </div>
      <div v-else-if="activeTab === 'management'" class="doc-section">
        <h3>幽柠之域管理规定</h3>
        <p>管理规定明确管理职责、权限范围、执纪流程与公示机制，保障管理行为透明、规范、可追溯。</p>
      </div>
      <div v-else class="doc-section">
        <h3>幽柠之域用户指南</h3>
        <p>用户指南提供入门指引、常见问题与使用技巧，帮助新老用户更好地参与互动与维护社区良好氛围。</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rules-container { max-width: 980px; margin: 80px auto 40px; padding: 20px; }
.theme-toggle.fixed { width: 48px; height: 48px; font-size: 1.4rem; background-color: #e9ecef; color: #333; position: fixed; top: 18px; right: 24px; border-radius: 50%; border: none; z-index: 20; cursor: pointer; }
[data-theme='dark'] .theme-toggle.fixed { background-color: #343a40; color: #f8f9fa; }
.rules-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rules-title { font-size: 1.6rem; color: var(--text-primary); }
.lists-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 20px; }
.list-card { padding: 16px; background: var(--card-bg); border-radius: 16px; box-shadow: var(--shadow-lg); }
.list-title { font-size: 1.1rem; margin-bottom: 10px; color: var(--text-primary); }
.list-body { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.list-item { padding: 8px 10px; background: var(--btn-secondary-bg); border-radius: 10px; }
.list-empty { color: var(--text-muted); font-size: 0.9rem; }
.doc-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.tab-btn { padding: 8px 14px; border-radius: 999px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); cursor: pointer; }
.tab-btn.active { background: var(--accent-soft); border-color: var(--card-outline); }
.doc-content { padding: 16px; background: var(--card-bg); border-radius: 16px; box-shadow: var(--shadow-lg); }
.doc-section h3 { margin: 0 0 8px; font-size: 1.2rem; color: var(--text-primary); }
.doc-section p { margin: 0; color: var(--text-secondary); line-height: 1.7; }
@media (max-width: 768px) { .rules-container { margin: 70px 12px 24px; padding: 12px; } }
</style>