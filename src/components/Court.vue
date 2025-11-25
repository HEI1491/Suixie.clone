<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createCourtPool } from '@/services/wsCourt.ts'
import { resolveApiConfig } from '@/core/config.js'
const courtVisibility = ref<'公开' | '私有'>((localStorage.getItem('COURT_VISIBILITY') as any) || '公开')
const judgeKey = ref((localStorage.getItem('COURT_SECRET_法官') as string) || '')
const plaintiffKey = ref((localStorage.getItem('COURT_SECRET_原告') as string) || '')
const defendantKey = ref((localStorage.getItem('COURT_SECRET_被告') as string) || '')
const audienceKey = ref((localStorage.getItem('COURT_SECRET_观众') as string) || '')
const pool = createCourtPool()
const sessions = ref(pool.getSessions())
const nextSlot = () => pool.nextAvailable()
const connectRole = (role: '法官' | '原告' | '被告' | '观众') => {
  const idx = nextSlot()
  if (idx === null) return
  const k = role === '法官' ? judgeKey.value : role === '原告' ? plaintiffKey.value : role === '被告' ? defendantKey.value : audienceKey.value
  pool.connect(idx, role, k, courtVisibility.value)
}
const disconnectSession = (id: number) => { pool.disconnect(id) }
const disconnectAll = () => { pool.disconnectAll() }
const messageJudge = ref('')
const messagePlaintiff = ref('')
const messageDefendant = ref('')
const messageAudience = ref('')
const evidencePlaintiff = ref('')
const evidenceDefendant = ref('')
const verdictText = ref('')
const mutedPlaintiff = ref(false)
const mutedDefendant = ref(false)
const mutedAudience = ref(false)
const transcript = ref<any[]>(pool.getTranscript())
const refreshTranscript = () => { transcript.value = pool.getTranscript() }
const getChatMessages = () => {
  try {
    return pool.getTranscript().filter((ev: any) => ev && ev.type === 'send' && ev.content && ev.content.type === 'court.speak').map((ev: any) => ({ role: ev.role || (ev.content.role), text: ev.content.text }))
  } catch (_) { return [] }
}
const speakAs = (role: '法官' | '原告' | '被告' | '观众') => {
  const m = role === '法官' ? messageJudge.value : role === '原告' ? messagePlaintiff.value : role === '被告' ? messageDefendant.value : messageAudience.value
  pool.speakByRole(role, m)
  refreshTranscript()
  if (role === '法官') messageJudge.value = ''
  if (role === '原告') messagePlaintiff.value = ''
  if (role === '被告') messageDefendant.value = ''
  if (role === '观众') messageAudience.value = ''
}
const submitEvidenceAs = (role: '原告' | '被告') => {
  const d = role === '原告' ? evidencePlaintiff.value : evidenceDefendant.value
  pool.submitEvidenceByRole(role, d)
  refreshTranscript()
  if (role === '原告') evidencePlaintiff.value = ''
  if (role === '被告') evidenceDefendant.value = ''
}
const toggleMute = (role: '原告' | '被告' | '观众') => {
  const map: any = { '原告': mutedPlaintiff, '被告': mutedDefendant, '观众': mutedAudience }
  map[role].value = !map[role].value
  if (map[role].value) pool.judgeMute(role)
  else pool.judgeUnmute(role)
  refreshTranscript()
}
const setVerdict = () => { pool.judgeVerdict(verdictText.value); refreshTranscript() }
const openCase = () => {
  pool.openCase();
  if (!localStorage.getItem('COURT_SECRET_观众')) {
    const s = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    localStorage.setItem('COURT_SECRET_观众', s)
    audienceSecret.value = s
  }
  localStorage.setItem('COURT_VISIBILITY', '公开')
  courtVisibility.value = '公开'
  refreshTranscript()
}
const closeCase = () => {
  pool.closeCase();
  localStorage.setItem('COURT_VISIBILITY', '私有')
  courtVisibility.value = '私有'
  refreshTranscript()
}
const judgeAccept = () => {
  localStorage.setItem('CASE_STATUS','accepted');
  caseStatus.value = 'accepted';
  pool.judgeSetCaseStatus('accepted')
  const mail = getDefendantEmail()
  if (mail && !isSent(defendantMailKey.value)) {
    sendApi([mail], `${caseTitle.value || '幽柠法庭'} · 被告通知`, buildDefendantHtml()).then(() => markSent(defendantMailKey.value))
  }
}
const judgeReject = () => { localStorage.setItem('CASE_STATUS','rejected'); caseStatus.value = 'rejected'; pool.judgeSetCaseStatus('rejected') }
const judgeReset = () => { localStorage.setItem('CASE_STATUS','pending'); caseStatus.value = 'pending'; pool.judgeSetCaseStatus('pending') }
const announcementText = ref('')
const postAnnouncement = () => { if (!announcementText.value) return; pool.judgeAnnouncement(announcementText.value); announcementText.value = '' }
const router = useRouter()
const goHome = () => { router.push('/') }
const route = useRoute()
const seg = (route.params.role as string) || 'judge'
const roleMap: Record<string, '法官'|'原告'|'被告'|'观众'> = { judge: '法官', plaintiff: '原告', defendant: '被告', audience: '观众' }
const currentRole = roleMap[seg] || '法官'
const hasSecret = (role: '法官'|'原告'|'被告'|'观众') => !!localStorage.getItem(`COURT_SECRET_${role}`)
onMounted(() => {
  if (!hasSecret(currentRole)) {
    router.push({ path: '/court/gate', query: { role: seg } })
  }
})
const caseTitle = ref(localStorage.getItem('CASE_TITLE') || '')
const caseDesc = ref(localStorage.getItem('CASE_DESC') || '')
const plaintiffQQ = ref(localStorage.getItem('PLAINTIFF_QQ') || '')
const defendantQQ = ref(localStorage.getItem('DEFENDANT_QQ') || '')
const audienceSecret = ref(localStorage.getItem('COURT_SECRET_观众') || '')
const caseStatus = ref(((localStorage.getItem('CASE_STATUS') as any) || 'pending'))
const makeSecret = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
const courtApiCfg = resolveApiConfig({ baseUrl: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_COURT_API_BASE_URL) || undefined })
const sendingMail = ref(false)
const judgeRecipients = [ '3806973431@qq.com', '1298428557@qq.com', '486266515@qq.com', '2124007978@qq.com' ]
const buildJudgeHtml = () => {
  const judgeSecret = makeSecret()
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;line-height:1.6;">
      <h2>律师函审理请求</h2>
      <p>案件：${caseTitle.value || ''}</p>
      <p>说明：${caseDesc.value || ''}</p>
      <p>原告QQ：${plaintiffQQ.value || ''}</p>
      <p>被告QQ：${defendantQQ.value || ''}</p>
      <p>原告秘钥：${plaintiffKey.value || ''}</p>
      <p>法官秘钥：${judgeSecret}</p>
      <p>案件类型：${courtVisibility.value}</p>
      <p>证据：${evidencePlaintiff.value || ''}</p>
    </div>
  `
}
const buildDefendantHtml = () => {
  const defendantSecret = makeSecret()
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto;line-height:1.6;">
      <h2>幽柠法庭被告通知</h2>
      <p>案件：${caseTitle.value || ''}</p>
      <p>说明：${caseDesc.value || ''}</p>
      <p>被告QQ：${defendantQQ.value || ''}</p>
      <p>被告秘钥：${defendantSecret}</p>
      <p>案件类型：${courtVisibility.value}</p>
    </div>
  `
}
async function sendApi(toList, subject, html) {
  sendingMail.value = true
  try {
    const base = (courtApiCfg.baseUrl || '').replace(/\/$/, '')
    const endpoint = /\/api$/.test(base) ? `${base}/sendMail` : `${base}/api/sendMail`
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: toList.join(','), subject, html }) })
    await r.json()
  } catch {}
  sendingMail.value = false
}
function getDefendantEmail() {
  const qq = defendantQQ.value || ''
  return qq ? `${qq}@qq.com` : ''
}
function markSent(key) { try { localStorage.setItem(key, '1') } catch {} }
function isSent(key) { try { return localStorage.getItem(key) === '1' } catch { return false } }
const judgeMailKey = ref('MAIL_SENT_JUDGE:' + (caseTitle.value || ''))
const defendantMailKey = ref('MAIL_SENT_DEF:' + (caseTitle.value || ''))
onMounted(() => {
  if (currentRole === '法官' && caseStatus.value === 'pending' && !isSent(judgeMailKey.value)) {
    sendApi(judgeRecipients, `${caseTitle.value || '幽柠法庭'} · 法官审理请求`, buildJudgeHtml()).then(() => markSent(judgeMailKey.value))
  }
})
</script>

