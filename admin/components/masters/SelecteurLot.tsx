'use client'

/**
 * SELECTEUR DE LOTS — structure et cosmetique des maquettes validees
 * (maquettes-jeux, « Sélecteur de lots » : p-lot, p-mode, p-recap).
 *
 * Tout se selectionne : lot saisi librement (pas de catalogue), quantite
 * (pas + / − et puces 10 / 25 / 50 / 100), conditions (puces + autre
 * condition ecrite), gain immediat ou tirage au sort. La date du tirage et
 * l'obligation d'achat sont reglees dans les blocs voisins du meme ecran
 * (ChoixTirage, ChoixAchat). Utilise par le pro ET par le Super Admin.
 */
import { CHARTE_PRO as C } from '@/lib/charte'
import { CHAMP, LABEL, MUTED, choix } from '@/lib/proui'
import { Ico } from '@/lib/proicons'

export interface LotSaisie { id: string; nom: string; quantite: number; valeur: number; type: 'tirage' | 'instantane'; conditions: string }

const CONDITIONS = ['Valable 30 jours', '1 par client', 'Hors promotions', 'Sur place uniquement']
const QTES = [10, 25, 50, 100]

function puce(on: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: 700, fontSize: 13.5, border: `1.5px solid ${on ? C.violet : C.bordureChamp}`, background: on ? C.violetClair : '#fff', color: on ? '#2B47A8' : C.texte,
  }
}
const pas: React.CSSProperties = { width: 46, height: 46, borderRadius: 14, border: `1.5px solid ${C.bordureChamp}`, background: '#fff', color: C.texte, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }

