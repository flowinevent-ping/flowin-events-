/**
 * CREER UN PRO — une seule definition, deux surfaces.
 *
 * Romain, 03/09 : « la création d'un pro côté pro ou dashboard SA doit être la
 * même ».
 *
 * Elle ne l'etait pas. Cote pro, `/pro/inscription` posait sept champs d'un
 * bloc, avec un secteur en texte libre. Cote SA, `wizard-pro` en posait quinze
 * en cinq etapes, avec une liste de secteurs. Deux fiches du meme commerce
 * n'avaient donc pas les memes informations selon qui l'avait saisie — et le
 * secteur en texte libre rendait tout regroupement faux.
 *
 * Ce fichier decrit LE parcours : ses etapes, ses champs, ses libelles, ses
 * regles. Les deux ecrans le rendent avec leurs propres primitives — le
 * dashboard avec `Parcours`, l'espace pro avec `proPublicUI` — mais posent les
 * memes questions, dans le meme ordre, avec les memes validations.
 *
 * CE QUI DIFFERE, ET SEULEMENT CELA. Trois champs appartiennent a un seul cote,
 * parce qu'ils n'ont pas de sens sur l'autre :
 *   - `motdepasse` : cote pro uniquement — le pro ouvre son compte, le SA non.
 *   - `identifiant` : cote SA uniquement — le pro n'a pas a connaitre la cle
 *     technique, elle est deduite de son nom.
 *   - `notes` et le choix du statut : cote SA uniquement — notes internes.
 * Une inscription faite par le pro arrive toujours en `en_attente` : c'est
 * une demande, pas une creation. Le SA, lui, cree pour de bon.
 */

/* Corrige le 03/09 : cette liste avait ete inventee (« Grande distribution »,
   « Banque · Assurance »… ) sans etre confrontee aux valeurs reellement en
   base. Requete sur `pros.secteur` le 03/09 : Commerce & Négoce (8),
   Collectivité (1), Collectivité / Festival (1), Institution (1),
   Association (1), plus station-festival (4) — un tag technique pose sur les
   comptes multistation, jamais choisi par un humain dans ce formulaire, donc
   absent de la liste ci-dessous. Reprise a l'identique dans
   components/pro/RejoindreWizard.tsx : une seule liste, sinon le
   regroupement par secteur ne regroupe rien. */
export const SECTEURS_PRO = [
  'Commerce & Négoce', 'Collectivité', 'Collectivité / Festival',
  'Association', 'Institution', 'Autre',
] as const

/* Les deux profils du parcours pro, avec leurs propres mots. */
export const PROFILS_PRO = [
  {
    id: 'commerce', icone: '🏪', titre: 'Commerce · point de vente',
    sous: 'Une station de jeu chez vous : les joueurs viennent flasher sur place.',
    sousSA: 'Il tient une station de jeu chez lui : les joueurs viennent flasher sur place.',
    badges: ['Station', 'Trafic en boutique', 'Fichier client'],
  },
  {
    id: 'annonceur', icone: '📣', titre: 'Annonceur · sponsor',
    sous: 'Vous communiquez sur l’opération sans tenir de station.',
    sousSA: 'Il communique sur l’opération sans tenir de station.',
    badges: ['Audience locale', 'Impact', 'Choix de l’event'],
  },
] as const
export type ProfilPro = typeof PROFILS_PRO[number]['id']

export type CotePro = 'sa' | 'pro'

export interface FichePro {
  profil: ProfilPro | ''
  nom: string
  identifiant: string
  secteur: string
  adresse: string
  codePostal: string
  ville: string
  siret: string
  contact: string
  roleContact: string
  email: string
  tel: string
  motdepasse: string
  notes: string
}

export function ficheProVide(): FichePro {
  return {
    profil: '', nom: '', identifiant: '', secteur: '', adresse: '', codePostal: '',
    ville: '', siret: '', contact: '', roleContact: '', email: '', tel: '',
    motdepasse: '', notes: '',
  }
}

/** L'identifiant technique, deduit du nom. Meme regle des deux cotes — sinon le
 *  meme commerce recoit deux cles selon qui l'a saisi. */
export function slugPro(nom: string): string {
  const base = nom.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return base ? `pro-${base}` : ''
}

export function identifiantPro(f: FichePro): string {
  return f.identifiant.trim() || slugPro(f.nom)
}

export type TypeChamp = 'texte' | 'email' | 'tel' | 'liste' | 'zone' | 'motdepasse'

export interface ChampPro {
  cle: keyof FichePro
  label: string
  type: TypeChamp
  placeholder?: string
  aide?: string
  options?: readonly string[]
  /** Les cotes qui posent ce champ. Absent = les deux. */
  cotes?: CotePro[]
  /** Le champ disparait pour ce profil (un annonceur n'a pas de station). */
  saufProfil?: ProfilPro
  /** Deux champs de meme groupe s'affichent cote a cote. */
  groupe?: string
}

export interface EtapeFichePro {
  id: string
  icone: string
  titre: string
  sous: string
  /** L'etape « profil » n'a pas de champs : elle affiche les vignettes. */
  vignettes?: boolean
  champs: ChampPro[]
  /** Ce qui manque pour avancer, sinon undefined. */
  bloque: (f: FichePro, cote: CotePro) => string | undefined
}

const EMAIL_OK = (v: string) => /.+@.+\..+/.test(v.trim())

