'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useDashboard } from '@/contexts/DashboardContext'

interface NavItem {
  id: string
  icon: string
  label: string
  count?: number
  href: string
  live?: number
  external?: boolean
}

interface NavGroup {
  group: string
  items: NavItem[]
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { joueurs, events, partenaires, pros } = useDashboard()

  const liveCount = events.filter(e => e.status === 'live').length

  const groups: NavGroup[] = [
    {
      group: 'ESPACE PRO',
      items: [
        { id: 'pro', icon: '🟣', label: 'Dashboard Pro', href: '/dashboard/pro' },
      ],
    },
    {
      group: 'CRM',
      items: [
        { id: 'accueil', icon: '🏠', label: 'Accueil', href: '/dashboard' },
        { id: 'pros', icon: '🏢', label: 'Pros', count: pros.length, href: '/dashboard/pros' },
        { id: 'joueurs', icon: '👥', label: 'Joueurs', count: joueurs.length, href: '/dashboard/joueurs' },
        { id: 'gagnants', icon: '🏆', label: 'Gagnants', href: '/dashboard/gagnants' },
        { id: 'partenaires', icon: '🤝', label: 'Partenaires', count: partenaires.length, href: '/dashboard/partenaires' },
      ],
    },
    {
      group: 'EVENTS',
      items: [
        { id: 'events', icon: '📅', label: 'Events', count: events.length, live: liveCount, href: '/dashboard/events' },
        { id: 'super-events', icon: '⭐', label: 'Super Events', count: 0, href: '/dashboard/super-events' },
      ],
    },
    {
      group: 'ACQUISITION B2B',
      items: [
        /* Pas encore portee en Next : on renvoie au monolithe plutot que de servir un 404. */
        { id: 'btob', icon: '🎯', label: 'Prospects B2B', count: 0, href: '/dashboard.html#btob-prospects', external: true },
        { id: 'landing', icon: '🌐', label: 'Landing Page', count: 1, href: '/dashboard.html#landing', external: true },
      ],
    },
    {
      group: 'PILOTAGE',
      items: [
        { id: 'pilotage', icon: '🎯', label: 'Pilotage', href: '/dashboard/pilotage' },
      ],
    },
    {
      group: 'ANALYSE',
      items: [
        { id: 'statistiques', icon: '📊', label: 'Statistiques & résultats', href: '/dashboard/statistiques' },
        { id: 'rapport-points', icon: '📍', label: 'Rapport détaillé', href: '/dashboard/rapport-points' },
        { id: 'track-qr', icon: '🔗', label: 'Origines du trafic', href: '/dashboard/track-qr' },
      ],
    },
    {
      group: 'NDS 2026',
      items: [
        { id: 'nds-lots', icon: '🎁', label: 'Stock des lots', href: '/dashboard/nds-lots' },
        { id: 'nds-resultat', icon: '📅', label: 'Résultat journalier', href: '/dashboard/nds-resultat' },
        { id: 'nds-participants', icon: '👥', label: 'Participants', href: '/dashboard/nds-participants' },
        { id: 'nds-carte', icon: '🗺️', label: 'Carte NDS', href: '/dashboard/nds-carte' },
        { id: 'nds-front', icon: '🎨', label: 'Front NDS', href: '/dashboard/nds-front' },
        { id: 'nds-comm', icon: '📣', label: 'Kit com partenaire', href: '/dashboard/nds-comm' },
        { id: 'nds-media', icon: '🎬', label: 'Vidéo & média', href: '/dashboard/nds-media' },
      ],
    },
    {
      group: 'COMMERCE',
      items: [
        { id: 'prospection', icon: '📞', label: 'Prospection', href: '/dashboard/prospection' },
        { id: 'btob-prospects', icon: '🎯', label: 'Prospects B2B', href: '/dashboard/btob-prospects' },
        { id: 'nds-bon-commande', icon: '🧾', label: 'Bons de commande', href: '/dashboard/nds-bon-commande' },
        { id: 'crm-landing', icon: '📥', label: 'CRM Landing pages', href: '/dashboard/crm-landing' },
        { id: 'crm-retours', icon: '📋', label: 'Retours CRM', href: '/dashboard/crm-retours' },
        { id: 'landing-page', icon: '🌐', label: 'Landing pages', href: '/dashboard/landing-page' },
        { id: 'cgv', icon: '📄', label: 'CGV & légal', href: '/dashboard/cgv' },
      ],
    },
    {
      group: 'JEUX',
      items: [
        { id: 'jeux', icon: '🎮', label: 'Jeux', count: 6, href: '/dashboard/jeux' },
      ],
    },
    {
      group: 'REPORTING',
      items: [
        { id: 'rapports', icon: '📊', label: 'Rapports', href: '/dashboard/rapports' },
      ],
    },
    {
      group: 'SYSTÈME',
      items: [
        { id: 'wizard-event', icon: '✨', label: 'Nouvel événement', href: '/dashboard/wizard-event' },
        { id: 'roadmap', icon: '🗺️', label: 'Feuille de route', href: '/dashboard/roadmap' },
        { id: 'parametres', icon: '⚙️', label: 'Paramètres', href: '/dashboard/parametres' },
        { id: 'maintenance', icon: '🛠️', label: 'Maintenance', href: '/dashboard/maintenance' },
      ],
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="sa-sb">
      {/* Logo */}
      <div className="sa-sb-logo">
        <div className="sa-sb-logo-dot" />
        <span>Flow<em>in</em></span>
      </div>

      {/* Navigation */}
      <div className="sa-sb-main">
        {groups.map(g => (
          <div key={g.group}>
            <div className="sa-sb-group">{g.group}</div>
            {g.items.map(item => (
              <button
                key={item.id}
                className={`sa-sb-item${isActive(item.href) ? ' active' : ''}`}
                onClick={() => { if (item.external) { window.location.href = item.href } else { router.push(item.href) } }}
              >
                <span className="sa-sb-icon">{item.icon}</span>
                <span className="sa-sb-label">{item.label}</span>
                {item.live ? (
                  <span className="sa-sb-badge live">{item.live} live</span>
                ) : item.count !== undefined && item.count > 0 ? (
                  <span className="sa-sb-badge">{item.count}</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* User */}
      <div className="sa-sb-user">
        <div className="sa-sb-avatar">R</div>
        <div>
          <div className="sa-sb-username">Romain</div>
          <div className="sa-sb-userrole">Super Admin</div>
        </div>
      </div>
    </div>
  )
}
