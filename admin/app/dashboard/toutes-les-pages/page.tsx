'use client'

/**
 * TOUTES LES PAGES — filet de securite de la reorganisation.
 *
 * La sidebar se reduit au fil des lots : des entrees descendent en sous-onglets
 * des espaces Event et Super Event. Aucune route n est jamais supprimee pour
 * autant. Cette page liste TOUT ce qui existe, avec sa destination, pour qu on
 * ne perde jamais l acces a un ecran parce qu il a quitte le menu.
 *
 * Regle de maintenance : toute route ajoutee au dashboard s ajoute ici.
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'

type Pole = 'Super events' | 'Events' | 'Général' | 'Outils & documents' | 'Système' | 'Accueil'

interface Entree {
  label: string
  href: string
  /** Fichier statique hors routeur Next : navigation dure obligatoire. */
  statique?: boolean
  pole: Pole
  /** Ou l ecran vit une fois la reorganisation terminee. */
  destination: string
  /** Mots-cles supplementaires pour la recherche (anciens libelles). */
  alias?: string
}

const TON: Record<Pole, string> = {
  'Super events': '#A855F7',
  'Events': '#10B981',
  'Général': '#3B82F6',
  'Outils & documents': '#F59E0B',
  'Système': '#64748B',
  'Accueil': '#64748B',
}

