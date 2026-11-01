import { fetchParcoursData } from '@/lib/parcours'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import AnimationIndisponible from '@/components/parcours/AnimationIndisponible'
import { motifIndisponible } from '@/lib/etatAnimation'
import { versBonJeuSiAutre } from '@/lib/masters/redirection'
import QuizmasterClient from './QuizmasterClient'

interface Props { searchParams: { ev?: string; preview?: string; apercu?: string } }

export default async function Page({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  /* Apercu pendant la creation (lib/apercu.ts) : la saisie remplace nom, lots et contenu. */
  const data = await appliquerApercu(await fetchParcoursData(evId), lireApercu(searchParams))
  /* QR vers une animation inexistante / terminee / a venir : message clair (audit QR 01/11 : cette route ne le faisait pas). */
  const motif = motifIndisponible(data.ev as { status?: string; date_d?: string | null; date_f?: string | null; module?: string | null } | null, searchParams)
  if (motif) return <AnimationIndisponible motif={motif} nom={data.ev?.nom} debut={data.ev?.date_d} />
  /* Ancien QR d'un autre jeu : renvoi vers le jeu actuel de l'animation. */
  versBonJeuSiAutre('quizmaster', evId, data.ev?.module, searchParams as Record<string, string | undefined>)
  return <QuizmasterClient {...data} evId={evId} />
}
