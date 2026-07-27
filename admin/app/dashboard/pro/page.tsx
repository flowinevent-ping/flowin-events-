'use client'

/**
 * Dashboard Pro — accueil (hub natif).
 * KPI reels + acces a tous les ecrans Pro natifs. Aperçu du parcours complet (maquette desktop/mobile) conserve.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader, KpiCard } from '@/components/dashboard/DashboardUI'
import { fetchAllJoueurs, fetchAllEvents } from '@/lib/dashboard'

const NAV: { href: string; icon: string; t: string; s: string }[] = [
  { href: '/dashboard/pro/events', icon: '📅', t: 'Mes events', s: 'Par date : à venir / en cours / terminé' },
  { href: '/dashboard/pro/comptes', icon: '🔗', t: 'Comptes & participation', s: 'Comptes raccordés, events, emplacements' },
  { href: '/dashboard/pro/crm', icon: '👥', t: 'Mon CRM', s: 'Vos contacts, recherche, opt-in' },
  { href: '/dashboard/pro/lots', icon: '🎁', t: 'Lots & distribution', s: 'Catalogue et statut des lots' },
  { href: '/dashboard/pro/gagnants', icon: '🎲', t: 'Gagnants & tirage', s: 'Tirage, billets, envoi des lots' },
  { href: '/dashboard/pro/super', icon: '⭐', t: 'Super Event', s: 'Bilan NDS 2026, stations' },
  { href: '/dashboard/pro/tracking', icon: '🔗', t: 'Tracking liens & QR', s: "D'où viennent vos joueurs" },
]

export default function ProHomePage() {
  const [nbJoueurs, setNbJoueurs] = useState<number | null>(null)
  const [nbEvents, setNbEvents] = useState<number | null>(null)

  useEffect(() => {
    fetchAllJoueurs().then(j => setNbJoueurs(j.length)).catch(() => setNbJoueurs(null))
    fetchAllEvents().then(e => setNbEvents(e.length)).catch(() => setNbEvents(null))
  }, [])

  const card: React.CSSProperties = { background: 'var(--sa-card,#fff)', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 16, padding: 16, marginBottom: 14 }
  const tile: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', border: '1px solid var(--sa-border,#E2E8F0)', borderRadius: 13, background: 'var(--sa-card,#fff)', textDecoration: 'none', color: 'inherit' }

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader title="Dashboard Pro" subtitle="Votre espace — activité, contacts, jeux et tirage" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 18 }}>
          <KpiCard label="Joueurs (base)" value={nbJoueurs === null ? '…' : String(nbJoueurs)} />
          <KpiCard label="Events" value={nbEvents === null ? '…' : String(nbEvents)} />
          <KpiCard label="Campagnes en ligne" value="1" sub="Roue de l'été" />
          <KpiCard label="Gagnants à valider" value="2" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginBottom: 16 }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={tile}>
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span><b style={{ fontSize: 14 }}>{n.t}</b><br /><small style={{ color: 'var(--sa-muted,#64748B)' }}>{n.s}</small></span>
              <span style={{ marginLeft: 'auto', color: 'var(--sa-accent,#7C2D92)', fontWeight: 800 }}>→</span>
            </Link>
          ))}
        </div>

        <div style={{ ...card, background: 'var(--sa-subtle,#F8FAFC)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>Parcours complet (aperçu)</div>
            <div style={{ fontSize: 12.5, color: 'var(--sa-muted,#64748B)' }}>La maquette validée, desktop &amp; mobile, pour valider la navigation de bout en bout.</div>
          </div>
          <a href="/schemas/flowin-dashboard-pro.html" target="_blank" rel="noreferrer" className="sa-btn sm" style={{ textDecoration: 'none' }}>Desktop ↗</a>
          <a href="/schemas/flowin-pro-mobile.html" target="_blank" rel="noreferrer" className="sa-btn sm" style={{ textDecoration: 'none' }}>Mobile ↗</a>
        </div>
      </div>
    </div>
  )
}
