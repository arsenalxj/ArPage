(async () => {
  const api = globalThis.browser ?? globalThis.chrome
  const config = await storageGet(['arpageUrl'])
  const url = typeof config.arpageUrl === 'string' ? config.arpageUrl : ''

  if (isHttpUrl(url)) {
    location.replace(url)
    return
  }

  document.body.innerHTML = `
    <main class="setup">
      <section class="panel">
        <h1>ArPage</h1>
        <p>还没有配置导航页地址。先填写你的在线 ArPage 地址，然后新标签页会自动跳转过去。</p>
        <button id="open-options" type="button">配置地址</button>
      </section>
    </main>
  `

  document.getElementById('open-options')?.addEventListener('click', () => {
    if (api.runtime.openOptionsPage) {
      api.runtime.openOptionsPage()
      return
    }
    location.href = api.runtime.getURL('options.html')
  })

  function storageGet(keys) {
    return callApi(api.storage.local.get.bind(api.storage.local), keys)
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

  function isHttpUrl(value) {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }
})()
