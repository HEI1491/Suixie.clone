function readEnv() {
  try {
    return import.meta?.env ?? {}
  } catch {
    return {}
  }
}

export function resolveCourtConfig(overrides = {}) {
  const env = readEnv()
  const wsBase = overrides.wsBaseUrl ?? env.VITE_WS_BASE_URL ?? (env.VITE_API_BASE_URL || '')
  const wsPath = overrides.wsPath ?? env.VITE_WS_PATH ?? '/ws'
  const capacity = Number(overrides.capacity ?? env.VITE_COURT_CAPACITY ?? 16)
  const base = String(wsBase || '').replace(/^http/, 'ws').replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin.replace(/^http/, 'ws') : '')
  const path = wsPath.startsWith('/') ? wsPath : `/${wsPath}`
  const wsUrl = base + path
  return { wsBaseUrl: base, wsPath: path, wsUrl, capacity }
}
