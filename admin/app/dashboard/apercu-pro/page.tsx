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
 *
 * 27/10 : le bandeau du haut pointait vers /schemas/flowin-pro-navigation.html, un prototype
 * statique fige au 20/10 -- il ne refletait deja plus la refonte de NouvelleOperation (PR #30).
 * C'est exactement ce decalage maquette/code reel qui a fait croire a Romain qu'il avait deja
 * vu le nouveau parcours pro. Remplace par un acces direct a /pro/nouvelle (le vrai parcours de
 * creation, celui de NouvelleOperation.tsx), pour Event comme pour Super Event -- jamais une
 * copie figee. Le fichier du prototype n'est pas supprime (archive), seul le lien disparait.
 */
const SECTEURS_TECHNIQUES = new Set(['station-festival'])

export default function Page() {
  const { pros, partenaires } = useDashboard()
  const [search, setSearch] = useState('')
  const [proParcours, setProParcours] = useState('')

  const prosOuverts = useMemo(
    () => pros.filter(p => !SECTEURS_TECHNIQUES.has(p.secteur)).slice().sort((a, b) => (a.nom || '').localeCompare(b.nom || '')),
    [pros]
  )

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
        <PageHeader title="Aperçu Pro" subtitle="Accès direct aux vrais dashboards partenaires et à leur parcours de création, en direct depuis le code actuel" />
        <div style={{ padding: '0 24px 20px' }}>
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
              border: '1px solid var(--sa-border)', borderRadius: 12, padding: '14px 16px', background: 'var(--sa-card)',
            }}
          >
            <div style={{ flex: '1 1 240px', minWidth: 220 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Voir le parcours de création, en direct</div>
              <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginTop: 2 }}>
                Choisissez un pro pour ouvrir son vrai écran de création — le code actuel, jamais une maquette.
              </div>
            </div>
            <select
              value={proParcours}
              onChange={e => setProParcours(e.target.value)}
              style={{ minWidth: 220, padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--sa-border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--sa-card)', color: 'var(--sa-text)' }}
            >
              <option value="">Choisir un pro…</option>
              {prosOuverts.map(p => (
                <option key={p.id} value={p.id}>{p.nom || p.id}{p.ville ? ` — ${p.ville}` : ''}</option>
              ))}
            </select>
            <a
              className="sa-btn sm"
              href={proParcours ? `/pro/nouvelle?pro=${encodeURIComponent(proParcours)}&type=animation` : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!proParcours}
              style={!proParcours ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
            >
              Voir le parcours Event
            </a>
            <a
              className="sa-btn sm"
              href={proParcours ? `/pro/nouvelle?pro=${encodeURIComponent(proParcours)}&type=super` : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!proParcours}
              style={!proParcours ? { opacity: 0.4, pointerEvents: 'none' } : undefined}
            >
              Voir le parcours Super Event
            </a>
          </div>
        </div>
      </div>

      <div className="sa-page">
        <PageHeader title="Dashboards des pros" subtitle={`${total} compte${total > 1 ? 's' : ''} — ouvre le vrai dashboard, en direct`} />
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
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
                        borderRadius: 14, padding: '16px 12px', background: 'var(--sa-card)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10,
                      }}
                    >
                      {logo ? (
                        <img src={logo} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'contain', background: '#fff', border: '1px solid var(--sa-border)', flexShrink: 0 }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--sa-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, color: 'var(--sa-muted)', flexShrink: 0 }}>
                          {(p.nom || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0, width: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom || 'Sans nom'}</div>
                        <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginTop: 2 }}>{p.ville || '—'}</div>
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
