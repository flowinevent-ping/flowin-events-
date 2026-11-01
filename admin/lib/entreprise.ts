/**
 * ENTREPRISE — SIRET / SIREN et pre-remplissage depuis l'API publique
 * « Recherche d'entreprises » (https://recherche-entreprises.api.gouv.fr,
 * gratuite, sans cle, donnees INSEE / RNE).
 *
 * Module sans 'use client' : utilise par la route serveur /api/pro/entreprise
 * ET par le parcours « Ma premiere fois » (validation du format cote navigateur).
 *
 * REGLE : on ne fabrique jamais rien. Une information absente de la reponse
 * de l'API reste vide ; la personne la complete a la main.
 */

/** Ne garde que les chiffres (les espaces sont frequents : « 123 456 789 00012 »). */
export function chiffres(v: string): string {
  return (v || '').replace(/\D/g, '')
}

/** Cle de Luhn : un SIREN (9) et un SIRET (14) valides la respectent. */
export function luhnOk(num: string): boolean {
  if (!/^\d+$/.test(num)) return false
  let somme = 0
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i])
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
    somme += d
  }
  return somme % 10 === 0
}

/**
 * Exception connue : les etablissements de La Poste (SIREN 356 000 000) ne
 * respectent pas Luhn ; leur SIRET a une somme des chiffres multiple de 5.
 */
function siretLaPosteOk(s: string): boolean {
  if (!s.startsWith('356000000')) return false
  let somme = 0
  for (const c of s) somme += Number(c)
  return somme % 5 === 0
}

export function siretValide(v: string): boolean {
  const s = chiffres(v)
  return s.length === 14 && (luhnOk(s) || siretLaPosteOk(s))
}

export function sirenValide(v: string): boolean {
  const s = chiffres(v)
  return s.length === 9 && luhnOk(s)
}

/** Ce que la personne a tape : un SIRET, un SIREN, ou un nom a chercher. */
export type NatureRecherche = 'siret' | 'siren' | 'nom' | 'invalide'
export function natureRecherche(v: string): NatureRecherche {
  const brut = (v || '').trim()
  if (!brut) return 'invalide'
  const c = chiffres(brut)
  const queChiffres = /^[\d\s.-]+$/.test(brut)
  if (queChiffres) {
    if (c.length === 14) return siretValide(c) ? 'siret' : 'invalide'
    if (c.length === 9) return sirenValide(c) ? 'siren' : 'invalide'
    return 'invalide'
  }
  return brut.length >= 3 ? 'nom' : 'invalide'
}

/** Message clair pour un numero mal forme (sinon undefined). */
export function erreurNumero(v: string): string | undefined {
  const brut = (v || '').trim()
  if (!brut || !/^[\d\s.-]+$/.test(brut)) return undefined
  const c = chiffres(brut)
  if (c.length === 14) return siretValide(c) ? undefined : 'Ce SIRET ne semble pas valide (clé de contrôle). Vérifiez les 14 chiffres.'
  if (c.length === 9) return sirenValide(c) ? undefined : 'Ce SIREN ne semble pas valide (clé de contrôle). Vérifiez les 9 chiffres.'
  return `Un SIRET compte 14 chiffres, un SIREN 9 (vous en avez saisi ${c.length}).`
}

