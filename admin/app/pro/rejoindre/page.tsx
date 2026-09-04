'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'
import ProShell from '@/components/pro/ProShell'
import RejoindreWizard from '@/components/pro/RejoindreWizard'

/**
 * REJOINDRE UN SUPER EVENT.
 *
 * Cette page exigeait une session Supabase Auth. Aucun des 16 pros n a
 * d `auth_id` : elle redirigeait donc TOUJOURS vers /pro/connexion, et le
 * parcours en 8 etapes qu elle porte n a jamais pu s ouvrir pour personne.
 *
 * Elle accepte desormais `?pro=<id>`, exactement comme /pro/jeu le fait deja.
 * Ce n est pas un contournement invente pour l occasion : c est le meme
 * mecanisme, sur la meme surface, en attendant les comptes.
 *
 * A FERMER EN MEME TEMPS QUE /pro/jeu quand les comptes pro existeront : les
 * deux pages ouvrent l espace d un pro a qui connait son identifiant. C est le
 * constat 2 de docs/audit-parcours.html, et il vaut maintenant pour deux pages
 * au lieu d une. La session reste le chemin normal — le parametre n est lu que
 * lorsqu il n y a pas de session.
 */
function RejoindreContenu() {
  const router = useRouter()
  const params = useSearchParams()
  const [chargement, setChargement] = useState(true)
  const [proId, setProId] = useState('')
  const [proNom, setProNom] = useState('')
  const [supers, setSupers] = useState<SuperEvent[]>([])

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession()
      const proParam = params.get('pro') ?? ''

      /* La session d abord : c est le chemin normal. Le parametre ne sert que
         lorsqu il n y en a pas — sinon il permettrait a un pro connecte d agir
         sous l identite d un autre. */
      const { data: pro } = session.session
        ? await supabase.from('pros').select('id, nom, statut').eq('auth_id', session.session.user.id).maybeSingle()
        : proParam
          ? await supabase.from('pros').select('id, nom, statut').eq('id', proParam).maybeSingle()
          : { data: null }

      if (!pro) { router.push('/pro/connexion'); return }
      if (pro.statut !== 'valide') { router.push('/pro/connexion'); return }
      setProId(pro.id); setProNom(pro.nom)
      const se = await fetchSuperEvents()
      setSupers(se.filter(s => s.status !== 'past'))
      setChargement(false)
    })()
  }, [router, params])

  if (chargement) return null

  return (
    <ProShell proName={proNom} proId={proId} active="rejoindre">
      <RejoindreWizard proId={proId} proNom={proNom} supers={supers} />
    </ProShell>
  )
}

/* useSearchParams impose une frontiere Suspense au build (bailout CSR), comme
   sur /dashboard/wizard-event. */
export default function RejoindrePage() {
  return (
    <Suspense fallback={null}>
      <RejoindreContenu />
    </Suspense>
  )
}
