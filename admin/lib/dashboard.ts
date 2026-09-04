import { supabase } from './supabase'
import type { FlowinJoueur, FlowinEvent, FlowinPartenaire, FlowinLot, FlowinPro } from './types'

/**
 * Colonnes lisibles par la clé anon sur `joueurs` (verifie en base, exclut
 * `password_hash` -- durci par securite, cf. handoff securite). `select('*')`
 * echoue ENTIEREMENT pour ce role (pas de droit table-level, uniquement
 * colonne par colonne) : l'erreur est silencieuse (pas de check `error` sur
 * ces appels), donnees vides sans aucun signal. Trouve le 28/08 -- affectait
 * fetchAllJoueurs (donc TOUT le dashboard via le contexte partage) et
 * fetchEventParticipants. Toujours utiliser cette liste, jamais '*', sur
 * `joueurs` en anon.
 */
const COLONNES_JOUEURS_ANON = 'id,ts,pseudo,prenom,nom,email,ecole,classe,genre,ref,pwa_installed,pwa_installed_at,pts_total,streak,updated_at,user_id,push_token,niveau_id,derniere_session,tel,ddn,rgpd_at,profil_complet,code_postal,date_naissance,last_seen,external_id,optin,optin_date,first_seen,ville,events,source,client_type,score_moy,email_lower,ticket_code,gains,age_tranche,enseigne,lot_gagne,decouverte,adresse,tags,secteur,optin_version,classe_id,visiteur_id,etablissement_id,actif,sexe,tranche_age'

/* ── Joueurs ── */
export async function fetchAllJoueurs(): Promise<FlowinJoueur[]> {
  const { data, error } = await supabase
    .from('joueurs')
    .select(COLONNES_JOUEURS_ANON)
    .order('updated_at', { ascending: false })
    .limit(1000)
  if (error) console.error('[fetchAllJoueurs]', error.message)
  return (data ?? []) as unknown as FlowinJoueur[]
}

export async function updateJoueur(id: string, fields: Partial<FlowinJoueur>): Promise<boolean> {
  const { error } = await supabase.from('joueurs').update(fields).eq('id', id)
  return !error
}

export async function deleteJoueur(id: string): Promise<boolean> {
  const { error } = await supabase.from('joueurs').delete().eq('id', id)
  return !error
}

/* ── Events ── */
export async function fetchAllEvents(): Promise<FlowinEvent[]> {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('date_d', { ascending: false })
  return (data ?? []) as FlowinEvent[]
}

export async function upsertEvent(ev: Partial<FlowinEvent>): Promise<boolean> {
  const { error } = await supabase.from('events').upsert(ev, { onConflict: 'id' })
  return !error
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  return !error
}

/* ── Partenaires ── */
export async function fetchAllPartenaires(): Promise<FlowinPartenaire[]> {
  const { data } = await supabase
    .from('partenaires')
    .select('*')
    .order('nom')
  return (data ?? []) as FlowinPartenaire[]
}

export async function upsertPartenaire(p: Partial<FlowinPartenaire>): Promise<boolean> {
  const { error } = await supabase.from('partenaires').upsert(p, { onConflict: 'id' })
  return !error
}

export async function deletePartenaire(id: string): Promise<boolean> {
  const { error } = await supabase.from('partenaires').delete().eq('id', id)
  return !error
}

/* ── Lots ── */
export async function fetchAllLots(): Promise<FlowinLot[]> {
  const { data } = await supabase
    .from('lots')
    .select('*')
    .order('event_id')
  return (data ?? []) as FlowinLot[]
}

export async function fetchEventLots(eventId: string): Promise<FlowinLot[]> {
  const { data } = await supabase
    .from('lots')
    .select('*')
    .eq('event_id', eventId)
  return (data ?? []) as FlowinLot[]
}

/* ── Pros ── */
export async function fetchAllPros(): Promise<FlowinPro[]> {
  const { data } = await supabase
    .from('pros')
    .select('*')
    .order('nom')
  return (data ?? []) as FlowinPro[]
}

