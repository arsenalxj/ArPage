import { clearCookieHeader, setCookieHeader } from '../_lib/cookie'
import { hmacSha256, sha256, timingSafeEqual } from '../_lib/crypto'

interface Env {
  PASSWORD: string
  AUTH_SECRET: string
}

// POST /api/auth — login
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { password?: string }
  try {
    body = await context.request.json()
  } catch {
    return jsonError('Invalid request body', 400)
  }

  if (!body.password) return jsonError('Missing password', 400)

  const inputHash = await sha256(body.password)
  const storedHash = await sha256(context.env.PASSWORD)

  if (!timingSafeEqual(inputHash, storedHash)) {
    return jsonError('Invalid password', 401)
  }

  const expires = (Date.now() + 30 * 24 * 60 * 60 * 1000).toString()
  const sig = await hmacSha256(expires, context.env.AUTH_SECRET)
  const token = `${expires}.${sig}`

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': setCookieHeader('auth_token', token, 2592000),
    },
  })
}

// DELETE /api/auth — logout
export const onRequestDelete: PagesFunction = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearCookieHeader('auth_token'),
    },
  })
}

function jsonError(msg: string, status: number): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
