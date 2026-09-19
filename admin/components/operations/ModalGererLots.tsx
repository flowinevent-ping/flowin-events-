'use client'

/**
 * MODAL "GÉRER LES LOTS" — Romain (19/09) : « un modal complet dans lequel on
 * peut voir les lots à distribuer, leur valeur, la condition d'utilisation,
 * la génération du billet, le traitement du débit et du crédit de ce qui
 * reste en stock ». À avoir dans SA ET dans Pro.
 *
 * Réunit en un seul endroit ce qui était éclaté :
 *  - définition du lot (nom/valeur/quantité) : avant, saisie UNIQUEMENT à la
 *    création (lib/wizard.ts, lib/pro.ts), plus jamais modifiable ensuite ;
 *  - conditions d'utilisation + type tirage/instantané : avant, modifiable
 *    UNIQUEMENT côté SA (ReglesDiffusion.tsx), jamais côté Pro ;
 *  - stock (débit/crédit) : deja dans ContenuLots (AjustementStock), reprisici tel quel ;
 *  - aperçu du billet type + billets déjà émis pour ce lot : n'existaient nulle
 *    part réunis (BilletApercu servait uniquement à la création).
 * Un lot vit dans `lots`, sur sa station (event_id), meme pour un super event
 * (referentiel 29) -- cf. ReglesDiffusion.tsx. Verrouille en tirage au sort
 * pour toute station de super event (regle deja en vigueur, reprise ici).
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DonneesOperation, PartenaireMin } from '@/lib/operations'
import BilletApercu from '@/components/parcours/BilletApercu'
import { ajouterStock, retirerStock } from '@/lib/stock'

const BRD = 'var(--sa-border, #E2E8F0)'
const MUT = 'var(--sa-muted, #64748B)'
const SUBT = 'var(--sa-subtle, #F8FAFC)'
const CARDBG = 'var(--sa-card, #FFFFFF)'
const ACC = 'var(--sa-accent, #2563EB)'

interface LotLigne {
  id: string; event_id: string; nom: string | null; titre: string | null
  valeur: number | null; quantite: number | null; conditions: string | null; note: string | null
}
type Regle = { mode: 'tousLesX' | 'aleatoire'; everyX: number; probabilite: number }
const estInstant = (note: string | null) => /instantan/i.test(note ?? '')

function AjustementStockLigne({ lotId, dispo, total, onAjuste }: { lotId: string; dispo: number; total: number; onAjuste: (delta: number) => void }) {
  const [n, setN] = useState('1')
  const [busy, setBusy] = useState<'ajout' | 'retrait' | null>(null)
  const [erreur, setErreur] = useState('')
  async function ajouter() {
    const q = Math.max(1, parseInt(n) || 1)
    setBusy('ajout'); setErreur('')
    const ok = await ajouterStock(lotId, q)
    setBusy(null)
    if (!ok) { setErreur("Pas de stock matérialisé pour ce lot."); return }
    onAjuste(q)
  }
  async function retirer() {
    const q = Math.max(1, parseInt(n) || 1)
    setBusy('retrait'); setErreur('')
    const fait = await retirerStock(lotId, q)
    setBusy(null)
    if (!fait) { setErreur('Aucune unité disponible.'); return }
    onAjuste(-fait)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: dispo > 0 ? '#15803D' : '#B45309', background: dispo > 0 ? 'rgba(34,197,94,.1)' : 'rgba(245,158,11,.13)', borderRadius: 99, padding: '3px 9px' }}>
        stock {dispo} / {total}
      </span>
      <input type="number" min={1} value={n} onChange={e => setN(e.target.value)} style={{ width: 48, border: `1px solid ${BRD}`, borderRadius: 8, padding: '4px 6px', fontSize: 12 }} />
      <button style={{ border: `1px solid ${BRD}`, background: '#fff', borderRadius: 8, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }} disabled={busy !== null} onClick={ajouter}>{busy === 'ajout' ? '…' : '+ Réappro'}</button>
      <button style={{ border: `1px solid ${BRD}`, background: '#fff', borderRadius: 8, padding: '4px 9px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }} disabled={busy !== null} onClick={retirer}>{busy === 'retrait' ? '…' : '− Retirer'}</button>
      {erreur && <span style={{ fontSize: 10.5, color: '#B45309' }}>{erreur}</span>}
    </div>
  )
}

export default function ModalGererLots({ op, partenaire, onClose, onChange }: {
  op: DonneesOperation; partenaire: PartenaireMin | null; onClose: () => void; onChange: () => void
}) {
  const [lots, setLots] = useState<LotLigne[] | null>(null)
  const [regles, setRegles] = useState<Record<string, Regle>>({})
  const [ajustements, setAjustements] = useState<Record<string, number>>({})
  const [apercuId, setApercuId] = useState<string | null>(null)
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'ko'>('')

  useEffect(() => {
    let vivant = true
    const stationIds = op.stations.map(s => s.id)
    Promise.all([
      supabase.from('lots').select('id,event_id,nom,titre,valeur,quantite,conditions,note').in('event_id', stationIds).order('id'),
      supabase.from('events').select('id,cfg').in('id', stationIds),
    ]).then(([l, e]) => {
      if (!vivant) return
      setLots((l.data ?? []) as LotLigne[])
      const r: Record<string, Regle> = {}
      ;((e.data ?? []) as { id: string; cfg: Record<string, unknown> | null }[]).forEach(ev => {
        const rr = (ev.cfg?.regleRecompense ?? null) as Partial<Regle> | null
        r[ev.id] = { mode: rr?.mode === 'tousLesX' ? 'tousLesX' : 'aleatoire', everyX: Number(rr?.everyX) || 10, probabilite: Number(rr?.probabilite) || 15 }
      })
      setRegles(r)
    })
    return () => { vivant = false }
  }, [op])

  function maj(id: string, champ: keyof LotLigne, v: string | number | null) {
    setLots(ls => (ls ?? []).map(l => (l.id === id ? { ...l, [champ]: v } : l)))
    setEtat('')
  }
  function ajouterLot(eventId: string) {
    const id = `lot-${eventId}-${Date.now().toString(36)}`
    setLots(ls => [...(ls ?? []), { id, event_id: eventId, nom: 'Nouveau lot', titre: null, valeur: 0, quantite: 1, conditions: null, note: 'Type : tirage au sort' }])
  }

  async function enregistrer() {
    setEtat('envoi')
    let ko = false
    for (const l of lots ?? []) {
      const { error } = await supabase.from('lots').upsert({
        id: l.id, event_id: l.event_id, nom: (l.nom ?? '').trim() || 'Lot', titre: (l.nom ?? '').trim() || 'Lot',
        valeur: l.valeur, quantite: Math.max(1, l.quantite ?? 1), conditions: l.conditions, note: l.note,
        partenaire_id: partenaire?.id ?? null,
      }, { onConflict: 'id' })
      if (error) ko = true
    }
    for (const [eventId, r] of Object.entries(regles)) {
      const ev = op.stations.find(s => s.id === eventId)
      if (!ev || ev.super_event_id) continue // station de super event : verrouillee tirage au sort, rien a ecrire
      const lotsEv = (lots ?? []).filter(l => l.event_id === eventId)
      const aInstant = lotsEv.some(l => estInstant(l.note))
      const { data } = await supabase.from('events').select('cfg').eq('id', eventId).maybeSingle()
      const actuel = ((data as { cfg: Record<string, unknown> | null } | null)?.cfg) ?? {}
      const { error } = await supabase.from('events').update({
        cfg: { ...actuel, regleRecompense: aInstant && ev.module !== 'spin' ? r : null },
        gain_ticket: lotsEv.some(l => !estInstant(l.note)),
      }).eq('id', eventId)
      if (error) ko = true
    }
    setEtat(ko ? 'ko' : 'ok')
    if (!ko) onChange()
  }

  const lotApercu = (lots ?? []).find(l => l.id === apercuId) ?? null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: CARDBG, borderRadius: 16, width: '100%', maxWidth: 880, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${BRD}`, position: 'sticky', top: 0, background: CARDBG, zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Gérer les lots</div>
            <div style={{ fontSize: 12, color: MUT }}>{op.nom} — valeur, conditions, type, stock, billet</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: MUT, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {lots === null && <div style={{ fontSize: 13, color: MUT }}>Chargement…</div>}

          {lots !== null && op.stations.map(station => {
            const lotsStation = lots.filter(l => l.event_id === station.id)
            const enSuperEvent = !!station.super_event_id
            const aInstant = lotsStation.some(l => estInstant(l.note))
            const regle = regles[station.id] ?? { mode: 'aleatoire' as const, everyX: 10, probabilite: 15 }
            return (
              <div key={station.id} style={{ marginBottom: 22 }}>
                {op.stations.length > 1 && <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8 }}>{station.nom}</div>}

                {lotsStation.length === 0 && <div style={{ fontSize: 12.5, color: MUT, marginBottom: 8 }}>Aucun lot sur cette station.</div>}

                {lotsStation.map(l => {
                  const stockInfo = op.lots.find(ol => ol.id === l.id)?.stock
                  const dAjust = ajustements[l.id] ?? 0
                  const billets = op.gagnants.filter(g => g.lotNom === (l.nom ?? '').trim())
                  return (
                    <div key={l.id} style={{ border: `1px solid ${BRD}`, borderRadius: 12, padding: 12, marginBottom: 10, background: SUBT }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 800, color: MUT, textTransform: 'uppercase' }}>Nom
                          <input value={l.nom ?? ''} onChange={e => maj(l.id, 'nom', e.target.value)}
                            style={{ display: 'block', width: '100%', marginTop: 3, border: `1px solid ${BRD}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </label>
                        <label style={{ fontSize: 10.5, fontWeight: 800, color: MUT, textTransform: 'uppercase' }}>Valeur (€)
                          <input type="number" min={0} value={l.valeur ?? 0} onChange={e => maj(l.id, 'valeur', parseFloat(e.target.value) || 0)}
                            style={{ display: 'block', width: '100%', marginTop: 3, border: `1px solid ${BRD}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </label>
                        <label style={{ fontSize: 10.5, fontWeight: 800, color: MUT, textTransform: 'uppercase' }}>Quantité
                          <input type="number" min={1} value={l.quantite ?? 1} onChange={e => maj(l.id, 'quantite', Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ display: 'block', width: '100%', marginTop: 3, border: `1px solid ${BRD}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </label>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: enSuperEvent ? '1fr' : '2fr 1fr', gap: 8, marginBottom: 8 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 800, color: MUT, textTransform: 'uppercase' }}>Conditions d&apos;utilisation
                          <input value={l.conditions ?? ''} onChange={e => maj(l.id, 'conditions', e.target.value || null)} placeholder="ex. Valable sur présentation du billet, non cumulable"
                            style={{ display: 'block', width: '100%', marginTop: 3, border: `1px solid ${BRD}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </label>
                        {!enSuperEvent && (
                          <label style={{ fontSize: 10.5, fontWeight: 800, color: MUT, textTransform: 'uppercase' }}>Type
                            <select value={estInstant(l.note) ? 'instantane' : 'tirage'} onChange={e => maj(l.id, 'note', e.target.value === 'instantane' ? 'Type : gain instantané' : 'Type : tirage au sort')}
                              style={{ display: 'block', width: '100%', marginTop: 3, border: `1px solid ${BRD}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}>
                              <option value="tirage">Tirage au sort</option>
                              <option value="instantane">Gain immédiat</option>
                            </select>
                          </label>
                        )}
                      </div>
                      {enSuperEvent && <div style={{ fontSize: 11, color: MUT, marginBottom: 8 }}>Station de super event : tirage au sort uniquement, non modifiable ici.</div>}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', paddingTop: 8, borderTop: `1px solid ${BRD}` }}>
                        {stockInfo ? (
                          <AjustementStockLigne lotId={l.id} dispo={stockInfo.dispo + dAjust} total={stockInfo.total + dAjust}
                            onAjuste={d => setAjustements(a => ({ ...a, [l.id]: (a[l.id] ?? 0) + d }))} />
                        ) : (
                          <span style={{ fontSize: 11, color: MUT }}>Pas de stock unitaire géré pour ce lot — quantité déclarative uniquement.</span>
                        )}
                        <button onClick={() => setApercuId(apercuId === l.id ? null : l.id)}
                          style={{ border: `1px solid ${BRD}`, background: '#fff', borderRadius: 99, padding: '4px 11px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', color: ACC }}>
                          🎫 {apercuId === l.id ? 'Masquer le billet' : 'Aperçu du billet'}
                        </button>
                        <span style={{ fontSize: 11, color: billets.length ? '#15803D' : MUT, fontWeight: billets.length ? 700 : 400 }}>
                          {billets.length ? `🏆 ${billets.length} billet${billets.length > 1 ? 's' : ''} déjà émis` : 'Aucun billet émis pour ce lot'}
                        </span>
                      </div>

                      {billets.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {billets.map(g => (
                            <div key={g.id} style={{ fontSize: 11.5, color: MUT }}>
                              <b style={{ color: 'inherit' }}>{g.joueurNom ?? 'Joueur'}</b> — {g.etat === 'retire' ? '✅ remis' : g.etat === 'confirme' ? '📞 confirmé' : '⏳ à appeler'}
                              {g.retireAt ? ` · ${new Date(g.retireAt).toLocaleDateString('fr-FR')}` : ''}
                            </div>
                          ))}
                        </div>
                      )}

                      {apercuId === l.id && (
                        <div style={{ marginTop: 10 }}>
                          <BilletApercu
                            commerce={partenaire?.nom ?? 'Votre commerce'}
                            lot={(l.nom ?? '').trim() || 'Lot'} valeur={l.valeur ?? 0} conditions={l.conditions}
                            operation={op.type === 'super' ? op.id : null} operationNom={op.nom}
                            hauteur={520}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}

                <button onClick={() => ajouterLot(station.id)}
                  style={{ border: `1px dashed ${BRD}`, background: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', color: ACC }}>
                  + Ajouter un lot
                </button>

                {aInstant && !enSuperEvent && station.module !== 'spin' && (
                  <div style={{ border: `1px solid ${BRD}`, borderRadius: 10, padding: 10, marginTop: 10 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 6 }}>Gain immédiat : quand le joueur gagne-t-il ?</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <select value={regle.mode} onChange={e => setRegles(rs => ({ ...rs, [station.id]: { ...regle, mode: e.target.value as Regle['mode'] } }))}
                        style={{ border: `1px solid ${BRD}`, borderRadius: 8, padding: '6px 8px', fontSize: 12.5 }}>
                        <option value="aleatoire">Au hasard</option>
                        <option value="tousLesX">Tous les X joueurs</option>
                      </select>
                      {regle.mode === 'aleatoire' ? (
                        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="number" min={0} max={100} value={regle.probabilite}
                            onChange={e => setRegles(rs => ({ ...rs, [station.id]: { ...regle, probabilite: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } }))}
                            style={{ width: 60, border: `1px solid ${BRD}`, borderRadius: 8, padding: '5px 7px' }} /> % de chances par partie
                        </label>
                      ) : (
                        <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          un gagnant tous les
                          <input type="number" min={1} value={regle.everyX}
                            onChange={e => setRegles(rs => ({ ...rs, [station.id]: { ...regle, everyX: Math.max(1, parseInt(e.target.value) || 1) } }))}
                            style={{ width: 60, border: `1px solid ${BRD}`, borderRadius: 8, padding: '5px 7px' }} /> joueurs
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: `1px solid ${BRD}`, position: 'sticky', bottom: 0, background: CARDBG }}>
          <button onClick={enregistrer} disabled={etat === 'envoi' || lots === null}
            style={{ background: ACC, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
            {etat === 'envoi' ? 'Enregistrement…' : '✓ Enregistrer'}
          </button>
          <button onClick={onClose} style={{ border: `1px solid ${BRD}`, background: '#fff', borderRadius: 10, padding: '10px 18px', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Fermer</button>
          {etat === 'ok' && <span style={{ fontSize: 12.5, color: '#15803D', fontWeight: 700 }}>Enregistré.</span>}
          {etat === 'ko' && <span style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700 }}>Échec partiel — réessaie.</span>}
        </div>
      </div>
    </div>
  )
}
