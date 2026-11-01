import { fetchParcoursData } from '@/lib/parcours'
import AnimationIndisponible from '@/components/parcours/AnimationIndisponible'
import { motifIndisponible } from '@/lib/etatAnimation'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import { versMasterSiBesoin, versBonJeuSiAutre } from '@/lib/masters/redirection'
import VoteClient from './VoteClient'

interface Props { searchParams: { ev?: string; preview?: string; apercu?: string } }

export default async function Page({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  /* Apercu pendant la creation (lib/apercu.ts) : la saisie remplace nom, lots et contenu. */
  const data = await appliquerApercu(await fetchParcoursData(evId), lireApercu(searchParams))
  /* QR vers une animation inexistante / terminee / a venir : message clair (verification 01/11). */
  const motif = motifIndisponible(data.ev as { status?: string; date_d?: string | null; date_f?: string | null; module?: string | null } | null, searchParams)
  if (motif) return <AnimationIndisponible motif={motif} nom={data.ev?.nom} debut={data.ev?.date_d} />
  /* Animation sur un master de jeu : parcours /jouer (lib/masters). */
  versBonJeuSiAutre('vote', evId, data.ev?.module, searchParams as Record<string, string | undefined>)
  versMasterSiBesoin(evId, data.ev?.cfg, searchParams as Record<string, string | undefined>, data.ev?.module)
  return <VoteClient {...data} evId={evId} />
}
