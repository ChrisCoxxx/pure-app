'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SetPasswordPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [isReset, setIsReset] = useState(false)

  const t = {
    fr: {
      titleInvite: 'Créer votre mot de passe',
      titleReset: 'Nouveau mot de passe',
      subtitleInvite: 'Bienvenue sur EXQUILO. Complétez votre profil pour accéder à votre programme.',
      subtitleReset: 'Choisissez un nouveau mot de passe pour votre compte.',
      firstName: 'Prénom',
      password: 'Mot de passe',
      confirm: 'Confirmer le mot de passe',
      submitInvite: 'Accéder à mon programme',
      submitReset: 'Mettre à jour le mot de passe',
      mismatch: 'Les mots de passe ne correspondent pas.',
      short: 'Minimum 6 caractères.',
      error: 'Lien expiré. Demandez un nouveau lien depuis la page de connexion.',
      waiting: 'Vérification du lien...',
    },
    en: {
      titleInvite: 'Create your password',
      titleReset: 'New password',
      subtitleInvite: 'Welcome to EXQUILO. Complete your profile to access your program.',
      subtitleReset: 'Choose a new password for your account.',
      firstName: 'First name',
      password: 'Password',
      confirm: 'Confirm password',
      submitInvite: 'Access my program',
      submitReset: 'Update password',
      mismatch: 'Passwords do not match.',
      short: 'Minimum 6 characters.',
      error: 'Link expired. Request a new link from the login page.',
      waiting: 'Verifying link...',
    },
  }[lang]

  useEffect(() => {
    const supabase = createClient()
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      const type = hashParams.get('type')
      if (type === 'recovery') setIsReset(true)
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) setError(t.error)
          else setSessionReady(true)
        })
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSessionReady(true)
        else setError('Lien expiré. Contactez votre administrateur.')
      })
    }
  }, [])

  async function handleSubmit() {
    setError('')
    if (password !== confirm) { setError(t.mismatch); return }
    if (password.length < 6) { setError(t.short); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(t.error); setLoading(false); return }
    if (firstName.trim()) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.from('profiles').update({ first_name: firstName.trim() }).eq('id', session.user.id)
      }
    }
    router.replace('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}><span style={{color:'#C8603A'}}>EX</span><span style={{color:'#2C2C2A'}}>QUILO</span></span>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>
          {isReset ? t.titleReset : t.titleInvite}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: '1.5' }}>
          {isReset ? t.subtitleReset : t.subtitleInvite}
        </p>

        {!sessionReady && !error && (
          <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', marginBottom: '20px' }}>{t.waiting}</p>
        )}

        {!isReset && (
          <div className="field">
            <label>{t.firstName}</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
              placeholder={lang === 'fr' ? 'Votre prénom' : 'Your first name'}
              disabled={!sessionReady} />
          </div>
        )}
        <div className="field">
          <label>{t.password}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={!sessionReady} />
        </div>
        <div className="field">
          <label>{t.confirm}</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} disabled={!sessionReady} />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading || !sessionReady}>
          {loading ? '...' : isReset ? t.submitReset : t.submitInvite}
        </button>
      </div>
    </div>
  )
}