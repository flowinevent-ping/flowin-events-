'use client'

/**
 * Front NDS — logos, fiche et bandeau des partenaires.
 *
 * Trois presences sont INDEPENDANTES et ne se deduisent pas l une de l autre :
 *   logo     — le partenaire a un visuel exploitable
 *   carte    — il a des coordonnees geographiques, donc un point sur la carte
 *   bandeau  — il a souscrit la formule qui l affiche sur le bandeau du front
 *
 * Un partenaire peut avoir un logo sans etre sur la carte, etre sur la carte sans
 * bandeau. Presenter un seul indicateur de completude masquerait exactement ce qui
 * manque et ou.
 */
import { useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'
import type { FlowinPartenaire } from '@/lib/types'

type Filtre = 'tous' | 'sans_logo' | 'sans_carte' | 'incomplets'

const aLogo = (p: FlowinPartenaire) => !!(p.image_url && p.image_url.trim())
const surCarte = (p: FlowinPartenaire) => {
  const r = p as FlowinPartenaire & { latitude?: number | null; longitude?: number | null }
  return r.latitude != null && r.longitude != null
}
const aFiche = (p: FlowinPartenaire) => !!(p.description && p.description.trim())

export default function Page() {
  const { partenaires, openDrawer } = useDashboard()
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState<Filtre>('tous')

  const kpis = useMemo(() => ({
    total: partenaires.length,
    logo: partenaires.filter(aLogo).length,
    carte: partenaires.filter(surCarte).length,
    fiche: partenaires.filter(aFiche).length,
  }), [partenaires])

  const filtres = useMemo(() => {
    const t = q.trim().toLowerCase()
    return partenaires.filter(p => {
      if (filtre === 'sans_logo' && aLogo(p)) return false
      if (filtre === 'sans_carte' && surCarte(p)) return false
      if (filtre === 'incomplets' && aLogo(p) && surCarte(p) && aFiche(p)) return false
      if (!t) return true
      return (p.nom ?? '').toLowerCase().includes(t)
    })
  }, [partenaires, q, filtre])

  const pastille = (ok: boolean, libelle: string) => (
    <span
      key={libelle}
      style={{
        fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
        border: `1px solid ${ok ? '#2f7d4f' : 'var(--sa-border)'}`,
        color: ok ? '#2f7d4f' : 'var(--sa-muted)',
      }}
    >
      {libelle}
    </span>
  )

  return (
    <div className="sa-page">
      <PageHeader
        title="Front NDS"
        subtitle="Logos, fiche et bandeau — état de complétude par partenaire"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginBottom: 14 }}>
        {[
          { l: 'Partenaires', v: kpis.total },
          { l: 'Avec logo', v: kpis.logo },
          { l: 'Sur la carte', v: kpis.carte },
          { l: 'Fiche remplie', v: kpis.fiche },
        ].map(k => (
          <div key={k.l} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 21, fontWeight: 800 }}>
              {k.v}{k.l !== 'Partenaires' && <span className="sa-muted" style={{ fontSize: 13 }}> / {kpis.total}</span>}
            </div>
            <div className="sa-muted" style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>
              {k.l}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        Logo, carte et fiche sont <b>indépendants</b> : un partenaire peut avoir un logo sans être placé
        sur la carte. Ces trois états sont affichés séparément plutôt que réduits à un pourcentage unique
        qui masquerait ce qui manque et où.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="sa-input"
          placeholder="Rechercher un partenaire…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        {([['tous', 'Tous'], ['sans_logo', 'Sans logo'], ['sans_carte', 'Hors carte'], ['incomplets', 'Incomplets']] as const).map(([k, l]) => (
          <button key={k} className={`sa-btn sm${filtre === k ? ' primary' : ''}`} onClick={() => setFiltre(k)}>
            {l}
          </button>
        ))}
      </div>

      {!filtres.length ? (
        <EmptyState icon="🎨" title="Aucun partenaire" desc="Aucun partenaire ne correspond à cette sélection." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 11 }}>
          {filtres.map(p => (
            <div key={p.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                {p.emoji && <span aria-hidden>{p.emoji}</span>}
                <button
                  type="button"
                  onClick={() => openDrawer('partenaire', p.id)}
                  style={{
                    background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, color: 'inherit', textAlign: 'left',
                  }}
                >
                  {p.nom}
                </button>
              </div>

              {aLogo(p) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.image_url as string}
                  alt={`Logo ${p.nom}`}
                  style={{ width: '100%', height: 70, objectFit: 'contain', marginBottom: 9, borderRadius: 8 }}
                />
              ) : (
                <div
                  style={{
                    height: 70, marginBottom: 9, borderRadius: 8,
                    border: '1px dashed var(--sa-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: 'var(--sa-muted)',
                  }}
                >
                  Aucun logo
                </div>
              )}

              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                {pastille(aLogo(p), 'Logo')}
                {pastille(surCarte(p), 'Carte')}
                {pastille(aFiche(p), 'Fiche')}
              </div>

              {p.description ? (
                <div className="sa-muted" style={{ fontSize: 11, lineHeight: 1.45 }}>
                  {p.description.length > 110 ? `${p.description.slice(0, 110)}…` : p.description}
                </div>
              ) : (
                <div className="sa-muted" style={{ fontSize: 11, fontStyle: 'italic' }}>
                  Fiche non renseignée
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
