import type { SondageLanding } from '@/lib/nds'
import { CARD, TH, TD, MUTED, ACC } from '@/lib/proui'
import DepouillementAccordion, { ResumeVisuelDepouillement } from './DepouillementAccordion'

/**
 * Questionnaire de la landing — canal de collecte HORS parcours de jeu.
 *
 * Ajout d audit (28/07/2026) : ce canal existait cote Super Admin
 * (`/dashboard/rapport-points`, RPC `super_event_sondage_landing`) mais n etait visible
 * nulle part dans l espace Pro. Les saisies terrain (type Brigade Verte) etaient donc
 * invisibles pour le pro qui les a produites.
 *
 * DEUX CANAUX, UNE SEULE BANQUE DE QUESTIONS — ne jamais additionner les repondants
 * des deux sans le dire : une meme personne peut avoir repondu par les deux chemins.
 *   1. bonus en jeu -> se_reponses     (affiche dans /pro/super/[event])
 *   2. landing      -> sondage_brigade (affiche ici)
 *
 * Cloisonnement : `par_point` est filtre aux seuls points du pro. Le depouillement des
 * questions, lui, est renvoye par le RPC a l echelle du super event : il n est affiche
 * que si TOUS les points de collecte appartiennent au pro. Sinon on affiche uniquement
 * le volume de ses propres points, avec la mention explicite.
 *
 * Generique : aucun nom de point ni de question code en dur.
 */
export default function SondageLandingPro({ s, nomsDuPro }: { s: SondageLanding; nomsDuPro: Set<string> }) {
  const points = (s.par_point ?? []).filter(p => nomsDuPro.has(p.point))
  if (points.length === 0) return null

  const saisiesPro = points.reduce((n, p) => n + p.saisies, 0)
  const total = s.saisies_total ?? saisiesPro
  const toutAuPro = points.length === (s.par_point ?? []).length
  const maxP = Math.max(1, ...points.map(p => p.saisies))
  const per = s.periode ?? { du: null, au: null }
  const jour = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—')

  return (
    <div style={{ ...CARD }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B' }}>
        Questionnaire terrain — landing
      </div>
      <div style={{ fontSize: 13.5, color: '#64748B', marginTop: 2, marginBottom: 14, lineHeight: 1.5 }}>
        Saisies faites hors parcours de jeu, sur vos points de collecte, du {jour(per.du)} au {jour(per.au)}.
        {' '}Canal <b>distinct</b> du bonus en jeu : ne pas additionner les deux, une même personne peut avoir répondu par les deux chemins.
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ minWidth: 110 }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', color: ACC }}>{saisiesPro}</div>
          <div style={{ fontSize: 12, ...MUTED }}>saisies sur vos points</div>
        </div>
        <div style={{ minWidth: 110 }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px' }}>{points.length}</div>
          <div style={{ fontSize: 12, ...MUTED }}>points de collecte</div>
        </div>
        <div style={{ minWidth: 110 }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px' }}>{s.questions?.length ?? 0}</div>
          <div style={{ fontSize: 12, ...MUTED }}>questions posées</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
        <thead><tr><th style={TH}>Point de collecte</th><th style={TH}>Saisies</th><th style={TH}>Poids</th></tr></thead>
        <tbody>
          {points.slice().sort((a, b) => b.saisies - a.saisies).map(p => (
            <tr key={p.point}>
              <td style={TD}><b>{p.point}</b></td>
              <td style={{ ...TD, fontWeight: 800 }}>{p.saisies}</td>
              <td style={TD}>
                <span style={{ display: 'inline-block', width: 130, height: 8, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden', verticalAlign: 'middle' }}>
                  <span style={{ display: 'block', height: '100%', width: `${Math.max(4, Math.round(p.saisies / maxP * 100))}%`, background: `linear-gradient(90deg,#A855F7,${ACC})`, borderRadius: 99 }} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!toutAuPro ? (
        <div style={{ fontSize: 12.5, ...MUTED, marginTop: 12, lineHeight: 1.6, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '11px 13px' }}>
          Le dépouillement des réponses est calculé à l&apos;échelle du super event ({total} saisies au total, tous points confondus).
          Comme d&apos;autres points que les vôtres ont contribué, il reste réservé à l&apos;organisateur — vous voyez ici le volume de vos propres points.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', margin: '20px 0 10px' }}>
            Dépouillement — {total} saisie{total > 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 12, ...MUTED, marginBottom: 12 }}>Vue d&apos;ensemble — réponse dominante par question.</div>
          <ResumeVisuelDepouillement questions={s.questions} />
          <div style={{ fontSize: 12, ...MUTED, margin: '18px 0 10px' }}>Cliquez une question pour voir le détail des réponses.</div>
          <DepouillementAccordion questions={s.questions} />
        </>
      )}
    </div>
  )
}
