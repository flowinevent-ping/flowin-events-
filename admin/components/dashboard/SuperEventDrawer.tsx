'use client'

/**
 * DRAWER SUPER EVENT — le seul des cinq qui n existait pas.
 *
 * Un super event regroupe plusieurs stations de jeu ; jusqu ici il n avait
 * aucune fiche, et ses informations etaient reparties sur quatre pages du menu.
 * Ce drawer les rassemble SANS RIEN RECONSTRUIRE :
 *  - les stations passent par <TableauStations>, le composant deja utilise par
 *    la page Statistiques, la fiche pro et la fiche partenaire ;
 *  - les compteurs viennent du DashboardContext deja charge (aucune requete
 *    supplementaire) ;
 *  - les ecrans lourds (resultat journalier, rapport detaille, participants)
 *    restent leurs pages : on y va par un raccourci, on ne les recopie pas.
 *
 * Deux niveaux : onglets, puis sous-onglets. Un sous-onglet sans contenu propre
 * le dit (SousOngletVide) au lieu d afficher celui d a cote.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/contexts/DashboardContext'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import { DrawerTabs, SectionHeader, StatusChip, ModuleChip } from './DashboardUI'
import { SousOnglets, SousOngletVide, sousOngletActif, type SousOnglet } from './SousOnglets'
import { TableauStations } from './TableauStations'

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

/* Onglets et sous-onglets. Aucun ne cree de fonctionnalite : chacun regroupe
   ce qui existait ailleurs, ou renvoie vers la page qui le porte deja. */
const ONGLETS: { id: string; label: string; sous: SousOnglet[] }[] = [
  { id: 'apercu', label: "Vue d'ensemble", sous: [
    { id: 'chiffres', label: 'Chiffres clés' },
    { id: 'infos', label: 'Informations' },
  ] },
  { id: 'stations', label: 'Stations de jeu', sous: [
    { id: 'toutes', label: 'Toutes' },
    { id: 'nds', label: 'Du super event' },
    { id: 'part', label: 'Chez les partenaires' },
    { id: 'kanban', label: 'Kanban' },
  ] },
  { id: 'joueurs', label: 'Joueurs', sous: [
    { id: 'acces', label: 'Où les trouver' },
  ] },
  { id: 'lots', label: 'Lots & tirages', sous: [
    { id: 'lots', label: 'Lots' },
    { id: 'acces', label: 'Stock, tirage, gagnants' },
  ] },
  { id: 'pros', label: 'Pros & partenaires', sous: [
    { id: 'tous', label: 'Tous' },
    { id: 'organisateur', label: 'Organisateur' },
    { id: 'partenaires', label: 'Partenaires' },
  ] },
  { id: 'rapports', label: 'Rapports', sous: [
    { id: 'acces', label: 'Les quatre rapports' },
  ] },
]

function Raccourci({ href, titre, desc, statique }: { href: string; titre: string; desc: string; statique?: boolean }) {
  const router = useRouter()
  return (
    <button
      className="sa-ligne"
      onClick={() => { if (statique) window.location.href = href; else router.push(href) }}
    >
      <span>
        <span className="n">{titre}</span>
        <span className="d">{desc}</span>
      </span>
      <span className="r">{statique ? '↗' : '→'}</span>
    </button>
  )
}

