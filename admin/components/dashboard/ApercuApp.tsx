'use client'

/**
 * APERCU APP — le VRAI parcours joueur, rendu a partir du brouillon.
 *
 * Romain, 03/09 : « l apercu ne correspond a rien d existant, contenu, charte
 * graphique : tu as invente au lieu de prendre l existant. »
 *
 * Il avait raison. La premiere version dessinait un telephone violet avec des
 * ecrans « Accueil / Lots / Fin » et des phrases (« Merci d avoir joue »,
 * « Voir mon billet ») qui n existent NULLE PART dans le produit. Rien de tout
 * cela n etait repris du parcours joueur.
 *
 * Ce fichier ne dessine plus rien de son cru. Il importe `parcoursCSS()` — la
 * feuille de style unique de tous les parcours, dans `lib/parcours.ts` — et
 * reproduit les ecrans tels qu ils sont ecrits dans les six clients de
 * `app/parcours/*` :
 *
 *   accueil    landing   — icone / nom / sous-titre / lots / badge tirage /
 *                          CTA / « Jeu gratuit · Sans achat obligatoire » /
 *                          bouton partenaires
 *   formulaire form      — Prenom, Nom, Email, Telephone, Tranche d age, CP,
 *                          bandeau RGPD, « ✓ Valider → »
 *   ticket     ticket    — la carte ticket du module (trois variantes reelles :
 *                          generique quiz, tombola, et la carte teal de spin)
 *
 * Chaque libelle ci-dessous est copie du client correspondant, avec la meme
 * valeur par defaut. Les seuls ecarts, tous assumes et signales a l ecran :
 *
 *  - Le code ticket affiche est un exemple (« XX-000000 ») : le vrai est genere
 *    a l inscription du joueur.
 *  - La date saisie occupe le creneau `cfg.datesLabel` du parcours, qui est un
 *    texte libre : on y met la date du brouillon, faute de mieux.
 *  - Les questions, la roue et le vote ne tournent pas ici : ce sont des ecrans
 *    de jeu, pas de presentation. Une fois l event cree, sa fiche affiche le
 *    vrai parcours en iframe (ParcoursMobil).
 *
 * La CSS des parcours est SCOPEE sous `.sa-vp` avant injection : telle quelle,
 * elle repeint le body du dashboard en #0F172A.
 */

import { useMemo } from 'react'
import { parcoursCSS } from '@/lib/parcours'

export type EcranApercu = 'accueil' | 'formulaire' | 'ticket'

export interface BrouillonApercu {
  nom?: string
  module?: string
  couleur?: string
  dateD?: string | null
  /** Les lots saisis — le parcours en affiche les 3 (quiz) ou 5 (tombola) premiers. */
  lots?: { nom?: string; quantite?: number; valeur?: number }[]
  /** Nom de l operation, pour le libelle du tirage. */
  superEvent?: string | null
  /** Nombre de pros rattaches — le parcours affiche « Nos N partenaires ». */
  nbPartenaires?: number
}

/* Largeur reelle du parcours (`.app { max-width: 430px }`) et largeur de
   l ecran dans la maquette de telephone : le rendu est mis a l echelle, pas
   redessine — un bouton fait donc ici exactement ce qu il fait sur le vrai
   telephone, en plus petit. */
const LARGEUR_REELLE = 430
const LARGEUR_ECRAN = 254
const HAUTEUR_ECRAN = 508
const ECHELLE = LARGEUR_ECRAN / LARGEUR_REELLE
const HAUTEUR_REELLE = Math.round(HAUTEUR_ECRAN / ECHELLE)

/** Prefixe chaque selecteur par la racine ; jette `html` et `body`, qui
 *  repeindraient le dashboard. La CSS des parcours est plate (aucun @media,
 *  aucune imbrication), ce que cette regex suppose. */
