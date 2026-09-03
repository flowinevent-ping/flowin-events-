/**
 * Socle metier des super events — Flowin
 * ---------------------------------------------------------------------------
 * Regroupe les briques reutilisables d un super event a l autre : gagnants,
 * cycle de vie, billets, PIN commercant, pack d envoi.
 *
 * REGLES PORTEES PAR CE MODULE (voir handoff Supabase + Notion) :
 *  - Cycle du gagnant : TIRE (interne) -> CONFIRME (visible partenaire) -> RETIRE.
 *  - Le partenaire ne voit QUE les gagnants confirmes. Filtrage cote serveur
 *    (parametre p_mode), jamais cote client.
 *  - Le billet ne devient nominatif qu a la confirmation.
 *  - Le PIN est confidentiel : jamais expose cote client final.
 *
 * Rien n est code en dur sur NDS : le super event est toujours un parametre.
 */
import { supabase } from './supabase'

export const SE_DEFAUT = 'se-nds-2026'

export type EtatGagnant = 'a_confirmer' | 'confirme' | 'retire'

export interface GagnantPartenaire {
  tirage_id: number
  joueur_id: string | null
  joueur_nom: string | null
  joueur_email: string | null
  joueur_tel: string | null
  lot_nom: string | null
  lot_valeur: number | string | null
  statut: string | null
  notifie_at: string | null
  retire_at: string | null
  etat: EtatGagnant
  retrait_token: string | null
  ticket_code: string | null
  date: string | null
  partenaire_nom: string | null
  partenaire_adresse: string | null
  partenaire_tel: string | null
  conditions: string | null
}

export interface EtatPartenaire {
  tires: number
  a_confirmer: number
  confirmes: number
  retires: number
}

/** Gagnants d un partenaire. mode 'partenaire' ne renvoie que les confirmes. */
export async function fetchGagnantsPartenaire(
  partenaireId: string,
  se: string = SE_DEFAUT,
  mode: 'interne' | 'partenaire' = 'interne'
): Promise<GagnantPartenaire[]> {
  const { data, error } = await supabase.rpc('partenaire_gagnants', {
    p_partenaire_id: partenaireId,
    p_se: se,
    p_mode: mode,
  })
  if (error) { console.error('[fetchGagnantsPartenaire]', error.message); return [] }
  return Array.isArray(data) ? (data as GagnantPartenaire[]) : []
}

/** Compteurs par etat, pour piloter l avancement des appels. */
export async function fetchEtatPartenaire(
  partenaireId: string,
  se: string = SE_DEFAUT
): Promise<EtatPartenaire> {
  const vide: EtatPartenaire = { tires: 0, a_confirmer: 0, confirmes: 0, retires: 0 }
  const { data, error } = await supabase.rpc('partenaire_gagnants_etat', {
    p_partenaire_id: partenaireId,
    p_se: se,
  })
  if (error) { console.error('[fetchEtatPartenaire]', error.message); return vide }
  return { ...vide, ...(data as Partial<EtatPartenaire> | null) }
}

/** Confirme un gagnant : il devient visible du partenaire et son billet se nomme. */
export async function confirmerGagnant(tirageId: number): Promise<boolean> {
  const { error } = await supabase.rpc('marquer_notifie', { p_tirage_id: tirageId })
  if (error) { console.error('[confirmerGagnant]', error.message); return false }
  return true
}

/** Re-tirage : annule le tirage en cours (uniquement si jamais confirme -- protection
 * cote SQL) puis relance tirage_lot() pour le meme partenaire/lot. tirage_lot exclut
 * deja tout joueur ayant un tirage actif, donc la personne annulee ne peut pas
 * re-gagner immediatement le meme lot. */
export async function annulerEtRetirer(
  tirageId: number, partenaireId: string, lotNom: string, lotValeur: number
): Promise<{ ok: boolean; erreur?: string }> {
  const { data: annul, error: e1 } = await supabase.rpc('annuler_tirage', { p_tirage_id: tirageId })
  if (e1) { console.error('[annulerEtRetirer] annuler', e1.message); return { ok: false, erreur: e1.message } }
  const r = annul as { ok: boolean; erreur?: string } | null
  if (!r?.ok) return { ok: false, erreur: r?.erreur ?? 'annulation refusée' }

  const { error: e2 } = await supabase.rpc('tirage_lot', {
    p_partenaire_id: partenaireId, p_lot_nom: lotNom, p_valeur: lotValeur, p_nb: 1,
  })
  if (e2) { console.error('[annulerEtRetirer] tirage_lot', e2.message); return { ok: false, erreur: e2.message } }
  return { ok: true }
}

