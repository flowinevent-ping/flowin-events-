import Link from 'next/link'
import { CARD, MUTED, BTN2 } from '@/lib/proui'
import { MESSAGE_DROIT_REFUSE } from '@/lib/droitsPro'

/**
 * Ce que voit un pro qui ouvre, par l'adresse, une option que le Super Admin a
 * retiree de son compte (sql/06-droits-pro.sql, onglet « Droits » de la fiche pro).
 * Meme message que celui renvoye par la base si l'ecriture est tentee.
 */
export default function OptionDesactivee({ proId, option }: { proId: string; option: string }) {
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  return (
    <div data-option-desactivee role="alert" style={{ ...CARD, maxWidth: 560, padding: 26 }}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>{option}</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.6, fontWeight: 700 }}>{MESSAGE_DROIT_REFUSE}</div>
      <div style={{ fontSize: 13, ...MUTED, marginTop: 8 }}>Écrivez-nous à flowinevent@gmail.com ou appelez le 04 93 59 91 37 : nous activons l’option pour vous.</div>
      <div style={{ marginTop: 16 }}><Link href={`/pro${q}`} style={{ ...BTN2, textDecoration: 'none', display: 'inline-block' }}>Retour à mes animations</Link></div>
    </div>
  )
}
