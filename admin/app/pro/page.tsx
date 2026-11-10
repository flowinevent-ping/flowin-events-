import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fetchOperationsPro } from '@/lib/operations'
import { rangerParPeriode, type FiltreType } from '@/lib/rangementOperations'
import ProShell from '@/components/pro/ProShell'
import GrilleOperations, { Vignette } from '@/components/pro/GrilleOperations'
import AlerteLotsRetires from '@/components/pro/AlerteLotsRetires'
import CompteurMensuel from '@/components/pro/CompteurMensuel'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, MUTED, H1, SUB, BTN, BTN2 } from '@/lib/proui'
import { lireDroitsPro, peutOuvrirNouvelle } from '@/lib/droitsPro'

export const metadata: Metadata = { title: 'Mes animations — Flowin Pro' }
export const dynamic = 'force-dynamic'

interface Props { searchParams: { pro?: string; ev?: string; type?: string; bienvenue?: string; quiz?: string } }

const TYPES: { id: '' | 'event' | 'super'; label: string }[] = [
  { id: '', label: 'Toutes' },
  { id: 'event', label: 'Mes animations' },
  { id: 'super', label: 'Super events' },
]

/**
 * MES OPERATIONS — la porte d entree du pro (Romain, 16/09 nuit) :
 * petites vignettes, rangees En cours / A venir / Passees puis par mois et
 * annee. Le type (animation, super event) est un filtre.
 */
export default async function ProAccueilPage({ searchParams }: Props) {
  let proId = searchParams.pro ?? ''
  const evId = searchParams.ev ?? ''
  if (!proId && evId) {
    const { data: ev } = await supabase.from('events').select('pro_id').eq('id', evId).single()
    proId = ev?.pro_id ?? ''
  }
  const ops = await fetchOperationsPro(proId)
  /* Droits donnes par le Super Admin (sql/06) : sans le droit, les boutons de creation disparaissent. */
  const droitsPro = await lireDroitsPro(proId)
  const peutCreer = peutOuvrirNouvelle(droitsPro)
  const peutRejoindre = droitsPro.rejoindre_super_event
  const proName = ops.proNom ?? 'Mon établissement'
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const et = q ? '&' : '?'
  const lien = (cle: string, onglet?: string) => `/pro/operation${q}${et}op=${encodeURIComponent(cle)}${onglet ? `&onglet=${onglet}` : ''}`
  const type = (searchParams.type === 'event' || searchParams.type === 'super' ? searchParams.type : null) as FiltreType
  const groupes = rangerParPeriode(ops.operations, type)

  return (
    <ProShell proName={proName} proId={proId} active="operations">
      {searchParams.bienvenue === '1' && (
        <div style={{ ...CARD, border: `1.5px solid ${C.violet}`, background: C.violetClair }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Bienvenue dans votre espace Flowin</div>
          <div style={{ fontSize: 13.5, ...MUTED, margin: '4px 0 12px', lineHeight: 1.55 }}>
            Votre fiche est en cours de validation par l’équipe Flowin. En attendant, préparez la suite :
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {peutCreer && <Link href={`/pro/nouvelle${q}${et}type=animation`} style={{ ...BTN, padding: '10px 18px', fontSize: 13.5, textDecoration: 'none' }}>1. Créer ma première animation</Link>}
            <Link href={`/pro/compte${q}${et}onglet=rib`} style={{ ...BTN2, padding: '9px 16px', fontSize: 13, textDecoration: 'none' }}>2. Mes coordonnées bancaires</Link>
            <Link href={`/pro/compte${q}${et}onglet=entreprise`} style={{ ...BTN2, padding: '9px 16px', fontSize: 13, textDecoration: 'none' }}>3. Vérifier ma fiche entreprise</Link>
          </div>
        </div>
      )}
      {searchParams.bienvenue === 'jeu' && (
        /* Retour du configurateur (Romain, 10/11/2026) : 3 messages courts. Le lien d'import mène au
           carrousel « Importer votre fichier client » (registre L13). */
        <div data-bienvenue-jeu style={{ ...CARD, border: `1.5px solid ${C.violet}`, background: C.violetClair }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>Bienvenue dans votre espace Flowin</div>
          <div style={{ display: 'grid', gap: 8, fontSize: 14, lineHeight: 1.45 }}>
            {searchParams.quiz === '1' && <div>• Flowin vous recontacte sous 72 h avec votre quiz.</div>}
            <div>• Votre QR code est utilisable dès maintenant sur vos supports : mesurez l’impact de chaque communication.</div>
            <div>• Complétez votre profil : <Link href={`/pro/donnees/import${q}`} style={{ color: C.violet, fontWeight: 800 }}>importer votre fichier client</Link>, <Link href={`/pro/compte${q}${et}onglet=entreprise`} style={{ color: C.violet, fontWeight: 800 }}>ajouter votre logo</Link>.</div>
          </div>
        </div>
      )}
      <AlerteLotsRetires partenaireId={ops.partenaire?.id ?? null} />
      <CompteurMensuel proId={proId} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={H1}>Mes animations</h1>
          <div style={SUB}>En cours, à venir, passées — par mois.</div>
        </div>
        <Link href={`/pro/historique${q}`} style={{ ...BTN2, padding: '10px 18px', fontSize: 13.5, textDecoration: 'none' }}>Historique</Link>
        <Link href={`/pro/parcours${q}`} style={{ ...BTN2, padding: '10px 18px', fontSize: 13.5, textDecoration: 'none' }}>Aperçu mobile</Link>
        {peutRejoindre && <Link href={`/pro/rejoindre${q}`} data-rejoindre style={{ ...BTN2, padding: '10px 18px', fontSize: 13.5, textDecoration: 'none' }}>Rejoindre un Super Event</Link>}
        {peutCreer && <Link href={`/pro/nouvelle${q}${et}type=animation`} style={{ ...BTN, padding: '11px 20px', fontSize: 14, textDecoration: 'none' }}>+ Nouvelle animation</Link>}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {TYPES.map(t => {
          const on = (t.id || null) === type
          return (
            <Link key={t.id || 'toutes'} href={`/pro${q}${t.id ? `${et}type=${t.id}` : ''}`}
              style={{ borderRadius: 50, padding: '7px 15px', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                background: on ? C.degrade : '#fff', color: on ? '#fff' : C.accent, border: on ? 'none' : `1.5px solid ${C.bordureChamp}` }}>
              {t.label}
            </Link>
          )
        })}
      </div>

      {groupes.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 26 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{ops.operations.length ? 'Aucune animation de ce type' : 'Aucune animation pour le moment'}</div>
          <div style={{ fontSize: 13.5, ...MUTED, margin: '6px 0 14px' }}>{peutCreer ? 'Créez votre animation ou rejoignez un super event.' : 'Vos animations apparaîtront ici. Pour en créer, contactez Flowin.'}</div>
          {peutCreer && <Link href={`/pro/nouvelle${q}${et}type=animation`} style={{ ...BTN, display: 'inline-block', textDecoration: 'none' }}>Commencer</Link>}
        </div>
      )}

      <GrilleOperations groupes={groupes} vignette={op => (
        <Vignette op={op} href={lien(op.cle)} liens={[
          { label: 'Lots', href: lien(op.cle, 'lots') },
          { label: 'Gagnants', href: lien(op.cle, 'gagnants') },
          { label: 'Contacts', href: lien(op.cle, 'crm') },
          { label: 'Trafic par QR', href: lien(op.cle, 'trafic') },
          { label: 'Bons', href: lien(op.cle, 'bons') },
        ]} />
      )} />
    </ProShell>
  )
}
