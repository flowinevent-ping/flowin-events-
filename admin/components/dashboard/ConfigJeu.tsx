'use client'

/**
 * CONFIG JEU — paramétrer le jeu PENDANT la création, plus seulement après.
 *
 * Romain, 02/09 : « sur le parcours créer un nouvel event il y a des fonctions
 * qui ne marchent pas, exemple les jeux et configuration : il faut paramétrer
 * les jeux, les questions et autre. Le process semble bien mais il n'est pas
 * complet. »
 *
 * CONSTAT : l'étape « Configuration » du parcours ne configurait PAS le jeu.
 * Elle ne proposait que description, couleur et score minimum, et disait
 * elle-même « la configuration fine du parcours passe par cfg et se règle après
 * création ». On créait donc un event, puis on rouvrait sa fiche pour choisir
 * les questions — deux temps là où il n'en faut qu'un.
 *
 * Ce composant est CONTRÔLÉ et n'écrit rien : il reçoit un `cfg` et renvoie le
 * `cfg` modifié. C'est l'appelant qui enregistre — le parcours à la création,
 * la fiche event à la modification. Le modèle de données est exactement celui
 * déjà en base et déjà lu par le parcours joueur : `spinSegments`,
 * `quizBanques`, `quizNbQuestions`, `quizTimer`, `voteItems`. Aucune clé
 * nouvelle n'est inventée, sinon le jeu ne saurait pas les lire.
 */

import type { Banque } from '@/lib/banques'

export type CfgJeu = Record<string, unknown>

export interface SegmentSpin { label: string; couleur?: string; poids?: number }
export interface ItemVote { id: string; nom: string; emoji?: string; desc?: string }

const COULEURS = ['#7C2D92', '#E0218A', '#F5A100', '#1D9E75', '#378ADD', '#9d4edd', '#ff8fab', '#cfc4d8']

export const EST_QUIZ = (m: string) => m === 'quiz' || m === 'quizsolo' || m === 'quizmaster'

