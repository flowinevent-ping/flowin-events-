'use client'

/**
 * BLOCS PAR OPERATION — rendu commun de la fiche pro SA et du dashboard pro.
 *
 * Un bloc = une operation (super event ou event autonome), titre nom + date,
 * trie par date decroissante (lib/operations.ts). Un bloc vide affiche son
 * vide sous son propre titre, jamais un « 0 » global.
 *
 * Styles en ligne sur les variables --sa-* : ProShell et le dashboard SA les
 * declarent tous les deux, le meme composant se lit donc pareil des deux cotes.
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  libelleDates, libelleModule, libelleStatut, fetchSuiviOperation, fetchOperationsPro, gagnantsParStation, libelleRemise,
  type DonneesOperation, type Operation, type OperationsPro, type SuiviOperation, type StatsOperation,
} from '@/lib/operations'
import { packEnvoi, lienBillet, mailPartenaireUrl, libelleSource } from '@/lib/nds'
import { Camembert } from '@/components/dashboard/Camembert'
import QrLiensEvent from '@/components/dashboard/QrLiensEvent'
import { DiffusionStation, ExportMailchimp } from './DiffusionOperation'
import { ContenuCrm, ContenuReponses } from './DataOperation'
import { operationsRangees } from '@/lib/rangementOperations'

export type Mode = 'sa' | 'pro'
export type OngletOperation = 'stations' | 'lots' | 'gagnants' | 'comm' | 'contrat' | 'qr' | 'tracking' | 'crm'

const ACC = 'var(--sa-accent, #2563EB)'
const MUT = 'var(--sa-muted, #64748B)'
const BRD = 'var(--sa-border, #E2E8F0)'
const SUBT = 'var(--sa-subtle, #F8FAFC)'
const CARDBG = 'var(--sa-card, #FFFFFF)'

export const btn: React.CSSProperties = {
  background: CARDBG, border: `1.5px solid ${BRD}`, borderRadius: 9, padding: '6px 11px',
  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'inherit',
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
}
export const btnPrimaire: React.CSSProperties = { ...btn, background: '#2563EB', borderColor: '#2563EB', color: '#fff' }

export function Vide({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12.5, color: MUT, padding: '6px 0' }}>{children}</div>
}

function Pastille({ ton, children }: { ton: 'ok' | 'warn' | 'neutre' | 'acc'; children: React.ReactNode }) {
  const c = {
    ok: ['rgba(34,197,94,.12)', '#15803D'],
    warn: ['rgba(245,158,11,.13)', '#B45309'],
    neutre: [SUBT, MUT],
    acc: ['rgba(96,165,250,.11)', '#2563EB'],
  }[ton]
  return <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: '3px 9px', background: c[0], color: c[1], whiteSpace: 'nowrap' }}>{children}</span>
}

/** L en-tete et le cadre d un bloc -- identique sur tous les onglets. */
export function BlocOperation({ op, children, droite }: { op: Operation; children: React.ReactNode; droite?: React.ReactNode }) {
  const statut = op.status
  return (
    <section style={{ background: CARDBG, border: `1px solid ${BRD}`, borderRadius: 14, marginBottom: 14, overflow: 'hidden' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: `1px solid ${BRD}`, background: SUBT, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 800, fontSize: 14.5 }}>{op.nom}</div>
          <div style={{ fontSize: 11.5, color: MUT, marginTop: 1 }}>
            {libelleDates(op.dateD, op.dateF)}
            {' · '}{op.type === 'super'
              ? `Super event · ${op.stations.length} station${op.stations.length > 1 ? 's' : ''}`
              : `Event · ${libelleModule(op.stations[0]?.module)}`}
          </div>
        </div>
        {statut && <Pastille ton={statut === 'live' ? 'ok' : statut === 'upcoming' ? 'acc' : 'neutre'}>{libelleStatut(statut)}</Pastille>}
        {droite}
      </header>
      <div style={{ padding: '12px 16px' }}>{children}</div>
    </section>
  )
}

/** Liste vide de toute operation -- le seul cas ou il n y a aucun bloc. */
export function AucuneOperation() {
  return <Vide>Aucun event ni super event pour ce compte.</Vide>
}

