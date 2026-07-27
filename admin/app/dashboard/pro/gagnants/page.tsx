'use client'

/**
 * Dashboard Pro — Gagnants & tirage.
 * Reporte l'outil de tirage EXISTANT et cable (admin/public/tirage-nds.html) dans l'espace Pro.
 * Meme outil = memes regles (tirage, e-mails via send-ticket-gagnant, billet, remise en jeu,
 * annulation, retablir) = AUCUNE REGRESSION. Les gagnants reels sont dans la table `tirages`.
 */
const TOOL = '/tirage-nds.html'

export default function ProGagnantsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 16px', borderBottom: '1px solid var(--sa-border,#E2E8F0)', background: 'var(--sa-card,#fff)' }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Gagnants &amp; tirage — NDS 2026</div>
        <span style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>Outil de tirage câblé (tirages réels · e-mails · billets · remise en jeu)</span>
        <a href={TOOL} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--sa-accent,#7C2D92)', textDecoration: 'none' }}>Ouvrir en plein écran ↗</a>
      </div>
      <iframe src={TOOL} title="Tirage NDS 2026" style={{ border: 'none', width: '100%', height: 'calc(100dvh - 120px)', minHeight: 1200, background: 'var(--sa-bg,#F1F5F9)' }} />
    </div>
  )
}
