'use client'

import Link from 'next/link'
import { useState } from 'react'

/**
 * Coquille brandee de l'espace Pro (identite Flowin Pro de la maquette validee).
 * Sidebar sombre, accent violet, en-tete pro. Utilisee par les ecrans /pro/*.
 * Les items non encore portes sont affiches en "bientot" (pas de 404).
 *
 * Ajout (28/07/2026) : responsive mobile. La sidebar fixe de 248px ecrasait le contenu
 * sur les ecrans etroits (aucun media query n existait -- constate sur capture d ecran
 * mobile reelle). En dessous de 860px, la sidebar devient un tiroir masque par defaut,
 * ouvert par un bouton hamburger dans la barre du haut. Aucun pattern mobile equivalent
 * trouve cote SA (dashboard.tsx, outil interne desktop-only) : construit ici pour Pro
 * specifiquement, memes couleurs/icones que la version desktop deja validee.
 *
 * Ajout (29/07/2026) : barre de navigation mobile en bas, demande explicite de Romain.
 * Remplace le hamburger comme point d'entree principal sur mobile (garde le meme tiroir
 * complet pour le reste du menu, ouvert desormais via le bouton "Plus" de la barre basse).
 * 4 raccourcis les plus utilises + "Plus" pour tout le reste -- jamais tout le menu en bas,
 * ecran trop etroit pour 10 items.
 */
interface NavItem { key: string; label: string; icon: string; route?: string; group: string }
const NAV: NavItem[] = [
  { key: 'accueil', label: 'Accueil', icon: 'home', route: '/pro', group: 'TABLEAU DE BORD' },
  { key: 'entreprise', label: 'Mon entreprise', icon: 'shop', route: '/pro/entreprise', group: 'MON COMPTE' },
  { key: 'jeu', label: 'Créer mon animation', icon: 'game', route: '/pro/jeu', group: 'MES CAMPAGNES' },
  { key: 'banques', label: 'Mes banques', icon: 'bank', route: '/pro/banques', group: 'MES CAMPAGNES' },
  { key: 'events', label: 'Mes events', icon: 'calendar', route: '/pro/events', group: 'MES CAMPAGNES' },
  { key: 'lots', label: 'Lots & distribution', icon: 'gift', route: '/pro/lots', group: 'MES CAMPAGNES' },
  { key: 'crm', label: 'Mon CRM', icon: 'users', route: '/pro/crm', group: 'MES DONNÉES' },
  { key: 'gagnants', label: 'Gagnants & tirage', icon: 'dice', route: '/pro/tirage', group: 'MES DONNÉES' },
  { key: 'tracking', label: 'Tracking liens & QR', icon: 'target', route: '/pro/tracking', group: 'MES DONNÉES' },
  { key: 'super', label: 'Super Event', icon: 'star', route: '/pro/super', group: 'ALLER PLUS LOIN' },
]
/* Raccourcis de la barre basse mobile -- les 4 les plus utilises + Plus (ouvre le tiroir complet) */
const NAV_BASSE: string[] = ['accueil', 'jeu', 'crm', 'gagnants']
const ICONS: Record<string, string> = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  shop: '<path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M4 9h16"/>',
  game: '<rect x="2" y="6" width="20" height="12" rx="4"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/>',
  bank: '<path d="M3 21h18M4 10h16M12 3l9 5H3z"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="16" r="1"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  star: '<path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
}
const ACCENT = '#A855F7', ACCENT_D = '#7C2D92', SB = '#1E293B', SB2 = '#172033'

function Icon({ k }: { k: string }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[k] ?? '' }} />
}

