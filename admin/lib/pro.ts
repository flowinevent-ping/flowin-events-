import { supabase } from './supabase'
import type { FlowinEvent, FlowinJoueur, FlowinLot, FlowinPro } from './types'

export interface ProDashboardData {
  pro: FlowinPro | null
  events: FlowinEvent[]
  joueurs: FlowinJoueur[]
  lots: FlowinLot[]
}

export async function fetchProDashboard(proId: string): Promise<ProDashboardData> {
  const empty = { pro: null, events: [], joueurs: [], lots: [] }
  if (!proId) return empty

  /* Pro */
  const { data: pros } = await supabase
    .from('pros')
    .select('*')
    .eq('id', proId)
    .limit(1)

  /* Events du pro */
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('pro_id', proId)
    .order('date_d', { ascending: false })

  if (!events?.length) return { pro: pros?.[0] ?? null, events: [], joueurs: [], lots: [] }

  const evIds = events.map(e => e.id)

  /* Joueurs scopés aux events du pro
     select('*') echoue silencieusement pour anon (pas de droit table-level sur
     joueurs, uniquement colonne par colonne depuis le durcissement securite --
     cf. admin/lib/dashboard.ts). Liste explicite, meme colonnes que fetchAllJoueurs. */
  const COLS_JOUEURS = 'id,ts,pseudo,prenom,nom,email,ecole,classe,genre,ref,pwa_installed,pwa_installed_at,pts_total,streak,updated_at,user_id,push_token,niveau_id,derniere_session,tel,ddn,rgpd_at,profil_complet,code_postal,date_naissance,last_seen,external_id,optin,optin_date,first_seen,ville,events,source,client_type,score_moy,email_lower,ticket_code,gains,age_tranche,enseigne,lot_gagne,decouverte,adresse,tags,secteur,optin_version,classe_id,visiteur_id,etablissement_id,actif,sexe,tranche_age'
  const joueurPromises = evIds.map(eid =>
    supabase.from('joueurs').select(COLS_JOUEURS).contains('events', [eid])
  )
  const joueurResults = await Promise.all(joueurPromises)
  const joueurMap = new Map<string, FlowinJoueur>()
  joueurResults.forEach(r => {
    ;(r.data ?? []).forEach((j: FlowinJoueur) => joueurMap.set(j.id, j))
  })
  const joueurs = Array.from(joueurMap.values())

  /* Lots */
  const { data: lots } = await supabase
    .from('lots')
    .select('*')
    .in('event_id', evIds)

  return {
    pro: pros?.[0] ?? null,
    events: events as FlowinEvent[],
    joueurs: joueurs as FlowinJoueur[],
    lots: (lots ?? []) as FlowinLot[],
  }
}

export function getQrUrl(event: FlowinEvent): string {
  return `https://flowin-events.vercel.app/parcours/${event.module}?ev=${event.id}`
}

/**
 * Cree une nouvelle animation (event) depuis le parcours Pro (/pro/jeu).
 * Reutilise integralement le schema `events` deja en prod (memes colonnes que les events crees
 * cote SA) -- rien invente. Le QR/lien de diffusion physique n'est PAS genere ici : conformement
 * a la regle validee avec Romain (28/07/2026), l'edition/impression du QR reste au Dashboard SA,
 * qui est le centre nevralgique de stockage. Cette fonction pose juste la demande dans
 * cfg.diffusion_demandee, a traiter manuellement par le SA pour l'instant (automatisation plus tard).
 */
export interface CreationAnimation {
  proId: string
  module: string
  nom: string
  dateD: string | null
  dateF: string | null
  banqueId?: string | null
  /* `valeur` : montant affiche sur le billet (« Valeur du bon »). */
  lots: { nom: string; quantite: number; valeur?: number; type: 'tirage' | 'instantane'; conditions: string }[]
  regleRecompense?: { mode: 'tousLesX' | 'aleatoire'; everyX: number; probabilite: number }
  diffusionPhysique: boolean
  diffusionDigital: boolean
  diffusionQrTracking: boolean
}
export async function creerAnimation(params: CreationAnimation): Promise<{ ok: boolean; eventId: string | null; error?: string }> {
  const id = 'ev-' + params.proId.replace(/^pro-/, '') + '-' + Math.random().toString(36).slice(2, 8)
  const premierLot = params.lots[0]
  const premierInstantane = params.lots.find(l => l.type === 'instantane')
  const { error } = await supabase.from('events').insert({
    id,
    pro_id: params.proId,
    nom: params.nom,
    module: params.module,
    status: 'upcoming',
    date_d: params.dateD,
    date_f: params.dateF,
    gain_ticket: params.lots.some(l => l.type === 'tirage'),
    gain_immediat: premierInstantane?.nom ?? null,
    cfg: {
      quizBanques: params.banqueId ? [params.banqueId] : [],
      // lotNom/lotQuantite conserves pour compatibilite avec du code qui lirait encore un lot unique
      lotNom: premierLot?.nom ?? '',
      lotQuantite: premierLot?.quantite ?? 0,
      lots: params.lots,
      regleRecompense: params.regleRecompense ?? null,
      diffusion_demandee: {
        physique: params.diffusionPhysique,
        digital: params.diffusionDigital,
        qr_tracking: params.diffusionQrTracking,
        statut: 'en_attente_sa',
      },
    },
  })
  if (error) { console.error('[creerAnimation]', error.message); return { ok: false, eventId: null, error: error.message } }
  return { ok: true, eventId: id }
}

export function getConversionRate(joueurs: FlowinJoueur[], total: number): number {
  if (!total) return 0
  return Math.round((joueurs.filter(j => j.optin).length / total) * 100)
}
