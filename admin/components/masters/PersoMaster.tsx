'use client'

/**
 * CHOIX DU MASTER ET PERSONNALISATION — bloc du parcours de creation unique
 * (components/creation/ParcoursCreation.tsx), donc identique cote pro et cote
 * Super Admin.
 *
 * Le master fixe la presentation (memes ecrans pour tous) ; le commerce ne
 * renseigne que ce qui lui est propre : logo, image d'accueil, fiche commerce,
 * textes du vote. Les questions, cases, candidats et lots restent saisis aux
 * endroits habituels du parcours (ils sont lus par le master). Tout est stocke
 * dans events.cfg.master = { id, perso } (aucune colonne nouvelle).
 */
import { useState } from 'react'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CHAMP, LABEL, MUTED, choix } from '@/lib/proui'
import { uploaderLogo, redimensionnerImage } from '@/lib/upload'
import { MASTERS, masterPourModule } from '@/lib/masters/defs'
import type { ContenuMaster } from '@/lib/masters/types'

export interface EtatMaster { actif: boolean; perso: ContenuMaster }
export const MASTER_VIDE: EtatMaster = { actif: true, perso: {} }

/** Ce que l'event stocke (a fusionner dans cfg). */
export function cfgMaster(module: string | null, m: EtatMaster): Record<string, unknown> {
  const id = masterPourModule(module)
  if (!id) return {}
  /* « Ancienne presentation » : masterOff garde l'ancien parcours (lib/masters/redirection.ts). */
  if (!m.actif) return { masterOff: true }
  return { master: { id, perso: nettoyer(m.perso) } }
}

function nettoyer(p: ContenuMaster): ContenuMaster {
  const out: Record<string, unknown> = {}
  Object.keys(p).forEach(k => {
    const v = (p as Record<string, unknown>)[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const sous: Record<string, unknown> = {}
      Object.keys(v as Record<string, unknown>).forEach(k2 => { const x = (v as Record<string, unknown>)[k2]; if (typeof x === 'string' ? x.trim() : x) sous[k2] = typeof x === 'string' ? x.trim() : x })
      if (Object.keys(sous).length) out[k] = sous
    } else if (typeof v === 'string' ? v.trim() : v) out[k] = typeof v === 'string' ? v.trim() : v
  })
  return out as ContenuMaster
}

