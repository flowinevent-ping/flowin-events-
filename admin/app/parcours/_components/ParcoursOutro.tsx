'use client'

export default function ParcoursOutro({ superEventId }: { superEventId?: string | null }) {
  if (!superEventId) return null
  return (
    <div style={{ position: 'relative', zIndex: 10, width: '88%', maxWidth: 360, margin: '16px auto 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <a href="/moi" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#fff', color: '#0B6E50', fontWeight: 900, borderRadius: 100, padding: '14px 0', letterSpacing: 0.3 }}>
        🎁 Mon compte &amp; mes gains
      </a>
      <a href={`/se/${superEventId}`} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: 'transparent', border: '1px solid rgba(255,255,255,.3)', color: 'rgba(255,255,255,.85)', fontWeight: 700, borderRadius: 100, padding: '12px 0' }}>
        🗺️ Retour à l&apos;opération
      </a>
    </div>
  )
}
