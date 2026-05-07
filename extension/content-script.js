const api = globalThis.browser ?? globalThis.chrome
let lastRequestAt = 0

postToPage({ type: 'ARPAGE_EXTENSION_READY' })
requestRecentHistory()

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestRecentHistory()
})

async function requestRecentHistory() {
  const now = Date.now()
  if (now - lastRequestAt < 800) return
  lastRequestAt = now

  try {
    const response = await runtimeSendMessage({ type: 'GET_RECENT_HISTORY', pageOrigin: location.origin })
    if (!response?.ok || !Array.isArray(response.items)) return
    postToPage({
      type: 'ARPAGE_RECENT_HISTORY',
      items: response.items,
    })
  } catch {
    // History suggestions are optional. The page stays unchanged on failure.
  }
}

function postToPage(payload) {
  window.postMessage({
    source: 'arpage-extension',
    ...payload,
  }, window.location.origin)
}

function runtimeSendMessage(message) {
  return callApi(api.runtime.sendMessage.bind(api.runtime), message)
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
