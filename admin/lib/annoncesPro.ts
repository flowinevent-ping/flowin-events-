/**
 * ANNONCES DU COMMERCE (18/11/2026) — notification dans l'application, jamais d'e-mail ni de SMS.
 * Destinataires : les participants qui ont accepté « rester en contact avec ce commerce »
 * (clients_commerce.optin, sinon se_reponses.bonus_reponses.optin_commerce).
 * RPC : sql/2026-11-18-annonces-pro.sql (annonce_pro_etat, envoyer_annonce_pro, annonces_pro_liste).
 * Tant que le SQL n'est pas appliqué, `indisponible` vaut vrai : l'écran affiche
 * « Bientôt disponible : activation en cours ».
 */
import { supabase } from '@/lib/supabase'

export const ANNONCE_TITRE_MAX = 60
export const ANNONCE_MESSAGE_MAX = 200
export const ANNONCES_PAR_SEMAINE = 2

export interface EtatAnnonce { destinataires: number; restantes: number }
export interface AnnonceEnvoyee {
  id: string; pro_id: string; commerce: string; titre: string; message: string
  lien: string | null; date_fin: string | null; nb_destinataires: number; created_at: string
}

/** Fonction ou table absente (SQL pas encore appliqué). */
export function estAbsent(e: { code?: string; message?: string } | null | undefined): boolean {
  if (!e) return false
  const c = e.code || ''
  const m = (e.message || '').toLowerCase()
  return c === 'PGRST202' || c === '42883' || c === '42P01' || c === 'PGRST205' || m.indexOf('could not find the function') >= 0 || m.indexOf('does not exist') >= 0
}

export async function chargerEtatAnnonce(proId: string): Promise<{ etat: EtatAnnonce | null; indisponible: boolean }> {
  const { data, error } = await supabase.rpc('annonce_pro_etat', { p_pro: proId }, { get: true })
  if (error) return { etat: null, indisponible: estAbsent(error) }
  const d = (data || {}) as { destinataires?: number; restantes?: number }
  if (typeof d.destinataires !== 'number') return { etat: null, indisponible: true }
  return { etat: { destinataires: d.destinataires, restantes: Number(d.restantes) || 0 }, indisponible: false }
}

export async function envoyerAnnonce(proId: string, a: { titre: string; message: string; lien: string; dateFin: string }):
  Promise<{ ok: boolean; n: number; erreur?: string; indisponible?: boolean }> {
  const { data, error } = await supabase.rpc('envoyer_annonce_pro', {
    p_pro: proId, p_titre: a.titre.trim(), p_message: a.message.trim(),
    p_lien: a.lien.trim() || null, p_date_fin: a.dateFin || null,
  })
  if (error) {
    if (estAbsent(error)) return { ok: false, n: 0, indisponible: true }
    const m = error.message || ''
    if (m.indexOf('limite') >= 0) return { ok: false, n: 0, erreur: `Limite atteinte : ${ANNONCES_PAR_SEMAINE} annonces par semaine.` }
    if (m.indexOf('acces') >= 0) return { ok: false, n: 0, erreur: 'Connectez-vous à votre espace pour envoyer.' }
    return { ok: false, n: 0, erreur: 'Envoi impossible pour le moment.' }
  }
  return { ok: true, n: typeof data === 'number' ? data : 0 }
}

/** Super admin : p_pro null = toutes les annonces. */
export async function listerAnnonces(proId: string | null): Promise<{ liste: AnnonceEnvoyee[]; indisponible: boolean }> {
  const { data, error } = await supabase.rpc('annonces_pro_liste', { p_pro: proId }, { get: true })
  if (error) return { liste: [], indisponible: estAbsent(error) }
  return { liste: Array.isArray(data) ? (data as AnnonceEnvoyee[]) : [], indisponible: !Array.isArray(data) }
}

/** Lien accepté : https://… ou chemin de l'application (/parcours/…). */
export function lienValide(l: string): boolean {
  const s = l.trim()
  return !s || /^https:\/\/[^\s]+$/.test(s) || /^\/[^\s]*$/.test(s)
}