function scoper(css: string, racine: string): string {
  return css.replace(/([^{}]+)\{([^{}]*)\}/g, (_m, sel: string, corps: string) => {
    const parts = (sel as string)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .filter(s => s !== 'html' && s !== 'body')
      .map(s => (s === '*' ? `${racine} *` : `${racine} ${s}`))
    return parts.length ? `${parts.join(',')}{${corps}}` : ''
  })
}

/* Ecran d accueil de chaque module, releve dans son client. */
type Accueil = { icone: React.ReactNode; sous: string; cta: React.ReactNode; lots: number; mention: boolean }

function accueilDe(mod: string, c: string, nbPart: number): Accueil {
  const part = nbPart > 0
  switch (mod) {
    /* app/parcours/spin/SpinClient.tsx */
    case 'spin':
      return {
        icone: <i className="ti ti-rotate-clockwise" style={{ fontSize: 48, color: c }} aria-hidden="true" />,
        sous: 'Tentez votre chance !',
        cta: <><i className="ti ti-rotate-clockwise" style={{ marginRight: 6 }} aria-hidden="true" />Faire tourner la roue →</>,
        lots: 0, mention: true,
      }
    /* app/parcours/quiz/QuizClient.tsx */
    case 'quiz':
      return { icone: <span style={{ fontSize: 48 }}>🎮</span>, sous: '', cta: '🎮 Jouer gratuitement →', lots: 3, mention: true }
    /* app/parcours/quizsolo/QuizsoloClient.tsx */
    case 'quizsolo':
      return { icone: <span style={{ fontSize: 48 }}>⏱️</span>, sous: 'Quiz chronométré · 30s par question', cta: '⏱️ Démarrer le quiz →', lots: 0, mention: false }
    /* app/parcours/quizmaster/QuizmasterClient.tsx */
    case 'quizmaster':
      return { icone: <span style={{ fontSize: 48 }}>🎮</span>, sous: 'Quiz en direct · Réponds sur ton téléphone', cta: '🎮 Rejoindre le quiz →', lots: 0, mention: false }
    /* app/parcours/vote/VoteClient.tsx */
    case 'vote':
      return { icone: <span style={{ fontSize: 48 }}>⭐</span>, sous: 'Votez pour vos favoris !', cta: '⭐ Voter maintenant →', lots: 0, mention: false }
    /* app/parcours/tombola/TombolaClient.tsx */
    case 'tombola':
      return { icone: <CroixTombola c={c} />, sous: '', cta: 'Je m’inscris à la tombola →', lots: 5, mention: true }
    default:
      return { icone: <span style={{ fontSize: 48 }}>🎮</span>, sous: '', cta: 'Jouer →', lots: 3, mention: part }
  }
}

/* Le logo de la tombola, copie de TombolaClient. */
function CroixTombola({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 100 100" width={84} height={84} style={{ display: 'block', margin: '0 auto', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.4))' }}>
      <circle cx="50" cy="50" r="50" fill="#fff" />
      <rect x="38" y="16" width="24" height="68" rx="5" fill={c} />
      <rect x="16" y="38" width="68" height="24" rx="5" fill={c} />
    </svg>
  )
}

const PREFIXE: Record<string, string> = { spin: 'SP', quiz: 'QZ', quizsolo: 'QS', quizmaster: 'QM', vote: 'VT', tombola: 'TB' }

