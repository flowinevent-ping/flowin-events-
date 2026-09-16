'use client'

/**
 * CONTROLE — l etat du projet en un ecran, sans relire le code.
 *
 * Chaque ligne compte les elements en defaut pour une erreur deja rencontree
 * (jeux vides, QR manquants, lots hors table, stations sans GPS, pros sans
 * fiche commerce...). 0 = sain. Un clic ouvre l element a corriger.
 * Source unique : RPC controle_incoherences() (sql/controle_incoherences.sql).
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import { useDashboard } from '@/contexts/DashboardContext'

interface Controle {
  cle: string
  libelle: string
  cible: 'events' | 'pros' | 'partenaires' | 'tirages' | 'demandes' | 'super_events'
  n: number
  exemples: { id: string; nom: string | null }[]
}

const PAGE_CIBLE: Partial<Record<Controle['cible'], string>> = {
  tirages: '/dashboard/gagnants',
  demandes: '/dashboard/demandes-rattachement',
  super_events: '/dashboard/super-events',
}

export default function Page() {
  const router = useRouter()
  const { openDrawer } = useDashboard()
  const [liste, setListe] = useState<Controle[] | null>(null)
  const [ouvert, setOuvert] = useState<string>('')
  const [maj, setMaj] = useState<Date | null>(null)

  const charger = () => {
    setListe(null)
    supabase.rpc('controle_incoherences').then(({ data, error }) => {
      if (error) console.error('[controle]', error.message)
      setListe((data as Controle[]) ?? [])
      setMaj(new Date())
    })
  }
  useEffect(charger, [])

  const ouvrir = (c: Controle, id: string) => {
    if (c.cible === 'events') openDrawer('event', id)
    else if (c.cible === 'pros') openDrawer('pro', id)
    else if (c.cible === 'partenaires') openDrawer('partenaire', id)
    else if (PAGE_CIBLE[c.cible]) router.push(PAGE_CIBLE[c.cible]!)
  }

  const enDefaut = (liste ?? []).filter(c => c.n > 0).length

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🩺 Contrôle"
          subtitle={liste === null ? 'Chargement…'
            : `${enDefaut} contrôle${enDefaut > 1 ? 's' : ''} en défaut sur ${liste.length}${maj ? ` · relevé à ${maj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
          actions={<button className="sa-btn sm" onClick={charger}>↻ Relancer</button>}
        />
        <div style={{ padding: '8px 24px 24px' }}>
          {(liste ?? []).map(c => (
            <div key={c.cle} style={{ borderBottom: '1px solid var(--sa-border)' }}>
              <div
                onClick={() => c.n > 0 && setOuvert(o => (o === c.cle ? '' : c.cle))}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', cursor: c.n > 0 ? 'pointer' : 'default' }}
              >
                <span style={{
                  minWidth: 38, textAlign: 'center', fontWeight: 800, fontSize: 13, borderRadius: 99, padding: '3px 10px',
                  background: c.n ? 'rgba(245,158,11,.13)' : 'rgba(34,197,94,.12)', color: c.n ? '#B45309' : '#15803D',
                }}>{c.n ? c.n : '✓'}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{c.libelle}</span>
                {c.n > 0 && <span className="sa-muted" style={{ fontSize: 12 }}>{ouvert === c.cle ? '▲' : '▼'}</span>}
              </div>
              {ouvert === c.cle && (
                <div style={{ padding: '0 0 12px 50px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {c.exemples.map(x => (
                    <button key={x.id} className="sa-btn sm" onClick={() => ouvrir(c, x.id)} title={x.id}>
                      {x.nom || x.id} →
                    </button>
                  ))}
                  {c.n > c.exemples.length && (
                    <span className="sa-muted" style={{ fontSize: 12, alignSelf: 'center' }}>… et {c.n - c.exemples.length} autre(s)</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
