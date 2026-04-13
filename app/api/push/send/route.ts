import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const ADMIN_EMAIL = 'chris.cdr@gmail.com'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

let vapidConfigured = false
function getWebPush() {
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )
    vapidConfigured = true
  }
  return webpush
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as {
    title: string
    body: string
    url?: string
    user_ids?: string[]
  }

  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'title et body requis' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')

  if (body.user_ids && body.user_ids.length > 0) {
    query = query.in('user_id', body.user_ids)
  }

  const { data: subscriptions, error: dbError } = await query
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, total: 0, message: 'Aucune subscription trouvée' })
  }

  const wp = getWebPush()
  const payload = JSON.stringify({
    title: body.title,
    body: body.body,
    url: body.url ?? '/dashboard',
  })

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 410) {
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
        throw err
      })
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ sent, failed, total: subscriptions.length })
}