/* ── Liens ─────────────────────────────────────────────────────────────── */

const origine = () => (typeof window !== 'undefined' ? window.location.origin : '')

/** Billet d un gagnant. print=true declenche l impression (export PDF). */
export function lienBillet(token: string, print = false): string {
  return `${origine()}/nds/billets-partenaires.html?t=${encodeURIComponent(token)}${print ? '&print=1' : ''}`
}
/** Planche de billets d un commerce — ne montre que les gagnants confirmes. */
export function lienPlanchePartenaire(partenaireId: string): string {
  return `${origine()}/nds/billets-partenaires.html?p=${encodeURIComponent(partenaireId)}`
}
/** Email au PARTENAIRE (pas au gagnant) pour l'informer d'un nouveau gagnant a valider.
 * Source unique -- etait dupliquee dans PartenaireDrawer.tsx, extraite ici pour etre
 * reutilisee depuis nds-lots aussi (meme principe que mail-gagnant.js : ne jamais recopier). */
export function mailPartenaireUrl(
  g: { joueur_nom?: string | null; lot_nom?: string | null; ticket_code?: string | null; retrait_token?: string | null },
  partenaireNom: string, partenaireEmail: string | null
): string {
  const lien = g.retrait_token ? `${origine()}/nds/billets-partenaires.html?t=${encodeURIComponent(g.retrait_token)}` : ''
  const sujet = `Nouveau gagnant à valider — ${g.lot_nom || 'votre lot'}`
  const corps = [
    `Bonjour ${partenaireNom || ''},`, '',
    'Nous vous informons qu\u2019un client vient de gagner l\u2019un de vos lots au Grand Jeu des Nuits du Sud 2026 :', '',
    `   ${g.joueur_nom || '—'}`,
    `   ${g.lot_nom || ''}`,
    g.ticket_code ? `   N° de billet : ${g.ticket_code}` : '', '',
    'Le billet à télécharger (le même que celui reçu par le client), avec le QR à scanner pour valider le retrait :', '',
    `   ${lien}`, '',
    'À sa présentation en boutique : flashez le QR, saisissez votre code de validation, et validez. Le lot est déstocké automatiquement.', '',
    'Merci,', 'Flowin & les Nuits du Sud', 'flowinevent@gmail.com · 06 16 35 49 36',
  ].join('\n')
  return `https://mail.google.com/mail/?view=cm&fs=1${partenaireEmail ? `&to=${encodeURIComponent(partenaireEmail)}` : ''}&su=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`
}
/** Page bilan + procedure + PIN, destinee au commercant. */
export function lienBilanPartenaire(partenaireId: string): string {
  return `${origine()}/nds/bilan/email-partenaire.html?p=${encodeURIComponent(partenaireId)}`
}

export interface ElementPack { icone: string; libelle: string; url: string }

/** Pack d envoi : tout ce que le commercant doit recevoir, en un bloc. */
export function packEnvoi(partenaireId: string): ElementPack[] {
  const slug = partenaireId.replace(/^pt-/, '')
  const o = origine()
  return [
    { icone: '✉️', libelle: 'Email de remerciement (chiffres + son PIN)', url: lienBilanPartenaire(partenaireId) },
    { icone: '🎟️', libelle: 'Billets de ses gagnants confirmés',          url: lienPlanchePartenaire(partenaireId) },
    { icone: '📊', libelle: 'Visuel bilan',                                url: `${o}/nds/bilan/bilan-nds-2026.png` },
    { icone: '📄', libelle: 'Affiche A4 boutique',                         url: `${o}/nds/visuels/nds_a4_${slug}.png` },
    { icone: '🎫', libelle: 'Planche de tickets (PDF)',                    url: `${o}/nds/visuels/tickets/nds_tickets_${slug}.pdf` },
    { icone: '🎨', libelle: 'Kit digital complet',                         url: `${o}/nds/kit-digital/index.html#${slug}` },
    { icone: '🔗', libelle: 'Page de validation en caisse',                url: `${o}/lot.html` },
  ]
}

/* ── Conditions d utilisation ──────────────────────────────────────────── */

/**
 * Compose les conditions affichees sur un billet.
 * Un billet doit TOUJOURS dire sur quoi le bon s applique, ou l utiliser et
 * jusqu a quand : "non cumulable" seul expose a une contestation en boutique.
 * On assemble donc objet + lieu + conditions saisies en base.
 */
