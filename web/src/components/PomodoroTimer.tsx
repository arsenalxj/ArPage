import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

type TimerMode = 'focus' | 'rest'
type TimerStatus = 'idle' | 'running' | 'paused'
type NotificationState = NotificationPermission | 'unsupported'

interface StoredTimerState {
  status: 'running' | 'paused'
  mode: TimerMode
  endTime: number
  remainingMs: number
}

const MODE_KEY = 'pomodoro_mode'
const STATE_KEY = 'pomodoro_timer_state'
const FOCUS_DURATION_KEY = 'pomodoro_focus_duration'
const REST_DURATION_KEY = 'pomodoro_rest_duration'
const MIN_DURATION_MINUTES = 1
const MAX_DURATION_MINUTES = 120
const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  focus: 25,
  rest: 5,
}

const MODE_LABEL: Record<TimerMode, string> = {
  focus: '专注',
  rest: '休息',
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>(() => readStoredMode())
  const [durations, setDurations] = useState<Record<TimerMode, number>>(() => ({
    focus: readStoredDuration(FOCUS_DURATION_KEY, DEFAULT_DURATIONS.focus),
    rest: readStoredDuration(REST_DURATION_KEY, DEFAULT_DURATIONS.rest),
  }))
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [remainingMs, setRemainingMs] = useState(() => durations[mode] * 60_000)
  const [endTime, setEndTime] = useState(0)
  const [editing, setEditing] = useState(false)
  const [draftMinutes, setDraftMinutes] = useState(() => String(durations[mode]))
  const [collapsed, setCollapsed] = useState(() => isSmallScreen())
  const [completionNotice, setCompletionNotice] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationState>(() => readNotificationPermission())
  const noticeTimerRef = useRef<number | null>(null)
  const notifiedRef = useRef(false)

  useEffect(() => {
    const restored = readStoredTimerState()
    if (!restored) {
      setRemainingMs(durations[mode] * 60_000)
      return
    }

    setMode(restored.mode)
    localStorage.setItem(MODE_KEY, restored.mode)

    if (restored.status === 'paused') {
      setStatus('paused')
      setEndTime(0)
      setRemainingMs(restored.remainingMs)
      return
    }

    const restoredRemaining = restored.endTime - Date.now()
    if (restoredRemaining > 0) {
      setStatus('running')
      setEndTime(restored.endTime)
      setRemainingMs(restoredRemaining)
      return
    }

    localStorage.removeItem(STATE_KEY)
    setRemainingMs(durations[restored.mode] * 60_000)
    handleTimerFinished(restored.mode)
  // Read localStorage only once on mount; duration/mode updates are handled in separate effects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'idle') return
    setRemainingMs(durations[mode] * 60_000)
    setDraftMinutes(String(durations[mode]))
  }, [durations, mode, status])

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (status !== 'running') return

    function tick() {
      const nextRemaining = Math.max(0, endTime - Date.now())
      setRemainingMs(nextRemaining)
      if (nextRemaining > 0 || notifiedRef.current) return
      notifiedRef.current = true
      localStorage.removeItem(STATE_KEY)
      setStatus('idle')
      setEndTime(0)
      setRemainingMs(durations[mode] * 60_000)
      handleTimerFinished(mode)
    }

    tick()
    const timer = window.setInterval(tick, 500)
    return () => window.clearInterval(timer)
  }, [durations, endTime, mode, status])

  const displayTime = useMemo(() => formatRemaining(remainingMs), [remainingMs])

  function handleModeChange(nextMode: TimerMode) {
    if (status !== 'idle') return
    setMode(nextMode)
    localStorage.setItem(MODE_KEY, nextMode)
    setEditing(false)
    setRemainingMs(durations[nextMode] * 60_000)
    setDraftMinutes(String(durations[nextMode]))
  }

  function handleStartOrContinue() {
    if (editing) return
    const nextEndTime = Date.now() + remainingMs
    notifiedRef.current = false
    setCompletionNotice(null)
    setEndTime(nextEndTime)
    setStatus('running')
    writeStoredTimerState({
      status: 'running',
      mode,
      endTime: nextEndTime,
      remainingMs: 0,
    })
  }

  function handleEnableNotification() {
    void requestNotificationPermission().then(setNotificationPermission)
  }

  function handlePause() {
    const nextRemaining = Math.max(0, endTime - Date.now())
    setStatus('paused')
    setEndTime(0)
    setRemainingMs(nextRemaining)
    writeStoredTimerState({
      status: 'paused',
      mode,
      endTime: 0,
      remainingMs: nextRemaining,
    })
  }

  function handleReset() {
    notifiedRef.current = false
    setEditing(false)
    setCompletionNotice(null)
    setStatus('idle')
    setEndTime(0)
    setRemainingMs(durations[mode] * 60_000)
    localStorage.removeItem(STATE_KEY)
  }

  function handleTimerFinished(finishedMode: TimerMode) {
    const message = getCompletionMessage(finishedMode)
    setCompletionNotice(message)
    notifyFinished(finishedMode)

    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current)
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setCompletionNotice(null)
      noticeTimerRef.current = null
    }, 8000)
  }

  function startEditing() {
    if (status !== 'idle') return
    setDraftMinutes(String(durations[mode]))
    setEditing(true)
  }

  function handleDraftChange(e: ChangeEvent<HTMLInputElement>) {
    setDraftMinutes(e.target.value)
  }

  function confirmEditing() {
    const nextMinutes = clampDuration(Number(draftMinutes))
    const nextDurations = { ...durations, [mode]: nextMinutes }
    setDurations(nextDurations)
    localStorage.setItem(durationKeyForMode(mode), String(nextMinutes))
    setRemainingMs(nextMinutes * 60_000)
    setDraftMinutes(String(nextMinutes))
    setEditing(false)
  }

  function cancelEditing() {
    setDraftMinutes(String(durations[mode]))
    setEditing(false)
  }

  function handleDraftKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      confirmEditing()
      return
    }
    if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  const panel = collapsed ? (
    <button
      type="button"
      onClick={() => setCollapsed(false)}
      className="inline-flex h-10 min-w-[180px] max-w-[calc(100vw-24px)] items-center gap-2.5 rounded-xl border border-border-default bg-paper px-3.5 shadow-ink-3"
      aria-label="展开番茄钟"
    >
      <TimerIcon className="h-3.5 w-3.5 flex-shrink-0 text-ink-label" />
      <span className="font-mono text-sm font-bold tracking-[1px] text-ink">{displayTime}</span>
      <span className="font-body text-[11px] text-ink-secondary">{MODE_LABEL[mode]}</span>
      <span className="ml-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm text-ink-pale hover:bg-black/[0.06]">
        <ExpandIcon />
      </span>
    </button>
  ) : (
    <div className="w-[220px] max-w-[calc(100vw-24px)] rounded-xl border border-border-default bg-paper shadow-ink-3">
      <div className="flex items-center gap-2 border-b border-border-divider px-3.5 pb-2.5 pt-3">
        <TimerIcon className="h-4 w-4 flex-shrink-0 text-ink-label" />
        <div className="flex-1 font-body text-sm font-medium text-ink">番茄钟</div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-pale hover:bg-black/[0.06]"
          aria-label="收起番茄钟"
        >
          <CollapseIcon />
        </button>
      </div>

      <div className="px-3.5 pb-3.5 pt-4">
        <div className="mb-4 flex gap-1.5">
          {(['focus', 'rest'] as TimerMode[]).map(item => (
            <button
              key={item}
              type="button"
              disabled={status !== 'idle'}
              onClick={() => handleModeChange(item)}
              className={[
                'flex h-[30px] flex-1 items-center justify-center rounded-sm font-body text-xs transition-colors',
                item === mode ? 'bg-ink font-medium text-paper' : 'text-ink-secondary hover:text-ink-dark',
                status !== 'idle' ? 'cursor-not-allowed opacity-40' : '',
              ].join(' ')}
            >
              {MODE_LABEL[item]}
            </button>
          ))}
        </div>

        {editing ? (
          <>
            <div className="flex items-center justify-center gap-1.5 pb-1 pt-2.5">
              <input
                type="number"
                min={MIN_DURATION_MINUTES}
                max={MAX_DURATION_MINUTES}
                step={1}
                value={draftMinutes}
                onChange={handleDraftChange}
                onKeyDown={handleDraftKeyDown}
                onBlur={confirmEditing}
                className="h-10 w-16 rounded-[7px] border-[1.5px] border-ink bg-paper text-center font-mono text-2xl font-bold text-ink shadow-ink-2f outline-none"
                autoFocus
              />
              <span className="font-body text-[13px] text-ink-secondary">分钟</span>
            </div>
            <div className="mb-4 text-center font-body text-[11px] italic text-ink-muted">Enter 确认 · Esc 取消</div>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startEditing}
              disabled={status !== 'idle'}
              className={[
                'block w-full pb-1 pt-2.5 text-center font-mono text-[32px] font-bold leading-none tracking-[2px] text-ink',
                status === 'paused' ? 'opacity-50' : '',
                status === 'idle' ? 'cursor-pointer' : 'cursor-default',
              ].join(' ')}
            >
              {displayTime}
            </button>
            {status === 'idle' ? (
              <div className="mb-4 text-center font-body text-[11px] italic text-ink-muted">
                {completionNotice ?? '点击数字编辑时长'}
              </div>
            ) : (
              <div className="mb-4 text-center font-mono text-[10px] uppercase tracking-[1.5px] text-ink-muted">
                {status === 'running' && notificationPermission === 'default'
                  ? '倒计时中 · 可开启通知'
                  : status === 'running'
                    ? '倒计时中'
                    : '已暂停'}
              </div>
            )}
          </>
        )}

        {notificationPermission === 'default' && (
          <button
            type="button"
            onClick={handleEnableNotification}
            className="mb-3 w-full rounded-sm border border-border-divider px-2 py-1.5 text-center font-body text-[11px] text-ink-secondary hover:border-border-default hover:text-ink"
          >
            开启结束提醒
          </button>
        )}

        <div className="flex items-center justify-center gap-2">
          {status === 'running' ? (
            <button
              type="button"
              onClick={handlePause}
              className="flex h-[34px] items-center gap-1.5 rounded-[7px] border-[1.5px] border-border-default px-4 font-body text-[13px] text-ink-label hover:border-[#888888] hover:text-ink-dark"
            >
              <PauseIcon />
              暂停
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartOrContinue}
              disabled={editing}
              className="flex h-[34px] items-center gap-1.5 rounded-[7px] bg-ink px-5 font-body text-[13px] font-medium text-paper hover:bg-ink-dark disabled:cursor-not-allowed disabled:bg-ink-pale"
            >
              <PlayIcon />
              {status === 'paused' ? '继续' : '开始'}
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex h-[34px] items-center gap-1.5 rounded-[7px] px-3 font-body text-[13px] text-ink-secondary hover:bg-black/[0.06]"
            aria-label="重置番茄钟"
          >
            <ResetIcon />
            重置
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="!fixed bottom-6 right-6 !z-40 max-w-[calc(100vw-24px)] max-[640px]:bottom-3 max-[640px]:right-3">
      {panel}
    </div>
  )
}

