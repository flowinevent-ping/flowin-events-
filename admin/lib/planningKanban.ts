/**
 * PLANNING — kanban par statut.
 *
 * Remplace lib/calendrier.ts (grille mensuelle type Google Agenda) : apres
 * comparaison de deux maquettes (calendrier vs kanban) dans un artifact,
 * Romain a choisi explicitement le kanban par statut (27/10) -- le calendrier
 * n etait pas le livrable final. Logique pure, sans dependance React : facile
 * a re-tester sans toucher au rendu.
 *
 * Une carte par OPERATION (super event ou event autonome), jamais par
 * station individuelle -- meme regle que le calendrier qu elle remplace et
 * que /dashboard/pro (lib/operations.ts, grouperOperations) : un super event
 * a 8 stations ne doit pas afficher 8 cartes identiques.
 *
 * Statuts reels (pas de supposition) :
 *   - lib/types.ts ne declare que 'upcoming' | 'live' | 'past' sur
 *     FlowinEvent, mais 'archived' est un statut reellement ecrit en base et
 *     deja gere ailleurs dans ce dashboard (EventDrawer.tsx, options du
 *     formulaire ; app/dashboard/events/page.tsx et
 *     app/dashboard/super-events/page.tsx, colonnes "Archivee(s)"). Meme
 *     priorite reprise ici : 'archived' fait foi quand il est present sur
 *     l operation, sinon on classe par dates (meme regle que
 *     lib/ongletsOperation.ts, deja utilisee pour les operations cote pro).
 *   - Aucune 'archived' n a jamais ete vue sur super_events.status dans ce
 *     code (SuperEventDrawer l affiche en lecture seule, sans option
 *     "archiver") ; la colonne Archives peut neanmoins accueillir une
 *     operation "super" si ce statut y apparaissait un jour -- rien ne
 *     l empeche structurellement, et ne pas le prevoir ferait disparaitre
 *     silencieusement une operation (meme piege deja corrige le 28/07 /
 *     super-events/page.tsx).
 */
import { periodeOperation, type Periode } from './ongletsOperation'

export type StatutKanban = Periode | 'archive'

export const COLONNES_KANBAN: { cle: StatutKanban; titre: string }[] = [
  { cle: 'en_cours', titre: 'En cours' },
  { cle: 'a_venir', titre: 'À venir' },
  { cle: 'terminee', titre: 'Terminés' },
  { cle: 'archive', titre: 'Archivés' },
]

/** Statut de colonne d une operation. 'archived' est prioritaire sur les
 *  dates (meme regle que etatStation() dans super-events/page.tsx). */
export function statutKanban(dateD: string | null, dateF: string | null, status: string | null): StatutKanban {
  if (status === 'archived') return 'archive'
  return periodeOperation(dateD, dateF, status)
}

export interface OperationDatee {
  dateD: string | null
  dateF: string | null
  status: string | null
  nom: string
}

export interface ColonneKanban<T> {
  cle: StatutKanban
  titre: string
  ops: T[]
}

/** Range des operations en colonnes par statut. Dans chaque colonne, tri par
 *  date -- a venir/en cours : la plus proche d abord ; terminees/archivees :
 *  la plus recente d abord (meme convention que rangerParPeriode). */
export function grouperParStatut<T extends OperationDatee>(ops: T[]): ColonneKanban<T>[] {
  return COLONNES_KANBAN.map(col => {
    const l = ops.filter(o => statutKanban(o.dateD, o.dateF, o.status) === col.cle)
    l.sort((a, b) => {
      const da = a.dateD ?? '9999', db = b.dateD ?? '9999'
      if (da !== db) return (col.cle === 'terminee' || col.cle === 'archive') ? db.localeCompare(da) : da.localeCompare(db)
      return a.nom.localeCompare(b.nom, 'fr')
    })
    return { ...col, ops: l }
  })
}
