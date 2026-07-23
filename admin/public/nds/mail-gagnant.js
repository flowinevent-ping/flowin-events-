/* ============================================================================
   SOURCE UNIQUE DU MESSAGE AU GAGNANT — Flowin / Nuits du Sud
   ----------------------------------------------------------------------------
   Ce fichier est LA reference. Il existait auparavant trois copies divergentes
   du meme email (dashboard, page tirages, page lots) : l une parlait encore du
   festival en cours et ne contenait aucun billet. Toute page qui envoie un mail
   a un gagnant DOIT inclure ce fichier et appeler flowinMailGagnant().

   REGLE : ne jamais recopier ce texte ailleurs. Le corriger ici, une seule fois.

   Champs attendus (tous optionnels sauf email) :
     type, prenom, joueur_nom, email / joueur_email, lot_nom, lot_valeur,
     ticket_code, retrait_token, partenaire_nom, partenaire_adresse,
     partenaire_tel, conditions, date / date_soir
   ========================================================================== */
(function (root) {
  'use strict';

  function prenomDe(t) {
    return String(t.prenom || t.joueur_nom || '').trim().split(/\s+/)[0] || '';
  }
  function lienBillet(t) {
    if (t.billet_lien) return t.billet_lien;              // lien impose manuellement
    if (!t.retrait_token) return '';
    return root.location.origin + '/nds/billets-partenaires.html?t=' + encodeURIComponent(t.retrait_token);
  }
  function puces(conditions) {
    if (!conditions) return [];
    return String(conditions).split('\u00b7')
      .map(function (c) { return c.trim(); })
      .filter(function (c) { return c.length > 5; })
      .map(function (c) { return '   - ' + c; });
  }
  function dateFr(d) {
    if (!d) return '';
    var p = String(d).split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : String(d);
  }

  function sujet(t) {
    return (t && t.type === 'soir')
      ? 'Nuits du Sud & Flowin — Grand Jeu Concours — Vous avez gagné une place !'
      : 'Nuits du Sud & Flowin — Grand Jeu Concours — Vous avez gagné !';
  }

  function corps(t) {
    t = t || {};
    var grand  = (t.type !== 'soir');
    var lien   = lienBillet(t);
    var comm   = t.partenaire_nom || '';
    var coord  = [t.partenaire_adresse, t.partenaire_tel].filter(Boolean).join(' — ');
    var L = ['Bonjour ' + prenomDe(t) + ',', ''];

    if (grand) {
      L.push('Waouh, bravo ! Au grand tirage du jeu des Nuits du Sud 2026, tu as gagné :', '',
             '   ' + (t.lot_nom || 'un lot') + (t.lot_valeur != null ? ' — valeur ' + t.lot_valeur + ' €' : ''));
      if (comm)  L.push('   chez ' + comm);
      if (coord) L.push('   ' + coord);
      L.push('');
      if (lien) {
        L.push('>>> TON BILLET EST ICI <<<', '',
               '   ' + lien, '',
               "Clique sur ce lien : tu peux l'imprimer ou le garder sur ton téléphone.",
               "C'est ce billet, avec son QR code, que tu présenteras en boutique.", '');
      }
      L.push("Merci d'avoir participé, et bravo encore : tu faisais partie de plus de 600 joueurs.", '',
             'COMMENT EN PROFITER, EN 3 ÉTAPES', '',
             '   1. Rends-toi chez ' + (comm || 'notre commerçant partenaire'),
             '   2. Présente ton billet, papier ou écran',
             "   3. Le commerçant scanne le QR code et valide — c'est tout", '');
      var c = puces(t.conditions);
      if (c.length) { L.push('À SAVOIR', ''); L.push.apply(L, c); L.push(''); }
      if (t.ticket_code) L.push('Ton numéro de billet : ' + t.ticket_code, '');
      L.push('Encore bravo, et à bientôt chez notre partenaire.', '');
    } else {
      var d = t.date_soir || t.date;
      L.push('Waouh, bravo ! Tu as gagné ta place de concert pour les Nuits du Sud'
             + (d ? ', pour la soirée du ' + dateFr(d) : '') + ' !', '');
      if (lien) L.push('Voici ton billet : ' + lien, '');
      L.push("Présente-toi avec cet email à l'entrée, on s'occupe du reste.", '',
             "Merci d'avoir participé.", '');
    }
    L.push('Les Nuits du Sud, la Ville de Vence et Flowin',
           'flowinevent@gmail.com · 06 16 35 49 36');
    return L.join('\n');
  }

  function gmailUrl(t) {
    t = t || {};
    return 'https://mail.google.com/mail/?view=cm&fs=1'
      + '&to=' + encodeURIComponent(t.email || t.joueur_email || '')
      + '&su=' + encodeURIComponent(sujet(t))
      + '&body=' + encodeURIComponent(corps(t));
  }

  root.flowinMailGagnant = {
    sujet: sujet,
    corps: corps,
    gmailUrl: gmailUrl,
    lienBillet: lienBillet
  };
})(window);