export function composerConditions(g: {
  lot_nom?: string | null
  partenaire_nom?: string | null
  partenaire_adresse?: string | null
  conditions?: string | null
}): string[] {
  const out: string[] = []
  if (g.lot_nom) out.push(`À valoir sur : ${g.lot_nom}`)
  if (g.partenaire_nom) {
    out.push(`À présenter chez ${g.partenaire_nom}${g.partenaire_adresse ? `, ${g.partenaire_adresse}` : ''}`)
  }
  String(g.conditions ?? '')
    .split('·')
    .map(c => c.trim())
    .filter(c => c.length > 0 && c.toLowerCase() !== String(g.lot_nom ?? '').toLowerCase())
    .forEach(c => out.push(c))
  if (out.length < 3) out.push('Billet nominatif, non remboursable, validable une seule fois')
  return out
}

/* ── Résultat journalier ───────────────────────────────────────────────── */

export interface StationJour {
  event_id: string
  nom: string
  type: 'station' | 'commerce'
  scans: number
  visiteurs: number
  commencees: number
  terminees: number
  joueurs: number
}

export interface JourActivite {
  jour: string
  commencees: number
  terminees: number
  joueurs: number
  flashs: number
  hors_periode: boolean
}

/** Jours ou le jeu a tourne, avec reperage des journees hors periode de festival. */
export async function fetchJours(se: string = SE_DEFAUT): Promise<JourActivite[]> {
  const { data, error } = await supabase.rpc('super_event_jours', { p_se: se })
  if (error) { console.error('[fetchJours]', error.message); return [] }
  return Array.isArray(data) ? (data as JourActivite[]) : []
}

/**
 * Stations actives un jour donne. Separe les stations du festival des commerces
 * partenaires : les melanger rendait le compteur par partenaire introuvable.
 */
export async function fetchStations(jour: string | null, se: string = SE_DEFAUT): Promise<StationJour[]> {
  const { data, error } = await supabase.rpc('super_event_stations', { p_se: se, p_date: jour })
  if (error) { console.error('[fetchStations]', error.message); return [] }
  const arr = (data as { par_station?: StationJour[] } | null)?.par_station
  return Array.isArray(arr) ? arr : []
}

/* ── Résultat journalier : donuts RGPD/engagement (restauration du rapport
   legacy `ndsRes`, jamais porte en Next.js -- disparu de /dashboard/nds-resultat
   lors de la reecriture du 26/07, signale par Romain le 30/08). ── */

export interface OptinJour {
  cumul: { joueurs: number; optin_oui: number; optin_non: number; taux_optin: number; taux_completion: number }
  joueurs: number; optin_oui: number; optin_non: number; taux_optin: number; taux_completion: number
}
export async function fetchOptinJour(se: string, jour: string): Promise<OptinJour | null> {
  const { data, error } = await supabase.rpc('super_event_optin', { p_se: se, p_date: jour })
  if (error) { console.error('[fetchOptinJour]', error.message); return null }
  return (data as OptinJour) ?? null
}

export interface EngagementJour {
  joueurs: number; une_partie: number; ont_rejoue: number; bonus_oui: number; bonus_non: number
}
export async function fetchEngagementJour(se: string, jour: string): Promise<EngagementJour | null> {
  const { data, error } = await supabase.rpc('super_event_engagement', { p_se: se, p_date: jour })
  if (error) { console.error('[fetchEngagementJour]', error.message); return null }
  return (data as EngagementJour) ?? null
}

export interface RepondantsJour {
  bonus_seulement: number; landing_seulement: number; les_deux: number; aucun: number
}
export async function fetchRepondantsJour(se: string, jour: string): Promise<RepondantsJour | null> {
  const { data, error } = await supabase.rpc('super_event_repondants', { p_se: se, p_date: jour })
  if (error) { console.error('[fetchRepondantsJour]', error.message); return null }
  return (data as RepondantsJour) ?? null
}

/* ── Super events : duplication ────────────────────────────────────────── */

export interface SuperEvent {
  id: string
  nom: string
  status: string | null
  date_d: string | null
  date_f: string | null
  description: string | null
  /** Logo de l operation, affiche en tete du parcours joueur. Colonne ajoutee
   *  le 03/09 (sql/2026-09-03-super-events-logo-url.sql). Vide = emplacement
   *  laisse libre, comme le demande le gabarit marque blanche. */
  logo_url?: string | null
}

export interface ResultatDuplication {
  ok: boolean
  raison?: string
  super_event?: string
  events_source?: number
  events_dupliques?: number
  events_hors_convention?: number
  partenaires_reutilisables?: number
  note?: string
}

