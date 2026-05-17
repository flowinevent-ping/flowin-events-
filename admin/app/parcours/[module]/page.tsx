import { supabase } from '@/lib/supabase'
import QuizFlow from '@/components/parcours/QuizFlow'
import { notFound } from 'next/navigation'

interface Props { searchParams: { ev?: string } }

async function fetchEvent(evId: string) {
  const { data: events } = await supabase
    .from('events').select('*').eq('id', evId).limit(1)
  if (!events || !events[0]) return null
  const ev = events[0]

  // Lots
  const { data: lots } = await supabase
    .from('lots').select('id,titre,emoji,valeur_euros,partenaire_id').eq('event_id', evId)

  // Banque de questions
  let questions: any[] = []
  if (ev.cfg?.quizBanques && ev.cfg.quizBanques.length > 0) {
    const { data: banques } = await supabase
      .from('banques').select('questions').in('id', ev.cfg.quizBanques)
    if (banques) {
      banques.forEach((b: any) => {
        if (Array.isArray(b.questions)) questions = questions.concat(b.questions)
      })
    }
  }

  // Shuffle + limiter
  const nbQ = ev.cfg?.nbQuestions || 5
  questions = questions.sort(()=>Math.random()-.5).slice(0, nbQ)

  return { ...ev, lots: lots||[], questions }
}

export default async function ParcoursPage({ params, searchParams }: { params: { module: string }, searchParams: { ev?: string } }) {
  const evId = searchParams.ev
  if (!evId) return notFound()

  const ev = await fetchEvent(evId)
  if (!ev) return notFound()

  const module = params.module

  // Pour l'instant, le quiz est le seul module natif Next.js
  // Les autres redirigent vers leur HTML statique
  if (module === 'quiz') {
    return <QuizFlow ev={ev} />
  }

  // Autres modules → HTML statique
  return (
    <meta httpEquiv="refresh" content={`0;url=/public/parcours/${module}.html?ev=${evId}`} />
  )
}
