interface Env {
  BOOKMARKS: KVNamespace
}

interface Group {
  id: string
  name: string
  order: number
}

interface Bookmark {
  id: string
  groupId: string
  title: string
  url: string
  favicon: string | null
  pinned: boolean
  order: number
  pinnedOrder: number | null
  createdAt: number
}

interface AppData {
  version: number
  updatedAt: number
  groups: Group[]
  bookmarks: Bookmark[]
}

// GET /api/bookmarks
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const raw = await context.env.BOOKMARKS.get('data')
  if (!raw) {
    const empty: AppData = { version: 0, updatedAt: Date.now(), groups: [], bookmarks: [] }
    return json(empty)
  }
  return new Response(raw, { headers: { 'Content-Type': 'application/json' } })
}

// PUT /api/bookmarks
export const onRequestPut: PagesFunction<Env> = async (context) => {
  let body: AppData
  try {
    body = await context.request.json()
  } catch {
    return jsonError('Invalid JSON', 400)
  }

  const err = validate(body)
  if (err) return jsonError(err, 400)

  const raw = await context.env.BOOKMARKS.get('data')
  const current: AppData | null = raw ? JSON.parse(raw) : null
  const currentVersion = current?.version ?? 0

  if (body.version !== currentVersion) {
    return jsonError('Version conflict — please refresh and retry', 409)
  }

  const toSave: AppData = { ...body, version: currentVersion + 1, updatedAt: Date.now() }
  await context.env.BOOKMARKS.put('data', JSON.stringify(toSave))
  return json(toSave)
}

function validate(data: AppData): string | null {
  if (!Array.isArray(data.groups) || !Array.isArray(data.bookmarks)) return 'Invalid data shape'

  const groupIds = new Set(data.groups.map(g => g.id))
  const bmIds = new Set<string>()

  for (const g of data.groups) {
    if (!g.id || !g.name || typeof g.order !== 'number') return `Invalid group: ${g.id}`
  }

  for (const b of data.bookmarks) {
    if (!b.id || !b.title || !b.url) return `Invalid bookmark: ${b.id}`
    if (!b.title.trim() || b.title.length > 120) return `Bookmark title invalid: ${b.id}`
    if (!groupIds.has(b.groupId)) return `Bookmark groupId not found: ${b.id}`
    if (!isValidHttpUrl(b.url)) return `Invalid URL: ${b.id}`
    if (typeof b.order !== 'number') return `Invalid order: ${b.id}`
    if (b.pinnedOrder !== null && typeof b.pinnedOrder !== 'number') return `Invalid pinnedOrder: ${b.id}`
    if (bmIds.has(b.id)) return `Duplicate bookmark id: ${b.id}`
    bmIds.add(b.id)
  }

  return null
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function json(data: unknown): Response {
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
}

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
