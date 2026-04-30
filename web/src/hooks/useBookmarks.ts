import { useCallback, useEffect, useRef, useState } from 'react'
import { AppData, Bookmark, Group } from '../types'

type Status = 'loading' | 'ok' | 'unauthenticated' | 'error'

export function useBookmarks() {
  const [data, setData] = useState<AppData | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [conflictError, setConflictError] = useState(false)
  const [collapsedVersion, setCollapsedVersion] = useState(0)
  const saving = useRef(false)

  const fetchData = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/bookmarks')
      if (res.status === 401) { setStatus('unauthenticated'); return }
      if (!res.ok) { setStatus('error'); return }
      const d: AppData = await res.json()
      setData(d)
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const saveData = useCallback(async (next: AppData): Promise<boolean> => {
    if (saving.current) return false
    saving.current = true
    const prev = data
    setData(next) // optimistic
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (res.status === 409) {
        setData(prev)
        setConflictError(true)
        await fetchData()
        return false
      }
      if (!res.ok) {
        setData(prev)
        return false
      }
      const saved: AppData = await res.json()
      setData(saved)
      return true
    } catch {
      setData(prev)
      return false
    } finally {
      saving.current = false
    }
  }, [data, fetchData])

  // ─── Bookmark operations ───────────────────────────────────────────────

  const addBookmark = useCallback((bm: Omit<Bookmark, 'id' | 'order' | 'pinnedOrder' | 'createdAt'>) => {
    if (!data) return
    const groupBookmarks = data.bookmarks.filter(b => b.groupId === bm.groupId && !b.pinned)
    const next: AppData = {
      ...data,
      bookmarks: [
        ...data.bookmarks,
        { ...bm, id: uid(), order: groupBookmarks.length, pinnedOrder: null, createdAt: Date.now() },
      ],
    }
    saveData(next)
  }, [data, saveData])

  const updateBookmark = useCallback((id: string, changes: Partial<Bookmark>) => {
    if (!data) return
    const next: AppData = {
      ...data,
      bookmarks: data.bookmarks.map(b => b.id === id ? { ...b, ...changes } : b),
    }
    saveData(next)
  }, [data, saveData])

  const deleteBookmark = useCallback((id: string) => {
    if (!data) return
    const next: AppData = {
      ...data,
      bookmarks: data.bookmarks.filter(b => b.id !== id),
    }
    saveData(next)
  }, [data, saveData])

  const togglePin = useCallback((id: string) => {
    if (!data) return
    const bm = data.bookmarks.find(b => b.id === id)
    if (!bm) return
    const pinnedCount = data.bookmarks.filter(b => b.pinned).length
    const next: AppData = {
      ...data,
      bookmarks: data.bookmarks.map(b => {
        if (b.id !== id) return b
        if (b.pinned) {
          // Unpin: back to end of its group
          const groupLen = data.bookmarks.filter(x => x.groupId === b.groupId && !x.pinned).length
          return { ...b, pinned: false, pinnedOrder: null, order: groupLen }
        } else {
          return { ...b, pinned: true, pinnedOrder: pinnedCount }
        }
      }),
    }
    saveData(next)
  }, [data, saveData])

  // ─── Group operations ──────────────────────────────────────────────────

  const addGroup = useCallback((name: string) => {
    if (!data) return
    const next: AppData = {
      ...data,
      groups: [...data.groups, { id: uid(), name: name.trim(), order: data.groups.length }],
    }
    saveData(next)
  }, [data, saveData])

  const updateGroup = useCallback((id: string, name: string) => {
    if (!data) return
    const next: AppData = {
      ...data,
      groups: data.groups.map(g => g.id === id ? { ...g, name: name.trim() } : g),
    }
    saveData(next)
  }, [data, saveData])

  const deleteGroup = useCallback((id: string) => {
    if (!data) return
    if (data.bookmarks.some(b => b.groupId === id)) return
    const next: AppData = {
      ...data,
      groups: data.groups.filter(g => g.id !== id),
    }
    saveData(next)
  }, [data, saveData])

  // ─── Drag result application ──────────────────────────────────────────

  const applyDragData = useCallback((next: AppData) => {
    saveData(next)
  }, [saveData])

  // ─── Collapse state (localStorage only) ──────────────────────────────

  const getCollapsed = useCallback((groupId: string): boolean => {
    return localStorage.getItem(`collapsed_${groupId}`) === '1'
  }, [])

  const setCollapsed = useCallback((groupId: string, value: boolean) => {
    if (value) localStorage.setItem(`collapsed_${groupId}`, '1')
    else localStorage.removeItem(`collapsed_${groupId}`)
    setCollapsedVersion(v => v + 1)
  }, [])

  return {
    data,
    status,
    conflictError,
    collapsedVersion,
    dismissConflict: () => setConflictError(false),
    refresh: fetchData,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    addGroup,
    updateGroup,
    deleteGroup,
    applyDragData,
    getCollapsed,
    setCollapsed,
  }
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export type UseBookmarksReturn = ReturnType<typeof useBookmarks>

// Derive sorted/filtered views
export function sortedGroups(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => a.order - b.order)
}

export function groupBookmarks(bookmarks: Bookmark[], groupId: string): Bookmark[] {
  return bookmarks.filter(b => b.groupId === groupId).sort((a, b) => a.order - b.order)
}

export function pinnedBookmarks(bookmarks: Bookmark[]): Bookmark[] {
  return bookmarks.filter(b => b.pinned).sort((a, b) => (a.pinnedOrder ?? 0) - (b.pinnedOrder ?? 0))
}
