// GET /api/weibo-hot
// Returns normalized Weibo hot search items.

const WEIBO_HOT_URL = 'https://weibo.com/ajax/side/hotSearch'
const TIMEOUT_MS = 5_000
const CACHE_TTL_SECONDS = 300
const MAX_ITEMS = 50
const ALLOWED_LABELS = new Set(['热', '沸', '新', '爆'])

interface WeiboHotResponse {
  items: WeiboHotItem[]
  updatedAt: number
}

interface WeiboHotItem {
  rank: number
  title: string
  hot: number | null
  url: string
  label: string | null
}

interface WeiboRealtimeItem {
  word?: unknown
  num?: unknown
  raw_hot?: unknown
  label_name?: unknown
}

interface WeiboHotPayload {
  ok?: unknown
  data?: {
    realtime?: unknown
  }
}

export const onRequestGet: PagesFunction = async (context) => {
  const requestUrl = new URL(context.request.url)
  const refresh = requestUrl.searchParams.get('refresh') === '1'
  const cacheKey = new Request(normalizedCacheUrl(requestUrl), { method: 'GET' })
  const cache = caches.default

  if (!refresh) {
    const cached = await cache.match(cacheKey)
    if (cached) return cached
  }

  try {
    const data = await fetchWeiboHot()
    const response = json(data, 200, {
      'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
    })
    context.waitUntil(cache.put(cacheKey, response.clone()))
    return response
  } catch {
    return jsonError('Weibo hot search unavailable', 502)
  }
}

async function fetchWeiboHot(): Promise<WeiboHotResponse> {
  const resp = await fetch(WEIBO_HOT_URL, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://weibo.com/',
    },
  })

  if (!resp.ok) {
    throw new Error('Upstream failed')
  }

  const payload = await resp.json<WeiboHotPayload>()
  const realtime = payload.data?.realtime
  if (payload.ok !== 1 || !Array.isArray(realtime)) {
    throw new Error('Invalid upstream shape')
  }

  const items = realtime
    .slice(0, MAX_ITEMS)
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is WeiboHotItem => item !== null)

  if (items.length === 0) {
    throw new Error('No valid hot search items')
  }

  return {
    items,
    updatedAt: Date.now(),
  }
}

function normalizeItem(raw: unknown, index: number): WeiboHotItem | null {
  if (!isRecord(raw)) return null

  const item = raw as WeiboRealtimeItem
  const title = typeof item.word === 'string' ? item.word.trim() : ''
  if (!title) return null

  const hot = toNumberOrNull(item.num) ?? toNumberOrNull(item.raw_hot)
  const label = typeof item.label_name === 'string' && ALLOWED_LABELS.has(item.label_name)
    ? item.label_name
    : null

  return {
    rank: index + 1,
    title,
    hot,
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
    label,
  }
}

function normalizedCacheUrl(url: URL): string {
  const normalized = new URL(url)
  normalized.search = ''
  return normalized.toString()
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

function jsonError(msg: string, status: number): Response {
  return json({ error: msg }, status)
}
