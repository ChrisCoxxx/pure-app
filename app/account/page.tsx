'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getCurrentBatches } from '@/lib/progression'

function AccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isReset = searchParams.get('reset') === '1'

  const [email, setEmail] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [currentBatch, setCurrentBatch] = useState('')
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [showPwForm, setShowPwForm] = useState(isReset)
  const [loading, setLoading] = useState(false)

  const t = {
    fr: {
      title: 'Mon compte', email: 'Email', status: 'Statut', active: 'Actif', inactive: 'Inactif',
      startDate: 'Début du programme', currentBatch: 'Batch actuel', changePassword: 'Changer le mot de passe',
      logout: 'Se déconnecter', newPassword: 'Nouveau mot de passe', confirmPassword: 'Confirmer', save: 'Enregistrer',
      passwordMismatch: 'Les mots de passe ne correspondent pas.', passwordUpdated: 'Mot de passe mis à jour.',
      language: 'Langue', back: '← Retour',
    },
    en: {
      title: 'My account', email: 'Email', status: 'Status', active: 'Active', inactive: 'Inactive',
      startDate: 'Program start date', currentBatch: 'Current batch', changePassword: 'Change password',
      logout: 'Sign out', newPassword: 'New password', confirmPassword: 'Confirm', save: 'Save',
      passwordMismatch: 'Passwords do not match.', passwordUpdated: 'Password updated.',
      language: 'Language', back: '← Back',
    },
  }[lang]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setEmail(session.user.email!)
      setIsActive(prof?.is_active || false)
      setLang(prof?.lang || 'fr')
      if (prof?.start_date) {
        setStartDate(new Date(prof.start_date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' }))
        const [cur1, cur2] = getCurrentBatches(prof.start_date)
        setCurrentBatch(`${cur1} & ${cur2}`)
      }
    }
    load()
  }, [router])

  async function handleLanguageChange(newLang: 'fr' | 'en') {
    setLang(newLang)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session) await supabase.from('profiles').update({ lang: newLang }).eq('id', session.user.id)
  }

  async function handlePasswordChange() {
    setPwError('')
    setPwSuccess('')
    if (newPassword !== confirmPassword) { setPwError(t.passwordMismatch); return }
    if (newPassword.length < 6) { setPwError(lang === 'fr' ? 'Minimum 6 caractères.' : 'Minimum 6 characters.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPwError(error.message); setLoading(false); return }
    setPwSuccess(t.passwordUpdated)
    setNewPassword('')
    setConfirmPassword('')
    setShowPwForm(false)
    setLoading(false)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <>
      <nav className="nav">
        <Link href="/dashboard" className="nav-back">{t.back}</Link>
        <span className="nav-logo">PURE</span>
        <div style={{ width: 32 }} />
      </nav>
      <div className="page-container">
        <p className="section-label" style={{ marginTop: 0 }}>{t.title}</p>

        <div className="account-row">
          <span className="account-label">{t.email}</span>
          <span className="account-value">{email}</span>
        </div>
        <div className="account-row">
          <span className="account-label">{t.status}</span>
          <span className="account-value" style={{ color: isActive ? 'var(--color-green-text)' : 'var(--color-text-tertiary)' }}>
            {isActive ? t.active : t.inactive}
          </span>
        </div>
        {startDate && (
          <div className="account-row">
            <span className="account-label">{t.startDate}</span>
            <span className="account-value">{startDate}</span>
          </div>
        )}
        {currentBatch && (
          <div className="account-row">
            <span className="account-label">{t.currentBatch}</span>
            <span className="account-value">{currentBatch}</span>
          </div>
        )}
        <div className="account-row">
          <span className="account-label">{t.language}</span>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => handleLanguageChange('fr')}>FR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => handleLanguageChange('en')}>EN</button>
          </div>
        </div>

        {pwSuccess && <p className="success-msg" style={{ marginTop: '16px' }}>{pwSuccess}</p>}

        {!showPwForm
          ? <button className="btn-secondary" onClick={() => setShowPwForm(true)}>{t.changePassword}</button>
          : (
            <div style={{ marginTop: '20px' }}>
              <div className="field">
                <label>{t.newPassword}</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="field">
                <label>{t.confirmPassword}</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              {pwError && <p className="error-msg">{pwError}</p>}
              <button className="btn-primary" onClick={handlePasswordChange} disabled={loading}>
                {loading ? '...' : t.save}
              </button>
              <button className="btn-secondary" onClick={() => setShowPwForm(false)}>
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </div>
          )
        }

        <button className="btn-secondary" style={{ marginTop: '24px' }} onClick={handleLogout}>{t.logout}</button>
      </div>
    </>
  )
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  )
}
