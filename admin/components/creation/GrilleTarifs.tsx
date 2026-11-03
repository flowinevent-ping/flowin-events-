'use client'

import { PACKS_DEMANDE, MENTION_TARIF_A_CONFIRMER, prixAffiche, type PackDemande } from '@/lib/commercial'
import { CHARTE_PRO as C } from '@/lib/charte'

/**
 * GRILLE DE TARIFS A COCHER (03/11/2026) : les 3 packs de admin/public/nds-partenaire.html (Visibilité 500 € HT, Animation 1 490 € HT,
 * Sponsor 3 590 € HT), pour PRESELECTIONNER la demande de rejoindre un super event. Rien n'est facturé ici : « Tarif à confirmer par Flowin ».
 * Cocher à nouveau un pack le décoche (le choix est facultatif).
 */
export default function GrilleTarifs({ valeur, onChange, accent = '#C2410C', packs = PACKS_DEMANDE }: { valeur: string | null; onChange: (cle: string | null) => void; accent?: string; /** Packs du super event (lib/commercial packsPourSuperEvent) ; par defaut les 3 packs de nds-partenaire.html. */ packs?: PackDemande[] }) {
  return (
    <div data-grille-tarifs>
      <div style={{ fontSize: 14, fontWeight: 800, margin: '14px 0 4px' }}>Votre participation : cochez le pack souhaité</div>
      <div style={{ fontSize: 12.5, color: C.attenue, marginBottom: 10, lineHeight: 1.5 }}>
        Facultatif. Votre choix présélectionne la demande ; <b>{MENTION_TARIF_A_CONFIRMER}</b>, rien n’est facturé à ce stade.
      </div>
      <div role="group" aria-label="Packs de participation" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: 10 }}>
        {packs.map(p => {
          const on = valeur === p.cle
          return (
            <label key={p.cle} data-pack={p.cle} style={{ position: 'relative', display: 'block', cursor: 'pointer', background: on ? `${accent}10` : '#fff', border: `2px solid ${on ? accent : C.bordureChamp}`, borderRadius: 16, padding: '14px 14px 12px', boxSizing: 'border-box' }}>
              {p.badge && <span style={{ position: 'absolute', top: -10, right: 12, background: accent, color: '#fff', fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', borderRadius: 99, padding: '3px 9px' }}>{p.badge}</span>}
              <span style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input type="checkbox" checked={on} onChange={() => onChange(on ? null : p.cle)} aria-label={`Pack ${p.nom}, ${prixAffiche(p)}`} style={{ marginTop: 3, width: 18, height: 18, accentColor: accent, flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                    <b style={{ fontSize: 16 }}>{p.nom}</b>
                    <b style={{ fontSize: p.prixHt === null ? 13 : 16, textAlign: 'right', color: accent, whiteSpace: p.prixHt === null ? 'normal' : 'nowrap' }}>{prixAffiche(p)}</b>
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: C.attenue, marginTop: 2 }}>{p.accroche}</span>
                </span>
              </span>
              <span style={{ display: 'block', marginTop: 10, background: '#FFF7E0', border: '1px solid #F5D78A', borderRadius: 10, padding: '7px 10px', fontSize: 12.5, lineHeight: 1.4 }}>
                {p.lotEuros > 0 && <>Lot mis en jeu : <b>{p.lotEuros} € en bon d’achat</b> dans votre boutique</>}
              </span>
              <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.5 }}>
                {p.inclusions.map(i => <li key={i}>{i}</li>)}
              </ul>
            </label>
          )
        })}
      </div>
    </div>
  )
}
