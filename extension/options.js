const api = globalThis.browser ?? globalThis.chrome

const form = document.getElementById('options-form')
const input = document.getElementById('arpage-url')
const saveButton = document.getElementById('save-button')
const statusEl = document.getElementById('status')

init()

async function init() {
  const config = await storageGet(['arpageUrl'])
  if (typeof config.arpageUrl === 'string') input.value = config.arpageUrl
}

form.addEventListener('submit', async event => {
  event.preventDefault()
  setStatus('保存中…')
  saveButton.disabled = true

  try {
    const next = parseArPageUrl(input.value)
    if (!next) {
      setStatus('请输入 http:// 或 https:// 开头的地址', true)
      return
    }

    const prev = await storageGet(['arpageUrl', 'arpageOrigin', 'arpageHostPattern', 'arpageContentScriptId'])
    const oldPattern = typeof prev.arpageHostPattern === 'string' ? prev.arpageHostPattern : null
    const oldScriptId = typeof prev.arpageContentScriptId === 'string' ? prev.arpageContentScriptId : null

    const granted = await requestHostPermission(next.hostPattern)
    if (!granted) {
      setStatus('未授予域名权限，旧配置保持不变', true)
      return
    }

    const registerResult = await runtimeSendMessage({
      type: 'REGISTER_ARPAGE_CONTENT_SCRIPT',
      pattern: next.hostPattern,
    })

    if (!registerResult?.ok || typeof registerResult.scriptId !== 'string') {
      setStatus('脚本注册失败，旧配置保持不变', true)
      return
    }

    await storageSet({
      arpageUrl: next.url,
      arpageOrigin: next.origin,
      arpageHostPattern: next.hostPattern,
      arpageContentScriptId: registerResult.scriptId,
    })

    if (oldScriptId && oldScriptId !== registerResult.scriptId) {
      await runtimeSendMessage({ type: 'UNREGISTER_ARPAGE_CONTENT_SCRIPT', scriptId: oldScriptId }).catch(() => null)
    }
    if (oldPattern && oldPattern !== next.hostPattern) {
      await removeHostPermission(oldPattern).catch(() => null)
    }

    input.value = next.url
    setStatus('已保存。新标签页会打开这个地址。')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '保存失败', true)
  } finally {
    saveButton.disabled = false
  }
})

function parseArPageUrl(raw) {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    url.hash = ''
    const origin = url.origin
    return {
      url: url.href,
      origin,
      hostPattern: `${origin}/*`,
    }
  } catch {
    return null
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message
  statusEl.classList.toggle('error', isError)
}

function storageGet(keys) {
  return callApi(api.storage.local.get.bind(api.storage.local), keys)
}

function storageSet(value) {
  return callApi(api.storage.local.set.bind(api.storage.local), value)
}

function requestHostPermission(pattern) {
  return callApi(api.permissions.request.bind(api.permissions), { origins: [pattern] })
}

function removeHostPermission(pattern) {
  return callApi(api.permissions.remove.bind(api.permissions), { origins: [pattern] })
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
