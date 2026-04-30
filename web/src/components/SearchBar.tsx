import { KeyboardEvent, useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onEnter: (v: string) => void
}

export function SearchBar({ value, onChange, onEnter }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: globalThis.KeyboardEvent) {
      if (e.key !== '/') return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      ref.current?.focus()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const v = value.trim()
    if (!v) return
    onEnter(v)
  }

  function handleEnterClick() {
    const v = value.trim()
    if (!v) return
    onEnter(v)
  }

  return (
    <div className="flex justify-center px-12 pt-6 pb-5">
      <div className="relative w-[660px]">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-pale pointer-events-none">
          <SearchIcon />
        </span>

        <input
          ref={ref}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索书签，或按 Enter 跳转 Google…"
          className="w-full h-[50px] pl-[46px] pr-16 rounded-lg border border-border-default
            bg-paper font-body text-[15px] text-ink shadow-ink-1 outline-none
            focus:border-ink focus:shadow-ink-2f placeholder:text-ink-muted transition-shadow"
        />

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <button
              onClick={handleEnterClick}
              className="text-[10px] font-mono tracking-wide text-ink-pale hover:text-ink transition-colors px-1"
            >
              Enter ↵
            </button>
          ) : (
            <kbd className="bg-paper-section border border-border-default rounded-xs px-1.5 py-0.5
              font-mono text-[11px] text-ink-pale leading-snug">
              /
            </kbd>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7.5" cy="7.5" r="5" />
      <path d="M12 12l3.5 3.5" strokeLinecap="round" />
    </svg>
  )
}
