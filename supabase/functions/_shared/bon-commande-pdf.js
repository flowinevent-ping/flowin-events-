/* Flowin, jeu d'animation : MODÈLE UNIQUE du bon de commande (calcul des lignes + PDF).
 *
 * Utilisé par :
 *   - admin/public/bon-commande-animation.html  (client en ligne ET vente assistée, ?commercial=)
 *   - admin/public/admin-commandes-animation.html (Super Admin : consultation, réédition du PDF)
 *   - supabase/functions/notify-commande-animation (contrat signé joint à l'email)
 * Source unique : CE fichier. La copie supabase/functions/_shared/bon-commande-pdf.js doit rester
 * IDENTIQUE (même MD5) ; vérifier avec scripts/verifier-bon-commande-pdf.sh avant tout push.
 *
 * JavaScript ES5 (iOS Safari) : var, pas de fonction fléchée, pas de spread. Aucune dépendance :
 * le constructeur jsPDF est passé par l'appelant. Aucun secret ici (l'IBAN et le BIC sont déjà
 * publics sur les factures et les CGV).
 */
(function (root) {
  'use strict';

  /* Grille unique (admin/lib/reglement.ts, Lot A du 10/11/2026) : 1re annee 445 HT (lancement -50 %), puis 990 HT / an
     ou 110 HT / mois ; option quiz rediges par Flowin (30 questions + 5 bonus) 145 HT, 72,50 HT la 1re annee. */
  var PRIX = { lancement: 445, annuelle: 990, mensuelle: 110, kitPhysique: 149, optQuiz: 145, optQuizLancement: 72.5, optBonus: 0, tva: 0.20 };
  var IBAN = 'FR76 1460 7003 3470 2211 6462 345', BIC = 'CCBPFRPPMAR';
  var NOM_OFFRE = { lancement: 'Première année Flowin, jeu d\'animation (offre de lancement -50 %)', annuelle: 'Formule annuelle Flowin, jeu d\'animation', mensuelle: 'Formule mensuelle Flowin, jeu d\'animation' };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function grp(s) { var out = '', c = 0; for (var i = s.length - 1; i >= 0; i--) { out = s.charAt(i) + out; c++; if (c % 3 === 0 && i > 0) out = ' ' + out; } return out; }
  function eur(n) {
    n = Math.round(Number(n) * 100) / 100;
    var neg = n < 0; if (neg) n = -n;
    var ent = Math.floor(n), cts = Math.round((n - ent) * 100);
    return (neg ? '-' : '') + grp(String(ent)) + (cts ? ',' + (cts < 10 ? '0' : '') + cts : '') + ' €';
  }
  function fmtDate(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function fmtDateHeure(d) { return fmtDate(d) + ' à ' + pad(d.getHours()) + 'h' + pad(d.getMinutes()); }

  /* Lignes et montants : la seule définition des prix côté navigateur et côté fonction edge. */
  function calcul(c) {
    var nb = Math.max(1, Math.min(200, parseInt(c.nb, 10) || 1)), quiz = Math.max(0, parseInt(c.quiz, 10) || 0), bonus = Math.max(0, parseInt(c.bonus, 10) || 0);
    var lignes = [], abo = c.offre === 'mensuelle' ? PRIX.mensuelle : (c.offre === 'lancement' ? PRIX.lancement : PRIX.annuelle);
    if (c.offre === 'mensuelle') lignes.push({ lib: NOM_OFFRE.mensuelle + ', 1er mois', det: 'Prélèvement SEPA, reconduction tacite chaque mois, résiliable (CGV art. 6)', q: 1, ht: abo });
    else if (c.offre === 'lancement') lignes.push({ lib: NOM_OFFRE.lancement, det: 'Première année à moitié prix, puis ' + eur(PRIX.annuelle) + ' HT par an ou ' + eur(PRIX.mensuelle) + ' HT par mois, reconduction tacite', q: 1, ht: abo });
    else lignes.push({ lib: NOM_OFFRE.annuelle, det: 'Quiz, roue, tombola, tirages, billets, stock, relances, mesure par support. Engagement 12 mois', q: 1, ht: abo });
    var kitHt = c.kit === 'physique' ? PRIX.kitPhysique * nb : 0;
    if (c.kit === 'physique') lignes.push({ lib: 'Kit physique imprimé', det: 'Par boutique : 1 support de caisse, 3 affiches A4, 3 macarons autocollants, ' + eur(PRIX.kitPhysique) + ' HT', q: nb, ht: kitHt });
    else lignes.push({ lib: 'Kit digital', det: 'Fichiers des affiches, macarons et support de caisse, QR inclus, à imprimer', q: 1, ht: 0 });
    var optHt = 0;
    /* Option quiz : forfait unique (30 questions quiz + 5 questions bonus) ; les questions bonus ne se vendent plus seules. */
    if (quiz > 0) { var pq = c.offre === 'lancement' ? PRIX.optQuizLancement : PRIX.optQuiz; lignes.push({ lib: 'Option : quiz rédigés par Flowin', det: '30 questions quiz + 5 questions bonus, forfait ' + eur(PRIX.optQuiz) + ' HT' + (c.offre === 'lancement' ? ', -50 % la 1re année' : ''), q: 1, ht: pq }); optHt += pq; }
    var ht = abo + kitHt + optHt;
    var tva = Math.round(ht * PRIX.tva * 100) / 100;
    var aboTtc = Math.round(abo * (1 + PRIX.tva) * 100) / 100;
    var ttc = Math.round((ht + tva) * 100) / 100;
    return { lignes: lignes, abo: abo, kit: kitHt, opt: optHt, ht: ht, tva: tva, ttc: ttc, aboTtc: aboTtc, resteTtc: Math.round((ttc - aboTtc) * 100) / 100 };
  }
  function calculDepuisCommande(r) {
    return calcul({ offre: r.offre, kit: r.kit, nb: r.nb_boutiques, quiz: r.opt_quiz_qte, bonus: r.opt_bonus_qte });
  }

  /* PDF : renvoie le document jsPDF (l'appelant fait .save() ou .output('arraybuffer')). */
  function construire(J, rec, opts) {
    opts = opts || {};
    var signe = !!opts.signe;
    function S(t) { return String(t == null ? '' : t).replace(/[  ]/g, ' ').replace(/€/g, 'EUR').replace(/[‘’]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/·/g, '-'); }
    var doc = new J({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    var W = 210, M = 15, x = M, y = 18, CW = W - 2 * M;
    var ink = [27, 58, 92], mut = [90, 107, 128], mag = [59, 92, 196], teal = [91, 52, 194];
    function T(t, xx, yy, sz, stl, col, al) { doc.setFont('helvetica', stl || 'normal'); doc.setFontSize(sz); doc.setTextColor(col[0], col[1], col[2]); doc.text(S(t), xx, yy, al ? { align: al } : undefined); }
    function wrap(t, xx, yy, sz, col, w, lh) { doc.setFont('helvetica', 'normal'); doc.setFontSize(sz); doc.setTextColor(col[0], col[1], col[2]); var ls = doc.splitTextToSize(S(t), w); for (var i = 0; i < ls.length; i++) { doc.text(ls[i], xx, yy); yy += lh; } return yy; }
    var quand = rec.signature_horodatage ? new Date(rec.signature_horodatage) : (rec.signature_horodatage_client ? new Date(rec.signature_horodatage_client) : new Date());
    var t = calculDepuisCommande(rec);

    /* Signature de marque */
    doc.setFillColor(244, 246, 249); doc.rect(0, 0, W, 38, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(ink[0], ink[1], ink[2]); doc.text('Flow', x, y + 4);
    var fw = doc.getTextWidth('Flow'); doc.setTextColor(mag[0], mag[1], mag[2]); doc.text('in', x + fw, y + 4);
    T('A N I M A T I O N   D I G I T A L E', x, y + 10.5, 7, 'bold', [120, 112, 124]);
    doc.setFillColor(122, 79, 224); doc.roundedRect(x, y + 13, 25, 5.5, 2.75, 2.75, 'F'); T('Plug & Play', x + 12.5, y + 16.8, 7.5, 'bold', [255, 255, 255], 'center');
    T('Bon de commande', W - M, y + 2, 18, 'bold', ink, 'right');
    T('Flowin, jeu d\'animation', W - M, y + 8, 9.5, 'normal', mut, 'right');
    T('No ' + rec.id, W - M, y + 14, 9, 'bold', ink, 'right');
    T('Date : ' + fmtDate(quand), W - M, y + 19, 8.5, 'normal', mut, 'right');

    /* Prestataire / Client, côte à côte, même hauteur */
    y = 48;
    var cw = (CW - 8) / 2, bh = 38;
    doc.setDrawColor(220, 227, 236); doc.roundedRect(x, y, cw, bh, 2, 2); doc.roundedRect(x + cw + 8, y, cw, bh, 2, 2);
    T('PRESTATAIRE', x + 4, y + 6, 7, 'bold', teal); T('BAITA EURL - Flowin', x + 4, y + 12, 10.5, 'bold', ink);
    T('40 rue des Arcs, 06140 Vence', x + 4, y + 17, 8, 'normal', mut); T('SIRET 512 026 907 00018', x + 4, y + 21.5, 8, 'normal', mut);
    T('TVA FR82 512 026 907', x + 4, y + 26, 8, 'normal', mut); T('04 93 59 91 37 - info@opconsult.co', x + 4, y + 30.5, 7.5, 'normal', mut);
    var px = x + cw + 12;
    T('CLIENT', px, y + 6, 7, 'bold', teal); T((rec.raison_sociale || '-') + (rec.enseigne ? ' (' + rec.enseigne + ')' : ''), px, y + 12, 10.5, 'bold', ink);
    T(rec.adresse || '', px, y + 17, 8, 'normal', mut); T(((rec.cp || '') + ' ' + (rec.ville || '')).replace(/^\s+/, ''), px, y + 21.5, 8, 'normal', mut);
    T('SIRET ' + (rec.siret || '-') + '  -  ' + rec.nb_boutiques + ' boutique' + (rec.nb_boutiques > 1 ? 's' : ''), px, y + 26, 8, 'normal', mut);
    T('Contact : ' + (rec.contact_nom || '-') + (rec.contact_fonction ? ' (' + rec.contact_fonction + ')' : ''), px, y + 30.5, 7.5, 'normal', mut);
    T([rec.email, rec.tel].join('  -  '), px, y + 34.5, 7.5, 'normal', mut);
    y += bh + 7;
    if (rec.commercial) { T('Commercial : ' + rec.commercial, x, y, 8.5, 'normal', mut); y += 7; }

    T('DESIGNATION', x, y, 7.5, 'bold', teal); T('QTE', W - M - 38, y, 7.5, 'bold', teal, 'right'); T('MONTANT HT', W - M, y, 7.5, 'bold', teal, 'right');
    y += 2.5; doc.setDrawColor(220, 227, 236); doc.line(x, y, W - M, y); y += 5.5;
    for (var i = 0; i < t.lignes.length; i++) {
      var l = t.lignes[i];
      T(l.lib, x, y, 9.5, 'bold', ink); T(String(l.q), W - M - 38, y, 9.5, 'normal', ink, 'right'); T(eur(l.ht), W - M, y, 9.5, 'bold', ink, 'right');
      y = wrap(l.det, x, y + 4.3, 7.8, mut, CW - 60, 3.6) + 2;
      doc.line(x, y - 1.5, W - M, y - 1.5); y += 3.5;
    }
    var tx = W - M - 70;
    T('Total HT', tx, y, 9.5, 'normal', mut); T(eur(t.ht), W - M, y, 9.5, 'bold', ink, 'right'); y += 5.5;
    T('TVA 20 %', tx, y, 9.5, 'normal', mut); T(eur(t.tva), W - M, y, 9.5, 'bold', ink, 'right'); y += 2.5;
    doc.setFillColor(227, 233, 248); doc.rect(tx - 3, y, 73, 9, 'F');
    T('Total TTC', tx, y + 6.2, 11, 'bold', ink); T(eur(t.ttc), W - M, y + 6.2, 12, 'bold', ink, 'right'); y += 16;

    T('ENGAGEMENT', x, y, 7.5, 'bold', teal); y += 5;
    y = wrap(rec.offre === 'mensuelle' ? 'Formule mensuelle : ' + eur(PRIX.mensuelle) + ' HT par mois, prelevement SEPA, reconduction tacite chaque mois. Arret sur simple resiliation ou pour defaut de paiement (CGV art. 6).' : rec.offre === 'lancement' ? 'Premiere annee a ' + eur(PRIX.lancement) + ' HT (offre de lancement -50 %), puis reconduction tacite a ' + eur(PRIX.annuelle) + ' HT par an ou ' + eur(PRIX.mensuelle) + ' HT par mois. Resiliation en cours d\'annee : decompte au prorata des mensualites sur la base de ' + eur(PRIX.mensuelle) + ' HT par mois (CGV art. 6).' : 'Formule annuelle : engagement de 12 mois, un seul paiement pour l\'annee.', x, y, 8.5, ink, CW, 4.2) + 3;

    T('PAIEMENT', x, y, 7.5, 'bold', teal); y += 5;
    if (rec.mode_paiement === 'prelevement_sepa') {
      y = wrap('Prelevement SEPA via GoCardless : ' + (rec.offre === 'mensuelle' ? 'offre mensuelle ' + eur(t.aboTtc) + ' TTC par mois' : 'offre annuelle ' + eur(t.aboTtc)) + ' TTC' + (rec.prelevement_inclut_reste && t.resteTtc > 0 ? ', kit et options ' + eur(t.resteTtc) + ' TTC preleves egalement.' : (t.resteTtc > 0 ? '. Kit et options (' + eur(t.resteTtc) + ' TTC) par virement : IBAN ' + IBAN + ' - BIC ' + BIC + ' - titulaire BAITA EURL - reference ' + rec.id + '.' : '.')), x, y, 8.5, ink, CW, 4.2);
    } else if (rec.mode_paiement === 'aucun') {
      y = wrap('Aucun paiement.', x, y, 8.5, ink, CW, 4.2);
    } else {
      y = wrap((rec.offre === 'mensuelle' ? 'Offre mensuelle : virement chaque mois de ' + eur(t.aboTtc) + ' TTC. Premier virement : ' : 'Virement bancaire de ') + eur(t.ttc) + ' TTC a l\'ordre de BAITA EURL - IBAN ' + IBAN + ' - BIC ' + BIC + ' - reference a rappeler : ' + rec.id + '. Commande enregistree en attente de paiement.', x, y, 8.5, ink, CW, 4.2);
    }
    y += 3;
    /* Interrupteur central (flowin-config.js) : bloc « satisfait ou rembourse » suspendu tant que GARANTIE_ACTIVE n'est pas true. */
    if (rec.garantie && root.FLOWIN_CONFIG && root.FLOWIN_CONFIG.GARANTIE_ACTIVE === true) {
      T('SATISFAIT OU REMBOURSE', x, y, 7.5, 'bold', teal); y += 5;
      y = wrap('Offre premiers adherents, formule annuelle : objectif de ' + (rec.garantie_clients_objectif || '-') + ' clients venus retirer leur lot en boutique sur 12 mois, avec au moins 4 animations (panier moyen declare : ' + (rec.panier_moyen ? eur(rec.panier_moyen) : '-') + ', flux journalier : ' + (rec.flux_journalier || '-') + '), donnees certifiees par ' + (rec.garantie_certifiee_par || '-') + ' le ' + (rec.garantie_certifiee_le ? fmtDateHeure(new Date(rec.garantie_certifiee_le)) : '-') + ', non modifiables. Conditions dans les CGV.', x, y, 8.5, ink, CW, 4.2) + 3;
    }
    T('SIGNATURE ELECTRONIQUE', x, y, 7.5, 'bold', teal); y += 5;
    if (signe) {
      y = wrap('Signe electroniquement par ' + rec.signataire_nom + (rec.signataire_qualite ? ' (' + rec.signataire_qualite + ')' : '') + ' pour ' + rec.raison_sociale + ', le ' + fmtDateHeure(quand) + (rec.signature_horodatage ? ' (horodatage serveur)' : '') + (rec.signature_ip ? ', adresse IP ' + rec.signature_ip : '') + '. Case "Je signe electroniquement ce bon de commande" cochee ; CGV Flowin Animation acceptees (version ' + rec.cgv_version + ').', x, y, 8.5, ink, CW, 4.2);
    } else {
      y = wrap('Document non signe (brouillon). La commande est formee a la signature electronique en ligne.', x, y, 8.5, mut, CW, 4.2);
    }
    y += 4;
    wrap('Conditions generales de vente Flowin, jeu d\'animation consultables sur flowin-events.vercel.app/cgv-animation-magasin.html. Les lots mis en jeu sont fournis par le client. Duree et renouvellement selon les CGV.', x, y, 7.5, mut, CW, 3.6);
    wrap('Flowin, produit commercial de BAITA EURL - 40 rue des Arcs, 06140 Vence - SIRET 512 026 907 00018 - RCS Grasse 512 026 907 - TVA FR82 512 026 907 - IBAN ' + IBAN + ' - BIC ' + BIC, x, 287, 6.5, mut, CW, 3);
    return doc;
  }

  var API = { PRIX: PRIX, IBAN: IBAN, BIC: BIC, NOM_OFFRE: NOM_OFFRE, eur: eur, fmtDate: fmtDate, fmtDateHeure: fmtDateHeure, calcul: calcul, calculDepuisCommande: calculDepuisCommande, construire: construire };
  root.FlowinBonPDF = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof self !== 'undefined' ? self : this);