export async function upsertPro(p: Partial<FlowinPro>): Promise<boolean> {
  const { error } = await supabase.from('pros').upsert(p, { onConflict: 'id' })
  return !error
}

export async function deletePro(id: string): Promise<boolean> {
  const { error } = await supabase.from('pros').delete().eq('id', id)
  return !error
}

/* ── Participations par event ── */
/**
 * Participants reels d'un event donne. Corrigeait auparavant via
 * joueurs.events (array containment) -- pattern deja identifie comme
 * inexact pour un scoping precis par event/station (cf lecons apprises
 * sur les requetes gagnants). La table participations est la source
 * correcte : une ligne par (joueur, event), alimentee a chaque partie.
 */
export async function fetchEventParticipants(eventId: string): Promise<FlowinJoueur[]> {
  const { data: parts } = await supabase
    .from('participations')
    .select('joueur_id')
    .eq('event_id', eventId)
  const joueurIds = Array.from(new Set((parts ?? []).map(p => p.joueur_id).filter(Boolean)))
  if (!joueurIds.length) return []
  const { data, error } = await supabase
    .from('joueurs')
    .select(COLONNES_JOUEURS_ANON)
    .in('id', joueurIds)
    .order('updated_at', { ascending: false })
  if (error) console.error('[fetchEventParticipants]', error.message)
  return (data ?? []) as unknown as FlowinJoueur[]
}

/* ── Stats globales ── */
export async function fetchDashboardStats() {
  const [joueursRes, eventsRes, partenairesRes, lotsRes, prosRes] = await Promise.all([
    supabase.from('joueurs').select('id, optin, gains, events', { count: 'exact' }),
    supabase.from('events').select('id, status, module, participants', { count: 'exact' }),
    supabase.from('partenaires').select('id, actif', { count: 'exact' }),
    supabase.from('lots').select('id, valeur, quantite, retire', { count: 'exact' }),
    supabase.from('pros').select('id', { count: 'exact' }),
  ])
  return {
    totalJoueurs: joueursRes.count ?? 0,
    totalOptins: (joueursRes.data ?? []).filter((j: { optin: boolean }) => j.optin).length,
    totalEvents: eventsRes.count ?? 0,
    liveEvents: (eventsRes.data ?? []).filter((e: { status: string }) => e.status === 'live').length,
    totalPartenaires: partenairesRes.count ?? 0,
    totalLots: lotsRes.count ?? 0,
    totalPros: prosRes.count ?? 0,
    totalGagnants: (joueursRes.data ?? []).filter((j: { gains: number }) => j.gains > 0).length,
  }
}

/* ── Super Event : tickets & gains ── */
export interface SeTicketRow { event_id: string | null; super_event_id: string | null }
export interface SeGainRow { id: string; libelle: string | null; code: string | null; utilise: boolean | null; event_id: string | null; super_event_id: string | null }

export async function fetchJoueurTicketsGains(joueurId: string): Promise<{ tickets: SeTicketRow[]; gains: SeGainRow[] }> {
  const [tk, ga] = await Promise.all([
    supabase.from('se_tickets').select('event_id,super_event_id').eq('joueur_id', joueurId),
    supabase.from('se_gains').select('id,libelle,code,utilise,event_id,super_event_id').eq('joueur_id', joueurId),
  ])
  return { tickets: (tk.data ?? []) as SeTicketRow[], gains: (ga.data ?? []) as SeGainRow[] }
}

/* ── Gains reels (table tirages, retrait_token/QR -- 28/07/2026) ──
 * A NE PAS confondre avec se_gains ci-dessus (systeme different, plus vieux, sans QR) ni avec
 * lots.assigne_a (attribution directe hors tirage). C'est cette table que lisent lot.html,
 * valider_lot, billets-partenaires.html -- les vrais gains avec billet/QR exploitables. */