export async function fetchSuperEvents(): Promise<SuperEvent[]> {
  const { data, error } = await supabase
    .from('super_events')
    .select('id, nom, status, date_d, date_f, description, logo_url')
    .order('date_d', { ascending: false })
  if (error) { console.error('[fetchSuperEvents]', error.message); return [] }
  return (data ?? []) as SuperEvent[]
}

/**
 * Duplique la STRUCTURE d un super event : parametres, events, stations.
 * Les donnees d edition (joueurs, tirages, gagnants, stock consomme) ne sont
 * jamais copiees — une nouvelle edition repart a zero.
 */
export async function dupliquerSuperEvent(params: {
  source: string
  nouveauId: string
  nouveauNom: string
  dateD?: string | null
  dateF?: string | null
}): Promise<ResultatDuplication> {
  const { data, error } = await supabase.rpc('dupliquer_super_event', {
    p_source: params.source,
    p_nouveau_id: params.nouveauId,
    p_nouveau_nom: params.nouveauNom,
    p_date_d: params.dateD || null,
    p_date_f: params.dateF || null,
    p_avec_partenaires: true,
  })
  if (error) { console.error('[dupliquerSuperEvent]', error.message); return { ok: false, raison: error.message } }
  return (data ?? { ok: false, raison: 'reponse_vide' }) as ResultatDuplication
}

/**
 * CREATION d un super event, de zero.
 *
 * A ne pas confondre avec deux choses qui existaient deja :
 *  - `dupliquerSuperEvent`, qui rejoue la STRUCTURE d une edition precedente ;
 *  - le parcours pro /pro/rejoindre, qui depose une DEMANDE DE PARTICIPATION.
 * Ici c est le SA qui cree l operation et y rattache directement des pros :
 * aucune demande, aucune validation en aval.
 *
 * Chaque pro choisi recoit UNE station (un event) rattachee au super event.
 * L ecriture est faite etape par etape et rend compte de ce qui a reellement
 * abouti : mieux vaut dire « super event cree, 2 stations sur 3 » que laisser
 * croire a un succes complet.
 */
export interface BrouillonSuperEvent {
  id: string
  nom: string
  dateD: string | null
  dateF: string | null
  description: string | null
  geofenceM: number | null
  tirageGlobal: boolean
  /** Logo de l operation : il est recopie dans le cfg de chaque station, ce que
   *  le parcours joueur lit deja. */
  logoUrl?: string | null
  /** Les pros a rattacher, avec le module de jeu de leur station. */
  pros: { pro_id: string; nom: string; module: string }[]
}

export interface ResultatCreationSE {
  ok: boolean
  id?: string
  fait: string[]
  erreur?: string
}

export async function creerSuperEvent(d: BrouillonSuperEvent): Promise<ResultatCreationSE> {
  const fait: string[] = []
  if (!d.id || !d.nom.trim()) return { ok: false, fait, erreur: 'Nom et identifiant obligatoires.' }

  const { data: deja } = await supabase.from('super_events').select('id').eq('id', d.id).maybeSingle()
  if (deja) return { ok: false, fait, erreur: `L identifiant ${d.id} est deja pris.` }

  const { error: errSe } = await supabase.from('super_events').insert({
    id: d.id,
    nom: d.nom.trim(),
    date_d: d.dateD || null,
    date_f: d.dateF || null,
    description: d.description || null,
    geofence_m: d.geofenceM ?? null,
    tirage_global: d.tirageGlobal,
    logo_url: d.logoUrl || null,
    status: 'upcoming',
    events: [],
    pros: d.pros.map(p => p.pro_id),
  })
  if (errSe) return { ok: false, fait, erreur: `Super event non cree — ${errSe.message}` }
  fait.push('super event')

  const ids: string[] = []
  /* IDENTIFIANT D EVENT — le suffixe aleatoire n est pas une coquetterie.
     Sans lui, `<se>-<pro>` tronque a 60 caracteres faisait collisionner deux
     pros des que le nom de l operation etait long (« se-festival-international-
     du-jazz-de-juan-les-pins-2027 » laisse 5 caracteres au pro) ou que deux
     pros partageaient un prefixe. L INSERT echouait alors sur la cle primaire
     et la station etait perdue en silence. `events.id` est un TEXT sans limite :
     la troncature etait auto-infligee, elle est supprimee. */
  for (const p of d.pros) {
    const alea = Math.random().toString(36).slice(2, 6)
    const evId = `${d.id.replace(/^se-/, 'ev-')}-${p.pro_id.replace(/^pro-/, '')}-${alea}`
    const { error } = await supabase.from('events').insert({
      id: evId,
      pro_id: p.pro_id,
      nom: p.nom,
      module: p.module,
      status: 'upcoming',
      super_event_id: d.id,
      date_d: d.dateD || null,
      date_f: d.dateF || null,
      /* Le logo de l operation descend dans le cfg de la station : c est la que
         le parcours joueur le lit (`cfg.logoUrl`). Une station peut ensuite
         avoir le sien depuis sa fiche, sans toucher a l operation. */
      cfg: d.logoUrl ? { logoUrl: d.logoUrl } : {},
      participants: 0, gagnants: 0, joueurs_optin: 0,
    })
    // Une station qui echoue ne doit pas annuler les autres : on continue et on
    // le dira. Le SA verra dans la liste laquelle manque.
    if (!error) ids.push(evId)
  }
  if (ids.length) {
    await supabase.from('super_events').update({ events: ids }).eq('id', d.id)
    fait.push(`${ids.length} station${ids.length > 1 ? 's' : ''}`)
  }
  if (ids.length < d.pros.length) {
    return { ok: true, id: d.id, fait, erreur: `${d.pros.length - ids.length} station(s) non creee(s) — a reprendre a la main.` }
  }
  return { ok: true, id: d.id, fait }
}

