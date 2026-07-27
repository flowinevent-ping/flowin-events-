import Link from 'next/link'

/**
 * Coquille brandee de l'espace Pro (identite Flowin Pro de la maquette validee).
 * Sidebar sombre, accent violet, en-tete pro. Utilisee par les ecrans /pro/*.
 * Les items non encore portes sont affiches en "bientot" (pas de 404).
 */
interface NavItem { key: string; label: string; icon: string; route?: string; group: string }
const NAV: NavItem[] = [
  { key: 'accueil', label: 'Accueil', icon: 'home', route: '/pro', group: 'TABLEAU DE BORD' },
  { key: 'entreprise', label: 'Mon entreprise', icon: 'shop', group: 'MON COMPTE' },
  { key: 'jeu', label: 'Choisir un jeu', icon: 'game', group: 'MES CAMPAGNES' },
  { key: 'events', label: 'Mes events', icon: 'calendar', group: 'MES CAMPAGNES' },
  { key: 'lots', label: 'Lots & distribution', icon: 'gift', group: 'MES CAMPAGNES' },
  { key: 'crm', label: 'Mon CRM', icon: 'users', group: 'MES DONNÉES' },
  { key: 'gagnants', label: 'Gagnants & tirage', icon: 'dice', route: '/pro/tirage', group: 'MES DONNÉES' },
  { key: 'tracking', label: 'Tracking liens & QR', icon: 'target', group: 'MES DONNÉES' },
  { key: 'super', label: 'Super Event', icon: 'star', group: 'ALLER PLUS LOIN' },
]
const ICONS: Record<string, string> = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  shop: '<path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M4 9h16"/>',
  game: '<rect x="2" y="6" width="20" height="12" rx="4"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="16" r="1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  star: '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/>',
}
const ACCENT = '#A855F7', ACCENT_D = '#7C2D92', SB = '#1E293B', SB2 = '#172033'

function Icon({ k }: { k: string }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[k] ?? '' }} />
}

export default function ProShell({ proName, proId, active, children }: { proName: string; proId: string; active: string; children: React.ReactNode }) {
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const groups = Array.from(new Set(NAV.map(n => n.group)))
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: '#F1F5F9', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif', color: '#0F172A' }}>
      <aside style={{ width: 248, flexShrink: 0, background: `linear-gradient(180deg,${SB},${SB2})`, color: 'rgba(255,255,255,.78)', padding: '20px 14px', position: 'sticky', top: 0, height: '100dvh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-.5px', padding: '0 8px 16px' }}>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: ACCENT, marginRight: 8, verticalAlign: 'middle' }} />
          Flow<span style={{ color: ACCENT }}>in</span> Pro
        </div>
        <div style={{ background: 'rgba(168,85,247,.16)', border: '1px solid rgba(168,85,247,.3)', borderRadius: 12, padding: '10px 12px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 10, fontWeight: 800, background: ACCENT_D, color: '#fff', borderRadius: 6, padding: '2px 7px' }}>PRO</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{proName || 'Mon établissement'}</span>
        </div>
        {groups.map(g => (
          <div key={g} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: 'rgba(255,255,255,.42)', padding: '0 8px 6px' }}>{g}</div>
            {NAV.filter(n => n.group === g).map(n => {
              const on = n.key === active
              const inner = (
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 10, marginBottom: 2, background: on ? 'rgba(168,85,247,.20)' : 'transparent', color: on ? '#fff' : (n.route ? 'rgba(255,255,255,.78)' : 'rgba(255,255,255,.34)'), fontSize: 13.5, fontWeight: on ? 700 : 500 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: on ? ACCENT_D : 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: on ? '#fff' : 'rgba(255,255,255,.7)' }}><Icon k={n.icon} /></span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {!n.route && <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,.35)' }}>bientôt</span>}
                </div>
              )
              return n.route ? <Link key={n.key} href={`${n.route}${q}`} style={{ textDecoration: 'none' }}>{inner}</Link> : <div key={n.key}>{inner}</div>
            })}
          </div>
        ))}
      </aside>
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748B' }}>
          <span style={{ fontWeight: 600 }}>Flowin Pro</span><span>›</span><span style={{ fontWeight: 800, color: '#0F172A' }}>{NAV.find(n => n.key === active)?.label ?? 'Accueil'}</span>
        </div>
        <div style={{ padding: '26px', maxWidth: 1120 }}>{children}</div>
      </main>
    </div>
  )
}
