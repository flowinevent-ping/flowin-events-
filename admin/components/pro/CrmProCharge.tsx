'use client'

/**
 * CRM du pro chargé AVEC LA SESSION DU NAVIGATEUR (sécurité 23/11/2026).
 * crm_pro n'est plus lisible avec la clé publique : le rendu serveur (sans session) ne reçoit plus les contacts.
 * Ces écrans les chargent ici, comme FichePleine.tsx le fait pour la fiche complète du pro. Sans session :
 * « Connectez-vous pour voir vos contacts », jamais un tableau vide ni un formulaire vide.
 */
import { useEffect, useState, type ComponentProps } from 'react'
import Link from 'next/link'
import { fetchCrmProDetail, MESSAGE_CONNEXION_CRM, type ContactPro } from '@/lib/crmPro'
import { CARD } from '@/lib/proui'
import CrmPro from '@/components/pro/CrmPro'
import RapportPro from '@/components/pro/RapportPro'

export type EtatCrmPro =
  | { statut: 'chargement'; contacts: ContactPro[]; erreur: null }
  | { statut: 'connexion'; contacts: ContactPro[]; erreur: null }
  | { statut: 'erreur'; contacts: ContactPro[]; erreur: string }
  | { statut: 'ok'; contacts: ContactPro[]; erreur: null }

/** Charge les contacts du pro avec la session du navigateur. Jamais d'exception : un état explicite. */
export function useCrmPro(proId: string, actif = true): EtatCrmPro {
  const [etat, setEtat] = useState<EtatCrmPro>({ statut: 'chargement', contacts: [], erreur: null })
  useEffect(() => {
    if (!actif) return
    let fini = false
    setEtat({ statut: 'chargement', contacts: [], erreur: null })
    fetchCrmProDetail(proId).then(r => {
      if (fini) return
      if (r.sansSession) setEtat({ statut: 'connexion', contacts: [], erreur: null })
      else if (r.erreur) setEtat({ statut: 'erreur', contacts: [], erreur: r.erreur })
      else setEtat({ statut: 'ok', contacts: r.contacts, erreur: null })
    }).catch(() => { if (!fini) setEtat({ statut: 'erreur', contacts: [], erreur: 'Vos contacts n’ont pas pu être chargés. Rechargez la page ; si le problème continue, contactez Flowin.' }) })
    return () => { fini = true }
  }, [proId, actif])
  return etat
}

/** Carte « connectez-vous » (sans session). */
export function ConnexionRequiseCrm() {
  return (
    <div style={CARD} data-crm-connexion>
      <div style={{ fontSize: 14, marginBottom: 10 }}>{MESSAGE_CONNEXION_CRM}</div>
      <Link href="/pro/connexion" style={{ fontWeight: 800, fontSize: 14 }}>Me connecter</Link>
    </div>
  )
}

/** Onglet CRM : charge puis affiche le CRM complet. */
export default function CrmProCharge(props: Omit<ComponentProps<typeof CrmPro>, 'contacts' | 'erreur'>) {
  const etat = useCrmPro(props.proId)
  if (etat.statut === 'chargement') return <div style={{ ...CARD, fontSize: 14 }}>Chargement…</div>
  if (etat.statut === 'connexion') return <ConnexionRequiseCrm />
  return <CrmPro {...props} contacts={etat.contacts} erreur={etat.erreur} />
}

/** Rapport d'activité du résumé global : les deux tuiles de contacts viennent du CRM chargé avec la session. */
export function RapportProAvecContacts(props: Omit<ComponentProps<typeof RapportPro>, 'contacts'> & { proId: string }) {
  const { proId, ...rapport } = props
  const etat = useCrmPro(proId)
  const resume = etat.statut === 'ok'
    ? {
        autorises: etat.contacts.filter(c => c.optin === true).length,
        importes: etat.contacts.filter(c => (c.origines ?? []).some(o => o === 'import' || o === 'parrainage')).length,
      }
    : null
  return <RapportPro {...rapport} contacts={resume} />
}
