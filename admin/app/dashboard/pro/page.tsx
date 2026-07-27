'use client'

/**
 * Dashboard Pro — espace professionnel.
 * Premier ecran code de l'espace Pro : reutilise le design system SA (sa-*)
 * et les fetchers existants. Porte de la maquette admin/public/schemas/flowin-dashboard-pro.html.
 * Etapes suivantes (voir docs/REFONTE-SA-tonalite-graphique.md) : auth email+PIN + RLS par pro_id,
 * puis vues jeu / event / crm / gagnants / tracking / super filtrees par compte.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader, KpiCard } from '@/components/dashboard/DashboardUI'
import { fetchAllJoueurs } from '@/lib/dashboard'

const CARD: React.CSSProperties = {
  background: 'var(--sa-card, #fff)', border: '1px solid var(--sa-border, #E2E8F0)',
  borderRadius: 16, padding: 18, marginBottom: 14,
}
const QUICK: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px',
  border: '1px solid var(--sa-border, #E2E8F0)', borderRadius: 13, marginBottom: 10,
  background: 'var(--sa-card, #fff)', textDecoration: 'none', color: 'inherit',
}

export default function ProDashboardPage() {
  const [nbJoueurs, setNbJoueurs] = useState<number | null>(null)

  useEffect(() => {
    fetchAllJoueurs().then(j => setNbJoueurs(j.length)).catch(() => setNbJoueurs(null))
  }, [])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="Dashboard Pro"
          subtitle="Espace professionnel — la surface pro au-dessus du moteur Flowin"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <KpiCard label="Joueurs (base)" value={nbJoueurs === null ? '…' : String(nbJoueurs)} sub="tous comptes" />
          <KpiCard label="Campagnes en ligne" value="1" sub="Roue de l'été" />
          <KpiCard label="Gagnants à valider" value="2" />
          <KpiCard label="Contacts CRM" value="182" sub="opt-in" />
        </div>

        <div style={CARD}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--sa-muted,#64748B)', marginBottom: 10 }}>
            Accès rapide
          </div>
          <Link href="/dashboard/jeux" style={QUICK}><span>🎮</span><span><b>Choisir / configurer un jeu</b><br /><small style={{ color: 'var(--sa-muted,#64748B)' }}>Quiz, roue, questions bonus</small></span></Link>
          <Link href="/dashboard/events" style={QUICK}><span>📅</span><span><b>Mes events &amp; supers</b><br /><small style={{ color: 'var(--sa-muted,#64748B)' }}>Par date : à venir / en cours / terminé</small></span></Link>
          <Link href="/dashboard/joueurs" style={QUICK}><span>👥</span><span><b>Mon CRM</b><br /><small style={{ color: 'var(--sa-muted,#64748B)' }}>Contacts, export</small></span></Link>
          <Link href="/dashboard/track-qr" style={QUICK}><span>🔗</span><span><b>Tracking liens &amp; QR</b><br /><small style={{ color: 'var(--sa-muted,#64748B)' }}>D'où viennent vos joueurs</small></span></Link>
        </div>

        <div style={{ ...CARD, background: 'var(--sa-subtle,#F8FAFC)', fontSize: 13, color: 'var(--sa-muted,#64748B)', lineHeight: 1.6 }}>
          Espace Pro en cours d'intégration. La maquette validée est consultable sur{' '}
          <a href="/schemas/flowin-dashboard-pro.html" target="_blank" rel="noreferrer" style={{ color: 'var(--sa-accent,#7C2D92)', fontWeight: 700 }}>/schemas/flowin-dashboard-pro.html</a>
          {' '}(desktop) et{' '}
          <a href="/schemas/flowin-pro-mobile.html" target="_blank" rel="noreferrer" style={{ color: 'var(--sa-accent,#7C2D92)', fontWeight: 700 }}>/schemas/flowin-pro-mobile.html</a>
          {' '}(mobile). Prochaine étape : auth email+PIN + isolation par compte (pro_id), puis portage écran par écran.
        </div>
      </div>
    </div>
  )
}