function readStoredMode(): TimerMode {
  return localStorage.getItem(MODE_KEY) === 'rest' ? 'rest' : 'focus'
}

function readStoredDuration(key: string, fallback: number): number {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value)) return fallback
  return clampDuration(value)
}

function readStoredTimerState(): StoredTimerState | null {
  const raw = localStorage.getItem(STATE_KEY)
  if (!raw) return null

  try {
    const value = JSON.parse(raw)
    if (!isStoredTimerState(value)) throw new Error('Invalid timer state')
    return value
  } catch {
    localStorage.removeItem(STATE_KEY)
    return null
  }
}

function isStoredTimerState(value: unknown): value is StoredTimerState {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  const status = state.status
  const mode = state.mode
  const endTime = state.endTime
  const remainingMs = state.remainingMs

  if (status !== 'running' && status !== 'paused') return false
  if (mode !== 'focus' && mode !== 'rest') return false
  if (typeof endTime !== 'number' || !Number.isFinite(endTime) || endTime < 0) return false
  if (typeof remainingMs !== 'number' || !Number.isFinite(remainingMs) || remainingMs < 0) return false
  if (status === 'running' && endTime <= 0) return false
  if (status === 'paused' && remainingMs <= 0) return false
  return true
}

function writeStoredTimerState(value: StoredTimerState) {
  localStorage.setItem(STATE_KEY, JSON.stringify(value))
}

