'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InstallBanner from '@/components/InstallBanner'
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Playfair Display', serif", fontWeight: 900, letterSpacing: '-0.02em', fontSize: '28px', background: 'var(--color-bg-tertiary)' }}><span style={{color:'#C8603A'}}>EX</span><span style={{color:'var(--color-text-tertiary)'}}>QUILO</span></div>
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
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: '56px', background: 'transparent' }}>
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

<div style={{ maxWidth: '480px', margin: '0 auto', padding: '4px 20px 0' }}>
  <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid rgba(200,96,58,0.15)', borderRadius: '18px', padding: '24px 24px 20px', position: 'relative', overflow: 'hidden' }}>
    {/* Decorative circle */}
    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '130px', height: '130px', borderRadius: '50%', background: '#F0D5C8', opacity: 0.45, pointerEvents: 'none', zIndex: 0 }} />
    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '2px', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500, position: 'relative', zIndex: 1 }}>{t.greeting}</p>
    {firstName && (
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 900, color: 'var(--color-text)', marginBottom: '10px', lineHeight: 1.1, position: 'relative', zIndex: 1 }}>{firstName}</p>
    )}
    <p style={{ fontSize: '13px', color: '#C8603A', fontStyle: 'italic', marginBottom: '20px', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>
      &ldquo;{subtitle}&rdquo;
    </p>
    <div style={{ height: '5px', background: 'rgba(44,44,42,0.1)', borderRadius: '6px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
      <div style={{ height: '5px', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #C8603A, #E8845F)', borderRadius: '6px' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)', position: 'relative', zIndex: 1 }}>
      <span style={{ fontWeight: 500 }}>{t.weekLabel} {weeksElapsed}</span>
      <span>{unlockedCount} {t.batchesUnlocked}</span>
    </div>
  </div>
</div>

<InstallBanner lang={lang} />

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 20px 0' }}>
        <p className="section-label" style={{ marginTop: 0 }}>{t.currentTitle}</p>
        {currentBatches.length === 0 && (
          <p className="empty-state">{lang === 'fr' ? 'Bientôt disponible — reviens la semaine prochaine.' : 'Coming soon — check back next week.'}</p>
        )}
        {currentBatches.map(b => (
          <Link key={b.id} href={`/batch/${b.batch_number}`} style={{ background: 'var(--color-bg-secondary)', border: '1px solid rgba(200,96,58,0.18)', borderLeft: '2.5px solid #C8603A', borderRadius: '14px', padding: '16px 18px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div>
              <p className="batch-number">{t.batchLabel} {b.batch_number}</p>
              <p className="batch-title">{b.title}</p>
              {b.univers && <p className="batch-subtitle">{b.univers}</p>}
            </div>
            <span style={{ fontSize: '11px', fontWeight: 500, padding: '5px 12px', background: '#C8603A', color: '#fff', borderRadius: '20px', flexShrink: 0 }}>{t.badgeCurrent}</span>
          </Link>
        ))}
      </div>

      {/* Archives on white sheet */}
      <div style={{ maxWidth: '480px', margin: '12px auto 0', background: '#ffffff', borderRadius: '16px 16px 0 0', padding: '20px 20px 60px', boxShadow: '0 -1px 12px rgba(0,0,0,0.05)' }}>
        <p className="section-label" style={{ marginTop: 0 }}>{t.archivesTitle}</p>
        {archiveBatches.length === 0
          ? <p className="empty-state">{t.noArchives}</p>
          : archiveBatches.map((b, i) => (
            <Link key={b.id} href={`/batch/${b.batch_number}`} style={{ padding: '14px 0', borderBottom: i < archiveBatches.length - 1 ? '0.5px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
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