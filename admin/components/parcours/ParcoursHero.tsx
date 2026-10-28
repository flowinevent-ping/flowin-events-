'use client'

/**
 * HABILLAGE COMMUN "NDS 2026" — hero + stage + carte lots + carte "comment
 * jouer", repris par tous les parcours standalone (Vote/Quiz/QuizSolo/
 * Tombola/Spin). Ne reproduit QUE le niveau générique de nds2026Design.ts
 * (fond plein #6e2785, dégradé de scène, carte "prize" en verre dépoli) —
 * jamais les règles scopées `.ndsbody` (rethème clair + la vraie photo du
 * festival `bg-stage.webp`), qui restent exclusives à NDS2026Client.tsx.
 * Ce fichier ne lit ni n'importe nds2026Design.ts ni NDS2026Client.tsx :
 * les valeurs ci-dessous sont recopiées à la main depuis leur niveau
 * générique (jamais depuis les règles `.ndsbody`), pas héritées.
 *
 * Romain, 28/10 : la zone hero ne doit plus rester vide quand l'event n'a
 * pas de logo configuré (le vide "degueulasse" rejeté sur le Kanban plus tôt
 * dans la journée s'applique ici aussi) — à la place : le nom de
 * l'opération, bien visible, à côté d'un badge qui identifie le TYPE de jeu
 * (module), sur un dégradé propre à ce module. Un vrai logo configuré sur
 * l'event reste prioritaire et s'affiche comme avant (ParcoursLogo).
 *
 * Icônes par module : recopiées depuis `admin/lib/proicons.tsx`
 * (MODULE_PATHS), volontairement PAS importées — ce fichier est dans
 * l'espace parcours joueur, proicons.tsx est dans l'espace dashboard/pro ;
 * pas d'import cross-boundary entre les deux (consigne explicite). Garder
 * les mêmes tracés que proicons.tsx si ce fichier change.
 */

export interface HeroLogoProps { emoji?: string; logoSvg?: string; logoUrl?: string }

/** Un dégradé propre à chaque module, dans la famille violet/magenta/orange
 *  déjà utilisée par les écrans joueur (jamais le bleu CHARTE_PRO de
 *  l'espace pro/SA, réservé au dashboard). */
export const MODULE_HERO_ACCENT: Record<string, [string, string]> = {
  quiz: ['#E0218A', '#8E2E9E'],
  quizsolo: ['#7C2D92', '#5A1E6E'],
  vote: ['#F5A100', '#E0218A'],
  tombola: ['#8E2E9E', '#5A1E6E'],
  spin: ['#F7A8D4', '#E0218A'],
}

const MODULE_ICON_PATHS: Record<string, string> = {
  quiz: '<circle cx="12" cy="12" r="10"/><path d="M9.5 9.2c0-1.4 1.1-2.4 2.5-2.4s2.5 1 2.5 2.2c0 1.6-2.5 1.8-2.5 3.6"/><circle cx="12" cy="16.3" r="1" fill="currentColor" stroke="none"/>',
  quizsolo: '<circle cx="12" cy="7.5" r="3"/><path d="M5.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/>',
  vote: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  tombola: '<rect x="3" y="7" width="18" height="11" rx="2"/><path d="M9 7v11M15 7v11" stroke-dasharray="1.5 2.5"/><path d="M3 12h4M17 12h4"/>',
  spin: '<circle cx="12" cy="12" r="10"/><path d="M12 2v10l7 4"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
}

function ModuleIcon({ module, size = 24 }: { module: string; size?: number }) {
  const d = MODULE_ICON_PATHS[module] ?? MODULE_ICON_PATHS.quiz
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="#fff" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      style={{ display: 'block', flexShrink: 0 }}
      dangerouslySetInnerHTML={{ __html: d }}
    />
  )
}

/** Zone "hero" — bandeau plein, logo réel si configuré, sinon nom de
 *  l'opération + badge du module. `subtitle` (optionnel) : texte libre déjà
 *  configurable par event (sous-titre, dates…), affiché dans les deux cas.
 *  `badgeText` (optionnel) : petite puce libre au-dessus (ex. "GRATUIT",
 *  `front.badge` de Tombola), affichée dans les deux cas aussi. */
export function ParcoursHero({ module, nom, emoji, logoSvg, logoUrl, subtitle, badgeText }: HeroLogoProps & { module: string; nom: string; subtitle?: string; badgeText?: string }) {
  const hasLogo = !!(logoSvg || logoUrl || emoji)
  const [a, b] = MODULE_HERO_ACCENT[module] ?? MODULE_HERO_ACCENT.quiz
  return (
    <div className="pc-hero">
      {badgeText && <div className="pc-hero-badgetext">{badgeText}</div>}
      {hasLogo ? (
        <div className="pc-hero-logo">
          {logoSvg ? <div dangerouslySetInnerHTML={{ __html: logoSvg }} /> : logoUrl ? <img src={logoUrl} alt={nom} /> : <span>{emoji}</span>}
        </div>
      ) : (
        <div className="pc-hero-id">
          <span className="pc-hero-badge" style={{ background: `linear-gradient(135deg,${a},${b})` }}>
            <ModuleIcon module={module} />
          </span>
          <span className="pc-hero-nom">{nom}</span>
        </div>
      )}
      {subtitle && <div className="pc-hero-sub">{subtitle}</div>}
    </div>
  )
}

export interface HeroLot { id: string; titre?: string; nom?: string; description?: string }

/** Carte "prize" flottante en verre dépoli, à cheval sur la jonction
 *  hero/stage — jusqu'à 2 lots, comme NDS2026Client. */
