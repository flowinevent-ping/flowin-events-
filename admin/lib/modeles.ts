import { supabase } from './supabase'
import { fetchEvent } from './events'
import { fetchLots } from './lots'
import { brouillonVide, type BrouillonEvent, type BrouillonLot } from './wizard'
import type { Module } from './types'

/**
 * MODELES DE JEU — « meme frame, personnalisable depuis le SA » (Romain, 04/09).
 *
 * CE FICHIER NE CREE AUCUNE TABLE. `event_modeles` existe deja en base depuis
 * l origine, avec exactement les colonnes d un modele reutilisable :
 *   nom, description, module, cfg, lots, pro_visib, couleur, score_min,
 *   origine_event_id.
 * Elle etait vide et sans aucun ecran (constat 13 de docs/audit-parcours.html).
 * On lui donne son ecran, on ne la remplace pas.
 *
 * RLS verifiee avant ecriture : `flowin_anon_all_event_modeles [ALL]`, donc le
 * dashboard SA ecrit avec la cle anonyme comme il le fait deja sur `events`,
 * `lots` et `banques`. Aucune migration n est necessaire.
 *
 * DEUX CLES SONT VOLONTAIREMENT RETIREES du cfg au moment de fabriquer le
 * modele — elles appartiennent a l event d origine, pas au gabarit :
 *
 *  - `qrUrl` porte l identifiant de l event d origine. Recopie telle quelle,
 *    elle produirait un QR imprime pointant vers l ANCIEN event. `enregistrer()`
 *    le recalcule de toute facon sur l identifiant definitif (lib/wizard.ts),
 *    mais le laisser dans le modele reviendrait a stocker une valeur fausse en
 *    attendant qu un autre code la corrige.
 *  - `partenaires` est la liste des commerces de l operation d origine. Un
 *    gabarit marque blanche ne transporte pas les partenaires des Nuits du Sud.
 *
 * Tout le reste du cfg est conserve tel quel : banques quiz et bonus, texte
 * d intro, nombre de questions, chrono, segments de roue selon le module.
 */

export interface EventModele {
  id: string
  nom: string
  description: string | null
  module: Module
  cfg: Record<string, unknown>
  lots: BrouillonLot[]
  pro_visib: Record<string, boolean>
  couleur: string | null
  score_min: number
  origine_event_id: string | null
  created_at: string
}

/** Les cles du cfg qui appartiennent a l event, jamais au modele. */
const CLES_NON_TRANSPOSABLES = ['qrUrl', 'partenaires'] as const

function cfgTransposable(cfg: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const sortie: Record<string, unknown> = { ...(cfg ?? {}) }
  for (const cle of CLES_NON_TRANSPOSABLES) delete sortie[cle]
  return sortie
}

function identifiant(): string {
  return `mod-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export async function fetchModeles(): Promise<EventModele[]> {
  const { data, error } = await supabase
    .from('event_modeles').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(`Modèles non chargés — ${error.message}`)
  return (data ?? []) as EventModele[]
}

export interface ResultatModele { ok: boolean; modeleId?: string; erreur?: string }

/**
 * Fabrique un modele a partir d un event qui tourne deja. C est le sens de la
 * colonne `origine_event_id` : on ne decrit pas un gabarit a la main, on prend
 * celui qui marche — NDS 2026 — et on en fait le point de depart des suivants.
 *
 * Les lots sont recopies SANS leur `partenaire_id` : la quantite et le nom du
 * lot font partie du gabarit, le commerce qui l offre non.
 */
export async function creerModeleDepuisEvent(
  eventId: string,
  nom: string,
  description: string,
): Promise<ResultatModele> {
  if (!nom.trim()) return { ok: false, erreur: 'Le modèle doit avoir un nom.' }

  const ev = await fetchEvent(eventId)
  if (!ev) return { ok: false, erreur: `Événement ${eventId} introuvable.` }

  /* Les lots de l event, si la lecture echoue on ne bloque pas la creation du
     modele : un gabarit sans lots reste utilisable, et le dire vaut mieux que
     tout refuser. */
  let lots: BrouillonLot[] = []
  try {
    lots = (await fetchLots(eventId))
      .filter(l => !l.retire)
      .map(l => ({
        nom: l.nom ?? '',
        valeur: l.valeur ?? 0,
        quantite: l.quantite ?? 1,
        emoji: l.emoji ?? null,
        description: l.description ?? null,
      }))
  } catch {
    lots = []
  }

  const id = identifiant()
  const { error } = await supabase.from('event_modeles').insert({
    id,
    nom: nom.trim(),
    description: description.trim() || null,
    module: ev.module,
    cfg: cfgTransposable(ev.cfg as unknown as Record<string, unknown>),
    lots,
    pro_visib: ev.pro_visib ?? {},
    couleur: ev.couleur ?? null,
    score_min: ev.score_min ?? 0,
    origine_event_id: eventId,
  })
  if (error) return { ok: false, erreur: `Modèle non enregistré — ${error.message}` }
  return { ok: true, modeleId: id }
}

export async function supprimerModele(id: string): Promise<{ ok: boolean; erreur?: string }> {
  const { error } = await supabase.from('event_modeles').delete().eq('id', id)
  if (error) return { ok: false, erreur: `Modèle non supprimé — ${error.message}` }
  return { ok: true }
}

/**
 * Applique un modele a un brouillon EN COURS DE SAISIE.
 *
 * Ce qui vient du modele : le module, la configuration de jeu, les lots, la
 * visibilite pro, la couleur, le score minimum.
 * Ce qui reste au brouillon : le nom, le pro, les dates, le lieu, l adresse,
 * le rattachement au super event. Ce sont les champs propres a l operation —
 * les ecraser avec ceux du modele ferait disparaitre sous les yeux du SA une
 * saisie qu il vient de faire.
 */
export function appliquerModele(m: EventModele, base: BrouillonEvent): BrouillonEvent {
  return {
    ...base,
    module: m.module,
    cfg: cfgTransposable(m.cfg),
    lots: (m.lots ?? []).map(l => ({ ...l })),
    pro_visib: { ...(m.pro_visib ?? base.pro_visib) },
    couleur: m.couleur ?? base.couleur,
    score_min: m.score_min ?? base.score_min,
  }
}

/** Un brouillon neuf directement issu d un modele. */
export function brouillonDepuisModele(m: EventModele, superEventId: string | null = null): BrouillonEvent {
  return appliquerModele(m, brouillonVide(superEventId))
}

/** Ce que le modele apporte, pour l afficher avant de l appliquer. */
export function resumeModele(m: EventModele): string[] {
  const cfg = m.cfg ?? {}
  const nb = (cle: string) => ((cfg[cle] as string[]) ?? []).length
  const bouts: string[] = []
  if (nb('quizBanques')) bouts.push(`${nb('quizBanques')} banque${nb('quizBanques') > 1 ? 's' : ''} quiz`)
  if (nb('bonusBanques')) bouts.push(`${nb('bonusBanques')} banque${nb('bonusBanques') > 1 ? 's' : ''} bonus`)
  if ((m.lots ?? []).length) bouts.push(`${m.lots.length} lot${m.lots.length > 1 ? 's' : ''}`)
  if (typeof cfg.quizNbQuestions === 'number') bouts.push(`${cfg.quizNbQuestions} questions par partie`)
  return bouts
}