/**
 * SUPPRESSION d un super event cree par erreur.
 * Refusee si l operation porte des participations ou des tirages : on
 * n efface pas de l activite joueur ni des gagnants. Le nom doit etre
 * ressaisi exactement. Les `pros` ne sont jamais supprimes.
 */
export interface ResultatSuppressionSE {
  ok: boolean
  raison?: 'introuvable' | 'confirmation' | 'activite'
  attendu?: string
  participations?: number
  tirages?: number
  nom?: string
  events_supprimes?: number
  /** Message brut renvoye par la base quand l appel lui-meme a echoue. */
  message?: string
}

export async function supprimerSuperEvent(id: string, confirmation: string): Promise<ResultatSuppressionSE> {
  const { data, error } = await supabase.rpc('supprimer_super_event', { p_id: id, p_confirmation: confirmation })
  // Un echec RPC (droits, reseau, exception) n est PAS « introuvable » : dire
  // « super event introuvable » d une operation choisie dans la liste juste
  // au-dessus envoie chercher au mauvais endroit.
  if (error) { console.error('[supprimerSuperEvent]', error.message); return { ok: false, message: error.message } }
  return (data ?? { ok: false }) as ResultatSuppressionSE
}

/** Normalise un nom en identifiant : "Jazz à Nice 2027" -> "se-jazz-a-nice-2027". */
export function slugSuperEvent(nom: string): string {
  const base = nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return base ? `se-${base}` : ''
}

/* ── Participants d un super event ─────────────────────────────────────── */

export interface Participant {
  joueur_id: string
  nom: string | null
  prenom: string | null
  email: string | null
  tel: string | null
  ville: string | null
  code_postal: string | null
  optin: boolean | null
  nb_tickets: number | null
  nb_parties: number | null
  premiere: string | null
  derniere: string | null
}

/**
 * Participants d un super event, avec leur activite.
 * Les dates sont des jours d exploitation : une partie jouee a 3h du matin est
 * rattachee a la soiree de la veille, pas au lendemain.
 */
export async function fetchParticipants(se: string = SE_DEFAUT): Promise<Participant[]> {
  const { data, error } = await supabase.rpc('super_event_participants', { p_se: se })
  if (error) { console.error('[fetchParticipants]', error.message); return [] }
  return Array.isArray(data) ? (data as Participant[]) : []
}

/**
 * CRM Participants — une ligne par (joueur, event).
 *
 * DISTINCTE de fetchParticipants, qui agrege par joueur sur UN super event et
 * sert les rapports : celle-ci porte le super event, l event, le pro et la
 * SOURCE, pour pouvoir ranger « par super event, sous-categorie event » et
 * repondre a « qui est passe a la Caisse 2 ».
 * `se` omis = acces total, toutes operations confondues.
 */
export interface CrmParticipant {
  joueur_id: string
  nom: string | null; prenom: string | null; email: string | null; tel: string | null
  code_postal: string | null; ville: string | null
  optin: boolean | null; source: string | null
  super_event_id: string | null; super_event_nom: string
  event_id: string; event_nom: string
  pro_id: string | null; pro_nom: string | null
  nb_parties: number; nb_tickets: number
  premiere: string | null; derniere: string | null
}

