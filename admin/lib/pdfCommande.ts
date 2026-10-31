/**
 * DOCUMENTS PDF DU PRO (31/10/2026) : contrat signe (bon de commande) et facture acquittee.
 *
 * Generes dans le navigateur avec jsPDF (/nds/vendor/jspdf.umd.min.js, deja servi pour le bon
 * de commande). Identite : cote client, la raison sociale, l'enseigne, le SIRET et l'adresse
 * du pro ; cote emetteur, BAITA EURL, marque Flowin (« Flowin, produit commercial de BAITA EURL »),
 * avec les mentions legales des documents Flowin existants. Rien n'est invente : un champ
 * absent est omis ou affiche « — ».
 */
import { CHARTE_PRO } from './charte'
import {
  type CommandeAnimation, LIBELLE_PAIEMENT, VIREMENT, dateFr, dateHeureFr, eur, lignesCommande, montantAVirer,
} from './commandesPro'

export interface IdentitePro { nom: string; enseigne?: string | null }

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

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const INK = hex(CHARTE_PRO.encre), MUT = hex(CHARTE_PRO.attenue), VIO = hex(CHARTE_PRO.violet), BLEU = hex(CHARTE_PRO.bleu), LIGNE = hex(CHARTE_PRO.bordure)

/** Police Helvetica de jsPDF : pas d'euro ni de guillemets typographiques. */
const S = (t: unknown) => String(t == null ? '' : t).replace(/[\u00a0\u202f]/g, ' ').replace(/€/g, 'EUR').replace(/[‘’]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/·/g, '-')

export const MENTION_EMETTEUR = 'Flowin, produit commercial de BAITA EURL - 40 rue des Arcs, 06140 Vence - SIRET 512 026 907 00018 - RCS Grasse 512 026 907 - TVA FR82 512 026 907'

async function creer(titre: string, sousTitre: string, lignesDroite: string[], c: CommandeAnimation, pro: IdentitePro) {
  const J = await chargerJsPdf()
  const doc = new J({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210, M = 15, CW = W - 2 * M
  let y = 18
  const T = (t: string, x: number, yy: number, sz: number, stl: string, col: number[], al?: string) => {
    doc.setFont('helvetica', stl); doc.setFontSize(sz); doc.setTextColor(col[0], col[1], col[2])
    doc.text(S(t), x, yy, al ? { align: al } : undefined)
  }
  const wrap = (t: string, x: number, yy: number, sz: number, col: number[], w: number, lh: number) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(sz); doc.setTextColor(col[0], col[1], col[2])
    const ls = doc.splitTextToSize(S(t), w)
    for (const l of ls) { doc.text(l, x, yy); yy += lh }
    return yy
  }
  // Bandeau : logo texte Flow + in (bleu), pastille Plug & Play violette, titre a droite
  doc.setFillColor(244, 246, 249); doc.rect(0, 0, W, 38, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(INK[0], INK[1], INK[2]); doc.text('Flow', M, y + 4)
  const fw = doc.getTextWidth('Flow'); doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]); doc.text('in', M + fw, y + 4)
  T('ANIMATION DIGITALE', M, y + 10.5, 7, 'bold', MUT)
  doc.setFillColor(VIO[0], VIO[1], VIO[2]); doc.roundedRect(M, y + 13, 25, 5.5, 2.75, 2.75, 'F'); T('Plug & Play', M + 12.5, y + 16.8, 7.5, 'bold', [255, 255, 255], 'center')
  T(titre, W - M, y + 2, 18, 'bold', INK, 'right')
  T(sousTitre, W - M, y + 8, 9.5, 'normal', MUT, 'right')
  lignesDroite.forEach((l, i) => T(l, W - M, y + 14 + i * 5, 8.5, i === 0 ? 'bold' : 'normal', i === 0 ? INK : MUT, 'right'))
  y = 48
  // Emetteur / Client
  const cw = (CW - 8) / 2
  doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.roundedRect(M, y, cw, 38, 2, 2); doc.roundedRect(M + cw + 8, y, cw, 38, 2, 2)
  T('EMETTEUR', M + 4, y + 6, 7, 'bold', VIO); T('BAITA EURL', M + 4, y + 12, 10.5, 'bold', INK)
  T('Marque Flowin - produit commercial de BAITA EURL', M + 4, y + 16.5, 6.8, 'normal', MUT)
  T('40 rue des Arcs, 06140 Vence', M + 4, y + 21, 8, 'normal', MUT); T('SIRET 512 026 907 00018', M + 4, y + 25.5, 8, 'normal', MUT)
  T('TVA FR82 512 026 907', M + 4, y + 30, 8, 'normal', MUT)
  const px = M + cw + 12
  T('CLIENT', px, y + 6, 7, 'bold', VIO); T(c.raison_sociale || pro.nom || '-', px, y + 12, 10.5, 'bold', INK)
  let yc = y + 16.5
  if (pro.enseigne) { T('Enseigne : ' + pro.enseigne, px, yc, 8, 'normal', MUT); yc += 4.5 }
  T(c.adresse || '', px, yc, 8, 'normal', MUT); yc += 4.5
  T(((c.cp || '') + ' ' + (c.ville || '')).trim(), px, yc, 8, 'normal', MUT); yc += 4.5
  T('SIRET ' + (c.siret || '-'), px, yc, 8, 'normal', MUT); yc += 4.5
  T([c.contact_nom, c.email].filter(Boolean).join(' - '), px, yc, 7, 'normal', MUT)
  y += 48
  return { doc, T, wrap, W, M, CW, y }
}