export const ETAPES_FICHE_PRO: EtapeFichePro[] = [
  {
    id: 'profil', icone: '🧭', titre: 'De quel pro s’agit-il ?',
    sous: 'Les deux profils ne demandent pas les mêmes informations.',
    vignettes: true, champs: [],
    bloque: f => (f.profil ? undefined : 'Choisissez un profil pour continuer.'),
  },
  {
    id: 'identite', icone: '🏢', titre: 'L’identité',
    sous: 'Le nom que verront les joueurs, et le secteur qui sert aux regroupements.',
    champs: [
      { cle: 'nom', label: 'Nom de l’établissement *', type: 'texte', placeholder: 'Ex. Domaine de la Bergerie' },
      {
        cle: 'identifiant', label: 'Identifiant', type: 'texte', cotes: ['sa'],
        aide: 'Il relie les stations, les lots et le CRM — il ne se change plus ensuite.',
      },
      { cle: 'secteur', label: 'Secteur d’activité', type: 'liste', options: SECTEURS_PRO },
    ],
    bloque: f => (f.nom.trim().length > 1 ? undefined : 'Donnez un nom à l’établissement pour continuer.'),
  },
  {
    id: 'lieu', icone: '📍', titre: 'Où il se trouve',
    sous: 'L’adresse place la station sur la carte de l’opération.',
    champs: [
      { cle: 'adresse', label: 'Adresse', type: 'texte', placeholder: 'Ex. 12 place du Grand Jardin', saufProfil: 'annonceur' },
      { cle: 'codePostal', label: 'Code postal', type: 'texte', placeholder: '06140', groupe: 'cp' },
      { cle: 'ville', label: 'Ville', type: 'texte', placeholder: 'Vence', groupe: 'cp' },
      { cle: 'siret', label: 'SIRET', type: 'texte', aide: 'Facultatif — utile pour les bons de commande et les factures.' },
    ],
    bloque: () => undefined,
  },
  {
    id: 'contact', icone: '👤', titre: 'Qui le représente',
    sous: 'La personne que l’on appelle, et l’adresse qui reçoit les accès.',
    champs: [
      { cle: 'contact', label: 'Nom du contact', type: 'texte', placeholder: 'Prénom Nom', groupe: 'ct' },
      { cle: 'roleContact', label: 'Rôle', type: 'texte', placeholder: 'Gérant, responsable…', groupe: 'ct' },
      { cle: 'email', label: 'Email *', type: 'email', placeholder: 'contact@enseigne.fr', groupe: 'em' },
      { cle: 'tel', label: 'Téléphone', type: 'tel', groupe: 'em' },
      {
        cle: 'motdepasse', label: 'Mot de passe *', type: 'motdepasse', cotes: ['pro'],
        aide: '8 caractères minimum. Il ouvre l’espace pro.',
      },
      {
        cle: 'notes', label: 'Notes internes', type: 'zone', cotes: ['sa'],
        placeholder: 'Ce qu’il faut savoir sur ce pro — visible du SA seulement.',
      },
    ],
    bloque: (f, cote) => {
      if (!EMAIL_OK(f.email)) return 'Un email valide est nécessaire.'
      if (cote === 'pro' && f.motdepasse.length < 8) return 'Le mot de passe fait 8 caractères minimum.'
      return undefined
    },
  },
  {
    id: 'recap', icone: '✅', titre: 'Récapitulatif',
    sous: 'Rien n’est écrit avant validation.',
    champs: [],
    bloque: () => undefined,
  },
]

/** Les etapes d'un cote donne, champs filtres. */
export function etapesPour(cote: CotePro, profil: ProfilPro | ''): EtapeFichePro[] {
  return ETAPES_FICHE_PRO.map(e => ({
    ...e,
    champs: e.champs
      .filter(c => !c.cotes || c.cotes.includes(cote))
      .filter(c => !c.saufProfil || c.saufProfil !== profil),
  }))
}

/** Le recapitulatif, en lignes libelle / valeur — le meme des deux cotes. */
export function recapPro(f: FichePro, cote: CotePro): { k: string; v: string }[] {
  const lignes: { k: string; v: string }[] = [
    { k: 'Profil', v: PROFILS_PRO.find(p => p.id === f.profil)?.titre ?? '—' },
    { k: 'Nom', v: f.nom.trim() || '—' },
  ]
  if (cote === 'sa') lignes.push({ k: 'Identifiant', v: identifiantPro(f) || '—' })
  lignes.push(
    { k: 'Secteur', v: f.secteur || '—' },
    { k: 'Adresse', v: [f.adresse, f.codePostal, f.ville].filter(Boolean).join(', ') || '—' },
    { k: 'SIRET', v: f.siret || '—' },
    { k: 'Contact', v: [f.contact, f.roleContact].filter(Boolean).join(' · ') || '—' },
    { k: 'Email', v: f.email.trim() || '—' },
    { k: 'Téléphone', v: f.tel || '—' },
  )
  return lignes
}

/** Ce qui part en base, dans les colonnes de `pros`. Identique des deux cotes,
 *  au statut pres : une inscription faite par le pro est une DEMANDE. */
export function lignePro(f: FichePro, cote: CotePro, statutSA: 'valide' | 'en_attente' = 'valide') {
  return {
    id: identifiantPro(f),
    nom: f.nom.trim(),
    secteur: f.secteur,
    adresse: f.adresse,
    code_postal: f.codePostal,
    ville: f.ville,
    siret: f.siret,
    contact: f.contact,
    role_contact: f.roleContact,
    email: f.email.trim(),
    tel: f.tel,
    notes: cote === 'sa' ? f.notes : '',
    statut: cote === 'pro' ? ('en_attente' as const) : statutSA,
    tags: f.profil ? [f.profil] : [],
  }
}
