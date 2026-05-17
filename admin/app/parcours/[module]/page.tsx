'use client'
import { useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ParcoursRedirect() {
  const params = useParams()
  const searchParams = useSearchParams()
  const module = params?.module as string
  const ev = searchParams?.get('ev') || ''

  useEffect(() => {
    const validModules = ['quiz','spin','vote','tombola','quizsolo','quizmaster']
    const mod = validModules.includes(module) ? module : 'quiz'
    window.location.href = `/parcours/${mod}.html?ev=${ev}`
  }, [module, ev])

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#F8F0FF',fontFamily:'sans-serif'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>🎮</div>
        <div style={{fontWeight:700,color:'#1a1a2e'}}>Chargement du jeu...</div>
      </div>
    </div>
  )
}

export default function ParcoursPage() {
  return <Suspense fallback={null}><ParcoursRedirect /></Suspense>
}
