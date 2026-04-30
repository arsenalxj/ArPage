import { getCookie } from '../_lib/cookie'
import { hmacSha256, timingSafeEqual } from '../_lib/crypto'

interface Env {
  BOOKMARKS: KVNamespace
  PASSWORD: string
  AUTH_SECRET: string
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context
  const url = new URL(request.url)

  // Allow login endpoint through without auth
  if (request.method === 'POST' && url.pathname === '/api/auth') {
    return context.next()
  }

  const token = getCookie(request, 'auth_token')
  if (!token) return json401()

  const dot = token.lastIndexOf('.')
  if (dot < 0) return json401()

  const expires = token.slice(0, dot)
  const sig = token.slice(dot + 1)

  if (Date.now() > parseInt(expires, 10)) return json401()

  const expected = await hmacSha256(expires, context.env.AUTH_SECRET)
  if (!timingSafeEqual(expected, sig)) return json401()

  return context.next()
}

function json401(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })
}
