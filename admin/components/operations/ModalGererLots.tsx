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
 *
 * REDESIGN (Romain, 20/09) : « il y a beaucoup d'informations et ce n'est pas
 * très intuitif [...] il manque surtout la visualisation des gagnants avec
 * les bons utilisés et non utilisés [...] pouvoir relancer les gagnants qui
 * n'ont pas utilisé les bons et remercier les autres ». Chaque lot est
 * maintenant une carte repliée par defaut (resume : nom, valeur, stock,
 * gagnants) qui s'ouvre sur 3 blocs distincts -- Paramètres / Stock & billet /
 * Gagnants -- au lieu d'un unique formulaire toujours deploye. Le bloc
 * Gagnants ajoute ce qui manquait : compteur utilisés/non utilisés, selection,
 * et un texte de relance/remerciement personnalisable ({prenom}/{lien}),
 * envoye via les memes liens Gmail/WhatsApp prerempli que partout ailleurs
 * dans l'app (aucun envoi serveur).
 */
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DonneesOperation, PartenaireMin, GagnantOperation } from '@/lib/operations'
import BilletApercu from '@/components/parcours/BilletApercu'
import { ajouterStock, retirerStock } from '@/lib/stock'
import { lienGmailTo, lienWhatsApp } from '@/lib/messaging'
import { ACCENT_SUPER, ACCENT_ANIM } from '@/lib/charte'

const BRD = 'var(--sa-border, #E2E8F0)'
const MUT = 'var(--sa-muted, #64748B)'
const SUBT = 'var(--sa-subtle, #F8FAFC)'
const CARDBG = 'var(--sa-card, #FFFFFF)'
const ACC = 'var(--sa-accent, #2563EB)'
const BASE = 'https://flowin-events.vercel.app'

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

/* Petit intitulé de sous-section, identique pour Paramètres / Stock & billet /
   Gagnants -- meme hierarchie visuelle partout dans la carte d un lot. */
function SousTitre({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 800, color: MUT, textTransform: 'uppercase', letterSpacing: '.04em', margin: '12px 0 6px' }}>{children}</div>
}

/* Meme gabarit que .sa-chip (globals.css) -- police 11/700, padding 2px 8px --
   pour que ces badges se fondent dans le reste de l app au lieu de trancher
   (Romain, 20/09 : « pousse l'UX », suite a « cette vignette est moche »
   sur la 1ere version, plus lourde). Reserve aux infos qui demandent une
   action ou une attention (stock bas, gagnants a relancer) ; le reste (nom,
   valeur, quantite, type) est du texte simple, pas des pastilles. */
