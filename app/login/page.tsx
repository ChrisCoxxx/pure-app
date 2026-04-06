'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  const t = {
    fr: {
      email: 'Adresse email', password: 'Mot de passe', submit: 'Se connecter',
      forgot: 'Mot de passe oublié ?', resetSent: 'Un lien a été envoyé à votre email.',
      error: 'Email ou mot de passe incorrect.',
    },
    en: {
      email: 'Email address', password: 'Password', submit: 'Sign in',
      forgot: 'Forgot password?', resetSent: 'A reset link has been sent to your email.',
      error: 'Incorrect email or password.',
    },
  }[lang]

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(t.error); setLoading(false); return }
    router.replace('/dashboard')
  }

  async function handleForgot() {
    if (!email) { setError(lang === 'fr' ? 'Entrez votre email d\'abord.' : 'Enter your email first.'); return }
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account?reset=1` })
    setResetSent(true)
    setError('')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '34px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}><span style={{color:'#C8603A'}}>EX</span><span style={{color:'#2C2C2A'}}>QUILO</span></span>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>

        <div className="field">
          <label>{t.email}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <div className="field">
          <label>{t.password}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        {error && <p className="error-msg">{error}</p>}
        {resetSent && <p className="success-msg">{t.resetSent}</p>}

        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? '...' : t.submit}
        </button>

        <p style={{ marginTop: '14px', textAlign: 'center' }}>
          <span className="nav-back" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}
            onClick={handleForgot}>{t.forgot}</span>
        </p>
      </div>
    </div>
  )
}
