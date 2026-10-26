/**
 * Grille de calendrier mensuel (type Google Agenda), utilisee par le Planning.
 * Logique pure, sans dependance React : facile a re-tester si la mise en page
 * du calendrier doit evoluer sans toucher au rendu.
 *
 * Empilement : chaque semaine recoit ses propres "voies" (lanes) par un
 * algorithme glouton classique (on pose chaque evenement sur la premiere voie
 * libre pour la plage de jours qu'il occupe cette semaine-la). Au-dela de
 * MAX_VOIES_VISIBLES, l'evenement ne disparait pas : il compte dans un repli
 * "+N" par jour concerne (comme Google Agenda), jamais masque silencieusement.
 */

export type StatutCal = 'past' | 'live' | 'upcoming'

export interface CalItem {
  id: string
  type: 'se' | 'ev'
  label: string
  sub?: string
  debut: string // 'YYYY-MM-DD'
  fin: string   // 'YYYY-MM-DD', >= debut
  statut: StatutCal
}

export interface JourCal {
  date: Date
  iso: string
  jour: number
  dansLeMois: boolean
  today: boolean
}

export interface BarreCal {
  item: CalItem
  colDebut: number // 0-6
  colFin: number   // 0-6 inclus
  voie: number
}

export interface RepliCal {
  jourIdx: number // 0-6
  items: CalItem[]
}

export interface SemaineCal {
  jours: JourCal[]
  barres: BarreCal[]
  replis: RepliCal[]
}

export const MAX_VOIES_VISIBLES = 2

const MS_JOUR = 24 * 60 * 60 * 1000

function parseISO(iso: string): Date {
  const [a, m, j] = iso.split('-').map(Number)
  return new Date(a, m - 1, j)
}
function versISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function memeJour(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
/** Lundi = 0 .. Dimanche = 6 (convention FR, comme le reste du dashboard). */
function joursDepuisLundi(d: Date): number {
  return (d.getDay() + 6) % 7
}

/**
 * Construit les semaines du mois (avec jours des mois voisins pour completer
 * la grille), puis y place les items en voies empilees + replis "+N".
 */
export function construireMois(annee: number, moisIdx0: number, items: CalItem[]): SemaineCal[] {
  const premierJourMois = new Date(annee, moisIdx0, 1)
  const dernierJourMois = new Date(annee, moisIdx0 + 1, 0)
  const debutGrille = new Date(premierJourMois)
  debutGrille.setDate(debutGrille.getDate() - joursDepuisLundi(premierJourMois))
  const nbSemaines = Math.ceil((joursDepuisLundi(premierJourMois) + dernierJourMois.getDate()) / 7)

  const aujourdhui = new Date()

  const items2 = items
    .map(it => ({ it, d0: parseISO(it.debut), d1: parseISO(it.fin) }))
    .filter(x => !isNaN(x.d0.getTime()) && !isNaN(x.d1.getTime()))

  const semaines: SemaineCal[] = []

  for (let s = 0; s < nbSemaines; s++) {
    const semaineDebut = new Date(debutGrille.getTime() + s * 7 * MS_JOUR)
    const semaineFin = new Date(semaineDebut.getTime() + 6 * MS_JOUR)

    const jours: JourCal[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(semaineDebut.getTime() + i * MS_JOUR)
      jours.push({
        date: d, iso: versISO(d), jour: d.getDate(),
        dansLeMois: d.getMonth() === moisIdx0,
        today: memeJour(d, aujourdhui),
      })
    }

    // Items qui touchent cette semaine, tries par debut (puis par duree, les plus
    // longs d'abord) -- l'ordre stable des voies rend l'empilement previsible.
    const concernes = items2
      .filter(x => x.d0 <= semaineFin && x.d1 >= semaineDebut)
      .sort((a, b) => a.d0.getTime() - b.d0.getTime() || (b.d1.getTime() - b.d0.getTime()) - (a.d1.getTime() - a.d0.getTime()))

    const voies: { colDebut: number; colFin: number }[][] = [] // voies[v] = segments deja places
    const barres: BarreCal[] = []
    const voieParItem = new Map<string, number>()

    concernes.forEach(({ it, d0, d1 }) => {
      const colDebut = Math.max(0, joursDepuisLundi(d0 < semaineDebut ? semaineDebut : d0))
      const colFin = Math.min(6, joursDepuisLundi(d1 > semaineFin ? semaineFin : d1))
      let v = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const occupe = voies[v]
        if (!occupe) { voies[v] = [{ colDebut, colFin }]; break }
        const chevauche = occupe.some(seg => colDebut <= seg.colFin && colFin >= seg.colDebut)
        if (!chevauche) { occupe.push({ colDebut, colFin }); break }
        v++
      }
      voieParItem.set(it.id, v)
      if (v < MAX_VOIES_VISIBLES) barres.push({ item: it, colDebut, colFin, voie: v })
    })

    // Replis "+N" : pour chaque jour de la semaine, les items dont la voie
    // retenue depasse MAX_VOIES_VISIBLES et qui couvrent ce jour.
    const replis: RepliCal[] = []
    for (let j = 0; j < 7; j++) {
      const jourDate = jours[j].date
      const enTrop = concernes.filter(({ it, d0, d1 }) => {
        const v = voieParItem.get(it.id) ?? 0
        return v >= MAX_VOIES_VISIBLES && d0 <= jourDate && d1 >= jourDate
      }).map(x => x.it)
      if (enTrop.length) replis.push({ jourIdx: j, items: enTrop })
    }

    semaines.push({ jours, barres, replis })
  }

  return semaines
}

export const NOMS_MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
