import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bookmark, Group } from '../types'
import { BookmarkCard, BookmarkCardWrapper } from './BookmarkCard'

interface Props {
  group: Group
  bookmarks: Bookmark[]
  collapsed: boolean
  searchQuery?: string
  onToggleCollapse: () => void
  onRename: (name: string) => void
  onDelete: () => void
  onAddBookmark: () => void
  onEditBookmark: (bm: Bookmark) => void
  onDeleteBookmark: (id: string) => void
  onTogglePin: (id: string) => void
}

export function BookmarkGroup({
  group, bookmarks, collapsed, searchQuery,
  onToggleCollapse, onRename, onDelete,
  onAddBookmark, onEditBookmark, onDeleteBookmark, onTogglePin,
}: Props) {
  const [renaming, setRenaming] = useState(false)
  const [nameValue, setNameValue] = useState(group.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sortable for the group header itself
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group:${group.id}`,
    data: { type: 'group', groupId: group.id },
  })
  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: `group-drop:${group.id}`,
    data: { type: 'group-container', groupId: group.id },
  })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const setGroupNodeRef = (node: HTMLElement | null) => {
    setNodeRef(node)
    setDropNodeRef(node)
  }

  useEffect(() => {
    if (renaming) { inputRef.current?.focus(); inputRef.current?.select() }
  }, [renaming])

  function commitRename() {
    const v = nameValue.trim()
    if (v && v !== group.name) onRename(v)
    else setNameValue(group.name)
    setRenaming(false)
  }

  function handleRenameKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') { setNameValue(group.name); setRenaming(false) }
  }

  function handleDelete() {
    if (bookmarks.length > 0) { setConfirmDelete(true); return }
    onDelete()
  }

  const itemIds = bookmarks.map(b => b.id)

  return (
    <div
      ref={setGroupNodeRef}
      style={{ ...style, opacity: isDragging ? 0.4 : 1 }}
      className="pb-[26px]"
    >
      {/* Group header */}
      <div
        className={[
          'flex items-center gap-2.5 pb-2.5 mb-3.5 cursor-pointer',
          collapsed
            ? 'border-b border-dashed border-border-section'
            : 'border-b border-border-section',
        ].join(' ')}
        onClick={() => !renaming && onToggleCollapse()}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="text-ink-pale cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <DragHandle />
        </span>

        {/* Toggle arrow */}
        <span className="text-ink-secondary flex-shrink-0">
          <ChevronIcon collapsed={collapsed} />
        </span>

        {/* Name / inline rename input */}
        {renaming ? (
          <input
            ref={inputRef}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            maxLength={40}
            onClick={e => e.stopPropagation()}
            className="font-display text-[15px] font-semibold text-ink bg-transparent
              border-b border-ink outline-none flex-1 min-w-0"
          />
        ) : (
          <span
            className={[
              'font-display text-[15px] font-semibold text-ink',
              collapsed ? 'opacity-50' : '',
            ].join(' ')}
          >
            {group.name}
          </span>
        )}

        {/* Actions (right side) */}
        <div
          className="flex items-center gap-3 ml-auto"
          onClick={e => e.stopPropagation()}
        >
          <span className="text-[11px] text-ink-muted font-body">{bookmarks.length} 个书签</span>
          <div className="flex gap-3.5">
            {!renaming && (
              <button
                className="text-[11px] text-ink-pale hover:text-ink font-body transition-colors"
                onClick={() => { setRenaming(true); setConfirmDelete(false) }}
              >
                重命名
              </button>
            )}
            {confirmDelete ? (
              <>
                <span className="text-[11px] text-ink-mid font-body">请先移动或删除组内书签</span>
                <button className="text-[11px] text-ink-muted font-body" onClick={() => setConfirmDelete(false)}>知道了</button>
              </>
            ) : (
              <button
                className="text-[11px] text-ink-pale hover:text-ink font-body transition-colors"
                onClick={handleDelete}
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bookmark grid */}
      {!collapsed && (
        <SortableContext items={itemIds} strategy={rectSortingStrategy}>
          <div className="flex min-h-[58px] flex-wrap gap-2">
            {bookmarks.map(bm => (
              <BookmarkCardWrapper key={bm.id}>
                <BookmarkCard
                  bookmark={bm}
                  searchQuery={searchQuery}
                  onEdit={onEditBookmark}
                  onDelete={onDeleteBookmark}
                  onTogglePin={onTogglePin}
                />
              </BookmarkCardWrapper>
            ))}

            {/* Ghost add card */}
            <button
              onClick={e => { e.stopPropagation(); onAddBookmark() }}
              className="flex h-[58px] w-[140px] items-center gap-2 px-3.5 py-2.5 rounded-[7px]
                border-2 border-dashed border-border-default text-ink-pale font-body text-xs
                hover:border-ink hover:text-ink transition-colors"
            >
              <PlusIcon />
              添加书签
            </button>
          </div>
        </SortableContext>
      )}
    </div>
  )
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
      className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}
    >
      <path d="M2 3l3 4 3-4z" />
    </svg>
  )
}

function DragHandle() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="4" cy="3" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="3" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 1v10M1 6h10" strokeLinecap="round" />
    </svg>
  )
}
