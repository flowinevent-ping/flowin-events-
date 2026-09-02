'use client'

/**
 * Rapport de fin d operation — vue unique et complete.
 * Activite par date et par station (stations du festival ET commerces),
 * redirections partenaires avec pics horaires, demographie en camemberts,
 * et classement des meilleurs joueurs croise avec leurs gains.
 */
import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { Camembert } from '@/components/dashboard/Camembert'
import { CarteChaleur } from '@/components/dashboard/CarteChaleur'
import { TableauStations } from '@/components/dashboard/TableauStations'
import { BandeauChiffres } from '@/components/dashboard/BandeauChiffres'
import {
  fetchRapport, fetchPics, fetchSuperEvents,
  type Rapport, type Pics, type SuperEvent,
} from '@/lib/nds'

import { usePorteeInitiale } from '@/lib/portee'
const fr = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[2]}/${p[1]}` : d }

export default function Page() {
  const { openDrawer } = useDashboard()
  /* Aucun super event code en dur : on charge la liste et on selectionne le plus recent.
     Les memes indicateurs valent pour toute edition presente ou future. */
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [se, setSe] = useState<string>('')
  /* Portee recue de la fiche qui nous a ouverts : on arrive DEJA cadre sur son
     super event. Sans ca, ouvrir ce module depuis « Jazz a Nice 2027 » affichait
     Nuits du Sud. Les boutons de l ecran restent maitres ensuite. */
  const porteeUrl = usePorteeInitiale()
  useEffect(() => { if (porteeUrl.se) setSe(porteeUrl.se) }, [porteeUrl.se])

  const [r, setR] = useState<Rapport | null>(null)
  const [pics, setPics] = useState<Pics | null>(null)
  const [charge, setCharge] = useState(true)
  const [jour, setJour] = useState<string | 'tous'>('tous')
  /* La vue affichee. Les 12 blocs empiles deviennent 7 vues selectionnables. */
  const [section, setSection] = useState('reference')

  useEffect(() => {
    fetchSuperEvents().then(l => {
      // Le Master est un gabarit de duplication, jamais joue reellement -- le
      // montrer ici comme un onglet au meme titre que le vrai festival induit
      // en erreur (le selectionner afficherait un rapport a zero partout).
      const reels = l.filter(x => x.id !== 'se-master-superevent')
      setSupers(reels)
      if (reels.length) setSe(reels[0].id)
      else setCharge(false)
    })
  }, [])

  useEffect(() => {
    if (!se) return
    setCharge(true); setJour('tous')
    Promise.all([fetchRapport(se), fetchPics(se)])
      .then(([a, b]) => { setR(a); setPics(b) })
      .finally(() => setCharge(false))
  }, [se])

  const jours = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const l of r?.par_jour_station ?? []) m.set(l.jour, l.hors_festival)
    return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [r])

  const lignes = useMemo(() => {
    const l = r?.par_jour_station ?? []
    return jour === 'tous' ? l : l.filter(x => x.jour === jour)
  }, [r, jour])

  /* KPI d'en-tete : totaux globaux si "Toutes les dates", sinon vraiment
     recalcules sur la selection -- avant ce correctif le clic changeait
     bien l'etat mais ces 5 cartes restaient figees sur r.totaux. */
  const tAffiche = useMemo(() => {
    if (!r) return { joueurs: 0, parties: 0, clics_stations: 0, clics_partenaires: 0, clics_depuis_reseaux: 0 }
    if (jour === 'tous') return r.totaux
    const rJour = (r.redirections_partenaires ?? []).filter(x => x.jour === jour)
    return {
      joueurs: lignes.reduce((a, x) => a + x.joueurs, 0),
      parties: lignes.reduce((a, x) => a + x.parties, 0),
      clics_stations: lignes.reduce((a, x) => a + x.clics, 0),
      clics_partenaires: rJour.reduce((a, x) => a + x.clics, 0),
      clics_depuis_reseaux: rJour.reduce((a, x) => a + x.depuis_reseaux, 0),
    }
  }, [r, jour, lignes])

  /* Pic de redirections : jour et heure ou les partenaires ont le plus renvoye. */
  const pic = useMemo(() => {
    const l = r?.redirections_partenaires ?? []
    return l.length ? l.reduce((a, b) => (b.clics > a.clics ? b : a)) : null
  }, [r])

  const parPartenaire = useMemo(() => {
    const m = new Map<string, { clics: number; reseaux: number }>()
    for (const x of r?.redirections_partenaires ?? []) {
      const c = m.get(x.partenaire) ?? { clics: 0, reseaux: 0 }
      c.clics += x.clics; c.reseaux += x.depuis_reseaux
      m.set(x.partenaire, c)
    }
    return Array.from(m, ([valeur, v]) => ({ valeur, n: v.clics, reseaux: v.reseaux }))
      .sort((a, b) => b.n - a.n)
  }, [r])

  if (charge) return <div className="sa-content"><div className="sa-page"><div className="sa-muted">Chargement du rapport…</div></div></div>
  if (!r) return <div className="sa-content"><div className="sa-page"><EmptyState title="Rapport indisponible" /></div></div>

  /* Romain, 02/09 : « statistique n est pas bien organise, pareil categorie
     events puis info sous-categorisee, soit en vignette cliquable soit en
     carrousel, mais la c est insupportable [...] les vignettes ne sont pas
     cliquables ».
     Les tuiles ETAIENT cliquables, mais elles ne faisaient que DEFILER vers une
     section deja a l ecran : rien ne semblait se passer. Elles selectionnent
     desormais la section affichee, et on ne voit qu elle. Les 12 blocs empiles
     deviennent 7 vues. Aucun calcul n est modifie : c est le meme ecran, range. */
  const t = tAffiche
  /* Un commerce partenaire EST une station de jeu : on ne les separe plus en deux
     tableaux, on les distingue par un marqueur dans la meme liste. */
  const nbCommerces = lignes.filter(l => l.type === 'commerce').length
  const nbStations = lignes.length - nbCommerces

  const tableau = (titre: string, l: typeof lignes, vide: string) => (
    <>
      <SectionHeader>{titre}</SectionHeader>
      {l.length === 0 && <div className="sa-muted" style={{ fontSize: 13, marginBottom: 14 }}>{vide}</div>}
      {l.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 18 }}>
          <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
            <thead><tr>
              <th>Jour</th><th>Station</th><th style={{ textAlign: 'right' }}>Clics</th>
              <th style={{ textAlign: 'right' }}>Parties</th><th style={{ textAlign: 'right' }}>Joueurs</th>
              <th style={{ textAlign: 'right' }}>1<sup>re</sup> fois</th><th style={{ textAlign: 'right' }}>Revenus</th>
            </tr></thead>
            <tbody>
              {l.map((x, i) => (
                <tr key={`${x.jour}-${x.event_id}-${i}`}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fr(x.jour)}</td>
                  <td style={{ fontWeight: 700 }}>
                    <span title={x.type === 'commerce' ? 'Station chez un commerce partenaire' : 'Station du festival'}>
                      {x.type === 'commerce' ? '🤝 ' : '🎪 '}
                    </span>{x.station}
                  </td>
                  <td style={{ textAlign: 'right' }}>{x.clics}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{x.parties}</td>
                  <td style={{ textAlign: 'right' }}>{x.joueurs}</td>
                  <td style={{ textAlign: 'right', color: '#1D9E75', fontWeight: 700 }}>{x.primo_inscrits}</td>
                  <td style={{ textAlign: 'right', color: '#7C2D92', fontWeight: 700 }}>{x.joueurs_revenus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )

  const VUES: { id: string; icone: string; titre: string; chiffre: string | number; sous: string }[] = [
    { id: 'reference', icone: '🔢', titre: 'Chiffres de référence', chiffre: t.joueurs, sous: 'joueurs · publiables' },
    /* `parties` et `clics_stations` etaient dans l ancien bandeau de 5 KPI :
       ils doivent rester lisibles quelque part, sinon le total de parties du
       festival disparait purement et simplement de l ecran. */
    { id: 'stations', icone: '📡', titre: 'Tracking par station', chiffre: t.clics_stations, sous: `clics · ${nbStations} festival, ${nbCommerces} partenaires` },
    { id: 'activite', icone: '🎮', titre: 'Activité par jour', chiffre: t.parties, sous: `parties · ${lignes.length} lignes jour × station` },
    { id: 'pics', icone: '🔥', titre: 'Pics de jeu', chiffre: pics?.pic?.parties ?? '—', sous: pics?.pic ? `le ${fr(pics.pic.soiree)} à ${pics.pic.heure}h` : 'aucun pic' },
    { id: 'partenaires', icone: '🔗', titre: 'Retombées partenaires', chiffre: t.clics_partenaires, sous: `${t.clics_depuis_reseaux} depuis les réseaux` },
    { id: 'audience', icone: '👥', titre: "Profil de l'audience", chiffre: t.joueurs, sous: 'genre · âge · découverte' },
    { id: 'joueurs', icone: '🏅', titre: 'Meilleurs joueurs', chiffre: r.meilleurs_joueurs.length, sous: 'classement' },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="📊 Statistiques & résultats" subtitle="Activité, audience et retombées partenaires" />

        {supers.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--sa-muted)', marginRight: 4 }}>
              Super event
            </span>
            {supers.map(x => (
              <button key={x.id} className={`sa-btn sm${x.id === se ? ' primary' : ''}`} onClick={() => setSe(x.id)}>
                {x.nom}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' }}>
          <button className={`sa-btn sm${jour === 'tous' ? ' primary' : ''}`} onClick={() => setJour('tous')}>Toutes les dates</button>
          {jours.filter(([, hf]) => !hf).map(([j]) => (
            <button key={j} className={`sa-btn sm${jour === j ? ' primary' : ''}`} onClick={() => setJour(j)}>{fr(j)}</button>
          ))}
          {jours.some(([, hf]) => hf) && (
            <span style={{ fontSize: 10.5, color: 'var(--sa-muted)', margin: '0 4px' }}>· après clôture (09/07→18/07) →</span>
          )}
          {jours.filter(([, hf]) => hf).map(([j]) => (
            <button key={j} className={`sa-btn sm${jour === j ? ' primary' : ''}`} style={{ opacity: 0.75 }} onClick={() => setJour(j)}>{fr(j)}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginBottom: 16 }}>
          Les dates après clôture (visiteurs revenus après le 18/07) sont réelles mais hors période officielle — jamais dans les &quot;Chiffres de référence&quot;.
        </div>

        {/* Les vignettes NE DEFILENT PLUS vers une section : elles la selectionnent.
            Un clic qui fait defiler vers un bloc deja visible donne l impression
            que rien ne se passe — c est ce qui etait signale. */}
        <div className="sa-vue-grille">
          {VUES.map(v => (
            <button
              key={v.id}
              className={`sa-vue${section === v.id ? ' actif' : ''}`}
              onClick={() => setSection(v.id)}
              aria-pressed={section === v.id}
            >
              <span className="ic">{v.icone}</span>
              <span className="ch">{v.chiffre}</span>
              <span className="ti">{v.titre}</span>
              <span className="so">{v.sous}</span>
            </button>
          ))}
        </div>

        {section === 'reference' && (
          <>
            <SectionHeader>🔢 Chiffres de référence</SectionHeader>
            <BandeauChiffres se={se} />
          </>
        )}

        {section === 'stations' && (
          <>
            <SectionHeader>📡 Tracking par station</SectionHeader>
            <div style={{ marginBottom: 22 }}>
              <TableauStations se={se} jour={jour === 'tous' ? undefined : jour} tout={jour === 'tous'} onStation={s2 => openDrawer('event', s2.event_id)} />
            </div>
          </>
        )}

        {section === 'activite' && tableau(
          `🎮 Activité par jour (${lignes.length}) — ${nbStations} du festival, ${nbCommerces} chez les partenaires`,
          lignes, 'Aucune activité sur cette sélection.')}

        {section === 'pics' && (
          pics?.cellules?.length ? (
            <>
              <SectionHeader>🔥 Pics de jeu</SectionHeader>
              {pics.pic && (
                <div className="sa-alert info" style={{ marginBottom: 12, fontSize: 12.5 }}>
                  Pic absolu : <b>{pics.pic.parties} parties</b> le <b>{pics.pic.soiree.split('-').reverse().join('/')}</b> entre{' '}
                  <b>{pics.pic.heure}h et {(pics.pic.heure + 1) % 24}h</b>.
                  {pics.creneau_dense && (
                    <> Le créneau <b>{pics.creneau_dense.debut}h-{pics.creneau_dense.fin}h</b> concentre{' '}
                    <b>{pics.creneau_dense.part} %</b> de l&apos;activité.</>
                  )}
                </div>
              )}
              <div style={{ marginBottom: 20 }}>
                <CarteChaleur cellules={pics.cellules} maximum={pics.maximum} titre="Parties par soirée et par heure" />
              </div>
            </>
          ) : (
            <div className="sa-muted" style={{ fontSize: 13 }}>Aucun pic mesurable sur cette sélection.</div>
          )
        )}

        {section === 'partenaires' && (
          <>
            <SectionHeader>🗺️ Consultation des partenaires dans l&apos;application</SectionHeader>
            <div className="sa-alert info" style={{ marginBottom: 14, fontSize: 12.5 }}>
              <b>{r.ecrans?.carte ?? 0} appareils</b> ont ouvert la carte des partenaires et{' '}
              <b>{r.ecrans?.partenaires ?? 0}</b> l&apos;écran partenaires.
              {(r.totaux.clics_sortants ?? 0) === 0 && (
                <> Le détail par partenaire n&apos;est pas disponible pour cette édition :
                le suivi des clics sortants a été mis en service le 22/07, après la clôture du 18.
                Il est actif pour les prochaines opérations.</>
              )}
            </div>

            <SectionHeader>🔗 Redirections vers les partenaires</SectionHeader>
            {pic && (
              <div className="sa-alert info" style={{ marginBottom: 14, fontSize: 12.5 }}>
                Pic de redirections : <b>{pic.clics} clics</b> vers <b>{pic.partenaire}</b> le <b>{fr(pic.jour)}</b> à <b>{String(pic.heure).padStart(2, '0')}h</b>.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <Camembert titre="Clics par partenaire" parts={parPartenaire} unite="clics" />
              <Camembert titre="Origine des clics partenaires" unite="clics"
                parts={[
                  { valeur: 'Depuis les réseaux sociaux', n: t.clics_depuis_reseaux },
                  { valeur: 'Origine non déclarée', n: t.clics_partenaires - t.clics_depuis_reseaux },
                ]} />
            </div>
          </>
        )}

        {section === 'audience' && (
          <>
            <SectionHeader>👥 Profil de l&apos;audience</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Camembert titre="Genre" parts={r.genre} unite="joueurs" />
              <Camembert titre="Tranche d'âge" parts={r.age} unite="joueurs" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <Camembert titre="Comment ont-ils connu le festival ?" parts={r.decouverte} unite="joueurs" />
            </div>
          </>
        )}

        {section === 'joueurs' && (
          <>
            <SectionHeader>🏅 Meilleurs joueurs</SectionHeader>
            <div style={{ overflowX: 'auto' }}>
              <table className="sa-table" style={{ width: '100%', fontSize: 12.5 }}>
                <thead><tr>
                  <th>#</th><th>Joueur</th><th>Code postal</th>
                  <th style={{ textAlign: 'right' }}>Parties</th><th style={{ textAlign: 'right' }}>Lots gagnés</th><th>Contact</th>
                </tr></thead>
                <tbody>
                  {r.meilleurs_joueurs.map((j, i) => (
                    <tr
                      key={j.joueur_id}
                      onClick={() => openDrawer('joueur', j.joueur_id)}
                      style={{ cursor: 'pointer', ...(j.gains > 0 ? { background: 'rgba(245,161,0,.08)' } : {}) }}
                    >
                      <td style={{ fontWeight: 800, color: 'var(--sa-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 700 }}>{[j.prenom, j.nom].filter(Boolean).join(' ') || '—'}</td>
                      <td>{j.code_postal ?? '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{j.parties}</td>
                      <td style={{ textAlign: 'right' }}>{j.gains > 0 ? <b style={{ color: '#a1690a' }}>🏆 {j.gains}</b> : '—'}</td>
                      <td>{j.optin ? <span className="sa-chip live">✓</span> : <span className="sa-chip past">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
