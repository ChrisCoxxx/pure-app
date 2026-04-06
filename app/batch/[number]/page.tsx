'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { canAccessBatch } from '@/lib/progression'

type Batch = { id: string; batch_number: number; title: string; description: string; pdf_url: string }

export default function BatchPage({ params }: { params: { number: string } }) {
  const router = useRouter()
  const batchNumber = parseInt(params.number)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [loading, setLoading] = useState(true)

  const t = {
    fr: { back: '← Retour', day: 'Jour', openPdf: 'Ouvrir le PDF', week: 'Semaine', batch: 'Batch' },
    en: { back: '← Back', day: 'Day', openPdf: 'Open PDF', week: 'Week', batch: 'Batch' },
  }[lang]

  useEffect(() => {
    if (isNaN(batchNumber)) { router.replace('/dashboard'); return }

    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const { data: prof } = await supabase.from('profiles').select('start_date, lang').eq('id', session.user.id).single()
      if (!prof || !prof.start_date) { router.replace('/dashboard'); return }

      setLang(prof.lang || 'fr')

      if (!canAccessBatch(batchNumber, prof.start_date)) { router.replace('/dashboard'); return }

      const { data: batchData } = await supabase
        .from('batches')
        .select('*')
        .eq('batch_number', batchNumber)
        .eq('is_published', true)
        .single()

      if (!batchData) { router.replace('/dashboard'); return }
      setBatch(batchData)
      setLoading(false)
    }
    load()
  }, [batchNumber, router])

  if (loading) return null
  if (!batch) return null

  const weekNumber = Math.ceil(batch.batch_number / 2)

  return (
    <>
      <nav className="nav">
        <Link href="/dashboard" className="nav-back">{t.back}</Link>
        <span className="nav-logo"><span style={{color:'#C8603A'}}>EX</span>QUILO</span>
        <div style={{ width: 32 }} />
      </nav>
      <div className="page-container">
        <div className="detail-hero">
          <p className="detail-tag">{t.batch} {batch.batch_number} · {t.week} {weekNumber}</p>
          <h1 className="detail-title">{batch.title}</h1>
          <p className="detail-desc">{batch.description}</p>
        </div>



        {batch.pdf_url && (
          <a href={batch.pdf_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            {t.openPdf}
          </a>
        )}
        <Link href="/dashboard" className="btn-secondary" style={{ display: 'block', textAlign: 'center' }}>
          {t.back}
        </Link>
      </div>
    </>
  )
}
