export type Role = '法官' | '原告' | '被告' | '观众'
export type Role = '法官' | '原告' | '被告' | '观众' | '证人'
export type Visibility = '公开' | '私有'

export interface Session {
  id: number
  ws: WebSocket | null
  status: 'idle' | 'connecting' | 'open' | 'closed' | 'error'
  role?: Role
  secret?: string
  marked: boolean
  visibility?: Visibility
  lastError?: string
}

export interface TranscriptEvent {
  ts: number
  type: string
  role?: Role
  content?: any
}

export interface CourtState {
  open: boolean
  visibility: Visibility
  muted: Record<Role, boolean>
  verdict?: string
  caseStatus?: 'pending' | 'accepted' | 'rejected'
}

import { resolveCourtConfig } from '@/core/courtConfig.js'

export function createCourtPool(endpoint?: string, capacity?: number) {
  const cfg = resolveCourtConfig()
  const url = endpoint || cfg.wsUrl
  const cap = capacity ?? cfg.capacity
  const sessions: Session[] = Array.from({ length: cap }, (_, i) => ({ id: i, ws: null, status: 'idle', marked: false }))
  const lastOfRole: Partial<Record<Role, number>> = {}
  const transcript: TranscriptEvent[] = []
  const state: CourtState = { open: true, visibility: '公开', muted: { 法官: false, 原告: false, 被告: false, 观众: false, 证人: false } }

  function connect(index: number, role: Role, secret: string, visibility: Visibility) {
    const s = sessions[index]
    if (!s) return
    if (state.verdict) {
      s.lastError = '案件已结案，禁止新连接'
      s.status = 'error'
      return
    }
    if (visibility === '私有' && role === '观众') {
      s.lastError = '私有案件不允许观众'
      s.status = 'error'
      return
    }
    state.visibility = visibility
    if (s.ws && s.status === 'open') s.ws.close()
    s.status = 'connecting'
    s.role = role
    s.secret = secret
    s.visibility = visibility
    try {
      const ws = new WebSocket(url)
      s.ws = ws
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', role, secret, visibility }))
        s.marked = true
        s.status = 'open'
        lastOfRole[role] = index
        transcript.push({ ts: Date.now(), type: 'connect', role, content: { index } })
      }
      ws.onmessage = e => {
        transcript.push({ ts: Date.now(), type: 'message', role, content: e.data })
      }
      ws.onerror = () => {
        s.status = 'error'
        s.lastError = '连接错误'
        transcript.push({ ts: Date.now(), type: 'error', role, content: s.lastError })
      }
      ws.onclose = () => {
        s.status = 'closed'
        transcript.push({ ts: Date.now(), type: 'close', role, content: { index } })
      }
    } catch (e) {
      s.status = 'error'
      s.lastError = '连接失败'
      transcript.push({ ts: Date.now(), type: 'error', role, content: s.lastError })
    }
  }

  function disconnect(index: number) {
    const s = sessions[index]
    if (!s) return
    if (s.ws) {
      try {
        s.ws.close()
      } catch {}
    }
    s.ws = null
    s.status = 'closed'
    if (s.role && lastOfRole[s.role] === index) delete lastOfRole[s.role]
    transcript.push({ ts: Date.now(), type: 'disconnect', role: s.role, content: { index } })
  }

  function send(index: number, payload: any) {
    const s = sessions[index]
    if (!s || !s.ws || s.status !== 'open') return
    if (!s.marked) return
    if (state.verdict) return
    try {
      s.ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload))
      transcript.push({ ts: Date.now(), type: 'send', role: s.role, content: payload })
    } catch {}
  }

  function ensureCanSpeak(role: Role) {
    if (!state.open) return false
    if (state.muted[role]) return false
    if (role === '观众') return false
    return true
  }

  function speakByRole(role: Role, text: string) {
    const idx = lastOfRole[role]
    if (idx === undefined || !text) return
    if (!ensureCanSpeak(role)) return
    send(idx, { type: 'court.speak', role, text })
  }

  function submitEvidenceByRole(role: Role, data: string) {
    const idx = lastOfRole[role]
    if (idx === undefined || !data) return
    if (role !== '原告' && role !== '被告') return
    if (!ensureCanSpeak(role)) return
    send(idx, { type: 'court.evidence', role, data })
  }

  function judgeMute(role: Role) {
    if (role === '法官') return
    state.muted[role] = true
    transcript.push({ ts: Date.now(), type: 'judge.mute', content: role })
  }

  function judgeUnmute(role: Role) {
    if (role === '法官') return
    state.muted[role] = false
    transcript.push({ ts: Date.now(), type: 'judge.unmute', content: role })
  }

  function judgeVerdict(text: string) {
    state.verdict = text || ''
    transcript.push({ ts: Date.now(), type: 'judge.verdict', content: text })
    const idx = lastOfRole['法官']
    if (idx !== undefined) send(idx, { type: 'court.verdict', role: '法官', text })
  }

  function judgeSetCaseStatus(status: 'pending' | 'accepted' | 'rejected') {
    state.caseStatus = status
    transcript.push({ ts: Date.now(), type: 'judge.caseStatus', content: status })
    const idx = lastOfRole['法官']
    if (idx !== undefined) send(idx, { type: 'court.caseStatus', role: '法官', status })
  }

  function openCase() {
    state.open = true
    transcript.push({ ts: Date.now(), type: 'case.open' })
  }

  function closeCase() {
    state.open = false
    transcript.push({ ts: Date.now(), type: 'case.close' })
  }

  function getSessions() {
    return sessions
  }

  function nextAvailable() {
    const idx = sessions.findIndex(x => x.status === 'idle' || x.status === 'closed' || x.status === 'error')
    return idx === -1 ? null : idx
  }

  function disconnectAll() {
    for (let i = 0; i < sessions.length; i++) disconnect(i)
  }

  function getTranscript() {
    return transcript
  }

  function isMuted(role: Role) {
    return !!state.muted[role]
  }

  function isCaseClosed() {
    return !!state.verdict
  }

  function judgeAnnouncement(text: string) {
    if (!text) return
    transcript.push({ ts: Date.now(), type: 'judge.announcement', content: text })
    const idx = lastOfRole['法官']
    if (idx !== undefined) send(idx, { type: 'court.announcement', role: '法官', text })
  }

  function judgeKickSession(index: number) {
    const s = sessions[index]
    if (!s) return
    const r = s.role
    disconnect(index)
    transcript.push({ ts: Date.now(), type: 'judge.kick', content: { index, role: r } })
  }

  function judgeKickRole(role: Role) {
    const idx = lastOfRole[role]
    if (idx === undefined) return
    judgeKickSession(idx)
  }

  function judgeMakeWitness(index: number) {
    const s = sessions[index]
    if (!s || s.role === '法官') return
    const prev = s.role
    s.role = '证人'
    if (prev && lastOfRole[prev] === index) delete lastOfRole[prev]
    lastOfRole['证人'] = index
    transcript.push({ ts: Date.now(), type: 'judge.makeWitness', content: { index } })
  }

  function judgeRevokeWitness(index: number) {
    const s = sessions[index]
    if (!s || s.role !== '证人') return
    s.role = '观众'
    if (lastOfRole['证人'] === index) delete lastOfRole['证人']
    lastOfRole['观众'] = index
    transcript.push({ ts: Date.now(), type: 'judge.revokeWitness', content: { index } })
  }

  return { connect, disconnect, send, getSessions, nextAvailable, disconnectAll, url, speakByRole, submitEvidenceByRole, judgeMute, judgeUnmute, judgeVerdict, judgeSetCaseStatus, openCase, closeCase, getTranscript, isMuted, isCaseClosed, judgeAnnouncement, judgeKickSession, judgeKickRole, judgeMakeWitness, judgeRevokeWitness }
}
