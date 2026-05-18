import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'chris.cdr@gmail.com'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  // Vérification admin
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as string | null // 'batch' | 'courses'
  const batchNumber = formData.get('batchNumber') as string | null

  if (!file || !type || !batchNumber) {
    return NextResponse.json({ error: 'Paramètres manquants.' }, { status: 400 })
  }

  const num = parseInt(batchNumber)
  if (isNaN(num) || num < 1 || num > 24) {
    return NextResponse.json({ error: 'Numéro de batch invalide.' }, { status: 400 })
  }

  const filename = type === 'courses'
    ? `courses_batch_${num}.html`
    : `batch_${num}.html`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Upload vers Supabase Storage avec service role key
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/batches/${filename}`
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'text/html; charset=utf-8',
      'x-upsert': 'true',
    },
    body: buffer,
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Erreur Storage : ${err}` }, { status: 500 })
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/batches/${filename}`
  return NextResponse.json({ url: publicUrl, filename })
}
