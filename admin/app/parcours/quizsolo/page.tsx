import { fetchParcoursData } from '@/lib/parcours'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import QuizsoloClient from './QuizsoloClient'

interface Props { searchParams: { ev?: string; preview?: string; apercu?: string } }

export default async function Page({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  /* Apercu pendant la creation (lib/apercu.ts) : la saisie remplace nom, lots et contenu. */
  const data = await appliquerApercu(await fetchParcoursData(evId), lireApercu(searchParams))
  return <QuizsoloClient {...data} evId={evId} />
}
