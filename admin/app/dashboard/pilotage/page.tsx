'use client'

/**
 * Pilotage — cockpit d ensemble.
 *
 * Les compteurs affiches ici sont DERIVES des donnees chargees, jamais saisis en dur.
 * L ancienne version du monolithe portait des valeurs de repli codees en clair
 * (186 participants, 8 gagnants, 73 % d opt-in…) qui restaient affichees meme quand
 * la donnee reelle disait autre chose. Aucune valeur de repli ici : quand une donnee
 * manque, on affiche un tiret.
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import { fetchBonsCommande, estSigne, type BonCommande } from '@/lib/commercial'
import { Ico } from '@/lib/proicons'
import { ACCENT_ANIM } from '@/lib/charte'

const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')

export default function Page() {
  const { events, joueurs, partenaires } = useDashboard()
  const [bons, setBons] = useState<BonCommande[] | null>(null)

  useEffect(() => {
    fetchBonsCommande().then(setBons)
  }, [])

  const { live, aVenir, passes } = useMemo(() => {
    const parDate = (a: { date_d: string | null }, b: { date_d: string | null }) =>
      new Date(a.date_d ?? 0).getTime() - new Date(b.date_d ?? 0).getTime()
    return {
      live: events.filter(e => e.status === 'live'),
      aVenir: events.filter(e => e.status === 'upcoming').sort(parDate),
      passes: events.filter(e => e.status === 'past').sort((a, b) => parDate(b, a)),
    }
  }, [events])

  const optin = joueurs.filter(j => j.optin).length
  const txOptin = joueurs.length ? Math.round((100 * optin) / joueurs.length) : null
  const signes = bons?.filter(estSigne).length ?? null

  const kpis: { l: string; v: string; d: string }[] = [
    { l: 'Partenaires', v: String(partenaires.length), d: 'au total' },
    { l: 'Bons de commande', v: bons == null ? '…' : String(bons.length), d: signes == null ? '' : `${signes} signé${signes > 1 ? 's' : ''}` },
    { l: 'Joueurs CRM', v: String(joueurs.length), d: 'inscrits' },
    { l: 'Opt-in', v: txOptin == null ? '—' : `${txOptin} %`, d: `${optin} joueur${optin > 1 ? 's' : ''}` },
  ]

  /* Meme planning compact (.sa-kb-*) que /dashboard/planning : « meme design
     de planning partout » (Romain, 29/10). Contenu inchange : 8 events max par
     colonne, nom, date, lieu, participants. */
  const colonne = (titre: string, puce: string, liste: typeof events, vide: string) => (
    <section className="sa-kb-col" style={{ flex: '1 1 268px' }}>
      <header className="sa-kb-tete">
        <span className="t">{puce} {titre}</span>
        <span className="n">{liste.length}</span>
      </header>
      <div className="sa-kb-corps">
        {!liste.length ? (
          <div className="sa-kb-vide" style={{ lineHeight: 1.5 }}>{vide}</div>
        ) : (
          liste.slice(0, 8).map(e => (
            <div key={e.id} className="sa-kb-vignette" style={{ cursor: 'default' }}>
              <div className="sa-kb-ligne">
                <span className="sa-kb-pastille" style={{ background: `${ACCENT_ANIM}20`, color: ACCENT_ANIM }}>
                  <Ico k="ticket" size={14} />
                </span>
                <span className="sa-kb-nom">{e.nom}</span>
                {e.date_d && <span className="sa-kb-date">{dateFr(e.date_d)}</span>}
              </div>
              {(e.lieu || e.participants > 0) && (
                <div className="sa-kb-sub">
                  {[e.lieu, e.participants > 0 ? `${e.participants} participant${e.participants > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )

  return (
    <div className="sa-page">
      <PageHeader
        title="Pilotage"
        subtitle="Vue d'ensemble"
        actions={
          <Link className="sa-btn" href="/dashboard/rapport-points">Rapport détaillé</Link>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginBottom: 16 }}>
        {kpis.map(k => (
          <div key={k.l} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{k.v}</div>
            <div className="sa-muted" style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>
              {k.l}
            </div>
            {k.d && <div className="sa-muted" style={{ fontSize: 10.5, marginTop: 2 }}>{k.d}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <Link className="sa-btn sm primary" href="/dashboard/nds-bon-commande">Bons de commande</Link>
        <Link className="sa-btn sm" href="/dashboard/nds-lots">Stock des lots</Link>
        <Link className="sa-btn sm" href="/dashboard/prospection">Prospection</Link>
      </div>

      <SectionHeader>Cockpit</SectionHeader>

      {!events.length ? (
        <EmptyState icon="🎯" title="Aucun événement" desc="Aucun événement n'est enregistré." />
      ) : (
        <div className="sa-kanban">
          {colonne('Live maintenant', '🔴', live,
            aVenir.length ? `Aucun event en cours. Prochain le ${dateFr(aVenir[0].date_d)}.` : 'Aucun event en cours.')}
          {colonne('À venir', '📅', aVenir, 'Aucun event programmé.')}
          {colonne('Passés', '🗂️', passes, 'Aucun event terminé.')}
        </div>
      )}
    </div>
  )
}