function tableau(ctx: Awaited<ReturnType<typeof creer>>, c: CommandeAnimation) {
  const { doc, T, wrap, W, M, CW } = ctx
  let y = ctx.y
  T('DESIGNATION', M, y, 7.5, 'bold', VIO); T('QTE', W - M - 38, y, 7.5, 'bold', VIO, 'right'); T('MONTANT HT', W - M, y, 7.5, 'bold', VIO, 'right')
  y += 2.5; doc.setDrawColor(LIGNE[0], LIGNE[1], LIGNE[2]); doc.line(M, y, W - M, y); y += 5.5
  for (const l of lignesCommande(c)) {
    T(l.lib, M, y, 9.5, 'bold', INK); T(String(l.q), W - M - 38, y, 9.5, 'normal', INK, 'right'); T(eur(l.ht), W - M, y, 9.5, 'bold', INK, 'right')
    y = wrap(l.det, M, y + 4.3, 7.8, MUT, CW - 60, 3.6) + 2
    doc.line(M, y - 1.5, W - M, y - 1.5); y += 3.5
  }
  const tx = W - M - 70
  T('Total HT', tx, y, 9.5, 'normal', MUT); T(eur(c.montant_ht), W - M, y, 9.5, 'bold', INK, 'right'); y += 5.5
  T('TVA 20 %', tx, y, 9.5, 'normal', MUT); T(eur(c.montant_tva), W - M, y, 9.5, 'bold', INK, 'right'); y += 2.5
  doc.setFillColor(239, 233, 252); doc.rect(tx - 3, y, 73, 9, 'F')
  T('Total TTC', tx, y + 6.2, 11, 'bold', INK); T(eur(c.montant_ttc), W - M, y + 6.2, 12, 'bold', INK, 'right')
  return y + 16
}

