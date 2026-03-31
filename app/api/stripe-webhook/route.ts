import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email

    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // User exists — just activate them
      await supabaseAdmin.from('profiles').update({
        is_active: true,
        start_date: today,
      }).eq('id', existingUser.id)
    } else {
      // Create new user with random password (they'll reset it)
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      })

      if (newUser?.user) {
        await supabaseAdmin.from('profiles').update({
          is_active: true,
          start_date: today,
        }).eq('id', newUser.user.id)

        // Send password reset so they can set their own password
        await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email,
          options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/set-password` }
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
