'use client'

/**
 * LOT : FORMULAIRE COMPLET + APERCU DU TICKET EN DIRECT (lot 6 A, maquette validée le 24/11/2026).
 * Règle de Romain : « formulaire complet obligatoire » pour tous les jeux (roue, quiz + bonus, tombola) :
 * intitulé, conditions d'utilisation (texte libre), cessible oui / non, quantité, valeur en euros (facultative), validité.
 * Jamais de simples boutons présélectionnés. Un lot visible à la fois, deux volets (Quoi, Combien) ;
 * pour la roue, un troisième volet « La roue » (3 types de cases : lot à retirer tout de suite, perdu, ticket pour le prochain tirage).
 * Le ticket se met à jour sous les yeux du pro. Roue et quiz : jamais le mot « tirage » (gain immédiat) ;
 * tombola : « Tirage au sort ».
 */
import { useState, type CSSProperties, type ReactNode } from 'react'
import { CHARTE_PRO as C } from '@/lib/charte'
import { MUTED } from '@/lib/proui'

const BLEU = '#3B5CC4'
export type Validite = 'sans' | 'jours' | 'dates'
export type TexteDate = { date: string; texte: string }
export type LotC = {
  id: string; nom: string; quantite: number; conditions: string
  /** Décision par défaut (24/11) : non cessible. */
  cessible: boolean
  /** Valeur en euros, facultative (texte saisi, vide = non renseignée). */
  valeur: string
  validite: Validite; jours: number; du: string; au: string
  /** Roue : texte du lot par date (le texte du jour est modifiable sans republier). */
  textes: TexteDate[]
}
export type TypeCase = 'lot' | 'perdu' | 'ticket'
export type SegmentRoue = { label: string; color: string; perdant?: boolean; mode?: 'immediat' | 'tirage'; textes?: TexteDate[]; type: TypeCase }

export const lotVide = (): LotC => ({ id: 'l' + Math.random().toString(36).slice(2, 8), nom: '', quantite: 10, conditions: '', cessible: false, valeur: '', validite: 'sans', jours: 30, du: '', au: '', textes: [] })
export const valeurNombre = (v: string): number | null => {
  const n = Number(String(v).replace(',', '.').trim())
  return v.trim() && isFinite(n) && n >= 0 ? n : null
}
const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'
const dateFr = (d: string) => d.split('-').reverse().join('/')

/** Message de blocage d'un lot (null = complet). Tous les champs utiles sont obligatoires, sauf la valeur. */
export function verifierLot(l: LotC): string | null {
  if (!l.nom.trim()) return 'Indiquez l’intitulé du lot.'
  if (!l.conditions.trim()) return 'Indiquez les conditions d’utilisation.'
  if (!(l.quantite > 0)) return 'Indiquez la quantité.'
  if (l.valeur.trim() && valeurNombre(l.valeur) === null) return 'La valeur doit être un montant en euros.'
  if (l.validite === 'dates' && (!l.du || !l.au || l.au < l.du)) return 'Indiquez les dates de validité.'
  if (l.validite === 'jours' && !(l.jours > 0)) return 'Indiquez la durée de validité.'
  return null
}

/** Cases de la roue : les lots, les cases perdues et les tickets, mélangés pour ne pas coller deux cases du même type. */
export function casesRoue(lots: LotC[], nbPerdu: number, nbTicket: number): SegmentRoue[] {
  const L: SegmentRoue[] = lots.map(l => ({ label: l.nom.trim(), color: BLEU, mode: 'immediat' as const, textes: l.textes.filter(t => t.date && t.texte.trim()), type: 'lot' as const }))
  const P: SegmentRoue[] = Array.from({ length: nbPerdu }, () => ({ label: 'Perdu', color: '#CBD5E1', perdant: true, type: 'perdu' as const }))
  const T: SegmentRoue[] = Array.from({ length: nbTicket }, () => ({ label: 'Un ticket de plus', color: '#F5A100', mode: 'tirage' as const, type: 'ticket' as const }))
  const out: SegmentRoue[] = []
  const n = Math.max(L.length, P.length, T.length)
  for (let k = 0; k < n; k++) { if (L[k]) out.push(L[k]); if (P[k]) out.push(P[k]); if (T[k]) out.push(T[k]) }
  return out
}

