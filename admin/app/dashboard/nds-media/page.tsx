'use client'

/**
 * Video & media — acces aux supports de communication.
 *
 * Les fichiers sont servis depuis le domaine public de l application. Aucun chemin
 * n est devine : un support absent est signale comme absent, jamais affiche avec un
 * lien mort qui laisse croire qu il existe.
 *
 * REGLE DE SUPPORT (canonique) : le support ne compte pas dans le modele de donnees.
 * A4, forex, video, sticker portent le MEME QR. Cette vue ne fait que donner acces aux
 * declinaisons imprimables — elle n introduit aucune dimension de tracking.
 */
import { useMemo, useState } from 'react'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'

const BASE = 'https://flowin-events.vercel.app'
const lienPartenaire = (slug: string) => `${BASE}/parcours/nds2026?ev=ev-nds-${slug}&source=reseaux-${slug}`
const qrPartenaire = (slug: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(lienPartenaire(slug))}&bgcolor=ffffff&margin=8`

export default function Page() {
  const { partenaires } = useDashboard()
  const [q, setQ] = useState('')

  const actifs = useMemo(() => {
    const t = q.trim().toLowerCase()
    return partenaires
      .filter(p => !t || (p.nom ?? '').toLowerCase().includes(t))
      .map(p => ({ ...p, slug: p.id.replace(/^pt-/, '') }))
  }, [partenaires, q])

  return (
    <div className="sa-page">
      <PageHeader
        title="Vidéo & média"
        subtitle="Supports de communication — prévisualisation et téléchargement"
      />

      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Le support n&apos;entre pas dans le modèle de tracking : A4, forex, vidéo ou sticker portent
        le <b>même QR</b>. Cette page donne accès aux déclinaisons imprimables, rien de plus.
      </div>

      <input
        className="sa-input"
        placeholder="Rechercher un partenaire…"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 14 }}
      />

      {!actifs.length ? (
        <EmptyState icon="🎬" title="Aucun partenaire" desc={q ? 'Aucun résultat pour cette recherche.' : 'Aucun partenaire enregistré.'} />
      ) : (
        <>
          <SectionHeader>🖼️ Supports par partenaire</SectionHeader>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
            {actifs.map(p => (
              <div key={p.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  {p.emoji && <span aria-hidden>{p.emoji}</span>}
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.nom}</div>
                </div>
                <div className="sa-muted" style={{ fontSize: 10.5, marginBottom: 10 }}>
                  <code>{p.slug}</code>
                </div>

                {p.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.image_url}
                    alt={`Logo ${p.nom}`}
                    style={{
                      width: '100%', height: 78, objectFit: 'contain', marginBottom: 10,
                      background: 'var(--sa-subtle, transparent)', borderRadius: 8,
                    }}
                  />
                ) : (
                  <div className="sa-muted" style={{ fontSize: 11, marginBottom: 10 }}>
                    Aucun logo enregistré
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <a
                    href={qrPartenaire(p.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}
                  >
                    QR seul <span className="sa-muted" style={{ fontWeight: 400 }}>— généré depuis le lien partenaire, à intégrer dans un visuel</span>
                  </a>
                  {p.image_url ? (
                    <a
                      href={p.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}
                    >
                      Logo partenaire <span className="sa-muted" style={{ fontWeight: 400 }}>— tel que fourni</span>
                    </a>
                  ) : (
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--sa-muted)' }}>
                      Logo partenaire <span style={{ fontWeight: 400 }}>— aucun logo enregistré</span>
                    </div>
                  )}
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--sa-muted)' }}>
                    Affiche A4 <span style={{ fontWeight: 400 }}>— pas encore disponible (aucun visuel généré pour ce partenaire)</span>
                  </div>
                </div>

                {(p.instagram || p.facebook || p.site_web) && (
                  <div style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--sa-border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.site_web && <a href={p.site_web} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>Site</a>}
                    {p.instagram && <a href={p.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>Instagram</a>}
                    {p.facebook && <a href={p.facebook} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>Facebook</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
