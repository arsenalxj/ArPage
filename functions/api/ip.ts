interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const ip = getClientIp(context.request)
  if (!ip) {
    return new Response(JSON.stringify({ error: 'IP not available' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ip }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

function getClientIp(request: Request): string | null {
  const cloudflareIp = request.headers.get('CF-Connecting-IP')?.trim()
  if (cloudflareIp) return cloudflareIp

  const forwardedFor = request.headers.get('x-forwarded-for')
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim()
  if (firstForwardedIp) return firstForwardedIp

  return null
}