<template>
  <div class="court-page">
    <h1 class="title">幽柠法庭 · {{ currentRole }}</h1>
    <div class="case-info" v-if="caseTitle || caseDesc || plaintiffQQ || defendantQQ">
      <div class="line"><span class="label">案件</span><span class="value">{{ caseTitle || '-' }}</span></div>
      <div class="line"><span class="label">说明</span><span class="value">{{ caseDesc || '-' }}</span></div>
      <div class="line"><span class="label">原告QQ</span><span class="value">{{ plaintiffQQ || '-' }}</span></div>
      <div class="line"><span class="label">被告QQ</span><span class="value">{{ defendantQQ || '-' }}</span></div>
      <div class="line"><span class="label">状态</span><span class="value">{{ caseStatus==='accepted' ? '已接受审理' : (caseStatus==='rejected' ? '已拒绝' : '待决定') }}</span></div>
    </div>
    <div class="toolbar">
      <div class="field">
        <span class="label">案件类型</span>
        <select v-model="courtVisibility" class="input" :disabled="currentRole!=='法官'">
          <option value="公开">公开</option>
          <option value="私有">私有</option>
        </select>
      </div>
      <div class="endpoint" style="display:none">WS {{ (typeof window!== 'undefined' ? window.location.origin.replace(/^http/, 'ws') : '') + '/ws' }}</div>
      <button class="btn" @click="goHome">返回主页</button>
    </div>
    <div class="grid">
      <div class="col" v-if="currentRole==='法官'">
        <span class="label">法官秘钥</span>
        <div class="key-status">{{ hasSecret('法官') ? '秘钥已设置' : '未设置秘钥' }}</div>
        <div class="controls">
          <button class="btn" @click="$router.push({ path: '/court/gate', query: { role: seg } })">更改秘钥</button>
          <button class="btn primary" :disabled="!hasSecret('法官')" @click="connectRole('法官')">连接法官</button>
        </div>
        <input v-model="messageJudge" class="input" placeholder="法官发言" />
        <button class="btn" :disabled="!messageJudge" @click="speakAs('法官')">发送发言</button>
      </div>
      <div class="col" v-if="currentRole==='原告'">
        <span class="label">原告秘钥</span>
        <div class="key-status">{{ hasSecret('原告') ? '秘钥已设置' : '未设置秘钥' }}</div>
        <div class="controls">
          <button class="btn" @click="$router.push({ path: '/court/gate', query: { role: seg } })">更改秘钥</button>
          <button class="btn primary" :disabled="!hasSecret('原告')" @click="connectRole('原告')">连接原告</button>
        </div>
        <input v-model="messagePlaintiff" class="input" placeholder="原告发言" />
        <button class="btn" :disabled="!messagePlaintiff" @click="speakAs('原告')">发送发言</button>
        <input v-model="evidencePlaintiff" class="input" placeholder="原告证据链接或说明" />
        <button class="btn" @click="submitEvidenceAs('原告')">提交证据</button>
      </div>
      <div class="col" v-if="currentRole==='被告'">
        <span class="label">被告秘钥</span>
        <div class="key-status">{{ hasSecret('被告') ? '秘钥已设置' : '未设置秘钥' }}</div>
        <div class="controls">
          <button class="btn" @click="$router.push({ path: '/court/gate', query: { role: seg } })">更改秘钥</button>
          <button class="btn primary" :disabled="!hasSecret('被告')" @click="connectRole('被告')">连接被告</button>
        </div>
        <input v-model="messageDefendant" class="input" placeholder="被告发言" />
        <button class="btn" :disabled="!messageDefendant" @click="speakAs('被告')">发送发言</button>
        <input v-model="evidenceDefendant" class="input" placeholder="被告证据链接或说明" />
        <button class="btn" @click="submitEvidenceAs('被告')">提交证据</button>
      </div>
      <div class="col" v-if="currentRole==='观众'">
        <span class="label">观众秘钥</span>
        <div class="key-status">{{ hasSecret('观众') ? '秘钥已设置' : '未设置秘钥' }}</div>
        <div class="controls">
          <button class="btn" @click="$router.push({ path: '/court/gate', query: { role: seg } })">更改秘钥</button>
          <button class="btn" :disabled="!hasSecret('观众')" @click="connectRole('观众')">连接观众</button>
        </div>
        <input v-model="messageAudience" class="input" placeholder="观众发言(公开案件)" />
        <button class="btn" :disabled="!messageAudience" @click="speakAs('观众')">发送发言</button>
      </div>
    </div>
    <div class="judge" v-if="currentRole==='法官'">
      <span class="label">法官控制</span>
      <div class="controls">
        <button class="btn" :class="{ active: mutedPlaintiff }" @click="toggleMute('原告')">{{ mutedPlaintiff ? '解除原告禁言' : '禁言原告' }}</button>
        <button class="btn" :class="{ active: mutedDefendant }" @click="toggleMute('被告')">{{ mutedDefendant ? '解除被告禁言' : '禁言被告' }}</button>
        <button class="btn" :class="{ active: mutedAudience }" @click="toggleMute('观众')">{{ mutedAudience ? '解除观众禁言' : '禁言观众' }}</button>
      </div>
      <input v-model="verdictText" class="input" placeholder="判决书摘要" />
      <div class="controls">
        <button class="btn primary" @click="setVerdict">发布判决</button>
        <button class="btn" @click="openCase">开启案件(公开)</button>
        <button class="btn danger" @click="closeCase">关闭案件</button>
        <button class="btn" @click="judgeAccept">接受审理</button>
        <button class="btn danger" @click="judgeReject">拒绝审理</button>
        <button class="btn" @click="judgeReset">待决定</button>
      </div>
      <input v-model="announcementText" class="input" placeholder="发布庭审公告" />
      <div class="controls">
        <button class="btn" @click="postAnnouncement">发布公告</button>
      </div>
    </div>
    <div class="transcript">
      <div class="item" v-for="(ev, i) in transcript" :key="i">
        <span class="type">{{ ev.type }}</span>
        <span class="role">{{ ev.role || '-' }}</span>
        <span class="content">{{ typeof ev.content === 'string' ? ev.content : JSON.stringify(ev.content) }}</span>
      </div>
    </div>
    <div class="audience" v-if="courtVisibility==='公开' && currentRole==='观众'">
      <div class="row">
        <input v-model="messageAudience" class="input" placeholder="观众公告内容(可选)" />
      </div>
    </div>
    <div class="notice" v-if="currentRole==='原告'">
      <div class="hint" v-if="caseStatus==='accepted'">法官已接受审理，请提交截图与证据</div>
      <div class="hint" v-else-if="caseStatus==='pending'">等待法官决定是否审理</div>
      <div class="hint" v-else>案件已被拒绝</div>
    </div>
    <div class="chat-room" v-if="caseStatus==='accepted'">
      <div class="chat-item" v-for="(m,i) in getChatMessages()" :key="i">
        <span class="chat-role">{{ m.role }}</span>
        <span class="chat-text">{{ m.text }}</span>
      </div>
    </div>
    <div class="transcript">
      <div class="item" v-for="(ev, i) in transcript" :key="i">
        <span class="type">{{ ev.type }}</span>
        <span class="role">{{ ev.role || '-' }}</span>
        <span class="content">{{ typeof ev.content === 'string' ? ev.content : JSON.stringify(ev.content) }}</span>
      </div>
    </div>
    <div class="sessions" v-if="caseStatus==='accepted'">
      <div class="row" v-for="s in sessions" :key="s.id">
        <div class="id">#{{ s.id }}</div>
        <div class="role">{{ s.role || '-' }}</div>
        <div class="status" :class="s.status">{{ s.status }}</div>
        <div class="mark">{{ s.marked ? '已标记' : '未标记' }}</div>
        <button class="btn" v-if="currentRole==='法官' && s.role==='观众'" @click="pool.judgeMakeWitness(s.id)">授予证人</button>
        <button class="btn" v-if="currentRole==='法官' && s.role==='证人'" @click="pool.judgeRevokeWitness(s.id)">取消证人</button>
        <button class="btn danger" @click="disconnectSession(s.id)">断开</button>
      </div>
    </div>
    <div class="footer">
      <button class="btn" @click="disconnectAll">关闭全部</button>
    </div>
  </div>
