'use client'
import { useEffect, useState } from 'react'

interface Props {
  lang: 'fr' | 'en'
}

export default function InstallBanner({ lang }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [visible, setVisible] = useState(false)

  const t = {
    fr: {
      title: 'Installer EXQUILO',
      subtitle: 'Accès rapide depuis ton écran d\'accueil',
      install: 'Installer',
      iosStep1: 'Appuie sur',
      iosStep2: 'puis "Sur l\'écran d\'accueil"',
      dismiss: 'Plus tard',
      close: 'Fermer',
    },
    en: {
      title: 'Install EXQUILO',
      subtitle: 'Quick access from your home screen',
      install: 'Install',
      iosStep1: 'Tap the',
      iosStep2: 'button, then "Add to Home Screen"',
      dismiss: 'Later',
      close: 'Close',
    },
  }[lang]

  useEffect(() => {
    // Ne pas afficher si déjà installé en mode standalone
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Ne pas afficher si déjà refusé dans cette session
    if (sessionStorage.getItem('install-dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as { standalone?: boolean }).standalone
    setIsIOS(ios)

    if (ios) {
      // Sur iOS Safari, pas d'événement — on affiche directement le guide
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
      if (isSafari) setVisible(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> })
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setVisible(false))

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1')
    setVisible(false)
    setShowIOSGuide(false)
  }

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div style={{
      maxWidth: '480px', margin: '12px auto 0', padding: '0 20px',
    }}>
      <div style={{
        background: 'var(--color-bg-secondary)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '16px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {!showIOSGuide ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/icon-192.png" alt="EXQUILO" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{t.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{t.subtitle}</p>
                </div>
              </div>
              <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--color-text-tertiary)', padding: '0 4px', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleInstall}
                style={{ flex: 1, padding: '10px', background: '#C8603A', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                {t.install}
              </button>
              <button
                onClick={dismiss}
                style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-medium)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}
              >
                {t.dismiss}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{t.title}</p>
              <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--color-text-tertiary)', padding: '0 4px', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {t.iosStep1} <span style={{ display: 'inline-block', fontSize: '16px' }}>⎙</span> {t.iosStep2}
            </p>
            <button onClick={dismiss} style={{ padding: '10px', background: 'transparent', color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-medium)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
              {t.close}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
