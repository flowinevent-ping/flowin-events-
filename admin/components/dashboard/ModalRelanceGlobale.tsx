'use client'

/**
 * RELANCE GROUPÉE — Romain (21/10) : « relancer la totalité des participants
 * qui n'ont pas utilisé leur lot [...] simplifier la validation de l'envoi
 * [...] dans notre boîte à dialogue [...] rattaché à l'application ».
 *
 * Avant : la relance se faisait gagnant par gagnant, dispersée entre
 * l'onglet "Gagnants & billets" de chaque fiche pro et /dashboard/nds-lots.
 * Ici, TOUS les gagnants confirmés-non-retirés, toutes opérations et tous
 * pros confondus, en un seul endroit : on valide (coche visuellement au fur
 * et à mesure) puis on envoie, pro par pro -- chaque envoi reste un clic
 * Gmail individuel (aucun serveur d'envoi dans l'appli), mais la liste à
 * traiter est désormais unique au lieu d'être éclatée.
 *
 * Après avoir relancé les gagnants d'un pro, un bouton dédié informe CE pro
 * (un seul email, qui liste tous les gagnants relancés chez lui) -- texte
 * approuvé par Romain le 21/10, voir mailPartenaireRelanceUrl (lib/nds.ts).
 */
import { useMemo, useState } from 'react'
import type { GagnantRow } from '@/lib/dashboard'
import type { FlowinPartenaire } from '@/lib/types'
import type { SuperEvent } from '@/lib/nds'
import { mailPartenaireRelanceUrl } from '@/lib/nds'

const CARDBG = 'var(--sa-card, #FFFFFF)'
const BRD = 'var(--sa-border, #E2E8F0)'
const MUT = 'var(--sa-muted, #64748B)'
const SUBT = 'var(--sa-subtle, #F8FAFC)'

const btn: React.CSSProperties = {
  background: CARDBG, border: `1.5px solid ${BRD}`, borderRadius: 9, padding: '6px 11px',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'inherit',
  display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
}
const btnOk: React.CSSProperties = { ...btn, background: 'rgba(34,197,94,.1)', borderColor: 'rgba(34,197,94,.3)', color: '#15803D' }
const btnPrimaire: React.CSSProperties = { ...btn, background: '#2563EB', borderColor: '#2563EB', color: '#fff' }

export default function ModalRelanceGlobale({ gagnants, partenaires, supers, onClose }: {
  /** Déjà filtrés par l'appelant : confirmés, pas encore retirés. */
  gagnants: GagnantRow[]
  partenaires: FlowinPartenaire[]
  supers: SuperEvent[]
  onClose: () => void
}) {
  const [relances, setRelances] = useState<Record<string, boolean>>({})
  const [prosInformes, setProsInformes] = useState<Record<string, boolean>>({})

  const groupes = useMemo(() => {
    const parPro = new Map<string, GagnantRow[]>()
    gagnants.forEach(g => {
      const cle = g.partenaire_id ?? '_sans_pro'
      if (!parPro.has(cle)) parPro.set(cle, [])
      parPro.get(cle)!.push(g)
    })
    return Array.from(parPro.entries())
      .map(([partenaireId, liste]) => ({
        partenaireId, liste,
        pro: partenaires.find(p => p.id === partenaireId) ?? null,
      }))
      .sort((a, b) => (a.pro?.nom ?? '').localeCompare(b.pro?.nom ?? '', 'fr'))
  }, [gagnants, partenaires])

  const totalRelances = Object.values(relances).filter(Boolean).length

  function relancer(g: GagnantRow) {
    const p = partenaires.find(x => x.id === g.partenaire_id)
    const url = window.flowinMailGagnant?.gmailUrl({
      joueur_nom: g.joueur_nom, email: g.joueur_email, lot_nom: g.lot_nom,
      ticket_code: g.ticket_code, retrait_token: g.retrait_token,
      partenaire_nom: p?.nom, partenaire_adresse: p?.adresse, partenaire_tel: p?.tel,
      type: 'relance',
    })
    if (url) window.open(url, '_blank', 'noopener')
    setRelances(r => ({ ...r, [g.id]: true }))
  }

  function informerPro(partenaireId: string, liste: GagnantRow[]) {
    const p = partenaires.find(x => x.id === partenaireId)
    const relancesDuGroupe = liste.filter(g => relances[g.id])
    if (relancesDuGroupe.length === 0) return
    const operation = relancesDuGroupe[0].super_event_id
      ? { id: relancesDuGroupe[0].super_event_id, nom: supers.find(s => s.id === relancesDuGroupe[0].super_event_id)?.nom ?? null }
      : null
    const url = mailPartenaireRelanceUrl(relancesDuGroupe, p?.nom ?? '', p?.email ?? null, operation)
    window.open(url, '_blank', 'noopener')
    setProsInformes(x => ({ ...x, [partenaireId]: true }))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: CARDBG, borderRadius: 16, width: '100%', maxWidth: 880, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${BRD}`, position: 'sticky', top: 0, background: CARDBG, zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>🔔 Relancer les gagnants non retirés</div>
            <div style={{ fontSize: 12, color: MUT }}>
              {gagnants.length} gagnant{gagnants.length > 1 ? 's' : ''} confirmé{gagnants.length > 1 ? 's' : ''}, lot pas encore récupéré, chez {groupes.length} pro{groupes.length > 1 ? 's' : ''}
              {totalRelances > 0 ? ` · ${totalRelances} déjà relancé${totalRelances > 1 ? 's' : ''} dans cette session` : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: MUT, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {gagnants.length === 0 && (
            <div style={{ fontSize: 13, color: MUT, padding: '12px 0' }}>Aucun gagnant confirmé en attente de retrait — rien à relancer.</div>
          )}

          {groupes.map(({ partenaireId, liste, pro }) => {
            const faites = liste.filter(g => relances[g.id]).length
            const informe = !!prosInformes[partenaireId]
            return (
              <div key={partenaireId} style={{ border: `1px solid ${BRD}`, borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: SUBT, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 160, fontWeight: 800, fontSize: 13.5 }}>
                    {pro?.nom ?? 'Sans commerce rattaché'}
                    <span style={{ fontWeight: 700, fontSize: 11.5, color: MUT, marginLeft: 6 }}>{faites}/{liste.length} relancé{liste.length > 1 ? 's' : ''}</span>
                  </div>
                  {informe ? (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#15803D' }}>✓ Pro informé</span>
                  ) : (
                    <button
                      style={faites > 0 ? btnOk : btn} disabled={faites === 0 || !pro}
                      title={!pro ? 'Pas de fiche commerce rattachée' : faites === 0 ? 'Relancez au moins un gagnant avant d’informer le pro' : undefined}
                      onClick={() => informerPro(partenaireId, liste)}
                    >
                      ✉️ Informer {pro?.nom ?? 'le pro'}
                    </button>
                  )}
                </div>
                {liste.map(g => {
                  const faite = !!relances[g.id]
                  return (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: `1px solid ${BRD}`, flexWrap: 'wrap', opacity: faite ? 0.65 : 1 }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{g.joueur_nom ?? '—'}</div>
                        <div style={{ fontSize: 11, color: MUT }}>{g.lot_nom ?? 'Lot'}{g.lot_valeur != null ? ` · ${g.lot_valeur} €` : ''}</div>
                      </div>
                      <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11.5, fontWeight: 700, color: '#2563EB' }}>{g.ticket_code ?? '—'}</span>
                      {faite ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>✓ Relancé</span>
                      ) : (
                        <button style={btnPrimaire} onClick={() => relancer(g)}>🔔 Relancer</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