export function ParcoursPrizeCard({ lots }: { lots: HeroLot[] }) {
  if (!lots.length) return null
  const rows = lots.slice(0, 2)
  return (
    <div className="pc-prize">
      <div className="pc-prize-lbl">À gagner</div>
      {rows.map((l, i) => (
        <div key={l.id}>
          {i > 0 && <div className="pc-prize-div" />}
          <div className="pc-prize-row">
            <span className="pc-prize-ico" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4Z" />
                <path d="M12 7v10" strokeDasharray="2 2" />
              </svg>
            </span>
            <div>
              <div className="pc-prize-nm">{l.titre || l.nom}</div>
              {l.description && <div className="pc-prize-vl">{l.description}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export interface HowToStep { titre: string; sous: string }

/** Carte claire "Comment jouer ?" — étapes propres à chaque module. */
export function ParcoursHowTo({ steps }: { steps: HowToStep[] }) {
  if (!steps.length) return null
  return (
    <div className="pc-howto">
      <div className="pc-howto-title">Comment jouer&#8239;?</div>
      <div className="pc-howto-card">
        {steps.map((s, i) => (
          <div key={i} className="pc-howto-row">
            <span className="pc-howto-ico">{i + 1}</span>
            <span className="pc-howto-txt"><b>{s.titre}</b><br /><span className="pc-howto-sub">{s.sous}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface RegleJeu { titre: string; texte: string }

/** Carte claire "Les règles du jeu" — en plus de "Comment jouer ?" (qui dit
 *  le geste), celle-ci dit la mécanique de gain : propre à chaque module,
 *  jamais le texte du quiz recopié sur les 4 autres (Romain, 28/10). */
export function ParcoursRegles({ regles }: { regles: RegleJeu[] }) {
  if (!regles.length) return null
  return (
    <div className="pc-regles">
      <div className="pc-regles-title">Les règles du jeu</div>
      <div className="pc-regles-card">
        {regles.map((r, i) => (
          <div key={i} className="pc-regles-row">
            <span className="pc-regles-dot" aria-hidden="true" />
            <div>
              <div className="pc-regles-h">{r.titre}</div>
              <div className="pc-regles-t">{r.texte}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** CSS partagé des 5 pièces ci-dessus, à concaténer après `parcoursCSS(c)`
 *  dans le `<style>` de chaque module. Valeurs recopiées à la main depuis le
 *  niveau générique (non `.ndsbody`) de nds2026Design.ts. */
export const PARCOURS_HERO_CSS = `
  .pc-hero{background:#6e2785;padding:26px 22px 22px;flex-shrink:0}
  .pc-hero-badgetext{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:100px;padding:5px 14px;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px}
  .pc-hero-logo img{display:block;height:64px;width:auto;max-width:72%;filter:drop-shadow(0 3px 12px rgba(0,0,0,.3))}
  .pc-hero-logo span{font-size:46px;line-height:1}
  .pc-hero-id{display:flex;align-items:center;gap:13px}
  .pc-hero-badge{width:52px;height:52px;border-radius:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(0,0,0,.28)}
  .pc-hero-nom{font-size:21px;font-weight:900;color:#fff;line-height:1.15}
  .pc-hero-sub{font-size:13px;color:rgba(255,255,255,.55);margin-top:8px}

  .pc-stage{flex:1;position:relative;background:linear-gradient(180deg,#6e2785 0%,#3a1450 45%,#160820 100%);padding:0 0 22px;display:flex;flex-direction:column}

  .pc-prize{margin:-30px 18px 0;position:relative;z-index:1;border-radius:20px;background:rgba(20,8,22,.55);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);padding:16px 15px;box-shadow:0 16px 40px rgba(0,0,0,.3)}
  .pc-prize-lbl{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:11px}
  .pc-prize-row{display:flex;align-items:center;gap:13px}
  .pc-prize-ico{width:40px;height:40px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#E0218A,#8E2E9E)}
  .pc-prize-nm{font-size:13.5px;font-weight:800}
  .pc-prize-vl{font-size:12px;color:rgba(255,255,255,.55)}
  .pc-prize-div{height:1px;background:rgba(255,255,255,.1);margin:10px 2px}

  .pc-howto{margin:18px 18px 0}
  .pc-howto-title{text-align:center;font-size:17px;font-weight:800;color:#1a1226;margin-bottom:10px}
  .pc-howto-card{background:#faf7fd;border:1px solid #ece7f2;border-radius:16px;padding:12px 15px;box-shadow:0 8px 22px rgba(30,16,46,.10)}
  .pc-howto-row{display:flex;align-items:center;gap:11px;padding:7px 0;border-bottom:1px solid rgba(26,18,38,.06)}
  .pc-howto-row:last-child{border-bottom:none}
  .pc-howto-ico{width:32px;height:32px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#7C2D92,#E0218A);color:#fff;font-size:13px;font-weight:800}
  .pc-howto-txt{font-size:13.5px;color:#52455e;line-height:1.3}
  .pc-howto-txt b{color:#1a1226}
  .pc-howto-sub{font-size:12.5px;opacity:.85}

  .pc-regles{margin:14px 18px 0}
  .pc-regles-title{text-align:center;font-size:17px;font-weight:800;color:#1a1226;margin-bottom:10px}
  .pc-regles-card{background:#faf7fd;border:1px solid #ece7f2;border-radius:16px;padding:13px 16px;box-shadow:0 8px 22px rgba(30,16,46,.10)}
  .pc-regles-row{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid rgba(26,18,38,.06)}
  .pc-regles-row:last-child{border-bottom:none}
  .pc-regles-dot{width:7px;height:7px;border-radius:50%;background:#E0218A;flex-shrink:0;margin-top:6px}
  .pc-regles-h{font-size:13.5px;font-weight:800;color:#1a1226}
  .pc-regles-t{font-size:12.5px;color:#52455e;line-height:1.4;margin-top:2px}
`
