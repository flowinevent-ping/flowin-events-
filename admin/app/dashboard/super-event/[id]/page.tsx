'use client'

/**
 * ESPACE SUPER EVENT — page unique a onglets, lot 3 de la reorganisation.
 *
 * Remplace l eparpillement actuel : 12 entrees de sidebar pour un seul objet.
 * Ici, un super event = une URL (/dashboard/super-event/<id>#<onglet>) et
 * 8 onglets.
 *
 * PRINCIPE : on ne reconstruit rien qui existe (Pattern G). Les ecrans lourds
 * — resultat journalier, rapport detaille, statistiques, origines du trafic,
 * participants, envoi en masse — restent leurs pages. Elles lisent maintenant
 * la portee globale (ScopeContext), donc y arriver depuis ici les ouvre deja
 * cadrees sur le bon super event. Cet espace fournit ce qui manquait : la vue
 * d ensemble, le regroupement, et la diffusion.
 *
 * Ouvrir cette page CALE la portee globale sur ce super event : la barre de
 * contexte, la sidebar et toutes les pages suivantes s alignent.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useDashboard } from '@/contexts/DashboardContext'
import { useScope } from '@/contexts/ScopeContext'
import { DrawerTabs, StatusChip, ModuleChip, EmptyState, SectionHeader } from '@/components/dashboard/DashboardUI'
import Diffusion, { type LienDiffusion } from '@/components/dashboard/Diffusion'

const ONGLET_DEFAUT = 'apercu'

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

/** Raccourci vers une page existante, deja cadree par la portee globale. */
function Raccourci({ href, titre, desc }: { href: string; titre: string; desc: string }) {
  return (
    <Link href={href} className="sa-racc">
      <span className="sa-racc-t">{titre}</span>
      <span className="sa-racc-d">{desc}</span>
      <span className="sa-racc-f" aria-hidden="true">→</span>
    </Link>
  )
}

