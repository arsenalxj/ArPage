export interface Group {
  id: string
  name: string
  order: number
}

export interface Bookmark {
  id: string
  groupId: string
  title: string
  url: string
  favicon: string | null
  pinned: boolean
  order: number
  pinnedOrder: number | null
  createdAt: number
}

export interface AppData {
  version: number
  updatedAt: number
  groups: Group[]
  bookmarks: Bookmark[]
}

export const EMPTY_DATA: AppData = {
  version: 0,
  updatedAt: 0,
  groups: [],
  bookmarks: [],
}
