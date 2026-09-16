/**
 * Onglets de la fiche operation cote pro (/pro/operation).
 * Module sans 'use client' : lu par la page serveur ET par le composant client.
 * (Une constante importee d un fichier 'use client' dans une page serveur
 * n est qu une reference client : `.find` y plantait la page.)
 */
export const ONGLETS_OP = [
  { id: 'jeu', label: 'Jeu' },
  { id: 'lots', label: 'Lots' },
  { id: 'diffusion', label: 'Diffusion' },
  { id: 'gagnants', label: 'Gagnants & tirage' },
  { id: 'trafic', label: 'Trafic' },
  { id: 'crm', label: 'CRM' },
  { id: 'bons', label: 'Bons de commande & factures' },
] as const
export type OngletOp = typeof ONGLETS_OP[number]['id']

/** Anciens noms d onglet encore presents dans des liens. */
const ALIAS: Record<string, OngletOp> = { contrat: 'bons', contacts: 'crm', tracking: 'trafic', comm: 'diffusion', tirage: 'gagnants' }

export function lireOngletOp(v: string | undefined): OngletOp {
  if (!v) return 'jeu'
  return ONGLETS_OP.find(o => o.id === v)?.id ?? ALIAS[v] ?? 'jeu'
}

/** Periode d une operation d apres ses dates (repli sur le statut). */
export type Periode = 'en_cours' | 'a_venir' | 'terminee'
export function periodeOperation(dateD: string | null, dateF: string | null, status: string | null): Periode {
  const auj = new Date().toISOString().slice(0, 10)
  if (dateD && dateD > auj) return 'a_venir'
  if (dateF && dateF < auj) return 'terminee'
  if (dateD) return 'en_cours'
  if (status === 'live') return 'en_cours'
  if (status === 'past') return 'terminee'
  return 'a_venir'
}
export const LIBELLE_PERIODE: Record<Periode, string> = { en_cours: 'En cours', a_venir: 'À venir', terminee: 'Terminée' }
