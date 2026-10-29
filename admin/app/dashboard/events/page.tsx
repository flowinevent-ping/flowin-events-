'use client'

/**
 * Animations (ex-"Events") — reorganise en kanban par pro, demande explicite
 * de Romain (25/08) : la liste plate groupee uniquement par statut etait
 * illisible (stations NDS et animations boutique melangees sans reperes).
 *
 * REGLE CONFIRMEE avec Romain (25/08, apres clarification explicite -- "ce
 * qui est bon dans Super Event n'existe pas dans Anim, point") : EXCLUSIVITE
 * STRICTE A L'AFFICHAGE. Un event rattache a un super event (super_event_id
 * non nul, ex. toutes les stations NDS 2026) n'apparait JAMAIS ici, seulement
 * dans /dashboard/super-events. Seuls les events SANS super_event_id (ex.
 * "Fetes de Paques 2026", animations boutique hors festival) apparaissent
 * dans cette page. La donnee en base reste inchangee (pro_id + super_event_id
 * peuvent toujours coexister sur un event) -- seul le FILTRE D'AFFICHAGE de
 * cette page applique l'exclusivite, pas une contrainte structurelle.
 */
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useDashboard } from '@/contexts/DashboardContext'
import { sansGabarit } from '@/lib/operations'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'
import ParcoursMobil from '@/components/pro/ParcoursMobil'
import { Ico } from '@/lib/proicons'
import { ACCENT_ANIM } from '@/lib/charte'
import type { FlowinEvent } from '@/lib/types'

type EtatAnim = 'live' | 'upcoming' | 'past' | 'archived'
const COLONNES: { cle: EtatAnim; titre: string }[] = [
  { cle: 'live', titre: 'Active' },
  { cle: 'upcoming', titre: 'À venir' },
  { cle: 'past', titre: 'Passée' },
  { cle: 'archived', titre: 'Archivée' },
]

