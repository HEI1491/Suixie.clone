<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { validators } from '@/services/validators.js'
import { resolveApiConfig } from '@/core/config.js'
const router = useRouter()
const title = ref('')
const description = ref('')
const plaintiffQQ = ref('')
const defendantQQ = ref('')
const defendantEmail = ref('')
const makeSecret = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
const plaintiffSecret = ref('')
const nextJudgeSecret = ref('')
const nextDefendantSecret = ref('')
const visibility = ref<'公开'|'私有'>('公开')
const evidence = ref('')
const caseStatus = ref(((localStorage.getItem('CASE_STATUS') as any) || 'pending'))
const genAll = () => {
  try { validators.qq(plaintiffQQ.value); validators.qq(defendantQQ.value) } catch (e) { alert(e?.message || 'QQ格式无效'); return }
  defendantEmail.value = defendantQQ.value ? `${defendantQQ.value}@qq.com` : ''
  plaintiffSecret.value = `P-${plaintiffQQ.value}-${defendantQQ.value}-${makeSecret()}`
}
const saveSecrets = () => {
  if (!plaintiffSecret.value) return
  localStorage.setItem('COURT_SECRET_原告', plaintiffSecret.value)
  localStorage.setItem('COURT_VISIBILITY', visibility.value)
  localStorage.setItem('CASE_TITLE', title.value)
  localStorage.setItem('CASE_DESC', description.value)
  localStorage.setItem('PLAINTIFF_QQ', plaintiffQQ.value)
  localStorage.setItem('DEFENDANT_QQ', defendantQQ.value)
  localStorage.setItem('CASE_EVIDENCE', evidence.value)
  localStorage.setItem('CASE_STATUS', 'pending')
}
const enterPlaintiff = () => {
  try { validators.qq(plaintiffQQ.value); validators.qq(defendantQQ.value) } catch (e) { alert(e?.message || 'QQ格式无效'); return }
  saveSecrets(); router.push('/court/plaintiff')
}
const judgeRecipients = [
  '3806973431@qq.com',
  '1298428557@qq.com',
  '486266515@qq.com',
  '2124007978@qq.com'
]
const sending = ref(false)
const apiCfg = resolveApiConfig({ baseUrl: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COURT_API_BASE_URL) || undefined })
const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制到剪贴板')
  } catch (_) {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
    alert('已复制到剪贴板')
  }
}
</script>

<template>
  <div class="appeal">
    <h1 class="title">幽柠法庭 · 原告申诉</h1>
  <div class="form">
    <label class="label">案件标题</label>
    <input v-model="title" class="input" placeholder="输入案件标题" />
    <label class="label">申诉内容</label>
    <textarea v-model="description" class="input" rows="4" placeholder="输入申诉描述"></textarea>
    <label class="label">证据说明（可粘贴截图链接）</label>
    <textarea v-model="evidence" class="input" rows="4" placeholder="请输入证据说明或若干链接"></textarea>
    <div class="grid">
        <div class="col">
          <span class="label">原告QQ号</span>
          <input v-model="plaintiffQQ" class="input" placeholder="请输入原告QQ号" />
        </div>
        <div class="col">
          <span class="label">被告QQ号</span>
          <input v-model="defendantQQ" class="input" placeholder="请输入被告QQ号" />
        </div>
        <div class="col">
          <span class="label">被告邮箱</span>
          <input v-model="defendantEmail" class="input" placeholder="被告邮箱(自动填充QQ邮箱)" />
        </div>
        <div class="col">
          <span class="label">案件类型</span>
          <select v-model="visibility" class="input">
            <option value="公开">公开</option>
            <option value="私有">私有</option>
          </select>
        </div>
      </div>
      <div class="controls">
        <button class="btn" @click="genAll" :disabled="!plaintiffQQ || !defendantQQ">生成秘钥</button>
        <button class="btn primary" @click="enterPlaintiff" :disabled="!plaintiffSecret">保存并进入原告法庭</button>
      </div>
    </div>
  <div class="secrets" v-if="plaintiffSecret">
      <div class="row">
        <span class="role">原告秘钥</span>
        <span class="code">{{ plaintiffSecret }}</span>
        <button class="btn" @click="copyText(plaintiffSecret)" :disabled="!plaintiffSecret">复制</button>
      </div>
      <div class="row">
        <span class="role">提示</span>
        <span class="code">法官将自动收到审理请求，接受审理后再通知被告</span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appeal { max-width: 860px; margin: 0 auto; padding: 20px; }
.title { font-size: 1.6rem; margin-bottom: 16px; color: var(--text-primary); }
.form { display: flex; flex-direction: column; gap: 8px; background: var(--card-bg); border-radius: 12px; padding: 12px; }
.label { font-size: 0.9rem; color: var(--text-muted); }
.input { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.col { display: flex; flex-direction: column; gap: 6px; }
.controls { display: flex; gap: 8px; }
.btn { padding: 8px 12px; border-radius: 8px; border: none; background: var(--btn-secondary-bg); color: var(--text-primary); cursor: pointer; }
.btn.primary { background: var(--btn-primary-bg); color: #fff; }
.secrets { margin-top: 12px; background: var(--btn-secondary-bg); border-radius: 12px; padding: 12px; }
.row { display: grid; grid-template-columns: 100px 1fr auto; align-items: center; gap: 12px; padding: 6px 0; }
.role { color: var(--text-muted); }
.code { color: var(--text-primary); word-break: break-all; }
.link { color: var(--link-color); }
</style>
