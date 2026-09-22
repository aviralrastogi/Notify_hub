/**
 * OneSignal Web SDK v16 — wait for __oneSignalReady from index.html, then subscribe.
 */

function withTimeout(promise, ms, message) {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

export function getOneSignal(timeoutMs = 22000) {
  if (window.__OneSignal) {
    return Promise.resolve(window.__OneSignal)
  }
  if (window.__oneSignalReady) {
    return withTimeout(
      window.__oneSignalReady,
      timeoutMs,
      'OneSignal did not load. Disable ad blockers and check VITE_ONESIGNAL_APP_ID.'
    )
  }
  return Promise.reject(new Error('OneSignal SDK script is missing from the page.'))
}

/** Legacy helper — prefer getOneSignal() after init. */
export function withOneSignal(fn, { timeoutMs = 22000 } = {}) {
  return getOneSignal(timeoutMs).then((OneSignal) => fn(OneSignal))
}

function asPromise(maybePromise) {
  if (maybePromise && typeof maybePromise.then === 'function') {
    return maybePromise
  }
  return Promise.resolve()
}

/** Native browser prompt (reliable user gesture) + OneSignal opt-in. */
export async function subscribeToPush(OneSignal) {
  if (!OneSignal.Notifications.isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser')
  }

  if (typeof Notification === 'undefined') {
    throw new Error('Notifications API is not available in this browser')
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await Notification.requestPermission()
  }

  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Notifications are blocked. Allow them in Chrome site settings (lock icon → Site settings).'
        : 'Notification permission was not granted.'
    )
  }

  await withTimeout(
    asPromise(OneSignal.User.PushSubscription.optIn()),
    20000,
    'Push subscription timed out. Open /OneSignalSDKWorker.js in the browser to confirm it loads as JavaScript.'
  )

  return waitForSubscriptionId(OneSignal, 15000)
}

export function waitForSubscriptionId(OneSignal, timeoutMs = 15000) {
  const readId = () => OneSignal.User?.PushSubscription?.id

  const existing = readId()
  if (existing) {
    return Promise.resolve(existing)
  }

  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs

    function onChange(event) {
      const id = event.current?.id || readId()
      if (id) {
        cleanup()
        resolve(id)
      }
    }

    const poll = setInterval(() => {
      const id = readId()
      if (id) {
        cleanup()
        resolve(id)
        return
      }
      if (Date.now() >= deadline) {
        cleanup()
        reject(new Error('Timed out waiting for push subscription ID'))
      }
    }, 400)

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for push subscription ID'))
    }, timeoutMs)

    function cleanup() {
      clearTimeout(timeout)
      clearInterval(poll)
      OneSignal.User.PushSubscription.removeEventListener('change', onChange)
    }

    OneSignal.User.PushSubscription.addEventListener('change', onChange)
  })
}
