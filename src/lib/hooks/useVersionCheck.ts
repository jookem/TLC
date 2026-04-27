import { useEffect, useRef, useState } from 'react'

declare const __APP_VERSION__: string

const CURRENT = __APP_VERSION__
const DISMISSED_KEY = 'narubase_dismissed_version'

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const remoteVersion = useRef<string | null>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    let cancelled = false

    function trigger(v: string) {
      if (cancelled) return
      const dismissed = sessionStorage.getItem(DISMISSED_KEY)
      if (dismissed === v) return  // user already clicked Update for this version
      remoteVersion.current = v
      setUpdateAvailable(true)
    }

    async function check() {
      try {
        const res = await fetch('/app-version.json', { cache: 'no-store' })
        if (!res.ok) return
        const { v } = await res.json()
        if (v && v !== CURRENT) { trigger(v); clearInterval(interval) }
      } catch {}
    }

    check()
    interval = setInterval(check, 5 * 60 * 1000)

    if ('serviceWorker' in navigator) {
      const hadController = !!navigator.serviceWorker.controller
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) check()
      })
    }

    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  async function applyUpdate() {
    // Dismiss this version so the banner won't reappear if the reload still
    // serves the old bundle (e.g. SW swap hasn't completed yet)
    if (remoteVersion.current) {
      sessionStorage.setItem(DISMISSED_KEY, remoteVersion.current)
    }
    setUpdateAvailable(false)

    // Tell a waiting service worker to activate immediately
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        // Reload after the new SW takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
        return
      }
    }
    window.location.reload()
  }

  return { updateAvailable, applyUpdate }
}
