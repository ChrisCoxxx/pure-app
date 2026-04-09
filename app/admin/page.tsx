'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'chris.cdr@gmail.com'

type Batch = { id: string; batch_number: number; title: string; description: string; pdf_url: string; is_published: boolean; univers: string }
type Member = { id: string; email: string; is_active: boolean; start_date: string; first_name: string }

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'batches' | 'members'>('batches')
  const [batches, setBatches] = useState<Batch[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  const [bNum, setBNum] = useState('')
  const [bTitle, setBTitle] = useState('')
  const [bDesc, setBDesc] = useState('')
  const [bPdf, setBPdf] = useState('')
  const [bUnivers, setBUnivers] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const [mFirstName, setMFirstName] = useState('')
  const [mStart, setMStart] = useState('')
  const [mActive, setMActive] = useState(true)
  const [editMemberId, setEditMemberId] = useState<string | null>(null)
  const [editMemberEmail, setEditMemberEmail] = useState('')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviting, setInviting] = useState(false)

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

  function flash(text: string, type: 'success' | 'error' = 'success') {
    setMsg(text); setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  async function handleInvite() {
    if (!inviteEmail) { flash('Entrez un email.', 'error'); return }
    setInviting(true)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail })
    })
    const data = await res.json()
    if (!res.ok) {
      flash(`Erreur : ${data.error}`, 'error')
    } else {
      if (inviteFirstName.trim()) {
        const supabase = createClient()
        const { data: member } = await supabase.from('profiles').select('id').eq('email', inviteEmail).single()
        if (member) await supabase.from('profiles').update({ first_name: inviteFirstName.trim() }).eq('id', member.id)
      }
      flash(`✅ Invitation envoyée à ${inviteEmail} !`)
      setInviteEmail('')
      setInviteFirstName('')
      const supabase = createClient()
      await fetchAll(supabase)
    }
    setInviting(false)
  }

  async function saveBatch() {
    if (!bNum || !bTitle) { flash('Numéro et titre requis.', 'error'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = { batch_number: parseInt(bNum), title: bTitle, description: bDesc, pdf_url: bPdf, univers: bUnivers, is_published: true }
    if (editId) {
      await supabase.from('batches').update(payload).eq('id', editId)
      flash('✅ Batch mis à jour !')
    } else {
      await supabase.from('batches').insert(payload)
      flash('✅ Batch ajouté !')
    }
    setBNum(''); setBTitle(''); setBDesc(''); setBPdf(''); setBUnivers(''); setEditId(null)
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
    setBDesc(b.description || ''); setBPdf(b.pdf_url || ''); setBUnivers(b.univers || '')
    setEditId(b.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveMember() {
    if (!mStart) { flash('Date de démarrage requise.', 'error'); return }
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ is_active: mActive, start_date: mStart, first_name: mFirstName }).eq('id', editMemberId)
    flash('✅ Membre mis à jour !')
    setEditMemberId(null); setEditMemberEmail(''); setMStart(''); setMFirstName('')
    await fetchAll(supabase)
    setSaving(false)
  }

  function editMember(m: Member) {
    setEditMemberId(m.id); setEditMemberEmail(m.email)
    setMStart(m.start_date || ''); setMActive(m.is_active)
    setMFirstName(m.first_name || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteMember(id: string, email: string) {
    if (!confirm(`Supprimer définitivement ${email} ?\nCette action est irréversible.`)) return
    const supabase = createClient()
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) { flash(`Erreur : ${error.message}`, 'error'); return }
    const res = await fetch('/api/delete-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id })
    })
    if (!res.ok) {
      flash('Profil supprimé mais erreur auth — supprime manuellement dans Supabase.', 'error')
    } else {
      flash(`🗑️ ${email} supprimé.`)
    }
    await fetchAll(supabase)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Chargement...</div>

  return (
    <>
      <nav className="nav">
        <span className="nav-logo"><span style={{color:'#C8603A'}}>EX</span>QUILO — Admin</span>
        <Link href="/dashboard" className="nav-back" style={{ fontSize: '13px' }}>← App</Link>
      </nav>

      <div className="page-container">
        {msg && (
          <div style={{
            background: msgType === 'success' ? '#f0faf5' : '#fdf2f2',
            border: `0.5px solid ${msgType === 'success' ? '#1D9E75' : '#e74c3c'}`,
            borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: '16px',
            fontSize: '14px', color: msgType === 'success' ? '#0F6E56' : '#c0392b'
          }}>{msg}</div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button className={`lang-btn ${tab === 'batches' ? 'active' : ''}`} style={{ padding: '8px 18px', fontSize: '14px' }} onClick={() => setTab('batches')}>Batchs ({batches.length})</button>
          <button className={`lang-btn ${tab === 'members' ? 'active' : ''}`} style={{ padding: '8px 18px', fontSize: '14px' }} onClick={() => setTab('members')}>Membres ({members.length})</button>
        </div>

        {tab === 'batches' && (
          <>
            <p className="section-label" style={{ marginTop: 0 }}>{editId ? 'Modifier le batch' : 'Ajouter un batch'}</p>
            <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>N°</label>
                  <input type="number" min="1" value={bNum} onChange={e => setBNum(e.target.value)} placeholder="1" />
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
                <label>Univers culinaires</label>
                <input type="text" value={bUnivers} onChange={e => setBUnivers(e.target.value)} placeholder="Thai · Méditerranée · Réconfort" />
              </div>
              <div className="field">
                <label>Lien PDF</label>
                <input type="text" value={bPdf} onChange={e => setBPdf(e.target.value)} placeholder="https://drive.google.com/..." />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ marginTop: 0 }} onClick={saveBatch} disabled={saving}>
                  {saving ? '...' : editId ? 'Mettre à jour' : 'Ajouter le batch'}
                </button>
                {editId && <button className="btn-secondary" style={{ marginTop: 0 }} onClick={() => { setEditId(null); setBNum(''); setBTitle(''); setBDesc(''); setBPdf(''); setBUnivers('') }}>Annuler</button>}
              </div>
            </div>

            <p className="section-label">Batchs existants ({batches.length})</p>
            {batches.length === 0 && <p className="empty-state">Aucun batch ajouté.</p>}
            {batches.map(b => (
              <div key={b.id} style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p className="batch-number">BATCH {b.batch_number}</p>
                  <p className="batch-title">{b.title}</p>
                  {b.univers && <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{b.univers}</p>}
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

        {tab === 'members' && (
          <>
            <p className="section-label" style={{ marginTop: 0 }}>Inviter un membre</p>
            <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                Le membre recevra un email pour créer son mot de passe et accéder directement au programme.
              </p>
              <div className="field">
                <label>Prénom (optionnel)</label>
                <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="Prénom du membre" />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div className="field" style={{ marginBottom: 0, flex: 1 }}>
                  <label>Email du membre</label>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    placeholder="membre@exemple.com"
                    onKeyDown={e => e.key === 'Enter' && handleInvite()} />
                </div>
                <button className="btn-primary" style={{ marginTop: 0, width: 'auto', padding: '12px 20px', whiteSpace: 'nowrap' }}
                  onClick={handleInvite} disabled={inviting}>
                  {inviting ? '...' : "Envoyer l'invitation"}
                </button>
              </div>
            </div>

            {editMemberId && (
              <>
                <p className="section-label">Modifier le membre</p>
                <div style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px' }}>{editMemberEmail}</p>
                  <div className="field">
                    <label>Prénom</label>
                    <input type="text" value={mFirstName} onChange={e => setMFirstName(e.target.value)} placeholder="Prénom du membre" />
                  </div>
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

            <p className="section-label">Membres ({members.length})</p>
            {members.length === 0 && <p className="empty-state">Aucun membre.</p>}
            {members.map(m => (
              <div key={m.id} style={{ background: 'var(--color-bg)', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p className="batch-title">{m.first_name ? `${m.first_name} — ${m.email}` : m.email}</p>
                  <p style={{ fontSize: '12px', marginTop: '3px', color: m.is_active ? 'var(--color-green-text)' : 'var(--color-text-tertiary)' }}>
                    {m.is_active ? '● Actif' : '○ Inactif'}
                    {m.start_date && ` · Démarrage : ${new Date(m.start_date).toLocaleDateString('fr-BE')}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="lang-btn" onClick={() => editMember(m)}>Modifier</button>
                  <button className="lang-btn" style={{ color: '#c0392b' }} onClick={() => deleteMember(m.id, m.email)}>Supprimer</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  )
}