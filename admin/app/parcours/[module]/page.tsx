import { supabase } from '@/lib/supabase'
import QuizFlow from '@/components/parcours/QuizFlow'
import SpinFlow from '@/components/parcours/SpinFlow'
import VoteFlow from '@/components/parcours/VoteFlow'
import TombolaFlow from '@/components/parcours/TombolaFlow'
import { notFound } from 'next/navigation'

const VALID = ['quiz','spin','vote','tombola','quizsolo','quizmaster']

async function fetchEvent(evId: string, module: string) {
  const { data: events } = await supabase.from('events').select('*').eq('id', evId).limit(1)
  if (!events?.[0]) return null
  const ev = events[0]
  const { data: lots } = await supabase.from('lots').select('*').eq('event_id', evId)

  let questions: any[] = []
  if (module === 'quiz' && ev.cfg?.quizBanques?.length) {
    const { data: banques } = await supabase.from('banques').select('questions').in('id', ev.cfg.quizBanques)
    banques?.forEach((b: any) => { if (Array.isArray(b.questions)) questions = questions.concat(b.questions) })
    const nb = ev.cfg?.nbQuestions || 5
    questions = questions.sort(() => Math.random() - .5).slice(0, nb)
  }
  return { ...ev, lots: lots || [], questions }
}

export default async function ParcoursPage({ params, searchParams }: {
  params: { module: string }
  searchParams: { ev?: string }
}) {
  const evId = searchParams.ev
  const module = params.module
  if (!evId || !VALID.includes(module)) return notFound()

  const ev = await fetchEvent(evId, module)
  if (!ev) return notFound()

  if (module === 'quiz')    return <QuizFlow ev={ev} />
  if (module === 'spin')    return <SpinFlow ev={ev} />
  if (module === 'vote')    return <VoteFlow ev={ev} />
  if (module === 'tombola') return <TombolaFlow ev={ev} />

  // quizsolo, quizmaster → quiz flow avec variantes
  return <QuizFlow ev={ev} />
}
