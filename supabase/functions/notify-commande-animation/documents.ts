// supabase/functions/notify-commande-animation/documents.ts
//
// Documents et emails « Flowin, jeu d'animation », sans dépendance Deno : testable sous Node
// (node --experimental-strip-types). Le constructeur jsPDF est injecté par l'appelant.
//
// Charte de facturation reprise de admin/public/facture-nds.html : émetteur BAITA EURL (« Flowin, produit commercial de BAITA EURL »),
// 40 rue des Arcs 06140 Vence, SIRET 512 026 907 00018, TVA FR82 512 026 907, Total HT / TVA 20 % /
// Net à payer TTC, règlement (virement : IBAN + BIC + référence), échéance, pénalités BCE + 10 points,
// indemnité forfaitaire 40 €, pas d'escompte, TVA acquittée d'après les débits.

export const EMETTEUR = {
  nom: "Flowin",
  mention: "Flowin, produit commercial de BAITA EURL",
  societe: "BAITA EURL",
  adresse: "40 rue des Arcs, 06140 Vence",
  siret: "512 026 907 00018",
  tva: "FR82 512 026 907",
  rcs: "RCS Grasse 512 026 907",
  contact: "04 93 59 91 37 · info@opconsult.co",
};
export const IBAN = "FR76 1460 7003 3470 2211 6462 345";
export const BIC = "CCBPFRPPMAR";
export const CGV_URL = "https://flowin-events.vercel.app/cgv-animation-magasin.html";
export const MENTIONS_RETARD =
  "En cas de retard : pénalités au taux de la BCE majoré de 10 points, exigibles sans rappel, et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 C. com.). Pas d'escompte pour paiement anticipé. TVA acquittée d'après les débits.";

export type Commande = Record<string, any>;
export type Ligne = { lib: string; det?: string; q: number; ht: number };
export type Facture = {
  numero: string; commande_id: string; objet: string; emise_le: string; payee_le: string; mode_paiement: string;
  client: Record<string, string>; lignes: Ligne[]; montant_ht: number; montant_tva: number; montant_ttc: number;
  source_numero?: string; numero_externe?: string | null; // préparation CRM (sql/08) : facultatifs
};

export const FORMULES: Record<string, string> = {
  annuelle: "Formule annuelle · 990 € HT / an · engagement 12 mois",
  mensuelle: "Formule mensuelle · 110 € HT / mois · engagement 3 mois minimum",
};
export const STATUTS: Record<string, string> = {
  en_attente_paiement: "En attente de paiement",
  mandat_en_cours: "Mandat SEPA en cours",
  mandat_actif: "Mandat SEPA actif",
  payee: "Payée",
  documents_envoyes: "Payée · documents envoyés",
  mandat_echoue: "Mandat refusé ou annulé",
  paiement_echoue: "Prélèvement échoué",
  annulee: "Annulée",
};

