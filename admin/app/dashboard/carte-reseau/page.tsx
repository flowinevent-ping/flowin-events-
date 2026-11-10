'use client'

/** Carte du réseau (super admin, audit lot H) : tous les commerces partenaires géolocalisés. */
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/dashboard/DashboardUI'
import CarteCommerces from '@/components/carte/CarteCommerces'
import { fetchCarteReseauSA, type CommerceCarte } from '@/lib/carteReseau'

export default function PageCarteReseau() {
  const [l, setL] = useState<CommerceCarte[] | null>(null)
  useEffect(() => { fetchCarteReseauSA().then(setL) }, [])
  return (
    <div>
      <PageHeader title="Carte du réseau" subtitle="Les commerces partenaires géolocalisés. Touchez un point pour voir sa fiche." />
      {l === null ? <div style={{ fontSize: 13, color: '#5a6b80' }}>Chargement…</div> : <CarteCommerces commerces={l} mode="sa" />}
    </div>
  )
}