export default function SelecteurLot({ lot, onChange, onRetirer, retirable, avecMode }: {
  lot: LotSaisie
  onChange: (champ: keyof LotSaisie, v: string | number) => void
  onRetirer: () => void
  retirable: boolean
  /** false : pas de choix immediat / tirage (roue, super event). */
  avecMode: boolean
}) {
  const conds = lot.conditions.split(' · ').map(s => s.trim()).filter(Boolean)
  const puces = conds.filter(c => CONDITIONS.indexOf(c) >= 0)
  const autre = conds.filter(c => CONDITIONS.indexOf(c) < 0).join(' · ')
  const ecrire = (p: string[], a: string) => onChange('conditions', p.concat(a.trim() ? [a.trim()] : []).join(' · '))
  const bascule = (c: string) => ecrire(puces.indexOf(c) >= 0 ? puces.filter(x => x !== c) : puces.concat(c), autre)
  const qte = Math.max(1, Number(lot.quantite) || 1)

  return (
    <div style={{ border: `1.5px solid ${C.bordureChamp}`, borderRadius: 18, padding: 16, marginBottom: 14, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-.02em' }}>Qu’offrez-vous ?</div>
        <button type="button" aria-label="Retirer ce lot" disabled={!retirable} onClick={onRetirer}
          style={{ border: 'none', background: 'none', cursor: retirable ? 'pointer' : 'default', opacity: retirable ? 1 : 0.25, color: '#B91C1C', display: 'inline-flex' }}><Ico k="trash" size={16} /></button>
      </div>

      <label style={{ display: 'block', marginTop: 12 }}>
        <span style={LABEL}>Votre lot <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>· texte libre</span></span>
        <input style={CHAMP} value={lot.nom} onChange={e => onChange('nom', e.target.value)} placeholder="Ex. Une baguette tradition offerte" />
      </label>
      <div style={{ fontSize: 12.5, ...MUTED, margin: '6px 0 14px' }}>Un produit, une remise, un service, un bon d’achat : écrivez-le avec vos mots.</div>

      <div style={LABEL}>Quantité <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>· stock total</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" aria-label="Moins" style={pas} onClick={() => onChange('quantite', Math.max(1, qte - 5))}><Ico k="minus" size={18} /></button>
        <b style={{ minWidth: 56, textAlign: 'center', fontSize: 26, fontWeight: 900 }}>{qte}</b>
        <button type="button" aria-label="Plus" style={pas} onClick={() => onChange('quantite', qte + 5)}><Ico k="plus" size={18} /></button>
        <label style={{ marginLeft: 'auto', width: 110 }}><span style={LABEL}>Valeur €</span>
          <input style={CHAMP} type="number" min={0} value={lot.valeur} onChange={e => onChange('valeur', Number(e.target.value))} /></label>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {QTES.map(q => <button key={q} type="button" style={puce(qte === q)} onClick={() => onChange('quantite', q)}>{q}</button>)}
      </div>

      <div style={{ ...LABEL, marginTop: 16 }}>Conditions <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>· touchez pour ajouter</span></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CONDITIONS.map(c => <button key={c} type="button" style={puce(puces.indexOf(c) >= 0)} onClick={() => bascule(c)}>{puces.indexOf(c) >= 0 && <Ico k="check" size={14} />}{c}</button>)}
      </div>
      <input style={{ ...CHAMP, marginTop: 10 }} aria-label="Autre condition" value={autre} onChange={e => ecrire(puces, e.target.value)} placeholder="Autre condition : à écrire" />

      {avecMode && (
        <>
          <div style={{ fontSize: 16, fontWeight: 900, margin: '18px 0 8px' }}>Comment se gagne ce lot ?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
            {([['instantane', 'Gain immédiat', 'Le joueur gagne tout de suite : billet QR à présenter en caisse.', 'qr'], ['tirage', 'Tirage au sort', 'Chaque partie donne un ticket ; le gagnant est tiré à la date choisie.', 'ticket']] as const).map(([v, t, d, ic]) => (
              <button key={v} type="button" style={{ ...choix(lot.type === v), display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => onChange('type', v)}>
                <span style={{ width: 48, height: 48, borderRadius: 14, background: lot.type === v ? '#fff' : C.violetClair, color: C.violet, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ico k={ic === 'qr' ? 'scan' : 'ticket'} size={22} /></span>
                <span><b style={{ display: 'block', fontSize: 15 }}>{t}</b><span style={{ fontSize: 12.5, ...MUTED }}>{d}</span></span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Recapitulatif des lots (cartes avec stock), comme l'ecran « Vos lots » de la maquette. */
export function RecapLots({ lots, achat, tirage }: { lots: LotSaisie[]; achat: boolean; tirage: string }) {
  const n = lots.filter(l => l.nom.trim())
  if (!n.length) return null
  const total = n.reduce((s, l) => s + (Number(l.quantite) || 0), 0)
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-.02em' }}>Vos lots</div>
      <div style={{ fontSize: 13, ...MUTED, margin: '4px 0 10px' }}>{n.length} lot{n.length > 1 ? 's' : ''} · {total} unités · {achat ? 'avec' : 'sans'} obligation d’achat{tirage ? ` · tirage ${tirage}` : ''}</div>
      {n.map(l => (
        <div key={l.id} style={{ display: 'flex', gap: 12, alignItems: 'center', border: `1.5px solid ${C.bordure}`, borderRadius: 18, padding: '12px 14px', marginBottom: 8, background: '#fff' }}>
          <span style={{ width: 52, height: 52, borderRadius: 16, background: l.valeur > 0 ? '#fff' : C.violetClair, border: l.valeur > 0 ? '1.5px solid #F59E0B' : 'none', color: l.valeur > 0 ? '#8a5e12' : '#2B47A8', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 900, lineHeight: 1, flexShrink: 0 }}>
            <span style={{ fontSize: 19 }}>{l.valeur > 0 ? l.valeur : 1}</span><span style={{ fontSize: 9, letterSpacing: '.08em', marginTop: 3 }}>{l.valeur > 0 ? '€' : 'LOT'}</span>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b style={{ display: 'block', fontSize: 15 }}>{l.nom}</b>
            <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 100, background: l.type === 'instantane' ? '#DDF3F0' : '#fff', border: l.type === 'instantane' ? 'none' : '1.5px solid #AEBBCD', color: l.type === 'instantane' ? '#0B6F67' : C.texte }}>{l.type === 'instantane' ? 'Gain immédiat' : 'Tirage au sort'}</span>
          </span>
          <b style={{ fontSize: 12.5, color: C.attenue, whiteSpace: 'nowrap' }}>{l.quantite} en stock</b>
        </div>
      ))}
    </div>
  )
}

/** Logo « SUPER event » en lettrage comics (maquettes Super event pro) — entete des parcours super event. */
export const SUPER_LOGO_CSS = `@import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');
.fm-super-logo{font-family:'Bangers',cursive;font-weight:400;text-transform:uppercase;color:#FFD23F;letter-spacing:.05em;display:inline-block;padding:0 .14em 0 .06em;line-height:1;-webkit-text-stroke:.06em #1B3A5C;paint-order:stroke fill;text-shadow:.035em .035em 0 #E2231A,.07em .07em 0 #E2231A}
.fm-se-word{font-family:'Bangers',cursive;font-weight:400;color:#1B3A5C;letter-spacing:.05em;text-transform:uppercase;display:inline-block;transform:rotate(-4deg)}`
export function LogoSuperEvent({ taille = 30 }: { taille?: number }) {
  return (
    <span aria-label="Super event">
      <style dangerouslySetInnerHTML={{ __html: SUPER_LOGO_CSS }} />
      <span className="fm-super-logo" style={{ fontSize: taille }}>Super</span>{' '}
      <span className="fm-se-word" style={{ fontSize: Math.round(taille * 0.82) }}>event</span>
    </span>
  )
}

/** Carte « super event » a choisir : monogramme, nom, dates, jeu, pastille de choix (maquette se-rejoindre). */
export function CarteSuperEvent({ nom, dates, jeu, actif, onClick }: { nom: string; dates: string; jeu: string; actif: boolean; onClick: () => void }) {
  const mono = nom.split(/\s+/).filter(m => m && ['de', 'des', 'du', 'la', 'le', 'les', 'd', 'l'].indexOf(m.toLowerCase()) < 0).slice(0, 2).map(m => m[0]).join('').toUpperCase() || 'SE'
  return (
    <button type="button" onClick={onClick} aria-pressed={actif}
      style={{ ...choix(actif), display: 'flex', alignItems: 'center', gap: 14, width: '100%', borderColor: actif ? '#E2231A' : C.bordureChamp, background: actif ? '#FFF8EA' : '#fff' }}>
      <span style={{ width: 46, height: 46, borderRadius: 14, background: '#FFD23F', color: '#1B3A5C', border: '2.5px solid #1B3A5C', boxShadow: '2px 2px 0 #E2231A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{mono}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ display: 'block', fontSize: 15.5 }}>{nom}</b>
        <span style={{ display: 'block', fontSize: 12.5, ...MUTED, marginTop: 2 }}>{dates}</span>
        <span style={{ display: 'inline-block', marginTop: 5, fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 100, background: C.subtil, border: `1px solid ${C.bordure}`, color: '#3a4d63' }}>{jeu}</span>
      </span>
      <span style={{ width: 24, height: 24, borderRadius: 999, border: `2px solid ${actif ? '#E2231A' : C.bordureChamp}`, background: actif ? '#E2231A' : '#fff', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{actif && <Ico k="check" size={14} />}</span>
    </button>
  )
}
