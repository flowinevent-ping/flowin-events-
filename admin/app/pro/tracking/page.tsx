import { fetchOperationsPro } from '@/lib/operations'
import ProShell from '@/components/pro/ProShell'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { CARD, MUTED, H1, SUB } from '@/lib/proui'

/**
 * Tracking liens & QR — un bloc par operation, cloisonne au pro.
 *
 * Le bandeau precedent interrogeait `data.events.find(e => e.super_event_id)` :
 * le premier super event venu, souvent le gabarit master. D ou « 0 flash »
 * au-dessus de 12 visiteurs (famille D). Chaque bloc interroge maintenant SON
 * operation : station_tracking pour un super event, evenement_tracking pour
 * un event autonome.
 */
export default async function ProTrackingPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const ops = await fetchOperationsPro(proId)
  return (
    <ProShell proName={ops.proNom ?? 'Mon établissement'} proId={proId} active="tracking">
      <h1 style={H1}>Tracking liens &amp; QR</h1>
      <div style={{ ...SUB, marginBottom: 16 }}>D&apos;où viennent vos joueurs, opération par opération — vos points uniquement.</div>
      <div style={{ ...CARD, background: '#F8FAFC', fontSize: 12, ...MUTED, lineHeight: 1.6 }}>
        <b>Flash</b> — une ouverture du QR, pas une personne. <b>Physique</b> — QR affiche/forex/écran. <b>Digital</b> — lien partagé.
        Chiffres bornés à vos propres points — le bilan complet d&apos;un super event reste chez l&apos;organisateur.
      </div>
      <OngletOperationsPro initial={ops} onglet="tracking" prefixeStation="/pro/super/" />
    </ProShell>
  )
}
