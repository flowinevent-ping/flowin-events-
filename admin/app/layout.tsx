import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Flowin', template: '%s | Flowin' },
  description: 'Participez et tentez de gagner !',
  openGraph: {
    title: 'Flowin — Jeu & Tombola',
    description: 'Participez et tentez de gagner !',
    type: 'website',
    images: [{ url: 'https://flowin-events.vercel.app/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
  themeColor: '#D4537E',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
      </head>
      <body style={{ margin:0, padding:0, WebkitFontSmoothing:'antialiased' }}>{children}</body>
    </html>
  )
}
