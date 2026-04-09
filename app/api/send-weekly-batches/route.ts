import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import WeeklyBatchesEmail from '@/emails/WeeklyBatchesEmail'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()

  const { data: members, error: membersError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, start_date')
    .eq('is_active', true)
    .not('start_date', 'is', null)
    .not('email', 'is', null)

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  const { data: batches, error: batchesError } = await supabaseAdmin
    .from('batches')
    .select('batch_number, title, univers')
    .eq('is_published', true)
    .order('batch_number')

  if (batchesError) {
    return NextResponse.json({ error: batchesError.message }, { status: 500 })
  }

  const results: { email: string; status: string }[] = []

  for (const member of members ?? []) {
    const start = new Date(member.start_date)
    const diffMs = today.getTime() - start.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Send on unlock days: day 7, 14, 21... (not day 0 — that's the start day)
    if (diffDays <= 0 || diffDays % 7 !== 0) continue

    const weeksElapsed = Math.floor(diffDays / 7)
    const newMax = (weeksElapsed + 1) * 2
    const batch1Num = newMax - 1
    const batch2Num = newMax

    const batch1Data = batches?.find(b => b.batch_number === batch1Num)
    const batch2Data = batches?.find(b => b.batch_number === batch2Num)

    if (!batch1Data || !batch2Data) continue

    const firstName = member.first_name || ''
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`
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
          batch1: { title: batch1Data.title, univers: batch1Data.univers ?? '', number: batch1Num },
          batch2: { title: batch2Data.title, univers: batch2Data.univers ?? '', number: batch2Num },
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