export default function ProShell({ proName, proId, active, children }: { proName: string; proId: string; active: string; children: React.ReactNode }) {
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const groups = Array.from(new Set(NAV.map(n => n.group)))
  const [open, setOpen] = useState(false)

  const sidebar = (
    <aside className="pro-sidebar" style={{ width: 248, flexShrink: 0, background: `linear-gradient(180deg,${SB},${SB2})`, color: 'rgba(255,255,255,.78)', padding: '20px 14px', height: '100dvh', overflowY: 'auto' }}>
      <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', letterSpacing: '-.5px', padding: '0 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: ACCENT, marginRight: 8, verticalAlign: 'middle' }} />Flow<span style={{ color: ACCENT }}>in</span> Pro</span>
        <button className="pro-drawer-close" onClick={() => setOpen(false)} aria-label="Fermer le menu" style={{ display: 'none', background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
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
            return n.route
              ? <Link key={n.key} href={`${n.route}${q}`} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>{inner}</Link>
              : <div key={n.key}>{inner}</div>
          })}
        </div>
      ))}
    </aside>
  )

  const barreBasse = (
    <nav className="pro-bottom-nav" style={{ display: 'none' }}>
      {NAV_BASSE.map(key => {
        const n = NAV.find(x => x.key === key)!
        const on = n.key === active
        return (
          <Link key={n.key} href={`${n.route}${q}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 4px 8px', color: on ? '#fff' : 'rgba(255,255,255,.55)' }}>
            <span style={{ color: on ? ACCENT : 'inherit' }}><Icon k={n.icon} /></span>
            <span style={{ fontSize: 10, fontWeight: on ? 800 : 600, lineHeight: 1 }}>{n.label.split(' ')[0]}</span>
          </Link>
        )
      })}
      <button
        onClick={() => setOpen(true)}
        aria-label="Voir tout le menu"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 4px 8px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.55)', fontFamily: 'inherit' }}
      >
        <Icon k="more" />
        <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1 }}>Plus</span>
      </button>
    </nav>
  )

  return (
    <div className={`pro-shell${open ? ' open' : ''}`} style={{ display: 'flex', minHeight: '100dvh', background: '#F1F5F9', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif', color: '#0F172A' }}>
      <style>{`
        :root { --sa-bg:#F1F5F9; --sa-card:#FFFFFF; --sa-border:#E2E8F0; --sa-text:#0F172A; --sa-muted:#64748B; --sa-subtle:#F8FAFC; }
        .pro-sidebar { position: sticky; top: 0; }
        .pro-hamburger, .pro-drawer-backdrop, .pro-bottom-nav { display: none; }
        @media (max-width: 860px) {
          .pro-sidebar { position: fixed; left: 0; top: 0; z-index: 40; transform: translateX(-100%); transition: transform .22s ease; }
          .pro-shell.open .pro-sidebar { transform: translateX(0); box-shadow: 8px 0 32px rgba(0,0,0,.25); }
          .pro-drawer-close { display: block !important; }
          .pro-drawer-backdrop { display: none; }
          .pro-shell.open .pro-drawer-backdrop { display: block; position: fixed; inset: 0; background: rgba(15,23,42,.45); z-index: 30; }
          .pro-main-pad { padding: 18px !important; padding-bottom: 78px !important; }
          .pro-bottom-nav {
            display: flex !important; position: fixed; left: 0; right: 0; bottom: 0; z-index: 35;
            background: linear-gradient(180deg,${SB},${SB2}); border-top: 1px solid rgba(255,255,255,.08);
            padding-bottom: env(safe-area-inset-bottom, 0px); box-shadow: 0 -6px 20px rgba(0,0,0,.18);
          }
        }
      `}</style>
      {sidebar}
      <div className="pro-drawer-backdrop" onClick={() => setOpen(false)} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 26px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748B' }}>
          <span style={{ fontWeight: 600 }}>Flowin Pro</span><span>›</span><span style={{ fontWeight: 800, color: '#0F172A' }}>{NAV.find(n => n.key === active)?.label ?? 'Accueil'}</span>
        </div>
        <div className="pro-main-pad" style={{ padding: '26px', maxWidth: 1120 }}>{children}</div>
      </main>
      {barreBasse}
    </div>
  )
}
