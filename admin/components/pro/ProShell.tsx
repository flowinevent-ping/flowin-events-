'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CHARTE_PRO, POLICE_PRO, VARIABLES_CSS } from '@/lib/charte'

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
interface NavItem { key: string; label: string; sous: string; icon: string; route: string }
/* P1 (16/09) : quatre entrees. Tout se lit par operation : une operation
   s ouvre sur sa fiche (/pro/operation), qui porte jeu, lots, diffusion,
   gagnants, trafic, CRM et contrat. */
const NAV: NavItem[] = [
  { key: 'operations', label: 'Mes opérations', sous: 'Events et super events', icon: 'calendar', route: '/pro' },
  { key: 'nouvelle', label: 'Nouvelle opération', sous: 'Créer ou rejoindre', icon: 'join', route: '/pro/nouvelle' },
  { key: 'donnees', label: 'Mes données', sous: 'CRM, gagnants, trafic', icon: 'users', route: '/pro/donnees' },
  { key: 'compte', label: 'Mon profil', sous: 'Entreprise, bons & factures, lots, banques', icon: 'shop', route: '/pro/compte' },
]
/* Les pages existantes gardent leur cle : elles se rangent sous l une des quatre. */
const RANGEMENT: Record<string, string> = {
  accueil: 'operations', events: 'operations', super: 'operations', parcours: 'operations', operation: 'operations',
  lots: 'operations', com: 'operations',
  jeu: 'nouvelle', rejoindre: 'nouvelle',
  crm: 'donnees', gagnants: 'donnees', tracking: 'donnees',
  entreprise: 'compte', contrat: 'compte', banques: 'compte',
}
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
  phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10.5 18.5h3"/>',
  join: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  more: '<circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
}
const C = CHARTE_PRO

function Icon({ k }: { k: string }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: ICONS[k] ?? '' }} />
}

