'use client'

import type { GainImmediat } from '@/lib/parcours'

/**
 * Fin de parcours, commune a tous les jeux.
 * Referentiel 8 : quand la regle de l event attribue un gain immediat, le
 * joueur le voit ici, avec son billet (meme billet que le tirage : lot.html,
 * valide en caisse par le code PIN du commerce).
 */
export default function ParcoursOutro({ superEventId, gain }: { superEventId?: string | null; gain?: GainImmediat | null }) {
  if (!superEventId && !gain) return null
  return (
    <div style={{ position: 'relative', zIndex: 10, width: '88%', maxWidth: 360, margin: '16px auto 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {gain && (
        <div style={{ background: '#fff', color: '#0B1F17', borderRadius: 18, padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 4 }}>🎁</div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#0B6E50' }}>Gagné tout de suite</div>
          <div style={{ fontSize: 19, fontWeight: 900, margin: '4px 0 6px' }}>{gain.lot}</div>
          {gain.conditions && <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>{gain.conditions}</div>}
          <a href={`/lot.html?t=${encodeURIComponent(gain.retraitToken)}`} style={{ display: 'block', textDecoration: 'none', background: '#0B6E50', color: '#fff', fontWeight: 900, borderRadius: 100, padding: '12px 0' }}>
            Voir mon billet
          </a>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>À présenter au commerce pour retirer votre lot.</div>
        </div>
      )}
      {superEventId && (
        <>
          <a href="/moi" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#fff', color: '#0B6E50', fontWeight: 900, borderRadius: 100, padding: '14px 0', letterSpacing: 0.3 }}>
            🎁 Mon compte &amp; mes gains
          </a>
          <a href={`/se/${superEventId}`} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: 'transparent', border: '1px solid rgba(255,255,255,.3)', color: 'rgba(255,255,255,.85)', fontWeight: 700, borderRadius: 100, padding: '12px 0' }}>
            🗺️ Retour à l&apos;opération
          </a>
        </>
      )}
    </div>
  )
}