function badgeStyle(couleur: 'gris' | 'ambre' | 'vert'): React.CSSProperties {
  const c = { gris: ['#64748B', 'rgba(100,116,139,.1)'], ambre: ['#B45309', 'rgba(245,158,11,.13)'], vert: ['#15803D', 'rgba(34,197,94,.1)'] }[couleur]
  return { fontSize: 11, fontWeight: 700, color: c[0], background: c[1], borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap' }
}

/* Le vrai lien du billet (celui du gagnant, pas l apercu) -- meme URL que
   GagnantsClient/ParcoursOutro ("voir le billet"). */
const lienBillet = (token: string | null) => token ? `${BASE}/nds/billets-partenaires.html?t=${encodeURIComponent(token)}` : ''

/* {prenom}/{lot}/{lien} remplaces par personnaliser() -- un seul texte modifiable
   sert a tout le monde, chacun reçoit sa propre version (prenom + son billet). */
const texteRelanceParDefaut = (opNom: string) =>
  `Bonjour {prenom},\n\nVous avez gagné « {lot} » lors de ${opNom} — merci d'avoir joué !\nNous n'avons pas encore de vos nouvelles pour le retrait : présentez-vous en boutique dès que possible pour en profiter.\n{lien}\n\nÀ très vite !`
const texteMerciParDefaut = (opNom: string) =>
  `Bonjour {prenom},\n\nMerci d'être passé récupérer « {lot} » lors de ${opNom} ! Nous espérons que ça vous a plu.\n\nÀ très vite pour de nouvelles animations !`

function personnaliser(texte: string, g: GagnantOperation): string {
  const prenom = (g.joueurNom ?? '').trim().split(/\s+/)[0] || 'à vous'
  const lien = lienBillet(g.retraitToken)
  return texte
    .replace(/\{prenom\}/g, prenom)
    .replace(/\{lot\}/g, g.lotNom ?? 'ce lot')
    .replace(/\{lien\}/g, lien ? `Votre billet : ${lien}` : '')
}

/** Bloc gagnants d'un lot : compteur utilisés/non utilisés, selection,
 *  relance/remerciement personnalisable, envoye en liens individuels
 *  (Gmail "to:" / WhatsApp) -- jamais de BCC ici, chaque texte est different
 *  d une personne a l autre (prenom, lien de billet). */
function PanneauGagnants({ billets, opNom }: { billets: GagnantOperation[]; opNom: string }) {
  const [selection, setSelection] = useState<Record<number, boolean>>({})
  const [canal, setCanal] = useState<'email' | 'whatsapp'>('email')
  const [objet, setObjet] = useState('')
  const [texte, setTexte] = useState('')

  const nonRetires = billets.filter(g => g.etat !== 'retire')
  const retires = billets.filter(g => g.etat === 'retire')
  const selectionnes = billets.filter(g => selection[g.id])

  function basculer(id: number) {
    setSelection(s => ({ ...s, [id]: !s[id] }))
  }
  function selectionnerGroupe(groupe: GagnantOperation[], objetParDefaut: string, texteParDefaut: string) {
    const m: Record<number, boolean> = {}
    groupe.forEach(g => { m[g.id] = true })
    setSelection(m)
    setObjet(objetParDefaut)
    setTexte(texteParDefaut)
  }

  if (billets.length === 0) {
    return <div style={{ fontSize: 12, color: MUT }}>Aucun gagnant sur ce lot pour l&apos;instant.</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={badgeStyle('gris')}>{billets.length} gagnant{billets.length > 1 ? 's' : ''}</span>
        {nonRetires.length > 0 && <span style={badgeStyle('ambre')}>⏳ {nonRetires.length} à relancer</span>}
        {retires.length > 0 && <span style={badgeStyle('vert')}>✅ {retires.length} utilisé{retires.length > 1 ? 's' : ''}</span>}
      </div>

      <div style={{ maxHeight: 180, overflowY: 'auto', border: `1px solid ${BRD}`, borderRadius: 8 }}>
        {billets.map(g => (
          <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderTop: `1px solid ${BRD}`, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!selection[g.id]} onChange={() => basculer(g.id)} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <b>{g.joueurNom ?? 'Joueur'}</b>
              <span style={{ color: MUT }}> — {g.etat === 'retire' ? '✅ utilisé' : g.etat === 'confirme' ? '📞 confirmé, à retirer' : '⏳ à confirmer'}</span>
            </span>
            {g.retireAt && <span style={{ color: MUT, fontSize: 11 }}>{new Date(g.retireAt).toLocaleDateString('fr-FR')}</span>}
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button
          style={{ border: `1px solid ${BRD}`, background: '#fff', borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
          disabled={!nonRetires.length}
          onClick={() => selectionnerGroupe(nonRetires, `Votre lot vous attend — ${opNom}`, texteRelanceParDefaut(opNom))}>
          📣 Relancer les non utilisés ({nonRetires.length})
        </button>
        <button
          style={{ border: `1px solid ${BRD}`, background: '#fff', borderRadius: 8, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}
          disabled={!retires.length}
          onClick={() => selectionnerGroupe(retires, `Merci d'avoir joué — ${opNom}`, texteMerciParDefaut(opNom))}>
          🙏 Remercier ceux qui ont utilisé ({retires.length})
        </button>
        {selectionnes.length > 0 && (
          <button style={{ border: 'none', background: 'none', color: MUT, fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setSelection({})}>Tout désélectionner</button>
        )}
      </div>

      {selectionnes.length > 0 && (
        <div style={{ border: `1px solid ${BRD}`, borderRadius: 10, padding: 10, marginTop: 8, background: SUBT }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => setCanal('email')}
              style={{ border: `1px solid ${BRD}`, background: canal === 'email' ? ACC : '#fff', color: canal === 'email' ? '#fff' : '#0F172A', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✉️ Email</button>
            <button type="button" onClick={() => setCanal('whatsapp')}
              style={{ border: `1px solid ${BRD}`, background: canal === 'whatsapp' ? ACC : '#fff', color: canal === 'whatsapp' ? '#fff' : '#0F172A', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>💬 WhatsApp</button>
          </div>
          {canal === 'email' && (
            <input value={objet} onChange={e => setObjet(e.target.value)} placeholder="Objet"
              style={{ display: 'block', width: '100%', marginBottom: 6, border: `1px solid ${BRD}`, borderRadius: 8, padding: '6px 8px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
          )}
          <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={5}
            style={{ display: 'block', width: '100%', border: `1px solid ${BRD}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }} />
          <div style={{ fontSize: 10.5, color: MUT, margin: '4px 0 8px' }}>
            {'{prenom}'}, {'{lot}'} et {'{lien}'} (lien du billet) sont remplacés automatiquement pour chaque gagnant — le texte est différent pour chacun, pas d&apos;envoi groupé identique.
          </div>

          <div style={{ fontSize: 10.5, fontWeight: 800, color: MUT, textTransform: 'uppercase', marginBottom: 4 }}>
            {canal === 'email' ? 'Un lien par personne (aucun envoi automatique) :' : 'Une conversation par personne :'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {selectionnes.map(g => {
              const dispo = canal === 'email' ? !!g.joueurEmail : !!g.joueurTel
              if (!dispo) {
                return <span key={g.id} style={{ fontSize: 11.5, color: MUT }}>{g.joueurNom ?? 'Joueur'} — {canal === 'email' ? 'pas d’email' : 'pas de téléphone'} connu.</span>
              }
              const href = canal === 'email'
                ? lienGmailTo(g.joueurEmail!, objet, personnaliser(texte, g))
                : lienWhatsApp(g.joueurTel!, personnaliser(texte, g))
              return (
                <a key={g.id} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', justifyContent: 'space-between', border: `1px solid ${BRD}`, background: '#fff', borderRadius: 8, padding: '5px 9px', fontSize: 12, textDecoration: 'none', color: '#0F172A' }}>
                  <span>{canal === 'email' ? '✉️' : '💬'} {g.joueurNom ?? 'Joueur'}</span>
                  <span style={{ color: MUT }}>{canal === 'email' ? g.joueurEmail : g.joueurTel}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** Une carte de lot, repliee par defaut : un resume cliquable, puis 3 blocs
 *  (Parametres / Stock & billet / Gagnants) une fois ouverte. */
function CarteLot({ l, enSuperEvent, stockInfo, dAjust, onAjuste, maj, op, station, partenaire, billets }: {
  l: LotLigne; enSuperEvent: boolean; stockInfo: { total: number; dispo: number } | undefined; dAjust: number
  onAjuste: (delta: number) => void; maj: (id: string, champ: keyof LotLigne, v: string | number | null) => void
  op: DonneesOperation; station: DonneesOperation['stations'][number]; partenaire: PartenaireMin | null; billets: GagnantOperation[]
}) {
  const [ouvert, setOuvert] = useState(false)
  const nonRetires = billets.filter(g => g.etat !== 'retire').length
  const accent = enSuperEvent ? ACCENT_SUPER : ACCENT_ANIM
  const typeLabel = enSuperEvent ? 'Tirage au sort' : (estInstant(l.note) ? 'Gain immédiat' : 'Tirage au sort')
  const stockBas = stockInfo && (stockInfo.dispo + dAjust) <= 0

  return (
    <div style={{ border: `1px solid ${BRD}`, borderLeft: `3px solid ${accent}`, borderRadius: 12, marginBottom: 10, background: SUBT, overflow: 'hidden' }}>
      {/* Repliee par defaut : nom + resume en texte simple (pas de mur de
          pastilles) -- seules les infos qui demandent une action (stock
          epuise, gagnants a relancer) ressortent en badge colore. */}
      <button onClick={() => setOuvert(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: '11px 14px', fontFamily: 'inherit' }}>
        <span style={{ fontSize: 11, color: MUT, transform: ouvert ? 'rotate(90deg)' : 'none', transition: 'transform .12s', flexShrink: 0 }}>▶</span>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>{(l.nom ?? '').trim() || 'Nouveau lot'}</div>
          <div style={{ fontSize: 11.5, color: MUT, marginTop: 1 }}>
            {(l.valeur ?? 0).toLocaleString('fr-FR')} € · × {l.quantite ?? 1} · {typeLabel}{enSuperEvent ? ' (verrouillé)' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {stockInfo && stockBas && <span style={badgeStyle('ambre')}>stock épuisé</span>}
          {nonRetires > 0 && <span style={badgeStyle('ambre')}>{nonRetires} à relancer</span>}
          {billets.length > 0 && nonRetires === 0 && <span style={badgeStyle('vert')}>{billets.length} gagnant{billets.length > 1 ? 's' : ''}</span>}
        </div>
      </button>

      {ouvert && (
        <div style={{ padding: '0 12px 14px' }}>
          {/* Reglages a gauche, distribution (le vrai billet, en direct) a
              droite -- Romain (20/09) : « on doit pouvoir publier des lots,
              donner la quantite, les conditions, ET voir la distribution --
              fais une simulation si tu veux ». Le billet n etait avant que
              derriere un bouton "Apercu" ; il est maintenant toujours visible
              et se met a jour en direct pendant la saisie, pour voir tout de
              suite ce que le gagnant recevra. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(220px,1fr)', gap: 20 }}>
            <div>
              <SousTitre>Paramètres</SousTitre>
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
              <div style={{ display: 'grid', gridTemplateColumns: enSuperEvent ? '1fr' : '2fr 1fr', gap: 8 }}>
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
              {enSuperEvent && <div style={{ fontSize: 11, color: MUT, marginTop: 6 }}>Station de super event : tirage au sort uniquement, non modifiable ici.</div>}

              <SousTitre>Stock</SousTitre>
              {stockInfo ? (
                <AjustementStockLigne lotId={l.id} dispo={stockInfo.dispo + dAjust} total={stockInfo.total + dAjust} onAjuste={onAjuste} />
              ) : (
                <span style={{ fontSize: 11, color: MUT }}>Pas de stock unitaire géré pour ce lot — quantité déclarative uniquement.</span>
              )}
            </div>

            <div>
              <SousTitre>Distribution — ce que le gagnant reçoit</SousTitre>
              <div style={{ border: `1px solid ${BRD}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                <BilletApercu
                  commerce={partenaire?.nom ?? 'Votre commerce'}
                  lot={(l.nom ?? '').trim() || 'Lot'} valeur={l.valeur ?? 0} conditions={l.conditions}
                  operation={op.type === 'super' ? op.id : station.id} operationNom={op.nom}
                  hauteur={360}
                />
              </div>
              <div style={{ fontSize: 10.5, color: MUT, marginTop: 4 }}>Simulation en direct — se met à jour pendant la saisie.</div>
            </div>
          </div>

          <div style={{ border: `1px solid ${BRD}`, borderRadius: 10, padding: 12, marginTop: 14, background: '#fff' }}>
            <SousTitre>Gagnants — contacter ceux qui ont utilisé ou non leur lot</SousTitre>
            <PanneauGagnants billets={billets} opNom={op.nom} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function ModalGererLots({ op, partenaire, onClose, onChange }: {
  op: DonneesOperation; partenaire: PartenaireMin | null; onClose: () => void; onChange: () => void
}) {
  const [lots, setLots] = useState<LotLigne[] | null>(null)
  const [regles, setRegles] = useState<Record<string, Regle>>({})
  const [ajustements, setAjustements] = useState<Record<string, number>>({})
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: CARDBG, borderRadius: 16, width: '100%', maxWidth: 880, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${BRD}`, position: 'sticky', top: 0, background: CARDBG, zIndex: 1 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Gérer les lots</div>
            <div style={{ fontSize: 12, color: MUT }}>{op.nom} — valeur, conditions, type, stock, billet, gagnants</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: MUT, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {lots === null && <div style={{ fontSize: 13, color: MUT }}>Chargement…</div>}

          {lots !== null && op.stations.map(station => {
            const lotsStation = lots.filter(l => l.event_id === station.id)
            const enSuperEvent = !!station.super_event_id
            return (
              <div key={station.id} style={{ marginBottom: 22 }}>
                {op.stations.length > 1 && <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8 }}>{station.nom}</div>}

                {lotsStation.length === 0 && <div style={{ fontSize: 12.5, color: MUT, marginBottom: 8 }}>Aucun lot sur cette station.</div>}

                {lotsStation.map(l => {
                  const stockInfo = op.lots.find(ol => ol.id === l.id)?.stock ?? undefined
                  const dAjust = ajustements[l.id] ?? 0
                  const billets = op.gagnants.filter(g => g.lotNom === (l.nom ?? '').trim())
                  return (
                    <CarteLot key={l.id} l={l} enSuperEvent={enSuperEvent} stockInfo={stockInfo} dAjust={dAjust}
                      onAjuste={d => setAjustements(a => ({ ...a, [l.id]: (a[l.id] ?? 0) + d }))}
                      maj={maj} op={op} station={station} partenaire={partenaire} billets={billets} />
                  )
                })}

                <button onClick={() => ajouterLot(station.id)}
                  style={{ border: `1px dashed ${BRD}`, background: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', color: ACC }}>
                  + Ajouter un lot
                </button>

                {(() => {
                  const aInstant = lotsStation.some(l => estInstant(l.note))
                  const regle = regles[station.id] ?? { mode: 'aleatoire' as const, everyX: 10, probabilite: 15 }
                  if (!aInstant || enSuperEvent || station.module === 'spin') return null
                  return (
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
                  )
                })()}
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
