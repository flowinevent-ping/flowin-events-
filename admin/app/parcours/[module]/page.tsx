import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import QuizFlow from '@/components/parcours/QuizFlow'
import QuizSoloFlow from '@/components/parcours/QuizSoloFlow'
import SpinFlow from '@/components/parcours/SpinFlow'
import VoteFlow from '@/components/parcours/VoteFlow'
import TombolaFlow from '@/components/parcours/TombolaFlow'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const VALID = ['quiz','spin','vote','tombola','quizsolo','quizmaster']

async function getEvent(evId: string, module: string) {
  const { data: events, error } = await supabase
    .from('events').select('*').eq('id', evId).limit(1)
  if (error || !events?.[0]) return null
  const ev = events[0]
  const { data: lots } = await supabase.from('lots').select('*').eq('event_id', evId)

  let questions: any[] = []
  if (['quiz','quizsolo','quizmaster'].includes(module) && ev.cfg?.quizBanques?.length) {
    const { data: banques } = await supabase
      .from('banques').select('questions').in('id', ev.cfg.quizBanques)
    banques?.forEach((b: any) => {
      if (Array.isArray(b.questions)) questions = questions.concat(b.questions)
    })
    const nb = ev.cfg?.nbQuestions || 5
    questions = questions.sort(() => Math.random() - .5).slice(0, nb)
  }
  return { ...ev, lots: lots || [], questions }
}

export async function generateMetadata({ params, searchParams }: {
  params: { module: string }
  searchParams: { ev?: string }
}): Promise<Metadata> {
  const evId = searchParams.ev
  if (!evId) return { title: 'Flowin' }
  const { data } = await supabase.from('events').select('nom,lieu,couleur').eq('id', evId).limit(1)
  const ev = data?.[0]
  if (!ev) return { title: 'Flowin' }
  return {
    title: ev.nom,
    description: `Participe à ${ev.nom} à ${ev.lieu} et tente de gagner !`,
    openGraph: { title: ev.nom, description: `Jeu gratuit · ${ev.lieu}`, type: 'website' }
  }
}

async function ParcoursContent({ module, evId }: { module: string; evId: string }) {
  const ev = await getEvent(evId, module)
  if (!ev) return notFound()

  if (module === 'quiz' || module === 'quizmaster') return <QuizFlow ev={ev} />
  if (module === 'quizsolo') return <QuizSoloFlow ev={ev} />
  if (module === 'spin')     return <SpinFlow ev={ev} />
  if (module === 'vote')     return <VoteFlow ev={ev} />
  if (module === 'tombola')  return <TombolaFlow ev={ev} />
  return notFound()
}

export default function ParcoursPage({ params, searchParams }: {
  params: { module: string }
  searchParams: { ev?: string }
}) {
  const { module } = params
  const evId = searchParams.ev

  if (!evId || !VALID.includes(module)) return notFound()

  return (
    <Suspense fallback={
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',background:'linear-gradient(160deg,#FBEAF0,#E8F8F2)'}}>
        <div style={{fontSize:48,animation:'pulse 1s infinite'}}>🎮</div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    }>
      <ParcoursContent module={module} evId={evId} />
    </Suspense>
  )
}
