import {
  Html, Head, Body, Container, Section,
  Text, Link, Hr, Preview,
} from '@react-email/components'
import * as React from 'react'

interface WeeklyBatchesEmailProps {
  firstName: string
  batch1: { title: string; univers: string; number: number }
  batch2: { title: string; univers: string; number: number }
  dashboardUrl: string
}

export default function WeeklyBatchesEmail({
  firstName,
  batch1,
  batch2,
  dashboardUrl,
}: WeeklyBatchesEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{firstName}, vos 2 nouveaux batches sont prêts 🍳</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={logo}>
            <span style={{ color: '#C8603A' }}>EX</span>QUILO
          </Text>

          <Hr style={hr} />

          <Text style={heading}>Bonjour {firstName},</Text>
          <Text style={paragraph}>
            Vos 2 nouveaux batches de la semaine viennent de se débloquer.
            Votre structure est prête — plus qu'à cuisiner.
          </Text>

          <Section style={batchCard}>
            <Text style={batchLabel}>Batch {batch1.number}</Text>
            <Text style={batchTitle}>{batch1.title}</Text>
            {batch1.univers ? <Text style={batchUnivers}>{batch1.univers}</Text> : null}
          </Section>

          <Section style={batchCard}>
            <Text style={batchLabel}>Batch {batch2.number}</Text>
            <Text style={batchTitle}>{batch2.title}</Text>
            {batch2.univers ? <Text style={batchUnivers}>{batch2.univers}</Text> : null}
          </Section>

          <Link href={dashboardUrl} style={ctaButton}>
            Voir mes batches →
          </Link>

          <Hr style={hr} />

          <Text style={footer}>
            EXQUILO · Ceci n'est pas un régime
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#EDE3DA', fontFamily: "'DM Sans', Arial, sans-serif" }
const container: React.CSSProperties = { maxWidth: '480px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px 28px' }
const logo: React.CSSProperties = { fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0', color: '#2C2C2A' }
const hr: React.CSSProperties = { borderColor: 'rgba(44,44,42,0.10)', margin: '20px 0' }
const heading: React.CSSProperties = { fontSize: '18px', fontWeight: 500, color: '#2C2C2A', marginBottom: '8px' }
const paragraph: React.CSSProperties = { fontSize: '14px', color: '#6B6B69', lineHeight: '1.6', marginBottom: '24px' }
const batchCard: React.CSSProperties = { backgroundColor: '#F5EDE6', borderRadius: '10px', padding: '16px 20px', marginBottom: '12px' }
const batchLabel: React.CSSProperties = { fontSize: '11px', fontWeight: 500, color: '#9E9D98', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }
const batchTitle: React.CSSProperties = { fontSize: '15px', fontWeight: 500, color: '#2C2C2A', margin: '0 0 4px' }
const batchUnivers: React.CSSProperties = { fontSize: '13px', color: '#6B6B69', margin: 0 }
const ctaButton: React.CSSProperties = { display: 'block', backgroundColor: '#C8603A', color: '#ffffff', borderRadius: '8px', padding: '14px 20px', fontSize: '15px', fontWeight: 500, textAlign: 'center', textDecoration: 'none', margin: '24px 0 0' }
const footer: React.CSSProperties = { fontSize: '12px', color: '#9E9D98', textAlign: 'center', marginTop: '20px' }
