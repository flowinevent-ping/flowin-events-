import type { Metadata, Viewport } from 'next'

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
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#D4537E',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
      </head>
      <body style={{ margin: 0, padding: 0, WebkitFontSmoothing: 'antialiased' }}>
        {children}
      </body>
    </html>
  )
}
