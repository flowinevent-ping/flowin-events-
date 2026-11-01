/**
 * DOCUMENTS PDF DU PRO (contrat signe, facture acquittee) — UNE SEULE SOURCE : memes fonctions
 * que la fonction edge qui les envoie par email (lib/documentsAnimation.ts, miroir verbatim de
 * supabase/functions/notify-commande-animation/documents.ts). Ce fichier ne fait que charger
 * jsPDF (/nds/vendor/jspdf.umd.min.js) et lancer le telechargement.
 */
import { pdfContrat, pdfFacture, type Commande, type Facture } from './documentsAnimation'

/* eslint-disable @typescript-eslint/no-explicit-any */
function chargerScript(src: string): Promise<void> {
  return new Promise<void>((ok, ko) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = () => ok()
    s.onerror = () => ko(new Error(src + ' indisponible'))
    document.head.appendChild(s)
  })
}

async function chargerJsPdf(): Promise<any> {
  const w = window as any
  if (!w.jspdf?.jsPDF) await chargerScript('/nds/vendor/jspdf.umd.min.js')
  // Modèle unique du bon de commande (public/bon-commande-pdf.js), partagé avec le navigateur du client et la page Super Admin
  if (!w.FlowinBonPDF) await chargerScript('/bon-commande-pdf.js')
  return w.jspdf.jsPDF
}

function telecharger(buf: ArrayBuffer, nom: string) {
  const url = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url; a.download = nom
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function telechargerContrat(c: Commande): Promise<void> {
  const J = await chargerJsPdf()
  telecharger(pdfContrat(J, c), `contrat-flowin-${c.id}.pdf`)
}

export async function telechargerFacture(f: Facture): Promise<void> {
  const J = await chargerJsPdf()
  telecharger(pdfFacture(J, f), `facture-${f.numero}.pdf`)
}
