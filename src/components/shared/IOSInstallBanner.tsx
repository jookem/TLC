import { useEffect, useRef, useState } from 'react'
import { Share, Download } from 'lucide-react'

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

    // Android/Chrome: capture the install prompt
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      deferredPrompt.current = e
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    // iOS: always show the manual instructions banner
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

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
      <img src="/narubase_logo.svg" alt="NaruBase" className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Install NaruBase</p>
        {isIos ? (
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            Tap <Share size={11} className="inline mb-0.5 mx-0.5" /> then <strong>Add to Home Screen</strong>
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-0.5">Add to your home screen for the best experience</p>
        )}
      </div>
      {!isIos && (
        <button
          onClick={handleInstall}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Download size={13} />
          Install
        </button>
      )}
    </div>
  )
}
