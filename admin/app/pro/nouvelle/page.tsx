import { fetchProDashboard } from '@/lib/pro'
import { fetchBanquesPro } from '@/lib/banques'
import { fetchPacksParticipation } from '@/lib/commercial'
import { chargerSupersOuverts } from '@/lib/superEventsOuverts'
import ProShell from '@/components/pro/ProShell'
import OptionDesactivee from '@/components/pro/OptionDesactivee'
import { lireDroitsPro, peutOuvrirNouvelle } from '@/lib/droitsPro'
import ParcoursCreation, { type ProNouvelle } from '@/components/creation/ParcoursCreation'
import Configurateur, { type ProConfigurateur } from '@/components/creation/Configurateur'

export const dynamic = 'force-dynamic'

/**
 * NOUVELLE OPERATION — creer une animation, rejoindre un super event ou en
 * proposer un a Flowin : le parcours unique (components/creation/ParcoursCreation),
 * le meme que cote Super Admin. ?type=animation|rejoindre|demande ouvre
 * directement le parcours voulu (?type=super, ancien lien, ouvre la demande),
 * ?se=<id> preselectionne le super event a rejoindre.
 */
export default async function Page({ searchParams }: { searchParams: { pro?: string; type?: string; se?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, banques, packs, supers] = await Promise.all([
    fetchProDashboard(proId),
    fetchBanquesPro(proId),
    fetchPacksParticipation(),
    chargerSupersOuverts({ geocoder: true }),
  ])
  const p = data.pro as unknown as ProNouvelle | null
  if (!p) {
    return (
      <ProShell proName="Mon établissement" proId={proId} active="nouvelle">
        <div style={{ fontSize: 14 }}>Établissement introuvable.</div>
      </ProShell>
    )
  }
  /* DROITS donnes par le Super Admin (sql/06-droits-pro.sql). Colonne absente : tout est permis
     comme avant. Le menu et les cartes masquent l'option ; ici, l'acces DIRECT par l'adresse
     est aussi refuse, avec un message clair. La base refuse de toute facon l'ecriture. */
  const droits = await lireDroitsPro(proId)
  const demande = searchParams.type
  const refuse = !peutOuvrirNouvelle(droits)
    ? 'Nouvelle animation'
    : (demande === 'animation' && !droits.creer_animation) ? 'Créer une animation'
    : ((demande === 'rejoindre' || searchParams.se) && !droits.rejoindre_super_event) ? 'Rejoindre un super event'
    : (demande === 'super' && !droits.creer_super_event && !droits.rejoindre_super_event && !droits.creer_animation) ? 'Super event'
    : null
  if (refuse) {
    return (
      <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="nouvelle">
        <OptionDesactivee proId={proId} option={refuse} />
      </ProShell>
    )
  }
  const t = searchParams.type
  const type = t === 'animation' || t === 'rejoindre' ? t : t === 'super' ? (droits.creer_super_event ? 'super' as const : 'demande' as const) : t === 'demande' ? 'demande' as const : null
  /* Créer une animation : le configurateur en carrousel dicté par Romain le 10/11/2026 (components/creation/Configurateur). */
  if (type === 'animation' && !searchParams.se) {
    return (
      <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="nouvelle">
        <Configurateur pro={p as unknown as ProConfigurateur} banques={banques} />
      </ProShell>
    )
  }
  return (
    <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="nouvelle">
      <ParcoursCreation
        pro={p} banques={banques} supers={supers} packs={packs} droits={droits}
        typeInitial={searchParams.se ? 'rejoindre' : type} seInitial={searchParams.se ?? null}
      />
    </ProShell>
  )
}
