import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import WeeklyBatchesEmail from '@/emails/WeeklyBatchesEmail'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

const ADMIN_EMAIL = 'chris.cdr@gmail.com'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  // Accepte soit le CRON_SECRET (Vercel cron) soit un access_token admin
  const isCron = token === process.env.CRON_SECRET
  let isAdmin = false
  if (!isCron && token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    isAdmin = user?.email === ADMIN_EMAIL
  }
  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const forceTest = req.headers.get('x-force-test') === '1'
  const today = new Date()

  const { data: batches, error: batchesError } = await supabaseAdmin
    .from('batches')
    .select('batch_number, title, univers')
    .eq('is_published', true)
    .order('batch_number')

  if (batchesError) {
    return NextResponse.json({ error: `Batches DB error: ${batchesError.message}` }, { status: 500 })
  }

  if (!batches || batches.length < 2) {
    return NextResponse.json({ error: 'Moins de 2 batches publiés en base — impossible d\'envoyer.' }, { status: 400 })
  }

  // Mode test : envoie uniquement à l'admin avec les 2 premiers batches publiés
  if (forceTest) {
    const batch1Data = batches[0]
    const batch2Data = batches[1]
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.exquilo.com'}/dashboard`
    try {
      await resend.emails.send({
        from: 'EXQUILO <hello@exquilo.com>',
        to: ADMIN_EMAIL,
        subject: `[TEST] Vos 2 nouveaux batches sont prêts 🍳`,
        react: WeeklyBatchesEmail({
          firstName: 'Christophe',
          batch1: { title: batch1Data.title, univers: batch1Data.univers ?? '', number: batch1Data.batch_number },
          batch2: { title: batch2Data.title, univers: batch2Data.univers ?? '', number: batch2Data.batch_number },
          dashboardUrl,
        }),
      })
      return NextResponse.json({ processed: 1, results: [{ email: ADMIN_EMAIL, status: 'sent' }] })
    } catch (err) {
      return NextResponse.json({ error: `Resend error: ${String(err)}` }, { status: 500 })
    }
  }

  // Mode cron normal : tous les membres actifs dont c'est le jour de déblocage
  const { data: members, error: membersError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, start_date')
    .eq('is_active', true)
    .not('start_date', 'is', null)
    .not('email', 'is', null)

  if (membersError) {
    return NextResponse.json({ error: `Members DB error: ${membersError.message}` }, { status: 500 })
  }

  const results: { email: string; status: string }[] = []

  for (const member of members ?? []) {
    const start = new Date(member.start_date)
    const diffMs = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays <= 0 || diffDays % 7 !== 0) continue

    const weeksElapsed = Math.floor(diffDays / 7)
    const newMax = (weeksElapsed + 1) * 2
    const batch1Data = batches.find(b => b.batch_number === newMax - 1)
    const batch2Data = batches.find(b => b.batch_number === newMax)
    if (!batch1Data || !batch2Data) continue

    const firstName = member.first_name || ''
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.exquilo.com'}/dashboard`
    const subject = firstName
      ? `${firstName}, vos 2 nouveaux batches sont prêts 🍳`
      : `Vos 2 nouveaux batches sont prêts 🍳`

    try {
      await resend.emails.send({
        from: 'EXQUILO <hello@exquilo.com>',
        to: member.email,
        subject,
        react: WeeklyBatchesEmail({
          firstName: firstName || 'vous',
          batch1: { title: batch1Data.title, univers: batch1Data.univers ?? '', number: newMax - 1 },
          batch2: { title: batch2Data.title, univers: batch2Data.univers ?? '', number: newMax },
          dashboardUrl,
        }),
      })
      results.push({ email: member.email, status: 'sent' })
    } catch (err) {
      results.push({ email: member.email, status: `error: ${String(err)}` })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
