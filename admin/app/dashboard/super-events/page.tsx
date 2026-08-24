'use client'

/**
 * Super Events — liste et duplication.
 * Repond au besoin produit : ce qui a ete fabrique pour une edition doit se
 * rejouer sur la suivante sans tout refaire.
 *
 * La duplication ne copie QUE la structure. Les gagnants, joueurs et stock
 * consomme appartiennent a une edition et ne sont jamais repris.
 */
import { useEffect, useState } from 'react'
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

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="⭐ Super Events" subtitle="Éditions et duplication de structure" />

        {liste === null && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {liste?.length === 0 && <EmptyState title="Aucun super event" />}

        {(liste ?? []).map(se => {
          const st = statutReel(se)
          const seEvents = events.filter(e => e.super_event_id === se.id)
          const colonnes: { cle: string; titre: string }[] = [
            { cle: 'live', titre: '🔴 En cours' },
            { cle: 'upcoming', titre: '📅 À venir' },
            { cle: 'past', titre: '✅ Passées' },
          ]
          return (
            <div key={se.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 15 }}>{se.nom}</b>
                <span className={`sa-chip ${st === 'en_cours' ? 'live' : 'past'}`}>{libStatut[st]}</span>
                <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>
                  {se.date_d ?? '—'}{se.date_f ? ` → ${se.date_f}` : ''}
                </span>
                <button className="sa-btn sm" onClick={() => setOuvert(ouvert === se.id ? null : se.id)}>
                  {ouvert === se.id ? 'Masquer' : `📍 ${seEvents.length} station${seEvents.length > 1 ? 's' : ''}`}
                </button>
                <button className="sa-btn sm primary" style={{ marginLeft: 'auto' }}
                  onClick={() => { setSource(se); setNom(''); setRes(null) }}>
                  🔁 Dupliquer
                </button>
              </div>
              <div style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11, color: 'var(--sa-muted)', marginTop: 6 }}>{se.id}</div>

              {ouvert === se.id && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--sa-border)' }}>
                  {colonnes.map(col => {
                    const cardsCol = seEvents.filter(e => e.status === col.cle)
                    return (
                      <div key={col.cle}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--sa-muted)', marginBottom: 8 }}>{col.titre} ({cardsCol.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {cardsCol.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>—</div>}
                          {cardsCol.map(ev => {
                            const pro = pros.find(p => p.id === ev.pro_id)
                            return (
                              <div
                                key={ev.id}
                                onClick={() => openDrawer('event', ev.id)}
                                style={{ background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 12.5 }}>{ev.nom}</div>
                                <div style={{ fontSize: 10.5, color: 'var(--sa-muted)' }}>
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
              )}
            </div>
          )
        })}

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