const ENTREES: Entree[] = [
  { pole: 'Accueil', label: 'Vue d\'ensemble', href: '/dashboard', destination: 'Accueil', alias: 'accueil dashboard' },

  { pole: 'Super events', label: 'Mes super events', href: '/dashboard/super-events', destination: 'Super events' },
  { pole: 'Super events', label: 'Opérations (vue complète)', href: '/dashboard/operations', destination: 'Onglet « Vue d\'ensemble »' },
  { pole: 'Super events', label: 'Participants (super event)', href: '/dashboard/nds-participants', destination: 'Onglet « Participants »' },
  { pole: 'Super events', label: 'Stock des lots', href: '/dashboard/nds-lots', destination: 'Onglet « Lots & tirages »' },
  { pole: 'Super events', label: 'Tirage au sort', href: '/tirage-nds.html', statique: true, destination: 'Onglet « Lots & tirages »' },
  { pole: 'Super events', label: 'Liste des gagnants', href: '/dashboard/gagnants', destination: 'Onglet « Lots & tirages »' },
  { pole: 'Super events', label: 'Résultat journalier', href: '/dashboard/nds-resultat', destination: 'Onglet « Résultats »' },
  { pole: 'Super events', label: 'Rapport détaillé', href: '/dashboard/rapport-points', destination: 'Onglet « Résultats »', alias: 'rapport points' },
  { pole: 'Super events', label: 'Statistiques & résultats', href: '/dashboard/statistiques', destination: 'Onglet « Résultats »' },
  { pole: 'Super events', label: 'Origines du trafic', href: '/dashboard/track-qr', destination: 'Onglet « Résultats »', alias: 'track qr tracking' },
  { pole: 'Super events', label: 'Carte NDS', href: '/dashboard/nds-carte', destination: 'Onglet « Landing & diffusion »' },
  { pole: 'Super events', label: 'Front NDS', href: '/dashboard/nds-front', destination: 'Onglet « Landing & diffusion »' },

  { pole: 'Events', label: 'Kanban des events', href: '/dashboard/events', destination: 'Events', alias: 'liste des events parcours mobil' },
  { pole: 'Events', label: 'Nouvel event', href: '/dashboard/wizard-event', destination: 'Events', alias: 'wizard creation nouvel evenement' },
  { pole: 'Events', label: 'Bibliothèque de jeux', href: '/dashboard/jeux', destination: 'Events', alias: 'jeux templates modules' },

  { pole: 'Général', label: 'Stats globales', href: '/dashboard/rapports', destination: 'Hub Stats globales', alias: 'rapports' },
  { pole: 'Général', label: 'Pilotage', href: '/dashboard/pilotage', destination: 'Hub Stats globales' },
  { pole: 'Général', label: 'Pros', href: '/dashboard/pros', destination: 'Hub CRM pros & commerces' },
  { pole: 'Général', label: 'Commerces partenaires', href: '/dashboard/partenaires', destination: 'Hub CRM pros & commerces', alias: 'partenaires fiche commerce' },
  { pole: 'Général', label: 'Aperçu Pro', href: '/dashboard/apercu-pro', destination: 'Hub CRM pros & commerces' },
  { pole: 'Général', label: 'Demandes de participation', href: '/dashboard/demandes-rattachement', destination: 'Hub CRM pros & commerces', alias: 'rattachement' },
  { pole: 'Général', label: 'Joueurs', href: '/dashboard/joueurs', destination: 'Hub CRM participants' },
  { pole: 'Général', label: 'Contacts landing (CRM)', href: '/dashboard/crm-landing', destination: 'Hub CRM participants', alias: 'crm landing pages' },
  { pole: 'Général', label: 'Retours CRM', href: '/dashboard/crm-retours', destination: 'Hub CRM participants' },
  { pole: 'Général', label: 'Prospection terrain', href: '/dashboard/prospection', destination: 'Hub Prospection & B2B' },
  { pole: 'Général', label: 'Prospects B2B (suivi)', href: '/dashboard/btob-prospects', destination: 'Hub Prospection & B2B', alias: 'btob' },
  { pole: 'Général', label: 'Billets & kit com partenaire', href: '/dashboard/nds-comm', destination: 'Hub Communication' },
  { pole: 'Général', label: 'Envoi en masse', href: '/dashboard/envoi-masse', destination: 'Hub Communication', alias: 'emailing gmail' },
  { pole: 'Général', label: 'Vidéo & média', href: '/dashboard/nds-media', destination: 'Hub Communication' },
  { pole: 'Général', label: 'Visuels & vidéos (A4/réseaux/spot)', href: '/nds-visuels.html', statique: true, destination: 'Hub Communication' },
  { pole: 'Général', label: 'Créer un bon de commande', href: '/dashboard/nds-bon-commande', destination: 'Hub Facturation & admin' },
  { pole: 'Général', label: 'Bons & factures (liste)', href: '/bons-commande-liste.html', statique: true, destination: 'Hub Facturation & admin' },
  { pole: 'Général', label: 'Générer une facture', href: '/facture-nds.html', statique: true, destination: 'Hub Facturation & admin' },
  { pole: 'Général', label: 'Packs de participation', href: '/dashboard/nds-packs', destination: 'Hub Facturation & admin' },
  { pole: 'Général', label: 'CGV & légal', href: '/dashboard/cgv', destination: 'Hub Facturation & admin' },

  { pole: 'Outils & documents', label: 'Landing pages (aperçus)', href: '/dashboard/landing-page', destination: 'Outils & documents' },
  { pole: 'Outils & documents', label: 'Plaquette commerciale', href: '/plaquette-nds.html', statique: true, destination: 'Plaquettes & pitchs' },
  { pole: 'Outils & documents', label: 'Plaquette offres & tarifs', href: '/nds', destination: 'Plaquettes & pitchs', alias: 'packs partenaires' },
  { pole: 'Outils & documents', label: 'Argumentaire téléphonique', href: '/pitch-nds.html', statique: true, destination: 'Plaquettes & pitchs' },
  { pole: 'Outils & documents', label: 'Présentation partenaire', href: '/flowin-partenaire-presentation.html', statique: true, destination: 'Plaquettes & pitchs' },
  { pole: 'Outils & documents', label: 'Dossiers partenaires (A3/A4/vidéo/QR)', href: '/nds/kit-digital/index.html', statique: true, destination: 'Kits partenaires' },

  { pole: 'Système', label: 'Feuille de route', href: '/dashboard/roadmap', destination: 'Système' },
  { pole: 'Système', label: 'Paramètres', href: '/dashboard/parametres', destination: 'Système' },
  { pole: 'Système', label: 'Maintenance', href: '/dashboard/maintenance', destination: 'Système' },
]

/** Ecrans crees par la reorganisation. */
const NOUVEAUX: Entree[] = [
  { pole: 'Super events', label: "Espace Super Event (8 onglets)", href: '/dashboard/super-events', destination: 'Ouvre un super event depuis la liste', alias: 'onglets sous-onglets espace' },
  { pole: 'Events', label: "Espace Event (7 onglets, page pleine)", href: '/dashboard/events', destination: 'Ouvre un event depuis le kanban', alias: 'onglets sous-onglets fiche' },
  { pole: 'Général', label: 'Hub CRM pros & commerces', href: '/dashboard/crm-pros', destination: 'Pros · Commerces · Demandes · Aperçu pro' },
  { pole: 'Général', label: 'Hub CRM participants', href: '/dashboard/crm-participants', destination: 'Joueurs · Participants · Contacts landing · Retours' },
  { pole: 'Général', label: 'Hub Communication', href: '/dashboard/communication', destination: 'Billets · Envoi en masse · Médias' },
  { pole: 'Général', label: 'Hub Facturation & admin', href: '/dashboard/facturation', destination: 'Bon de commande · Packs · CGV' },
  { pole: 'Général', label: 'Hub Prospection & B2B', href: '/dashboard/prospection-b2b', destination: 'Terrain · Prospects B2B' },
  { pole: 'Général', label: 'Hub Stats globales', href: '/dashboard/stats-globales', destination: 'Rapports · Pilotage' },
]