export interface TirageRow {
  id: string
  lot_nom: string | null
  lot_valeur: number | null
  partenaire_id: string | null
  super_event_id: string | null
  retrait_token: string | null
  retire_at: string | null
  statut: string | null
  created_at: string | null
}
/**
 * Historique reel de jeu d'un joueur : quelle station (source_qr), quelle
 * heure (started_at), quel score, quelles reponses bonus. Distinct de
 * j.events (simple liste d'ids sur la fiche joueur, sans detail) -- la table
 * participations est la seule a porter le detail station-level demande par
 * Romain pour la fiche joueur (historique de navigation, stations, heures,
 * lots, reponses).
 */
export interface ParticipationRow {
  id: string
  event_id: string
  score: number | null
  ticket_code: string | null
  bonus_answers: Record<string, unknown> | null
  completed: boolean | null
  tickets: number | null
  source_qr: string | null
  played_date: string | null
  started_at: string | null
  created_at: string | null
}
export async function fetchJoueurParticipations(joueurId: string): Promise<ParticipationRow[]> {
  const { data, error } = await supabase
    .from('participations')
    .select('id,event_id,score,ticket_code,bonus_answers,completed,tickets,source_qr,played_date,started_at,created_at')
    .eq('joueur_id', joueurId)
    .order('created_at', { ascending: false })
  if (error) { console.error('[fetchJoueurParticipations]', error.message); return [] }
  return (data ?? []) as ParticipationRow[]
}

/* ── QR stations & liens ephemeres (par event, geres cote SA) ──────────────
 * Deux formats de diffusion demandes par Romain, generes automatiquement
 * cote SA puis publies (rendus visibles) pour le pro :
 * 1. QR fixe trackable, declinable en plusieurs stations pour un meme
 *    commerce (ex. Caisse 1 / Bar 1 / Bar 2)
 * 2. Lien ephemere a usage unique -- consomme via consommer_lien_ephemere(),
 *    devient invalide des la premiere utilisation reelle.
 */
export interface QrStation {
  id: string
  event_id: string
  nom: string
  source_qr: string
  publie: boolean
  created_at: string
}
export async function fetchQrStations(eventId: string): Promise<QrStation[]> {
  const { data, error } = await supabase.from('qr_stations').select('*').eq('event_id', eventId).order('created_at')
  if (error) { console.error('[fetchQrStations]', error.message); return [] }
  return (data ?? []) as QrStation[]
}
export async function creerQrStation(eventId: string, nom: string): Promise<boolean> {
  const source = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const { error } = await supabase.from('qr_stations').insert({ event_id: eventId, nom, source_qr: source || 'station' })
  if (error) { console.error('[creerQrStation]', error.message); return false }
  return true
}
export async function publierQrStation(id: string, publie: boolean): Promise<boolean> {
  const { error } = await supabase.from('qr_stations').update({ publie }).eq('id', id)
  return !error
}

export interface LienEphemere {
  id: string
  event_id: string
  nom: string | null
  token: string
  publie: boolean
  used_at: string | null
  created_at: string
}
export async function fetchLiensEphemeres(eventId: string): Promise<LienEphemere[]> {
  const { data, error } = await supabase.from('liens_ephemeres').select('*').eq('event_id', eventId).order('created_at')
  if (error) { console.error('[fetchLiensEphemeres]', error.message); return [] }
  return (data ?? []) as LienEphemere[]
}
export async function creerLienEphemere(eventId: string, nom: string): Promise<boolean> {
  const { error } = await supabase.from('liens_ephemeres').insert({ event_id: eventId, nom })
  if (error) { console.error('[creerLienEphemere]', error.message); return false }
  return true
}
export async function publierLienEphemere(id: string, publie: boolean): Promise<boolean> {
  const { error } = await supabase.from('liens_ephemeres').update({ publie }).eq('id', id)
  return !error
}

