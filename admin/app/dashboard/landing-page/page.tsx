'use client'

/**
 * Landing pages — inventaire des landings de prospection.
 *
 * `published` et `statut` sont deux informations DISTINCTES : une landing peut etre
 * marquee prete sans etre en ligne. Les deux sont affichees separement, jamais fusionnees
 * en un seul indicateur.
 *
 * MAJ 30/08 -- Romain signale une regression : le monolithe legacy avait une preview
 * navigable en cadre telephone (iframe-landing-apercu, fleches precedent/suivant).
 * Restauree une premiere fois en ne couvrant que la table `landings` (2 lignes gerees) --
 * INCOMPLET : Romain a remarque l'absence de "Prospection". Verifie dans le legacy
 * (dashboard.html:4733, tableau `lands`) : la vraie liste couvre 12 pages, dont 9 pages
 * HTML statiques de presentation/prospection jamais suivies dans la table `landings`
 * (elle ne sert qu'aux 2 landings VRAIMENT pilotables : prix, statut, module de jeu).
 * Les 9 autres sont fusionnees ici en dur, comme dans le legacy -- fichiers verifies
 * presents sur le disque avant integration, pas supposes.
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchLandings, type Landing } from '@/lib/administratif'

const BASE = 'https://flowin-events.vercel.app'

/** Pages de presentation/prospection statiques, hors table `landings` (verifiees sur disque le 30/08). */
const PAGES_STATIQUES: Landing[] = [
  { id: 'pg-landing-flowin', nom: 'Landing Flowin', statut: null, published: true, deploy_url: `${BASE}/landing`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-nds', nom: 'Landing NDS', statut: null, published: true, deploy_url: `${BASE}/nds`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-pro', nom: 'Pro (connexion)', statut: null, published: true, deploy_url: `${BASE}/pro`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-nds-pro', nom: 'NDS Pro (présentation)', statut: null, published: true, deploy_url: `${BASE}/nds-pro.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-nds-super-event-pro', nom: 'Super-event Pro (stats/gagnants)', statut: null, published: true, deploy_url: `${BASE}/nds-super-event-pro.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-nds-partenaire-presentation', nom: 'Partenaire (présentation)', statut: null, published: true, deploy_url: `${BASE}/nds-partenaire-presentation.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-flowin-partenaire-presentation', nom: 'Flowin partenaire', statut: null, published: true, deploy_url: `${BASE}/flowin-partenaire-presentation.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-pitch-nds', nom: 'Pitch NDS', statut: null, published: true, deploy_url: `${BASE}/pitch-nds.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-pro-nds-live', nom: 'Pro NDS live', statut: null, published: true, deploy_url: `${BASE}/pro-nds-live.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-prospection', nom: 'Prospection', statut: null, published: true, deploy_url: `${BASE}/prospection.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-demos', nom: 'Démos', statut: null, published: true, deploy_url: `${BASE}/demos.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
  { id: 'pg-carte', nom: 'Carte', statut: null, published: true, deploy_url: `${BASE}/carte.html`, accent_color: null, module_jeu: null, wa_number: null, created_at: null, updated_at: null },
]

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

  const avecUrl = useMemo(() => [...list.filter(l => l.deploy_url), ...PAGES_STATIQUES], [list])
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
        subtitle={`${list.length} landing${list.length > 1 ? 's' : ''} gérée${list.length > 1 ? 's' : ''} · ${enLigne} en ligne · ${avecUrl.length} pages prévisualisables au total`}
      />

      {!charge && avecUrl.length > 0 && (
        <div style={{ background: 'var(--sa-subtle)', borderRadius: 14, padding: '18px 14px', marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <PhoneApercu
            landing={courant}
            onPrev={() => setIdx(i => (i - 1 + avecUrl.length) % avecUrl.length)}
            onNext={() => setIdx(i => (i + 1) % avecUrl.length)}
            position={`${idx + 1} / ${avecUrl.length}${courant?.id.startsWith('pg-') ? ' · page de référence' : ' · landing gérée'}`}
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
