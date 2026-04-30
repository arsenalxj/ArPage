import { useRef, useState } from 'react'
import {
  CollisionDetection, DndContext, DragEndEvent, DragOverlay, DragOverEvent, DragStartEvent,
  KeyboardSensor, PointerSensor, closestCenter, pointerWithin, rectIntersection, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { AppData, Bookmark } from '../types'
import { groupBookmarks, pinnedBookmarks, sortedGroups } from '../hooks/useBookmarks'
import { BookmarkCard, BookmarkCardWrapper } from './BookmarkCard'
import { BookmarkGroup } from './BookmarkGroup'
import { BookmarkModal } from './BookmarkModal'

interface Props {
  data: AppData
  searchQuery: string
  getCollapsed: (id: string) => boolean
  setCollapsed: (id: string, v: boolean) => void
  onAddBookmark: (bm: Omit<Bookmark, 'id' | 'order' | 'pinnedOrder' | 'createdAt'>) => void
  onUpdateBookmark: (id: string, changes: Partial<Bookmark>) => void
  onDeleteBookmark: (id: string) => void
  onTogglePin: (id: string) => void
  onAddGroup: (name: string) => void
  onUpdateGroup: (id: string, name: string) => void
  onDeleteGroup: (id: string) => void
  onApplyDrag: (next: AppData) => void
}

interface ModalState {
  open: boolean
  bookmark: Bookmark | null
  defaultGroupId?: string
}

const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions

  const rectCollisions = rectIntersection(args)
  if (rectCollisions.length > 0) return rectCollisions

  return closestCenter(args)
}