const IN: CSSProperties = { width: '100%', minHeight: 44, padding: '10px 13px', background: '#fff', border: `1.5px solid ${C.bordureChamp}`, borderRadius: 12, color: C.texte, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const LAB: CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 800, color: C.attenue, margin: '0 0 4px' }
const puce = (on: boolean): CSSProperties => ({ minHeight: 44, border: `1.5px solid ${on ? BLEU : C.bordureChamp}`, background: on ? BLEU : '#fff', color: on ? '#fff' : C.texte, borderRadius: 99, padding: '0 15px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' })
const CONDITIONS_TYPE = ['Dès 30 € d’achat', 'Pour tout achat en magasin', 'Non cumulable']

function Champ({ l, children }: { l: string; children: ReactNode }) {
  return <label style={{ display: 'block', marginBottom: 9 }}><span style={LAB}>{l}</span>{children}</label>
}
function Stepper({ v, set, min = 0, max = 999, label, data }: { v: number; set: (n: number) => void; min?: number; max?: number; label: string; data?: string }) {
  const b: CSSProperties = { width: 44, height: 44, borderRadius: 99, border: `1.5px solid ${BLEU}`, background: '#fff', color: BLEU, fontSize: 22, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" aria-label={`${label} : moins`} style={b} onClick={() => set(Math.max(min, v - 1))}>−</button>
      <b data-stepper={data} style={{ minWidth: 34, textAlign: 'center', fontSize: 20 }}>{v}</b>
      <button type="button" aria-label={`${label} : plus`} style={b} onClick={() => set(Math.min(max, v + 1))}>+</button>
    </div>
  )
}

