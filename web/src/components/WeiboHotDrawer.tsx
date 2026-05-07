import { useEffect, useRef, useState } from 'react'
import { formatTime } from '../utils/formatTime'
import { FireIcon } from './icons/FireIcon'

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

interface Props {
  open: boolean
  onClose: () => void
}

const CACHE_MS = 300_000
const CLOSE_ANIMATION_MS = 200

export function WeiboHotDrawer({ open, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  const [items, setItems] = useState<WeiboHotItem[]>([])
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      const frame = window.requestAnimationFrame(() => setVisible(true))
      return () => window.cancelAnimationFrame(frame)
    }

    setVisible(false)
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && panelRef.current?.contains(activeElement)) {
      activeElement.blur()
    }
    const timer = window.setTimeout(() => setRendered(false), CLOSE_ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (items.length > 0 && Date.now() - lastFetchedAt < CACHE_MS) return
    void fetchHotSearch(false)
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  async function fetchHotSearch(force: boolean) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(force ? '/api/weibo-hot?refresh=1' : '/api/weibo-hot', {
        cache: force ? 'no-store' : 'default',
      })
      if (!res.ok) throw new Error('request failed')
      const data: WeiboHotResponse = await res.json()
      setItems(data.items)
      setUpdatedAt(data.updatedAt)
      setLastFetchedAt(Date.now())
    } catch {
      setError('热搜加载失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  function handleRefresh() {
    void fetchHotSearch(true)
  }

  function handleItemClick(item: WeiboHotItem) {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  if (!rendered) return null
  const hiddenTabIndex = visible ? undefined : -1

  return (
    <div className={`modal-layer fixed inset-0 z-50 ${visible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={[
          'absolute inset-0 bg-black/50 transition-opacity duration-200',
          visible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        className={[
          'absolute left-0 top-0 flex h-screen w-[min(360px,calc(100vw-24px))] flex-col',
          'rounded-r-lg border-r border-border-default bg-paper shadow-ink-3 transition-transform duration-200 ease-out',
          visible ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!visible}
      >
        <div className="flex h-[54px] flex-shrink-0 items-center gap-2 border-b border-border-divider px-[18px]">
          <FireIcon className="h-3.5 w-3.5 text-ink-label" />
          <h2 className="font-display text-[15px] font-semibold text-ink">微博热搜</h2>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-sm text-ink-pale hover:bg-black/[0.06] hover:text-ink"
            aria-label="关闭微博热搜"
            tabIndex={hiddenTabIndex}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          {loading && items.length === 0 ? (
            <CenteredText>加载中…</CenteredText>
          ) : error && items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
              <p className="font-body text-sm text-ink-secondary">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="h-9 rounded-[7px] border border-border-default px-4 font-body text-xs text-ink-label hover:border-ink-pale hover:text-ink"
                tabIndex={hiddenTabIndex}
              >
                重试
              </button>
            </div>
          ) : (
            items.map(item => (
              <button
                key={`${item.rank}-${item.title}`}
                type="button"
                onClick={() => handleItemClick(item)}
                className="flex h-11 w-full items-center gap-3 px-[18px] text-left hover:bg-black/[0.04]"
                tabIndex={hiddenTabIndex}
              >
                <span
                  className={[
                    'w-6 flex-shrink-0 font-mono text-[11px] font-bold',
                    item.rank <= 3 ? 'text-ink' : 'text-ink-muted',
                  ].join(' ')}
                >
                  {item.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-body text-[13px] font-medium text-ink">
                  {item.title}
                </span>
                {item.label && (
                  <span className="flex-shrink-0 rounded-xs bg-paper-section px-1.5 py-0.5 font-body text-[11px] font-medium text-ink-label">
                    {item.label}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="flex h-11 flex-shrink-0 items-center border-t border-border-divider px-[18px]">
          <span className="font-mono text-[10px] text-ink-muted">
            {updatedAt ? `更新于 ${formatTime(new Date(updatedAt))}` : '尚未更新'}
          </span>
          {error && items.length > 0 && (
            <span className="ml-0.5 font-body text-[11px] italic text-ink-mid"> · 刷新失败</span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="ml-auto h-8 rounded-sm px-2.5 font-body text-xs font-medium text-ink-label hover:bg-black/[0.06] hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            tabIndex={hiddenTabIndex}
          >
            {loading ? '刷新中…' : error && items.length > 0 ? '重试' : '刷新'}
          </button>
        </div>
      </aside>
    </div>
  )
}

function CenteredText({ children }: { children: string }) {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center font-mono text-[11px] text-ink-muted">
      {children}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}
