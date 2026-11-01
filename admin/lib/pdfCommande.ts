/**
 * DOCUMENTS PDF DU PRO (contrat signe, facture acquittee) — UNE SEULE SOURCE : memes fonctions
 * que la fonction edge qui les envoie par email (lib/documentsAnimation.ts, miroir verbatim de
 * supabase/functions/notify-commande-animation/documents.ts). Ce fichier ne fait que charger
 * jsPDF (/nds/vendor/jspdf.umd.min.js) et lancer le telechargement.
 */
import { pdfContrat, pdfFacture, type Commande, type Facture } from './documentsAnimation'

/* eslint-disable @typescript-eslint/no-explicit-any */
async function chargerJsPdf(): Promise<any> {
  const w = window as any
  if (w.jspdf?.jsPDF) return w.jspdf.jsPDF
  await new Promise<void>((ok, ko) => {
    const s = document.createElement('script')
    s.src = '/nds/vendor/jspdf.umd.min.js'
    s.onload = () => ok()
    s.onerror = () => ko(new Error('jsPDF indisponible'))
    document.head.appendChild(s)
  })
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
