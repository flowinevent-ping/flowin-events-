'use client'

/**
 * Fiche complète du pro CONNECTÉ (sécurité pros, 21/11/2026).
 * La table `pros` n'est plus lisible avec la clé publique : le rendu serveur ne reçoit que la fiche publique
 * (nom, ville, secteur, partenaire, droits ; aucune coordonnée). Les écrans qui pré-remplissent les
 * coordonnées du pro (Mon profil, Nouvelle animation) rechargent donc ici sa fiche COMPLÈTE avec sa session
 * (politique pros_self_select). Sans session : l'écran garde la fiche publique reçue du serveur.
 */
import { useEffect, useState, type ComponentProps } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CARD } from '@/lib/proui'
import EntrepriseForm from '@/components/pro/EntrepriseForm'
import ParcoursCreation from '@/components/creation/ParcoursCreation'
import Configurateur from '@/components/creation/Configurateur'

type Etat<T> = { fiche: T; pret: boolean; session: boolean }

/** Charge la fiche complète du pro connecté (celle dont `id` est `initial.id`). Jamais d'erreur : en cas d'échec, `initial`. */
function useFichePleine<T extends { id: string }>(initial: T): Etat<T> {
  const [etat, setEtat] = useState<Etat<T>>({ fiche: initial, pret: false, session: false })
  useEffect(() => {
    let fini = false
    ;(async () => {
      let session = false
      let fiche = initial
      try {
        const { data: s } = await supabase.auth.getSession()
        session = !!s.session?.user?.id
        if (session) {
          const { data } = await supabase.from('pros').select('*').eq('id', initial.id).maybeSingle()
          if (data) fiche = { ...initial, ...(data as object) } as T
        }
      } catch { /* sans session ou hors ligne : fiche publique */ }
      if (!fini) setEtat({ fiche, pret: true, session })
    })()
    return () => { fini = true }
  }, [initial.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return etat
}

const CHARGEMENT = <div style={{ ...CARD, fontSize: 14 }}>Chargement…</div>

/** Mon profil, onglet Entreprise. */
export function EntrepriseFormPleine({ initial, avecFicheEntreprise = false }: { initial: ComponentProps<typeof EntrepriseForm>['initial']; avecFicheEntreprise?: boolean }) {
  const { fiche, pret, session } = useFichePleine(initial)
  if (!pret) return CHARGEMENT
  /* Sans session (lien ?pro= seul), les coordonnées ne sont pas lisibles : jamais un formulaire vide qui laisserait croire à une perte. */
  if (!session && !('email' in fiche)) {
    return (
      <div style={CARD}>
        <div style={{ fontSize: 14, marginBottom: 10 }}>Connectez-vous pour voir et modifier les coordonnées de votre établissement.</div>
        <Link href="/pro/connexion" style={{ fontWeight: 800, fontSize: 14 }}>Me connecter</Link>
      </div>
    )
  }
  return <EntrepriseForm key="pleine" initial={fiche} avecFicheEntreprise={avecFicheEntreprise || 'siren' in fiche} />
}

/** Nouvelle animation : configurateur ou parcours de création, avec les coordonnées du pro. */
export function NouvelleAnimationPleine(props:
  | { variante: 'configurateur'; pro: ComponentProps<typeof Configurateur>['pro']; banques: ComponentProps<typeof Configurateur>['banques'] }
  | ({ variante: 'parcours' } & ComponentProps<typeof ParcoursCreation>)) {
  const initial = (props.pro ?? { id: '' }) as { id: string }
  const { fiche, pret } = useFichePleine(initial)
  if (!pret) return CHARGEMENT
  if (props.variante === 'configurateur') return <Configurateur key="pleine" pro={fiche as unknown as ComponentProps<typeof Configurateur>['pro']} banques={props.banques} />
  const { variante: _variante, ...reste } = props
  void _variante
  return <ParcoursCreation key="pleine" {...reste} pro={fiche as unknown as ComponentProps<typeof ParcoursCreation>['pro']} />
}