export async function fetchCrmParticipants(se?: string | null): Promise<CrmParticipant[]> {
  const { data, error } = await supabase.rpc('crm_participants', { p_se: se ?? null })
  // On propage l erreur : renvoyer [] silencieusement affiche « aucun
  // participant », strictement indiscernable d une operation reellement vide.
  if (error) { console.error('[fetchCrmParticipants]', error.message); throw new Error(error.message) }
  return Array.isArray(data) ? (data as CrmParticipant[]) : []
}

/* ── Rapport de fin d operation ────────────────────────────────────────── */

export interface LigneJourStation {
  jour: string; event_id: string; station: string
  type: 'station' | 'commerce'
  hors_festival: boolean
  clics: number; appareils: number; parties: number; joueurs: number
  primo_inscrits: number; joueurs_revenus: number
}
export interface Redirection {
  partenaire: string; jour: string; heure: number
  clics: number; depuis_reseaux: number
}
export interface MeilleurJoueur {
  joueur_id: string; nom: string | null; prenom: string | null
  code_postal: string | null; parties: number; gains: number; optin: boolean | null
}
export interface Repartition { valeur: string; n: number }

export interface Rapport {
  par_jour_station: LigneJourStation[]
  redirections_partenaires: Redirection[]
  meilleurs_joueurs: MeilleurJoueur[]
  genre: Repartition[]
  age: Repartition[]
  decouverte: Repartition[]
  ecrans?: { carte: number; partenaires: number; tickets: number }
  clics_sortants_detail?: { partenaire_id: string; nom: string; lien: string; clics: number }[]
  totaux: {
    joueurs: number; parties: number
    clics_stations: number; clics_partenaires: number; clics_depuis_reseaux: number
    clics_sortants?: number
  }
}

/** Rapport complet d un super event. Toutes les dates sont des jours d exploitation. */
export async function fetchRapport(se: string = SE_DEFAUT): Promise<Rapport | null> {
  const { data, error } = await supabase.rpc('super_event_rapport', { p_se: se })
  if (error) { console.error('[fetchRapport]', error.message); return null }
  return (data as Rapport) ?? null
}

/* ── Pics de jeu ───────────────────────────────────────────────────────── */

export interface CellulePic { soiree: string; heure: number; parties: number; joueurs: number }
export interface Pics {
  cellules: CellulePic[]
  maximum: number
  pic: { soiree: string; heure: number; parties: number } | null
  heure_min: number
  heure_max: number
  creneau_dense: { debut: number; fin: number; parties: number; part: number } | null
}

/** Matrice soiree x heure. La plage horaire est deduite des donnees, jamais imposee. */
export async function fetchPics(se: string = SE_DEFAUT): Promise<Pics | null> {
  const { data, error } = await supabase.rpc('super_event_pics', { p_se: se })
  if (error) { console.error('[fetchPics]', error.message); return null }
  return (data as Pics) ?? null
}

/* ── Origines du trafic (Track QR) ─────────────────────────────────────── */

export interface Origine { source: string; evenements: number; visiteurs: number }
export interface ClicSortant { partenaire_id: string; nom: string; lien: string; clics: number }
export interface TrackQr {
  origines: Origine[]
  total_visiteurs: number
  clics_par_partenaire: { partenaire_id: string; nom: string; clics: number; joueurs: number }[]
  clics_par_lien: { lien: string; clics: number }[]
  total_clics: number
  diagnostic: {
    parties_sans_source: number
    parties_totales: number
    clics_sortants_enregistres: number
  }
}

/** Origines du trafic et clics sortants. */
export async function fetchTrackQr(se: string = SE_DEFAUT): Promise<TrackQr | null> {
  const { data, error } = await supabase.rpc('super_event_track_qr', { p_se: se })
  if (error) { console.error('[fetchTrackQr]', error.message); return null }
  return (data as TrackQr) ?? null
}

/** Libelle lisible d une source technique : reseaux-nook -> "Réseaux · nook". */
export function libelleSource(s: string): string {
  if (s === 'direct') return 'Direct — QR sur place'
  if (s === 'parrainage') return 'Parrainage'
  if (s === 'qr') return 'QR générique'
  if (s.startsWith('reseaux-')) return `Réseaux · ${s.slice(8)}`
  return s
}

/* ── Tracking par station : la colonne vertebrale ──────────────────────── */

export interface StationTracking {
  event_id: string
  station: string
  type: 'nds' | 'partenaire'
  pro_id: string | null
  flashs: number
  physique: number
  digital: number
  parties: number
  joueurs: number
  rejoue: number
  heure_pic: number | null
}
export interface TrackingTotaux {
  flashs: number; physique: number; digital: number
  parties: number; joueurs: number; rejoue: number
}
export interface Tracking {
  stations: StationTracking[]
  totaux: TrackingTotaux
}

