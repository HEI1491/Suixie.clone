const DEFAULT_ENDPOINT = import.meta.env.VITE_SUPPORT_BOT_ENDPOINT ?? '/api/support-bot' // 吹水机器人 API 端点
const DEFAULT_TOKEN = import.meta.env.VITE_SUPPORT_BOT_TOKEN ?? '' // 吹水机器人 API 令牌
const DEFAULT_MODEL = import.meta.env.VITE_SUPPORT_BOT_MODEL ?? 'gpt-4o-mini' // 吹水机器人 API 模型
const DEFAULT_TEMPERATURE = Number(import.meta.env.VITE_SUPPORT_BOT_TEMPERATURE ?? 0.3) // 吹水机器人 API 温度

export const botApi = {
  endpoint: DEFAULT_ENDPOINT, // 吹水机器人 API 端点传入
  token: DEFAULT_TOKEN, // 吹水机器人 API 令牌传入
  model: DEFAULT_MODEL, // 吹水机器人 API 模型传入
  temperature: DEFAULT_TEMPERATURE, // 吹水机器人 API 温度传入
  destinations: ['QQ 私信', '工单草稿', '巡检面板'] // 吹水机器人 API 目标
}

const baseHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  if (botApi.token) {
    headers.Authorization = `Bearer ${botApi.token}`
  }
  return headers
}

export async function chatWithBot(messages, overrides = {}) {
  const payload = {
    model: overrides.model ?? botApi.model,
    messages,
    temperature: overrides.temperature ?? botApi.temperature,
    stream: false,
    ...overrides.extraPayload
  }

  const headers = {
    ...baseHeaders(),
    ...overrides.headers
  }

  const response = await fetch(overrides.endpoint ?? botApi.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const fallback = await response.text().catch(() => '')
    throw new Error(`bot offline (${response.status}) ${fallback}`)
  }

  const data = await response.json()
  return (
    data.reply ??
    data.choices?.[0]?.message?.content ??
    '我已经记下啦，我们继续聊聊吧。'
  )
}

export const botDiagnostics = () => ({
  endpoint: botApi.endpoint,
  model: botApi.model,
  temperature: botApi.temperature
})
