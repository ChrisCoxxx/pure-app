import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EXQUILO',
  description: 'Ton programme nutrition — ancré dans le quotidien et la bienveillance.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
