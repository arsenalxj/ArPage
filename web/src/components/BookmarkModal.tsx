import { FormEvent, useEffect, useRef, useState } from 'react'
import { Bookmark, Group } from '../types'

interface Props {
  bookmark: Bookmark | null        // null = add new
  defaultGroupId?: string
  groups: Group[]
  onSave: (data: Omit<Bookmark, 'id' | 'order' | 'pinnedOrder' | 'createdAt'> & { id?: string }) => void
  onClose: () => void
}

export function BookmarkModal({ bookmark, defaultGroupId, groups, onSave, onClose }: Props) {
  const [url, setUrl] = useState(bookmark?.url ?? '')
  const [title, setTitle] = useState(bookmark?.title ?? '')
  const [groupId, setGroupId] = useState(bookmark?.groupId ?? defaultGroupId ?? groups[0]?.id ?? '')
  const [favicon, setFavicon] = useState<string | null>(bookmark?.favicon ?? null)
  const [fetchingFavicon, setFetchingFavicon] = useState(false)
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isEdit = !!bookmark

  // Fetch favicon when URL changes (add mode only — edit has a Refresh button)
  useEffect(() => {
    if (isEdit) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = normalizeUrl(url)
    if (!trimmed) return
    debounceRef.current = setTimeout(() => fetchFavicon(trimmed), 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [url, isEdit])

  async function fetchFavicon(u: string) {
    setFetchingFavicon(true)
    try {
      const res = await fetch(`/api/favicon?url=${encodeURIComponent(u)}`)
      if (!res.ok) return
      const data: { favicon: string | null; title: string | null } = await res.json()
      if (data.favicon) setFavicon(data.favicon)
      if (data.title && !title) setTitle(data.title)
    } catch {
      // favicon fetch failure is non-blocking
    } finally {
      setFetchingFavicon(false)
    }
  }

  function handleRefreshFavicon() {
    const u = normalizeUrl(url)
    if (u) fetchFavicon(u)
  }

  function handleFaviconError() {
    const fallback = googleS2FaviconUrl(normalizeUrl(url))
    if (fallback && favicon !== fallback) {
      setFavicon(fallback)
      return
    }
    setFavicon(null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const normalizedUrl = normalizeUrl(url)
    if (!normalizedUrl || !title.trim() || !groupId) return
    onSave({
      ...(isEdit ? { id: bookmark.id } : {}),
      url: normalizedUrl,
      title: title.trim(),
      groupId,
      favicon: favicon ?? null,
      pinned: bookmark?.pinned ?? false,
    })
    onClose()
  }

  const canSave = !!normalizeUrl(url) && !!title.trim() && !!groupId
  const selectedGroup = groups.find(g => g.id === groupId)

  return (
    <div className="modal-layer fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-[500px] bg-paper border border-border-default rounded-xl
        p-9 shadow-ink-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold text-ink">
            {isEdit ? '编辑书签' : '添加书签'}
          </h2>
          <button onClick={onClose} className="text-ink-pale hover:text-ink transition-colors">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-[18px]">
          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-ink-label tracking-wide mb-1.5 font-body">
              网址
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://"
                className="w-full h-11 px-3.5 rounded-[7px] border border-border-default bg-paper
                  text-ink font-body text-sm outline-none focus:border-ink focus:shadow-ink-2f transition-shadow"
                autoFocus={!isEdit}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-ink-label tracking-wide mb-1.5 font-body">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="书签名称"
              maxLength={120}
              className="w-full h-11 px-3.5 rounded-[7px] border border-border-default bg-paper
                text-ink font-body text-sm outline-none focus:border-ink focus:shadow-ink-2f transition-shadow"
            />
          </div>

          {/* Favicon preview (shown only when URL filled) */}
          {(url.trim() || isEdit) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md border border-border-default bg-paper-section
                flex items-center justify-center overflow-hidden flex-shrink-0">
                {fetchingFavicon ? (
                  <span className="text-[10px] text-ink-muted animate-pulse font-mono">…</span>
                ) : favicon ? (
                  <img
                    src={favicon}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={handleFaviconError}
                  />
                ) : (
                  <GlobeIcon />
                )}
              </div>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleRefreshFavicon}
                  className="text-[11px] text-ink-muted hover:text-ink font-body italic underline transition-colors"
                >
                  刷新图标
                </button>
              )}
              {fetchingFavicon && (
                <span className="text-[11px] text-ink-muted font-body italic">正在获取图标…</span>
              )}
            </div>
          )}

          {/* Group selector */}
          <div>
            <label className="block text-xs font-medium text-ink-label tracking-wide mb-1.5 font-body">
              分组
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setGroupDropdownOpen(v => !v)}
                className={[
                  'w-full h-11 px-3.5 text-left rounded-[7px] border bg-paper',
                  'font-body text-sm text-ink flex items-center justify-between outline-none',
                  'transition-shadow',
                  groupDropdownOpen ? 'border-ink shadow-ink-2f' : 'border-border-default hover:border-ink-pale',
                ].join(' ')}
              >
                <span>{selectedGroup?.name ?? '选择分组'}</span>
                <ChevronIcon open={groupDropdownOpen} />
              </button>

              {groupDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setGroupDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 top-[calc(100%+2px)] z-50 bg-paper
                    border-x border-b border-ink rounded-b-[7px] shadow-ink-3 overflow-hidden">
                    {groups.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => { setGroupId(g.id); setGroupDropdownOpen(false) }}
                        className={[
                          'w-full px-3.5 py-2.5 text-left font-body text-sm transition-colors',
                          g.id === groupId ? 'bg-paper-section text-ink' : 'text-ink-dark hover:bg-paper-section',
                        ].join(' ')}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-[7px] border border-border-default text-ink-label
                font-body text-sm hover:border-ink-pale hover:text-ink transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="h-10 px-5 rounded-[7px] bg-ink text-paper font-body text-sm font-medium
                hover:bg-ink-dark transition-colors disabled:bg-ink-pale disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//.test(trimmed)) return trimmed
  // If it looks like a domain, prepend https://
  if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) return `https://${trimmed}`
  return ''
}

function googleS2FaviconUrl(rawUrl: string): string | null {
  try {
    const { hostname } = new URL(rawUrl)
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
  } catch {
    return null
  }
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 4l10 10M14 4L4 14" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#AAAAAA" strokeWidth="1.4">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 1.5C8 1.5 5.5 4 5.5 8s2.5 6.5 2.5 6.5M8 1.5C8 1.5 10.5 4 10.5 8s-2.5 6.5-2.5 6.5M1.5 8h13" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="M3 5l4 4 4-4" />
    </svg>
  )
}