/**
 * Tracking par station. Filtrable par pro ou par partenaire pour reutiliser
 * le meme tableau dans une fiche individuelle.
 *
 * DEFINITIONS — ne jamais les melanger :
 *   flash    une ouverture du QR. Une personne qui rescanne compte plusieurs fois.
 *            Ce n est PAS un compteur de personnes.
 *   physique flash sans parametre source (QR de l affiche)
 *   digital  flash avec source reseaux- (lien partage)
 */
export async function fetchTracking(
  se: string = SE_DEFAUT,
  opts: { proId?: string; partenaireId?: string; jour?: string; tout?: boolean } = {}
): Promise<Tracking | null> {
  /* tout = true : tout l historique, sans bornage aux dates du super event.
     Par defaut false, donc les appels existants (fiches pro et partenaire)
     gardent exactement le comportement d avant. Verifie en base le 01/09 :
     borne 2 446 flashs / 18 stations, tout l historique 2 847 / 21 -- trois
     stations n apparaissaient nulle part parce que toute leur activite tombe
     hors de la periode officielle. */
  const { data, error } = await supabase.rpc('station_tracking', {
    p_se: se,
    p_pro: opts.proId ?? null,
    p_partenaire: opts.partenaireId ?? null,
    p_jour: opts.jour ?? null,
    p_tout: opts.tout ?? false,
  })
  if (error) { console.error('[fetchTracking]', error.message); return null }
  return (data as Tracking) ?? null
}

/* ── Chiffres publiables : source unique et opposable ──────────────────── */

/**
 * LA regle de comptage du projet, portee par le code et non par une note.
 *
 * Trois erreurs ont ete commises et re-commises sur ce projet :
 *   1. publier des chiffres NON BORNES aux dates du super event
 *      (1 022 parties au lieu de 986, 640 joueurs au lieu de 617)
 *   2. presenter le nombre de lignes de la table `visites` comme des scans
 *      (8 103 lignes annoncees comme « scans » : c est faux, marqueurs d etape inclus)
 *   3. publier un nombre de visiteurs uniques sans dire qu il n est pas mesurable
 *      sur toute la periode (43 % des flashs du festival sont sans identifiant)
 *
 * `super_event_chiffres` renvoie les chiffres deja bornes, l avertissement de
 * fiabilite, et la liste des valeurs INTERDITES a la publication.
 * Tout support commercial ou rapport doit lire ici — et nulle part ailleurs.
 */
export interface ChiffresPubliables {
  flashs: number
  parties: number
  joueurs: number
  definition_flash: string
  definition_joueur: string
}

export interface ChiffresFiabilite {
  premier_jour_fiable: string | null
  flashs_sans_identifiant: number
  pct_flashs_aveugles: number | null
  visiteurs_uniques_mesures: number
  avertissement_visiteurs: string
}

export interface ChiffresEcarts {
  parties_hors_bornes: number
  joueurs_hors_bornes: number
  joueurs_rattaches_sans_partie: number
  lignes_table_visites: number
  piege_lignes_visites: string
}

export interface Chiffres {
  perimetre: { super_event: string; nom: string; date_d: string; date_f: string }
  publiable: ChiffresPubliables
  fiabilite: ChiffresFiabilite
  ecarts: ChiffresEcarts
  controles: { regle: string; attendu?: number; valeur_interdite?: number; motif?: string }[]
  calcule_le: string
}

/** Chiffres publiables d un super event. Aucun calcul cote client. */
export async function fetchChiffres(se: string = SE_DEFAUT): Promise<Chiffres | null> {
  const { data, error } = await supabase.rpc('super_event_chiffres', { p_se: se })
  if (error) { console.error('[fetchChiffres]', error.message); return null }
  return (data as Chiffres) ?? null
}

/**
 * Controle opposable : un chiffre affiche quelque part est-il conforme ?
 * Renvoie null si conforme, sinon le motif du rejet.
 * Sert a faire echouer un support qui contredit la source unique.
 */
export function controlerChiffre(c: Chiffres, valeur: number): string | null {
  const interdit = c.controles.find(x => x.valeur_interdite === valeur)
  if (interdit) return `Valeur interdite (${valeur}) — ${interdit.motif ?? 'non publiable'}`
  return null
}

/* ── Rapport detaille par point de jeu ─────────────────────────────────── */

