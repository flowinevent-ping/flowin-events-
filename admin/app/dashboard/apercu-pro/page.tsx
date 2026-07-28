'use client'

import { useState, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SearchBar, EmptyState } from '@/components/dashboard/DashboardUI'

/**
 * Apercu Pro -- remplace le simulateur "Voir comme -> PRO" du monolithe, explicitement juge
 * obsolete par Romain. Retravaillee (28/07/2026) suite a son retour sur cette page precise :
 * "il y a des erreurs -- ce ne sont pas tous des pros", "trop d'informations, pas ludique",
 * "mets les logos", "range par type de classification".
 *
 * Corrections apportees :
 * 1. Exclusion des 4 comptes techniques secteur='station-festival' (pro-nds-bar/caisses/ecrans/
 *    tablette) -- 0 events chacun, stubs herites de l'ancienne infra, pas de vrais partenaires.
 *    Verifie en base avant de filtrer (pas une supposition).
 * 2. Logos : `pros` n'a pas de logo propre, mais `pros.partenaire_id` renvoie vers `partenaires`
 *    qui a `image_url`. Jointure faite ici cote client (les deux jeux de donnees sont deja
 *    charges par le layout SA / DashboardContext, aucun nouvel appel reseau).
 * 3. Regroupement par `secteur` (Collectivite, Association, Institution, Commerce & Negoce...)
 *    au lieu d'une seule grille plate de 16 cartes identiques.
 * 4. Cartes allegees : logo + nom + ville seulement, le reste (secteur, id technique) passe
 *    en toute petite mention ou est retire de la vue -- moins de texte par carte.
 */
const SECTEURS_TECHNIQUES = new Set(['station-festival'])

export default function Page() {
  const { pros, partenaires } = useDashboard()
  const [search, setSearch] = useState('')

  const logoParPartenaireId = useMemo(() => {
    const m = new Map<string, string>()
    partenaires.forEach(pa => { if (pa.id && pa.image_url) m.set(pa.id, pa.image_url) })
    return m
  }, [partenaires])

  const groupes = useMemo(() => {
    const base = pros.filter(p => !SECTEURS_TECHNIQUES.has(p.secteur))
    const q = search.trim().toLowerCase()
    const filtres = q
      ? base.filter(p => (p.nom ?? '').toLowerCase().includes(q) || (p.ville ?? '').toLowerCase().includes(q) || (p.id ?? '').toLowerCase().includes(q))
      : base
    const parSecteur = new Map<string, typeof filtres>()
    filtres.forEach(p => {
      const s = p.secteur || 'Autre'
      if (!parSecteur.has(s)) parSecteur.set(s, [])
      parSecteur.get(s)!.push(p)
    })
    return Array.from(parSecteur.entries())
      .map(([secteur, items]) => ({ secteur, items: items.sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [pros, search])

  const total = groupes.reduce((n, g) => n + g.items.length, 0)
  const nTechniques = pros.filter(p => SECTEURS_TECHNIQUES.has(p.secteur)).length

  return (
    <div className="sa-content">
      <div className="sa-page" style={{ marginBottom: 16 }}>
        <PageHeader title="👁 Aperçu Pro" subtitle="Prototype de validation + accès direct aux vrais dashboards partenaires" />
        <div style={{ padding: '0 24px 20px' }}>
          <a
            href="/schemas/flowin-pro-navigation.html"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
              background: 'linear-gradient(135deg,#FBEAF0,#fff)', border: '1px solid #F4C0D5',
              borderRadius: 12, padding: '14px 16px',
            }}
          >
            <span style={{ fontSize: 22 }}>🧭</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#9F1A4D' }}>Prototype navigable — desktop / tablette / mobile</div>
              <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginTop: 2 }}>
                Onglets cliquables, données réelles, pour valider un parcours avant de le porter dans le code.
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9F1A4D', flexShrink: 0 }}>Ouvrir →</span>
          </a>
        </div>
      </div>

      <div className="sa-page">
        <PageHeader title="🤝 Dashboards des pros" subtitle={`${total} compte${total > 1 ? 's' : ''} — ouvre le vrai dashboard, en direct`} />
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un pro (nom, ville)…" />

        {nTechniques > 0 && (
          <div style={{ margin: '0 24px 16px', fontSize: 11.5, color: 'var(--sa-muted)' }}>
            {nTechniques} compte{nTechniques > 1 ? 's' : ''} technique{nTechniques > 1 ? 's' : ''} (stations festival internes) masqué{nTechniques > 1 ? 's' : ''} — ce ne sont pas des partenaires.
          </div>
        )}

        <div style={{ padding: '0 24px 24px' }}>
          {groupes.length === 0 && <EmptyState title="Aucun résultat" />}
          {groupes.map(g => (
            <div key={g.secteur} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--sa-muted)', marginBottom: 10 }}>
                {g.secteur} <span style={{ fontWeight: 600 }}>· {g.items.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                {g.items.map(p => {
                  const logo = p.partenaire_id ? logoParPartenaireId.get(p.partenaire_id) : null
                  return (
                    <a
                      key={p.id}
                      href={`/pro?pro=${encodeURIComponent(p.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      title={p.id}
                      style={{
                        textDecoration: 'none', color: 'inherit', border: '1px solid var(--sa-border)',
                        borderRadius: 12, padding: '12px', background: 'var(--sa-card)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      {logo ? (
                        <img src={logo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: '#fff', border: '1px solid var(--sa-border)', flexShrink: 0 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--sa-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: 'var(--sa-muted)', flexShrink: 0 }}>
                          {(p.nom || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom || 'Sans nom'}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--sa-muted)' }}>{p.ville || '—'}</div>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