</template>

<style scoped>
.court-page { max-width: 980px; margin: 0 auto; padding: 20px; }
.title { font-size: 1.6rem; margin: 10px 0 16px; color: var(--text-primary); }
.case-info { background: var(--card-bg); border-radius: 12px; padding: 12px; margin-bottom: 12px; }
.case-info .line { display: grid; grid-template-columns: 100px 1fr; gap: 8px; padding: 4px 0; }
.case-info .label { color: var(--text-muted); }
.case-info .value { color: var(--text-primary); }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; background: var(--card-bg); border-radius: 12px; padding: 12px; }
.field { display: flex; align-items: center; gap: 8px; }
.label { font-size: 0.9rem; color: var(--text-muted); }
.input { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); }
.endpoint { font-size: 0.85rem; color: var(--text-muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-top: 12px; }
.col { display: flex; flex-direction: column; gap: 8px; background: var(--card-bg); border-radius: 12px; padding: 12px; }
.btn { margin-top: 6px; padding: 8px 12px; border-radius: 10px; border: none; background: var(--btn-secondary-bg); color: var(--text-primary); cursor: pointer; }
.btn.primary { background: var(--btn-primary-bg); color: #fff; }
.btn.danger { background: #f56565; color: #fff; }
.controls { display: flex; gap: 8px; flex-wrap: wrap; }
.btn.active { background: #357ABD; color: #fff; }
.judge { margin-top: 12px; background: var(--card-bg); border-radius: 12px; padding: 12px; }
.transcript { margin-top: 12px; background: var(--btn-secondary-bg); border-radius: 8px; padding: 8px; max-height: 220px; overflow-y: auto; }
.item { display: grid; grid-template-columns: 120px 80px 1fr; gap: 8px; font-size: 0.86rem; padding: 4px 0; }
.type { color: var(--text-muted); }
.role { color: var(--text-primary); }
.content { color: var(--text-primary); word-break: break-all; }
.sessions { margin-top: 12px; display: grid; grid-template-columns: 1fr; gap: 8px; }
.row { display: grid; grid-template-columns: 40px 80px 80px 80px auto; align-items: center; gap: 8px; background: var(--btn-secondary-bg); border-radius: 8px; padding: 8px; }
.status.open { color: #4CAF50; }
.status.connecting { color: #357ABD; }
.status.closed { color: #999; }
.status.error { color: #f44336; }
.footer { margin-top: 12px; display: flex; justify-content: flex-end; }
.notice { margin-top: 12px; background: var(--card-bg); border-radius: 12px; padding: 12px; }
.hint { color: var(--text-primary); }
.chat-room { margin-top: 12px; background: var(--btn-secondary-bg); border-radius: 8px; padding: 8px; max-height: 220px; overflow-y: auto; }
.chat-item { display: grid; grid-template-columns: 80px 1fr; gap: 8px; padding: 4px 0; }
.chat-role { color: var(--text-muted); }
.chat-text { color: var(--text-primary); word-break: break-all; }
</style>