export default function SuperEventPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id)
  const { events, lots, pros, partenaires } = useDashboard()
  const { superEvents, seId, setSe } = useScope()
  const [tab, setTab] = useState(ONGLET_DEFAUT)

  useEffect(() => {
    const h = window.location.hash.replace('#', '')
    if (h) setTab(h)
  }, [])

  // Arriver ici cale la portee globale : tout le reste du dashboard suit.
  useEffect(() => {
    if (id && seId !== id) setSe(id)
    // setSe est stable (useCallback), seId volontairement hors deps : on ne
    // veut recaler qu au changement de route, pas a chaque choix manuel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const changerTab = (t: string) => {
    setTab(t)
    window.history.replaceState(null, '', `${window.location.pathname}#${t}`)
  }

  const se = superEvents.find(s => s.id === id) ?? null
  const evs = useMemo(
    () => events.filter(e => e.super_event_id === id)
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr')),
    [events, id],
  )
  const idsEvs = useMemo(() => new Set(evs.map(e => e.id)), [evs])
  const lotsSe = useMemo(() => lots.filter(l => l.event_id && idsEvs.has(l.event_id)), [lots, idsEvs])

  const prosSe = useMemo(() => {
    const ids = new Set(evs.map(e => e.pro_id).filter(Boolean))
    return pros.filter(p => ids.has(p.id))
  }, [evs, pros])

  const partenairesSe = useMemo(() => {
    const ids = new Set(prosSe.map(p => p.partenaire_id).filter(Boolean) as string[])
    return partenaires.filter(p => ids.has(p.id))
  }, [prosSe, partenaires])

  const totalParticipants = evs.reduce((s, e) => s + (e.participants ?? 0), 0)
  const totalGagnants = evs.reduce((s, e) => s + (e.gagnants ?? 0), 0)
  const totalOptin = evs.reduce((s, e) => s + (e.joueurs_optin ?? 0), 0)
  const enCours = evs.filter(e => e.status === 'live').length

  const liensDiffusion: LienDiffusion[] = [
    { cle: 'Page publique', chemin: `/se/${id}`, aide: "La page que voit le public : lots, points de jeu, partenaires." },
    { cle: 'Rejoindre (commerce)', chemin: `/rejoindre/${id}`, aide: "Le formulaire par lequel un commerce demande a participer. Aucun lien de l app n y menait jusqu ici." },
    { cle: 'Sponsor', chemin: `/sponsor/${id}`, aide: "La page a destination d un sponsor. Elle aussi etait orpheline." },
  ]

  const tabs = [
    { id: 'apercu', label: "Vue d'ensemble" },
    { id: 'events', label: 'Events', badge: evs.length },
    { id: 'participants', label: 'Participants', badge: totalParticipants },
    { id: 'pros', label: 'Pros & partenaires', badge: prosSe.length },
    { id: 'lots', label: 'Lots & tirages', badge: lotsSe.length },
    { id: 'landing', label: 'Landing & diffusion' },
    { id: 'resultats', label: 'Résultats' },
    { id: 'comm', label: 'Communication' },
  ]

  return (
    <div className="sa-content">
      <div className="sa-fil">
        <Link href="/dashboard/super-events">Super events</Link>
        <span aria-hidden="true">›</span>
        <span className="courant">{se?.nom ?? id}</span>
      </div>

      <div className="sa-page sa-page-fiche">
        <div className="sa-drawer-h">
          <div>
            <div className="sa-drawer-title">🎪 {se?.nom ?? id}</div>
            <div className="sa-drawer-sub">
              {se ? `${fmt(se.date_d)} → ${fmt(se.date_f)}` : 'Super event introuvable dans la liste'}
              {enCours > 0 && <span className="sa-chip live">{enCours} en cours</span>}
            </div>
          </div>
        </div>

        <DrawerTabs tabs={tabs} active={tab} onSelect={changerTab} />

        <div className="sa-drawer-body">
          {tab === 'apercu' && (
            <>
              <div className="sa-kpi-grid" style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--sa-border)' }}>
                <div className="sa-kpi"><div className="sa-kpi-val">{evs.length}</div><div className="sa-kpi-lbl">Points de jeu</div></div>
                <div className="sa-kpi"><div className="sa-kpi-val">{totalParticipants}</div><div className="sa-kpi-lbl">Participations</div></div>
                <div className="sa-kpi"><div className="sa-kpi-val">{totalOptin}</div><div className="sa-kpi-lbl">Opt-in</div></div>
                <div className="sa-kpi"><div className="sa-kpi-val">{totalGagnants}</div><div className="sa-kpi-lbl">Gagnants</div></div>
              </div>
              <p className="sa-diff-aide" style={{ marginTop: 14 }}>
                Ces chiffres viennent des compteurs portés par chaque event. Les
                rapports détaillés, calculés côté base, sont dans l&apos;onglet Résultats.
              </p>
              <SectionHeader>Aller plus loin</SectionHeader>
              <div className="sa-racc-grid">
                <Raccourci href="/dashboard/operations" titre="Toutes les opérations" desc="Comparer ce super event aux autres" />
                <Raccourci href="/dashboard/statistiques" titre="Statistiques & résultats" desc="Rapport complet, cadré sur ce super event" />
              </div>
            </>
          )}

          {tab === 'events' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
                <SectionHeader>{evs.length} point{evs.length > 1 ? 's' : ''} de jeu</SectionHeader>
                <Link href={`/dashboard/wizard-event?se=${encodeURIComponent(id)}`} className="sa-btn primary sm">
                  ✨ Ajouter un point de jeu
                </Link>
              </div>
              {evs.length === 0 && (
                <EmptyState
                  title="Aucun event rattaché"
                  desc="Crée un event puis rattache-le, ou utilise le bouton ci-dessus."
                />
              )}
              <div className="sa-racc-grid">
                {evs.map(e => (
                  <Link key={e.id} href={`/dashboard/event/${e.id}`} className="sa-racc">
                    <span className="sa-racc-t">{e.nom}</span>
                    <span className="sa-racc-d" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusChip status={e.status} />
                      <ModuleChip module={e.module} />
                      {e.participants ? <span>{e.participants} participations</span> : null}
                    </span>
                    <span className="sa-racc-f" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {tab === 'participants' && (
            <>
              <SectionHeader>{totalParticipants} participations cumulées</SectionHeader>
              <p className="sa-diff-aide">
                La liste nominative, filtrable et exportable, vit sur sa page dédiée —
                elle est déjà cadrée sur ce super event.
              </p>
              <div className="sa-racc-grid" style={{ marginTop: 12 }}>
                <Raccourci href="/dashboard/nds-participants" titre="Liste des participants" desc="Recherche, opt-in, fidèles, export CSV" />
                <Raccourci href="/dashboard/joueurs" titre="Tous les joueurs" desc="Base complète, toutes opérations confondues" />
                <Raccourci href="/dashboard/crm-landing" titre="Contacts landing" desc="Contacts capturés par les pages publiques" />
              </div>
            </>
          )}

          {tab === 'pros' && (
            <>
              <SectionHeader>{prosSe.length} pro{prosSe.length > 1 ? 's' : ''} · {partenairesSe.length} commerce{partenairesSe.length > 1 ? 's' : ''}</SectionHeader>
              {prosSe.length === 0 && <EmptyState title="Aucun pro rattaché" desc="Les pros arrivent par les events de ce super event." />}
              <div className="sa-racc-grid">
                {prosSe.map(p => (
                  <Link key={p.id} href={`/dashboard/pros`} className="sa-racc">
                    <span className="sa-racc-t">{p.nom}</span>
                    <span className="sa-racc-d">
                      {evs.filter(e => e.pro_id === p.id).length} point(s) de jeu
                    </span>
                    <span className="sa-racc-f" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
              <div className="sa-racc-grid" style={{ marginTop: 14 }}>
                <Raccourci href="/dashboard/demandes-rattachement" titre="Demandes de participation" desc="Commerces qui demandent à rejoindre une opération" />
              </div>
            </>
          )}

          {tab === 'lots' && (
            <>
              <SectionHeader>{lotsSe.length} lot{lotsSe.length > 1 ? 's' : ''} sur ce super event</SectionHeader>
              {lotsSe.length === 0 && <EmptyState title="Aucun lot" desc="Les lots sont rattachés aux events de ce super event." />}
              {lotsSe.map(l => (
                <div key={l.id} className="sa-list-item">
                  <span style={{ fontSize: 20 }}>{l.emoji ?? '🎁'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{l.titre || l.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>
                      {l.valeur ? `${l.valeur} €` : '—'}
                      {l.quantite ? ` · ${l.quantite} ex.` : ''}
                    </div>
                  </div>
                  {l.retire && <span className="sa-chip live">Retiré</span>}
                </div>
              ))}
              <div className="sa-racc-grid" style={{ marginTop: 14 }}>
                <Raccourci href="/dashboard/nds-lots" titre="Stock des lots" desc="Quantités configurées et restantes" />
                <Raccourci href="/dashboard/gagnants" titre="Liste des gagnants" desc="Tirages, confirmations, retraits" />
                <Raccourci href="/tirage-nds.html" titre="Tirage au sort" desc="Outil de tirage (à scoper — chantier ouvert)" />
              </div>
            </>
          )}

          {tab === 'landing' && (
            <Diffusion
              liens={liensDiffusion}
              nomFichier={se?.nom ?? id}
              titreAffiche={se?.nom ?? id}
              sousTitreAffiche={se ? `${fmt(se.date_d)} → ${fmt(se.date_f)}` : undefined}
            />
          )}

          {tab === 'resultats' && (
            <>
              <p className="sa-diff-aide">
                Ces quatre écrans étaient quatre entrées de menu avec chacune son propre
                sélecteur. Ils lisent maintenant la portée globale : ils s&apos;ouvrent
                déjà cadrés sur <strong>{se?.nom ?? id}</strong>.
              </p>
              <div className="sa-racc-grid" style={{ marginTop: 12 }}>
                <Raccourci href="/dashboard/nds-resultat" titre="Résultat journalier" desc="Jour par jour, station par station" />
                <Raccourci href="/dashboard/rapport-points" titre="Rapport détaillé" desc="Par point de jeu, bonus et sondage landing" />
                <Raccourci href="/dashboard/statistiques" titre="Statistiques & résultats" desc="Vue complète, pics d'activité" />
                <Raccourci href="/dashboard/track-qr" titre="Origines du trafic" desc="D'où viennent les visiteurs" />
              </div>
            </>
          )}

          {tab === 'comm' && (
            <div className="sa-racc-grid">
              <Raccourci href="/dashboard/nds-comm" titre="Billets & kit com partenaire" desc="Billets nominatifs, logos, visuels" />
              <Raccourci href="/dashboard/envoi-masse" titre="Envoi en masse" desc="Liens Gmail par lots de 40 en BCC" />
              <Raccourci href="/dashboard/nds-media" titre="Vidéo & média" desc="Spot, visuels réseaux, QR HD" />
              <Raccourci href="/dashboard/nds-carte" titre="Carte NDS" desc="Carte des points de jeu" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
