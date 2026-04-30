import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bookmark } from '../types'

interface Props {
  bookmark: Bookmark
  searchQuery?: string
  onEdit: (bm: Bookmark) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  sortableId?: string
  dragType?: 'bookmark' | 'pinned'
  /** If true, don't attach sortable (used inside DragOverlay) */
  overlay?: boolean
}

export function BookmarkCard({
  bookmark, searchQuery, onEdit, onDelete, onTogglePin,
  sortableId, dragType, overlay,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [faviconSrc, setFaviconSrc] = useState(bookmark.favicon)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFaviconSrc(bookmark.favicon)
  }, [bookmark.favicon])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: sortableId ?? bookmark.id,
      data: { type: dragType ?? 'bookmark', bookmarkId: bookmark.id, groupId: bookmark.groupId },
      disabled: overlay,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function handleCardClick(e: React.MouseEvent) {
    if (menuRef.current?.contains(e.target as Node)) return
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  function closeMenu() { setMenuOpen(false) }

  const abbr = bookmark.title.slice(0, 2).toUpperCase()

  const highlighted = searchQuery
    ? highlightText(bookmark.title, searchQuery)
    : bookmark.title
  const hostname = getHostname(bookmark.url)

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      onClick={handleCardClick}
      className={[
        'relative flex items-center gap-2.5 w-[188px] h-[58px] px-3.5 py-2.5 rounded-[7px]',
        'border border-border-default bg-paper cursor-pointer select-none',
        'transition-[border-color,box-shadow,opacity] duration-[120ms]',
        isDragging && !overlay ? 'opacity-40' : '',
        overlay ? 'shadow-ink-4' : 'hover:border-ink hover:shadow-ink-2',
      ].join(' ')}
    >
      {/* Favicon */}
      <div className="w-[26px] h-[26px] rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
        {faviconSrc ? (
          <img
            src={faviconSrc}
            alt=""
            className="w-full h-full object-contain"
            onError={() => {
              const fallback = googleS2FaviconUrl(bookmark.url)
              setFaviconSrc(fallback && faviconSrc !== fallback ? fallback : null)
            }}
          />
        ) : (
          <div className="w-full h-full bg-ink flex items-center justify-center text-paper
            text-[11px] font-bold font-body tracking-tight rounded-md">
            {abbr}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div
          className="text-[13px] font-medium text-ink truncate max-w-[130px]"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        <div className="text-[11px] italic text-ink-secondary mt-px truncate">
          {hostname}
        </div>
      </div>

      {/* ⋯ menu button */}
      <div
        ref={menuRef}
        className="flex-shrink-0 ml-1"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen(v => !v)}
          className={[
            'w-6 h-6 rounded-sm flex items-center justify-center',
            'text-ink-pale border border-transparent font-body text-sm leading-none',
            'transition-opacity duration-[120ms]',
            overlay ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100',
            menuOpen ? '!opacity-100 bg-paper-section border-border-default text-ink-mid' : '',
            'hover:bg-paper-section hover:border-border-default hover:text-ink-mid',
          ].join(' ')}
          aria-label="更多操作"
        >
          ···
        </button>

        {menuOpen && (
          <DropdownMenu
            bookmark={bookmark}
            onEdit={() => { closeMenu(); onEdit(bookmark) }}
            onDelete={() => { closeMenu(); onDelete(bookmark.id) }}
            onTogglePin={() => { closeMenu(); onTogglePin(bookmark.id) }}
            onClose={closeMenu}
          />
        )}
      </div>
    </div>
  )
}

// Hover group class helper — applied on the parent container
export function BookmarkCardWrapper({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className="group/card" {...props}>{children}</div>
}

interface DropdownProps {
  bookmark: Bookmark
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onClose: () => void
}

function DropdownMenu({ bookmark, onEdit, onDelete, onTogglePin, onClose }: DropdownProps) {
  // Close on outside click
  const ref = useRef<HTMLDivElement>(null)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="absolute right-0 top-[calc(100%+4px)] z-50 bg-paper border border-border-default
          rounded-lg shadow-ink-3 min-w-[144px] p-1"
      >
        <button onClick={onTogglePin} className={menuItemCls}>
          <PinIcon />
          {bookmark.pinned ? '取消置顶' : '置顶'}
        </button>
        <button onClick={onEdit} className={menuItemCls}>
          <EditIcon />
          编辑
        </button>
        <div className="h-px bg-border-divider mx-2 my-1" />
        <button onClick={onDelete} className={[menuItemCls, 'text-ink-mid'].join(' ')}>
          <TrashIcon />
          删除
        </button>
      </div>
    </>
  )
}

const menuItemCls = 'w-full flex items-center gap-2 px-3 py-2 rounded-sm text-[13px] font-body text-ink-dark hover:bg-paper-section transition-colors text-left'

function highlightText(text: string, query: string): string {
  if (!query) return escapeHtml(text)
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'gi')
  return text
    .split(re)
    .map(part =>
      re.test(part)
        ? `<span style="background:rgba(0,0,0,0.1);border-radius:2px;padding:0 1px">${escapeHtml(part)}</span>`
        : escapeHtml(part),
    )
    .join('')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getHostname(raw: string): string {
  try {
    return new URL(raw).hostname
  } catch {
    return raw
  }
}

function googleS2FaviconUrl(rawUrl: string): string | null {
  try {
    const { hostname } = new URL(rawUrl)
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
  } catch {
    return null
  }
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 2L11 4 8 7l.8.8.3 2L7 11 5.5 9.5 3 11.5l.3-2L2.5 8.5 4 6 2 4 4 2l2.5 2.5L9 2z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.5 1.5l2 2L4 11H2V9L9.5 1.5z" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3.5h9M4.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M5 6v3.5M8 6v3.5M3 3.5l.5 7.5h6l.5-7.5H3z" strokeLinejoin="round" />
    </svg>
  )
}