export function BookmarkGrid({
  data, searchQuery, getCollapsed, setCollapsed,
  onAddBookmark, onUpdateBookmark, onDeleteBookmark, onTogglePin,
  onAddGroup, onUpdateGroup, onDeleteGroup, onApplyDrag,
}: Props) {
  const [modal, setModal] = useState<ModalState>({ open: false, bookmark: null })
  const [activeId, setActiveId] = useState<string | null>(null)
  const overGroupId = useRef<string | null>(null)
  const [newGroupInput, setNewGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const groups = sortedGroups(data.groups)
  const pinned = pinnedBookmarks(data.bookmarks)

  // Search mode: flat filtered list
  const isFiltering = !!searchQuery.trim()
  const filteredBookmarks = isFiltering
    ? data.bookmarks.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []

  function openAdd(defaultGroupId?: string) {
    setModal({ open: true, bookmark: null, defaultGroupId })
  }

  function openEdit(bm: Bookmark) {
    setModal({ open: true, bookmark: bm })
  }

  function handleSave(
    bm: Omit<Bookmark, 'id' | 'order' | 'pinnedOrder' | 'createdAt'> & { id?: string },
  ) {
    if (bm.id) {
      onUpdateBookmark(bm.id, bm)
    } else {
      onAddBookmark(bm as Omit<Bookmark, 'id' | 'order' | 'pinnedOrder' | 'createdAt'>)
    }
  }

  function handleDeleteBookmark(id: string) {
    if (deleteConfirm === id) {
      onDeleteBookmark(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
    }
  }

  // ─── Drag & Drop ──────────────────────────────────────────────────────

  function onDragStart({ active }: DragStartEvent) {
    const activeData = active.data.current as { bookmarkId?: string } | undefined
    setActiveId(activeData?.bookmarkId ?? String(active.id))
    overGroupId.current = null
  }

  function onDragOver({ active, over }: DragOverEvent) {
    const activeData = active.data.current as { type: string } | undefined
    const overData = over?.data.current as { groupId?: string } | undefined
    if (activeData?.type === 'bookmark' && overData?.groupId) {
      overGroupId.current = overData.groupId
    }
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)

    const activeData = active.data.current as { type: string; bookmarkId?: string; groupId?: string } | undefined
    const overData = over?.data.current as { type: string; bookmarkId?: string; groupId?: string } | undefined
    if (!activeData) return

    const { type } = activeData

    // ── Group reorder ──
    if (type === 'group') {
      if (!over || active.id === over.id) return
      const activeGroupId = String(active.id).replace('group:', '')
      const overGroupId = String(over.id).replace('group:', '')
      const oldIdx = groups.findIndex(g => g.id === activeGroupId)
      const newIdx = groups.findIndex(g => g.id === overGroupId)
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return
      const reordered = arrayMove(groups, oldIdx, newIdx).map((g, i) => ({ ...g, order: i }))
      onApplyDrag({ ...data, groups: reordered })
      return
    }

    // ── Pinned reorder ──
    if (type === 'pinned') {
      if (!over || active.id === over.id) return
      const activeBookmarkId = activeData.bookmarkId
      const overBookmarkId = overData?.bookmarkId
      if (!activeBookmarkId || !overBookmarkId) return
      const oldIdx = pinned.findIndex(b => b.id === activeBookmarkId)
      const newIdx = pinned.findIndex(b => b.id === overBookmarkId)
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return
      const reordered = arrayMove(pinned, oldIdx, newIdx)
      const updatedBookmarks = data.bookmarks.map(b => {
        const i = reordered.findIndex(p => p.id === b.id)
        return i >= 0 ? { ...b, pinnedOrder: i } : b
      })
      onApplyDrag({ ...data, bookmarks: updatedBookmarks })
      return
    }

    // ── Bookmark within/across groups ──
    if (type === 'bookmark') {
      const bmId = activeData.bookmarkId ?? String(active.id)
      const fromGroupId = activeData.groupId!
      const toGroupId = overData?.groupId ?? overGroupId.current ?? fromGroupId
      const fromBookmarks = groupBookmarks(data.bookmarks, fromGroupId)
      const toBookmarks = fromGroupId === toGroupId
        ? fromBookmarks
        : groupBookmarks(data.bookmarks, toGroupId)

      let updatedBookmarks: Bookmark[]

      if (fromGroupId === toGroupId) {
        if (!over || active.id === over.id) return
        const oldIdx = fromBookmarks.findIndex(b => b.id === bmId)
        const newIdx = fromBookmarks.findIndex(b => b.id === (overData?.bookmarkId ?? over.id))
        if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return
        const reordered = arrayMove(fromBookmarks, oldIdx, newIdx)
        updatedBookmarks = data.bookmarks.map(b => {
          const i = reordered.findIndex(r => r.id === b.id)
          return i >= 0 ? { ...b, order: i } : b
        })
      } else {
        const overBookmarkId = overData?.bookmarkId
        const overIdx = overBookmarkId ? toBookmarks.findIndex(b => b.id === overBookmarkId) : -1
        const insertAt = overIdx >= 0 ? overIdx : toBookmarks.length
        updatedBookmarks = data.bookmarks.map(b => {
          if (b.id === bmId) return { ...b, groupId: toGroupId, order: insertAt }
          if (b.groupId === toGroupId && b.order >= insertAt) return { ...b, order: b.order + 1 }
          return b
        })
        // Re-normalize orders in both groups
        const newFrom = updatedBookmarks.filter(b => b.groupId === fromGroupId).sort((a, b) => a.order - b.order)
        const newTo = updatedBookmarks.filter(b => b.groupId === toGroupId).sort((a, b) => a.order - b.order)
        const normalized = new Map<string, number>()
        newFrom.forEach((b, i) => normalized.set(b.id, i))
        newTo.forEach((b, i) => normalized.set(b.id, i))
        updatedBookmarks = updatedBookmarks.map(b => {
          const o = normalized.get(b.id)
          return o !== undefined ? { ...b, order: o } : b
        })
      }

      onApplyDrag({ ...data, bookmarks: updatedBookmarks })
    }
    overGroupId.current = null
  }

  // Active dragged item for overlay
  const activeBm = activeId ? data.bookmarks.find(b => b.id === activeId) : null

  // ─── New group input ──────────────────────────────────────────────────

  function commitNewGroup() {
    const v = newGroupName.trim()
    if (v) onAddGroup(v)
    setNewGroupName('')
    setNewGroupInput(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────

  if (isFiltering) {
    return (
      <>
        <div className="px-12 pb-12">
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-display text-xl font-semibold text-ink mb-2">未找到匹配的书签</p>
              <p className="font-body text-sm italic text-ink-muted mb-6">
                没有与「{searchQuery}」匹配的书签
              </p>
              <button
                onClick={() => {
                  window.open(
                    `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
                    '_blank', 'noopener,noreferrer',
                  )
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-ink text-paper rounded-[7px]
                  font-body text-sm font-medium hover:bg-ink-dark transition-colors"
              >
                在 Google 中搜索「{searchQuery}」
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredBookmarks.map(bm => (
                <BookmarkCardWrapper key={bm.id}>
                  <BookmarkCard
                    bookmark={bm}
                    searchQuery={searchQuery}
                    onEdit={openEdit}
                    onDelete={handleDeleteBookmark}
                    onTogglePin={onTogglePin}
                  />
                </BookmarkCardWrapper>
              ))}
            </div>
          )}
        </div>
        {modal.open && (
          <BookmarkModal
            bookmark={modal.bookmark}
            defaultGroupId={modal.defaultGroupId}
            groups={data.groups}
            onSave={handleSave}
            onClose={() => setModal({ open: false, bookmark: null })}
          />
        )}
      </>
    )
  }

  const groupIds = groups.map(g => `group:${g.id}`)
  const pinnedIds = pinned.map(b => `pinned:${b.id}`)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerFirstCollisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="px-12 pb-12">
          {/* Pinned section */}
          {pinned.length > 0 && (
            <div className="bg-paper-section border border-border-section rounded-lg p-[18px_22px_20px] mb-[30px]">
              <div className="flex items-center gap-2 mb-3.5">
                <span className="text-ink"><PinIcon /></span>
                <span className="font-display text-[11px] font-semibold tracking-[1.5px] uppercase text-ink">置顶</span>
                <span className="text-[11px] text-ink-muted font-body ml-auto">{pinned.length} 个</span>
              </div>
              <SortableContext items={pinnedIds} strategy={rectSortingStrategy}>
                <div className="flex flex-wrap gap-2">
                  {pinned.map(bm => (
                    <BookmarkCardWrapper key={bm.id}>
                      <BookmarkCard
                        bookmark={bm}
                        sortableId={`pinned:${bm.id}`}
                        dragType="pinned"
                        onEdit={openEdit}
                        onDelete={handleDeleteBookmark}
                        onTogglePin={onTogglePin}
                      />
                    </BookmarkCardWrapper>
                  ))}
                </div>
              </SortableContext>
            </div>
          )}

          {/* Groups */}
          <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
            {groups.map(g => {
              const bms = groupBookmarks(data.bookmarks, g.id)
              const collapsed = getCollapsed(g.id)
              return (
                <BookmarkGroup
                  key={g.id}
                  group={g}
                  bookmarks={bms}
                  collapsed={collapsed}
                  onToggleCollapse={() => setCollapsed(g.id, !collapsed)}
                  onRename={name => onUpdateGroup(g.id, name)}
                  onDelete={() => onDeleteGroup(g.id)}
                  onAddBookmark={() => openAdd(g.id)}
                  onEditBookmark={openEdit}
                  onDeleteBookmark={handleDeleteBookmark}
                  onTogglePin={onTogglePin}
                />
              )
            })}
          </SortableContext>

          {/* New group */}
          {newGroupInput ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                autoFocus
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitNewGroup()
                  if (e.key === 'Escape') { setNewGroupName(''); setNewGroupInput(false) }
                }}
                onBlur={commitNewGroup}
                placeholder="分组名称"
                maxLength={40}
                className="h-9 px-3 rounded-[7px] border border-ink bg-paper font-body text-sm text-ink
                  outline-none shadow-ink-2f"
              />
              <span className="text-[11px] text-ink-muted font-body italic">Enter 确认，Esc 取消</span>
            </div>
          ) : (
            <button
              onClick={() => setNewGroupInput(true)}
              className="inline-flex items-center gap-2 mt-1 px-4 py-2 border-2 border-dashed
                border-border-default rounded-md text-ink-muted text-xs font-body
                hover:border-ink hover:text-ink transition-colors"
            >
              <PlusIcon />
              新建分组
            </button>
          )}
        </div>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activeBm && (
            <BookmarkCard
              bookmark={activeBm}
              onEdit={() => {}}
              onDelete={() => {}}
              onTogglePin={() => {}}
              overlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Delete confirmation toast */}
      {deleteConfirm && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-paper
          px-5 py-3 rounded-[7px] font-body text-sm shadow-ink-3 flex items-center gap-4">
          确认删除这个书签？
          <button
            onClick={() => { onDeleteBookmark(deleteConfirm); setDeleteConfirm(null) }}
            className="underline hover:no-underline"
          >
            确认
          </button>
          <button onClick={() => setDeleteConfirm(null)} className="text-paper/60 hover:text-paper">
            取消
          </button>
        </div>
      )}

      {modal.open && (
        <BookmarkModal
          bookmark={modal.bookmark}
          defaultGroupId={modal.defaultGroupId}
          groups={data.groups}
          onSave={handleSave}
          onClose={() => setModal({ open: false, bookmark: null })}
        />
      )}
    </>
  )
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M8.5 1L10 2.5 8 5l.8.8.4 2L7 9 5.5 7.5 3 9.5l.4-2L2.5 6.5 4 5 2 2.5 3.5 1l2 2L8 1.5z" />
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
