'use client'

/**
 * SOUS-ONGLETS — le deuxieme niveau de navigation dans un drawer.
 *
 * Les onglets (DrawerTabs) disent DE QUOI on parle ; les sous-onglets disent
 * QUELLE VUE de cette chose on regarde. Ils ne portent aucune donnee nouvelle :
 * ils decoupent un ecran qui, sinon, defile.
 *
 * REGLE, apprise d un bug reel : un sous-onglet sans contenu propre doit le
 * DIRE. Afficher le contenu du sous-onglet voisin est pire qu un ecran vide,
 * parce que rien ne signale l erreur -- on lit un chiffre en croyant qu il
 * concerne autre chose. D ou <SousOngletVide> ci-dessous.
 */

export interface SousOnglet {
  id: string
  label: string
  badge?: number
}

export function SousOnglets({
  onglets, actif, onSelect, libelle = 'Sous-onglets',
}: {
  onglets: SousOnglet[]
  actif: string
  onSelect: (id: string) => void
  libelle?: string
}) {
  if (onglets.length < 2) return null
  return (
    <div className="sa-sous-onglets" role="tablist" aria-label={libelle}>
      <span className="sa-sous-onglets-lbl">{libelle}</span>
      {onglets.map(o => (
        <button
          key={o.id}
          role="tab"
          aria-selected={o.id === actif}
          className={`sa-sous-onglet${o.id === actif ? ' actif' : ''}`}
          onClick={() => onSelect(o.id)}
        >
          {o.label}
          {o.badge !== undefined && o.badge > 0 && (
            <span className="sa-sous-onglet-n">{o.badge}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/** Etat explicite : ce sous-onglet n a rien a montrer, et il le dit. */
export function SousOngletVide({ libelle, raison }: { libelle: string; raison?: string }) {
  return (
    <div className="sa-sous-onglet-vide">
      <div className="t">Rien à afficher dans « {libelle} »</div>
      <div className="d">{raison ?? 'Aucune donnée pour cette vue.'}</div>
    </div>
  )
}

/**
 * Petit utilitaire de resolution : garantit qu on ne retombe jamais sur le
 * sous-onglet d a cote quand l identifiant courant n existe pas dans la liste
 * (URL bricolee, changement d onglet, module sans cette vue).
 */
export function sousOngletActif(onglets: SousOnglet[], demande: string | undefined): string {
  if (demande && onglets.some(o => o.id === demande)) return demande
  return onglets[0]?.id ?? ''
}
