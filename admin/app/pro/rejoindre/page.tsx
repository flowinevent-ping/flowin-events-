'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import ProShell from '@/components/pro/ProShell'
import RejoindreWizard from '@/components/pro/RejoindreWizard'

export default function RejoindrePage() {
  const router = useRouter()
  const [chargement, setChargement] = useState(true)
  const [proId, setProId] = useState('')
  const [proNom, setProNom] = useState('')
  const [supers, setSupers] = useState<SuperEvent[]>([])

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/pro/connexion'); return }
      const { data: pro } = await supabase.from('pros').select('id, nom, statut').eq('auth_id', session.session.user.id).maybeSingle()
      if (!pro || pro.statut !== 'valide') { router.push('/pro/connexion'); return }
      setProId(pro.id); setProNom(pro.nom)
      const se = await fetchSuperEvents()
      setSupers(se.filter(s => s.status !== 'past'))
      setChargement(false)
    })()
  }, [router])

  if (chargement) return null

  return (
    <ProShell proName={proNom} proId={proId} active="rejoindre">
      <RejoindreWizard proId={proId} proNom={proNom} supers={supers} />
    </ProShell>
  )
}
