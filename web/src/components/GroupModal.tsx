import { FormEvent, useEffect, useRef, useState } from 'react'

interface Props {
  onSave: (name: string) => void
  onClose: () => void
}

export function GroupModal({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const trimmed = name.trim()
  const canSave = trimmed.length > 0

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSave) return
    onSave(trimmed)
    onClose()
  }

  return (
    <div className="modal-layer fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 w-[420px] bg-paper border border-border-default rounded-xl
        px-[34px] pt-[34px] pb-[30px] shadow-ink-5">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">新建分组</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[7px] bg-paper-section text-ink-secondary
              flex items-center justify-center hover:text-ink transition-colors"
            aria-label="关闭"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium text-ink-label tracking-wide mb-1.5 font-body">
            分组名称
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose()
            }}
            maxLength={40}
            placeholder="例如：Work"
            className="w-full h-11 px-3.5 rounded-[7px] border border-border-default bg-paper
              text-ink font-body text-sm outline-none focus:border-ink focus:shadow-ink-2f transition-shadow"
          />
          <div className="flex justify-end mt-1.5 mb-[26px]">
            <span className="text-[10px] text-ink-muted font-mono">{name.length} / 40</span>
          </div>

          <div className="flex justify-end gap-3">
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
              创建分组
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 3l8 8M11 3l-8 8" />
    </svg>
  )
}
