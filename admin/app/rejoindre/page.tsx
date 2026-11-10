import Link from 'next/link'
import ParcoursCreation from '@/components/creation/ParcoursCreation'
import { chargerSupersOuverts } from '@/lib/superEventsOuverts'
import { CHARTE_PRO as C, POLICE_PRO } from '@/lib/charte'
import CaptureSource from '@/components/CaptureSource'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Rejoindre un super event — Flowin' }

/**
 * REJOINDRE UN SUPER EVENT, SANS COMPTE (03/11/2026).
 * Un visiteur parcourt tout le parcours (opération, jeu, lots, diffusion, aperçu en direct). Pour VALIDER, il envoie une DEMANDE à
 * Flowin avec un compte pro : à la dernière étape on lui propose de créer son compte (libre, sans attendre Flowin) ou de se connecter,
 * puis il revient ici (?reprise=1) et sa saisie est restaurée. ?se=<id> présélectionne l'opération.
 */
export default async function Page({ searchParams }: { searchParams: { se?: string; reprise?: string } }) {
  const supers = await chargerSupersOuverts()
  return (
    <div style={{ minHeight: '100dvh', background: C.fond, fontFamily: POLICE_PRO, color: C.texte }}>
      <header style={{ background: '#fff', borderBottom: `1px solid ${C.bordure}`, height: 54, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/landing" style={{ textDecoration: 'none', fontSize: 20, fontWeight: 800, letterSpacing: '-.04em', color: C.encre }}>Flow<span style={{ color: C.bleu }}>in</span></Link>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.12em', color: C.violet }}>PRO</span>
        <span style={{ flex: 1 }} />
        <Link href="/pro/connexion?retour=%2Frejoindre" style={{ fontSize: 13, fontWeight: 800, color: C.accent, textDecoration: 'none' }}>Se connecter</Link>
      </header>
      <CaptureSource />
      <main style={{ padding: '22px 16px 40px', maxWidth: 1180, margin: '0 auto' }}>
        <ParcoursCreation
          mode="visiteur" pro={null} banques={[]} supers={supers} packs={[]}
          typeInitial="rejoindre" seInitial={searchParams.se ?? null} reprise={searchParams.reprise === '1'}
        />
      </main>
    </div>
  )
}
