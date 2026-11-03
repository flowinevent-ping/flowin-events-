'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchDemandesRappel, type DemandeRappel } from '@/lib/demandesRappel'
import { Ico } from '@/lib/proicons'

/** Alerte Super Admin : demandes de rappel pas encore traitées. Rien à l'écran s'il n'y en a pas. */
export default function AlerteRappels() {
  const router = useRouter()
  const [l, setL] = useState<DemandeRappel[] | null>(null)
  useEffect(() => { fetchDemandesRappel().then(r => setL(r.filter(x => x.statut === 'nouvelle'))) }, [])
  if (!l || l.length === 0) return null
  return (
    <div className="sa-alert live texte" style={{ marginBottom: 14 }} data-alerte-rappels>
      <div style={{ fontWeight: 800, marginBottom: 6 }}><Ico k="bell" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />{l.length} demande{l.length > 1 ? 's' : ''} de rappel à traiter</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontWeight: 500 }}>
        {l.slice(0, 4).map(d => <div key={d.id}><b>{d.prenom} {d.nom}</b> ({d.entreprise}, {d.ville}) · <a href={`tel:${d.tel}`}>{d.tel}</a></div>)}
        {l.length > 4 && <div>… et {l.length - 4} de plus.</div>}
      </div>
      <button className="sa-btn sm primary" style={{ marginTop: 8 }} onClick={() => router.push('/dashboard/demandes-rappel')}>Ouvrir les demandes</button>
    </div>
  )
}
