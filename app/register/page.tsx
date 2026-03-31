'use client'
import { useState } from 'react'
import Link from 'next/link'

const STRIPE_LINK = 'https://buy.stripe.com/eVqcN6e4hd292AT5rx0gw01'

export default function RegisterPage() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')

  const t = {
    fr: {
      title: 'Rejoindre PURE',
      subtitle: 'Accédez à votre programme structuré de 12 semaines.',
      feature1: '24 batchs de repas sur 12 semaines',
      feature2: 'Progression automatique et guidée',
      feature3: 'Accès immédiat après paiement',
      cta: 'S\'abonner maintenant',
      login: 'Déjà membre ? Se connecter',
      price: 'Paiement sécurisé via Stripe',
    },
    en: {
      title: 'Join PURE',
      subtitle: 'Access your structured 12-week program.',
      feature1: '24 meal batches over 12 weeks',
      feature2: 'Automatic guided progression',
      feature3: 'Immediate access after payment',
      cta: 'Subscribe now',
      login: 'Already a member? Sign in',
      price: 'Secure payment via Stripe',
    },
  }[lang]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '26px', fontWeight: 500, letterSpacing: '0.14em' }}>PURE</span>
          <div className="lang-toggle">
            <button className={`lang-btn ${lang === 'fr' ? 'active' : ''}`} onClick={() => setLang('fr')}>FR</button>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>

        <h1 style={{ fontSize: '22px', fontWeight: 500, marginBottom: '8px' }}>{t.title}</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: '1.6' }}>{t.subtitle}</p>

        <div style={{ background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '28px', border: '0.5px solid var(--color-border)' }}>
          {[t.feature1, t.feature2, t.feature3].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 2 ? '0.5px solid var(--color-border)' : 'none' }}>
              <span style={{ color: '#1D9E75', fontSize: '14px', fontWeight: 500 }}>✓</span>
              <span style={{ fontSize: '14px' }}>{f}</span>
            </div>
          ))}
        </div>

        <a href={STRIPE_LINK} className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          {t.cta}
        </a>

        <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: '10px' }}>
          🔒 {t.price}
        </p>

        <p style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/login" style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>{t.login}</Link>
        </p>
      </div>
    </div>
  )
}
