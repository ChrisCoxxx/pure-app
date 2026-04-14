'use client'
import { useEffect, useState } from 'react'

interface Props {
  lang: 'fr' | 'en'
}

export default function InstallBanner({ lang }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  const t = {
    fr: {
      title: 'Installer EXQUILO',
      subtitle: 'Accès rapide depuis ton écran d\'accueil',
      install: 'Installer',
      dismiss: 'Plus tard',
      close: 'Fermer',
      guideChrome: 'Dans le menu de ton navigateur (⋮ ou ···), appuie sur "Installer l\'application" ou "Ajouter à l\'écran d\'accueil".',
      guideIOS: 'Dans Safari, appuie sur le bouton Partager ⎙ en bas de l\'écran, puis "Sur l\'écran d\'accueil".',
    },
    en: {
      title: 'Install EXQUILO',
      subtitle: 'Quick access from your home screen',
      install: 'Install',
      dismiss: 'Later',
      close: 'Close',
      guideChrome: 'In your browser menu (⋮ or ···), tap "Install app" or "Add to Home Screen".',
      guideIOS: 'In Safari, tap the Share button ⎙ at the bottom, then "Add to Home Screen".',
    },
  }[lang]

  useEffect(() => {
    // Déjà installé → on n'affiche rien
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Déjà refusé cette session
    if (sessionStorage.getItem('install-dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as { standalone?: boolean }).standalone
    setIsIOS(ios)

    // Toujours visible (sauf cas ci-dessus)
    setVisible(true)

    // Sur Chrome/Brave/Edge : on capture le prompt natif si dispo
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> })
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setVisible(false))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1')
    setVisible(false)
    setShowGuide(false)
  }

  async function handleInstall() {
    if (deferredPrompt) {
      // Chrome/Brave avec prompt natif → on le déclenche directement
      await deferredPrompt.prompt()
      setVisible(false)
      setDeferredPrompt(null)
    } else {
      // Tous les autres (iOS Safari, Firefox, Brave sans prompt…) → guide textuel
      setShowGuide(true)
    }
  }

  if (!visible) return null

  return (
    <div style={{ maxWidth: '480px', margin: '12px auto 0', padding: '0 20px' }}>
      <div style={{
        background: 'var(--color-bg-secondary)',
        border: '0.5px solid var(--color-border)',
        borderRadius: '16px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {!showGuide ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icons/icon-192.png" alt="EXQUILO"
                  style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{t.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{t.subtitle}</p>
                </div>
              </div>
              <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text-tertiary)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleInstall} style={{
                flex: 1, padding: '10px', background: '#C8603A', color: '#fff',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}>
                📲 {t.install}
              </button>
              <button onClick={dismiss} style={{
                flex: 1, padding: '10px', background: 'transparent',
                color: 'var(--color-text-secondary)', border: '0.5px solid var(--color-border-medium)',
                borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
              }}>
                {t.dismiss}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{t.title}</p>
              <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text-tertiary)', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.7 }}>
              {isIOS ? t.guideIOS : t.guideChrome}
            </p>
            <button onClick={dismiss} style={{
              padding: '10px', background: 'transparent', color: 'var(--color-text-secondary)',
              border: '0.5px solid var(--color-border-medium)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer',
            }}>
              {t.close}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
