import { RecentHistoryItem } from '../types'

interface Props {
  items: RecentHistoryItem[]
  onAdd: (item: RecentHistoryItem) => void
}

export function RecentHistory({ items, onAdd }: Props) {
  if (items.length === 0) return null

  return (
    <div className="mt-[34px] border-t border-border-section pt-[18px]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-display text-[13px] font-semibold uppercase tracking-[0.8px] text-ink">
          <HistoryIcon />
          最近浏览
        </div>
        <div className="font-body text-[11px] italic text-ink-muted">
          切回此标签页时刷新 · 仅显示未添加
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={historyKey(item)}
            type="button"
            onClick={() => onAdd(item)}
            className="group/history flex min-w-[252px] max-w-[330px] flex-1 items-center gap-2.5
              rounded-[7px] border border-dashed border-ink-pale bg-transparent px-3 py-[11px]
              text-left transition-[background,border-color,box-shadow] duration-[120ms]
              hover:border-ink hover:bg-paper hover:shadow-ink-2"
          >
            <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center
              rounded-md border border-border-default bg-paper-section text-ink-secondary">
              <PageIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-[13px] font-medium text-ink">
                {item.title.trim() || hostname(item.url)}
              </span>
              <span className="mt-0.5 block truncate font-body text-[11px] italic text-ink-secondary">
                {hostname(item.url)}
              </span>
            </span>
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm
              border border-border-default bg-paper-section text-ink-label
              group-hover/history:border-ink group-hover/history:bg-ink group-hover/history:text-paper">
              <PlusIcon />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function historyKey(item: RecentHistoryItem): string {
  return `${item.url}:${item.lastVisitTime}`
}

function hostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname
  } catch {
    return rawUrl
  }
}

function HistoryIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6.5 2a4.5 4.5 0 1 0 4.5 4.5" />
      <path d="M6.5 4.2v2.6l2 1.1" />
      <path d="M10.7 2.2v3h-3" />
    </svg>
  )
}

function PageIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2h9v9H2z" />
      <path d="M2 5h9" />
      <path d="M5 5v6" />
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
