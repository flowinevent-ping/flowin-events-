/* ============================================================================
   SOURCE UNIQUE DU MESSAGE DE REMERCIEMENT AUX PARTENAIRES — Flowin / Nuits du Sud
   ----------------------------------------------------------------------------
   Meme principe que mail-gagnant.js : reference unique, ne jamais recopier ce
   texte ailleurs, le corriger ici, une seule fois.

   Contenu dicte par Romain le 28/07/2026, mis en forme ici sans reformulation
   du fond. Reutilise deux mecanismes DEJA CONSTRUITS et deja en prod :
     - billets-partenaires.html?p=<partenaire_id>  -> planche imprimable des
       gagnants CONFIRMES de ce partenaire uniquement (filtrage cote serveur)
     - public/nds/bilan/bilan-nds-2026.png          -> visuel bilan chiffre
       du festival (deja produit, 720x1493, valide)
   Le PIN professionnel (colonne partenaires.pin_pro, migration du 28/07/2026)
   est inclus directement dans ce mail -- c'etait le seul canal manquant pour
   le communiquer, personne n'avait ete prevenu individuellement avant ce texte.

   Champs attendus :
     partenaire_nom, partenaire_id, contact_prenom, pin_pro
   ========================================================================== */
(function (root) {
  'use strict';

  function lienPlanche(partenaireId) {
    return root.location.origin + '/nds/billets-partenaires.html?p=' + encodeURIComponent(partenaireId);
  }
  function lienBilan() {
    return root.location.origin + '/nds/bilan/bilan-nds-2026.png';
  }

  function sujet() {
    return 'Nuits du Sud & Flowin — Merci pour votre participation !';
  }

  function corps(t) {
    t = t || {};
    var planche = lienPlanche(t.partenaire_id);
    var bilan = lienBilan();
    var salut = t.contact_prenom ? ('Bonjour ' + t.contact_prenom + ',') : 'Bonjour,';

    var L = [salut, '',
      "Merci beaucoup pour votre participation aux Nuits du Sud 2026 avec Flowin !", '',
      '>>> VOTRE BILAN CHIFFRÉ <<<', '', '   ' + bilan, '',
      '>>> VOS GAGNANTS À VALIDER <<<', '', '   ' + planche, '',
      "Cette page liste uniquement les gagnants confirmés chez vous. Vous pouvez l'imprimer.", '',
      'COMMENT VALIDER UN BILLET GAGNANT, EN 4 ÉTAPES', '',
      '   1. Le client vous présente son billet, papier ou écran',
      '   2. Prenez votre téléphone et flashez le QR code du billet',
      '   3. Sur la page qui s\u2019ouvre, saisissez votre code professionnel pour vous identifier : ' + (t.pin_pro || '····'),
      '   4. Validez le billet — il est automatiquement décompté de votre stock', '',
      'EN CAS DE PROBLÈME DE CONNEXION', '',
      "   Le client peut vous envoyer son billet par WhatsApp ou SMS. Vous avez alors deux solutions :",
      '   - décompter vous-même depuis la liste imprimée ci-dessus',
      '   - nous appeler au 06 16 35 49 36, nous le décomptons pour vous', '',
      "Merci encore pour votre confiance et votre participation aux Nuits du Sud.",
      "N\u2019hésitez pas à nous faire un retour sur le ressenti de votre clientèle.", '',
      'ET APRÈS ?', '',
      "Continuez à faire vivre votre animation pour développer votre CRM, renforcer votre image ou constituer votre base clients.",
      "N\u2019hésitez pas à nous contacter : nous créons vos événements et vos jeux sur mesure, et pouvons vous intégrer à de futurs super-événements locaux.", '',
      'Les Nuits du Sud, la Ville de Vence et Flowin',
      'flowinevent@gmail.com · 06 16 35 49 36'];
    return L.join('\n');
  }

  function gmailUrl(t) {
    t = t || {};
    return 'https://mail.google.com/mail/?view=cm&fs=1'
      + '&to=' + encodeURIComponent(t.email || '')
      + '&su=' + encodeURIComponent(sujet())
      + '&body=' + encodeURIComponent(corps(t));
  }

  root.flowinMailPartenaire = { sujet: sujet, corps: corps, gmailUrl: gmailUrl, lienPlanche: lienPlanche, lienBilan: lienBilan };
})(window);
