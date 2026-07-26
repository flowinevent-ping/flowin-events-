'use client'

/**
 * Feuille de route — avancement du chantier.
 *
 * Le contenu vit dans `lib/roadmap.ts`, source unique. Les compteurs sont DERIVES des
 * items, jamais saisis : un pourcentage ecrit a la main diverge du contenu des la
 * premiere ligne ajoutee.
 */
import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { BLOCS, MAJ, LIBELLE_ETAT, avancement, type EtatItem } from '@/lib/roadmap'

const COULEUR: Record<EtatItem, string> = {
  ok: '#2f7d4f',
  hold: '#b4791f',
  todo: 'var(--sa-muted)',
}

export default function Page() {
  const [filtre, setFiltre] = useState<'tous' | EtatItem>('tous')

  const global = useMemo(() => avancement(), [])

  const blocs = useMemo(
    () => BLOCS
      .map(b => ({ ...b, visibles: b.items.filter(i => filtre === 'tous' || i.etat === filtre) }))
      .filter(b => b.visibles.length > 0),
    [filtre]
  )

  return (
    <div className="sa-page">
      <PageHeader
        title="Feuille de route"
        subtitle={`État d'avancement du chantier Flowin · revue le ${MAJ}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 10 }}>
        {[
          { l: 'Terminé', v: `${global.fait} / ${global.total}` },
          { l: 'Avancement', v: `${global.pct} %` },
          { l: 'Restant', v: String(global.restant) },
        ].map(k => (
          <div key={k.l} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{k.v}</div>
            <div className="sa-muted" style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 3 }}>
              {k.l}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 9, background: 'var(--sa-border)', borderRadius: 6, overflow: 'hidden', margin: '2px 0 14px' }}>
        <div style={{ height: '100%', width: `${global.pct}%`, background: 'var(--sa-accent, #f4b544)' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {([['tous', 'Tout'], ['todo', 'À faire'], ['hold', 'En attente'], ['ok', 'Fait']] as const).map(([k, l]) => (
          <button key={k} className={`sa-btn sm${filtre === k ? ' primary' : ''}`} onClick={() => setFiltre(k)}>
            {l}
          </button>
        ))}
      </div>

      {blocs.map(b => {
        const fait = b.items.filter(i => i.etat === 'ok').length
        return (
          <div key={b.titre} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{b.titre}</div>
              <span className="sa-muted" style={{ fontSize: 11 }}>{fait}/{b.items.length}</span>
            </div>

            {b.visibles.map(i => (
              <div
                key={i.titre}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 9, marginBottom: 6,
                  background: 'var(--sa-card)', border: '1px solid var(--sa-border)',
                  opacity: i.etat === 'ok' ? 0.72 : 1,
                }}
              >
                <span
                  style={{
                    minWidth: 84, fontSize: 10, fontWeight: 700,
                    color: COULEUR[i.etat], whiteSpace: 'nowrap',
                  }}
                >
                  {LIBELLE_ETAT[i.etat]}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{i.titre}</div>
                  {i.detail && (
                    <div className="sa-muted" style={{ fontSize: 11, marginTop: 3, lineHeight: 1.45 }}>
                      {i.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