export async function fetchJoueurTirages(joueurId: string): Promise<TirageRow[]> {
  const { data, error } = await supabase
    .from('tirages')
    .select('id,lot_nom,lot_valeur,partenaire_id,super_event_id,retrait_token,retire_at,statut,created_at')
    .eq('joueur_id', joueurId)
    .order('created_at', { ascending: false })
  if (error) { console.error('[fetchJoueurTirages]', error.message); return [] }
  return (data ?? []) as TirageRow[]
}

/* ── Gagnants (liste complete, dashboard SA) ──
 * Meme table tirages que fetchJoueurTirages ci-dessus, non filtree par joueur cette fois.
 * Remplace l ancienne lecture sur joueurs.gains (colonne jamais alimentee par le vrai systeme
 * de tirage -- 0 lignes > 0 verifie en base -- cause du "0 resultat" constate sur /dashboard/gagnants). */
export interface GagnantRow {
  id: string
  joueur_id: string | null
  joueur_nom: string | null
  joueur_email: string | null
  ticket_code: string | null
  lot_nom: string | null
  lot_valeur: number | null
  partenaire_id: string | null
  super_event_id: string | null
  statut: string | null
  notifie_at: string | null
  retire_at: string | null
  retrait_token: string | null
  created_at: string | null
}
export async function fetchGagnants(): Promise<GagnantRow[]> {
  const { data, error } = await supabase
    .from('tirages')
    .select('id,joueur_id,joueur_nom,joueur_email,ticket_code,lot_nom,lot_valeur,partenaire_id,super_event_id,statut,notifie_at,retire_at,retrait_token,created_at')
    .neq('statut', 'annule')
    .order('created_at', { ascending: false })
  if (error) { console.error('[fetchGagnants]', error.message); return [] }
  return (data ?? []) as GagnantRow[]
}

/* ── Super Event : stats agrégées d'un commerce (espace pro) ──
   FIX 29/08 : lisait se_gains (table abandonnee le 28/07, toujours vide,
   meme bug que v_se_dashboard cote SA -- cf. migration
   fix_v_se_dashboard_gains_tirages). Les vrais gains vivent dans tirages,
   lie par partenaire_id (pas event_id) -- resolu via events -> pros. */
export async function fetchEventSuperEventStats(eventId: string): Promise<{ tickets: number; gains: number; gainsUtilises: number }> {
  const { data: ev } = await supabase.from('events').select('pro_id,super_event_id').eq('id', eventId).single()
  const [tk, pro] = await Promise.all([
    supabase.from('se_tickets').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    ev?.pro_id ? supabase.from('pros').select('partenaire_id').eq('id', ev.pro_id).single() : Promise.resolve({ data: null }),
  ])
  const partenaireId = (pro as { data: { partenaire_id: string | null } | null } | undefined)?.data?.partenaire_id
  if (!partenaireId || !ev?.super_event_id) return { tickets: tk.count ?? 0, gains: 0, gainsUtilises: 0 }
  const { data: tirages } = await supabase.from('tirages').select('statut')
    .eq('partenaire_id', partenaireId).eq('super_event_id', ev.super_event_id)
  const rows = (tirages ?? []) as { statut: string | null }[]
  return {
    tickets: tk.count ?? 0,
    gains: rows.length,
    gainsUtilises: rows.filter((g) => g.statut === 'retire').length,
  }
}

/* ── Marquer un gain comme retire ───────────────────────────────────────────
 *
 * CORRIGE LE 04/09, meme cause que fetchProGains : cette fonction ecrivait
 * dans `se_gains`, table vide et lue par personne. Une validation faite depuis
 * l'espace pro ne destockait donc RIEN, sans que rien ne le signale.
 *
 * Elle ecrit maintenant dans `tirages`, aux memes colonnes que le dashboard
 * SA : `statut` et `retire_at`.
 *
 * Ceci reste le marquage manuel depuis l'espace pro. La validation en caisse
 * avec code PIN passe, elle, par valider_lot(token, pin) -- RPC existant, seul
 * chemin qui verifie le PIN. Les deux ecrivent au meme endroit, donc ne se
 * contredisent plus. */
