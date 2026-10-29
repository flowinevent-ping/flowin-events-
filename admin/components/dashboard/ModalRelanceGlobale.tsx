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
 *
 * FILE D'ENVOI (Romain, 21/10) : « pas le faire un à un [...] qu'est-ce qui
 * pourrait simplifier le process ». Chaque email reste un clic Gmail
 * individuel -- un navigateur bloque les popups ouverts en boucle par un
 * seul clic, impossible d'ouvrir 47 onglets Gmail d'un coup. Mais on peut
 * retirer la friction de CHERCHER chaque ligne : « Tout relancer » bâtit une
 * file, et un seul gros bouton, toujours au même endroit, envoie puis avance
 * tout seul au suivant -- cliquer, cliquer, cliquer, au lieu de scroller et
 * chercher à chaque fois.
 */
import { useMemo, useState } from 'react'
import type { GagnantRow } from '@/lib/dashboard'
import type { FlowinPartenaire } from '@/lib/types'
import type { SuperEvent } from '@/lib/nds'
import { mailPartenaireRelanceUrl } from '@/lib/nds'
import { marquerRelance } from '@/lib/operations'
import { Ico } from '@/lib/proicons'

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
  /* Initialise depuis relance_envoyee_at (base) -- pas seulement « coché dans
     cette session » : rouvrir la boîte de dialogue, ou revenir demain,
     montre encore qui a deja ete relance. Un nouveau clic reste possible
     (« Relancer à nouveau »), setRelances l actualise alors a la date du jour. */
  const [relances, setRelances] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    gagnants.forEach(g => { if (g.relance_envoyee_at) init[g.id] = true })
    return init
  })
  const [prosInformes, setProsInformes] = useState<Record<string, boolean>>({})
  /** File d'envoi en cours -- ids des gagnants restant a relancer, dans l
   *  ordre d affichage. null = pas de file active. */
  const [file, setFile] = useState<string[] | null>(null)
  /** Selection manuelle (Romain, 21/10 : « pouvoir sélectionner avec un
   *  bouton l'envoi multiple ») -- un, deux, trois ou tous, au choix, en plus
   *  des raccourcis « Tout relancer » / « Relancer ce pro ». */
  const [selection, setSelection] = useState<Record<string, boolean>>({})

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
    marquerRelance(Number(g.id))
    setRelances(r => ({ ...r, [g.id]: true }))
  }

  function demarrerFile(ids: string[]) {
    const restants = ids.filter(id => !relances[id])
    setFile(restants.length ? restants : null)
  }

  const idEnCours = useMemo(() => file?.find(id => !relances[id]) ?? null, [file, relances])
  const gagnantEnCours = useMemo(() => (idEnCours ? gagnants.find(g => g.id === idEnCours) ?? null : null), [idEnCours, gagnants])
  const resteDansFile = useMemo(() => (file ? file.filter(id => !relances[id]).length : 0), [file, relances])

  function relancerEtAvancer(g: GagnantRow) {
    relancer(g)
    const suite = (file ?? []).filter(id => id !== g.id && !relances[id])
    setFile(suite.length ? suite : null)
  }

  const idsNonRelances = useMemo(() => gagnants.filter(g => !relances[g.id]).map(g => g.id), [gagnants, relances])
  const idsSelectionnes = useMemo(() => idsNonRelances.filter(id => selection[id]), [idsNonRelances, selection])
  function basculerSelection(id: string) {
    setSelection(s => ({ ...s, [id]: !s[id] }))
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
            <div style={{ fontWeight: 800, fontSize: 16 }}><Ico k="bell" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Relancer les gagnants non retirés</div>
            <div style={{ fontSize: 12, color: MUT }}>
              {gagnants.length} gagnant{gagnants.length > 1 ? 's' : ''} confirmé{gagnants.length > 1 ? 's' : ''}, lot pas encore récupéré, chez {groupes.length} pro{groupes.length > 1 ? 's' : ''}
              {totalRelances > 0 ? ` · ${totalRelances} déjà relancé${totalRelances > 1 ? 's' : ''} dans cette session` : ''}
            </div>
          </div>
          {!idEnCours && idsSelectionnes.length > 0 && (
            <button style={btnPrimaire} onClick={() => demarrerFile(idsSelectionnes)}>
              <Ico k="bell" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Envoyer la sélection ({idsSelectionnes.length})
            </button>
          )}
          {!idEnCours && idsSelectionnes.length === 0 && idsNonRelances.length > 1 && (
            <button style={btnPrimaire} onClick={() => demarrerFile(idsNonRelances)}>
              <Ico k="bell" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Tout relancer ({idsNonRelances.length})
            </button>
          )}
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: MUT, lineHeight: 1 }}>✕</button>
        </div>

        {!idEnCours && idsNonRelances.length > 1 && (
          <div style={{ padding: '8px 20px 0', fontSize: 12 }}>
            <button
              style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12 }}
              onClick={() => setSelection(idsSelectionnes.length === idsNonRelances.length ? {} : Object.fromEntries(idsNonRelances.map(id => [id, true])))}
            >
              {idsSelectionnes.length === idsNonRelances.length ? 'Tout désélectionner' : `Tout sélectionner (${idsNonRelances.length})`}
            </button>
          </div>
        )}

        {/* File d'envoi active : un seul bouton, toujours au meme endroit,
            envoie puis avance seul -- enchainer sans chercher la ligne suivante. */}
        {gagnantEnCours && (
          <div style={{ position: 'sticky', top: 73, zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: '#EFF6FF', borderBottom: `1px solid ${BRD}`, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '.04em' }}>Envoi en cours · reste {resteDansFile}</div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{gagnantEnCours.joueur_nom ?? '—'} <span style={{ fontWeight: 500, color: MUT }}>— {gagnantEnCours.lot_nom ?? 'Lot'}</span></div>
            </div>
            <button style={btnPrimaire} onClick={() => relancerEtAvancer(gagnantEnCours)}><Ico k="mail" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Envoyer et passer au suivant</button>
            <button style={btn} onClick={() => setFile(null)}>Arrêter la file</button>
          </div>
        )}

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
                  {!idEnCours && faites < liste.length && (
                    <button style={btn} onClick={() => demarrerFile(liste.map(g => g.id))}><Ico k="bell" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Relancer ce pro ({liste.length - faites})</button>
                  )}
                  {informe ? (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#15803D' }}>✓ Pro informé</span>
                  ) : (
                    <button
                      style={faites > 0 ? btnOk : btn} disabled={faites === 0 || !pro}
                      title={!pro ? 'Pas de fiche commerce rattachée' : faites === 0 ? 'Relancez au moins un gagnant avant d’informer le pro' : undefined}
                      onClick={() => informerPro(partenaireId, liste)}
                    >
                      <Ico k="mail" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Informer {pro?.nom ?? 'le pro'}
                    </button>
                  )}
                </div>
                {liste.map(g => {
                  const faite = !!relances[g.id]
                  return (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: `1px solid ${BRD}`, flexWrap: 'wrap', opacity: faite ? 0.65 : 1 }}>
                      {!faite && (
                        <input type="checkbox" checked={!!selection[g.id]} onChange={() => basculerSelection(g.id)}
                          style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{g.joueur_nom ?? '—'}</div>
                        <div style={{ fontSize: 11, color: MUT }}>{g.lot_nom ?? 'Lot'}{g.lot_valeur != null ? ` · ${g.lot_valeur} €` : ''}</div>
                      </div>
                      <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11.5, fontWeight: 700, color: '#2563EB' }}>{g.ticket_code ?? '—'}</span>
                      {faite ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>✓ Relancé</span>
                      ) : (
                        <button style={btnPrimaire} onClick={() => relancer(g)}><Ico k="bell" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Relancer</button>
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
