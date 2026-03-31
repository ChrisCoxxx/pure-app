'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  const t = {
    fr: {
      title: 'Créer votre mot de passe',
      subtitle: 'Bienvenue sur PURE. Choisissez un mot de passe pour accéder à votre programme.',
      password: 'Mot de passe',
      confirm: 'Confirmer le mot de passe',
      submit: 'Accéder à mon programme',
      mismatch: 'Les mots de passe ne correspondent pas.',
      short: 'Minimum 6 caractères.',
      error: 'Une erreur est survenue. Réessayez.',
    },
    en: {
      title: 'Create your password',
      subtitle: 'Welcome to PURE. Choose a password to access your program.',
      password: 'Password',
      confirm: 'Confirm password',
      submit: 'Access my program',
      mismatch: 'Passwords do not match.',
      short: 'Minimum 6 characters.',
      error: 'An error occurred. Please try again.',
    },
  }[lang]

  useEffect(() => {
    // Supabase puts the token in the URL hash — we need to let it process
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    // Also check if already has session from invite link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
  }, [])

  async function handleSubmit() {
    setError('')
    if (password !== confirm) { setError(t.mismatch); return }
    if (password.length < 6) { setError(t.short); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(t.error); setLoading(false); return }
    router.replace('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '26px', fontWeight: 500, letterSpacing: '0.14em' }}>PURE</span>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>{t.title}</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: '1.5' }}>{t.subtitle}</p>

        <div className="field">
          <label>{t.password}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="field">
          <label>{t.confirm}</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading || !ready}>
          {loading ? '...' : t.submit}
        </button>
      </div>
    </div>
  )
}
