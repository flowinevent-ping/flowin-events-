'use client'

/**
 * Dashboard Pro — Gagnants & tirage (Super Event NDS 2026).
 * Branche sur les VRAIES tables : se_tickets (1053 tickets NDS) + lots (catalogue reel).
 * Lecture seule + surface l'action "lancer le tirage global". Le tirage lui-meme (irreversible,
 * 617 joueurs reels) N'EST PAS declenche automatiquement : il passe par la RPC de tirage verifiee
 * et la dette de retrait (tirages.retire_at / lots.retire / lots_stock.utilise) doit etre unifiee avant.
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/dashboard/DashboardUI'

type Lot = { id: string; titre: string | null; valeur_euros: number | null; quantite: number | null; assigne_a: string | null; retire: boolean | null }
const SE = 'se-nds-2026'

export default function ProGagnantsPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [tickets, setTickets] = useState<number | null>(null)
  const [charge, setCharge] = useState(true)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const { data: evs } = await supabase.from('events').select('id').eq('super_event_id', SE)
        const ids = ((evs ?? []) as { id: string }[]).map(e => e.id)
        const [l, t] = await Promise.all([
          ids.length ? supabase.from('lots').select('id,titre,valeur_euros,quantite,assigne_a,retire').in('event_id', ids) : Promise.resolve({ data: [] as Lot[] }),
          supabase.from('se_tickets').select('id', { count: 'exact', head: true }).eq('super_event_id', SE),
        ])
        setLots((l.data ?? []) as Lot[])
        setTickets((t as { count: number | null }).count ?? null)
      } finally { setCharge(false) }
    })()
  }, [])

  const unites = lots.reduce((s, l) => s + (l.quantite ?? 1), 0)
  const assignes = lots.filter(l => l.assigne_a).length
  const tirageFait = assignes > 0
  const valeurTotale = lots.reduce((s, l) => s + (l.valeur_euros ?? 0) * (l.quantite ?? 1), 0)

  const card: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 16, padding: 16, marginBottom: 14 }
  const th: React.CSSProperties = { textAlign: 'left', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--sa-muted,#64748B)', padding: '8px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)' }
  const td: React.CSSProperties = { padding: '11px 10px', borderBottom: '1px solid var(--sa-border,#E2E8F0)', fontSize: 13 }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Gagnants & tirage" subtitle="Super Event Nuits du Sud 2026 — tirage global mutualisé (données réelles)" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900, color: 'var(--sa-accent,#7C2D92)' }}>{tickets ?? '…'}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>tickets en jeu</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{unites}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>lots à distribuer</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{assignes}</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>déjà attribués</div></div>
          <div style={card}><div style={{ fontSize: 26, fontWeight: 900 }}>{valeurTotale} €</div><div style={{ fontSize: 12, color: 'var(--sa-muted,#64748B)' }}>valeur des lots</div></div>
        </div>

        {charge ? <div className="sa-muted" style={{ fontSize: 13 }}>Chargement des données réelles…</div> : (
          <div style={{ ...card, overflowX: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sa-muted,#64748B)', marginBottom: 10 }}>Catalogue des lots ({lots.length})</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
              <thead><tr><th style={th}>Lot</th><th style={th}>Valeur</th><th style={th}>Quantité</th><th style={th}>Statut</th></tr></thead>
              <tbody>
                {lots.map(l => (
                  <tr key={l.id}>
                    <td style={td}><b>{l.titre ?? '—'}</b></td>
                    <td style={td}>{l.valeur_euros != null ? `${l.valeur_euros} €` : '—'}</td>
                    <td style={td}>{l.quantite ?? 1}</td>
                    <td style={td}><span style={{ fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '3px 9px', background: l.retire ? 'rgba(34,197,94,.12)' : l.assigne_a ? 'rgba(245,158,11,.14)' : 'var(--sa-subtle,#F8FAFC)', color: l.retire ? '#15803D' : l.assigne_a ? '#B45309' : 'var(--sa-muted,#64748B)' }}>{l.retire ? 'retiré' : l.assigne_a ? 'attribué' : 'à tirer'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ ...card, border: '1px solid rgba(234,88,12,.35)', background: 'linear-gradient(135deg,rgba(255,138,20,.06),#fff)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#C2410C', marginBottom: 6 }}>🎲 Lancer le tirage global</div>
          {tirageFait ? (
            <div style={{ fontSize: 13, color: 'var(--sa-muted,#64748B)' }}>Le tirage a déjà été effectué ({assignes} lot(s) attribué(s)).</div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--sa-muted,#64748B)', lineHeight: 1.6, marginBottom: 12 }}>
                {tickets ?? '…'} tickets en jeu, {unites} lots à attribuer. Le tirage désigne les gagnants et déclenche leurs e-mails.
                C&apos;est une action <b>unique et irréversible</b> — vous la lancez vous-même après validation.
              </div>
              {!confirm ? (
                <button className="sa-btn" style={{ background: 'linear-gradient(135deg,#FF8A14,#EA580C)' }} onClick={() => setConfirm(true)}>Préparer le tirage →</button>
              ) : (
                <div style={{ border: '1px dashed rgba(234,88,12,.4)', borderRadius: 12, padding: 14, background: '#fff' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Confirmer le lancement du tirage NDS 2026 ?</div>
                  <div style={{ fontSize: 12.5, color: 'var(--sa-muted,#64748B)', lineHeight: 1.6, marginBottom: 12 }}>
                    Le déclenchement définitif passe par la fonction de tirage vérifiée (et l&apos;unification du suivi de retrait). Il n&apos;est pas armé automatiquement ici pour protéger les {tickets ?? ''} participants réels. Dites-moi « lance le tirage » et je connecte le déclencheur final.
                  </div>
                  <button className="sa-btn sm" onClick={() => setConfirm(false)}>Annuler</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