/**
 * Un POINT DE JEU est un `ev-<id>` : une station d un super event, ou un partenaire.
 *
 * REGLE DE TRACKING (Romain, 25/07) — le SUPPORT ne compte pas.
 * Affiche, forex, video, sticker : c est le meme QR. Ce qui compte est l identite :
 *   ev=<id>    porte QUI (station ou partenaire)
 *   reseaux-   porte LA REGLE ANTI-REJEU du lien digital unique (one-shot), rien d autre.
 * Ne jamais reintroduire de dimension "support" dans le modele de donnees.
 */
export interface PointJeu {
  event_id: string
  nom: string
  type: 'Station' | 'Partenaire'
  flashs: number
  flashs_lien_unique: number
  visiteurs_mesures: number
  flashs_sans_id: number
  parties: number
  joueurs: number
  parties_lien_unique: number
  joueurs_lien_unique: number
  score_moyen: number | null
  ont_rejoue: number
  avec_coordonnees: number
  optin: number
  avec_code_postal: number
  repondants_bonus: number
  repondants_rse: number
  repondants_bv: number
  heure_pic: number | null
}

export interface RapportPoints {
  perimetre: { super_event: string; nom: string; date_d: string; date_f: string }
  points: PointJeu[]
  totaux: {
    flashs: number; flashs_lien_unique: number
    parties: number; parties_lien_unique: number; joueurs_lien_unique: number
    ont_rejoue: number; points_actifs: number
  }
  lecture: Record<string, string>
}

/** Rapport par point de jeu, borne aux dates du super event. */
export async function fetchRapportPoints(se: string = SE_DEFAUT): Promise<RapportPoints | null> {
  const { data, error } = await supabase.rpc('super_event_rapport_points', { p_se: se })
  if (error) { console.error('[fetchRapportPoints]', error.message); return null }
  return (data as RapportPoints) ?? null
}

/* ── Depouillement des questions bonus ─────────────────────────────────── */

export interface ReponseBonus {
  code: string
  reponse: string
  libelle_trouve: boolean
  n: number
  pct: number | null
}
export interface QuestionBonus {
  cle: string
  libelle: string
  libelle_trouve: boolean
  repondants: number
  choix_multiple: boolean
  reponses: ReponseBonus[]
}
export interface FamilleBonus {
  famille: string
  repondants: number
  questions: QuestionBonus[]
}
export interface BonusResultats {
  super_event: string
  repondants_total: number
  familles: FamilleBonus[]
  lecture: string
}

/**
 * Depouillement des questions bonus.
 * Les FAMILLES (prefixe avant le _) sont des questionnaires DISTINCTS poses a des
 * publics differents : ne jamais les agreger entre elles ni additionner leurs repondants.
 */
export async function fetchBonusResultats(se: string = SE_DEFAUT): Promise<BonusResultats | null> {
  const { data, error } = await supabase.rpc('super_event_bonus_resultats', { p_se: se })
  if (error) { console.error('[fetchBonusResultats]', error.message); return null }
  return (data as BonusResultats) ?? null
}

/* ── Questionnaire de la landing (canal hors parcours) ─────────────────── */

/**
 * DEUX CANAUX DE COLLECTE, une seule banque de questions :
 *   1. bonus en jeu  -> se_reponses     (fetchBonusResultats)
 *   2. landing       -> sondage_brigade (fetchSondageLanding)
 * Ne jamais additionner les repondants des deux sans le preciser : une meme personne
 * peut avoir repondu par les deux chemins.
 */
export interface SondageLanding {
  super_event: string
  canal: string
  saisies_total: number
  par_point: { point: string; saisies: number }[]
  periode: { du: string | null; au: string | null }
  questions: QuestionBonus[]
  lecture: string
}

/** Depouillement du questionnaire saisi hors parcours de jeu. */
export async function fetchSondageLanding(se: string = SE_DEFAUT): Promise<SondageLanding | null> {
  const { data, error } = await supabase.rpc('super_event_sondage_landing', { p_se: se })
  if (error) { console.error('[fetchSondageLanding]', error.message); return null }
  return (data as SondageLanding) ?? null
}

export interface TrackQrJour {
  jour: string
  scans_station: number
  scans_reseaux: number
  visiteurs: number
  clics: number
}

/** Tendance quotidienne des scans/clics — un point par jour sur toute la période de l'event. */
export async function fetchTrackQrQuotidien(se: string = SE_DEFAUT): Promise<TrackQrJour[]> {
  const { data, error } = await supabase.rpc('super_event_track_qr_quotidien', { p_se: se })
  if (error) { console.error('[fetchTrackQrQuotidien]', error.message); return [] }
  return (data as TrackQrJour[]) ?? []
}

