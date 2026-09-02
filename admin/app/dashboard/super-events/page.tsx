'use client'

/**
 * Super Events — liste et duplication.
 * Repond au besoin produit : ce qui a ete fabrique pour une edition doit se
 * rejouer sur la suivante sans tout refaire.
 *
 * La duplication ne copie QUE la structure. Les gagnants, joueurs et stock
 * consomme appartiennent a une edition et ne sont jamais repris.
 */
import { useEffect, useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SectionHeader, EmptyState, StatusChip } from '@/components/dashboard/DashboardUI'
import {
  fetchSuperEvents, dupliquerSuperEvent, slugSuperEvent,
  type SuperEvent, type ResultatDuplication,
} from '@/lib/nds'

/* Le statut en base n est pas remis a jour a la fin d une edition :
   on le deduit des dates, comme pour les events. */
function statutReel(se: SuperEvent): 'passe' | 'en_cours' | 'a_venir' {
  if (!se.date_d) return (se.status as 'a_venir') ?? 'a_venir'
  const j = new Date(); j.setHours(0, 0, 0, 0)
  const d = new Date(se.date_d); d.setHours(0, 0, 0, 0)
  const f = new Date(se.date_f ?? se.date_d); f.setHours(23, 59, 59, 999)
  if (f < j) return 'passe'
  if (d > j) return 'a_venir'
  return 'en_cours'
}
const libStatut = { passe: '📁 Terminé', en_cours: '🔴 En cours', a_venir: '📅 À venir' } as const

/* Le kanban filtrait sur e.status brut (colonnes live/upcoming/past) sans jamais
   prevoir le statut 'archived' -- deja identifie et corrige le 28/07 sur /pro/events
   (meme logique reprise ici a l identique) : 'archived' fait foi quand il est present,
   sinon on classe par dates. Consequence avant ce fix : les stations archivees
   (ex. 3 sur se-nds-2026 : Brigade Verte, Les Caisses, Le Bar) ne matchaient aucune
   des 3 colonnes et disparaissaient silencieusement du kanban. */
type EtatStation = 'live' | 'upcoming' | 'past' | 'archive'
function etatStation(e: { status?: string | null; date_d?: string | null; date_f?: string | null }): EtatStation {
  if (String(e.status) === 'archived') return 'archive'
  if (!e.date_d) return 'upcoming'
  const j = new Date(); j.setHours(0, 0, 0, 0)
  const d = new Date(e.date_d); d.setHours(0, 0, 0, 0)
  const f = new Date(e.date_f ?? e.date_d); f.setHours(23, 59, 59, 999)
  if (f < j) return 'past'
  if (d > j) return 'upcoming'
  return 'live'
}

