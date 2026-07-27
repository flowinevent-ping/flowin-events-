'use client'

/**
 * Dashboard Pro — Tracking liens & QR.
 * Reutilise les fonctions eprouvees du SA (fetchTrackQr / libelleSource, lib/nds) : aucune regression.
 * Sources d'acquisition reelles (RPC super_event_track_qr).
 */
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { fetchTrackQr, libelleSource, type TrackQr } from '@/lib/nds'

export default function ProTrackingPage() {
  const [t, setT] = useState<TrackQr | null>(null)
  const [charge, setCharge] = useState(true)

  useEffect(() => {
    fetchTrackQr().then(setT).finally(() => setCharge(false))
  }, [])

  const origines = (t?.origines ?? []).slice().sort((a, b) => b.visiteurs - a.visiteurs)
  const max = Math.max(1, ...origines.map(o => o.visiteurs))
  const totalVis = t?.total_visiteurs ?? origines.reduce((s, o) => s + o.visiteurs, 0)
  const direct = origines.find(o => o.source === 'direct')?.visiteurs ?? 0
  const reseaux = origines.filter(o => o.source.startsWith('reseaux')).length

  const card: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 16, padding: 16, marginBottom: 14 }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Tracking liens & QR" subtitle="D'où viennent vos joueurs — sources d'acquisition réelles" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900, color: 'var(--sa-accent,#7C2D92)' }}>{charge ? '…' : totalVis}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>visiteurs uniques</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{charge ? '…' : direct}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>accès direct (QR / lien)</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{charge ? '…' : reseaux}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>canaux partenaires</div></div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sa-muted,#64748B)', marginBottom: 4 }}>D&apos;où viennent vos joueurs (par source)</div>
          <div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)', marginBottom: 16 }}>Chaque QR / lien porte sa source — vous voyez ce qui convertit.</div>
          {charge ? <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div> : origines.length === 0 ? <div className="sa-muted" style={{ fontSize: 13 }}>Aucune donnée de trafic.</div> : (
            <div>
              {origines.map((o, i) => (
                <div key={o.source} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11, fontSize: 13 }}>
                  <span style={{ flex: 1, fontWeight: i === 0 ? 800 : 600, color: i === 0 ? 'var(--sa-accent,#7C2D92)' : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{libelleSource(o.source)}</span>
                  <span style={{ width: 120, height: 8, borderRadius: 99, background: 'var(--sa-border,#E2E8F0)', overflow: 'hidden', flex: 'none' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.max(3, Math.round(o.visiteurs / max * 100))}%`, background: 'linear-gradient(90deg,var(--sa-accent-light,#A855F7),var(--sa-accent,#7C2D92))', borderRadius: 99 }} />
                  </span>
                  <span style={{ fontWeight: 800, minWidth: 40, textAlign: 'right' }}>{o.visiteurs}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...card, background: 'var(--sa-subtle,#F8FAFC)', fontSize: 12.5, color: 'var(--sa-muted,#64748B)', lineHeight: 1.6 }}>
          Le comptage des clics <b>par lien digital</b> (bio / reel / QR vitrine / permanent) arrive avec la prochaine couche de tracking — les sources ci-dessus sont déjà mesurées en base.
        </div>
      </div>
    </div>
  )
}
