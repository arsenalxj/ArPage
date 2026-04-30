// GET /api/favicon?url=https://...
// Returns { favicon: string|null, title: string|null }

const MAX_BODY = 50_000 // 50 KB for HTML parsing
const TIMEOUT_MS = 5_000
const MAX_REDIRECTS = 5

export const onRequestGet: PagesFunction = async (context) => {
  const urlParam = new URL(context.request.url).searchParams.get('url')
  if (!urlParam) return jsonError('Missing url param', 400)

  let target: URL
  try {
    target = new URL(urlParam)
  } catch {
    return jsonError('Invalid URL', 400)
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return jsonError('Only http/https URLs allowed', 400)
  }

  const result = await fetchFaviconAndTitle(target)
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } })
}

async function fetchFaviconAndTitle(
  target: URL,
): Promise<{ favicon: string | null; title: string | null }> {
  const origin = target.origin

  // Step 1 — try /favicon.ico directly
  const icoUrl = `${origin}/favicon.ico`
  const icoResult = await tryFetch(icoUrl)
  const icoOk =
    icoResult?.ok && icoResult.headers.get('Content-Type')?.startsWith('image/')

  // Step 2 — parse HTML for <link rel="icon"> and <title>
  let htmlFavicon: string | null = null
  let title: string | null = null

  const htmlResult = await tryFetch(target.href)
  if (htmlResult?.ok) {
    const ct = htmlResult.headers.get('Content-Type') ?? ''
    if (ct.includes('text/html')) {
      const chunk = await readBody(htmlResult, MAX_BODY)
      htmlFavicon = extractIconHref(chunk, origin)
      title = extractTitle(chunk)
    }
  }

  // Step 3 — Google S2 fallback
  const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=64`

  const favicon = icoOk ? icoUrl : htmlFavicon ?? googleFavicon

  return { favicon, title }
}

async function tryFetch(url: string): Promise<Response | null> {
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 ArPage-Favicon-Fetcher' },
    })
    return resp
  } catch {
    return null
  }
}

async function readBody(resp: Response, limit: number): Promise<string> {
  const reader = resp.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let total = 0
  while (total < limit) {
    const { done, value } = await reader.read()
    if (done || !value) break
    chunks.push(value)
    total += value.length
  }
  reader.cancel()
  const merged = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) { merged.set(c, offset); offset += c.length }
  return new TextDecoder().decode(merged)
}

function extractIconHref(html: string, origin: string): string | null {
  // Match <link rel="icon" ...> or <link rel="shortcut icon" ...>
  const re = /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const hrefMatch = /href=["']([^"']+)["']/.exec(match[0])
    if (hrefMatch) {
      const href = hrefMatch[1]
      if (href.startsWith('http')) return href
      if (href.startsWith('//')) return `https:${href}`
      if (href.startsWith('/')) return `${origin}${href}`
      return `${origin}/${href}`
    }
  }
  return null
}

function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([^<]{1,200})<\/title>/i.exec(html)
  return match ? match[1].trim() : null
}

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
