'use client'

/**
 * ESPACE PRO EN ATTENTE DE PAIEMENT (31/10) : ce que voit un pro dont le paiement n'est pas
 * encore valide. Il retrouve sa commande, ses coordonnees de virement, et l'espace s'ouvre
 * tout seul des que le paiement est valide (virement : validation par l'equipe Flowin).
 */
import LienBonCommande from './LienBonCommande'
import QrVirement from './QrVirement'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, BTN, BTN2, MUTED } from '@/lib/proui'
import { chargerCommandes, eur, montantAVirer, statutAffiche, VIREMENT, type CommandeAnimation } from '@/lib/commandesPro'
import { Pastille } from './HistoriqueCommandes'

export default function AccesBloque({ proId }: { proId: string }) {
  const q = `?pro=${encodeURIComponent(proId)}`
  const [c, setC] = useState<CommandeAnimation | null | undefined>(undefined)
  useEffect(() => { chargerCommandes(proId).then(r => setC(r.commandes[0] ?? null)) }, [proId])
  const virer = c ? montantAVirer(c) : 0
  return (
    <div style={{ ...CARD, maxWidth: 640, padding: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.violet }}>Espace pro</div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.01em', margin: '6px 0 8px' }}>Votre espace s’ouvre dès votre paiement</div>
      <div style={{ fontSize: 14, ...MUTED, lineHeight: 1.6 }}>Votre compte est créé. Il reste à régler votre commande.</div>

      {c === undefined && <div style={{ fontSize: 13.5, ...MUTED, marginTop: 14 }}>Recherche de votre commande…</div>}
      {c && (
        <div style={{ background: C.fond, border: `1px solid ${C.bordure}`, borderRadius: 14, padding: '14px 16px', marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: 14, fontWeight: 900 }}>Commande {c.id}</div><div style={{ fontSize: 12.5, ...MUTED }}>{eur(c.montant_ttc)} TTC</div></div>
            <Pastille s={statutAffiche(c)} />
          </div>
          {virer > 0 && c.mode_paiement === 'virement' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 8 }}>Virement de {eur(virer)} TTC</div>
              <QrVirement montant={virer} reference={c.id} taille={180} />
              <div style={{ fontSize: 12, ...MUTED, marginTop: 6 }}>BIC {VIREMENT.bic}</div>
            </div>
          )}
        </div>
      )}
      {c === null && (
        <div style={{ marginTop: 16 }}>
          <LienBonCommande proId={proId} style={{ ...BTN, display: 'inline-block', textDecoration: 'none' }}>Valider mon bon de commande</LienBonCommande>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
        <Link href={`/pro/commandes${q}`} style={{ ...BTN, textDecoration: 'none', display: 'inline-block' }}>Mes commandes et factures</Link>
        <Link href="/pro/connexion" style={{ ...BTN2, textDecoration: 'none', display: 'inline-block' }}>Changer de compte</Link>
      </div>
    </div>
  )
}