export default function Page() {
  const { events, pros, openDrawer, openDrawerEdit } = useDashboard()
  const [search, setSearch] = useState('')
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [onglet, setOnglet] = useState<'kanban' | 'parcours'>('kanban')

  const evsParcours = useMemo(() => {
    const reels = sansGabarit(events).filter(e => e.module && e.super_event_id)
    const parPro = new Map<string, typeof reels[number]>()
    for (const e of reels) {
      const cle = e.pro_id ?? e.id
      const actuel = parPro.get(cle)
      if (!actuel || (e.status === 'live' && actuel.status !== 'live')) parPro.set(cle, e)
    }
    return Array.from(parPro.values())
      .map(e => ({ id: e.id, module: e.module, nom: pros.find(p => p.id === e.pro_id)?.nom ?? e.nom, super_event_id: e.super_event_id }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [events, pros])

  /* Cette page groupe PAR PRO : un event sans pro_id (ex. la demo B2B "Découvrez
     Flowin", sans pro rattache) n'a pas sa place ici -- il faisait apparaitre une
     fausse carte "-" avant ce fix. Meme regle qu'avant pour les super events. */
  const base = useMemo(() =>
    events.filter((e: FlowinEvent & Record<string, unknown>) => !e.super_event_id && !!e.pro_id),
  [events])

  const list = useMemo(() => {
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter((item: FlowinEvent) => ((item as any).nom ?? '').toLowerCase().includes(q))
  }, [base, search])

  /* Groupement par pro (vignette), animations de chaque pro triees par statut
     a l'interieur -- meme pattern que /dashboard/super-events (carte depliable
     -> mini-kanban), pour rester coherent avec ce qui existe deja. */
  const parPro = useMemo(() => {
    const g = new Map<string, (FlowinEvent & Record<string, unknown>)[]>()
    for (const ev of list as (FlowinEvent & Record<string, unknown>)[]) {
      const pid = String(ev.pro_id ?? '—')
      if (!g.has(pid)) g.set(pid, [])
      g.get(pid)!.push(ev)
    }
    return Array.from(g.entries())
      .map(([pid, animations]) => ({ pro: pros.find(p => p.id === pid), pid, animations }))
      .sort((a, b) => b.animations.length - a.animations.length)
  }, [list, pros])

  /* Statut global d'un pro (pour le classer en colonne, meme principe que
     statutReel() sur /dashboard/super-events) : en_cours si au moins une
     animation live, sinon a_venir si au moins une upcoming, sinon passe. */
  type ColPro = 'en_cours' | 'a_venir' | 'passe'
  const statutPro = (animations: (FlowinEvent & Record<string, unknown>)[]): ColPro => {
    if (animations.some(a => a.status === 'live')) return 'en_cours'
    if (animations.some(a => a.status === 'upcoming')) return 'a_venir'
    return 'passe'
  }

  const parStatutCol = useMemo(() => {
    const g: Record<ColPro, typeof parPro> = { en_cours: [], a_venir: [], passe: [] }
    for (const item of parPro) g[statutPro(item.animations)].push(item)
    return g
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parPro])

  /* Memes acces rapides que sur /dashboard/super-events, meme carte -- Romain
     demande explicitement la meme presentation. "Pros" retire ici (on est
     deja sur une vue par pro, redondant). */
  const accesRapides: { icone: string; label: string; href: string }[] = [
    { icone: 'handshake', label: 'Partenaires', href: '/dashboard/partenaires' },
    { icone: 'users', label: 'Joueurs', href: '/dashboard/joueurs' },
    { icone: 'gift', label: 'Lots', href: '/dashboard/nds-lots' },
    { icone: 'star', label: 'Gagnants', href: '/dashboard/gagnants' },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="Events"
          subtitle={`${list.length} animation${list.length > 1 ? 's' : ''} · ${parPro.length} pro${parPro.length > 1 ? 's' : ''} — hors super events (voir Super Events pour les stations NDS)`}
          actions={
            <>
              <Link href="/dashboard/wizard-event" className="sa-btn primary sm"><Ico k="plus" size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Nouvel event</Link>
              {/* L autre porte d entree : un pro qui demande a participer depuis /pro/rejoindre. */}
              <Link href="/dashboard/demandes-rattachement" className="sa-btn sm"><Ico k="handshake" size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Demandes de participation</Link>
            </>
          }
        />

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <button className={`sa-btn sm${onglet === 'kanban' ? ' primary' : ''}`} onClick={() => setOnglet('kanban')}><Ico k="list" size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Kanban</button>
          <button className={`sa-btn sm${onglet === 'parcours' ? ' primary' : ''}`} onClick={() => setOnglet('parcours')}><Ico k="phone" size={12} style={{ marginRight: 5, verticalAlign: -2 }} />Parcours mobil</button>
        </div>

        {onglet === 'parcours' && (
          <ParcoursMobil events={evsParcours} showTitle={false} />
        )}

        {onglet === 'kanban' && (<>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher…" />
        </div>

        {list.length === 0 && <EmptyState title="Aucun résultat" />}

        {list.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {([['en_cours', 'En cours'], ['a_venir', 'À venir'], ['passe', 'Terminé']] as const).map(([cle, titreCol]) => (
              <div key={cle}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--sa-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  {titreCol} ({parStatutCol[cle].length})
                </div>
                {parStatutCol[cle].length === 0 && <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>—</div>}
                {parStatutCol[cle].map(({ pro, pid, animations }) => {
                  const parStatut = (statut: EtatAnim) => animations.filter(a => String(a.status ?? 'past') === statut)
                  const enCours = parStatut('live').length
                  return (
                    <div key={pid} className="sa-kb-vignette" style={{ cursor: 'default', marginBottom: 12 }}>
                      <div className="sa-kb-ligne">
                        <span className="sa-kb-pastille" style={{ background: `${ACCENT_ANIM}20`, color: ACCENT_ANIM }}>
                          <Ico k="shop" size={14} />
                        </span>
                        <span className="sa-kb-nom">{pro?.nom ?? pid}</span>
                        {enCours > 0 && <span className="sa-kb-date">{enCours} en cours</span>}
                      </div>
                      <div className="sa-kb-sub">
                        {animations.length} animation{animations.length > 1 ? 's' : ''} · {pid}
                      </div>

                      {/* Meme principe que l option B des cartes Super Events (validee
                          par Romain le 28/10) : raccourcis en chips plutot qu en gros
                          boutons pleine largeur, visibles sans ouvrir le detail. */}
                      <div className="sa-kb-chips">
                        {accesRapides.map(a => (
                          <a key={a.label} href={a.href} className="sa-kb-chip">
                            <Ico k={a.icone} size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{a.label}
                          </a>
                        ))}
                        <button className="sa-kb-chip muted" onClick={() => setOuvert(ouvert === pid ? null : pid)}>
                          {ouvert === pid ? '▲ Masquer' : <><Ico k="pin" size={12} style={{ marginRight: 5, verticalAlign: -2 }} />{animations.length} animation{animations.length > 1 ? 's' : ''}</>}
                        </button>
                      </div>

                      {ouvert === pid && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--sa-border)', marginLeft: 34 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                            {COLONNES.map(col => {
                              const cardsCol = parStatut(col.cle)
                              return (
                                <div key={col.cle}>
                                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--sa-muted)', marginBottom: 6 }}>{col.titre} ({cardsCol.length})</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                    {cardsCol.length === 0 && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>—</div>}
                                    {cardsCol.map(ev => (
                                      <div
                                        key={String(ev.id)}
                                        onClick={() => openDrawer('event', String(ev.id))}
                                        style={{ background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', position: 'relative' }}
                                      >
                                        <div style={{ fontWeight: 700, fontSize: 12 }}>{String(ev.nom ?? '—')}</div>
                                        <div style={{ fontSize: 10, color: 'var(--sa-muted)' }}><Ico k="users" size={11} style={{ marginRight: 3, verticalAlign: -2 }} />{String(ev.participants ?? 0)}</div>
                                        <button
                                          className="sa-btn icon sm"
                                          title="Éditer"
                                          onClick={e => { e.stopPropagation(); openDrawerEdit('event', String(ev.id)) }}
                                          style={{ position: 'absolute', top: 5, right: 5, opacity: 0.6 }}
                                        ><Ico k="edit" size={12} /></button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
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
        </>)}
      </div>
    </div>
  )
}