export default function ConfigJeu({
  module: mod, cfg, onChange, banques = [],
}: {
  module: string
  cfg: CfgJeu
  onChange: (cfg: CfgJeu) => void
  banques?: Banque[]
}) {
  const set = (champs: CfgJeu) => onChange({ ...cfg, ...champs })

  const segments = (cfg.spinSegments as SegmentSpin[]) ?? []
  const banquesSel = (cfg.quizBanques as string[]) ?? []
  const nbQ = (cfg.quizNbQuestions as number) ?? 5
  const timer = cfg.quizTimer
  const timerOn = timer !== false
  const timerSec = typeof timer === 'number' ? timer : 30
  const items = (cfg.voteItems as ItemVote[]) ?? []

  if (!mod) {
    return (
      <div className="sa-muted" style={{ fontSize: 13 }}>
        Choisissez d’abord un module à l’étape précédente — le paramétrage dépend du jeu.
      </div>
    )
  }

  /* ── Roue ────────────────────────────────────────────────────────────── */
  if (mod === 'spin') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>
            {segments.length} segment{segments.length > 1 ? 's' : ''} sur la roue
          </div>
          <button
            className="sa-btn sm primary" style={{ marginLeft: 'auto' }}
            onClick={() => set({ spinSegments: [...segments, { label: '', couleur: COULEURS[segments.length % COULEURS.length] }] })}
          >
            + Ajouter un segment
          </button>
        </div>
        {segments.length === 0 && (
          <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
            Une roue sans segment ne peut pas tourner. Ajoutez-en au moins deux.
          </div>
        )}
        {segments.map((sg, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 56px auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              className="sa-input" placeholder="Ce qui est écrit sur le segment" value={sg.label ?? ''}
              onChange={e => set({ spinSegments: segments.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })}
            />
            <input
              className="sa-input" type="color" style={{ height: 36, padding: 3 }} value={sg.couleur ?? '#7C2D92'}
              onChange={e => set({ spinSegments: segments.map((x, j) => j === i ? { ...x, couleur: e.target.value } : x) })}
            />
            <button
              className="sa-btn sm"
              onClick={() => set({ spinSegments: segments.filter((_, j) => j !== i) })}
            >
              Retirer
            </button>
          </div>
        ))}
      </div>
    )
  }

  /* ── Quiz, Quiz Solo, Quiz Master ────────────────────────────────────── */
  if (EST_QUIZ(mod)) {
    return (
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Banques de questions</div>
        {banques.length === 0 && (
          <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
            Aucune banque en base. Le quiz peut être créé sans, mais il n’aura pas de
            questions tant qu’aucune banque ne lui est rattachée.
          </div>
        )}
        {banques.map(b => {
          const nbQcm = (b.questions ?? []).filter(q => q.type === 'qcm').length
          const coche = banquesSel.includes(b.id)
          return (
            <label key={b.id} className="sa-list-item" style={{ alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox" checked={coche} style={{ marginTop: 3 }}
                onChange={e => set({
                  quizBanques: e.target.checked
                    ? banquesSel.concat(b.id)
                    : banquesSel.filter(x => x !== b.id),
                })}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{b.nom}</div>
                <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>
                  {nbQcm} question{nbQcm !== 1 ? 's' : ''} qcm · {b.statut === 'valide' ? 'Validée' : 'Brouillon'}
                </div>
              </div>
            </label>
          )
        })}

        <div style={{ fontSize: 12.5, fontWeight: 700, margin: '16px 0 8px' }}>Paramètres</div>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span className="sa-lbl">Nombre de questions posées</span>
          <input
            className="sa-input" type="number" min={1} max={50} style={{ maxWidth: 120 }}
            value={nbQ}
            onChange={e => set({ quizNbQuestions: parseInt(e.target.value) || 1 })}
          />
          <span className="sa-aide">
            Tirées au hasard dans les banques cochées. Plus que le nombre disponible :
            le jeu pose ce qu’il a.
          </span>
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            type="checkbox" checked={timerOn}
            onChange={e => set({ quizTimer: e.target.checked ? timerSec : false })}
          />
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>Chronomètre par question</span>
        </label>
        {timerOn && (
          <label style={{ display: 'block' }}>
            <span className="sa-lbl">Secondes par question</span>
            <input
              className="sa-input" type="number" min={5} max={120} style={{ maxWidth: 120 }}
              value={timerSec}
              onChange={e => set({ quizTimer: parseInt(e.target.value) || 30 })}
            />
          </label>
        )}
      </div>
    )
  }

  /* ── Vote ────────────────────────────────────────────────────────────── */
  if (mod === 'vote') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>
            {items.length} élément{items.length > 1 ? 's' : ''} à départager
          </div>
          <button
            className="sa-btn sm primary" style={{ marginLeft: 'auto' }}
            onClick={() => set({ voteItems: items.concat({ id: 'v' + Date.now(), nom: '' }) })}
          >
            + Ajouter
          </button>
        </div>
        {items.length === 0 && (
          <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
            Sans élément, il n’y a rien à voter. Ajoutez-en au moins deux.
          </div>
        )}
        {items.map((it, i) => (
          <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '58px 1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              className="sa-input" placeholder="🎭" value={it.emoji ?? ''}
              onChange={e => set({ voteItems: items.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x) })}
            />
            <input
              className="sa-input" placeholder="Nom de l’élément" value={it.nom}
              onChange={e => set({ voteItems: items.map((x, j) => j === i ? { ...x, nom: e.target.value } : x) })}
            />
            <button className="sa-btn sm" onClick={() => set({ voteItems: items.filter((_, j) => j !== i) })}>
              Retirer
            </button>
          </div>
        ))}
      </div>
    )
  }

  /* ── Modules sans paramétrage propre ─────────────────────────────────── */
  return (
    <div className="sa-muted" style={{ fontSize: 12.5, lineHeight: 1.55 }}>
      Ce module n’a pas de paramétrage propre avant création : les lots se règlent
      à l’étape suivante, et le reste se pilote depuis la fiche une fois
      l’événement créé. On ne vous demande rien d’inutile ici.
    </div>
  )
}