function Mini({ v, l }: { v: React.ReactNode; l: string }) {
  return (
    <div style={{ flex: '0 1 132px', minWidth: 104, background: SUBT, borderRadius: 10, padding: '6px 10px' }}>
      <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{v}</div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: MUT, lineHeight: 1.25 }}>{l}</div>
    </div>
  )
}

const ligne: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${BRD}`, flexWrap: 'wrap' }

/* ── Lots & stock ──────────────────────────────────────────────────────────── */

export function ContenuLots({ op }: { op: DonneesOperation }) {
  const unites = op.lots.reduce((s, l) => s + l.quantite, 0)
  const valeur = op.lots.reduce((s, l) => s + (l.valeur ?? 0) * l.quantite, 0)
  const tires = op.gagnants.length
  const remis = op.gagnants.filter(g => g.etat === 'retire').length
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <Mini v={unites} l="lots engagés" />
        <Mini v={`${valeur} €`} l="valeur" />
        {op.stock && <Mini v={`${op.stock.dispo} / ${op.stock.total}`} l="stock disponible" />}
        <Mini v={tires} l="tirés" />
        <Mini v={remis} l="remis" />
      </div>
      {op.lots.length === 0 && <Vide>Aucun lot sur cette opération.</Vide>}
      {op.lots.map(l => (
        <div key={l.id} style={ligne}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{l.nom}</div>
            <div style={{ fontSize: 11, color: MUT }}>
              {l.valeur != null ? `${l.valeur} € · ` : ''}quantité {l.quantite}
              {l.stationNom ? ` · station ${l.stationNom}` : ''}
            </div>
            {l.conditions && <div style={{ fontSize: 11, color: MUT }}>{l.conditions}</div>}
          </div>
          {(() => {
            /* Referentiel 43 : le stock se lit par lot, dans son operation. */
            if (l.stock) return <Pastille ton={l.stock.dispo > 0 ? 'ok' : 'warn'}>stock {l.stock.dispo} / {l.stock.total}</Pastille>
            const tiresLot = op.gagnants.filter(g => g.lotNom === l.nom).length
            const reste = Math.max(0, l.quantite - tiresLot)
            return <Pastille ton={reste > 0 ? 'neutre' : 'warn'}>{reste} restant{reste > 1 ? 's' : ''} / {l.quantite}</Pastille>
          })()}
        </div>
      ))}
    </>
  )
}

/* ── Gagnants & billets (lecture SA) ───────────────────────────────────────── */

declare global {
  interface Window {
    flowinMailGagnant?: {
      sujet: (t: Record<string, unknown>) => string
      corps: (t: Record<string, unknown>) => string
      gmailUrl: (t: Record<string, unknown>) => string
      lienBillet: (t: Record<string, unknown>) => string
    }
  }
}

/** Charge /nds/mail-gagnant.js une seule fois -- source unique du texte. */
export function useMailGagnant() {
  useEffect(() => {
    if (window.flowinMailGagnant || document.getElementById('flowin-mail-gagnant-script')) return
    const s = document.createElement('script')
    s.id = 'flowin-mail-gagnant-script'
    s.src = '/nds/mail-gagnant.js'
    document.head.appendChild(s)
  }, [])
}

export function ContenuGagnantsSA({ op, partenaireNom, partenaireEmail, onChange }: {
  op: DonneesOperation; partenaireNom: string; partenaireEmail: string | null; onChange: () => void
}) {
  useMailGagnant()
  const n = (e: string) => op.gagnants.filter(g => g.etat === e).length
  async function confirmer(id: number) {
    if (!confirm('Confirmer ce gagnant ?\n\nIl apparaîtra alors dans la liste et les billets du partenaire, et son nom s\'inscrira sur le billet.')) return
    const { error } = await supabase.rpc('marquer_notifie', { p_tirage_id: id })
    if (error) { alert('La confirmation a échoué.'); return }
    onChange()
  }
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <Mini v={op.gagnants.length} l="tirés" />
        <Mini v={n('a_confirmer')} l="à appeler" />
        <Mini v={n('confirme')} l="confirmés" />
        <Mini v={n('retire')} l="retirés" />
      </div>
      {n('a_confirmer') > 0 && (
        <div style={{ fontSize: 12, color: '#B45309', marginBottom: 8 }}>
          {n('a_confirmer')} gagnant{n('a_confirmer') > 1 ? 's' : ''} à appeler. Le commerçant ne les verra qu&apos;une fois confirmés.
        </div>
      )}
      {op.gagnants.length === 0 && <Vide>Aucun gagnant tiré sur cette opération.</Vide>}
      {gagnantsParStation(op).map(grp => (
        <div key={grp.cle}>
          {grp.nom && <TitreStation nom={grp.nom} n={grp.gagnants.length} />}
          {grp.gagnants.map(g => (
        <div key={g.id} style={ligne}>
          <div style={{ flex: 1, minWidth: 170 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{g.etat === 'a_confirmer' && op.type === 'super' ? 'À attribuer' : (g.joueurNom ?? '—')}</div>
            <div style={{ fontSize: 11, color: MUT }}>{g.lotNom ?? 'Lot'}{g.lotValeur ? ` · ${g.lotValeur} €` : ''}{g.date ? ` · tiré le ${new Date(`${g.date}T12:00:00`).toLocaleDateString('fr-FR')}` : ''}</div>
            {g.retireAt && <div style={{ fontSize: 11, color: '#15803D', fontWeight: 700 }}>{libelleRemise(g.retireAt)}</div>}
          </div>
          <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11.5, fontWeight: 700, color: '#2563EB' }}>{g.ticketCode ?? '—'}</span>
          <Pastille ton={g.etat === 'a_confirmer' ? 'warn' : 'ok'}>{g.etat === 'retire' ? '✓ Retiré' : g.etat === 'confirme' ? '✓ Confirmé' : 'À appeler'}</Pastille>
          {g.retraitToken && <a style={btn} href={lienBillet(g.retraitToken, true, op.id)} target="_blank" rel="noopener noreferrer">Billet</a>}
          {g.etat !== 'a_confirmer' && (
            <>
              <button style={btn} onClick={() => {
                const url = window.flowinMailGagnant?.gmailUrl({
                  joueur_nom: g.joueurNom, email: g.joueurEmail, lot_nom: g.lotNom,
                  ticket_code: g.ticketCode, retrait_token: g.retraitToken, type: 'lot',
                  operation: op.id, operation_nom: op.nom,
                })
                if (url) window.open(url, '_blank', 'noopener')
              }}>Email gagnant</button>
              <button style={btn} onClick={() => window.open(mailPartenaireUrl({
                joueur_nom: g.joueurNom, lot_nom: g.lotNom, ticket_code: g.ticketCode, retrait_token: g.retraitToken,
              }, partenaireNom, partenaireEmail, { id: op.id, nom: op.nom }), '_blank', 'noopener')}>Email commerce</button>
            </>
          )}
          {g.etat === 'a_confirmer' && <button style={btnPrimaire} onClick={() => confirmer(g.id)}>✓ Confirmer</button>}
        </div>
          ))}
        </div>
      ))}
    </>
  )
}

/** En-tete d un groupe de gagnants (referentiel 35 : par station). */
export function TitreStation({ nom, n }: { nom: string; n: number }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: MUT, margin: '12px 0 2px' }}>
      {nom} · {n}
    </div>
  )
}

/* ── Emails & com ──────────────────────────────────────────────────────────── */


export function ContenuComm({ op, partenaireId, partenaireSe, mode }: {
  op: DonneesOperation; partenaireId: string | null; partenaireSe: string | null; mode: Mode
}) {
  /* Le kit (affiches, planches, kit digital) n a ete produit que pour NDS 2026 :
     ses fichiers portent le prefixe nds_. On ne le propose donc que sur ce
     super event, pour le commerce qui y est rattache. */
  const kit = op.type === 'super' && op.id === 'se-nds-2026' && !!partenaireId && partenaireSe === op.id
    ? packEnvoi(partenaireId).filter(el => mode === 'sa' || !el.libelle.startsWith('Email de remerciement'))
    : []
  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, marginBottom: 4 }}>Supports</div>
      {kit.length === 0 && <Vide>Aucun support de communication produit pour cette opération.</Vide>}
      {kit.map(el => (
        <div key={el.libelle} style={ligne}>
          <span style={{ flex: 1, fontSize: 12.5 }}>{el.libelle}</span>
          <a style={btn} href={el.url} target="_blank" rel="noopener noreferrer">Ouvrir</a>
          <button style={btn} onClick={() => navigator.clipboard?.writeText(el.url)}>Copier</button>
        </div>
      ))}

      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, margin: '14px 0 4px' }}>
        Diffusion {op.type === 'super' ? 'par station' : ''}
      </div>
      {op.stations.map(s => <DiffusionStation key={s.id} op={op} s={s} mode={mode} />)}
      <ExportMailchimp op={op} />
    </>
  )
}

/* ── Contrat ───────────────────────────────────────────────────────────────── */

const MODES: Record<string, string> = {
  lydia_wero: 'Lydia / Wero', paypal: 'PayPal', sepa: 'Virement SEPA', virement: 'Virement bancaire', especes: 'Espèces',
}

export function ContenuContrat({ op, mode, partenaireId, onChange }: {
  op: DonneesOperation; mode: Mode; partenaireId: string | null; onChange: () => void
}) {
  const c = op.contrat
  if (!c) return <Vide>Aucun contrat enregistré pour cette opération.</Vide>
  const paye = c.statutPaiement === 'valide' || c.statutPaiement === 'paye'
  const commerceSE = c.source === 'commerce'
  async function majPaiement(v: string) {
    /* Super event : le paiement est celui du commerce (partenaires) ; event
       autonome : celui de l event (events.paiement_statut). */
    const { error } = commerceSE
      ? (partenaireId ? await supabase.from('partenaires').update({ statut_paiement: v }).eq('id', partenaireId) : { error: { message: 'pas de fiche commerce' } })
      : await supabase.from('events').update({ paiement_statut: v }).in('id', op.stations.map(st => st.id))
    if (error) { alert('Échec de la mise à jour.'); return }
    onChange()
  }
  const champ = (l: string, v: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: `1px solid ${BRD}`, fontSize: 12.5 }}>
      <span style={{ width: 150, flexShrink: 0, color: MUT }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  )
  /* Referentiel 41 : un nouveau bon se cree DEPUIS l operation, qui lui est
     rattache (bon-commande-nds.html lit ?se= / ?ev= / ?pt=). */
  const p = new URLSearchParams()
  if (op.type === 'super') p.set('se', op.id)
  else p.set('ev', op.stations[0]?.id ?? op.id)
  if (partenaireId) p.set('pt', partenaireId)
  const lienNouveauBon = `/bon-commande-nds.html?${p.toString()}`
  return (
    <>
      {commerceSE && champ('Formule', c.offre || '—')}
      {commerceSE && champ('Montant', c.montant != null ? `${c.montant} €` : '—')}
      {commerceSE && champ('Mode de paiement', c.paiementMode ? (MODES[c.paiementMode] ?? c.paiementMode) : '—')}
      {champ('Paiement', <Pastille ton={paye ? 'ok' : 'warn'}>{paye ? 'Reçu' : (c.statutPaiement === 'en_attente' || !c.statutPaiement ? 'En attente' : c.statutPaiement)}</Pastille>)}
      {commerceSE && !c.factureNumero && champ('Facture', c.factureEmise ? 'Émise (suivi manuel)' : 'Non émise')}

      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, margin: '12px 0 4px' }}>Bons de commande &amp; factures</div>
      {c.bons.length === 0 && <Vide>Aucun bon de commande rattaché à cette opération.</Vide>}
      {c.bons.map(bn => (
        <div key={bn.id} style={ligne}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <code style={{ fontWeight: 700, fontSize: 12.5 }}>{bn.id}</code>
            <div style={{ fontSize: 11, color: MUT }}>
              {bn.statut ?? '—'}{bn.montantTtc != null ? ` · ${bn.montantTtc} € TTC` : ''}{bn.date ? ` · ${new Date(`${bn.date}T12:00:00`).toLocaleDateString('fr-FR')}` : ''}
            </div>
          </div>
          <Pastille ton={bn.factureNumero ? 'ok' : 'neutre'}>{bn.factureNumero ? `Facture ${bn.factureNumero}` : 'Non facturé'}</Pastille>
          {mode === 'pro' && (
            <>
              <a style={btn} target="_blank" rel="noreferrer" href={`/bon-commande-nds.html?id=${encodeURIComponent(bn.id)}`}>Voir le bon</a>
              {bn.factureNumero && <a style={btn} target="_blank" rel="noreferrer" href={`/facture-nds.html?num=${encodeURIComponent(bn.factureNumero)}`}>Voir la facture</a>}
            </>
          )}
          {mode === 'sa' && (
            <>
              <a style={btn} target="_blank" rel="noreferrer" href={`/bon-commande-nds.html?id=${encodeURIComponent(bn.id)}`}>Bon →</a>
              <a style={btn} target="_blank" rel="noreferrer"
                href={bn.factureNumero ? `/facture-nds.html?num=${encodeURIComponent(bn.factureNumero)}` : `/facture-nds.html?devis=${encodeURIComponent(bn.id)}`}>
                {bn.factureNumero ? 'Facture' : 'Facturer'}
              </a>
            </>
          )}
        </div>
      ))}

      {mode === 'sa' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {paye
            ? <button style={btn} onClick={() => majPaiement('en_attente')}>↩ Paiement en attente</button>
            : <button style={btnPrimaire} onClick={() => majPaiement('valide')}>✓ Valider le paiement</button>}
          <a style={btn} target="_blank" rel="noreferrer" href={lienNouveauBon}>＋ Nouveau bon de commande</a>
        </div>
      )}
    </>
  )
}

/* ── Tracking ──────────────────────────────────────────────────────────────── */

export function ContenuTracking({ op, proId, onStation }: {
  op: DonneesOperation; proId: string; onStation?: (eventId: string) => void
}) {
  const [s, setS] = useState<SuiviOperation | null | undefined>(undefined)
  const [origines, setOrigines] = useState<{ source: string; n: number }[]>([])
  const cle = op.stations.map(x => x.id).join(',')
  useEffect(() => {
    let vivant = true
    setS(undefined)
    fetchSuiviOperation(op, proId).then(r => { if (vivant) setS(r) })
    /* Origines : visiteurs identifies des SEULES stations de ce bloc, chacun
       compte une fois, sur sa premiere source. */
    supabase.from('visites').select('source,visiteur_id,created_at')
      .in('event_id', op.stations.map(x => x.id)).is('etape', null).not('visiteur_id', 'is', null)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!vivant) return
        const vus = new Set<string>(); const m = new Map<string, number>()
        ;((data ?? []) as { source: string | null; visiteur_id: string }[]).forEach(v => {
          if (vus.has(v.visiteur_id)) return
          vus.add(v.visiteur_id)
          const k = v.source || 'direct'
          m.set(k, (m.get(k) ?? 0) + 1)
        })
        setOrigines(Array.from(m.entries()).map(([source, n]) => ({ source, n })).sort((a, b) => b.n - a.n))
      })
    return () => { vivant = false }
  }, [cle, op.type, op.id, proId]) // eslint-disable-line react-hooks/exhaustive-deps
  if (s === undefined) return <Vide>Chargement…</Vide>
  if (s === null) return <Vide>Tracking indisponible.</Vide>
  const t = s.totaux
  return (
    <>
      {op.type === 'super' && s.global && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, marginBottom: 4 }}>Toute l’opération — toutes stations</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <Mini v={s.global.parties} l="parties" />
            <Mini v={s.global.joueurs} l="joueurs" />
            <Mini v={s.global.rejoue_autre_jour} l="revenus un autre jour" />
            <Mini v={s.global.pic_heure ? `${s.global.pic_heure.heure}h` : '—'} l="pic horaire" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, marginBottom: 4 }}>
            {op.stations.length > 1 ? 'Vos stations' : 'Votre station'}
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Mini v={t.flashs} l="flashs QR" />
        <Mini v={t.physique} l="dont physique" />
        <Mini v={t.digital} l="dont digital" />
        <Mini v={t.parties} l="parties" />
        <Mini v={t.joueurs} l="joueurs" />
      </div>
      {s.stats && <StatsUniformes st={s.stats} />}
      <div style={{ fontSize: 11, color: MUT, marginBottom: 4 }}>
        Un flash est une ouverture du QR, pas une personne. {op.type === 'super' ? 'Période officielle de l’opération.' : 'Tout l’historique de l’event.'}
      </div>
      {s.stations.length === 0 && <Vide>Aucun flash ni partie enregistré.</Vide>}
      {s.stations.map(st => (
        <div key={st.event_id} style={{ ...ligne, cursor: onStation ? 'pointer' : 'default' }} onClick={() => onStation?.(st.event_id)}>
          <span style={{ flex: 1, minWidth: 140, fontWeight: 700, fontSize: 12.5 }}>{st.station}</span>
          <span style={{ fontSize: 12 }}><b>{st.flashs}</b> flashs</span>
          <span style={{ fontSize: 12 }}><b>{st.parties}</b> parties</span>
          <span style={{ fontSize: 12 }}><b>{st.joueurs}</b> joueurs</span>
          {st.heure_pic != null && <span style={{ fontSize: 12, color: MUT }}>pic {st.heure_pic}h</span>}
          {onStation && <span style={{ color: ACC, fontWeight: 800, fontSize: 12 }}>→</span>}
        </div>
      ))}
      {origines.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, margin: '12px 0 2px' }}>Source d’arrivée — visiteurs identifiés</div>
          {origines.map(o => (
            <div key={o.source} style={{ ...ligne, padding: '5px 0' }}>
              <span style={{ flex: 1, fontSize: 12.5 }}>{libelleSource(o.source)}</span>
              <b style={{ fontSize: 12.5 }}>{o.n}</b>
            </div>
          ))}
        </>
      )}
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: MUT, margin: '14px 0 6px' }}>Réponses aux questions</div>
      <ContenuReponses op={op} />
    </>
  )
}

/* ── Stats uniformes ─────────────────────────────────────────────────────────
   Memes indicateurs pour toute operation. Distributions en camemberts. */
function StatsUniformes({ st }: { st: StatsOperation }) {
  const jourFr = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Mini v={st.rejoue_meme_jour} l="rejoué le même jour" />
        <Mini v={st.rejoue_autre_jour} l="revenus un autre jour" />
        <Mini v={st.pic_heure ? `${st.pic_heure.heure}h` : '—'} l={st.pic_heure ? `pic horaire · ${st.pic_heure.parties} parties` : 'pic horaire'} />
        <Mini v={st.pic_jour ? jourFr(st.pic_jour.jour) : '—'} l={st.pic_jour ? `pic journalier · ${st.pic_jour.parties} parties` : 'pic journalier'} />
      </div>
      {st.joueurs > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 8 }}>
          <Camembert titre="Sexe" parts={st.sexe} unite="joueurs" />
          <Camembert titre="Tranches d’âge" parts={st.age} unite="joueurs" />
          {st.code_postal && st.code_postal.length > 0 && <Camembert titre="Codes postaux" parts={st.code_postal} unite="joueurs" />}
        </div>
      )}
    </>
  )
}

/* ── Chargement client ─────────────────────────────────────────────────────── */


export function useOperationsPro(proId: string | null | undefined) {
  const [data, setData] = useState<OperationsPro | null>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!proId) { setData(null); return }
    let vivant = true
    fetchOperationsPro(proId).then(d => { if (vivant) setData(d) })
    return () => { vivant = false }
  }, [proId, n])
  return { data, recharger: () => setN(x => x + 1) }
}

/** Le code PIN du commerce -- propre au commerce, donc affiche une fois, au-dessus des blocs. */
export function EncartPin({ pin }: { pin: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff8ea', border: '1px solid #f2e1b6', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: '#a1690a' }}>PIN du commerce · validation en caisse</div>
        <div style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 24, fontWeight: 800, letterSpacing: 7, color: '#23142c', marginTop: 2 }}>{pin ?? '—'}</div>
      </div>
      {pin && <button style={{ ...btn, marginLeft: 'auto' }} onClick={() => navigator.clipboard?.writeText(pin)}>Copier</button>}
    </div>
  )
}

/** Les cinq onglets « donnees » de la fiche pro SA, en un seul composant. */
export function OngletOperationsSA({ proId, onglet, onStation }: {
  proId: string; onglet: OngletOperation; onStation?: (eventId: string) => void
}) {
  const { data, recharger } = useOperationsPro(proId)
  if (!data) return <Vide>Chargement…</Vide>
  const pt = data.partenaire
  return (
    <>
      {onglet === 'gagnants' && pt && <EncartPin pin={pt.code_pin} />}
      {data.operations.length === 0 && <AucuneOperation />}
      {operationsRangees(data.operations).map(op => (
        <BlocOperation key={op.cle} op={op}>
          {onglet === 'lots' && <ContenuLots op={op} />}
          {onglet === 'gagnants' && <ContenuGagnantsSA op={op} partenaireNom={pt?.nom ?? data.proNom ?? ''} partenaireEmail={pt?.email ?? data.proEmail} onChange={recharger} />}
          {onglet === 'comm' && <ContenuComm op={op} partenaireId={pt?.id ?? null} partenaireSe={pt?.super_event_id ?? null} mode="sa" />}
          {onglet === 'contrat' && <ContenuContrat op={op} mode="sa" partenaireId={pt?.id ?? null} onChange={recharger} />}
          {onglet === 'tracking' && <ContenuTracking op={op} proId={proId} onStation={onStation} />}
          {onglet === 'stations' && <ContenuStations op={op} onStation={onStation} />}
          {onglet === 'crm' && <ContenuCrm op={op} />}
          {onglet === 'qr' && op.stations.map(ev => <QrLiensEvent key={ev.id} eventId={ev.id} eventNom={ev.nom} module={ev.module} />)}
        </BlocOperation>
      ))}
    </>
  )
}

/* ── Stations d une operation ──────────────────────────────────────────────── */

export function ContenuStations({ op, onStation }: { op: DonneesOperation; onStation?: (eventId: string) => void }) {
  if (!op.stations.length) return <Vide>Aucune station.</Vide>
  return (
    <>
      {op.stations.map(ev => (
        <div key={ev.id} style={{ ...ligne, cursor: onStation ? 'pointer' : 'default' }} onClick={() => onStation?.(ev.id)}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{ev.nom}</div>
            <div style={{ fontSize: 11, color: MUT }}>{libelleModule(ev.module)} · {ev.participants ?? 0} participations</div>
          </div>
          {ev.status && <Pastille ton={ev.status === 'live' ? 'ok' : ev.status === 'upcoming' ? 'acc' : 'neutre'}>{libelleStatut(ev.status)}</Pastille>}
          {onStation && <span style={{ color: ACC, fontWeight: 800, fontSize: 12 }}>→</span>}
        </div>
      ))}
    </>
  )
}

/** Onglets communs de la fiche pro ET de la fiche partenaire rattachee a un pro (famille J). */
export const ONGLETS_FICHE: { id: string; label: string; onglet?: OngletOperation }[] = [
  { id: 'infos', label: 'Infos' },
  { id: 'events', label: 'Ses stations', onglet: 'stations' },
  { id: 'c-lots', label: 'Lots & stock', onglet: 'lots' },
  { id: 'c-gagnants', label: 'Gagnants & billets', onglet: 'gagnants' },
  { id: 'c-comm', label: 'Emails & com', onglet: 'comm' },
  { id: 'c-contrat', label: 'Contrat', onglet: 'contrat' },
  { id: 'qrliens', label: 'QR & Liens', onglet: 'qr' },
  { id: 'tracking', label: 'Tracking', onglet: 'tracking' },
  { id: 'crm', label: 'CRM', onglet: 'crm' },
]

/** Les onglets « donnees » du dashboard pro -- memes blocs que la fiche SA. */
export function OngletOperationsPro({ initial, onglet, prefixeStation, cle }: {
  initial: OperationsPro; onglet: Exclude<OngletOperation, 'gagnants'>
  /** Une seule operation (filtre de Mes donnees). */
  cle?: string | null
  /** ex. « /pro/super/ » : chaque station du tracking ouvre sa page detail. */
  prefixeStation?: string
}) {
  const [data, setData] = useState<OperationsPro>(initial)
  const recharger = () => { fetchOperationsPro(initial.proId).then(setData) }
  const q = `?pro=${encodeURIComponent(initial.proId)}`
  const onStation = prefixeStation ? (id: string) => { window.location.href = `${prefixeStation}${encodeURIComponent(id)}${q}` } : undefined
  const pt = data.partenaire
  return (
    <>
      {data.operations.length === 0 && <AucuneOperation />}
      {operationsRangees(data.operations, cle).map(op => (
        <BlocOperation key={op.cle} op={op}>
          {onglet === 'lots' && <ContenuLots op={op} />}
          {onglet === 'comm' && <ContenuComm op={op} partenaireId={pt?.id ?? null} partenaireSe={pt?.super_event_id ?? null} mode="pro" />}
          {onglet === 'contrat' && <ContenuContrat op={op} mode="pro" partenaireId={pt?.id ?? null} onChange={recharger} />}
          {onglet === 'tracking' && <ContenuTracking op={op} proId={data.proId} onStation={onStation} />}
          {onglet === 'crm' && <ContenuCrm op={op} />}
        </BlocOperation>
      ))}
    </>
  )
}