/** Ecrans qui ne sont dans aucun menu mais restent joignables. */
const HORS_MENU: Entree[] = [
  { pole: 'Events', label: 'Parcours (aperçu mobile)', href: '/dashboard/parcours', destination: 'Aperçu du parcours joueur' },
  { pole: 'Super events', label: 'Détail d\'une opération', href: '/dashboard/operations', destination: 'Ouvre une opération puis son détail' },
  { pole: 'Outils & documents', label: 'Espace pro (vue publique)', href: '/pro', destination: 'Ce que voit un pro connecté' },
  { pole: 'Outils & documents', label: 'Landing marketing Flowin', href: '/landing', destination: 'Page publique' },
]

export default function ToutesLesPagesPage() {
  const router = useRouter()
  const [q, setQ] = useState('')

  const filtrees = useMemo(() => {
    const toutes = [...ENTREES, ...NOUVEAUX, ...HORS_MENU]
    const t = q.trim().toLowerCase()
    if (!t) return toutes
    return toutes.filter(e =>
      `${e.label} ${e.href} ${e.destination} ${e.alias ?? ''} ${e.pole}`.toLowerCase().includes(t),
    )
  }, [q])

  const parPole = useMemo(() => {
    const ordre: Pole[] = ['Accueil', 'Super events', 'Events', 'Général', 'Outils & documents', 'Système']
    return ordre
      .map(p => ({ pole: p, items: filtrees.filter(e => e.pole === p) }))
      .filter(g => g.items.length > 0)
  }, [filtrees])

  const ouvrir = (e: Entree) => {
    if (e.statique) window.location.href = e.href
    else router.push(e.href)
  }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🧭 Toutes les pages"
          subtitle={`${ENTREES.length + NOUVEAUX.length + HORS_MENU.length} écrans — tout ce qui existe, même ce qui n'est plus dans le menu`}
        />
        <div className="sa-filter-bar">
          <div className="sa-filter-search" style={{ flex: 1 }}>
            <SearchBar value={q} onChange={setQ} placeholder="Chercher un écran (ancien nom accepté)…" />
          </div>
        </div>

        <div style={{ padding: '4px 24px 24px' }}>
          <p style={{ fontSize: 12.5, color: 'var(--sa-muted)', margin: '12px 0 18px', maxWidth: '72ch' }}>
            La réorganisation déplace des écrans vers des sous-onglets, mais ne supprime
            jamais une route : chaque lien ci-dessous fonctionne, aujourd&apos;hui comme après.
            La colonne « destination » indique où l&apos;écran se trouve dans la nouvelle organisation.
          </p>

          {parPole.length === 0 && (
            <EmptyState title="Aucun écran trouvé" desc="Essaie un autre mot — les anciens libellés sont reconnus." />
          )}

          {parPole.map(g => (
            <div key={g.pole} style={{ marginBottom: 26 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                fontSize: 11.5, fontWeight: 800, letterSpacing: '.09em',
                textTransform: 'uppercase', color: TON[g.pole],
              }}>
                <span style={{ width: 5, height: 14, borderRadius: 3, background: 'currentColor' }} />
                {g.pole}
                <span style={{ color: 'var(--sa-muted)', fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>
                  · {g.items.length}
                </span>
              </div>

              <div style={{ border: '1px solid var(--sa-border)', borderRadius: 10, overflow: 'hidden' }}>
                {g.items.map((e, i) => (
                  <button
                    key={e.href + e.label}
                    onClick={() => ouvrir(e)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(180px,1.4fr) minmax(140px,1fr) minmax(150px,1fr)',
                      gap: 14, alignItems: 'center', width: '100%', textAlign: 'left',
                      padding: '10px 14px', background: i % 2 ? 'var(--sa-subtle)' : 'var(--sa-card)',
                      border: 0, borderTop: i ? '1px solid var(--sa-border)' : 0,
                      cursor: 'pointer', font: 'inherit', color: 'var(--sa-text)',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>
                      {e.label}
                      {e.statique && (
                        <span style={{
                          marginLeft: 7, fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em',
                          textTransform: 'uppercase', padding: '1px 6px', borderRadius: 99,
                          background: 'var(--sa-subtle)', color: 'var(--sa-muted)',
                          border: '1px solid var(--sa-border)',
                        }}>outil html</span>
                      )}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--sa-muted)', fontFamily: 'ui-monospace, monospace' }}>
                      {e.href}
                    </span>
                    <span style={{ fontSize: 12.5, color: 'var(--sa-muted)' }}>
                      → {e.destination}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
