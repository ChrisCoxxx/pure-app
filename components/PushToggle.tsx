'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

interface Props {
  lang: 'fr' | 'en'
}

export default function PushToggle({ lang }: Props) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)

  const t = {
    fr: {
      label: 'Notifications',
      enable: 'Activer',
      disable: 'Désactiver',
      denied: 'Bloquées par le navigateur',
      unsupported: 'Non supportées',
    },
    en: {
      label: 'Notifications',
      enable: 'Enable',
      disable: 'Disable',
      denied: 'Blocked by browser',
      unsupported: 'Not supported',
    },
  }[lang]

  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    setSupported(isSupported)
    if (!isSupported) return

    setPermission(Notification.permission)
    navigator.serviceWorker.ready.then(async reg => {
      const existing = await reg.pushManager.getSubscription()
      setSubscribed(!!existing)
    })
  }, [])

  async function handleToggle() {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          if (session) {
            await fetch('/api/push/subscribe', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            })
          }
        }
        setSubscribed(false)
      } else {
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result !== 'granted') { setLoading(false); return }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
        })
        const subJSON = sub.toJSON()

        if (session) {
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ endpoint: subJSON.endpoint, keys: subJSON.keys }),
          })
        }
        setSubscribed(true)
      }
    } catch (err) {
      console.error('PushToggle error:', err)
    }
    setLoading(false)
  }

  if (!supported) return (
    <div className="account-row">
      <span className="account-label">{t.label}</span>
      <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>{t.unsupported}</span>
    </div>
  )

  if (permission === 'denied') return (
    <div className="account-row">
      <span className="account-label">{t.label}</span>
      <span style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>{t.denied}</span>
    </div>
  )

  return (
    <div className="account-row">
      <span className="account-label">{t.label}</span>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="lang-btn"
        style={subscribed ? { background: '#C8603A', color: '#fff', borderColor: 'transparent' } : {}}
      >
        {loading ? '…' : subscribed ? t.disable : t.enable}
      </button>
    </div>
  )
}