export function formaterSiret(v: string): string {
  const s = chiffres(v)
  if (s.length !== 14) return v
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}`
}

/**
 * Categories juridiques INSEE les plus courantes (nomenclature officielle
 * « catégories juridiques », niveau III). Un code absent de cette liste
 * s'affiche tel quel avec son numero, sans libelle invente.
 */
export const FORMES_JURIDIQUES: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '5202': 'Société en nom collectif',
  '5306': 'Société en commandite simple',
  '5410': 'SARL nationale',
  '5422': 'SARL immobilière pour le commerce et l’industrie',
  '5426': 'SARL immobilière de gestion',
  '5430': 'SARL d’aménagement foncier et d’équipement rural',
  '5431': 'SARL mixte d’intérêt agricole',
  '5432': 'SARL d’intérêt collectif agricole',
  '5442': 'SARL d’attribution',
  '5443': 'SARL coopérative de construction',
  '5451': 'SARL coopérative de consommation',
  '5453': 'SARL coopérative artisanale',
  '5458': 'SARL coopérative ouvrière de production (SCOP)',
  '5460': 'Autre SARL coopérative',
  '5485': 'Société d’exercice libéral à responsabilité limitée',
  '5488': 'Entreprise unipersonnelle à responsabilité limitée (EURL)',
  '5498': 'SARL unipersonnelle',
  '5499': 'Société à responsabilité limitée (SARL)',
  '5505': 'SA à participation ouvrière à conseil d’administration',
  '5599': 'SA à conseil d’administration',
  '5699': 'SA à directoire',
  '5710': 'Société par actions simplifiée (SAS)',
  '5720': 'Société par actions simplifiée à associé unique (SASU)',
  '5785': 'Société d’exercice libéral par action simplifiée',
  '6533': 'Groupement agricole d’exploitation en commun (GAEC)',
  '6534': 'Groupement foncier agricole',
  '6540': 'Société civile immobilière (SCI)',
  '6597': 'Société civile d’exploitation agricole',
  '6598': 'Exploitation agricole à responsabilité limitée (EARL)',
  '6599': 'Autre société civile',
  '7210': 'Commune et commune nouvelle',
  '7220': 'Département',
  '7230': 'Région',
  '7346': 'Communauté de communes',
  '7348': 'Communauté d’agglomération',
  '7361': 'Centre communal d’action sociale',
  '7364': 'Établissement d’hospitalisation',
  '7372': 'Service départemental d’incendie et de secours',
  '7378': 'Régie d’une collectivité locale à caractère administratif',
  '7470': 'Groupement d’intérêt public (GIP)',
  '8210': 'Mutuelle',
  '9210': 'Association non déclarée',
  '9220': 'Association déclarée',
  '9221': 'Association déclarée d’insertion par l’économique',
  '9222': 'Association intermédiaire',
  '9230': 'Association déclarée, reconnue d’utilité publique',
  '9260': 'Association de droit local (Alsace-Moselle)',
  '9300': 'Fondation',
}

export function libelleFormeJuridique(code: string | null | undefined): string {
  if (!code) return ''
  return FORMES_JURIDIQUES[code] ?? `Catégorie juridique ${code}`
}

/** Les 21 sections de la nomenclature NAF rev. 2 (INSEE). */
export const SECTIONS_NAF: Record<string, string> = {
  A: 'Agriculture, sylviculture et pêche',
  B: 'Industries extractives',
  C: 'Industrie manufacturière',
  D: 'Production et distribution d’électricité, de gaz, de vapeur et d’air conditionné',
  E: 'Production et distribution d’eau ; assainissement, gestion des déchets et dépollution',
  F: 'Construction',
  G: 'Commerce ; réparation d’automobiles et de motocycles',
  H: 'Transports et entreposage',
  I: 'Hébergement et restauration',
  J: 'Information et communication',
  K: 'Activités financières et d’assurance',
  L: 'Activités immobilières',
  M: 'Activités spécialisées, scientifiques et techniques',
  N: 'Activités de services administratifs et de soutien',
  O: 'Administration publique',
  P: 'Enseignement',
  Q: 'Santé humaine et action sociale',
  R: 'Arts, spectacles et activités récréatives',
  S: 'Autres activités de services',
  T: 'Activités des ménages en tant qu’employeurs',
  U: 'Activités extra-territoriales',
}

/** Section NAF a partir des deux premiers chiffres du code (table INSEE). */
export function sectionNaf(code: string | null | undefined): string {
  const n = Number((code || '').slice(0, 2))
  if (!n) return ''
  if (n <= 3) return 'A'
  if (n <= 9) return 'B'
  if (n <= 33) return 'C'
  if (n === 35) return 'D'
  if (n <= 39) return 'E'
  if (n <= 43) return 'F'
  if (n <= 47) return 'G'
  if (n <= 53) return 'H'
  if (n <= 56) return 'I'
  if (n <= 63) return 'J'
  if (n <= 66) return 'K'
  if (n === 68) return 'L'
  if (n <= 75) return 'M'
  if (n <= 82) return 'N'
  if (n === 84) return 'O'
  if (n === 85) return 'P'
  if (n <= 88) return 'Q'
  if (n <= 93) return 'R'
  if (n <= 96) return 'S'
  if (n <= 98) return 'T'
  if (n === 99) return 'U'
  return ''
}

/**
 * Secteur Flowin suggere (liste SECTEURS_PRO de lib/proCreation). Une simple
 * suggestion, modifiable : vide quand rien ne permet de trancher.
 */
export function secteurSuggere(naf: string | null | undefined, formeJuridique: string | null | undefined): string {
  const fj = formeJuridique || ''
  if (fj.startsWith('92') || fj === '9300') return 'Association'
  if (fj.startsWith('72') || fj.startsWith('73')) return 'Collectivité'
  const sec = sectionNaf(naf)
  if (sec === 'G' || sec === 'I') return 'Commerce & Négoce'
  if (sec === 'O') return 'Institution'
  return ''
}

/** Une entreprise telle que la renvoie notre route /api/pro/entreprise. */
export interface EntrepriseTrouvee {
  siren: string
  siret: string
  nom: string
  nomCommercial: string
  formeJuridiqueCode: string
  formeJuridique: string
  codeNaf: string
  activite: string
  dateCreation: string
  adresse: string
  codePostal: string
  ville: string
  enActivite: boolean
  etablissementsOuverts: number | null
}

/* Forme de la reponse de l'API publique (champs utilises seulement). */
interface EtabApi {
  siret?: string; adresse?: string; code_postal?: string; libelle_commune?: string
  numero_voie?: string | null; indice_repetition?: string | null; type_voie?: string | null; libelle_voie?: string | null
  complement_adresse?: string | null; activite_principale?: string | null; etat_administratif?: string | null
  nom_commercial?: string | null; liste_enseignes?: string[] | null
}
export interface ResultatApi {
  siren?: string; nom_complet?: string; nom_raison_sociale?: string | null; sigle?: string | null
  nature_juridique?: string | null; activite_principale?: string | null; date_creation?: string | null
  etat_administratif?: string | null; nombre_etablissements_ouverts?: number | null
  siege?: EtabApi | null; matching_etablissements?: EtabApi[] | null
}

/** Voie seule (« 12 place du Grand Jardin »), sans le code postal ni la ville. */
function voie(e: EtabApi | null | undefined): string {
  if (!e) return ''
  const parts = [e.numero_voie, e.indice_repetition, e.type_voie, e.libelle_voie].filter(Boolean) as string[]
  const l = parts.join(' ').replace(/\s+/g, ' ').trim()
  if (l) return [e.complement_adresse, l].filter(Boolean).join(', ')
  /* Repli : l'adresse complete moins « CP VILLE » en fin de chaine. */
  const a = (e.adresse || '').trim()
  if (e.code_postal && a.indexOf(e.code_postal) > 0) return a.slice(0, a.indexOf(e.code_postal)).trim().replace(/,$/, '')
  return a
}

/** Libelles en majuscules de l'INSEE → casse lisible (« BOULANGERIE DU PORT » → « Boulangerie du Port »). */
export function casseLisible(v: string): string {
  if (!v || v !== v.toUpperCase()) return v || ''
  const petits = ['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'à', 'au', 'aux', 'sur', 'sous', 'd', 'l']
  return v.toLowerCase().split(/(\s+|-|')/).map((m, i) => {
    if (!m.trim() || m === '-' || m === "'") return m
    if (i > 0 && petits.indexOf(m) >= 0) return m
    return m.charAt(0).toUpperCase() + m.slice(1)
  }).join('')
}

/**
 * Transforme un resultat de l'API publique en fiche Flowin. Si la recherche
 * portait sur un SIRET precis, on prend CET etablissement (pas le siege).
 */
export function versEntreprise(r: ResultatApi, siretCherche?: string): EntrepriseTrouvee {
  const etabs = r.matching_etablissements ?? []
  const etab = (siretCherche && etabs.find(e => e.siret === siretCherche)) || etabs[0] || r.siege || null
  const nomBrut = r.nom_raison_sociale || r.nom_complet || ''
  const enseigne = etab?.nom_commercial || (etab?.liste_enseignes ?? [])[0] || ''
  const naf = etab?.activite_principale || r.activite_principale || ''
  const sec = sectionNaf(naf)
  return {
    siren: r.siren ?? '',
    siret: etab?.siret ?? '',
    nom: casseLisible(nomBrut),
    nomCommercial: casseLisible(enseigne),
    formeJuridiqueCode: r.nature_juridique ?? '',
    formeJuridique: libelleFormeJuridique(r.nature_juridique),
    codeNaf: naf,
    activite: sec ? SECTIONS_NAF[sec] : '',
    dateCreation: r.date_creation ?? '',
    adresse: casseLisible(voie(etab)),
    codePostal: etab?.code_postal ?? '',
    ville: casseLisible(etab?.libelle_commune ?? ''),
    enActivite: (etab?.etat_administratif ?? r.etat_administratif ?? 'A') === 'A',
    etablissementsOuverts: r.nombre_etablissements_ouverts ?? null,
  }
}
