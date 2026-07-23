'use client'

/**
 * Stock des lots — vue Next.
 * Portage de renderNdsLots du monolithe, avec la correction de fond :
 * lots_stock.utilise ne passe a true qu au RETRAIT en caisse, jamais au tirage.
 * La vue lisait donc uniquement le stock et affichait "0 attribue" alors que des
 * gagnants existaient. On lit les DEUX sources : le stock et les tirages.
 */
import { useEffect, useState, useCallback } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import {
  fetchGagnantsPartenaire, fetchEtatPartenaire, confirmerGagnant,
  lienBillet, SE_DEFAUT,
  type GagnantPartenaire, type EtatPartenaire,
} from '@/lib/nds'

interface Ligne {
  id: string
  nom: string
  gagnants: GagnantPartenaire[]
  etat: EtatPartenaire
}

export default function Page() {
  const { partenaires, openDrawer } = useDashboard()
  const [lignes, setLignes] = useState<Ligne[] | null>(null)

  /* Seuls les partenaires dotes d au moins un lot nous interessent ici. */
  const dotes = partenaires.filter(p => Array.isArray(p.lots) && p.lots.length > 0)

  const charger = useCallback(async () => {
    const res = await Promise.all(
      dotes.map(async p => {
        const [gagnants, etat] = await Promise.all([
          fetchGagnantsPartenaire(p.id, SE_DEFAUT),
          fetchEtatPartenaire(p.id, SE_DEFAUT),
        ])
        return { id: p.id, nom: p.nom, gagnants, etat } as Ligne
      })
    )
    setLignes(res.filter(l => l.etat.tires > 0 || l.gagnants.length > 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partenaires.length])

  useEffect(() => { charger() }, [charger])

  async function onConfirmer(tirageId: number) {
    if (!confirm('Confirmer ce gagnant ?\n\nIl apparaîtra alors chez le commerçant et son nom s\'inscrira sur le billet.')) return
    if (!await confirmerGagnant(tirageId)) { alert('La confirmation a échoué.'); return }
    charger()
  }

  const total = (lignes ?? []).reduce(
    (acc, l) => ({
      tires: acc.tires + l.etat.tires,
      a_confirmer: acc.a_confirmer + l.etat.a_confirmer,
      confirmes: acc.confirmes + l.etat.confirmes,
      retires: acc.retires + l.etat.retires,
    }),
    { tires: 0, a_confirmer: 0, confirmes: 0, retires: 0 }
  )

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🎁 Stock des lots"
          subtitle="Gagnants tirés, confirmations et retraits en caisse"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
          {([['Gagnants tirés', total.tires], ['À appeler', total.a_confirmer],
             ['Confirmés', total.confirmes], ['Retirés en caisse', total.retires]] as [string, number][])
            .map(([lib, val]) => (
            <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: '16px 14px' }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{lib}</div>
            </div>
          ))}
        </div>

        {lignes === null && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {lignes?.length === 0 && <EmptyState title="Aucun gagnant tiré pour l'instant" />}

        {(lignes ?? []).map(l => (
          <div key={l.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button className="sa-btn sm" onClick={() => openDrawer('partenaire', l.id)} style={{ fontWeight: 800 }}>{l.nom}</button>
              <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>
                {l.etat.tires} tiré{l.etat.tires > 1 ? 's' : ''} · {l.etat.confirmes} confirmé{l.etat.confirmes > 1 ? 's' : ''} · {l.etat.retires} retiré{l.etat.retires > 1 ? 's' : ''}
              </span>
            </div>

            {l.etat.a_confirmer > 0 && (
              <div className="sa-alert warn" style={{ marginBottom: 10, fontSize: 12.5 }}>
                ☎ {l.etat.a_confirmer} gagnant{l.etat.a_confirmer > 1 ? 's' : ''} à appeler. Le partenaire ne les verra qu&apos;une fois confirmés.
              </div>
            )}

            {l.gagnants.map(g => (
              <div key={g.tirage_id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '7px 10px', background: 'var(--sa-subtle)', borderRadius: 9, marginBottom: 5 }}>
                <span style={{ flex: 1, minWidth: 150 }}>
                  <b style={{ fontSize: 13 }}>{g.etat === 'a_confirmer' ? 'À attribuer' : (g.joueur_nom ?? '—')}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}> · {g.lot_nom}</span>
                </span>
                <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11.5, fontWeight: 700, color: '#7C2D92' }}>{g.ticket_code ?? '—'}</span>
                <span className={`sa-chip ${g.etat === 'a_confirmer' ? 'past' : 'live'}`}>
                  {g.etat === 'retire' ? '✓ Retiré' : g.etat === 'confirme' ? '✓ Confirmé' : '☎ À appeler'}
                </span>
                {g.retrait_token && (
                  <a className="sa-btn sm" href={lienBillet(g.retrait_token, true)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>📄 Billet</a>
                )}
                {g.etat === 'a_confirmer' && (
                  <button className="sa-btn sm primary" onClick={() => onConfirmer(g.tirage_id)}>✓ Confirmer</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