function readNotificationPermission(): NotificationState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

async function requestNotificationPermission(): Promise<NotificationState> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission

  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

function notifyFinished(mode: TimerMode) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  try {
    if (mode === 'focus') {
      new Notification('专注结束', { body: '休息一下吧' })
      return
    }
    new Notification('休息结束', { body: '开始下一轮专注' })
  } catch {
    // Some environments expose Notification but still reject creation.
  }
}

function getCompletionMessage(mode: TimerMode): string {
  return mode === 'focus' ? '专注结束，休息一下吧' : '休息结束，开始下一轮专注'
}

function durationKeyForMode(mode: TimerMode): string {
  return mode === 'focus' ? FOCUS_DURATION_KEY : REST_DURATION_KEY
}

function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return MIN_DURATION_MINUTES
  const integer = Math.round(value)
  return Math.min(MAX_DURATION_MINUTES, Math.max(MIN_DURATION_MINUTES, integer))
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function isSmallScreen(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 640px)').matches
}

function TimerIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="9" r="5" />
      <path d="M8 6.5v3l2 1" />
      <path d="M5 2.5l-1 1" />
      <path d="M11 2.5l1 1" />
      <path d="M8 4V2.5" />
    </svg>
  )
}

function CollapseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 6h6" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="2.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M2.5 1.5l6 3.5-6 3.5z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <rect x="1.5" y="1" width="2.5" height="8" rx="0.5" />
      <rect x="6" y="1" width="2.5" height="8" rx="0.5" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v4h4" />
      <path d="M3.4 7A5 5 0 118 13" />
    </svg>
  )
}
