'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getCurrentBatches, getArchiveBatches, getMaxUnlockedBatch } from '@/lib/progression'

const ADMIN_EMAIL = 'chris.cdr@gmail.com'

type Batch = { id: string; batch_number: number; title: string; description: string; univers: string }
type Profile = { email: string; is_active: boolean; start_date: string; lang: string }

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [firstName, setFirstName] = useState('')
  const SUBTITLES = [
    "La structure remplace la volonté.",
    "Ceci n'est pas un régime.",
    "2 batches. 3 jours. Zéro charge mentale.",
    "Pas de faim. Pas de calcul. Juste de la structure.",
  ]
  const [subtitle] = useState(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)])

  const t = {
    fr: {
      greeting: 'Bonjour,',
      weekLabel: 'Semaine',
      of: '/',
      batchesUnlocked: 'batchs débloqués',
      currentTitle: 'Cette semaine',
      archivesTitle: 'Archives',
      noArchives: 'Aucune archive pour le moment.',
      badgeCurrent: 'En cours',
      batchLabel: 'Batch',
    },
    en: {
      greeting: 'Hello,',
      weekLabel: 'Week',
      of: '/',
      batchesUnlocked: 'batches unlocked',
      currentTitle: 'This week',
      archivesTitle: 'Archives',
      noArchives: 'No archives yet.',
      badgeCurrent: 'Current',
      batchLabel: 'Batch',
    },
  }[lang]

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      setIsAdmin(session.user.email === ADMIN_EMAIL)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!prof || !prof.is_active || !prof.start_date) { router.replace('/login'); return }

      setProfile({ email: session.user.email!, is_active: prof.is_active, start_date: prof.start_date, lang: prof.lang || 'fr' })
      setLang(prof.lang || 'fr')
      setFirstName(prof.first_name || '')

      const { data: batchData } = await supabase
        .from('batches')
        .select('id, batch_number, title, description, univers')
        .eq('is_published', true)
        .order('batch_number')

      setBatches(batchData || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Playfair Display', serif", fontWeight: 900, letterSpacing: '-0.02em', fontSize: '28px' }}><span style={{color:'#C8603A'}}>EX</span><span style={{color:'var(--color-text-tertiary)'}}>QUILO</span></div>
  if (!profile) return null

  const [cur1, cur2] = getCurrentBatches(profile.start_date)
  const archiveNums = getArchiveBatches(profile.start_date)
  const currentBatches = batches.filter(b => b.batch_number === cur1 || b.batch_number === cur2)
  const archiveBatches = batches.filter(b => archiveNums.includes(b.batch_number)).reverse()
  const initial = profile.email[0].toUpperCase()

  const weeksElapsed = Math.floor((Date.now() - new Date(profile.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
  const maxUnlocked = getMaxUnlockedBatch(profile.start_date)
  const unlockedCount = batches.filter(b => b.batch_number <= maxUnlocked).length
  const progressPercent = batches.length > 0 ? Math.min((unlockedCount / batches.length) * 100, 100) : 0

  return (
    <>
      <nav className="nav">
        <span className="nav-logo"><span style={{color:'#C8603A'}}>EX</span>QUILO</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdmin && (
            <Link href="/admin" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', padding: '5px 12px', border: '0.5px solid var(--color-border-medium)', borderRadius: '20px', textDecoration: 'none' }}>
              Admin
            </Link>
          )}
          <Link href="/account" className="nav-avatar">{initial}</Link>
        </div>
      </nav>

<div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 20px 0' }}>
  <div style={{ background: 'var(--color-bg-secondary)', border: '0.5px solid var(--color-border)', borderRadius: '16px', padding: '20px' }}>
    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{t.greeting}</p>
    {firstName && (
      <p style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px' }}>{firstName}</p>
    )}
    <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginBottom: '16px' }}>
      {subtitle}
    </p>
    <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '4px', marginBottom: '8px' }}>
      <div style={{ height: '3px', width: `${progressPercent}%`, background: 'var(--color-text-secondary)', borderRadius: '4px' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
      <span style={{ fontWeight: 500 }}>{t.weekLabel} {weeksElapsed}</span>
      <span>{unlockedCount} {t.batchesUnlocked}</span>
    </div>
  </div>
</div>

      <div className="page-container">
        <p className="section-label">{t.currentTitle}</p>
        {currentBatches.length === 0 && (
          <p className="empty-state">{lang === 'fr' ? 'Bientôt disponible — reviens la semaine prochaine.' : 'Coming soon — check back next week.'}</p>
        )}
        {currentBatches.map(b => (
          <Link key={b.id} href={`/batch/${b.batch_number}`} className="card current">
            <div>
              <p className="batch-number">{t.batchLabel} {b.batch_number}</p>
              <p className="batch-title">{b.title}</p>
              {b.univers && <p className="batch-subtitle">{b.univers}</p>}
            </div>
            <span className="badge-current">{t.badgeCurrent}</span>
          </Link>
        ))}

        <p className="section-label">{t.archivesTitle}</p>
        {archiveBatches.length === 0
          ? <p className="empty-state">{t.noArchives}</p>
          : archiveBatches.map(b => (
            <Link key={b.id} href={`/batch/${b.batch_number}`} className="card">
              <div>
                <p className="batch-number">{t.batchLabel} {b.batch_number}</p>
                <p className="batch-title">{b.title}</p>
              </div>
              <span className="card-arrow">→</span>
            </Link>
          ))
        }
      </div>
    </>
  )
}