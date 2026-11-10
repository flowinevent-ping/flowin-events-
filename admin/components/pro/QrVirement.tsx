'use client'

/**
 * VIREMENT EN UN GESTE (10/11/2026, Romain) : aucun lien universel n'ouvre les applications bancaires ;
 * le « QR de virement » SEPA (EPC069-12) est lu par l'appareil photo de l'application de la banque, qui
 * préremplit bénéficiaire, IBAN, montant et référence. En plus : copier IBAN, montant, référence en un clic.
 */
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { CHARTE_PRO as C } from '@/lib/charte'
import { MUTED } from '@/lib/proui'
import { REGLEMENT, qrVirementEpc } from '@/lib/reglement'

const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'

function Copier({ k, v, copie }: { k: string; v: string; copie: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" data-copier={k}
      onClick={() => { navigator.clipboard?.writeText(copie).then(() => { setOk(true); setTimeout(() => setOk(false), 1600) }, () => {}) }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, width: '100%', background: '#fff', border: `1.5px solid ${C.bordure}`, borderRadius: 12, padding: '9px 12px', cursor: 'pointer', fontFamily: 'inherit', color: C.texte, textAlign: 'left' }}>
      <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 11, fontWeight: 800, ...MUTED }}>{k}</span>
        <b style={{ fontSize: 14, fontFamily: 'ui-monospace,Menlo,monospace', overflowWrap: 'anywhere' }}>{v}</b></span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: ok ? '#15803D' : C.violet, whiteSpace: 'nowrap' }}>{ok ? 'Copié' : 'Copier'}</span>
    </button>
  )
}

export default function QrVirement({ montant, reference, taille = 200 }: { montant: number; reference: string; taille?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(qrVirementEpc(montant, reference), { errorCorrectionLevel: 'M', margin: 1, width: taille * 2 }).then(setSrc, () => setSrc(''))
  }, [montant, reference, taille])
  return (
    <div data-qr-virement>
      <div style={{ textAlign: 'center' }}>
        {src ? <img src={src} alt="QR de virement" width={taille} height={taille} style={{ display: 'block', margin: '0 auto', borderRadius: 12, border: `1px solid ${C.bordure}` }} />
          : <div style={{ width: taille, height: taille, margin: '0 auto', borderRadius: 12, background: C.subtil }} />}
        <div style={{ fontSize: 13.5, fontWeight: 800, marginTop: 8 }}>Scannez avec l’application de votre banque</div>
        <div style={{ fontSize: 12, ...MUTED }}>Bénéficiaire, IBAN, montant et référence se remplissent seuls.</div>
      </div>
      <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
        <Copier k={`IBAN · ${REGLEMENT.titulaire}`} v={REGLEMENT.iban} copie={REGLEMENT.iban.replace(/\s/g, '')} />
        <Copier k="Montant TTC" v={eur(montant)} copie={(Math.round(montant * 100) / 100).toFixed(2).replace('.', ',')} />
        <Copier k="Référence" v={reference} copie={reference} />
      </div>
    </div>
  )
}
