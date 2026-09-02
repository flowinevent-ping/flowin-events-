'use client'

/**
 * ACCUEIL — kanban HORIZONTAL de vignettes cliquables.
 *
 * Romain, 02/09 : « organise graphiquement mieux que ca, le kanban horizontal
 * format vignette cliquable. Il y a une regression, on ne peut pas cliquer sur
 * les infos ».
 *
 * CONSTAT AVANT DE TOUCHER : les cartes d event etaient deja cliquables (elles
 * ouvrent le drawer). Ce qui n a JAMAIS ete cliquable, ce sont les 4 tuiles du
 * haut — verifie dans tout l historique git du fichier, aucun onClick n y a
 * jamais existe. Elles le deviennent ici : chacune mene a l ecran qui detaille
 * son chiffre.
 *
 * Les deux grilles empilees (« en cours », « a venir ») deviennent UN kanban a
 * colonnes, ce qui montre d un coup ou en est le portefeuille au lieu de
 * masquer les events passes. Le filtre de portee en tete applique la regle
 * generale : on entre par un super event, et tout ce qui s affiche lui
 * appartient.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/contexts/DashboardContext'
import { StatusChip, ModuleChip } from '@/components/dashboard/DashboardUI'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'

type Ev = {
  id: string; nom: string; status: string; module: string
  date_d?: string | null; participants: number; couleur: string
  pro_id: string | null; super_event_id?: string | null
}

const COLONNES: { cle: string; titre: string; ton: string }[] = [
  { cle: 'live', titre: 'En cours', ton: '#22C55E' },
  { cle: 'upcoming', titre: 'À venir', ton: '#F59E0B' },
  { cle: 'past', titre: 'Terminés', ton: '#94A3B8' },
  { cle: 'archived', titre: 'Archivés', ton: '#CBD5E1' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { joueurs, events, partenaires, pros, lots, openDrawer } = useDashboard()
  const [portee, setPortee] = useState('')
  /* Pour NOMMER les portees : afficher « se-nds-2026 » sur un bouton, c est
     montrer une cle technique a quelqu un qui cherche « Nuits du Sud 2026 ». */
  const [supers, setSupers] = useState<SuperEvent[]>([])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  // Les fiches "Démo · X" (pro_id null) servent à tester chaque module de jeu,
  // pas a representer une activite operationnelle reelle -- exclues de l'accueil
  // pour ne pas polluer la vue "ce qui se passe reellement en ce moment".
  const estDemo = (e: { pro_id: string | null; nom: string }) => e.pro_id === null && e.nom.startsWith('Démo')

  const reels = useMemo(() => (events as Ev[]).filter(e => !estDemo(e)), [events])

  /* Les super events reellement portes par des events : on ne propose pas une
     portee qui ne filtrerait rien. */
  const portees = useMemo(() => {
    const vus: Record<string, boolean> = {}
    const out: string[] = []
    reels.forEach(e => {
      const s = e.super_event_id
      if (s && !vus[s]) { vus[s] = true; out.push(s) }
    })
    return out
  }, [reels])

  const filtres = useMemo(
    () => (portee ? reels.filter(e => e.super_event_id === portee) : reels),
    [reels, portee])

  const totalOptins = joueurs.filter(j => j.optin).length
  const totalGagnants = joueurs.filter(j => j.gains > 0).length
  const nbLive = filtres.filter(e => e.status === 'live').length
  const nbUpcoming = filtres.filter(e => e.status === 'upcoming').length

  const kpis: { val: number; lbl: string; sub: string; href: string }[] = [
    { val: joueurs.length, lbl: 'Joueurs CRM', sub: `${totalOptins} opt-in · ${totalGagnants} gagnants`, href: '/dashboard/joueurs' },
    { val: reels.length, lbl: 'Events', sub: `${nbLive} en cours · ${nbUpcoming} à venir`, href: '/dashboard/events' },
    { val: partenaires.length, lbl: 'Partenaires', sub: `${lots.length} lots · ${pros.length} pros`, href: '/dashboard/partenaires' },
    { val: totalOptins, lbl: 'Opt-in newsletter', sub: `${joueurs.length ? Math.round(totalOptins / joueurs.length * 100) : 0}% de taux`, href: '/dashboard/nds-participants' },
  ]

  const nomPro = (id: string | null) => (id ? pros.find(p => p.id === id)?.nom ?? id : null)

  return (
    <div className="sa-content">
      {/* Chaque tuile mene a l ecran qui detaille son chiffre — un chiffre qu on
          ne peut pas ouvrir est une impasse. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {kpis.map(k => (
          <button
            key={k.lbl}
            className="sa-kpi sa-kpi-clic"
            onClick={() => router.push(k.href)}
            title={`Ouvrir ${k.lbl}`}
          >
            <div className="sa-kpi-val">{k.val}</div>
            <div className="sa-kpi-lbl">{k.lbl}</div>
            <div className="sa-kpi-sub">{k.sub}</div>
          </button>
        ))}
      </div>

      {portees.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--sa-muted)', marginRight: 4 }}>
            Portée
          </span>
          <button className={`sa-btn sm${portee === '' ? ' primary' : ''}`} onClick={() => setPortee('')}>Tout Flowin</button>
          {portees.map(id => (
            <button key={id} className={`sa-btn sm${portee === id ? ' primary' : ''}`} onClick={() => setPortee(id)}>
              {supers.find(se => se.id === id)?.nom ?? id}
            </button>
          ))}
        </div>
      )}

      {filtres.length === 0 ? (
        <div className="sa-page" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun event</div>
          <div style={{ color: 'var(--sa-muted)', fontSize: 13 }}>
            Créez votre premier event depuis la section Events.
          </div>
        </div>
      ) : (
        <div className="sa-kanban">
          {COLONNES.map(col => {
            const lot = filtres.filter(e => e.status === col.cle)
            return (
              <section key={col.cle} className="sa-kb-col">
                <header className="sa-kb-tete">
                  <span className="pastille" style={{ background: col.ton }} />
                  <span className="t">{col.titre}</span>
                  <span className="n">{lot.length}</span>
                </header>
                <div className="sa-kb-corps">
                  {lot.length === 0 && <div className="sa-kb-vide">—</div>}
                  {lot.map(ev => (
                    <button
                      key={ev.id}
                      className="sa-kb-vignette"
                      style={{ borderLeftColor: ev.couleur ?? '#7C2D92' }}
                      onClick={() => openDrawer('event', ev.id, 'infos')}
                      title={`Ouvrir ${ev.nom}`}
                    >
                      <div className="chips">
                        <StatusChip status={ev.status} />
                        <ModuleChip module={ev.module} />
                      </div>
                      <div className="nom">{ev.nom}</div>
                      {/* Le pro auquel l event appartient : on entre dans un event
                          et on voit a qui il est, sans ouvrir la fiche. */}
                      {nomPro(ev.pro_id) && <div className="pro">🏢 {nomPro(ev.pro_id)}</div>}
                      <div className="meta">
                        <span>👥 {ev.participants}</span>
                        {ev.date_d && <span>📅 {new Date(ev.date_d).toLocaleDateString('fr-FR')}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