/** Le ticket tel que le recevra le joueur. */
export function TicketApercu({ lot, mode, commerce, logoUrl, vide }: { lot: LotC; mode: 'immediat' | 'tirage'; commerce: string; logoUrl: string | null; vide?: boolean }) {
  const v = valeurNombre(lot.valeur)
  const valid = lot.validite === 'sans' ? 'Sans limite' : lot.validite === 'jours' ? `${lot.jours} j après le gain` : (lot.du && lot.au ? `Du ${dateFr(lot.du)} au ${dateFr(lot.au)}` : 'Dates à choisir')
  return (
    <div data-ticket-apercu aria-label="Aperçu du ticket" style={{ border: `2px solid ${vide ? C.bordure : BLEU}`, background: vide ? C.subtil : '#fff', borderRadius: 16, padding: '10px 12px', opacity: vide ? 0.75 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.bordure}`, background: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: '0 0 auto', fontWeight: 900, color: BLEU }}>
          {logoUrl ? <img src={logoUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : (commerce.trim()[0] || 'F').toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, ...MUTED }}>{mode === 'immediat' ? 'À retirer tout de suite' : 'Tirage au sort · date à préciser'}</div>
          <div data-ticket-nom style={{ fontSize: 17, fontWeight: 900, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lot.nom.trim() || 'Votre lot'}</div>
        </div>
        {v !== null && <span data-ticket-valeur style={{ background: BLEU, color: '#fff', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>Valeur {eur(v)}</span>}
      </div>
      <div style={{ borderTop: `1.5px dashed ${C.bordureChamp}`, margin: '8px 0', paddingTop: 8, fontSize: 13.5, fontWeight: 600, ...(lot.conditions.trim() ? {} : MUTED) }}>{lot.conditions.trim() || 'Conditions d’utilisation'}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: 700 }}>
        <span data-ticket-cessible style={{ background: lot.cessible ? '#E7F6EC' : '#EEF2F7', borderRadius: 99, padding: '2px 9px' }}>{lot.cessible ? 'Cessible à un tiers' : 'Non cessible'}</span>
        <span style={MUTED}>{valid}</span>
      </div>
    </div>
  )
}

/** Mini roue : une part par case, couleur par type. */
function MiniRoue({ cases }: { cases: SegmentRoue[] }) {
  const n = Math.max(cases.length, 1)
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true" data-mini-roue={cases.length}>
      {cases.length === 0 ? <circle cx="66" cy="66" r="60" fill="#E3E9F8" /> : cases.map((c, k) => {
        const a1 = (k / n) * Math.PI * 2 - Math.PI / 2, a2 = ((k + 1) / n) * Math.PI * 2 - Math.PI / 2
        const p = (a: number) => `${66 + 60 * Math.cos(a)} ${66 + 60 * Math.sin(a)}`
        return n === 1 ? <circle key={k} cx="66" cy="66" r="60" fill={c.color} /> : <path key={k} d={`M66 66 L${p(a1)} A60 60 0 0 1 ${p(a2)} Z`} fill={c.color} stroke="#fff" strokeWidth="2" />
      })}
      <circle cx="66" cy="66" r="10" fill="#fff" />
    </svg>
  )
}

export default function LotsEcran({ lots, setLots, lotI, setLotI, mode, spin, nbPerdu, setNbPerdu, nbTicket, setNbTicket, commerce, logoUrl, maxLots = 5 }: {
  lots: LotC[]; setLots: (f: (ls: LotC[]) => LotC[]) => void; lotI: number; setLotI: (k: number) => void
  mode: 'immediat' | 'tirage'; spin: boolean
  nbPerdu: number; setNbPerdu: (n: number) => void; nbTicket: number; setNbTicket: (n: number) => void
  commerce: string; logoUrl: string | null; maxLots?: number
}) {
  const [volet, setVolet] = useState(0)
  const lot = lots[Math.min(lotI, lots.length - 1)]
  const maj = (patch: Partial<LotC>) => setLots(ls => ls.map(l => (l.id === lot.id ? { ...l, ...patch } : l)))
  const volets = spin ? ['Quoi', 'Combien', 'La roue'] : ['Quoi', 'Combien']
  const cases = casesRoue(lots.filter(l => l.nom.trim()), nbPerdu, nbTicket)
  const lotNeuf = !lot.nom.trim() && !lot.conditions.trim()
  const nom = (l: LotC, k: number) => l.nom.trim() ? (l.nom.trim().length > 13 ? l.nom.trim().slice(0, 12) + '…' : l.nom.trim()) : `Lot ${k + 1}`
  return (
    <div data-lots-ecran>
      <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>{spin ? 'Lot de la roue' : 'Votre lot'}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        {lots.map((l, k) => <button key={l.id} type="button" data-lot-onglet={k} style={puce(l.id === lot.id)} onClick={() => { setLotI(k); setVolet(0) }}>{nom(l, k)}</button>)}
        {lots.length < maxLots && <button type="button" data-lot-ajout style={{ ...puce(false), color: BLEU }} onClick={() => { setLots(ls => ls.concat([lotVide()])); setLotI(lots.length); setVolet(0) }}>+ Lot</button>}
      </div>
      <TicketApercu lot={lot} mode={mode} commerce={commerce} logoUrl={logoUrl} vide={lotNeuf} />
      <div role="tablist" aria-label="Volets du lot" style={{ display: 'flex', gap: 6, margin: '10px 0' }}>
        {volets.map((t, k) => <button key={t} type="button" role="tab" aria-selected={volet === k} data-volet={k} style={{ ...puce(volet === k), flex: 1, padding: '0 6px' }} onClick={() => setVolet(k)}>{t}</button>)}
      </div>

      {volet === 0 && (
        <div data-volet-ecran="quoi">
          <Champ l="Intitulé du produit"><input data-lot-nom style={IN} value={lot.nom} onChange={e => maj({ nom: e.target.value })} placeholder="Ex. Un café offert" /></Champ>
          <Champ l="Conditions d’utilisation"><textarea data-lot-cond style={{ ...IN, minHeight: 64, resize: 'none' }} value={lot.conditions} onChange={e => maj({ conditions: e.target.value })} placeholder="Ex. Un café offert pour un bagel acheté" /></Champ>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CONDITIONS_TYPE.map(c => <button key={c} type="button" data-condition-type style={{ ...puce(false), fontSize: 12.5, background: '#F1F5FB' }} onClick={() => maj({ conditions: lot.conditions.trim() ? `${lot.conditions.trim()}. ${c}` : c })}>{c}</button>)}
          </div>
        </div>
      )}

      {volet === 1 && (
        <div data-volet-ecran="combien">
          <span style={LAB}>Cessible à un tiers</span>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button type="button" data-cessible="oui" style={{ ...puce(lot.cessible), flex: 1 }} onClick={() => maj({ cessible: true })}>Oui</button>
            <button type="button" data-cessible="non" style={{ ...puce(!lot.cessible), flex: 1 }} onClick={() => maj({ cessible: false })}>Non</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'end' }}>
            <div><span style={LAB}>Quantité</span><Stepper v={lot.quantite} set={n => maj({ quantite: n })} min={1} label="Quantité" data="quantite" /></div>
            <Champ l="Valeur (€), facultative"><input data-lot-valeur style={IN} inputMode="decimal" value={lot.valeur} onChange={e => maj({ valeur: e.target.value })} placeholder="Ex. 3" /></Champ>
          </div>
          <span style={LAB}>Validité</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([['sans', 'Sans limite'], ['jours', 'En jours'], ['dates', 'Du … au …']] as [Validite, string][]).map(([k, t]) =>
              <button key={k} type="button" data-validite={k} style={puce(lot.validite === k)} onClick={() => maj({ validite: k })}>{t}</button>)}
          </div>
          {lot.validite === 'jours' && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><input data-lot-jours style={{ ...IN, width: 90 }} type="number" min={1} value={lot.jours} onChange={e => maj({ jours: Number(e.target.value) || 0 })} /><b style={{ fontSize: 14 }}>jours après le gain</b></div>}
          {lot.validite === 'dates' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <Champ l="Du"><input data-lot-du style={IN} type="date" value={lot.du} onChange={e => maj({ du: e.target.value })} /></Champ>
            <Champ l="Au"><input data-lot-au style={IN} type="date" value={lot.au} onChange={e => maj({ au: e.target.value })} /></Champ>
          </div>}
        </div>
      )}

      {volet === 2 && spin && (
        <div data-volet-ecran="roue">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MiniRoue cases={cases} />
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.7 }}>
              <div><span style={{ color: BLEU }}>●</span> Lot à retirer tout de suite : {cases.filter(c => c.type === 'lot').length}</div>
              <div><span style={{ color: '#94A3B8' }}>●</span> Perdu : {nbPerdu}</div>
              <div><span style={{ color: '#F5A100' }}>●</span> Ticket prochain tirage : {nbTicket}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}><b style={{ fontSize: 14 }}>Cases perdues</b><Stepper v={nbPerdu} set={setNbPerdu} min={1} max={12} label="Cases perdues" data="perdu" /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}><b style={{ fontSize: 14 }}>Tickets pour le prochain tirage</b><Stepper v={nbTicket} set={setNbTicket} min={0} max={12} label="Tickets" data="ticket" /></div>
          <div style={{ marginTop: 12 }}>
            <span style={LAB}>Texte du lot par date (facultatif)</span>
            {lot.textes.map((t, k) => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '132px 1fr', gap: 6, marginBottom: 6 }}>
                <input data-texte-date style={IN} type="date" aria-label="Date" value={t.date} onChange={e => maj({ textes: lot.textes.map((x, j) => j === k ? { ...x, date: e.target.value } : x) })} />
                <input data-texte-texte style={IN} aria-label="Texte du lot ce jour-là" value={t.texte} placeholder="Ex. Bagels offerts" onChange={e => maj({ textes: lot.textes.map((x, j) => j === k ? { ...x, texte: e.target.value } : x) })} />
              </div>
            ))}
            <button type="button" data-texte-ajout style={{ ...puce(false), color: BLEU }} onClick={() => maj({ textes: lot.textes.concat([{ date: '', texte: '' }]) })}>+ Un autre jour</button>
          </div>
        </div>
      )}
    </div>
  )
}