export function esc(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function eur(v: unknown): string {
  const n = Math.round(Number(v) * 100) / 100;
  if (!isFinite(n)) return "—";
  const e = Math.floor(n), c = Math.round((n - e) * 100);
  return String(e).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (c ? "," + (c < 10 ? "0" : "") + c : "") + " €";
}
export function dateFr(iso: unknown, heure = false): string {
  if (!iso) return "—";
  const d = new Date(String(iso));
  const o: Intl.DateTimeFormatOptions = { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" };
  if (heure) { o.hour = "2-digit"; o.minute = "2-digit"; }
  return d.toLocaleString("fr-FR", o);
}

/** Lignes du bon de commande (même calcul que la page, la base et la facture). */
export function lignesCommande(r: Commande): Ligne[] {
  // Modèle unique (public/bon-commande-pdf.js) quand il est chargé ; sinon repli sur les montants enregistrés.
  const M = (globalThis as any).FlowinBonPDF;
  if (M && M.calculDepuisCommande) return M.calculDepuisCommande(r).lignes as Ligne[];
  const l: Ligne[] = [];
  if (r.offre === "annuelle") l.push({ lib: "Formule annuelle Flowin, jeu d'animation", det: "Engagement 12 mois", q: 1, ht: Number(r.montant_abonnement_ht) });
  else l.push({ lib: "Formule mensuelle Flowin, jeu d'animation, 1er mois", det: "Engagement 3 mois minimum, puis 110 € HT par mois", q: 1, ht: Number(r.montant_abonnement_ht) });
  if (r.kit === "physique") l.push({ lib: "Kit physique imprimé", det: "Par boutique : 1 support de caisse, 3 affiches A4, 3 macarons", q: Number(r.nb_boutiques), ht: Number(r.montant_kit_ht) });
  else l.push({ lib: "Kit digital", det: "Fichiers à imprimer, QR inclus", q: 1, ht: 0 });
  if (Number(r.opt_quiz_qte) > 0) l.push({ lib: "Option : quiz personnalisé", det: "180 € HT par animation", q: Number(r.opt_quiz_qte), ht: 180 * Number(r.opt_quiz_qte) });
  if (Number(r.opt_bonus_qte) > 0) l.push({ lib: "Option : questions bonus", det: "180 € HT", q: Number(r.opt_bonus_qte), ht: 180 * Number(r.opt_bonus_qte) });
  return l;
}

/* ------------------------------------------------------------------ PDF */

// jsPDF + helvetica : pas de glyphe €, ni d'espaces fines ; même nettoyage que le PDF du bon de commande.
function S(t: unknown): string {
  return String(t ?? "").replace(/[\u202f\u00a0]/g, " ").replace(/€/g, "EUR").replace(/[‘’]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, "-").replace(/·/g, "-");
}

type Pdf = any;
function base(J: any, titre: string, numero: string, sousTitre: string) {
  const doc: Pdf = new J({ unit: "mm", format: "a4", orientation: "portrait" });
  const W = 210, M = 15;
  const ink = [27, 58, 92], mut = [90, 107, 128], blue = [59, 92, 196], violet = [91, 52, 194];
  const T = (t: unknown, x: number, y: number, sz: number, st: string, col: number[], al?: string) => {
    doc.setFont("helvetica", st); doc.setFontSize(sz); doc.setTextColor(col[0], col[1], col[2]); doc.text(S(t), x, y, al ? { align: al } : undefined);
  };
  const wrap = (t: unknown, x: number, y: number, sz: number, col: number[], w: number, lh: number) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(sz); doc.setTextColor(col[0], col[1], col[2]);
    const ls = doc.splitTextToSize(S(t), w); for (const s of ls) { doc.text(s, x, y); y += lh; } return y;
  };
  doc.setFillColor(244, 246, 249); doc.rect(0, 0, W, 38, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(ink[0], ink[1], ink[2]); doc.text("Flow", M, 22);
  const fw = doc.getTextWidth("Flow"); doc.setTextColor(blue[0], blue[1], blue[2]); doc.text("in", M + fw, 22);
  T(EMETTEUR.mention, M, 28.5, 7, "normal", mut);
  T(titre, W - M, 20, 18, "bold", ink, "right");
  T(numero, W - M, 26, 9.5, "bold", ink, "right");
  T(sousTitre, W - M, 31, 8.5, "normal", mut, "right");
  return { doc, W, M, ink, mut, blue, violet, T, wrap };
}
function parties(p: ReturnType<typeof base>, client: Record<string, string>, y: number) {
  const { doc, M, W, ink, mut, violet, T } = p, cw = (W - 2 * M - 8) / 2;
  doc.setDrawColor(220, 227, 236); doc.roundedRect(M, y, cw, 32, 2, 2); doc.roundedRect(M + cw + 8, y, cw, 32, 2, 2);
  T("EMETTEUR", M + 4, y + 6, 7, "bold", violet); T(EMETTEUR.nom + " - " + EMETTEUR.societe, M + 4, y + 12, 10.5, "bold", ink);
  T(EMETTEUR.adresse, M + 4, y + 17, 8, "normal", mut); T("SIRET " + EMETTEUR.siret, M + 4, y + 21.5, 8, "normal", mut);
  T("TVA " + EMETTEUR.tva, M + 4, y + 26, 8, "normal", mut); T(EMETTEUR.contact, M + 4, y + 30, 7.5, "normal", mut);
  const px = M + cw + 12;
  T("FACTURE A / CLIENT", px, y + 6, 7, "bold", violet); T((client.raison_sociale || "-") + (client.enseigne ? " (" + client.enseigne + ")" : ""), px, y + 12, 10.5, "bold", ink);
  T(client.adresse || "", px, y + 17, 8, "normal", mut); T(((client.cp || "") + " " + (client.ville || "")).trim(), px, y + 21.5, 8, "normal", mut);
  T("SIRET " + (client.siret || "-"), px, y + 26, 8, "normal", mut);
  T([client.contact_nom, client.email].filter(Boolean).join(" - "), px, y + 30, 7, "normal", mut);
  return y + 40;
}
function tableau(p: ReturnType<typeof base>, lignes: Ligne[], ht: number, tva: number, ttc: number, y: number, libTtc: string) {
  const { doc, M, W, ink, mut, violet, T, wrap } = p, CW = W - 2 * M;
  T("DESIGNATION", M, y, 7.5, "bold", violet); T("QTE", W - M - 38, y, 7.5, "bold", violet, "right"); T("MONTANT HT", W - M, y, 7.5, "bold", violet, "right");
  y += 2.5; doc.setDrawColor(220, 227, 236); doc.line(M, y, W - M, y); y += 5.5;
  for (const l of lignes) {
    T(l.lib, M, y, 9.5, "bold", ink); T(String(l.q), W - M - 38, y, 9.5, "normal", ink, "right"); T(eur(l.ht), W - M, y, 9.5, "bold", ink, "right");
    y = wrap(l.det || "", M, y + 4.3, 7.8, mut, CW - 60, 3.6) + 2; doc.line(M, y - 1.5, W - M, y - 1.5); y += 3.5;
  }
  const tx = W - M - 70;
  T("Total HT", tx, y, 9.5, "normal", mut); T(eur(ht), W - M, y, 9.5, "bold", ink, "right"); y += 5.5;
  T("TVA 20 %", tx, y, 9.5, "normal", mut); T(eur(tva), W - M, y, 9.5, "bold", ink, "right"); y += 2.5;
  doc.setFillColor(227, 233, 248); doc.rect(tx - 3, y, 73, 9, "F");
  T(libTtc, tx, y + 6.2, 10.5, "bold", ink); T(eur(ttc), W - M, y + 6.2, 12, "bold", ink, "right");
  return y + 16;
}
function pied(p: ReturnType<typeof base>) {
  p.wrap(EMETTEUR.mention + " - " + EMETTEUR.adresse + " - SIRET " + EMETTEUR.siret + " - " + EMETTEUR.rcs + " - TVA " + EMETTEUR.tva + " - IBAN " + IBAN + " - BIC " + BIC, p.M, 287, 6.5, p.mut, p.W - 2 * p.M, 3);
}

/** Numéro qui fait foi : celui du CRM si la numérotation est confiée au CRM, sinon FL-AM-AAAA-NNNNN. */
export function numeroLegal(f: Facture): string {
  return f.source_numero === "crm" && f.numero_externe ? String(f.numero_externe) : f.numero;
}

/** Facture acquittée (émise après paiement validé). */
export function pdfFacture(J: any, f: Facture): ArrayBuffer {
  const legal = numeroLegal(f);
  const p = base(J, "FACTURE", "Facture n° " + legal, "Commande " + f.commande_id + (legal !== f.numero ? " - ref. interne " + f.numero : ""));
  const { M, W, ink, mut, violet, T, wrap } = p, CW = W - 2 * M;
  T("Date d'emission : " + dateFr(f.emise_le), M, 46, 8.5, "normal", mut);
  T("Prestation : Flowin, jeu d'animation", W - M, 46, 8.5, "normal", mut, "right");
  let y = parties(p, f.client, 51);
  y = tableau(p, f.lignes, Number(f.montant_ht), Number(f.montant_tva), Number(f.montant_ttc), y, "Net a payer TTC");
  p.doc.setDrawColor(59, 92, 196); p.doc.setLineWidth(0.6); p.doc.roundedRect(W - M - 52, y - 4, 52, 10, 2, 2);
  T("ACQUITTEE le " + dateFr(f.payee_le), W - M - 26, y + 2.6, 9, "bold", [59, 92, 196], "center"); p.doc.setLineWidth(0.2);
  T("REGLEMENT", M, y, 7.5, "bold", violet); y += 5;
  y = wrap(f.mode_paiement === "prelevement_sepa"
    ? "Mode : prelevement SEPA (GoCardless). Paiement recu le " + dateFr(f.payee_le) + "."
    : "Mode : virement bancaire - BIC : " + BIC + " - IBAN : " + IBAN + " - Reference a rappeler : " + f.commande_id + ". Paiement recu le " + dateFr(f.payee_le) + ".", M, y, 8.5, ink, CW - 58, 4.2) + 4;
  y = wrap("Echeance de paiement : a reception (facture acquittee). " + MENTIONS_RETARD, M, y, 7.8, mut, CW, 3.8) + 3;
  wrap("Conditions generales de vente Flowin, jeu d'animation : " + CGV_URL, M, y, 7.5, mut, CW, 3.6);
  pied(p);
  return p.doc.output("arraybuffer");
}

/** Contrat : bon de commande signé. MODÈLE UNIQUE : public/bon-commande-pdf.js (même PDF que le navigateur du client et que la page Super Admin).
 *  Le script doit être chargé avant (Deno : import "../_shared/bon-commande-pdf.js" ; navigateur : <script src="/bon-commande-pdf.js">). */
export function pdfContrat(J: any, r: Commande): ArrayBuffer {
  const M = (globalThis as any).FlowinBonPDF;
  if (!M) throw new Error("Modele PDF du bon de commande non charge (bon-commande-pdf.js).");
  return M.construire(J, r, { signe: true }).output("arraybuffer");
}

/* ------------------------------------------------------------------ Emails */

function cadre(titre: string, corps: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F4F6F9;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1B3A5C">
<div style="max-width:620px;margin:0 auto;padding:24px 16px">
<div style="font-size:26px;font-weight:900;letter-spacing:-.03em">Flow<span style="color:#3B5CC4">in</span></div>
<div style="background:#fff;border:1px solid #DCE3EC;border-radius:16px;padding:22px 22px 18px;margin-top:12px">
<h1 style="font-size:20px;margin:0 0 12px">${titre}</h1>${corps}</div>
<p style="font-size:11px;color:#5a6b80;margin-top:14px">${EMETTEUR.mention} · ${EMETTEUR.adresse} · SIRET ${EMETTEUR.siret} · TVA ${EMETTEUR.tva}</p>
</div></body></html>`;
}
function tableHtml(r: Commande): string {
  const rows = lignesCommande(r).map((l) => `<tr><td style="padding:6px 0;border-bottom:1px solid #EEF2F7">${esc(l.lib)}<br><span style="font-size:12px;color:#5a6b80">${esc(l.det)}</span></td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #EEF2F7">${l.q}</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #EEF2F7;font-weight:700">${eur(l.ht)}</td></tr>`).join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
<tr><td colspan="2" style="padding-top:8px">Total HT</td><td style="text-align:right;padding-top:8px">${eur(r.montant_ht)}</td></tr>
<tr><td colspan="2">TVA 20 %</td><td style="text-align:right">${eur(r.montant_tva)}</td></tr>
<tr><td colspan="2" style="font-weight:900">Total TTC à la commande</td><td style="text-align:right;font-weight:900">${eur(r.montant_ttc)}</td></tr></table>
${r.offre === "mensuelle" ? `<p style="font-size:13px;color:#3B5CC4;font-weight:700">Puis 110 € HT (132 € TTC) par mois, engagement 3 mois minimum.</p>` : ""}`;
}

/** Rappel cliquable « satisfait ou remboursé » : formule annuelle sans garantie, hors renouvellement. */
export function rappelGarantie(r: Commande): string {
  if (r.offre !== "annuelle" || r.garantie || r.type_commande === "renouvellement") return "";
  const lien = "https://flowin-events.vercel.app/bon-commande-animation.html?garantie=demarche&commande=" + encodeURIComponent(String(r.id));
  return `<div style="border:2px solid #7A4FE0;border-radius:12px;padding:12px 14px;margin-top:14px;font-size:14px"><b>Satisfait ou remboursé</b> : la garantie des premiers adhérents (formule annuelle) n'est pas encore activée sur votre commande. Remplissez et certifiez votre fiche découverte en deux minutes :<br><a href="${lien}" style="display:inline-block;margin-top:10px;background:#7A4FE0;color:#fff;text-decoration:none;font-weight:800;padding:10px 18px;border-radius:100px">Je veux bénéficier du satisfait ou remboursé</a></div>`;
}

/** Avant paiement : accusé de réception + bon de commande + coordonnées de virement. PAS de facture. */
export function emailAccuse(r: Commande): { sujet: string; html: string } {
  const vir = r.mode_paiement === "virement"
    ? `<div style="background:#F4F6F9;border-radius:12px;padding:12px 14px;font-size:14px;margin-top:12px"><b>Règlement par virement : ${eur(r.montant_ttc)} TTC</b><br>Titulaire : ${EMETTEUR.societe}<br>IBAN : <b>${IBAN}</b><br>BIC : ${BIC}<br>Référence à rappeler : <b>${esc(r.id)}</b></div>`
    : `<p style="font-size:14px">Prélèvement SEPA : signez votre mandat sur la page sécurisée GoCardless si ce n'est pas déjà fait.</p>`;
  return {
    sujet: `Commande ${r.id} reçue · Flowin, jeu d'animation`,
    html: cadre("Merci, votre commande est bien reçue.", `<p style="font-size:14px">Bonjour ${esc(r.contact_nom)},<br>votre bon de commande n° <b>${esc(r.id)}</b> signé le ${dateFr(r.signature_horodatage, true)} est enregistré <b>en attente de paiement</b>. Vous le trouverez en pièce jointe.</p>
${tableHtml(r)}${vir}${rappelGarantie(r)}
<p style="font-size:13px;color:#5a6b80">Dès réception de votre paiement, vous recevrez votre contrat signé et votre facture acquittée, puis vos accès.<br><a href="${CGV_URL}" style="color:#3B5CC4">Conditions générales de vente</a></p>`),
  };
}

/** Après paiement validé : contrat signé + facture acquittée + accès. */
export function emailDocuments(r: Commande, f: Facture): { sujet: string; html: string } {
  return {
    sujet: `Paiement reçu · contrat et facture ${numeroLegal(f)} · Flowin`,
    html: cadre("Paiement reçu, bienvenue chez Flowin.", `<p style="font-size:14px">Bonjour ${esc(r.contact_nom)},<br>nous avons bien reçu votre paiement de <b>${eur(f.montant_ttc)} TTC</b> pour la commande <b>${esc(r.id)}</b>.</p>
<p style="font-size:14px">En pièces jointes : <b>votre contrat signé</b> (bon de commande n° ${esc(r.id)}) et <b>votre facture acquittée n° ${esc(numeroLegal(f))}</b>.</p>
<p style="font-size:14px"><b>Vos accès :</b> créez ou ouvrez votre espace pro sur <a href="https://flowin-events.vercel.app/pro/inscription" style="color:#3B5CC4">flowin-events.vercel.app/pro</a> avec l'email ${esc(r.email)}. Flowin vous contacte pour préparer votre première animation.</p>`),
  };
}

/** Mensualité (mois 2 et suivants) : facture acquittée seule. */
export function emailMensualite(r: Commande, f: Facture): { sujet: string; html: string } {
  return {
    sujet: `Facture ${numeroLegal(f)} · mensualité Flowin, jeu d'animation`,
    html: cadre("Votre facture mensuelle.", `<p style="font-size:14px">Bonjour ${esc(r.contact_nom)},<br>votre mensualité de ${eur(f.montant_ttc)} TTC a été prélevée. Votre facture acquittée n° <b>${esc(numeroLegal(f))}</b> est en pièce jointe.</p>`),
  };
}

/** Email interne à Flowin (nouvelle commande ou changement de statut). */
export function emailFlowin(r: Commande, type: string, ancien?: string): { sujet: string; html: string } {
  const lignes: Array<[string, string]> = [
    ["Commande", esc(r.id)], ["Statut", esc(STATUTS[String(r.statut)] ?? r.statut) + (ancien ? " (avant : " + esc(STATUTS[ancien] ?? ancien) + ")" : "")],
    ["Établissement", esc(r.raison_sociale) + (r.enseigne ? " (" + esc(r.enseigne) + ")" : "")], ["SIRET", esc(r.siret)], ["Contact", esc(r.contact_nom) + " · " + esc(r.email) + " · " + esc(r.tel)],
    ["Formule", esc(FORMULES[String(r.offre)] ?? r.offre)], ["Supports", r.kit === "physique" ? "Kit physique × " + esc(r.nb_boutiques) : "Kit digital"],
    ["Total TTC", eur(r.montant_ttc)], ["Paiement", r.mode_paiement === "prelevement_sepa" ? "Prélèvement SEPA" : "Virement"],
    ["Souscription", r.type_commande === "renouvellement" ? "Renouvellement (pas de garantie)" : "Première souscription"],
    ["Garantie", r.garantie ? "Oui, objectif " + esc(r.garantie_clients_objectif) + " clients" : "Non"],
  ];
  const t = lignes.map(([k, v]) => `<tr><td style="padding:4px 10px 4px 0;color:#5a6b80;font-size:13px">${k}</td><td style="padding:4px 0;font-size:14px;font-weight:700">${v}</td></tr>`).join("");
  return {
    sujet: (type === "nouvelle_commande" ? "Nouvelle commande " : "Commande ") + r.id + " · " + (STATUTS[String(r.statut)] ?? r.statut) + " · " + (r.raison_sociale ?? ""),
    html: cadre(type === "nouvelle_commande" ? "Nouvelle commande jeu d'animation" : "Changement de statut", `<table>${t}</table>`),
  };
}