export async function marquerGainUtilise(gainId: string, utilise: boolean): Promise<boolean> {
  const { error } = await supabase.from('tirages').update({
    /* Les seuls statuts en base sont 'actif', 'retire', 'annule' (verifie le
       04/09 : 57 / 23 / 155). Ecrire 'attribue' aurait cree une quatrieme
       valeur qu aucune requete du projet ne connait. */
    statut: utilise ? 'retire' : 'actif',
    retire_at: utilise ? new Date().toISOString() : null,
  }).eq('id', gainId)
  if (error) console.error('[marquerGainUtilise]', error.message)
  return !error
}

/* ── Gains d'un commerce : la liste que voit le pro ─────────────────────────
 *
 * CORRIGE LE 04/09. Cette fonction lisait `se_gains`, table ABANDONNEE LE
 * 28/07 et vide depuis : 0 ligne, quand `tirages` en compte 235 dont 80
 * actives. L'espace pro affichait donc toujours zero gagnant, quel que soit le
 * commerce -- constate par Romain sur /pro/tirage.
 *
 * C'est le meme bug que celui deja corrige cote SA en juillet sur
 * `v_se_dashboard` et `fetchEventSuperEventStats` ; il etait reste ici.
 *
 * La vraie source est `tirages`, exactement celle que lit le dashboard SA
 * (fetchGagnants). Le lien passe par le PARTENAIRE, pas par l'event : un
 * tirage porte `partenaire_id`, pas `event_id`. On resout donc
 * events -> pros.partenaire_id, comme le fait deja
 * fetchEventSuperEventStats.
 *
 * `statut = 'retire'` remplace l'ancien booleen `utilise` : c'est la valeur
 * qu'ecrit valider_lot(), le RPC qui destocke reellement. */
export interface ProGainRow {
  id: string; libelle: string | null; code: string | null; utilise: boolean | null
  event_id: string | null; joueur: string
  email: string | null; valeur: number | null; retraitToken: string | null; superEventId: string | null
}
export async function fetchProGains(eventIds: string[]): Promise<ProGainRow[]> {
  if (!eventIds.length) return []

  const { data: evs } = await supabase.from('events').select('id,pro_id').in('id', eventIds)
  const proIds = Array.from(new Set((evs ?? []).map(e => (e as { pro_id: string | null }).pro_id).filter(Boolean))) as string[]
  if (!proIds.length) return []

  const { data: pros } = await supabase.from('pros').select('id,partenaire_id').in('id', proIds)
  const partIds = Array.from(new Set((pros ?? [])
    .map(p => (p as { partenaire_id: string | null }).partenaire_id).filter(Boolean))) as string[]
  if (!partIds.length) return []

  const { data } = await supabase
    .from('tirages')
    .select('id,joueur_nom,joueur_email,ticket_code,lot_nom,lot_valeur,statut,retrait_token,super_event_id,created_at')
    .in('partenaire_id', partIds).neq('statut', 'annule')
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as {
    id: string; joueur_nom: string | null; joueur_email: string | null; ticket_code: string | null
    lot_nom: string | null; lot_valeur: number | null; statut: string | null
    retrait_token: string | null; super_event_id: string | null
  }[]

  /* `event_id` reste a null : un tirage n'en porte pas. Le rattachement d'un
     gain a une station precise n'existe pas en base -- ne pas en inventer un. */
  return rows.map(r => ({
    id: r.id,
    libelle: r.lot_nom,
    code: r.ticket_code,
    utilise: r.statut === 'retire',
    event_id: null,
    joueur: r.joueur_nom || '—',
    email: r.joueur_email,
    valeur: r.lot_valeur,
    retraitToken: r.retrait_token,
    superEventId: r.super_event_id,
  }))
}

