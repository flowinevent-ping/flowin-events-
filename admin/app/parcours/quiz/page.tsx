import { redirect } from 'next/navigation'
import { fetchParcoursData } from '@/lib/parcours'
import { lireApercu, appliquerApercu } from '@/lib/apercu'
import QuizClient from './QuizClient'

interface Props { searchParams: { ev?: string; source?: string; preview?: string; apercu?: string } }

// Modules de parcours canoniques vers lesquels on peut rediriger sans risque de 404.
const KNOWN_MODULES = ['nds2026', 'spin', 'vote', 'tombola', 'quizmaster', 'quizsolo']

export default async function QuizPage({ searchParams }: Props) {
  const evId = searchParams.ev ?? ''
  if (!evId) return <div style={{display:'flex',height:'100dvh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:'#888'}}>Aucun event.</div>
  /* Apercu pendant la creation (lib/apercu.ts) : la saisie remplace nom, lots et contenu. */
  const data = await appliquerApercu(await fetchParcoursData(evId), lireApercu(searchParams))

  /* Garde-fou QR périmés : si l'event a un module canonique (ex. nds2026), il doit
     toujours s'afficher sur /parcours/<module> (écran brandé), même si un ancien QR
     pointe vers /parcours/quiz. Conserve le paramètre source (attribution réseaux). */
  const mod = data.ev?.module
  if (mod && mod !== 'quiz' && KNOWN_MODULES.includes(mod)) {
    const src = (searchParams.source ? `&source=${encodeURIComponent(searchParams.source)}` : '')
      + (searchParams.preview !== undefined ? '&preview=1' : '')
      + (searchParams.apercu ? `&apercu=${encodeURIComponent(searchParams.apercu)}` : '')
    redirect(`/parcours/${mod}?ev=${encodeURIComponent(evId)}${src}`)
  }

  return <QuizClient {...data} evId={evId} />
}
