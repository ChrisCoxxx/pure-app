'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'chris.cdr@gmail.com' // Change this to your email

type Batch = { id: string; batch_number: number; title: string; description: string; pdf_url: string; is_published: boolean }
type Member = { id: string; email: string; is_active: boolean; start_date: string }

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'batches' | 'members'>('batches')
  const [batches, setBatches] = useState<Batch[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Batch form
  const [bNum, setBNum] = useState('')
  const [bTitle, setBTitle] = useState('')
  const [bDesc, setBDesc] = useState('')
  const [bPdf, setBPdf] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  // Member form
  const [mEmail, setMEmail] = useState('')
  const [mStart, setMStart] = useState('')
  const [mActive, setMActive] = useState(true)
  const [editMemberId, setEditMemberId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      if (session.user.email !== ADMIN_EMAIL) { router.replace('/dashboard'); return }
      await fetchAll(supabase)
      setLoading(false)
    }
    load()
  }, [router])

  async function fetchAll(supabase: ReturnType<typeof createClient>) {
    const { data: b } = await supabase.from('batches').select('*').order('batch_number')
    setBatches(b || [])
    const { data: m } = await supabase.from('profiles').select('*').order('created_at')
    setMembers(m || [])
  }

  function flash(text: string) {
    setMsg(text)
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveBatch() {
    if (!bNum || !bTitle) { flash('❌ Numéro et titre requis.'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = { batch_number: parseInt(bNum), title: bTitle, description: bDesc, pdf_url: bPdf, is_published: true }
    if (editId) {
      await supabase.from('batches').update(payload).eq('id', editId)
      flash('✅ Batch mis à jour !')
    } else {
      await supabase.from('batches').insert(payload)
      flash('✅ Batch ajouté !')
    }
    setBNum(''); setBTitle(''); setBDesc(''); setBPdf(''); setEditId(null)
    await fetchAll(supabase)
    setSaving(false)
  }

  async function deleteBatch(id: string) {
    if (!confirm('Supprimer ce batch ?')) return
    const supabase = createClient()
    await supabase.from('batches').delete().eq('id', id)
    await fetchAll(supabase)
    flash('🗑️ Batch supprimé.')
  }

  function editBatch(b: Batch) {
    setBNum(String(b.batch_number)); setBTitle(b.title)
    setBDesc(b.description || ''); setBPdf(b.pdf_url || '')
    setEditId(b.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveMember() {
    if (!mStart) { flash('❌ Date de démarrage requise.'); return }
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ is_active: mActive, start_date: mStart }).eq('id', editMemberId)
    flash('✅ Membre mis à jour !')
    setEditMemberId(null); setMEmail(''); setMStart('')
    await fetchAll(supabase)
    setSaving(false)
  }

  function editMember(m: Member) {
    setEditMemberId(m.id); setMEmail(m.email)
    setMStart(m.start_date || ''); setMActive(m.is_active)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Chargement...</div>

  return (
    <>
      <nav className="nav">
        <span className="nav-logo">PURE — Admin</span>
        <Link href="/dashboard" className="nav-back" style={{ fontSize: '13px' }}>← App</Link>
      </nav>

      <div className="page-container">
        {msg && <div style={{ background: '#f0faf5', border: '0.5px solid #1D9E75', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px', fontSize: '14px', color: '#0F6E56' }}>{msg}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button className={`lang-btn ${tab === 'batches' ? 'active' : ''}`} style={{ padding: '8px 18px', fontSize: '14px' }} onClick={() => setTab('batches')}>Batchs ({batches.length})</button>
          <button className={`lang-btn ${tab === 'members' ? 'active' : ''}`} style={{ padding: '8px 18px', fontSize: '14px' }} onClick={() => setTab('members')}>Membres ({members.length})</button>
        </div>

        {/* BATCHES TAB */}
        {tab === 'batches' && (
          <>
            <p className="section-label" style={{ marginTop: 0 }}>{editId ? 'Modifier le batch' : 'Ajouter un batch'}</p>
            <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>N°</label>
                  <input type="number" min="1" max="24" value={bNum} onChange={e => setBNum(e.target.value)} placeholder="1" />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Titre</label>
                  <input type="text" value={bTitle} onChange={e => setBTitle(e.target.value)} placeholder="Nom du batch" />
                </div>
              </div>
              <div className="field">
                <label>Description (optionnel)</label>
                <input type="text" value={bDesc} onChange={e => setBDesc(e.target.value)} placeholder="Courte description..." />
              </div>
              <div className="field">
                <label>Lien PDF</label>
                <input type="text" value={bPdf} onChange={e => setBPdf(e.target.value)} placeholder="https://drive.google.com/..." />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ marginTop: 0 }} onClick={saveBatch} disabled={saving}>
                  {saving ? '...' : editId ? 'Mettre à jour' : 'Ajouter le batch'}
                </button>
                {editId && <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => { setEditId(null); setBNum(''); setBTitle(''); setBDesc(''); setBPdf('') }}>Annuler</button>}
              </div>
            </div>

            <p className="section-label">Batchs existants ({batches.length}/24)</p>
            {batches.length === 0 && <p className="empty-state">Aucun batch ajouté.</p>}
            {batches.map(b => (
              <div key={b.id} style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p className="batch-number">BATCH {b.batch_number}</p>
                  <p className="batch-title">{b.title}</p>
                  {b.pdf_url && <p style={{ fontSize: '12px', color: 'var(--color-green-text)', marginTop: '2px' }}>✓ PDF</p>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="lang-btn" onClick={() => editBatch(b)}>Modifier</button>
                  <button className="lang-btn" style={{ color: '#c0392b' }} onClick={() => deleteBatch(b.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <>
            {editMemberId && (
              <>
                <p className="section-label" style={{ marginTop: 0 }}>Modifier le membre</p>
                <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>{mEmail}</p>
                  <div className="field">
                    <label>Date de démarrage</label>
                    <input type="date" value={mStart} onChange={e => setMStart(e.target.value)} />
                  </div>
                  <div className="account-row" style={{ marginBottom: '16px' }}>
                    <span className="account-label">Compte actif</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={mActive} onChange={e => setMActive(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      <span style={{ fontSize: '14px' }}>{mActive ? 'Actif' : 'Inactif'}</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" style={{ marginTop: 0 }} onClick={saveMember} disabled={saving}>{saving ? '...' : 'Enregistrer'}</button>
                    <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => setEditMemberId(null)}>Annuler</button>
                  </div>
                </div>
              </>
            )}

            <p className="section-label" style={{ marginTop: 0 }}>Membres ({members.length})</p>
            {members.length === 0 && <p className="empty-state">Aucun membre.</p>}
            {members.map(m => (
              <div key={m.id} style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p className="batch-title">{m.email}</p>
                  <p style={{ fontSize: '12px', marginTop: '3px', color: m.is_active ? 'var(--color-green-text)' : 'var(--color-text-tertiary)' }}>
                    {m.is_active ? '● Actif' : '○ Inactif'}
                    {m.start_date && ` · Démarrage : ${new Date(m.start_date).toLocaleDateString('fr-BE')}`}
                  </p>
                </div>
                <button className="lang-btn" onClick={() => editMember(m)}>Modifier</button>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}
