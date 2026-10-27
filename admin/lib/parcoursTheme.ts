import type { Module, EventCfg } from './types'
import { NDS_JEU_FOND } from './parcours'

/* ── Système de thème à deux niveaux, pour l'habillage des parcours jeu ──

   Niveau A — "master" par module : valeurs par défaut ci-dessous
   (PARCOURS_THEME_DEFAULTS), en dur dans le code. Aujourd'hui elles
   reproduisent exactement l'habillage déjà en prod (NDS_JEU_FOND, pas de
   logo substitué) : rien ne change visuellement pour un event qui ne
   configure rien.

   Niveau B — surcharge par event/pro : stockée dans `events.cfg.theme`
   (EventCfg.theme, voir lib/types.ts), posée par un admin via l'éditeur de
   thème (à construire — voir note en bas de fichier). Elle ne modifie
   jamais le master niveau A ; `resolveParcoursTheme` fusionne les deux à la
   lecture, sans jamais écrire dans PARCOURS_THEME_DEFAULTS.

   Remarque : un vrai master niveau A éditable en base (une table dédiée,
   plutôt que ces constantes) demanderait une migration SQL. Le connecteur
   Supabase de cette session pointe sur le mauvais compte/organisation
   (voir docs/rapatriement-compte-maitre.md) -- on ne lance donc pas de DDL
   à l'aveugle. Migration prête à être appliquée une fois le connecteur
   réparé :

     create table if not exists parcours_theme_master (
       module text primary key references events(module),
       bg_color text, bg_image text, logo_url text, logo_svg text,
       texts jsonb not null default '{}'::jsonb,
       updated_at timestamptz not null default now()
     );

   D'ici là, PARCOURS_THEME_DEFAULTS ci-dessous fait office de master :
   modifiable par un développeur, pas encore par l'admin depuis une UI. */

export interface ParcoursTheme {
  bgColor: string
  bgImage?: string
  logoUrl?: string
  logoSvg?: string
  logoEmoji?: string
  texts: Record<string, string>
}

const BASE: ParcoursTheme = { bgColor: NDS_JEU_FOND, texts: {} }

export const PARCOURS_THEME_DEFAULTS: Record<Module, ParcoursTheme> = {
  vote: { ...BASE, texts: { landingSubtitle: 'Votez pour vos favoris !', ctaLanding: 'Voter maintenant' } },
  quiz: { ...BASE, texts: {} },
  quizmaster: { ...BASE, texts: {} },
  quizsolo: { ...BASE, texts: { ctaLanding: 'Démarrer le quiz' } },
  spin: { ...BASE, texts: {} },
  tombola: { ...BASE, texts: { ctaLanding: "Je m'inscris à la tombola" } },
  nds2026: { ...BASE, texts: {} },
}

/** Fusionne niveau A (défaut du module) + niveau B (cfg.theme de l'event),
    sans jamais muter PARCOURS_THEME_DEFAULTS. */
export function resolveParcoursTheme(module: Module, cfg: EventCfg | null | undefined): ParcoursTheme {
  const master = PARCOURS_THEME_DEFAULTS[module] ?? BASE
  const override = cfg?.theme ?? {}
  return {
    ...master,
    ...override,
    texts: { ...master.texts, ...(override.texts ?? {}) },
  }
}
