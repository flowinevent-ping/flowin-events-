'use client'

/**
 * Rapport detaille — par point de jeu, puis depouillement des questions bonus.
 *
 * Un POINT DE JEU est un `ev-<id>` : une station du super event, ou un partenaire.
 * Le SUPPORT (affiche, forex, video, sticker) n entre pas dans le modele : c est le
 * meme QR partout. Seule compte l identite portee par `ev=`. La colonne "lien unique"
 * ne decrit pas un support, elle isole les arrivees soumises a la regle one-shot.
 *
 * Generique : le super event est selectionne, jamais code en dur.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { BandeauChiffres } from '@/components/dashboard/BandeauChiffres'
import {
  fetchRapportPoints, fetchBonusResultats, fetchSuperEvents,
  type RapportPoints, type BonusResultats, type PointJeu, type SuperEvent,
} from '@/lib/nds'

const pct = (n: number, d: number) => (d > 0 ? `${Math.round((100 * n) / d)} %` : '—')

export default function Page() {
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [se, setSe] = useState('')
  const [r, setR] = useState<RapportPoints | null>(null)
  const [b, setB] = useState<BonusResultats | null>(null)
  const [charge, setCharge] = useState(true)
  const [filtre, setFiltre] = useState<'tous' | 'Station' | 'Partenaire'>('tous')

  useEffect(() => {
    fetchSuperEvents().then(l => {
      setSupers(l)
      if (l.length) setSe(l[0].id)
      else setCharge(false)
    })
  }, [])

  useEffect(() => {
    if (!se) return
    setCharge(true)
    Promise.all([fetchRapportPoints(se), fetchBonusResultats(se)])
      .then(([rp, bo]) => { setR(rp); setB(bo) })
      .finally(() => setCharge(false))
  }, [se])

  const points = useMemo(
    () => (r?.points ?? []).filter(p => filtre === 'tous' || p.type === filtre),
    [r, filtre]
  )

  const cell = { padding: '7px 9px', textAlign: 'right' as const, whiteSpace: 'nowrap' as const }
  const th = { ...cell, fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '.03em' }

  return (
    <div className="sa-page">
      <PageHeader
        title="Rapport détaillé"
        subtitle="Par point de jeu — station du super event ou partenaire"
        actions={
          supers.length > 1 ? (
            <select className="sa-input" value={se} onChange={e => setSe(e.target.value)}>
              {supers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          ) : null
        }
      />

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement du rapport…</div>}

      {!charge && !r && <EmptyState title="Aucune donnée" desc="Ce super event n'a pas encore d'activité." />}

      {!charge && r && (
        <>
          <SectionHeader>🔢 Chiffres de référence</SectionHeader>
          <BandeauChiffres se={se} />

          <SectionHeader>📍 Détail par point de jeu</SectionHeader>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['tous', 'Station', 'Partenaire'] as const).map(f => (
              <button key={f} className={`sa-btn sm${filtre === f ? ' primary' : ''}`} onClick={() => setFiltre(f)}>
                {f === 'tous' ? 'Tout' : f === 'Station' ? 'Stations' : 'Partenaires'}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 8, lineHeight: 1.5 }}>
            <b>Flash</b> — une ouverture du QR, pas une personne : un joueur qui rescanne compte plusieurs fois.<br />
            <b>Lien unique</b> — arrivées par le lien digital, soumises à la règle one-shot (un seul jeu par lien).<br />
            <b>Joueurs</b> — un joueur actif sur plusieurs points est compté sur chacun : la somme dépasse le nombre
            de joueurs distincts du super event.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>Point de jeu</th>
                  <th style={{ ...th, textAlign: 'left' }}>Type</th>
                  <th style={th}>Flashs</th>
                  <th style={th}>dont lien unique</th>
                  <th style={th}>Parties</th>
                  <th style={th}>Joueurs</th>
                  <th style={th}>dont lien unique</th>
                  <th style={th}>Ont rejoué</th>
                  <th style={th}>Coordonnées</th>
                  <th style={th}>Opt-in</th>
                  <th style={th}>Rép. bonus</th>
                  <th style={th}>Score moy.</th>
                  <th style={th}>Pic</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p: PointJeu) => (
                  <tr key={p.event_id}>
                    <td style={{ ...cell, textAlign: 'left', fontWeight: 600 }}>{p.nom}</td>
                    <td style={{ ...cell, textAlign: 'left' }}>
                      <span className="sa-chip" style={{ fontSize: 10 }}>{p.type}</span>
                    </td>
                    <td style={cell}>{p.flashs}</td>
                    <td style={{ ...cell, color: p.flashs_lien_unique ? undefined : 'var(--sa-muted)' }}>
                      {p.flashs_lien_unique || '—'}
                    </td>
                    <td style={cell}>{p.parties}</td>
                    <td style={cell}>{p.joueurs}</td>
                    <td style={{ ...cell, color: p.joueurs_lien_unique ? undefined : 'var(--sa-muted)' }}>
                      {p.joueurs_lien_unique || '—'}
                    </td>
                    <td style={cell}>{p.ont_rejoue || '—'}</td>
                    <td style={cell}>{p.avec_coordonnees}</td>
                    <td style={cell}>
                      {p.optin} <span className="sa-muted" style={{ fontSize: 10 }}>{pct(p.optin, p.joueurs)}</span>
                    </td>
                    <td style={cell}>{p.repondants_bonus || '—'}</td>
                    <td style={cell}>{p.score_moyen ?? '—'}</td>
                    <td style={cell}>{p.heure_pic != null ? `${String(p.heure_pic).padStart(2, '0')}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: '2px solid var(--sa-border)' }}>
                  <td style={{ ...cell, textAlign: 'left' }}>Total — {points.length} points</td>
                  <td style={cell} />
                  <td style={cell}>{points.reduce((a, p) => a + p.flashs, 0)}</td>
                  <td style={cell}>{points.reduce((a, p) => a + p.flashs_lien_unique, 0)}</td>
                  <td style={cell}>{points.reduce((a, p) => a + p.parties, 0)}</td>
                  <td style={cell} colSpan={9} />
                </tr>
              </tfoot>
            </table>
          </div>

          <SectionHeader>📝 Questions bonus</SectionHeader>

          {!b || !b.familles.length ? (
            <EmptyState icon="📝" title="Aucune réponse bonus" desc="Les questions bonus n'ont pas encore été renseignées." />
          ) : (
            <>
              <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                <b>{b.repondants_total} répondants</b> au total. {b.lecture}
              </div>

              {b.familles.map(fam => (
                <div key={fam.famille} style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {fam.famille}
                  </div>
                  <div className="sa-muted" style={{ fontSize: 11, marginBottom: 10 }}>
                    {fam.repondants} répondants sur ce questionnaire
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 10 }}>
                    {fam.questions.map(q => (
                      <div key={q.cle} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, lineHeight: 1.35 }}>
                          {q.libelle}
                        </div>
                        <div className="sa-muted" style={{ fontSize: 10.5, marginBottom: 9 }}>
                          {q.repondants} réponses{q.choix_multiple ? ' · choix multiple' : ''}
                          {!q.libelle_trouve && (
                            <span style={{ color: '#c46a6a' }}> · libellé absent de la configuration</span>
                          )}
                        </div>
                        {q.reponses.map(rep => (
                          <div key={rep.reponse} style={{ marginBottom: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 2, gap: 8 }}>
                              <span style={rep.libelle_trouve ? undefined : { fontStyle: 'italic', color: 'var(--sa-muted)' }}>
                                {rep.reponse}
                              </span>
                              <span style={{ fontWeight: 700 }}>{rep.n} <span className="sa-muted">({rep.pct} %)</span></span>
                            </div>
                            <div style={{ height: 5, borderRadius: 3, background: 'var(--sa-border)', overflow: 'hidden' }}>
                              <div style={{ width: `${rep.pct ?? 0}%`, height: '100%', background: 'var(--sa-accent, #f4b544)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