/** Contrat signe : bon de commande + CGV acceptees + signature electronique horodatee. */
export async function telechargerContrat(c: CommandeAnimation, pro: IdentitePro): Promise<void> {
  const ctx = await creer('Bon de commande', 'Flowin Animation magasin', ['No ' + c.id, 'Date : ' + dateFr(c.created_at)], c, pro)
  const { doc, T, wrap, M, CW } = ctx
  let y = tableau(ctx, c)
  T('PAIEMENT', M, y, 7.5, 'bold', VIO); y += 5
  const virer = montantAVirer(c)
  const aVirer = virer > 0 ? `Virement bancaire de ${eur(virer)} TTC a l'ordre de ${VIREMENT.titulaire} - IBAN ${VIREMENT.iban} - BIC ${VIREMENT.bic} - reference a rappeler : ${c.id}.` : ''
  y = wrap(c.mode_paiement === 'prelevement_sepa'
    ? `${LIBELLE_PAIEMENT.prelevement_sepa}.` + (aVirer ? ' Kit et options : ' + aVirer : '')
    : (aVirer || `${LIBELLE_PAIEMENT[c.mode_paiement] ?? c.mode_paiement}.`), M, y, 8.5, INK, CW, 4.2)
  y += 3
  if (c.garantie) {
    y = wrap(`Offre satisfait ou rembourse (offre annuelle) : objectif de ${c.garantie_clients_objectif ?? '-'} clients venus retirer leur lot en boutique sur 12 mois, avec au moins 4 animations (panier moyen certifie : ${c.panier_moyen ? eur(c.panier_moyen) : '-'}).`, M, y, 8.5, INK, CW, 4.2) + 3
  }
  T('SIGNATURE ELECTRONIQUE', M, y, 7.5, 'bold', VIO); y += 5
  y = wrap(`Signe electroniquement par ${c.signataire_nom}${c.signataire_qualite ? ' (' + c.signataire_qualite + ')' : ''} pour ${c.raison_sociale}, le ${dateHeureFr(c.signature_horodatage ?? c.created_at)}. Conditions generales de vente Flowin Animation acceptees${c.cgv_version ? ' (version ' + c.cgv_version + ')' : ''}.` + (c.signature_ip ? ` Adresse IP enregistree : ${c.signature_ip}.` : ''), M, y, 8.5, INK, CW, 4.2) + 4
  wrap('Conditions generales de vente consultables sur flowin-events.vercel.app/cgv-animation-magasin.html. Les lots mis en jeu sont fournis par le client. Duree et renouvellement selon les CGV.', M, y, 7.5, MUT, CW, 3.6)
  wrap(MENTION_EMETTEUR, M, 287, 6.5, MUT, CW, 3)
  doc.save(`contrat-flowin-${c.id}.pdf`)
}

/** Facture acquittee : disponible quand le paiement est valide (numero attribue par la base). */
export async function telechargerFacture(c: CommandeAnimation, pro: IdentitePro): Promise<boolean> {
  if (!c.facture_numero) return false
  const ctx = await creer('Facture', 'Flowin Animation magasin', ['No ' + c.facture_numero, 'Emise le ' + dateFr(c.facture_emise_at) + ' - commande ' + c.id], c, pro)
  const { doc, T, wrap, M, CW } = ctx
  let y = tableau(ctx, c)
  doc.setFillColor(0, 137, 122); doc.roundedRect(M, y - 2, 52, 7, 3.5, 3.5, 'F'); T('FACTURE ACQUITTEE', M + 26, y + 2.8, 8, 'bold', [255, 255, 255], 'center'); y += 12
  const reglement = c.mode_paiement === 'prelevement_sepa'
    ? `Reglee par prelevement SEPA (GoCardless) le ${dateFr(c.paiement_maj_at ?? c.facture_emise_at)}.`
    : `Reglee par virement bancaire, recu le ${dateFr(c.virement_recu_at ?? c.facture_emise_at)}.`
  y = wrap(reglement + ' Reference de la commande : ' + c.id + '.', M, y, 8.5, INK, CW, 4.2) + 3
  wrap('TVA 20 % incluse dans le total TTC. Conditions generales de vente : flowin-events.vercel.app/cgv-animation-magasin.html.', M, y, 7.5, MUT, CW, 3.6)
  wrap(MENTION_EMETTEUR, M, 287, 6.5, MUT, CW, 3)
  doc.save(`facture-${c.facture_numero}.pdf`)
  return true
}
