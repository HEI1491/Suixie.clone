<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { validators } from '@/services/validators.js'
const router = useRouter()
const route = useRoute()
const roleSeg = (route.query.role as string) || ''
const roleMap: Record<string, '法官'|'原告'|'被告'|'观众'> = { judge: '法官', plaintiff: '原告', defendant: '被告', audience: '观众' }
const selectedRole = ref<'法官'|'原告'|'被告'|'观众'>(roleMap[roleSeg] || '法官')
const visibility = ref<'公开'|'私有'>((localStorage.getItem('COURT_VISIBILITY') as any) || '公开')
const secret = ref('')
const defendantQQ = ref('')
const plaintiffQQ = ref('')
const caseDesc = ref('')
const setRole = (r: '法官'|'原告'|'被告'|'观众') => { selectedRole.value = r }
const saveAndEnter = () => {
  try { validators.secretForRole(selectedRole.value, secret.value) } catch (e) { alert(e?.message || '秘钥无效'); return }
  if (selectedRole.value === '原告') {
    try { validators.qq(plaintiffQQ.value); validators.qq(defendantQQ.value) } catch (e) { alert(e?.message || 'QQ格式无效'); return }
  }
  localStorage.setItem(`COURT_SECRET_${selectedRole.value}`, secret.value)
  localStorage.setItem('COURT_VISIBILITY', visibility.value)
  if (selectedRole.value === '原告') {
    if (caseDesc.value) localStorage.setItem('CASE_DESC', caseDesc.value)
    localStorage.setItem('PLAINTIFF_QQ', plaintiffQQ.value)
    localStorage.setItem('DEFENDANT_QQ', defendantQQ.value)
  }
  const seg = Object.entries(roleMap).find(([, v]) => v === selectedRole.value)?.[0] || 'judge'
  router.push(`/court/${seg}`)
}
</script>

<template>
  <div class="gate">
    <h1 class="title">幽柠法庭 · 获取秘钥</h1>
    <div class="links">
      <button class="btn" @click="$router.push('/court/appeal')">原告申诉</button>
    </div>
    <div class="roles">
      <button class="btn" :class="{ active: selectedRole==='法官' }" @click="setRole('法官')">法官</button>
      <button class="btn" :class="{ active: selectedRole==='原告' }" @click="setRole('原告')">原告</button>
      <button class="btn" :class="{ active: selectedRole==='被告' }" @click="setRole('被告')">被告</button>
      <button class="btn" :class="{ active: selectedRole==='观众' }" @click="setRole('观众')">观众</button>
    </div>
  <div class="form">
    
    <div v-if="selectedRole==='原告'" class="qq-block">
      <label class="label">原告案件申述请求</label>
      <textarea v-model="caseDesc" class="input" rows="4" placeholder="请在这里填写一个原告案件申述请求"></textarea>
      <span class="label">原告QQ</span>
      <input v-model="plaintiffQQ" class="input" placeholder="请输入原告QQ(5-12位数字)" />
      <span class="label">被告QQ</span>
      <input v-model="defendantQQ" class="input" placeholder="请输入被告QQ(5-12位数字)" />
    </div>
    <label class="label">案件类型</label>
    <select v-model="visibility" class="input">
      <option value="公开">公开</option>
      <option value="私有">私有</option>
    </select>
      <label class="label">输入秘钥</label>
      <input v-model="secret" class="input" type="password" placeholder="请输入秘钥" />
      <div class="controls">
        <button class="btn primary" @click="saveAndEnter">入场</button>
        <button class="btn" v-if="selectedRole==='原告'" @click="$router.push('/court/appeal')">起诉</button>
      </div>
      <div class="hint">私有案件不允许观众进入</div>
    </div>
  </div>
</template>

<style scoped>
.gate { max-width: 640px; margin: 0 auto; padding: 24px; }
.title { font-size: 1.6rem; margin-bottom: 16px; color: var(--text-primary); }
.roles { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.btn { padding: 8px 12px; border-radius: 8px; border: none; background: var(--btn-secondary-bg); color: var(--text-primary); cursor: pointer; }
.btn.primary { background: var(--btn-primary-bg); color: #fff; margin-top: 10px; }
.btn.active { background: #357ABD; color: #fff; }
.form { display: flex; flex-direction: column; gap: 6px; background: var(--card-bg); border-radius: 12px; padding: 12px; }
.label { font-size: 0.9rem; color: var(--text-muted); }
.input { padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); }
.hint { margin-top: 6px; font-size: 0.85rem; color: var(--text-muted); }
.links { margin-bottom: 10px; }
.qq-block { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
</style>