export default function SuperEventDrawer() {
  const { drawer, closeDrawer, setDrawerTab, events, lots, pros, openDrawer } = useDashboard()
  const [sous, setSous] = useState<Record<string, string>>({})
  const [supers, setSupers] = useState<SuperEvent[]>([])

  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  const seId = drawer.id ?? ''
  const se = supers.find(s => s.id === seId) ?? null

  /* Tout ce qui suit vient du contexte deja charge : aucune requete de plus. */
  const evs = useMemo(
    () => events.filter(e => e.super_event_id === seId)
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr')),
    [events, seId],
  )
  const idsEvs = useMemo(() => new Set(evs.map(e => e.id)), [evs])
  const lotsSe = useMemo(() => lots.filter(l => l.event_id && idsEvs.has(l.event_id)), [lots, idsEvs])
  const prosSe = useMemo(() => {
    const ids = new Set(evs.map(e => e.pro_id).filter(Boolean))
    return pros.filter(p => ids.has(p.id))
  }, [evs, pros])

  const totalParticipants = evs.reduce((s, e) => s + (e.participants ?? 0), 0)
  const totalGagnants = evs.reduce((s, e) => s + (e.gagnants ?? 0), 0)
  const totalOptin = evs.reduce((s, e) => s + (e.joueurs_optin ?? 0), 0)
  const enCours = evs.filter(e => e.status === 'live').length

  const ong = ONGLETS.find(o => o.id === drawer.tab) ?? ONGLETS[0]
  const sActif = sousOngletActif(ong.sous, sous[ong.id])
  const majSous = (id: string) => setSous(x => ({ ...x, [ong.id]: id }))

  const tabs = [
    { id: 'apercu', label: "Vue d'ensemble" },
    { id: 'stations', label: 'Stations', badge: evs.length },
    { id: 'joueurs', label: 'Joueurs', badge: totalParticipants },
    { id: 'lots', label: 'Lots & tirages', badge: lotsSe.length },
    { id: 'pros', label: 'Pros', badge: prosSe.length },
    { id: 'rapports', label: 'Rapports' },
  ]

  /* Une station "du super event" appartient a l organisateur ; les autres sont
     chez des commerces partenaires. Meme distinction que dans les rapports. */
  const organisateur = evs.length
    ? evs.map(e => e.pro_id).sort((a, b) =>
        evs.filter(x => x.pro_id === b).length - evs.filter(x => x.pro_id === a).length)[0]
    : null

  const evsFiltres = sActif === 'nds' ? evs.filter(e => e.pro_id === organisateur)
    : sActif === 'part' ? evs.filter(e => e.pro_id !== organisateur)
    : evs

  const colonnes: { cle: string; titre: string }[] = [
    { cle: 'upcoming', titre: 'À venir' },
    { cle: 'live', titre: 'En cours' },
    { cle: 'past', titre: 'Terminées' },
  ]

  return (
    <>
      <div className="sa-drawer-h">
        <div>
          <div className="sa-drawer-title">🎪 {se?.nom ?? seId}</div>
          <div className="sa-drawer-sub">
            <span>{se ? `${fmt(se.date_d)} → ${fmt(se.date_f)}` : 'Chargement…'}</span>
            <span>{evs.length} station{evs.length > 1 ? 's' : ''}</span>
            {enCours > 0 && <span className="sa-chip live">{enCours} en cours</span>}
          </div>
        </div>
        <button className="sa-drawer-close" onClick={closeDrawer}>×</button>
      </div>

      <DrawerTabs tabs={tabs} active={ong.id} onSelect={setDrawerTab} />
      <SousOnglets onglets={ong.sous} actif={sActif} onSelect={majSous} />

      <div className="sa-drawer-body">
        <div className="sa-fil-drawer">Super event › <b>{ong.label}</b> › <b>{ong.sous.find(x => x.id === sActif)?.label}</b></div>

        {ong.id === 'apercu' && sActif === 'chiffres' && (
          <>
            <div className="sa-kpi-grid" style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--sa-border)' }}>
              <div className="sa-kpi"><div className="sa-kpi-val">{evs.length}</div><div className="sa-kpi-lbl">Stations</div></div>
              <div className="sa-kpi"><div className="sa-kpi-val">{totalParticipants}</div><div className="sa-kpi-lbl">Participations</div></div>
              <div className="sa-kpi"><div className="sa-kpi-val">{totalOptin}</div><div className="sa-kpi-lbl">Opt-in</div></div>
              <div className="sa-kpi"><div className="sa-kpi-val">{totalGagnants}</div><div className="sa-kpi-lbl">Gagnants</div></div>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginTop: 12, lineHeight: 1.5 }}>
              Compteurs portés par chaque station. Les chiffres calculés côté base — flashs,
              parties dédoublonnées, chiffres publiables — sont dans l&apos;onglet Rapports.
            </p>
          </>
        )}

        {ong.id === 'apercu' && sActif === 'infos' && (
          se ? (
            <>
              <div className="sa-field-row"><div className="sa-field-label">Nom</div><div className="sa-field-value">{se.nom}</div></div>
              <div className="sa-field-row"><div className="sa-field-label">Identifiant</div><div className="sa-field-value">{se.id}</div></div>
              <div className="sa-field-row"><div className="sa-field-label">Période</div><div className="sa-field-value">{fmt(se.date_d)} → {fmt(se.date_f)}</div></div>
              <div className="sa-field-row"><div className="sa-field-label">Statut</div><div className="sa-field-value">{se.status ?? '—'}</div></div>
              <div className="sa-field-row"><div className="sa-field-label">Description</div><div className="sa-field-value">{se.description || '—'}</div></div>
            </>
          ) : <SousOngletVide libelle="Informations" raison="Super event introuvable dans la liste." />
        )}

        {ong.id === 'stations' && sActif !== 'kanban' && (
          <>
            <SectionHeader>{evsFiltres.length} station{evsFiltres.length > 1 ? 's' : ''}</SectionHeader>
            {evsFiltres.length === 0
              ? <SousOngletVide libelle="Stations" raison="Aucune station dans cette catégorie." />
              : evsFiltres.map(e => (
                <button key={e.id} className="sa-ligne" onClick={() => openDrawer('event', e.id)}>
                  <span>
                    <span className="n">{e.nom}</span>
                    <span className="d" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                      <StatusChip status={e.status} />
                      <ModuleChip module={e.module} />
                      <span>{pros.find(p => p.id === e.pro_id)?.nom ?? '—'}</span>
                    </span>
                  </span>
                  <span className="r">{e.participants ?? 0} particip.<br />{e.gagnants ?? 0} gagnants</span>
                </button>
              ))}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--sa-border)' }}>
              <SectionHeader>Tracking détaillé</SectionHeader>
              {/* Le composant deja utilise par la page Statistiques et les fiches pro. */}
              <TableauStations se={seId} tout compact titre="Flashs par station" onStation={s => openDrawer('event', s.event_id)} />
            </div>
          </>
        )}

        {ong.id === 'stations' && sActif === 'kanban' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {colonnes.map(col => {
              const l = evs.filter(e => e.status === col.cle)
              return (
                <div key={col.cle} style={{ background: 'var(--sa-subtle)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 9 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{col.titre}</span><span>{l.length}</span>
                  </div>
                  {l.length === 0 && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>—</div>}
                  {l.map(e => (
                    <button key={e.id} className="sa-ligne" style={{ marginBottom: 6, padding: '8px 9px' }} onClick={() => openDrawer('event', e.id)}>
                      <span>
                        <span className="n" style={{ fontSize: 12 }}>{e.nom}</span>
                        <span className="d" style={{ fontSize: 10.5 }}>{e.module} · {e.participants ?? 0} particip.</span>
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {ong.id === 'joueurs' && (
          <>
            <SectionHeader>{totalParticipants} participations · {totalOptin} opt-in</SectionHeader>
            <p style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              La liste nominative, la recherche, les filtres et l&apos;export vivent sur leur page —
              elle est déjà cadrée sur ce super event.
            </p>
            <Raccourci href="/dashboard/nds-participants" titre="Participants du super event" desc="Recherche, opt-in, fidèles, export CSV" />
            <Raccourci href="/dashboard/joueurs" titre="Tous les joueurs" desc="Base complète, toutes opérations" />
            <Raccourci href="/dashboard/crm-landing" titre="Contacts landing" desc="Contacts capturés par les pages publiques" />
          </>
        )}

        {ong.id === 'lots' && sActif === 'lots' && (
          <>
            <SectionHeader>{lotsSe.length} lot{lotsSe.length > 1 ? 's' : ''} sur ce super event</SectionHeader>
            {lotsSe.length === 0
              ? <SousOngletVide libelle="Lots" raison="Aucun lot rattaché aux stations de ce super event." />
              : lotsSe.map(l => (
                <div key={l.id} className="sa-list-item">
                  <span style={{ fontSize: 20 }}>{l.emoji ?? '🎁'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{l.titre || l.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>
                      {l.valeur ? `${l.valeur} €` : '—'}{l.quantite ? ` · ${l.quantite} ex.` : ''}
                    </div>
                  </div>
                  {l.retire && <span className="sa-chip live">Retiré</span>}
                </div>
              ))}
          </>
        )}

        {ong.id === 'lots' && sActif === 'acces' && (
          <>
            <Raccourci href="/dashboard/nds-lots" titre="Stock des lots" desc="Quantités configurées et restantes" />
            <Raccourci href="/dashboard/gagnants" titre="Liste des gagnants" desc="Tirages, confirmations, retraits" />
            <Raccourci href="/tirage-nds.html" titre="Tirage au sort" desc="Outil de tirage (HTML autonome)" statique />
          </>
        )}

        {ong.id === 'pros' && (() => {
          const liste = sActif === 'organisateur' ? prosSe.filter(p => p.id === organisateur)
            : sActif === 'partenaires' ? prosSe.filter(p => p.id !== organisateur)
            : prosSe
          if (!liste.length) return <SousOngletVide libelle="Pros & partenaires" raison="Aucun pro dans cette catégorie." />
          return (
            <>
              <SectionHeader>{liste.length} compte{liste.length > 1 ? 's' : ''}</SectionHeader>
              {liste.map(p => (
                <button key={p.id} className="sa-ligne" onClick={() => openDrawer('pro', p.id)}>
                  <span>
                    <span className="n">{p.nom}</span>
                    <span className="d">{evs.filter(e => e.pro_id === p.id).length} station(s) sur ce super event</span>
                  </span>
                  <span className="r">→</span>
                </button>
              ))}
              <div style={{ marginTop: 14 }}>
                <Raccourci href="/dashboard/demandes-rattachement" titre="Demandes de participation" desc="Commerces qui demandent à rejoindre une opération" />
              </div>
            </>
          )
        })()}

        {ong.id === 'rapports' && (
          <>
            <p style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              Ces quatre rapports existent et fonctionnent. Ils sont regroupés ici, ils ne
              sont pas refaits : le calcul, les bornes et les colonnes restent les leurs.
            </p>
            <Raccourci href="/dashboard/nds-resultat" titre="Résultat journalier" desc="Jour par jour, station par station" />
            <Raccourci href="/dashboard/rapport-points" titre="Rapport détaillé" desc="Par point de jeu, bonus et sondage landing" />
            <Raccourci href="/dashboard/statistiques" titre="Statistiques & résultats" desc="Vue complète, chiffres publiables, pics" />
            <Raccourci href="/dashboard/track-qr" titre="Origines du trafic" desc="D'où viennent les visiteurs" />
          </>
        )}

      </div>
    </>
  )
}
