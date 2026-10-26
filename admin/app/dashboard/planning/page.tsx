'use client'

/**
 * PLANNING — calendrier mensuel (type Google Agenda), maquette validee par
 * Romain le 26/10 (voir docs/roadmap). Remplace le tableau ListeCRM : celui-ci
 * « ne ressemblait pas a un planning ». Chaque barre = un super event ou un
 * event autonome (jamais une station individuelle, sinon un super event a 8
 * stations affiche 8 barres identiques le meme jour) ; events plusieurs
 * semaines affiches en continu ; chevauchement = empilement + repli "+N"
 * (lib/calendrier.ts, pattern Google Agenda).
 */
import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { Ico } from '@/lib/proicons'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import { estGabarit } from '@/lib/operations'
import { construireMois, NOMS_MOIS, type CalItem, type StatutCal } from '@/lib/calendrier'
import type { FlowinEvent } from '@/lib/types'

const DOW = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function statutDe(s: string | null | undefined): StatutCal {
  return s === 'live' ? 'live' : s === 'past' ? 'past' : 'upcoming'
}

export default function Page() {
  const { events, pros, partenaires, openDrawer } = useDashboard()
  const [supers, setSupers] = useState<SuperEvent[]>([])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  const aujourdhui = new Date()
  const [vue, setVue] = useState({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() })

  const enseigne = (e: FlowinEvent) => {
    const p = pros.find(x => x.id === e.pro_id)
    const pt = p?.partenaire_id ? partenaires.find(x => x.id === p.partenaire_id) : null
    return pt?.nom || p?.nom || null
  }

  // Une barre par OPERATION (super event ou event autonome), pas par station :
  // un super event a 8 stations ne doit pas afficher 8 barres identiques.
  const items: CalItem[] = useMemo(() => {
    const autonomes = events.filter(e => !estGabarit(e) && !e.super_event_id && e.date_d)
    const parSuper = new Map<string, boolean>()
    events.forEach(e => { if (e.super_event_id) parSuper.set(e.super_event_id, true) })

    const itemsSuper: CalItem[] = supers
      .filter(se => parSuper.has(se.id) && se.date_d)
      .map(se => ({
        id: se.id, type: 'se', label: se.nom, sub: 'Super event',
        debut: se.date_d!, fin: se.date_f ?? se.date_d!, statut: statutDe(se.status),
      }))

    const itemsEv: CalItem[] = autonomes.map(e => ({
      id: e.id, type: 'ev', label: e.nom, sub: enseigne(e) ?? undefined,
      debut: e.date_d!, fin: e.date_f ?? e.date_d!, statut: statutDe(e.status),
    }))

    return [...itemsSuper, ...itemsEv]
  }, [events, supers, pros, partenaires])

  const semaines = useMemo(() => construireMois(vue.annee, vue.mois, items), [vue, items])

  const ouvrir = (it: CalItem) => openDrawer(it.type === 'se' ? 'superevent' : 'event', it.id)

  const changerMois = (delta: number) => setVue(v => {
    const d = new Date(v.annee, v.mois + delta, 1)
    return { annee: d.getFullYear(), mois: d.getMonth() }
  })
  const allerAujourdhui = () => setVue({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() })

  return (
    <div className="sa-content">
      <div className="cal-head">
        <div>
          <div className="sa-page-title">Planning</div>
          <div className="sa-page-subtitle">Calendrier des events et super events</div>
        </div>
        <div className="cal-nav">
          <button className="cal-navbtn" type="button" aria-label="Mois précédent" onClick={() => changerMois(-1)}>
            <Ico k="chevronLeft" size={16} />
          </button>
          <button className="cal-navbtn" type="button" aria-label="Mois suivant" onClick={() => changerMois(1)}>
            <Ico k="chevronRight" size={16} />
          </button>
        </div>
        <div className="cal-title">{NOMS_MOIS[vue.mois]} {vue.annee}</div>
        <button className="cal-today-btn" type="button" onClick={allerAujourdhui}>Aujourd&apos;hui</button>
      </div>

      <div className="cal-legend">
        <span className="it"><span className="sw" style={{ background: 'var(--sa-cal-past)' }} />Terminé</span>
        <span className="it"><span className="sw" style={{ background: 'var(--sa-cal-live)' }} />En cours</span>
        <span className="it"><span className="sw" style={{ background: 'var(--sa-cal-upcoming)' }} />À venir</span>
      </div>

      <div className="cal">
        <div className="cal-dow">{DOW.map(d => <div key={d}>{d}</div>)}</div>

        {semaines.map((sem, si) => (
          <div className="cal-week" key={si}>
            {sem.jours.map((j, ji) => (
              <div key={ji} className={`cal-day${j.dansLeMois ? '' : ' out'}${j.today ? ' today' : ''}`}>
                <span className="cal-daynum">{j.jour}</span>
              </div>
            ))}
            {sem.barres.map(b => (
              <button
                key={`${b.item.id}-${b.colDebut}`}
                className={`cal-bar ${b.item.statut}`}
                style={{ gridColumn: `${b.colDebut + 1} / ${b.colFin + 2}`, gridRow: b.voie + 2 }}
                onClick={() => ouvrir(b.item)}
                title={b.item.sub ? `${b.item.label} — ${b.item.sub}` : b.item.label}
              >
                {b.item.label}
              </button>
            ))}
            {sem.replis.map(r => (
              <button
                key={`repli-${r.jourIdx}`}
                className="cal-more"
                style={{ gridColumn: `${r.jourIdx + 1} / ${r.jourIdx + 2}`, gridRow: 2 + 2 /* sous les 2 voies visibles */ }}
                title={r.items.map(it => it.label).join(', ')}
                onClick={() => ouvrir(r.items[0])}
              >
                +{r.items.length}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
