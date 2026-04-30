import { FormEvent, useState } from 'react'

interface Props {
  onLogin: () => void
}

export function LoginPage({ onLogin }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        onLogin()
      } else {
        setError('密码错误')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper-bg eink-grain flex flex-col items-center justify-center">
      <div
        className="w-[400px] bg-paper border border-border-default rounded-xl p-10 shadow-ink-5"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="font-display text-4xl font-bold tracking-tight text-ink">ArPage</div>
          <div className="font-body text-sm italic text-ink-muted mt-1">个人书签导航</div>
        </div>

        <div className="border-t border-border-default mb-6" />

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-ink-label tracking-wide mb-1.5 font-body">
            访问密码
          </label>
          <div className="relative mb-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-pale pointer-events-none">
              <LockIcon />
            </span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="输入访问密码"
              className={[
                'w-full h-11 pl-9 pr-4 rounded-[7px] border bg-paper text-ink font-body text-sm outline-none',
                'transition-shadow',
                error
                  ? 'border-ink focus:shadow-ink-2f'
                  : 'border-border-default focus:border-ink focus:shadow-ink-2f',
              ].join(' ')}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs italic text-ink-mid font-body mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full h-11 bg-ink text-paper rounded-[7px] font-body text-sm font-medium
              hover:bg-ink-dark transition-colors disabled:bg-ink-pale disabled:cursor-not-allowed"
          >
            {loading ? '验证中…' : '进入'}
          </button>
        </form>
      </div>

      <div className="font-mono text-[10px] tracking-widest text-border-section uppercase mt-7"
        style={{ position: 'relative', zIndex: 1 }}>
        PERSONAL · SELF-HOSTED · CLOUDFLARE
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="9" height="8" rx="2" />
      <path d="M5 6V4.5a2.5 2.5 0 015 0V6" />
    </svg>
  )
}
