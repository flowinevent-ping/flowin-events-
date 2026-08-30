'use client'

/**
 * Landing pages — inventaire des landings de prospection.
 *
 * `published` et `statut` sont deux informations DISTINCTES : une landing peut etre
 * marquee prete sans etre en ligne. Les deux sont affichees separement, jamais fusionnees
 * en un seul indicateur.
 *
 * MAJ 30/08 -- Romain signale une regression : le monolithe legacy avait une preview
 * navigable en cadre telephone (iframe-landing-apercu, fleches precedent/suivant),
 * jamais portee lors de la reecriture Next.js. Restauree ici (navigation entre les
 * differentes landings, pas entre des sous-pages d'une meme landing -- interpretation
 * la plus utile : parcourir ce qu'on a sans quitter le dashboard).
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchLandings, type Landing } from '@/lib/administratif'

function PhoneApercu({ landing, onPrev, onNext, position }: { landing: Landing | null; onPrev: () => void; onNext: () => void; position: string }) {
  const W = 220, H = 442, SCALE = 0.586
  const IW = Math.round(W / SCALE), IH = Math.round(H / SCALE)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <button
        className="sa-btn icon" onClick={onPrev} disabled={!landing}
        aria-label="Landing précédente" style={{ fontSize: 18 }}
      >‹</button>

      <div style={{ width: W + 20, flexShrink: 0 }}>
        <div style={{ borderRadius: 32, padding: 9, background: '#0F172A', boxShadow: '0 20px 50px rgba(15,23,42,.25)' }}>
          <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', width: W, height: H, position: 'relative' }}>
            {landing?.deploy_url ? (
              <iframe
                key={landing.id}
                src={landing.deploy_url}
                title={`Aperçu — ${landing.nom ?? landing.id}`}
                loading="lazy"
                style={{ width: IW, height: IH, border: 0, transform: `scale(${SCALE})`, transformOrigin: 'top left', pointerEvents: 'none' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 20, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                Aucune landing avec URL de déploiement à prévisualiser.
              </div>
            )}
          </div>
        </div>
        {landing && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{landing.nom ?? landing.id}</div>
            <div className="sa-muted" style={{ fontSize: 11, marginTop: 2 }}>{position}</div>
          </div>
        )}
      </div>

      <button
        className="sa-btn icon" onClick={onNext} disabled={!landing}
        aria-label="Landing suivante" style={{ fontSize: 18 }}
      >›</button>
    </div>
  )
}

export default function Page() {
  const [list, setList] = useState<Landing[]>([])
  const [charge, setCharge] = useState(true)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    fetchLandings().then(setList).finally(() => setCharge(false))
  }, [])

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return list
    return list.filter(l => (l.nom ?? l.id).toLowerCase().includes(t))
  }, [list, q])

  const avecUrl = useMemo(() => list.filter(l => l.deploy_url), [list])
  const courant = avecUrl[idx] ?? null

  const enLigne = list.filter(l => l.published === true).length

  function ouvrirApercu(l: Landing) {
    const i = avecUrl.findIndex(x => x.id === l.id)
    if (i !== -1) setIdx(i)
  }

  return (
    <div className="sa-page">
      <PageHeader
        title="Landing pages"
        subtitle={`${list.length} landing${list.length > 1 ? 's' : ''} · ${enLigne} en ligne`}
      />

      {!charge && avecUrl.length > 0 && (
        <div style={{ background: 'var(--sa-subtle)', borderRadius: 14, padding: '18px 14px', marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
          <PhoneApercu
            landing={courant}
            onPrev={() => setIdx(i => (i - 1 + avecUrl.length) % avecUrl.length)}
            onNext={() => setIdx(i => (i + 1) % avecUrl.length)}
            position={`${idx + 1} / ${avecUrl.length}`}
          />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <input
          className="sa-input"
          placeholder="Rechercher une landing…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      {charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}

      {!charge && !filtres.length && (
        <EmptyState icon="🌐" title="Aucune landing" desc={q ? 'Aucun résultat pour cette recherche.' : 'Aucune landing enregistrée.'} />
      )}

      {!charge && filtres.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 10 }}>
          {filtres.map(l => (
            <div
              key={l.id}
              onClick={() => l.deploy_url && ouvrirApercu(l)}
              style={{ background: 'var(--sa-card)', border: courant?.id === l.id ? '1.5px solid var(--sa-accent)' : '1px solid var(--sa-border)', borderRadius: 10, padding: 13, cursor: l.deploy_url ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  aria-hidden
                  style={{
                    width: 10, height: 10, borderRadius: 3, flexShrink: 0,
                    background: l.accent_color || 'var(--sa-border)',
                    border: '1px solid var(--sa-border)',
                  }}
                />
                <div style={{ fontSize: 13, fontWeight: 700 }}>{l.nom ?? l.id}</div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span
                  className="sa-chip"
                  style={{
                    fontSize: 10, fontWeight: 700,
                    color: l.published ? '#2f7d4f' : 'var(--sa-muted)',
                    borderColor: l.published ? '#2f7d4f' : 'var(--sa-border)',
                  }}
                >
                  {l.published ? 'En ligne' : 'Hors ligne'}
                </span>
                {l.statut && <span className="sa-chip" style={{ fontSize: 10 }}>{l.statut}</span>}
                {l.module_jeu && <span className="sa-chip" style={{ fontSize: 10 }}>🎮 {l.module_jeu}</span>}
              </div>

              {l.deploy_url ? (
                <a
                  href={l.deploy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: 11.5, wordBreak: 'break-all' }}
                >
                  {l.deploy_url}
                </a>
              ) : (
                <div className="sa-muted" style={{ fontSize: 11.5 }}>Aucune URL de déploiement</div>
              )}

              {l.updated_at && (
                <div className="sa-muted" style={{ fontSize: 10, marginTop: 7 }}>
                  modifiée le {new Date(l.updated_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