/* ── Tirage au sort : envoi reel du ticket gagnant par email ──
 * Reutilise la fonction edge send-ticket-gagnant (Resend, compte enregistre sur
 * flowinevent@gmail.com) deja deployee -- rien de recode. Parametrable par pro
 * (28/07/2026, demande Romain) : fromName et replyTo personnalisent le "De :" et le
 * "Répondre à :" avec l'identite du pro, sans toucher a l'adresse technique d'envoi
 * (verifiee chez Resend, non substituable par domaine de pro sans verification prealable). */
export async function envoyerTicketGagnant(params: {
  gagnantEmail: string
  gagnantNom: string
  lotNom: string
  lotDescription?: string
  code: string
  retraitToken?: string | null
  partenaireNom?: string | null
  partenaireAdresse?: string | null
  partenaireTel?: string | null
  conditions?: string
  validejusquAu?: string
  fromName?: string
  replyTo?: string
}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('send-ticket-gagnant', {
    body: {
      gagnant_email: params.gagnantEmail,
      gagnant_nom: params.gagnantNom,
      lot_nom: params.lotNom,
      lot_description: params.lotDescription ?? '',
      code: params.code,
      retrait_token: params.retraitToken ?? '',
      partenaire_nom: params.partenaireNom ?? '',
      partenaire_adresse: params.partenaireAdresse ?? '',
      partenaire_tel: params.partenaireTel ?? '',
      conditions: params.conditions ?? '',
      valide_jusqu_au: params.validejusquAu ?? '',
      from_name: params.fromName ?? '',
      reply_to: params.replyTo ?? '',
    },
  })
  if (error) { console.error('[envoyerTicketGagnant]', error.message); return { ok: false, error: error.message } }
  const res = data as { ok?: boolean; error?: string } | null
  if (res && res.ok === false) return { ok: false, error: res.error ?? 'échec envoi' }
  return { ok: true }
}

/* ── Tirage au sort : persiste le gagnant tiré (sinon perdu au rechargement) ── */
export async function enregistrerTirage(params: {
  superEventId: string | null
  eventId: string | null
  lotNom: string
  partenaireId?: string | null
  lotValeur?: number | null
  joueur: { id: string; prenom?: string | null; nom?: string | null; email?: string | null; tel?: string | null }
}): Promise<{ ok: boolean; code: string; retraitToken: string | null }> {
  /* 28/07/2026 -- remplace l'ecriture dans se_gains (dead-end, aucun retrait_token, aucun
   * billet exploitable) par attribuer_gain_joueur(), RPC additive miroir de tirage_lot() deja
   * en prod. Ecrit dans `tirages`, meme table que le mecanisme de validation QR deja utilise
   * pendant le festival (lot.html / valider_lot / billets-partenaires.html). */
  const { data, error } = await supabase.rpc('attribuer_gain_joueur', {
    p_joueur_id: params.joueur.id,
    p_lot_nom: params.lotNom,
    p_partenaire_id: params.partenaireId ?? null,
    p_valeur: params.lotValeur ?? null,
    p_super_event_id: params.superEventId,
  })
  if (error) { console.error('[enregistrerTirage] rpc échouée:', error.message); return { ok: false, code: '', retraitToken: null } }
  const row = Array.isArray(data) ? data[0] : data
  return { ok: !!row, code: row?.ticket_code ?? '', retraitToken: row?.retrait_token ?? null }
}

/* ── Clics partenaires rattachés à un pro (via partenaires.event_id ∈ events du pro) ── */
export async function fetchProClics(eventIds: string[]): Promise<number> {
  if (!eventIds.length) return 0
  const { data: parts } = await supabase.from('partenaires').select('id').in('event_id', eventIds)
  const ids = ((parts ?? []) as { id: string }[]).map(p => p.id)
  if (!ids.length) return 0
  const { count } = await supabase.from('partenaire_clics').select('id', { count: 'exact', head: true }).in('partenaire_id', ids)
  return count ?? 0
}

/* ── Facturation réelle d'un partenaire ──
 * bons_commande.partenaire_id ajouté ce soir (colonne absente jusqu'ici -- la
 * fiche Partenaire n'affichait qu'un drapeau manuel facture_emise, jamais
 * relié à la vraie facture. 8/8 bons NDS 2026 rapprochés et liés). */
