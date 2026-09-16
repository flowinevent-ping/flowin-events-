'use client'

/**
 * APERCU DU BILLET (P4) — le billet reel (nds/billets-partenaires.html, billet
 * de reference NDS 2026), rempli avec la saisie en cours. Un seul billet pour
 * toutes les operations : seuls l en-tete (operation), le commerce, le lot et
 * les conditions changent. Logo Flowin officiel.
 */
import { useMemo } from 'react'
import { encoderApercu } from '@/lib/apercu'

export default function BilletApercu({ commerce, adresse, logoCommerce, lot, valeur, conditions, operation, operationNom, operationLogo, hauteur = 640 }: {
  commerce: string
  adresse?: string | null
  logoCommerce?: string | null
  lot: string
  valeur?: number | null
  conditions?: string | null
  /** id du super event ou de l event ; 'se-nds-2026' garde l en-tete Nuits du Sud. */
  operation?: string | null
  operationNom?: string | null
  operationLogo?: string | null
  hauteur?: number
}) {
  const src = useMemo(() => {
    const json = {
      partenaire_nom: commerce, partenaire_adresse: adresse ?? null, partenaire_logo: logoCommerce ?? null,
      lot_nom: lot, lot_valeur: valeur ?? 0, conditions: conditions ?? null,
      ticket_code: 'APERÇU', operation: operation || 'apercu', operation_nom: operationNom ?? null, operation_logo: operationLogo ?? null,
    }
    return `/nds/billets-partenaires.html?apercu=${encodeURIComponent(encoderApercu(json as never))}`
  }, [commerce, adresse, logoCommerce, lot, valeur, conditions, operation, operationNom, operationLogo])
  return (
    <iframe
      title="Le billet du gagnant"
      src={src}
      style={{ width: '100%', maxWidth: 480, height: hauteur, border: 0, display: 'block', margin: '0 auto', background: 'transparent' }}
    />
  )
}