export default function Page() {
  const { events, pros, openDrawer } = useDashboard()
  const [liste, setListe] = useState<SuperEvent[] | null>(null)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [source, setSource] = useState<SuperEvent | null>(null)
  const [nom, setNom] = useState('')
  const [dateD, setDateD] = useState('')
  const [dateF, setDateF] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [res, setRes] = useState<ResultatDuplication | null>(null)

  const charger = () => fetchSuperEvents().then(setListe)
  useEffect(() => { charger() }, [])

  const nouvelId = slugSuperEvent(nom)

  async function onDupliquer() {
    if (!source || !nouvelId) return
    setEnCours(true); setRes(null)
    const r = await dupliquerSuperEvent({
      source: source.id, nouveauId: nouvelId, nouveauNom: nom.trim(),
      dateD: dateD || null, dateF: dateF || null,
    })
    setRes(r); setEnCours(false)
    if (r.ok) { setNom(''); setDateD(''); setDateF(''); setSource(null); charger() }
  }

  /* Vue demandee par Romain : les super events groupes par statut reel
     (En cours / A venir / Termine), pas une liste plate ou tout se ressemble. */
  const parStatut = useMemo(() => {
    const g: Record<'en_cours' | 'a_venir' | 'passe', SuperEvent[]> = { en_cours: [], a_venir: [], passe: [] }
    ;(liste ?? []).forEach(se => g[statutReel(se)].push(se))
    return g
  }, [liste])
  const master = (liste ?? []).find(s => s.id === 'se-master-superevent') ?? null

  const accesRapides: { icone: string; label: string; href: string }[] = [
    { icone: '🏢', label: 'Pros', href: '/dashboard/pros' },
    { icone: '🤝', label: 'Partenaires', href: '/dashboard/partenaires' },
    { icone: '👥', label: 'Joueurs', href: '/dashboard/joueurs' },
    { icone: '🎁', label: 'Lots', href: '/dashboard/nds-lots' },
    { icone: '🏆', label: 'Gagnants', href: '/dashboard/gagnants' },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="⭐ Super Events" subtitle="Éditions et duplication de structure" />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          {master && (
            <button
              className="sa-btn primary"
              onClick={() => { setSource(master); setNom(''); setRes(null) }}
            >
              ✨ Nouveau Super Event depuis le template
            </button>
          )}
          {/* La creation DE ZERO, distincte de la duplication ci-contre : on choisit
              les pros et leurs jeux au lieu de rejouer une structure existante. */}
          <a href="/dashboard/wizard-super-event" className="sa-btn primary">✨ Créer un super event</a>
          {/* Cote pro, « participer a un super event » passe par /pro/rejoindre :
              les demandes atterrissent ici, c est la meme porte vue du SA. */}
          <a href="/dashboard/demandes-rattachement" className="sa-btn">🤝 Demandes de participation</a>
        </div>

        {liste === null && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {liste?.length === 0 && <EmptyState title="Aucun super event" />}

        {liste !== null && liste.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {([['en_cours', '🔴 En cours'], ['a_venir', '📅 À venir'], ['passe', '📁 Terminé']] as const).map(([cle, titreCol]) => (
              <div key={cle}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sa-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {titreCol} ({parStatut[cle].length})
                </div>
                {parStatut[cle].length === 0 && <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>—</div>}
                {parStatut[cle].map(se => {
                  const st = statutReel(se)
                  const seEvents = events.filter(e => e.super_event_id === se.id)
                  // Meme convention que plus bas dans ce fichier : le pro 'pro-nds-2026'
                  // (ou equivalent id se-<x>) porte le role organisateur du super event.
                  const orga = pros.find(p => p.id === `pro-${se.id.replace(/^se-/, '')}`) ?? pros.find(p => p.id === 'pro-nds-2026' && se.id === 'se-nds-2026')
                  const colonnes: { cle: EtatStation; titre: string }[] = [
                    { cle: 'live', titre: '🔴 En cours' },
                    { cle: 'upcoming', titre: '📅 À venir' },
                    { cle: 'past', titre: '✅ Passées' },
                    { cle: 'archive', titre: '🗄️ Archivées' },
                  ]
                  return (
                    <div key={se.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <b style={{ fontSize: 14.5 }}>{se.nom}</b>
                        <span className={`sa-chip ${st === 'en_cours' ? 'live' : 'past'}`} style={{ fontSize: 10 }}>{libStatut[st]}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginTop: 4 }}>
                        {se.date_d ?? '—'}{se.date_f ? ` → ${se.date_f}` : ''}
                      </div>
                      <div style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 10.5, color: 'var(--sa-muted)', marginTop: 4 }}>{se.id}</div>
                      {orga && (
                        <div
                          onClick={() => openDrawer('pro', orga.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', background: 'var(--sa-subtle)', borderRadius: 8, cursor: 'pointer', width: 'fit-content' }}
                        >
                          <span style={{ fontSize: 12 }}>🏛️</span>
                          <span style={{ fontSize: 11.5, fontWeight: 700 }}>{orga.nom}</span>
                          <span className="sa-muted" style={{ fontSize: 10.5 }}>· fiche complète →</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {accesRapides.map(a => (
                          <a key={a.label} href={a.href} className="sa-btn sm" style={{ textDecoration: 'none', fontSize: 11 }}>
                            {a.icone} {a.label}
                          </a>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button
                          className="sa-btn sm primary"
                          onClick={() => openDrawer('superevent', se.id)}
                        >
                          🎪 Ouvrir la fiche
                        </button>
                        <a href={`/dashboard/operations/${se.id}`} className="sa-btn sm" style={{ textDecoration: 'none' }}>
                          📊 Fiche complète (KPIs, commerces, tarif)
                        </a>
                        <button className="sa-btn sm" onClick={() => setOuvert(ouvert === se.id ? null : se.id)}>
                          {ouvert === se.id ? 'Masquer' : `📍 ${seEvents.length} station${seEvents.length > 1 ? 's' : ''}`}
                        </button>
                        <button className="sa-btn sm" style={{ marginLeft: 'auto' }}
                          onClick={() => { setSource(se); setNom(''); setRes(null) }}>
                          🔁 Dupliquer
                        </button>
                      </div>

                      {ouvert === se.id && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--sa-border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                            {colonnes.map(col => {
                              const cardsCol = seEvents.filter(e => etatStation(e) === col.cle)
                              return (
                                <div key={col.cle}>
                                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--sa-muted)', marginBottom: 6 }}>{col.titre} ({cardsCol.length})</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {cardsCol.length === 0 && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>—</div>}
                                    {cardsCol.map(ev => {
                                      const pro = pros.find(p => p.id === ev.pro_id)
                                      return (
                                        <div
                                          key={ev.id}
                                          onClick={() => openDrawer('event', ev.id)}
                                          style={{ background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '7px 9px', cursor: 'pointer' }}
                                        >
                                          <div style={{ fontWeight: 700, fontSize: 12 }}>{ev.nom}</div>
                                          <div style={{ fontSize: 10, color: 'var(--sa-muted)' }}>
                                            {ev.pro_id === 'pro-nds-2026' ? 'Organisateur' : (pro?.nom ?? 'Partenaire')} · {ev.participants ?? 0} 👥
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <a
                            href="/dashboard/wizard-event"
                            target="_blank" rel="noreferrer"
                            style={{ display: 'block', textAlign: 'center', marginTop: 10, padding: '8px', border: '1px dashed var(--sa-border)', borderRadius: 8, fontSize: 11.5, fontWeight: 700, color: 'var(--sa-accent)', textDecoration: 'none' }}
                          >
                            + Ajouter une station
                          </a>
                          <div style={{ fontSize: 10, color: 'var(--sa-muted)', marginTop: 4, textAlign: 'center' }}>
                            Créée hors de ce Super Event — à rattacher ensuite via sa fiche → Éditer → Super Event.
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {source && (
          <>
            <SectionHeader>🔁 Dupliquer « {source.nom} »</SectionHeader>
            <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 18 }}>
              <div className="sa-alert info" style={{ marginBottom: 14, fontSize: 12.5 }}>
                Seule la <b>structure</b> est copiée : paramètres, stations de jeu, thème, sondage.
                Les joueurs, tirages, gagnants et stock consommé <b>ne sont jamais repris</b> —
                la nouvelle édition repart à zéro.
              </div>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Nom de la nouvelle édition</label>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Jazz à Nice 2027"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--sa-border)', borderRadius: 9, fontSize: 14, marginBottom: 4 }} />
              {nouvelId && <div style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 12 }}>Identifiant : {nouvelId}</div>}

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Début</label>
                  <input type="date" value={dateD} onChange={e => setDateD(e.target.value)}
                    style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--sa-border)', borderRadius: 9, fontSize: 13.5 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Fin</label>
                  <input type="date" value={dateF} onChange={e => setDateF(e.target.value)}
                    style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--sa-border)', borderRadius: 9, fontSize: 13.5 }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sa-btn primary" disabled={!nouvelId || enCours} onClick={onDupliquer}>
                  {enCours ? 'Duplication…' : '🔁 Dupliquer la structure'}
                </button>
                <button className="sa-btn" onClick={() => { setSource(null); setRes(null) }}>Annuler</button>
              </div>
            </div>
          </>
        )}

        {res && (
          <div className={`sa-alert ${res.ok ? 'info' : 'warn'}`} style={{ marginTop: 14, fontSize: 13 }}>
            {res.ok ? (
              <>
                ✅ <b>{res.super_event}</b> créé — {res.events_dupliques} station{(res.events_dupliques ?? 0) > 1 ? 's' : ''} sur {res.events_source} dupliquée{(res.events_dupliques ?? 0) > 1 ? 's' : ''},
                {' '}{res.partenaires_reutilisables} partenaire{(res.partenaires_reutilisables ?? 0) > 1 ? 's' : ''} réutilisable{(res.partenaires_reutilisables ?? 0) > 1 ? 's' : ''}.
                {!!res.events_hors_convention && <> ⚠ {res.events_hors_convention} event(s) hors convention de nommage, non dupliqué(s).</>}
                <br /><span style={{ fontSize: 12, opacity: .8 }}>{res.note}</span>
              </>
            ) : <>❌ Duplication impossible : {res.raison}</>}
          </div>
        )}
      </div>
    </div>
  )
}
