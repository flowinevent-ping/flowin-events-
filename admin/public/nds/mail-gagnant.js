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
     partenaire_tel, conditions, date / date_soir,
     operation (id du super event ou de l event), operation_nom

   REFERENTIEL 36 (16/09) : l email est au nom de SON operation. Sans
   `operation`, ou pour se-nds-2026, le texte de Nuits du Sud est inchange.
   Pour toute autre operation, le meme message est ecrit au nom de
   `operation_nom` ; le billet est le meme pour toutes (billets-partenaires.html).
   ========================================================================== */
(function (root) {
  'use strict';

  function prenomDe(t) {
    return String(t.prenom || t.joueur_nom || '').trim().split(/\s+/)[0] || '';
  }
  function estNds(t) {
    return !t || !t.operation || t.operation === 'se-nds-2026';
  }
  function nomOp(t) {
    return String((t && t.operation_nom) || '').trim() || 'notre jeu';
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
    if (t && t.type === 'relance') {
      return estNds(t) ? 'Nuits du Sud & Flowin — Ton lot t’attend toujours !' : (nomOp(t) + ' & Flowin — Ton lot t’attend toujours !');
    }
    if (t && t.type === 'merci') {
      return estNds(t) ? 'Nuits du Sud & Flowin — Merci d’être passé !' : (nomOp(t) + ' & Flowin — Merci d’être passé !');
    }
    if (!estNds(t)) return nomOp(t) + ' & Flowin — Vous avez gagné !';
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
    var prenom = prenomDe(t);
    var L;

    /* Romain (21/10), apres relecture du texte reel genere : « Hey, salut
       Julie ! Merci encore [...] » en UN SEUL salut fusionne, pas un
       "Bonjour X," suivi d un second "Hey, salut" (doublon corrige ici) --
       et la ligne "nous n avons pas encore de trace de ton passage" jugee
       trop froide, remplacee par un rappel positif (temps restant + offrir
       a un proche). Approuve mot pour mot avant implementation. */
    if (t.type === 'relance') {
      L = ["Hey, salut " + prenom + " ! Merci encore d'avoir participé au jeu " + (estNds(t) ? 'des Nuits du Sud' : nomOp(t)) + " !", '',
           "Petit rappel : tu as gagné :", '',
           '   ' + (t.lot_nom || 'un lot') + (t.lot_valeur != null ? ' — valeur ' + t.lot_valeur + ' €' : '')];
      if (comm)  L.push('   chez ' + comm);
      if (coord) L.push('   ' + coord);
      L.push('', "N'oublie pas : il te reste encore un peu de temps pour utiliser ton bon — ou pour en faire profiter un ami ou un proche !", '');
      if (lien) {
        L.push('>>> TON BILLET EST ICI <<<', '',
               '   ' + lien, '',
               "Clique sur ce lien : tu peux l'imprimer ou le garder sur ton téléphone.",
               "C'est ce billet, avec son QR code, que tu présenteras en boutique.", '');
      }
      L.push('COMMENT EN PROFITER, EN 3 ÉTAPES', '',
             '   1. Rends-toi chez ' + (comm || 'notre commerçant partenaire'),
             '   2. Présente ton billet, papier ou écran',
             "   3. Le commerçant scanne le QR code et valide — c'est tout", '');
      var cRelance = puces(t.conditions);
      if (cRelance.length) { L.push('À SAVOIR', ''); L.push.apply(L, cRelance); L.push(''); }
      if (t.ticket_code) L.push('Ton numéro de billet : ' + t.ticket_code, '');
      L.push('À bientôt chez notre partenaire !', '',
             estNds(t) ? 'Flowin, les Nuits du Sud, la Ville de Vence' : ('Flowin & ' + nomOp(t)),
             'flowinevent@gmail.com · 04 93 59 91 37');
      return L.join('\n');
    }

    if (t.type === 'merci') {
      L = ["Hey, salut " + prenom + " ! Merci encore d'avoir participé au jeu " + (estNds(t) ? 'des Nuits du Sud' : nomOp(t)) + " !", '',
           "Nous avons bien vu que tu es passé récupérer :", '',
           '   ' + (t.lot_nom || 'ton lot') + (t.lot_valeur != null ? ' — valeur ' + t.lot_valeur + ' €' : '')];
      if (comm) L.push('   chez ' + comm);
      L.push('', "On espère que ça t'a plu ! À très vite pour de nouvelles animations.", '',
             estNds(t) ? 'Flowin, les Nuits du Sud, la Ville de Vence' : ('Flowin & ' + nomOp(t)),
             'flowinevent@gmail.com · 04 93 59 91 37');
      return L.join('\n');
    }

    L = ['Bonjour ' + prenom + ',', ''];
    if (grand) {
      L.push(estNds(t)
               ? 'Waouh, bravo ! Au grand tirage du jeu des Nuits du Sud 2026, tu as gagné :'
               : 'Bravo ! Au jeu ' + nomOp(t) + ', tu as gagné :', '',
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
      L.push("Merci d'avoir participé, et bravo encore !", '',
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
    L.push(estNds(t) ? 'Flowin, les Nuits du Sud, la Ville de Vence' : ('Flowin & ' + nomOp(t)),
           'flowinevent@gmail.com · 04 93 59 91 37');
    return L.join('\n');
  }

  /* Romain (21/10) : « je crois qu'on n'envoie pas depuis la boite
     flowinevent@gmail.com [...] il faut que ca parte de cette boite ». Sans
     indication, Gmail compose avec le compte Google "actif" du navigateur,
     qui peut etre un autre compte que celui connecte pour Flowin -- authuser
     force Gmail a utiliser CE compte, s il est bien connecte dans le meme
     navigateur (ne connecte personne a sa place, bascule seulement parmi les
     comptes deja ouverts). */
  function gmailUrl(t) {
    t = t || {};
    return 'https://mail.google.com/mail/?authuser=flowinevent%40gmail.com&view=cm&fs=1'
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
