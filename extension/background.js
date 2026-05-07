const api = globalThis.browser ?? globalThis.chrome
const ONE_DAY_MS = 24 * 60 * 60 * 1000

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false

  if (message.type === 'GET_RECENT_HISTORY') {
    respond(sendResponse, getRecentHistory(message.pageOrigin))
    return true
  }

  if (message.type === 'REGISTER_ARPAGE_CONTENT_SCRIPT') {
    respond(sendResponse, registerArPageContentScript(message.pattern))
    return true
  }

  if (message.type === 'UNREGISTER_ARPAGE_CONTENT_SCRIPT') {
    respond(sendResponse, unregisterContentScript(message.scriptId))
    return true
  }

  return false
})

api.runtime.onInstalled?.addListener(() => {
  restoreRegisteredScript()
})

api.runtime.onStartup?.addListener(() => {
  restoreRegisteredScript()
})

async function getRecentHistory(pageOrigin) {
  const config = await storageGet(['arpageOrigin'])
  const arpageOrigin = typeof config.arpageOrigin === 'string' ? config.arpageOrigin : ''
  const fallbackOrigin = typeof pageOrigin === 'string' ? pageOrigin : ''
  const rows = await historySearch({
    text: '',
    startTime: Date.now() - ONE_DAY_MS,
    maxResults: 20,
  })

  return {
    ok: true,
    items: rows
      .map(item => toHistoryItem(item, arpageOrigin, fallbackOrigin))
      .filter(Boolean)
      .slice(0, 20),
  }
}

async function registerArPageContentScript(pattern) {
  if (typeof pattern !== 'string' || !isValidHostPattern(pattern)) {
    return { ok: false, error: 'Invalid host pattern' }
  }

  const scriptId = scriptIdForPattern(pattern)
  await unregisterContentScript(scriptId)
  await scriptingRegisterContentScripts([{
    id: scriptId,
    matches: [pattern],
    js: ['content-script.js'],
    runAt: 'document_idle',
  }])

  return { ok: true, scriptId }
}

async function unregisterContentScript(scriptId) {
  if (typeof scriptId !== 'string' || !scriptId) return { ok: true }
  try {
    await scriptingUnregisterContentScripts({ ids: [scriptId] })
  } catch {
    // Removing a missing registration should not block saving a valid config.
  }
  return { ok: true }
}

async function restoreRegisteredScript() {
  try {
    const config = await storageGet(['arpageHostPattern'])
    if (typeof config.arpageHostPattern === 'string') {
      await registerArPageContentScript(config.arpageHostPattern)
    }
  } catch {
    // The options page can repair registration on the next save.
  }
}

function toHistoryItem(item, arpageOrigin, fallbackOrigin) {
  if (!item || typeof item.url !== 'string') return null
  const normalized = normalizeUrlKey(item.url)
  if (!normalized) return null
  try {
    const origin = new URL(normalized).origin
    if (arpageOrigin && origin === arpageOrigin) return null
    if (fallbackOrigin && origin === fallbackOrigin) return null
  } catch {
    return null
  }
  return {
    title: typeof item.title === 'string' ? item.title : '',
    url: normalized,
    lastVisitTime: typeof item.lastVisitTime === 'number' ? item.lastVisitTime : 0,
  }
}

// Keep in sync with normalizeUrlKey in web/src/components/BookmarkGrid.tsx
function normalizeUrlKey(rawUrl) {
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    url.hash = ''
    if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
    return url.href
  } catch {
    return null
  }
}

function isValidHostPattern(pattern) {
  try {
    const url = new URL(pattern.replace(/\/\*$/, '/'))
    return (url.protocol === 'http:' || url.protocol === 'https:') && pattern === `${url.origin}/*`
  } catch {
    return false
  }
}

function scriptIdForPattern(pattern) {
  let hash = 0
  for (let i = 0; i < pattern.length; i += 1) {
    hash = ((hash << 5) - hash + pattern.charCodeAt(i)) | 0
  }
  return `arpage-content-${Math.abs(hash).toString(36)}`
}

function respond(sendResponse, promise) {
  promise
    .then(sendResponse)
    .catch(error => sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }))
}

function storageGet(keys) {
  return callApi(api.storage.local.get.bind(api.storage.local), keys)
}

function historySearch(query) {
  return callApi(api.history.search.bind(api.history), query)
}

function scriptingRegisterContentScripts(scripts) {
  return callApi(api.scripting.registerContentScripts.bind(api.scripting), scripts)
}

function scriptingUnregisterContentScripts(filter) {
  return callApi(api.scripting.unregisterContentScripts.bind(api.scripting), filter)
}

function callApi(fn, ...args) {
  if (globalThis.browser) return fn(...args)

  return new Promise((resolve, reject) => {
    try {
      const result = fn(...args, value => {
        const error = api.runtime.lastError
        if (error) reject(new Error(error.message))
        else resolve(value)
      })
      if (result?.then) result.then(resolve, reject)
    } catch (error) {
      reject(error)
    }
  })
}
