import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator && (window.navigator as any).standalone === true)
    || window.matchMedia('(display-mode: standalone)').matches
}

export function InstallBanner() {
  const [visible, setVisible] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const deferredPrompt = useRef<any>(null)

  useEffect(() => {
    if (isInStandaloneMode()) return

    setIsIos(isIOS())

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      deferredPrompt.current = e
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    if (isIOS()) setVisible(true)

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt.current) return
    deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') setVisible(false)
    deferredPrompt.current = null
  }

  if (!visible) return null

  if (isIos) {
    return (
      <>
        {/* Banner */}
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
          <img src="/narubase_logo.svg" alt="NaruBase" className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Install NaruBase</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-snug">
              Tap <strong>Share</strong> below, then <strong>Add to Home Screen</strong>
            </p>
          </div>
        </div>
        {/* Arrow pointing down to Safari toolbar */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
            <path d="M14 0 L14 28" stroke="#3D3DB4" strokeWidth="3" strokeLinecap="round"/>
            <path d="M4 20 L14 32 L24 20" stroke="#3D3DB4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
      <img src="/narubase_logo.svg" alt="NaruBase" className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Install NaruBase</p>
        <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for the best experience</p>
      </div>
      <button
        onClick={handleInstall}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand/90 transition-colors"
      >
        <Download size={13} />
        Install
      </button>
    </div>
  )
}
