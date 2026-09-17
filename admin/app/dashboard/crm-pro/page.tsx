'use client'

/**
 * CRM pro (17/09) — manquait cote SA : le CRM complet d'un pro, toutes ses
 * operations confondues (lib/crmPro, deja construit pour /pro/donnees), n
 * etait accessible au SA qu en ouvrant l espace pro depuis la fiche
 * partenaire (« Compte pro lie -> Ouvrir »). Meme composant CrmPro, memes
 * relances email/SMS/export CSV, ici avec un selecteur de pro en tete.
 */
import { useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import { fetchOperationsPro, libelleDates, type OperationsPro } from '@/lib/operations'
import { fetchCrmPro, type ContactPro } from '@/lib/crmPro'
import { groupesChoix } from '@/lib/rangementOperations'
import CrmPro from '@/components/pro/CrmPro'

export default function Page() {
  const { pros } = useDashboard()
  const [proId, setProId] = useState('')
  const [ops, setOps] = useState<OperationsPro | null>(null)
  const [contacts, setContacts] = useState<ContactPro[]>([])
  const [charge, setCharge] = useState(false)

  const prosTries = [...pros].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  useEffect(() => {
    if (!proId) { setOps(null); setContacts([]); return }
    let vivant = true
    setCharge(true)
    Promise.all([fetchOperationsPro(proId), fetchCrmPro(proId)])
      .then(([o, c]) => { if (vivant) { setOps(o); setContacts(c) } })
      .finally(() => { if (vivant) setCharge(false) })
    return () => { vivant = false }
  }, [proId])

  const choix = ops ? groupesChoix(ops.operations, o => libelleDates(o.dateD, o.dateF)) : []

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="CRM pro"
          subtitle="Le CRM complet d'un pro, toutes ses opérations confondues — même vue que lui"
          actions={
            <select className="sa-input" value={proId} onChange={e => setProId(e.target.value)}>
              <option value="">Choisir un pro…</option>
              {prosTries.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          }
        />

        {!proId && <EmptyState title="Choisissez un pro" desc="Sélectionnez un pro ci-dessus pour voir son CRM complet." />}
        {proId && charge && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {proId && !charge && ops && (
          <CrmPro
            proId={proId} proNom={ops.proNom ?? ''} contacts={contacts}
            operations={choix.flatMap(g => g.ops)} operationInitiale={null}
          />
        )}
      </div>
    </div>
  )
}
