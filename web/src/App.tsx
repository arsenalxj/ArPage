import { useEffect, useState } from 'react'
import { useBookmarks } from './hooks/useBookmarks'
import { LoginPage } from './components/LoginPage'
import { SearchBar } from './components/SearchBar'
import { BookmarkGrid } from './components/BookmarkGrid'
import { GroupModal } from './components/GroupModal'

export function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [visitorIp, setVisitorIp] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()))
  const store = useBookmarks()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(formatTime(new Date()))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (store.status !== 'ok') {
      setVisitorIp(null)
      return
    }

    let active = true
    fetch('/api/ip')
      .then(res => res.ok ? res.json() : null)
      .then((body: { ip?: string } | null) => {
        if (!active) return
        setVisitorIp(body?.ip?.trim() || null)
      })
      .catch(() => {
        if (active) setVisitorIp(null)
      })

    return () => { active = false }
  }, [store.status])

  function handleEnter(query: string) {
    const trimmed = query.trim()
    if (!trimmed) return
    // If it looks like a URL, navigate; otherwise Google search
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmed) || /^https?:\/\//.test(trimmed)) {
      const url = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(trimmed)}`, '_blank', 'noopener,noreferrer')
    }
  }

  if (store.status === 'loading') {
    return (
      <div className="min-h-screen bg-paper-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest text-ink-muted uppercase">Loading…</span>
      </div>
    )
  }

  if (store.status === 'unauthenticated') {
    return <LoginPage onLogin={() => store.refresh()} />
  }

  if (store.status === 'error' || !store.data) {
    return (
      <div className="min-h-screen bg-paper-bg flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-xl text-ink mb-2">加载失败</p>
          <button
            onClick={() => store.refresh()}
            className="font-body text-sm text-ink-muted underline hover:text-ink"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  const { data } = store

  return (
    <div className="min-h-screen bg-paper-bg eink-grain">
      {/* Conflict error banner */}
      {store.conflictError && (
        <div className="bg-ink text-paper px-6 py-2.5 flex items-center justify-between font-body text-sm">
          <span>数据已在其他窗口更新，当前页面已重新加载，请重试操作</span>
          <button onClick={store.dismissConflict} className="text-paper/60 hover:text-paper ml-4">✕</button>
        </div>
      )}

      {/* Topbar */}
      <div className="h-[54px] border-b border-border-section bg-paper/95 flex items-center
        justify-between px-12" style={{ backdropFilter: 'none' }}>
        <div className="font-display text-[22px] font-bold tracking-tight text-ink">ArPage</div>
        <div className="ml-auto mr-[18px] flex items-center gap-2.5 font-mono text-[10px] leading-none tracking-[1.4px] text-ink-label uppercase whitespace-nowrap">
          {visitorIp && (
            <span className="inline-flex h-6 items-center rounded-[5px] border border-border-default bg-paper-section px-[9px]">
              IP: {visitorIp}
            </span>
          )}
          <span className="text-ink-muted">{currentTime}</span>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/auth', { method: 'DELETE' })
            store.refresh()
          }}
          className="text-ink-pale hover:text-ink transition-colors"
          title="退出登录"
        >
          <LogoutIcon />
        </button>
      </div>

      {/* Search */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} onEnter={handleEnter} />

      {/* Main content */}
      {data.groups.length === 0 && !searchQuery ? (
        <EmptyState onAddGroup={() => setGroupModalOpen(true)} />
      ) : (
        <BookmarkGrid
          data={data}
          searchQuery={searchQuery}
          getCollapsed={store.getCollapsed}
          setCollapsed={store.setCollapsed}
          onAddBookmark={store.addBookmark}
          onUpdateBookmark={store.updateBookmark}
          onDeleteBookmark={store.deleteBookmark}
          onTogglePin={store.togglePin}
          onAddGroup={store.addGroup}
          onUpdateGroup={store.updateGroup}
          onDeleteGroup={store.deleteGroup}
          onApplyDrag={store.applyDragData}
        />
      )}

      {groupModalOpen && (
        <GroupModal
          onSave={store.addGroup}
          onClose={() => setGroupModalOpen(false)}
        />
      )}
    </div>
  )
}

function formatTime(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function EmptyState({ onAddGroup }: { onAddGroup: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-6 opacity-30">
        <rect x="12" y="8" width="42" height="56" rx="4" stroke="#111111" strokeWidth="2.5" />
        <path d="M12 24h42" stroke="#111111" strokeWidth="2" />
        <path d="M22 36h22M22 44h16" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
        <path d="M56 34l8 8-8 8" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M64 42H44" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="font-display text-2xl font-semibold text-ink mb-2.5 tracking-tight">还没有书签</p>
      <p className="font-body text-sm italic text-ink-muted mb-8 text-center leading-relaxed">
        创建第一个分组，然后开始添加常用网站
      </p>
      <button
        onClick={onAddGroup}
        className="flex items-center gap-2 px-5 py-2.5 bg-ink text-paper rounded-[7px]
          font-body text-sm font-medium hover:bg-ink-dark transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 1v12M1 7h12" strokeLinecap="round" />
        </svg>
        新建分组
      </button>
    </div>
  )
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" />
    </svg>
  )
}
