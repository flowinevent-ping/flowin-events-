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

/* Refonte visuelle : icones SVG trait (meme registre que l'espace Pro), repli emoji si non mappe. */
const ICON_PATHS: Record<string, string> = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M6 4h12v5a6 6 0 0 1-12 0z"/><path d="M8 21h8M12 15v6"/>',
  handshake: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  star: '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 14v4M12 10v8M17 6v12"/>',
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 1 1 3 3z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-1 1.5-2 0-1.5 1-2 2-2H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16.5" cy="10.5" r="1"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l9 5V6L6 11H4a1 1 0 0 0-1 1z"/><path d="M18 8a4 4 0 0 1 0 8"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 5h14l3 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
  clipboard: '<rect x="8" y="3" width="8" height="4" rx="1"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>',
  gamepad: '<rect x="2" y="6" width="20" height="12" rx="4"/><path d="M7 12h4M9 10v4"/><circle cx="16" cy="11" r="1"/><circle cx="18" cy="14" r="1"/>',
  sparkles: '<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4z"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="8" cy="16" r="1"/>',
}
const ICON_BY_ID: Record<string, string> = {
  accueil: 'home', pros: 'building', joueurs: 'users', gagnants: 'trophy', partenaires: 'handshake',
  events: 'calendar', 'super-events': 'star', parcours: 'phone', btob: 'target', 'btob-prospects': 'target', landing: 'globe',
  'landing-page': 'globe', pilotage: 'target', statistiques: 'chart', rapports: 'chart', 'rapport-points': 'pin',
  'track-qr': 'link', 'nds-lots': 'gift', 'nds-resultat': 'calendar', 'nds-participants': 'users', 'nds-carte': 'map',
  'nds-front': 'palette', 'nds-comm': 'megaphone', 'nds-media': 'film', prospection: 'phone', 'nds-bon-commande': 'receipt', 'nds-packs': 'gift',
  'crm-landing': 'inbox', 'crm-retours': 'clipboard', cgv: 'receipt', jeux: 'gamepad', 'wizard-event': 'sparkles',
  roadmap: 'map', parametres: 'settings', maintenance: 'wrench', pro: 'layout', 'pro-comptes': 'link', 'pro-gagnants': 'dice', 'pro-crm': 'users', 'pro-tracking': 'target', 'pro-super': 'star', 'pro-events': 'calendar', 'pro-lots': 'gift',
}
function SbIcon({ id, fallback }: { id: string; fallback: string }) {
  const p = ICON_PATHS[ICON_BY_ID[id]]
  if (!p) return <>{fallback}</>
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: p }} />
}

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { joueurs, events, partenaires, pros } = useDashboard()

  const liveCount = events.filter(e => e.status === 'live').length

  const groups: NavGroup[] = [
    {
      group: 'ACCUEIL',
      items: [
        { id: 'accueil', icon: '🏠', label: 'Accueil', href: '/dashboard' },
      ],
    },
    {
      group: 'JEUX',
      items: [
        { id: 'jeux', icon: '🎮', label: 'Jeux (templates)', count: 6, href: '/dashboard/jeux' },
      ],
    },
    {
      group: 'EVENTS',
      items: [
        { id: 'events', icon: '📅', label: 'Events (liste triée)', count: events.length, live: liveCount, href: '/dashboard/events' },
        { id: 'super-events', icon: '⭐', label: 'Super Events', count: 0, href: '/dashboard/super-events' },
        { id: 'parcours', icon: '📱', label: 'Parcours mobil', href: '/dashboard/parcours' },
      ],
    },
    {
      group: 'CRM',
      items: [
        { id: 'apercu-pro', icon: '👁', label: 'Aperçu Pro', href: '/dashboard/apercu-pro' },
        { id: 'pros', icon: '🏢', label: 'Pros', count: pros.length, href: '/dashboard/pros' },
        { id: 'demandes-rattachement', icon: '🤝', label: 'Demandes de participation', href: '/dashboard/demandes-rattachement' },
        { id: 'joueurs', icon: '👥', label: 'Joueurs', count: joueurs.length, href: '/dashboard/joueurs' },
        { id: 'partenaires', icon: '🤝', label: 'Partenaires (fiche commerce)', count: partenaires.length, href: '/dashboard/partenaires' },
      ],
    },
    {
      group: 'TIRAGE & GAGNANTS',
      items: [
        { id: 'tirage-nds', icon: '🎰', label: 'Tirage au sort', href: '/tirage-nds.html' },
        { id: 'gagnants', icon: '🏆', label: 'Liste des gagnants', href: '/dashboard/gagnants' },
        { id: 'nds-comm', icon: '📣', label: 'Billets & kit com partenaire', href: '/dashboard/nds-comm' },
        { id: 'nds-lots', icon: '🎁', label: 'Stock des lots', href: '/dashboard/nds-lots' },
      ],
    },
    {
      group: 'STATISTIQUES',
      items: [
        { id: 'statistiques', icon: '📊', label: 'Statistiques & résultats', href: '/dashboard/statistiques' },
        { id: 'nds-resultat', icon: '📅', label: 'Résultat journalier', href: '/dashboard/nds-resultat' },
        { id: 'rapport-points', icon: '📍', label: 'Rapport détaillé', href: '/dashboard/rapport-points' },
        { id: 'track-qr', icon: '🔗', label: 'Origines du trafic', href: '/dashboard/track-qr' },
        { id: 'nds-participants', icon: '👥', label: 'Participants (super event)', href: '/dashboard/nds-participants' },
      ],
    },
    {
      group: 'COMMERCIAL',
      items: [
        { id: 'nds-bon-commande', icon: '🧾', label: 'Bons de commande', href: '/dashboard/nds-bon-commande' },
        { id: 'nds-packs', icon: '🎟️', label: 'Packs de participation', href: '/dashboard/nds-packs' },
        { id: 'cgv', icon: '📄', label: 'CGV & légal', href: '/dashboard/cgv' },
      ],
    },
    {
      group: 'LANDING & PROSPECTION',
      items: [
        { id: 'landing-page', icon: '🌐', label: 'Landing pages', href: '/dashboard/landing-page' },
        { id: 'plaquette-nds', icon: '📖', label: 'Plaquette commerciale', href: '/plaquette-nds.html' },
        { id: 'prospection', icon: '📞', label: 'Prospection', href: '/dashboard/prospection' },
        { id: 'btob-prospects', icon: '🎯', label: 'Prospects B2B', href: '/dashboard/btob-prospects' },
        { id: 'crm-landing', icon: '📥', label: 'CRM Landing pages', href: '/dashboard/crm-landing' },
        { id: 'crm-retours', icon: '📋', label: 'Retours CRM', href: '/dashboard/crm-retours' },
      ],
    },
    {
      group: 'NDS 2026 — ASSETS',
      items: [
        { id: 'nds-carte', icon: '🗺️', label: 'Carte NDS', href: '/dashboard/nds-carte' },
        { id: 'nds-front', icon: '🎨', label: 'Front NDS', href: '/dashboard/nds-front' },
        { id: 'nds-media', icon: '🎬', label: 'Vidéo & média', href: '/dashboard/nds-media' },
      ],
    },
    {
      group: 'SYSTÈME',
      items: [
        { id: 'pilotage', icon: '🎯', label: 'Pilotage', href: '/dashboard/pilotage' },
        { id: 'rapports', icon: '📊', label: 'Rapports', href: '/dashboard/rapports' },
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
                <span className="sa-sb-icon"><SbIcon id={item.id} fallback={item.icon} /></span>
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
