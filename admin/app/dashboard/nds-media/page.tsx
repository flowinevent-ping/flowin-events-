'use client'

/**
 * SUPPORTS DE COMMUNICATION — ranges par operation, puis par pro et par station.
 *
 * Romain, 02/09 : « il manque des infos. Pourquoi ces infos ne se trouvent-elles
 * pas dans la fiche pro plutot qu ici ? Je pense que ce sont les supports de
 * comm et video de l EVENT qu il faut afficher ici, ranges par events pour que
 * ce ne soit pas le bordel. Exemple NDS avait des visuels A4, video, etc. »
 *
 * REGLE DE SUPPORT (canonique, conservee) : le support ne compte pas dans le
 * modele de donnees. A4, forex, video, sticker portent le MEME QR, celui de la
 * station. Cette vue donne acces aux declinaisons — elle n introduit aucune
 * dimension de tracking.
 *
 * TROIS DEFAUTS DE LA VERSION PRECEDENTE, tous corriges ici :
 *
 * 1. Elle listait les PARTENAIRES, pas les stations. Or le logo, le site et les
 *    reseaux sont des informations de la FICHE PRO — elles y sont deja, et les
 *    repeter ici faisait deux endroits a tenir a jour. La page ne garde que le
 *    logo comme vignette d identification et renvoie a la fiche pour le reste.
 * 2. Elle DEVINAIT l identifiant de l event : `ev-nds-` + slug du partenaire,
 *    avec un lien fige sur `/parcours/nds2026`. Une station dont l id ne suivait
 *    pas cette convention recevait un QR pointant dans le vide — et l erreur ne
 *    se serait vue qu une fois les affiches posees. On lit maintenant les VRAIS
 *    events, avec leur vrai module et leur vrai identifiant.
 * 3. Le QR passait par api.qrserver.com : une image distante, ni telechargeable
 *    proprement ni imprimable. C est <Diffusion> qui le genere desormais dans le
 *    navigateur — PNG, SVG et affiche A4 comprises. La mention « Affiche A4 —
 *    pas encore disponible », affichee pour tous les partenaires, disparait :
 *    elle l est.
 */

import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import Diffusion from '@/components/dashboard/Diffusion'
import { fetchSuperEvents, SE_DEFAUT, type SuperEvent } from '@/lib/nds'
import { usePorteeInitiale } from '@/lib/portee'

const BASE = 'https://flowin-events.vercel.app'

export default function Page() {
  const { events, pros, partenaires, openDrawer } = useDashboard()
  const [se, setSe] = useState<string>(SE_DEFAUT)
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [q, setQ] = useState('')
  const [ouvert, setOuvert] = useState('')

  /* Portee recue de la fiche qui nous a ouverts. */
  const porteeUrl = usePorteeInitiale()
  useEffect(() => { if (porteeUrl.se) setSe(porteeUrl.se) }, [porteeUrl.se])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  /* La fiche commerce d une station, pour son logo. Par event_id d abord (le
     lien explicite), par nom ensuite — deux fiches sur onze n ont pas
     d event_id, et les ignorer ferait disparaitre leur logo. */
  const ficheDe = useMemo(() => {
    const parEvent: Record<string, (typeof partenaires)[number]> = {}
    const parNom: Record<string, (typeof partenaires)[number]> = {}
    partenaires.forEach(p => {
      const evId = (p as unknown as { event_id?: string | null }).event_id
      if (evId) parEvent[evId] = p
      if (p.nom) parNom[p.nom.trim().toLowerCase()] = p
    })
    return (evId: string, nom: string) =>
      parEvent[evId] ?? parNom[(nom || '').trim().toLowerCase()] ?? null
  }, [partenaires])

  const stations = useMemo(() => {
    const t = q.trim().toLowerCase()
    return events
      .filter(e => e.super_event_id === se)
      .filter(e => !t || (e.nom ?? '').toLowerCase().includes(t)
        || (pros.find(p => p.id === e.pro_id)?.nom ?? '').toLowerCase().includes(t))
      .slice()
      .sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'))
  }, [events, se, q, pros])

  /* Groupe par PRO : un pro qui tient trois stations les voit ensemble, au lieu
     d etre disperse dans une grille alphabetique. */
  const parPro = useMemo(() => {
    const ordre: string[] = []
    const par: Record<string, typeof stations> = {}
    stations.forEach(e => {
      const k = e.pro_id ?? '_sans'
      if (!par[k]) { par[k] = []; ordre.push(k) }
      par[k].push(e)
    })
    return ordre
      .map(id => ({ id, nom: pros.find(p => p.id === id)?.nom ?? 'Sans pro', lot: par[id] }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  }, [stations, pros])

  const lienStation = (ev: { id: string; module: string }) =>
    `${BASE}/parcours/${ev.module}?ev=${encodeURIComponent(ev.id)}`

  return (
    <div className="sa-page">
      <PageHeader
        title="🎬 Supports de communication"
        subtitle="QR, affiches et visuels — rangés par opération, puis par pro et par station"
      />

      {supers.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--sa-muted)', marginRight: 4 }}>
            Opération
          </span>
          {supers.map(x => (
            <button key={x.id} className={`sa-btn sm${se === x.id ? ' primary' : ''}`} onClick={() => setSe(x.id)}>
              {x.nom}
            </button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Le support n&apos;entre pas dans le modèle de tracking : A4, forex, vidéo ou sticker
        portent le <b>même QR</b>, celui de la station. Le logo, le site et les réseaux d&apos;un
        commerce vivent dans <b>sa fiche</b> — ils ne sont pas répétés ici.
      </div>

      <input
        className="sa-input"
        placeholder="Rechercher une station ou un pro…"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 16 }}
      />

      {!stations.length ? (
        <EmptyState
          icon="🎬"
          title="Aucune station"
          desc={q ? 'Aucun résultat pour cette recherche.' : 'Cette opération n’a pas encore de station.'}
        />
      ) : parPro.map(g => (
        <div key={g.id} style={{ marginBottom: 20 }}>
          <div className="sa-vign-secteur">
            <span className="lbl">{g.nom}</span>
            <span className="n">{g.lot.length}</span>
          </div>

          <div className="sa-vign-grille">
            {g.lot.map(ev => {
              const fi = ficheDe(ev.id, ev.nom ?? '')
              const deplie = ouvert === ev.id
              return (
                <div key={ev.id} className="sa-support">
                  <div className="tete">
                    <span className="logo">
                      {fi?.image_url
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={fi.image_url} alt="" />
                        : <span>{fi?.emoji || (ev.nom ?? '?').trim().charAt(0).toUpperCase()}</span>}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="nom">{ev.nom}</div>
                      <div className="mod">{ev.module}</div>
                    </div>
                  </div>

                  <div className="actions">
                    <button className="sa-btn sm" onClick={() => setOuvert(o => (o === ev.id ? '' : ev.id))}>
                      {deplie ? '▲ Supports' : '▼ Supports'}
                    </button>
                    <button className="sa-btn sm" onClick={() => openDrawer('event', ev.id)}>
                      Fiche station →
                    </button>
                    {ev.pro_id && (
                      <button className="sa-btn sm" onClick={() => openDrawer('pro', ev.pro_id as string)}>
                        Fiche pro →
                      </button>
                    )}
                  </div>

                  {deplie && (
                    <div style={{ marginTop: 12 }}>
                      {/* QR genere localement : PNG, SVG et affiche A4 imprimable. */}
                      <Diffusion
                        compact
                        url={lienStation(ev)}
                        titre={ev.nom ?? ev.id}
                        sousTitre={supers.find(x => x.id === se)?.nom ?? undefined}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
