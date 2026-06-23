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
        { id: 'btob', icon: '🎯', label: 'Prospects B2B', count: 0, href: '/dashboard/btob' },
        { id: 'landing', icon: '🌐', label: 'Landing Page', count: 1, href: '/dashboard.html#landing', external: true },
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