export default function ApercuApp({
  d, ecran = 'accueil', onEcran,
}: {
  d: BrouillonApercu
  ecran?: EcranApercu
  onEcran?: (e: EcranApercu) => void
}) {
  const c = d.couleur || '#7C2D92'
  const mod = d.module ?? ''
  const nom = d.nom?.trim() || 'Nom de l’événement'
  const nbPart = d.nbPartenaires ?? 0
  const a = accueilDe(mod, c, nbPart)
  const lots = (d.lots ?? []).filter(l => (l.nom ?? '').trim())
  const dates = d.dateD ? new Date(d.dateD).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const tirage = d.superEvent && d.dateD ? `🗓️ Tirage — ${d.superEvent}` : ''
  const codeExemple = `${PREFIXE[mod] ?? 'FL'}-000000`

  /* `.btn-cta` n est pas dans parcoursCSS : il est declare dans TombolaClient.
     On le reprend a l identique plutot que de le remplacer par `.btn`. */
  const css = useMemo(() => scoper(parcoursCSS(c), '.sa-vp') + `
    .sa-vp .app{min-height:${HAUTEUR_REELLE}px}
    .sa-vp .btn-cta{width:100%;padding:16px;border:none;border-radius:50px;background:${c};color:#fff;font-size:15px;font-weight:800;font-family:inherit}
    .sa-vp .lot-row{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06)}
    .sa-vp .lot-row:last-child{border-bottom:none}
  `, [c])

  return (
    <div className="sa-apercu">
      <div className="sa-apercu-tete">
        <span className="t">Aperçu du parcours joueur</span>
        <span className="d">Les écrans réels, remplis par votre saisie</span>
      </div>

      <div className="sa-tel">
        <div className="sa-tel-ecran">
          <div className="sa-tel-encoche" />
          <style dangerouslySetInnerHTML={{ __html: css }} />
          <div
            className="sa-vp"
            style={{ width: LARGEUR_REELLE, height: HAUTEUR_REELLE, transform: `scale(${ECHELLE})`, transformOrigin: 'top left', background: '#0F172A' }}
          >
            <div className="app">

              {/* ── ACCUEIL — l ecran `landing` du module ─────────────────── */}
              {ecran === 'accueil' && (
                <div className="screen" style={{ paddingTop: 32, textAlign: mod === 'quiz' || mod === 'tombola' ? undefined : 'center' }}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ marginBottom: 14 }}>{a.icone}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>{nom}</div>
                    {a.sous && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 8 }}>{a.sous}</div>}
                    {dates && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>{dates}</div>}
                  </div>

                  {a.lots > 0 && lots.length > 0 && (
                    <div className="card" style={{ marginBottom: 14, padding: 0 }}>
                      {lots.slice(0, a.lots).map((l, i) => (
                        <div key={i} className="lot-row">
                          <span style={{ fontSize: 18 }}>{['🥇', '🥈', '🥉', '🎁', '🎁'][i] || '🎁'}</span>
                          <span style={{ fontSize: 13, fontWeight: 800 }}>{l.nom}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {tirage && (
                    <div style={{ background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.25)', borderRadius: 10, padding: '10px 14px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginBottom: 14 }}>
                      {tirage}
                    </div>
                  )}

                  <button className={mod === 'tombola' ? 'btn-cta' : 'btn'} type="button">{a.cta}</button>

                  {a.mention && (
                    <div style={{ fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,.3)', margin: '6px 0 8px' }}>
                      Jeu gratuit · Sans achat obligatoire
                    </div>
                  )}

                  {nbPart > 0 && (
                    <button className="btn-ghost" type="button">🤝 Nos {nbPart} partenaires</button>
                  )}
                </div>
              )}

              {/* ── FORMULAIRE — l ecran `form`, identique dans les 6 modules ─ */}
              {ecran === 'formulaire' && (
                <div className="screen">
                  <div className="header">
                    <div>
                      <div className="title">Crée ton compte</div>
                      <div className="sub">{nom}</div>
                    </div>
                  </div>
                  <div className="grid2" style={{ marginBottom: 12 }}>
                    <div><label className="label">Prénom *</label><input className="input" readOnly defaultValue="" /></div>
                    <div><label className="label">Nom *</label><input className="input" readOnly defaultValue="" /></div>
                  </div>
                  <div style={{ marginBottom: 12 }}><label className="label">Email *</label><input className="input" readOnly defaultValue="" /></div>
                  <div style={{ marginBottom: 12 }}><label className="label">Téléphone *</label><input className="input" readOnly defaultValue="" /></div>
                  <div className="grid2" style={{ marginBottom: 12 }}>
                    <div><label className="label">Tranche d’âge</label><input className="input" readOnly defaultValue="Tranche d’âge" /></div>
                    <div><label className="label">CP</label><input className="input" readOnly defaultValue="" /></div>
                  </div>
                  <div className="rgpd">
                    <div className="rgpd-check">✓</div>
                    <div>J’accepte d’être recontacté(e). Données jamais cédées.</div>
                  </div>
                  <button className="btn" type="button" style={{ marginTop: 16 }}>✓ Valider →</button>
                </div>
              )}

              {/* ── TICKET — trois variantes reelles selon le module ───────── */}
              {ecran === 'ticket' && mod === 'spin' && (
                <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 40%, #0a1f2e 0%, #060d18 70%)' }}>
                  <div style={{ width: '88%', maxWidth: 360, borderRadius: 18, overflow: 'hidden', border: '2px solid #14B8A6', boxShadow: '0 0 40px rgba(20,184,166,.5),0 12px 48px rgba(0,0,0,.6)', background: '#071620' }}>
                    <div style={{ background: 'linear-gradient(180deg,#16C8B0,#0E9E8C)', padding: '12px 0', fontSize: 14, fontWeight: 900, letterSpacing: 3, color: '#fff' }}>✦ FÉLICITATIONS ✦</div>
                    <div style={{ padding: '22px 20px 26px' }}>
                      <div style={{ fontSize: 46, marginBottom: 10 }}>🥳</div>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, color: '#2DD4BF', marginBottom: 4 }}>VOUS AVEZ GAGNÉ</div>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 18, textTransform: 'uppercase' }}>Vous</div>
                      <div style={{ border: '1px solid rgba(45,212,191,.4)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, background: 'rgba(20,184,166,.06)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#2DD4BF', marginBottom: 4 }}>Votre lot</div>
                        <div style={{ fontSize: 19, fontWeight: 900, color: '#fff' }}>{lots[0]?.nom || 'Lot offert'}</div>
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)' }}>Ticket <span style={{ fontWeight: 800, color: '#fff', letterSpacing: 1 }}>{codeExemple}</span></div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 14, letterSpacing: 1 }}>Powered by Flowin</div>
                    </div>
                  </div>
                </div>
              )}

              {ecran === 'ticket' && mod === 'tombola' && (
                <div className="screen" style={{ justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 100, padding: '4px 14px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                      INSCRIPTION CONFIRMÉE
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Tu es dans la course ! 🎉</div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)' }}>Ton numéro de tombola a été enregistré</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 16, padding: 20, textAlign: 'center', borderTop: `4px solid ${c}` }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Ton ticket tombola</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.4)' }}>{nom}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: c, letterSpacing: '.1em', margin: '12px 0', fontFamily: 'monospace' }}>{codeExemple}</div>
                    {tirage && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{tirage}</div>}
                  </div>
                </div>
              )}

              {ecran === 'ticket' && mod !== 'spin' && mod !== 'tombola' && (
                <div className="screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Bravo !</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,.55)', marginBottom: 20 }}>{nom}</div>
                  <div className="card" style={{ borderTop: `4px solid ${c}`, marginBottom: 16 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
                    <div className="ticket-code">{codeExemple}</div>
                    {tirage && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{tirage}</div>}
                  </div>
                  {nbPart > 0 && <button className="btn-ghost" type="button">🤝 Nos partenaires</button>}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {onEcran && (
        <div className="sa-apercu-pas">
          {([['accueil', 'Accueil'], ['formulaire', 'Formulaire'], ['ticket', 'Ticket']] as const).map(([id, lbl]) => (
            <button key={id} className={`sa-btn sm${ecran === id ? ' primary' : ''}`} onClick={() => onEcran(id)}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      <p className="sa-apercu-note">
        Ce sont les <b>écrans réels</b> du parcours <code>{mod || '—'}</code>, avec leur
        feuille de style d’origine. Le code ticket est un exemple — le vrai est
        généré à l’inscription. Les écrans de jeu (roue, questions, vote) ne
        tournent pas ici : une fois l’événement créé, sa fiche affiche le vrai
        parcours en direct.
      </p>
    </div>
  )
}