export default function ProShell({ proName, proId, active, children }: { proName: string; proId: string; active: string; children: React.ReactNode }) {
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const actif = RANGEMENT[active] ?? active
  const [open, setOpen] = useState(false)
  const page = NAV.find(n => n.key === actif)

  /* Sans ?pro= dans l adresse : on retrouve le pro connecte et on recharge
     la meme page avec son identifiant. Personne de connecte : ecran de connexion. */
  const [sansPro, setSansPro] = useState<'cherche' | 'aucun' | null>(proId ? null : 'cherche')
  useEffect(() => {
    if (proId) return
    let fini = false
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const uid = data.session?.user?.id
      if (uid) {
        const { data: pro } = await supabase.from('pros').select('id').eq('auth_id', uid).maybeSingle()
        if (pro?.id && !fini) {
          const u = new URL(window.location.href)
          u.searchParams.set('pro', pro.id)
          window.location.replace(u.toString())
          return
        }
      }
      if (!fini) setSansPro('aucun')
    })()
    return () => { fini = true }
  }, [proId])

  const sidebar = (
    <aside className="pro-sidebar" style={{ width: 256, flexShrink: 0, background: `linear-gradient(180deg,${C.sidebar},${C.sidebar2})`, color: 'rgba(255,255,255,.78)', padding: '22px 14px', height: '100dvh', overflowY: 'auto', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.filet }} />
      <div style={{ padding: '4px 8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo officiel (public/nds/assets/flowin_blanc.png) */}
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/nds/assets/flowin_blanc.png" alt="Flowin" style={{ height: 26, width: 'auto' }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', color: 'rgba(255,255,255,.6)' }}>PRO</span>
        </span>
        <button className="pro-drawer-close" onClick={() => setOpen(false)} aria-label="Fermer le menu" style={{ display: 'none', background: 'none', border: 'none', color: 'rgba(255,255,255,.6)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '11px 13px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>Établissement</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginTop: 2 }}>{proName || 'Mon établissement'}</div>
      </div>
      {NAV.map(n => {
        const on = n.key === actif
        return (
          <Link key={n.key} href={`${n.route}${q}`} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 10px', marginBottom: 6, borderRadius: 14, background: on ? C.degrade : 'transparent', color: '#fff', boxShadow: on ? '0 8px 20px rgba(224,33,138,.3)' : 'none' }}>
              <span style={{ width: 34, height: 34, borderRadius: 11, background: on ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon k={n.icon} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>{n.label}</span>
                <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: on ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.5)' }}>{n.sous}</span>
              </span>
            </div>
          </Link>
        )
      })}
    </aside>
  )

  const barreBasse = (
    <nav className="pro-bottom-nav" style={{ display: 'none' }}>
      {NAV.map(n => {
        const on = n.key === actif
        return (
          <Link key={n.key} href={`${n.route}${q}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 4px 8px', color: on ? '#fff' : 'rgba(255,255,255,.55)' }}>
            <span style={{ color: on ? C.magenta : 'inherit' }}><Icon k={n.icon} /></span>
            <span style={{ fontSize: 10, fontWeight: on ? 800 : 600, lineHeight: 1 }}>{n.label.replace(/^(Mes|Mon|Nouvelle) /, '')}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className={`pro-shell${open ? ' open' : ''}`} style={{ display: 'flex', minHeight: '100dvh', background: C.fond, fontFamily: POLICE_PRO, fontSize: 14, color: C.texte }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        :root { ${VARIABLES_CSS} --sa-border:${C.bordure}; --sa-muted:${C.attenue}; --sa-text:${C.texte}; --sa-subtle:${C.subtil}; }
        .pro-shell input, .pro-shell select, .pro-shell textarea, .pro-shell button { font-family: ${POLICE_PRO}; }
        .pro-sidebar { position: sticky; top: 0; }
        .pro-drawer-backdrop, .pro-bottom-nav, .pro-hamburger { display: none; }
        @media (max-width: 860px) {
          .pro-sidebar { position: fixed; left: 0; top: 0; z-index: 40; transform: translateX(-100%); transition: transform .22s ease; }
          .pro-shell.open .pro-sidebar { transform: translateX(0); box-shadow: 8px 0 32px rgba(0,0,0,.25); }
          .pro-drawer-close { display: block !important; }
          .pro-shell.open .pro-drawer-backdrop { display: block; position: fixed; inset: 0; background: rgba(22,8,32,.45); z-index: 30; }
          .pro-main-pad { padding: 16px !important; padding-bottom: 78px !important; }
          .pro-bottom-nav {
            display: flex !important; position: fixed; left: 0; right: 0; bottom: 0; z-index: 35;
            background: linear-gradient(180deg,${C.sidebar},${C.sidebar2}); border-top: 1px solid rgba(255,255,255,.08);
            padding-bottom: env(safe-area-inset-bottom, 0px); box-shadow: 0 -6px 20px rgba(0,0,0,.18);
          }
          .pro-hamburger { display: inline-flex !important; }
        }
      `}</style>
      {sidebar}
      <div className="pro-drawer-backdrop" onClick={() => setOpen(false)} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#fff', borderBottom: `1px solid ${C.bordure}`, height: 54, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.attenue }}>
          <button className="pro-hamburger" onClick={() => setOpen(true)} aria-label="Menu" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: C.accent, padding: 0 }}><Icon k="more" /></button>
          <span style={{ fontWeight: 700 }}>Flowin Pro</span><span>›</span><span style={{ fontWeight: 800, color: C.texte }}>{page?.label ?? 'Mes opérations'}</span>
        </div>
        <div className="pro-main-pad" style={{ padding: 26, maxWidth: 1180 }}>
          {sansPro === 'cherche' && <div style={{ fontSize: 14, color: C.attenue }}>Chargement de votre espace…</div>}
          {sansPro === 'aucun' && (
            <div style={{ background: C.carte, border: `1px solid ${C.bordure}`, borderRadius: 18, padding: 30, maxWidth: 460, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.texte }}>Connectez-vous à votre espace pro</div>
              <div style={{ fontSize: 13.5, color: C.attenue, margin: '6px 0 18px' }}>Vos opérations, vos lots et vos données s&apos;affichent une fois connecté.</div>
              <Link href="/pro/connexion" style={{ display: 'inline-block', background: C.degrade, color: '#fff', borderRadius: 999, padding: '12px 26px', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Se connecter</Link>
              <div style={{ fontSize: 13, color: C.attenue, marginTop: 14 }}>Pas encore de compte ? <Link href="/pro/inscription" style={{ color: C.accent, fontWeight: 700 }}>Créer mon espace</Link></div>
            </div>
          )}
          {sansPro === null && children}
        </div>
      </main>
      {barreBasse}
    </div>
  )
}
