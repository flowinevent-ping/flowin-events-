'use client'

/**
 * Maintenance — acces rapides infra et parcours de test. Usage interne.
 *
 * AUCUN SECRET AFFICHE ICI. Ni jeton, ni cle de service, ni mot de passe. La cle anon
 * de Supabase est publique par conception et n a rien a faire sur cette page non plus :
 * ce qui n est pas necessaire n est pas montre.
 *
 * Les parcours de test sont DERIVES de la liste des partenaires chargee, jamais ecrits
 * en dur. Le monolithe portait sept slugs codes en clair : a chaque partenaire ajoute
 * ou retire, la liste devenait fausse en silence.
 */
import { useMemo } from 'react'
import { PageHeader, SectionHeader } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'

const REPO = 'https://github.com/flowinevent-ping/flowin-events-'
const SUPABASE = 'https://supabase.com/dashboard/project/ywcqtupgoxfzkddqkztk'
const BASE = 'https://flowin-events.vercel.app'

function Ligne({ cle, children }: { cle: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      padding: '7px 0', borderBottom: '1px solid var(--sa-border)',
    }}>
      <span className="sa-muted" style={{ fontSize: 11.5 }}>{cle}</span>
      <span style={{ fontSize: 11.5, fontWeight: 700, textAlign: 'right' }}>{children}</span>
    </div>
  )
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--sa-card)', border: '1px solid var(--sa-border)',
      borderRadius: 12, padding: '14px 16px', marginBottom: 14,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 9 }}>{titre}</div>
      {children}
    </div>
  )
}

export default function Page() {
  const { events, partenaires } = useDashboard()

  /* Les parcours de test suivent les partenaires reellement enregistres. */
  const parcours = useMemo(
    () => partenaires
      .map(p => ({ nom: p.nom, slug: p.id.replace(/^pt-/, '') }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [partenaires]
  )

  const evenements = useMemo(
    () => events.filter(e => e.status === 'live' || e.status === 'upcoming'),
    [events]
  )

  return (
    <div className="sa-page">
      <PageHeader
        title="Maintenance"
        subtitle="Accès infra et parcours de test — usage interne"
      />

      <div style={{
        marginBottom: 14, padding: '10px 12px', borderRadius: 10,
        border: '1px solid var(--sa-border)', background: 'var(--sa-subtle, transparent)',
        fontSize: 11.5, lineHeight: 1.5,
      }}>
        Liens directs pour diagnostiquer et accéder à l&apos;infrastructure.
        <b> Aucun secret n&apos;est affiché sur cette page</b> — ni jeton, ni clé de service.
      </div>

      <SectionHeader>🧱 Infrastructure</SectionHeader>
      <Bloc titre="Accès">
        <Ligne cle="Dépôt GitHub">
          <a href={REPO} target="_blank" rel="noopener noreferrer">flowinevent-ping/flowin-events-</a>
        </Ligne>
        <Ligne cle="Projet Supabase">
          <a href={SUPABASE} target="_blank" rel="noopener noreferrer">ywcqtupgoxfzkddqkztk</a>
        </Ligne>
        <Ligne cle="Base des assets">
          <a href={BASE} target="_blank" rel="noopener noreferrer">flowin-events.vercel.app</a>
        </Ligne>
      </Bloc>

      <SectionHeader>🎮 Parcours de test</SectionHeader>
      <Bloc titre={`Partenaires — ${parcours.length}`}>
        {!parcours.length ? (
          <div className="sa-muted" style={{ fontSize: 11.5 }}>
            Aucun partenaire enregistré. Cette liste suit les partenaires en base.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 4 }}>
            {parcours.map(p => (
              <a
                key={p.slug}
                href={`${BASE}/parcours/quiz?ev=ev-nds-${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 0', textDecoration: 'none' }}
              >
                ▶ {p.nom}
              </a>
            ))}
          </div>
        )}
      </Bloc>

      {evenements.length > 0 && (
        <Bloc titre={`Événements en cours ou à venir — ${evenements.length}`}>
          {evenements.map(e => (
            <Ligne key={e.id} cle={e.nom}>
              <a
                href={`${BASE}/parcours/quiz?ev=${e.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                ▶ ouvrir
              </a>
            </Ligne>
          ))}
        </Bloc>
      )}

      <SectionHeader>📋 Notes</SectionHeader>
      <Bloc titre="État connu">
        <div className="sa-muted" style={{ fontSize: 11.5, lineHeight: 1.7 }}>
          Le durcissement RLS avancé et la séparation de la clé d&apos;administration
          restent à faire — le plan est dans le dépôt, sous <code>docs/sql/</code>.
          <br />
          Le service worker dispose d&apos;un coupe-circuit documenté dans <code>docs/RUNBOOK-sw.md</code>.
          <br />
          Le tableau de bord monolithe <code>dashboard.html</code> reste en production en parallèle
          de cette interface, le temps que la migration soit complète.
        </div>
      </Bloc>
    </div>
  )
}