export default function PersoMaster({ module, valeur, onChange, prefixeUpload }: {
  module: string | null
  valeur: EtatMaster
  onChange: (m: EtatMaster) => void
  prefixeUpload: string
}) {
  const id = masterPourModule(module)
  const [envoi, setEnvoi] = useState<'' | 'logo' | 'hero'>('')
  const [erreur, setErreur] = useState('')
  if (!id) return null
  const def = MASTERS[id]
  const p = valeur.perso
  const majCommerce = (k: string, v: string) => onChange({ ...valeur, perso: { ...p, commerce: { ...(p.commerce || {}), [k]: v } } })
  const majImages = (k: string, v: string) => onChange({ ...valeur, perso: { ...p, images: { ...(p.images || {}), [k]: v } } })

  async function televerser(f: File | undefined, cible: 'logo' | 'hero') {
    if (!f) return
    setEnvoi(cible); setErreur('')
    const redim = await redimensionnerImage(f, cible === 'logo' ? 512 : 1200)
    const r = await uploaderLogo(redim, `masters/${prefixeUpload || 'animation'}`)
    setEnvoi('')
    if ('erreur' in r) { setErreur('Image non envoyée : ' + r.erreur); return }
    if (cible === 'logo') majCommerce('logoUrl', r.url); else majImages('hero', r.url)
  }

  return (
    <div style={{ marginTop: 18, border: `1.5px solid ${C.bordure}`, borderRadius: 16, padding: 16, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ width: 12, height: 12, borderRadius: 999, background: def.couleur }} />
        <div style={{ fontSize: 15, fontWeight: 800 }}>Présentation : master « {def.nom} »</div>
      </div>
      <div style={{ fontSize: 12.5, ...MUTED, margin: '4px 0 12px', lineHeight: 1.5 }}>
        Les écrans sont ceux du gabarit de référence Flowin : mêmes écrans pour tous les commerces. Vous ajoutez votre logo, une image et votre fiche ; vos questions, cases et lots sont repris tels que saisis.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button type="button" style={{ ...choix(valeur.actif), padding: '9px 14px' }} onClick={() => onChange({ ...valeur, actif: true })}>Master Flowin (recommandé)</button>
        <button type="button" style={{ ...choix(!valeur.actif), padding: '9px 14px' }} onClick={() => onChange({ ...valeur, actif: false })}>Ancienne présentation</button>
      </div>
      {valeur.actif && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <div>
              <span style={LABEL}>Logo du commerce</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {p.commerce?.logoUrl && <img src={p.commerce.logoUrl} alt="" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10, border: `1px solid ${C.bordure}`, background: '#fff' }} />}
                <label style={{ fontSize: 13, fontWeight: 700, color: C.accent, cursor: 'pointer' }}>
                  {envoi === 'logo' ? 'Envoi…' : p.commerce?.logoUrl ? 'Changer' : 'Choisir une image'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => televerser(e.target.files?.[0], 'logo')} />
                </label>
                {p.commerce?.logoUrl && <button type="button" style={{ border: 'none', background: 'none', color: C.attenue, cursor: 'pointer', fontSize: 12.5 }} onClick={() => majCommerce('logoUrl', '')}>Retirer</button>}
              </div>
            </div>
            {id === 'quiz' && (
              <div>
                <span style={LABEL}>Image d’accueil (facultatif)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.images?.hero && <img src={p.images.hero} alt="" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.bordure}` }} />}
                  <label style={{ fontSize: 13, fontWeight: 700, color: C.accent, cursor: 'pointer' }}>
                    {envoi === 'hero' ? 'Envoi…' : p.images?.hero ? 'Changer' : 'Choisir une image'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => televerser(e.target.files?.[0], 'hero')} />
                  </label>
                </div>
              </div>
            )}
          </div>
          {erreur && <div style={{ fontSize: 12.5, color: '#B45309', fontWeight: 700, marginTop: 8 }}>{erreur}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 12 }}>
            <label><span style={LABEL}>Activité (fiche commerce)</span><input style={CHAMP} value={p.commerce?.activite || ''} onChange={e => majCommerce('activite', e.target.value)} placeholder="Ex. boulangerie artisanale" /></label>
            <label><span style={LABEL}>Horaires</span><input style={CHAMP} value={p.commerce?.horaires || ''} onChange={e => majCommerce('horaires', e.target.value)} placeholder="Ex. du mardi au samedi, 7 h – 19 h" /></label>
            <label><span style={LABEL}>Site web</span><input style={CHAMP} value={p.commerce?.site || ''} onChange={e => majCommerce('site', e.target.value)} placeholder="https://…" /></label>
          </div>
          {id === 'vote' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 12 }}>
              <label><span style={LABEL}>Petit titre du vote</span><input style={CHAMP} value={p.voteKicker || ''} onChange={e => onChange({ ...valeur, perso: { ...p, voteKicker: e.target.value } })} placeholder={def.defauts.voteKicker} /></label>
              <label><span style={LABEL}>Question du vote</span><input style={CHAMP} value={p.voteTitre || ''} onChange={e => onChange({ ...valeur, perso: { ...p, voteTitre: e.target.value } })} placeholder={def.defauts.voteTitre} /></label>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** Choix « avec / sans obligation d'achat » (affiche tel quel aux joueurs). */
export function ChoixAchat({ valeur, onChange }: { valeur: { obligatoire: boolean; montantMin: string }; onChange: (v: { obligatoire: boolean; montantMin: string }) => void }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Pour jouer, il faut…</div>
      <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 10 }}>Ce choix s’affiche aux joueurs sur l’accueil et dans les règles du jeu.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
        <button type="button" style={{ ...choix(!valeur.obligatoire), textAlign: 'left', padding: '12px 14px' }} onClick={() => onChange({ ...valeur, obligatoire: false })}>
          <b>Sans obligation d’achat</b><div style={{ fontSize: 12, ...MUTED, marginTop: 3 }}>Tout le monde peut jouer en flashant le QR.</div>
        </button>
        <button type="button" style={{ ...choix(valeur.obligatoire), textAlign: 'left', padding: '12px 14px' }} onClick={() => onChange({ ...valeur, obligatoire: true })}>
          <b>Avec obligation d’achat</b><div style={{ fontSize: 12, ...MUTED, marginTop: 3 }}>Le QR est remis en caisse, après un achat.</div>
        </button>
      </div>
      {valeur.obligatoire && (
        <label style={{ display: 'block', marginTop: 10, maxWidth: 260 }}><span style={LABEL}>Montant minimum d’achat (facultatif)</span>
          <input style={CHAMP} value={valeur.montantMin} onChange={e => onChange({ ...valeur, montantMin: e.target.value })} placeholder="Ex. 10 €" inputMode="decimal" /></label>
      )}
    </div>
  )
}
