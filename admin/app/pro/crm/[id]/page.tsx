import { fetchOperationsPro } from '@/lib/operations'
import { fetchJoueurTiragesPro } from '@/lib/dashboard'
import ProShell from '@/components/pro/ProShell'
import FicheContactPro from '@/components/pro/FicheContactPro'

/**
 * Fiche contact du CRM pro (28/07, reprise 16/09 nuit) : coordonnees, origines, operations jouees, parties,
 * lots gagnes, et contact direct (email, appel, SMS, WhatsApp).
 * Securite 23/11/2026 : le contact (crm_pro) est lu dans le navigateur avec la session du pro
 * (components/pro/FicheContactPro.tsx) ; le serveur ne charge ici que le cadre et les tirages du joueur
 * (pro_tirages_joueur : lots, sans coordonnees).
 */
export default async function FicheJoueurProPage({ params, searchParams }: { params: { id: string }; searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [ops, tousTirages] = await Promise.all([fetchOperationsPro(proId), fetchJoueurTiragesPro(proId, params.id)])
  const proNom = ops.proNom ?? 'Mon établissement'
  return (
    <ProShell proName={proNom} proId={proId} active="crm">
      <FicheContactPro proId={proId} proNom={proNom} joueurId={params.id} partenaireId={ops.partenaire?.id ?? null} tousTirages={tousTirages} />
    </ProShell>
  )
}
