'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getCurrentBatches, getArchiveBatches } from '@/lib/progression'

const ADMIN_EMAIL = 'chris.cdr@gmail.com'

type Batch = { id: string; batch_number: number; title: string; description: string }
type Profile = { email: string; is_active: boolean; start_date: string; lang: string }

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const t = {
    fr: { currentTitle: 'Cette semaine', archivesTitle: 'Archives', noArchives: 'Aucune archive pour le moment.', badgeCurrent: 'En cours', batchLabel: 'Batch' },
    en: { currentTitle: 'This week', archivesTitle: 'Archives', noArchives: 'No archives yet.', badgeCurrent: 'Current', batchLabel: 'Batch' },
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

      const { data: batchData } = await supabase
        .from('batches')
        .select('id, batch_number, title, description')
        .eq('is_published', true)
        .order('batch_number')

      setBatches(batchData || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--color-text-tertiary)', letterSpacing: '0.1em' }}>PURE</div>
  if (!profile) return null

  const [cur1, cur2] = getCurrentBatches(profile.start_date)
  const archiveNums = getArchiveBatches(profile.start_date)
  const currentBatches = batches.filter(b => b.batch_number === cur1 || b.batch_number === cur2)
  const archiveBatches = batches.filter(b => archiveNums.includes(b.batch_number)).reverse()
  const initial = profile.email[0].toUpperCase()

  return (
    <>
      <nav className="nav">
        <span className="nav-logo">PURE</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdmin && (
            <Link href="/admin" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', padding: '5px 12px', border: '0.5px solid var(--color-border-medium)', borderRadius: '20px', textDecoration: 'none' }}>
              Admin
            </Link>
          )}
          <Link href="/account" className="nav-avatar">{initial}</Link>
        </div>
      </nav>
      <div className="page-container">
        <p className="section-label">{t.currentTitle}</p>
        {currentBatches.map(b => (
          <Link key={b.id} href={`/batch/${b.batch_number}`} className="card current">
            <div>
              <p className="batch-number">{t.batchLabel} {b.batch_number}</p>
              <p className="batch-title">{b.title}</p>
              <p className="batch-subtitle">{b.description?.split('.')[0]}</p>
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