export interface FacturePartenaire {
  bonId: string
  montantTtc: number | null
  bonStatut: string | null
  factureNumero: string | null
  factureStatut: string | null
  dateEmission: string | null
}
export async function fetchFacturePartenaire(partenaireId: string): Promise<FacturePartenaire | null> {
  const { data: bons, error: e1 } = await supabase
    .from('bons_commande')
    .select('id, montant_ttc, statut')
    .eq('partenaire_id', partenaireId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (e1) { console.error('[fetchFacturePartenaire] bons', e1.message); return null }
  const bon = bons?.[0]
  if (!bon) return null

  const { data: factures, error: e2 } = await supabase
    .from('factures')
    .select('numero, statut, date_emission')
    .eq('client->>bon_id', bon.id)
    .order('numero', { ascending: false })
    .limit(1)
  if (e2) { console.error('[fetchFacturePartenaire] factures', e2.message) }
  const fac = factures?.[0]

  return {
    bonId: bon.id,
    montantTtc: bon.montant_ttc,
    bonStatut: bon.statut,
    factureNumero: fac?.numero ?? null,
    factureStatut: fac?.statut ?? null,
    dateEmission: fac?.date_emission ?? null,
  }
}

/* ── Tirage au sort depuis l'espace pro ─────────────────────────────────────
 *
 * Romain, 04/09 : « si on est sur un evenement il faut pouvoir faire le tirage
 * et le retirage et tout le process ».
 *
 * Le vivier : les joueurs qui ont REELLEMENT joue sur cet event, lus dans
 * `participations` -- pas dans `joueurs.events`, tableau non fiable pour
 * l'attribution exacte a une station.
 *
 * Deux exclusions permanentes, deja appliquees a toutes les requetes de vivier
 * du projet : les comptes de test « collin », et « Lucie Giordano », qui est le
 * vrai contact du partenaire Giordano et non une joueuse.
 */
export interface JoueurEligible { id: string; nom: string; email: string | null; tel: string | null }

export async function fetchJoueursEligibles(eventId: string, exclureIds: string[] = []): Promise<JoueurEligible[]> {
  const { data: parts } = await supabase
    .from('participations').select('joueur_id').eq('event_id', eventId).not('joueur_id', 'is', null)
  const ids = Array.from(new Set(((parts ?? []) as { joueur_id: string }[]).map(p => p.joueur_id)))
    .filter(id => !exclureIds.includes(id))
  if (!ids.length) return []

  const { data: js } = await supabase.from('joueurs').select('id,prenom,nom,email,tel').in('id', ids)
  return ((js ?? []) as { id: string; prenom: string | null; nom: string | null; email: string | null; tel: string | null }[])
    .map(j => ({ id: j.id, nom: `${j.prenom ?? ''} ${j.nom ?? ''}`.trim() || '—', email: j.email, tel: j.tel }))
    .filter(j => {
      const n = j.nom.toLowerCase()
      return !n.includes('collin') && n !== 'lucie giordano'
    })
}

/**
 * Annule un tirage — c'est le « retirage » : on libere le lot, puis on en tire
 * un autre. Le statut passe a 'annule', valeur deja utilisee en base (155
 * lignes au 04/09), et non a une suppression : on garde la trace de qui avait
 * ete tire et ecarte.
 *
 * NE PAS EXPOSER SUR UN SUPER EVENT : Romain, 04/09 -- « en autonomie pour les
 * events, en revanche pas pour les super events, SA reste pilote ». Le garde-fou
 * est a l'ecran, cette fonction ne fait qu'executer.
 */
export async function annulerTiragePro(tirageId: string): Promise<boolean> {
  const { error } = await supabase.from('tirages')
    .update({ statut: 'annule' }).eq('id', tirageId)
  if (error) console.error('[annulerTiragePro]', error.message)
  return !error
}
