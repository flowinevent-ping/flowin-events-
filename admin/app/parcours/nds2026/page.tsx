import { fetchParcoursData } from '@/lib/parcours'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import NDS2026Client from './NDS2026Client'

/* Aucune mise en cache : la page doit refléter immédiatement la base (partenaires, lots, banques).
   Sans ceci, Next met les requêtes Supabase du serveur en cache et tout partenaire ajouté après
   le dernier build reste invisible dans le parcours jusqu'au redéploiement. */
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface Props { searchParams: { ev?: string; preview?: string; apercu?: string } }

export default async function QuizPage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  /* Apercu pendant la creation (lib/apercu.ts) : la saisie remplace nom, lots et contenu. */
  const data = await appliquerApercu(await fetchParcoursData(evId), lireApercu(searchParams))
  return <NDS2026Client {...data} evId={evId} />
}
