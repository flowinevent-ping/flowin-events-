/* Visite guidée Flowin Event : démo cliquable, 100 % locale.
   Aucune écriture en base, aucun appel réseau. Toutes les données sont fictives. */
(function () {
  'use strict';

  /* ---------- Pictogrammes (SVG, aucun emoji) ---------- */
  var ICONS = {
    back: '<path d="M15 18l-6-6 6-6"/>',
    chev: '<path d="M9 18l6-6-6-6"/>',
    home: '<path d="M3 10.5L12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0z"/><path d="M17 5h3v2a3 3 0 01-3 3M7 5H4v2a3 3 0 003 3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4.5 9 8 12 8zM12 8s2-5 4.5-3.5S15 8 12 8z"/>',
    map: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    chat: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4"/>',
    store: '<path d="M4 10v10h16V10M3 4h18l-1 6H4zM9 20v-5h6v5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/><circle cx="8.5" cy="15.5" r="1"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
    vote: '<path d="M4 13l4 4 12-12"/><rect x="3" y="3" width="18" height="18" rx="3"/>',
    ticket: '<path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>',
    down: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 014 6"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    camera: '<rect x="3" y="5" width="18" height="15" rx="4"/><circle cx="12" cy="12.5" r="3.5"/><path d="M17 8.5h.01"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    car: '<path d="M5 16v-5l2-5h10l2 5v5M3 16h18v3H3z"/><circle cx="7.5" cy="13" r="1"/><circle cx="16.5" cy="13" r="1"/>'
  };
  (function sprite() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">';
    for (var k in ICONS) { if (ICONS.hasOwnProperty(k)) { s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + '</symbol>'; } }
    document.body.insertAdjacentHTML('afterbegin', s + '</svg>');
  })();
  function ic(n, c) { return '<svg class="i' + (c ? ' ' + c : '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  var LOGO_ARA = '/nds/partenaires/pegase.png';
  function logoAra(cls) {
    return '<span class="plogo' + (cls ? ' ' + cls : '') + '"><img src="' + LOGO_ARA + '" alt="Auto-École de l\'ARA" onerror="this.parentNode.innerHTML=\'<em>ARA</em>\'"></span>';
  }
  function logoBoutique(cls) { return '<span class="plogo' + (cls ? ' ' + cls : '') + '"><em>BE</em></span>'; }

  /* ---------- QR de démonstration (motif déterministe, non scannable) ---------- */
  function qr(seed, size) {
    var n = 25, c = size / n, x, y, s = 0, out = '', i;
    for (i = 0; i < seed.length; i++) { s = (s * 31 + seed.charCodeAt(i)) % 2147483647; }
    function rnd() { s = (s * 48271) % 2147483647; return s / 2147483647; }
    function finder(fx, fy) {
      return '<rect x="' + fx * c + '" y="' + fy * c + '" width="' + 7 * c + '" height="' + 7 * c + '" fill="#0E1B30"/>' +
        '<rect x="' + (fx + 1) * c + '" y="' + (fy + 1) * c + '" width="' + 5 * c + '" height="' + 5 * c + '" fill="#fff"/>' +
        '<rect x="' + (fx + 2) * c + '" y="' + (fy + 2) * c + '" width="' + 3 * c + '" height="' + 3 * c + '" fill="#0E1B30"/>';
    }
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        if ((x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)) { continue; }
        if (rnd() > 0.52) { out += '<rect x="' + x * c + '" y="' + y * c + '" width="' + c + '" height="' + c + '" fill="#0E1B30"/>'; }
      }
    }
    return '<span class="qrbox"><svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="QR code de démonstration">' +
      '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + out + finder(0, 0) + finder(18, 0) + finder(0, 18) + '</svg></span>';
  }

  /* ---------- Carte stylisée ---------- */
  function mapBg() {
    return '<svg class="bg" viewBox="0 0 354 250" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M-10 190 C80 160 120 220 220 180 S330 150 370 170 V260 H-10z" fill="#BBD3E6" opacity=".8"/>' +
      '<path d="M0 60 L354 110 M40 0 L120 250 M210 0 L250 250 M0 140 L354 70" stroke="#fff" stroke-width="9" fill="none"/>' +
      '<path d="M0 60 L354 110 M40 0 L120 250 M210 0 L250 250 M0 140 L354 70" stroke="#D9E1D2" stroke-width="5" fill="none"/>' +
      '<rect x="140" y="20" width="44" height="30" rx="5" fill="#D6DDCF"/><rect x="270" y="20" width="60" height="38" rx="5" fill="#D6DDCF"/>' +
      '<rect x="60" y="80" width="50" height="40" rx="5" fill="#D6DDCF"/><rect x="150" y="120" width="40" height="34" rx="5" fill="#C7DDB8"/></svg>';
  }
  function pin(x, y, col, act, label, on) {
    return '<button class="pin ' + col + (on ? ' on' : '') + '" style="left:' + x + '%;top:' + y + '%" ' + act + ' aria-label="' + esc(label) + '"><i></i></button>';
  }

  /* ---------- Données fictives ---------- */
  var BANQUE = [
    { q: 'En agglomération, quelle distance minimale laisser pour dépasser un cycliste ?', r: ['50 cm', '1 mètre', '2 mètres'], ok: 1 },
    { q: 'Quel est le taux d\'alcool maximal autorisé pour un permis probatoire ?', r: ['0,2 g/L de sang', '0,5 g/L de sang', '0,8 g/L de sang'], ok: 0 },
    { q: 'Sur autoroute, par temps de pluie, la vitesse est limitée à :', r: ['90 km/h', '110 km/h', '130 km/h'], ok: 1 },
    { q: 'Le port de gants homologués à moto est :', r: ['Conseillé', 'Obligatoire', 'Réservé à l\'autoroute'], ok: 1 },
    { q: 'Quel numéro d\'urgence fonctionne dans toute l\'Union européenne ?', r: ['112', '15', '911'], ok: 0 },
    { q: 'Un piéton s\'engage sur un passage piéton. Vous devez :', r: ['Klaxonner', 'Lui céder le passage', 'Accélérer pour passer avant'], ok: 1 },
    { q: 'Combien de points a un jeune conducteur à l\'obtention du permis ?', r: ['6 points', '9 points', '12 points'], ok: 0 },
    { q: 'Hors agglomération, pour dépasser un cycliste, il faut laisser au moins :', r: ['1 mètre', '1,5 mètre', '3 mètres'], ok: 1 },
    { q: 'Tenir son téléphone en main en conduisant entraîne un retrait de :', r: ['1 point', '3 points', '6 points'], ok: 1 },
    { q: 'L\'intervalle de sécurité minimal avec le véhicule qui précède est de :', r: ['1 seconde', '2 secondes', '5 secondes'], ok: 1 }
  ];

  var QUIZ = [
    { q: 'Tu as ton permis depuis moins de 3 ans. Quel taux d\'alcool maximal est autorisé ?', r: ['0,2 g/L de sang', '0,5 g/L de sang', '0,8 g/L de sang'], ok: 0,
      e: 'En permis probatoire, la limite est 0,2 g/L de sang, soit en pratique zéro verre.' },
    { q: 'En ville, quelle distance minimale dois-tu laisser pour dépasser un cycliste ?', r: ['50 cm', '1 mètre', '1,5 mètre'], ok: 1,
      e: '1 mètre en agglomération, 1,5 mètre hors agglomération.' },
    { q: 'Sur autoroute, quand il pleut, la vitesse maximale est :', r: ['130 km/h', '110 km/h', '90 km/h'], ok: 1,
      e: 'Par temps de pluie, 130 devient 110 km/h sur autoroute.' },
    { q: 'À moto, les gants homologués sont :', r: ['Obligatoires', 'Conseillés seulement', 'Obligatoires l\'hiver'], ok: 0,
      e: 'Depuis 2016, les gants homologués sont obligatoires pour le conducteur et le passager.' },
    { q: 'À moto, pour bien voir et être vu, tu roules de jour :', r: ['Feux éteints', 'Feux de croisement allumés', 'Feux de route allumés'], ok: 1,
      e: 'Les feux de croisement sont obligatoires de jour pour les deux-roues motorisés.' },
    { q: 'Un piéton s\'engage sur le passage piéton. Que fais-tu ?', r: ['Je klaxonne', 'Je lui cède le passage', 'Je passe avant lui'], ok: 1,
      e: 'Le piéton engagé ou manifestant l\'intention de traverser est prioritaire.' },
    { q: 'Quel numéro d\'urgence fonctionne partout dans l\'Union européenne ?', r: ['112', '17', '911'], ok: 0,
      e: 'Le 112 est le numéro d\'urgence européen, gratuit, depuis tout téléphone.' },
    { q: 'Tenir ton téléphone en main en conduisant te coûte :', r: ['1 point', '3 points', '6 points'], ok: 1,
      e: 'Retrait de 3 points et amende forfaitaire de 135 euros.' }
  ];

  var BONUS = [
    { q: 'As-tu le permis 125 ?', r: ['Oui', 'Non', 'Je le prépare'] },
    { q: 'Depuis quand as-tu ton permis ?', r: ['Pas encore', 'Moins de 3 ans', '3 à 10 ans', 'Plus de 10 ans'] },
    { q: 'Comment nous as-tu connus ?', r: ['Réseaux sociaux', 'Bouche à oreille', 'En passant devant', 'Le festival'] },
    { q: 'Un stage de conduite sur glace t\'intéresserait-il ?', r: ['Oui', 'Peut-être', 'Non'] },
    { q: 'Faire de la moto sur piste, un rêve à réaliser ?', r: ['Oui', 'Peut-être', 'Non'] },
    { q: 'Quelqu\'un dans ton entourage souhaite-t-il passer le permis voiture ou moto ?', r: ['Oui, voiture', 'Oui, moto', 'Non'] }
  ];

  var JEUX = [
    { id: 'quiz', nom: 'Quiz + bonus', ic: 'trophy', d: 'Des questions, puis un petit sondage. Idéal pour faire connaître votre métier.', col: '#3B5CC4' },
    { id: 'roue', nom: 'Roue', ic: 'wheel', d: 'Le joueur tourne la roue et découvre son lot tout de suite.', col: '#7A4FE0' },
    { id: 'vote', nom: 'Vote', ic: 'vote', d: 'Vos clients votent pour leur produit préféré.', col: '#1B3A5C' },
    { id: 'tombola', nom: 'Tombola', ic: 'ticket', d: 'Chaque participant reçoit un ticket, tirage au sort à la fin.', col: '#5B34C2' }
  ];

  var EVENTS = [
    { id: 'fe', nom: 'Festival Exemple', lieu: 'Ville Exemple', per: 'Été 2027 (exemple)', x: 34, y: 42, st: 12 },
    { id: 'me', nom: 'Marché de Noël Exemple', lieu: 'Ville Exemple', per: 'Décembre (exemple)', x: 68, y: 30, st: 8 },
    { id: 'fm', nom: 'Fête de la musique Exemple', lieu: 'Ville Exemple', per: 'Juin (exemple)', x: 56, y: 70, st: 15 }
  ];

  var FORMULES_SE = [
    { id: 'sd', nom: 'Sponsor digital', px: '500 € HT', ic: 'phone', d: 'Votre commerce est visible dans le jeu, en ligne.',
      inc: ['Diffusé : logo et lien dans l\'application du jeu', 'Diffusé : cité dans les publications en ligne de l\'événement', 'Imprimé : rien, 100 % digital'] },
    { id: 'pdp', nom: 'Partenaire digital + sur place', px: '1 331 € HT', ic: 'store', d: 'Votre commerce devient une station jeu de l\'événement.',
      inc: ['Diffusé : tout le Sponsor digital', 'Diffusé : votre station jeu sur la carte du jeu', 'Imprimé : affiche et chevalet avec le QR de votre station'] },
    { id: 'pp', nom: 'Partenaire premium tous supports', px: '3 331 € HT', ic: 'star', d: 'Votre marque sur tous les supports de l\'événement.',
      inc: ['Diffusé : tout le Partenaire digital + sur place', 'Diffusé : questions du jeu à votre marque', 'Imprimé : votre logo sur tous les supports imprimés de l\'événement'] }
  ];
  var PRIX_SE_NOTE = 'Prix proposés, ajustables par événement.';

  function initState() {
    return {
      theme: S && S.theme ? S.theme : null,
      pro: { prenom: 'Prénom', nom: 'Nom', email: 'vous@exemple.fr', tel: '[à compléter]' },
      etab: { siret: '', nom: '', adr: '', sect: '', found: false, searching: false },
      mdp: '',
      steps: [false, false, false],
      jeu: 'quiz', formule: 'digital',
      theme_q: 'sécurité routière', gen: 'idle', qs: [], qNext: 0,
      lots: [
        { titre: '1 heure de conduite offerte', logo: 'ara', cond: 'Valable 3 mois, sur rendez-vous, non échangeable.', qte: 5, mode: 'instant',
          hist: [{ n: 'Joueur A.', g: '12/07', r: '14/07' }, { n: 'Joueur B.', g: '13/07', r: null }] },
        { titre: 'Bon de réduction en boutique', logo: 'be', cond: 'Valable sur un achat, jusqu\'au 31/12.', qte: 20, mode: 'tirage', hist: [] }
      ],
      dDeb: '2027-03-01', dFin: '2027-03-31',
      publie: false,
      qrPrint: 58, qrWeb: 41, paie: 'mois',
      sup: [
        { n: 'Facebook', ic: 'users', sc: 38 }, { n: 'Instagram', ic: 'camera', sc: 26 }, { n: 'TikTok', ic: 'music', sc: 19 },
        { n: 'Site internet', ic: 'globe', sc: 12 }, { n: 'Email', ic: 'mail', sc: 7 }
      ],
      se: null, seF: null, seEnvoye: false, seDemande: false,
      visTab: 'festival', gTab: 'a',
      gagnants: [
        { n: 'Joueur A.', lot: '1 heure de conduite offerte', g: '12/07', r: '14/07' },
        { n: 'Joueur B.', lot: '1 heure de conduite offerte', g: '13/07', r: null },
        { n: 'Joueur C.', lot: 'Bon de réduction en boutique', g: '14/07', r: null }
      ],
      org: { nom: 'Festival Exemple', deb: '2027-07-09', fin: '2027-07-18', px: 45, py: 50, jeu: 'quiz', f: { sd: true, pdp: true, pp: false } },
      demandes: [
        { n: 'Boutique Exemple', f: 'Partenaire digital + sur place', s: 'att' },
        { n: 'Café Exemple', f: 'Sponsor digital', s: 'att' },
        { n: 'Librairie Exemple', f: 'Partenaire premium tous supports', s: 'ok' }
      ],
      qi: 0, rep: null, score: 0, bi: 0, bonusRep: {},
      j: { prenom: '', email: '', genre: '', cp: '', ok: false }
    };
  }
  var S = null;
  S = initState();
  try { S.theme = localStorage.getItem('fl-visite-theme'); } catch (e) { S.theme = null; }
  function applyTheme() { if (S.theme) { document.documentElement.setAttribute('data-theme', S.theme); } else { document.documentElement.removeAttribute('data-theme'); } }
  applyTheme();
  function isDark() { return S.theme === 'dark' || (!S.theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }

  /* ---------- Gabarits ---------- */
  function hd(t, o) {
    o = o || {};
    var left = o.noBack ? '<span class="ib ghost"></span>' : '<button class="ib" data-back aria-label="Retour">' + ic('back') + '</button>';
    var right = o.right || '<button class="ib" data-act="theme" aria-label="Changer de thème">' + ic(isDark() ? 'sun' : 'moon') + '</button>';
    return '<div class="hd">' + left + '<div class="t">' + (o.k ? '<small>' + esc(o.k) + '</small>' : '') + esc(t) + '</div>' + right + '</div>' +
      (o.p != null ? '<div class="prog" aria-label="Progression"><i style="width:' + o.p + '%"></i></div>' : '');
  }
  function foot(inner) { return '<div class="foot">' + inner + '</div>'; }
  function btn(label, attrs, cls, icn) { return '<button class="btn' + (cls ? ' ' + cls : '') + '" ' + (attrs || '') + '>' + (icn ? ic(icn) : '') + esc(label) + '</button>'; }
  function tap(icn, picCls, title, subt, attrs, extra) {
    return '<button class="card tap" ' + attrs + '><span class="pic ' + (picCls || '') + '">' + ic(icn) + '</span><span class="grow"><b>' + esc(title) + '</b><span>' + esc(subt) + '</span></span>' + (extra || ic('chev')) + '</button>';
  }
  function field(label, key, val, type, ph) {
    return '<label class="f"><span>' + esc(label) + '</span><input class="in" data-bind="' + key + '" type="' + (type || 'text') + '" value="' + esc(val) + '" placeholder="' + esc(ph || '') + '"></label>';
  }
  function jeuById(id) { for (var i = 0; i < JEUX.length; i++) { if (JEUX[i].id === id) { return JEUX[i]; } } return JEUX[0]; }
  function seById(id) { for (var i = 0; i < EVENTS.length; i++) { if (EVENTS[i].id === id) { return EVENTS[i]; } } return EVENTS[0]; }
  function fById(id) { for (var i = 0; i < FORMULES_SE.length; i++) { if (FORMULES_SE[i].id === id) { return FORMULES_SE[i]; } } return FORMULES_SE[0]; }
  function fmtD(d) { if (!d) { return '[date]'; } var p = d.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function lotLogo(l, cls) { return l.logo === 'ara' ? logoAra(cls) : logoBoutique(cls); }

  /* ---------- Écrans ---------- */
  var SCREENS = {}, ORDER = [];
  var GROUPS = { c: 'Accueil', p: 'Commerçant', o: 'Organisateur', j: 'Joueur' };
  function def(id, g, label, r, o) { SCREENS[id] = { g: g, label: label, r: r, tabs: o && o.tabs }; ORDER.push(id); }

  def('accueil', 'c', 'Accueil à 3 portes', function () {
    return '<div class="hd"><span class="ib ghost"></span><div class="t"><span class="logo">Flow<b>in</b> Event</span></div>' +
      '<button class="ib" data-act="theme" aria-label="Changer de thème">' + ic(isDark() ? 'sun' : 'moon') + '</button></div>' +
      '<div class="kick">Animer · Booster · Fidéliser</div>' +
      '<h1>Faites jouer vos clients.</h1><p class="sub">Des jeux simples, en boutique ou dans un événement. Qui êtes-vous ?</p>' +
      '<button class="door pro" data-go="p-promesse"><span class="pic">' + ic('store', 'l') + '</span><span class="grow"><b>Je suis commerçant</b><span>Flowin Animation : le jeu dans mon commerce</span></span>' + ic('chev') + '</button>' +
      '<button class="door org" data-go="o-accueil"><span class="pic">' + ic('flag', 'l') + '</span><span class="grow"><b>J\'organise un événement</b><span>Flowin Super Event : un seul jeu pour tous vos partenaires</span></span>' + ic('chev') + '</button>' +
      '<button class="door jou" data-go="j-accueil"><span class="pic">' + ic('play', 'l') + '</span><span class="grow"><b>Je joue</b><span>Essayer le Quiz + bonus d\'un partenaire</span></span>' + ic('chev') + '</button>' +
      '<p class="small center" style="margin-top:auto;padding-top:16px">Visite guidée sans compte. Rien n\'est enregistré.</p>';
  });

  /* ===== PRO : première fois ===== */
  def('p-promesse', 'p', '1. Promesse', function () {
    return hd('Flowin Animation', { k: 'Étape 1 sur 8', p: 12 }) +
      '<div class="hero-pro"><div class="kick" style="color:#fff;opacity:.8">Animer · Booster · Fidéliser</div><h1>Votre premier jeu, prêt aujourd\'hui.</h1>' +
      '<p class="sub">Vos clients scannent, jouent, gagnent. Vous les retrouvez.</p></div>' +
      chiffres() +
      '<ul class="list card">' +
      '<li><span class="pic ok">' + ic('eye') + '</span>Vous créez et voyez votre jeu avant de payer</li>' +
      '<li><span class="pic ok">' + ic('spark') + '</span>L\'assistant écrit les questions</li>' +
      '<li><span class="pic ok">' + ic('qr') + '</span>Votre QR est prêt à imprimer à la fin</li></ul>' +
      foot(btn('Je crée mon jeu', 'data-go="p-etab"') + '<div class="center"><button class="lnk" data-go="p-dash">J\'ai déjà un compte</button></div>');
  });
  function chiffres() {
    return '<div class="chiffres"><div class="card chiffre"><b>56 %</b><span>des participants souhaitent garder le contact</span></div>' +
      '<div class="card chiffre"><b>Plus de 70</b><span>lots distribués dans les commerces locaux</span></div></div>';
  }
  def('p-etab', 'p', '2. Établissement (SIRET)', function () {
    var e = S.etab;
    var bt = e.searching ? '<button class="btn" disabled><span class="spinner"></span>Recherche…</button>' : btn('Rechercher', 'data-act="siret"', e.found ? 'line' : '', 'search');
    return hd('Votre établissement', { k: 'Étape 2 sur 8', p: 25 }) + '<h1>Votre SIRET suffit</h1>' +
      '<p class="sub">Nous retrouvons votre commerce et remplissons le reste.</p>' +
      '<label class="f"><span>Numéro SIRET (14 chiffres)</span><input class="in" inputmode="numeric" data-bind="etab.siret" value="' + esc(e.siret) + '" placeholder="Tapez votre SIRET"></label>' + bt +
      (e.found ? '<div class="card" style="margin-top:14px"><div class="row"><span class="chip ok">' + ic('check', 's') + 'Trouvé</span><span class="small">Vérifiez, modifiez si besoin.</span></div>' +
        '<label class="f"><span>Nom du commerce</span><input class="in filled" data-bind="etab.nom" value="' + esc(e.nom) + '"></label>' +
        '<label class="f"><span>Adresse</span><input class="in filled" data-bind="etab.adr" value="' + esc(e.adr) + '"></label>' +
        '<label class="f"><span>Secteur</span><input class="in filled" data-bind="etab.sect" value="' + esc(e.sect) + '"></label></div>' : '<p class="small">Démo : tapez n\'importe quel numéro, ou laissez vide.</p>') +
      foot(btn('Continuer', 'data-go="p-compte"' + (e.found ? '' : ' disabled')));
  });
  def('p-compte', 'p', '3. Email et mot de passe', function () {
    return hd('Votre compte', { k: 'Étape 3 sur 8', p: 37 }) + '<h1>Votre accès</h1>' +
      field('Email professionnel', 'pro.email', S.pro.email, 'email') +
      '<label class="f"><span>Mot de passe</span><input class="in" type="password" data-bind="mdp" value="' + esc(S.mdp) + '" placeholder="8 caractères minimum"></label>' +
      '<div id="mdp-check">' + mdpCheck() + '</div>' +
      foot(btn('Créer mon espace', 'data-act="creer-compte"', '', 'lock'));
  });
  function mdpCheck() {
    var m = S.mdp || '';
    function l(ok, t) { return '<li><span class="dot' + (ok ? ' done' : '') + '">' + (ok ? ic('check', 's') : '') + '</span>' + t + '</li>'; }
    return '<ul class="list">' + l(m.length >= 8, '8 caractères minimum') + l(/[0-9]/.test(m), 'Au moins un chiffre') + l(/[A-Z]/.test(m), 'Au moins une majuscule') + '</ul>' +
      '<p class="small">Démo : vous pouvez continuer même sans mot de passe.</p>';
  }

  /* ===== PRO : espace ===== */
  function stepsDone() { var n = 0; for (var i = 0; i < 3; i++) { if (S.steps[i]) { n++; } } return n; }
  function animCards() {
    var a = [];
    if (S.publie) { a.push(['trophy', 'Quiz ' + S.theme_q, 'Du ' + fmtD(S.dDeb) + ' au ' + fmtD(S.dFin)]); }
    a.push(['wheel', 'Roue de printemps (exemple)', 'Du 01/04 au 30/04']);
    var h = '';
    for (var i = 0; i < a.length; i++) {
      h += '<div class="card anim"><div class="row"><span class="pic bleu">' + ic(a[i][0]) + '</span><span class="grow"><b>' + esc(a[i][1]) + '</b><br><span class="small">' + a[i][2] + '</span></span>' +
        '<span class="chip ok">En ligne</span></div><button class="btn sm sec anim-qr" data-go="p-qr">' + ic('qr') + 'Mon QR</button></div>';
    }
    return h;
  }
  def('p-dash', 'p', 'Tableau de bord', function () {
    var n = stepsDone();
    function st(i, t, go) {
      return '<button class="check-step" style="width:100%;background:none;border:0;border-top:1px solid var(--trait);text-align:left;cursor:pointer;min-height:52px" data-go="' + go + '">' +
        '<span class="dot' + (S.steps[i] ? ' done' : '') + '">' + (S.steps[i] ? ic('check', 's') : (i + 1)) + '</span><span class="grow" style="font-weight:700">' + t + '</span>' + ic('chev', 's') + '</button>';
    }
    return hd('Accueil', { noBack: true, k: S.etab.nom || 'Boutique Exemple' }) +
      '<div class="hero-pro"><div class="kick" style="color:#fff;opacity:.8">Bonjour ' + esc(S.pro.prenom) + '</div>' +
      '<h1>' + (S.publie ? 'Votre animation est en ligne.' : 'Prêt à faire jouer vos clients ?') + '</h1>' +
      '<button class="btn" style="background:#fff;color:#5B34C2" data-go="p-jeu">' + ic('plus') + (S.publie ? 'Créer une autre animation' : 'Créer ma première animation') + '</button></div>' +
      '<div class="card"><div class="row"><b class="grow">Pour démarrer</b><span class="chip violet">' + n + ' sur 3</span></div>' +
      '<div class="prog" style="margin:10px 0 4px"><i style="width:' + Math.round(n / 3 * 100) + '%"></i></div>' +
      st(0, 'Créer votre animation', 'p-jeu') + st(1, 'Afficher votre QR code', 'p-qr') + st(2, 'Rejoindre un super event', 'p-se-carte') + '</div>' +
      '<h2 class="h">Mes animations</h2>' + animCards() +
      tap('eye', 'bleu', 'Où mon commerce apparaît', 'Carte, page du jeu, billet gagnant', 'data-go="p-visible"') +
      tap('flag', 'orange', 'Participer à un super event', 'Festivals et événements près de chez vous', 'data-go="p-se-carte"');
  }, { tabs: 'pro' });

  function questionsBloc() {
    var h = '';
    if (S.gen === 'loading') { h = '<div class="card center"><p class="sub" style="margin:8px 0">L\'assistant prépare 3 questions…</p></div>'; }
    if (S.gen === 'done') {
      for (var i = 0; i < S.qs.length; i++) {
        var q = S.qs[i];
        h += '<div class="qitem' + (q.v ? ' ok' : '') + '"><b>' + (i + 1) + '. ' + esc(q.q) + '</b><div class="small">' + esc(q.r.join(' · ')) + '</div>' +
          '<div class="small" style="color:var(--ok);font-weight:700;margin-top:4px">Bonne réponse : ' + esc(q.r[q.ok]) + '</div>' +
          '<div class="acts"><button class="mini' + (q.v ? ' on' : '') + '" data-act="q-ok" data-v="' + i + '">' + ic('check', 's') + (q.v ? 'Gardée' : 'Garder') + '</button>' +
          '<button class="mini" data-act="q-regen" data-v="' + i + '">' + ic('refresh', 's') + 'Régénérer</button>' +
          '<button class="mini" data-sheet="q-edit" data-v="' + i + '">' + ic('edit', 's') + 'Modifier</button></div></div>';
      }
    }
    return '<div class="card"><div class="form-tag">Vos questions</div>' +
      '<label class="f"><span>Thème de votre quiz</span><input class="in" data-bind="theme_q" value="' + esc(S.theme_q) + '" placeholder="ex. sécurité routière"></label>' +
      btn(S.gen === 'done' ? 'Tout régénérer' : 'Générer 3 questions', 'data-act="gen"' + (S.gen === 'loading' ? ' disabled' : ''), 'line', 'spark') + h + '</div>';
  }
  def('p-jeu', 'p', '4. Jeu et questions', function () {
    var h = '';
    for (var i = 0; i < JEUX.length; i++) {
      var j = JEUX[i];
      h += '<div class="card tap' + (S.jeu === j.id ? ' sel' : '') + '" style="cursor:default"><button class="tap" style="border:0;background:none;padding:0;flex:1;min-width:0" data-act="jeu" data-v="' + j.id + '">' +
        '<span class="pic bleu">' + ic(j.ic) + '</span><span class="grow"><b>' + j.nom + '</b><span>' + j.d + '</span></span></button>' +
        '<button class="ib" data-sheet="apercu" data-v="' + j.id + '" aria-label="Aperçu ' + j.nom + '">' + ic('eye') + '</button></div>';
      if (S.jeu === 'quiz' && j.id === 'quiz') { h += questionsBloc(); }
    }
    return hd('Nouvelle animation', { k: 'Étape 4 sur 8', p: 50 }) + '<h1>Quel jeu ?</h1><p class="sub">Un clic suffit. L\'œil montre un aperçu.</p>' + h +
      foot(btn('Continuer', 'data-act="jeu-next"'));
  });
  function lotCard(l, i) {
    var gg = l.hist.length, rr = 0, hi = '';
    for (var k = 0; k < l.hist.length; k++) {
      var g = l.hist[k]; if (g.r) { rr++; }
      hi += '<li><span class="grow"><b>' + esc(g.n) + '</b><br><span class="small">Gagné le ' + g.g + (g.r ? ' · remis le ' + g.r : ' · pas encore remis') + '</span></span>' +
        (g.r ? '<span class="chip ok">Remis</span>' : '<span class="chip orange">À remettre</span>') + '</li>';
    }
    var pg = l.qte ? Math.round(gg / l.qte * 100) : 0, pr = l.qte ? Math.round(rr / l.qte * 100) : 0;
    return '<div class="card lotcard"><div class="lh">' + lotLogo(l) + '<span class="grow"><b style="font-size:16.5px">' + esc(l.titre) + '</b><br>' +
      '<span class="small">' + esc(l.cond) + '</span></span>' +
      '<button class="ib" data-sheet="lot-stock" data-v="' + i + '" aria-label="Actions de stock">' + ic('more') + '</button></div>' +
      '<div class="lb"><div class="jauge" aria-hidden="true"><i class="g" style="width:' + pg + '%"></i><i class="r" style="width:' + pr + '%"></i></div>' +
      '<b class="jauge-t">' + l.qte + ' à gagner · ' + gg + ' gagné' + (gg > 1 ? 's' : '') + ' · ' + rr + ' remis</b></div>' +
      '<div class="hist"><div class="form-tag">Gagnants</div>' + (hi ? '<ul class="list">' + hi + '</ul>' : '<p class="small" style="margin:6px 0 0">Pas encore de gagnant.</p>') + '</div></div>';
  }
  def('p-lots', 'p', '5. Lots', function () {
    var h = '';
    for (var i = 0; i < S.lots.length; i++) { h += lotCard(S.lots[i], i); }
    return hd('Nouvelle animation', { k: 'Étape 5 sur 8', p: 62 }) + '<h1>Vos lots</h1><p class="sub">Ce que vos clients peuvent gagner.</p>' + h +
      btn('Ajouter un lot', 'data-sheet="lot-add"', 'line', 'plus') + foot(btn('Continuer', 'data-go="p-formule"'));
  });
  def('p-formule', 'p', '6. Digital ou kit imprimé', function () {
    function f(id, t, ic1, items) {
      var l = ''; for (var i = 0; i < items.length; i++) { l += '<li>' + ic('check', 's') + items[i] + '</li>'; }
      return '<button class="card' + (S.formule === id ? ' sel' : '') + '" style="width:100%;text-align:left;cursor:pointer;display:block" data-act="formule" data-v="' + id + '">' +
        '<div class="row"><span class="pic">' + ic(ic1) + '</span><b class="grow" style="font-size:17px">' + t + '</b>' + (S.formule === id ? '<span class="chip violet">Choisi</span>' : '') + '</div>' +
        '<ul class="list" style="margin-top:8px">' + l + '</ul></button>';
    }
    return hd('Nouvelle animation', { k: 'Étape 6 sur 8', p: 75 }) + '<h1>Vos supports</h1>' +
      f('digital', '100 % digital', 'phone', ['Vous téléchargez et imprimez vos QR', 'Lien à partager sur vos réseaux', 'Suivi des scans et des gagnants']) +
      f('kit', 'Kit imprimé livré par Flowin Event', 'box', ['Tout le digital', 'Affiche et chevalet de comptoir avec votre QR', 'Livré dans votre commerce']) +
      foot(btn('Voir l\'aperçu', 'data-go="p-apercu"'));
  });
  def('p-apercu', 'p', '7. Aperçu et publication', function () {
    function r(t, v, go) { return '<li><span class="grow"><span class="small">' + t + '</span><br><b>' + esc(v) + '</b></span><button class="lnk" data-go="' + go + '">Modifier</button></li>'; }
    var nq = S.qs.length || 3, nom = S.etab.nom || 'Boutique Exemple';
    return hd('Aperçu', { k: 'Étape 7 sur 8', p: 87 }) + '<h1>Votre jeu, vu par vos clients</h1>' +
      '<div class="jeu"><div class="jhero"><div class="row">' + logoBoutique() + '<div><div class="kick">' + esc(jeuById(S.jeu).nom) + '</div><b style="font-size:18px">' + esc(nom) + '</b></div></div>' +
      '<p style="margin:12px 0 0;font-weight:700">Joue et gagne : ' + esc(S.lots[0] ? S.lots[0].titre : 'un lot') + '.</p></div></div>' +
      '<ul class="list card">' + r('Jeu', jeuById(S.jeu).nom + (S.jeu === 'quiz' ? ' · ' + nq + ' questions' : ''), 'p-jeu') + r('Lots', S.lots.length + ' lots', 'p-lots') +
      r('Supports', S.formule === 'kit' ? 'Kit imprimé livré par Flowin Event' : '100 % digital', 'p-formule') +
      '<li><span class="grow"><span class="small">Dates</span><br><b>Du ' + fmtD(S.dDeb) + ' au ' + fmtD(S.dFin) + '</b></span></li></ul>' +
      foot('<p class="small center" style="margin:0 0 2px">Le paiement arrive seulement maintenant, à la publication.</p>' + btn('Publier', 'data-sheet="payer"', '', 'send'));
  });
  def('p-qr', 'p', '8. Votre QR est prêt', function () {
    var h = '';
    for (var i = 0; i < S.sup.length; i++) {
      var u = S.sup[i];
      h += '<button class="qrs-row" data-sheet="qr-sup" data-v="' + i + '"><span class="pic">' + ic(u.ic) + '</span><span class="grow"><b>' + esc(u.n) + '</b><span>QR digital dédié</span></span>' +
        '<span class="qrs-n"><b>' + u.sc + '</b><span>scans</span></span>' + ic('chev', 's') + '</button>';
    }
    S.steps[1] = true;
    return hd('Mon QR', { k: jeuById(S.jeu).nom }) + '<div class="qrs">' +
      '<div class="kick">Étape 8 sur 8 · animation en ligne</div><h1>Votre QR est prêt</h1>' +
      '<div class="card qrs-print"><div class="qrs-art">' + qr('anim-print', 200) + '</div>' +
      '<div class="qrs-lab">' + ic('print', 's') + '<span><b>QR à imprimer</b> · vitrine et caisse</span></div>' +
      '<p class="small qrs-c">' + S.qrPrint + ' scans (exemple)</p></div>' +
      btn('Imprimer l\'affiche A4', 'data-act="qr-print"', '', 'print') +
      '<div class="qrs-sec">' +
      '<button class="btn sec" data-act="dl-png">' + ic('down') + 'Télécharger (PNG)</button>' +
      '<button class="btn sec" data-act="copier">' + ic('copy') + 'Copier le lien</button>' +
      '<button class="btn sec" data-act="qr-wa">' + ic('chat') + 'Partager sur WhatsApp</button></div>' +
      '<div class="card qrs-web"><div class="row">' + qr('anim-web', 84) + '<span class="grow"><b>QR digital à diffuser</b><br>' +
      '<span class="small">Réseaux, site, email. ' + S.qrWeb + ' scans (exemple).</span></span></div></div>' +
      '<h2 class="h">QR par support</h2><p class="small" style="margin:0 0 6px">Un QR par support : vous voyez d\'où viennent vos joueurs.</p>' +
      '<div class="card qrs-list">' + h + '</div>' +
      btn('Ajouter un support', 'data-sheet="qr-add"', 'sec', 'plus') +
      '<div class="center"><button class="lnk" data-go="p-dash">Aller au tableau de bord</button></div></div>';
  });

  /* ===== PRO : super event ===== */
  def('p-se-carte', 'p', 'Super event 1. Choisir l\'événement', function () {
    var p = '';
    for (var i = 0; i < EVENTS.length; i++) { var e = EVENTS[i]; p += pin(e.x, e.y, 'orange', 'data-act="se" data-v="' + e.id + '"', e.nom, S.se === e.id); }
    var l = '';
    for (var k = 0; k < EVENTS.length; k++) { var ev = EVENTS[k]; l += tap('flag', 'orange', ev.nom, ev.lieu + ' · ' + ev.per + ' · ' + ev.st + ' stations jeu', 'data-act="se" data-v="' + ev.id + '"'); }
    return hd('Flowin Super Event', { k: 'Étape 1 sur 3', p: 33 }) + '<h1>Quel événement ?</h1><p class="sub">Un événement. Tous ses partenaires. Un seul jeu.</p>' +
      '<div class="map">' + mapBg() + p + '</div>' +
      '<div class="legend"><span><i style="background:var(--orange-v)"></i>Super event</span></div>' + l +
      '<button class="btn line" data-go="p-se-demande">' + ic('plus') + 'Demander la création d\'un super event</button>';
  });
  def('p-se-formule', 'p', 'Super event 2. Formule partenaire', function () {
    var h = '', e = seById(S.se || 'fe');
    for (var i = 0; i < FORMULES_SE.length; i++) {
      var f = FORMULES_SE[i], l = '';
      for (var k = 0; k < f.inc.length; k++) { l += '<li>' + ic('check', 's') + esc(f.inc[k]) + '</li>'; }
      h += '<button class="card' + (S.seF === f.id ? ' sel' : '') + '" style="width:100%;text-align:left;cursor:pointer;display:block" data-act="seF" data-v="' + f.id + '">' +
        '<div class="row"><span class="pic orange">' + ic(f.ic) + '</span><b class="grow" style="font-size:16.5px">' + f.nom + '</b></div>' +
        '<p class="prix">' + f.px + '</p><p class="small" style="margin:0 0 4px">' + f.d + '</p><ul class="list">' + l + '</ul></button>';
    }
    return hd(e.nom, { k: 'Étape 2 sur 3', p: 66 }) + '<h1>Votre formule partenaire</h1>' +
      '<p class="small" style="margin:0">' + e.lieu + ' · ' + e.per + '. Votre commerce devient une station jeu.</p>' + h +
      '<p class="small center">' + PRIX_SE_NOTE + '</p>' +
      foot(btn('Voir le récapitulatif', 'data-go="p-se-recap"' + (S.seF ? '' : ' disabled'), 'orange'));
  });
  def('p-se-recap', 'p', 'Super event 3. Récapitulatif', function () {
    var e = seById(S.se || 'fe'), f = fById(S.seF || 'pdp');
    return hd('Récapitulatif', { k: 'Étape 3 sur 3', p: 100 }) + '<h1>Votre demande</h1><ul class="list card">' +
      '<li><span class="grow"><span class="small">Événement</span><br><b>' + e.nom + '</b></span></li>' +
      '<li><span class="grow"><span class="small">Formule</span><br><b>' + f.nom + '</b></span><button class="lnk" data-back>Modifier</button></li>' +
      '<li><span class="grow"><span class="small">Commerce</span><br><b>' + esc(S.etab.nom || 'Boutique Exemple') + '</b></span></li>' +
      '<li><span class="grow"><span class="small">Prix proposé</span><br><b>' + f.px + '</b></span></li></ul>' +
      '<p class="small">' + PRIX_SE_NOTE + ' L\'organisateur confirme le prix avec vous.</p>' +
      foot(btn('Je rejoins ' + e.nom, 'data-act="se-send"', 'orange', 'send'));
  });
  def('p-se-envoye', 'p', 'Super event : demande envoyée', function () {
    function st(n, t) { return '<div class="check-step"><span class="dot">' + n + '</span><span>' + t + '</span></div>'; }
    return hd('Demande envoyée', { noBack: true }) + '<div class="big-ok">' + ic('send') + '</div><h1 class="center">Demande envoyée</h1>' +
      '<div class="card"><b>Et après ?</b>' + st(1, 'L\'organisateur valide sous 24 à 48 h.') + st(2, 'Vous recevez un email de confirmation.') +
      st(3, 'Votre station jeu apparaît sur la carte de l\'événement.') + st(4, 'Vous recevez le QR de votre station jeu.') + '</div>' +
      foot(btn('Suivre mes festivals', 'data-go="p-festivals"') + btn('Retour au tableau de bord', 'data-go="p-dash"', 'line'));
  });
  def('p-se-demande', 'p', 'Super event : demander une création', function () {
    return hd('Nouveau super event', { k: 'Demande à Flowin Event' }) + '<h1>Une idée d\'événement ?</h1><p class="sub">Flowin Event vous rappelle pour en parler.</p>' +
      field('Nom de l\'événement', 'x1', '', 'text', 'ex. Fête du quartier') + field('Ville', 'x2', '', 'text', 'ex. Ville Exemple') +
      field('Période', 'x3', '', 'text', 'ex. printemps') +
      '<label class="f"><span>Message</span><textarea class="in" placeholder="Quelques mots sur votre projet"></textarea></label>' +
      foot(btn('Envoyer à Flowin Event', 'data-act="se-dem"', 'orange', 'send'));
  });
  def('p-se-demande-ok', 'p', 'Super event : demande reçue', function () {
    return hd('Merci', { noBack: true }) + '<div class="big-ok">' + ic('check') + '</div><h1 class="center">Demande reçue</h1>' +
      '<p class="sub center">L\'équipe Flowin Event vous recontacte pour construire l\'événement avec vous.</p>' + foot(btn('Retour au tableau de bord', 'data-go="p-dash"'));
  });

  /* ===== PRO : visibilité ===== */
  def('p-visible', 'p', 'Où mon commerce apparaît', function () {
    var t = S.visTab, body = '';
    function sg(id, l) { return '<button class="' + (t === id ? 'on' : '') + '" data-act="vis" data-v="' + id + '">' + l + '</button>'; }
    if (t === 'festival') {
      body = '<div class="map">' + mapBg() + pin(30, 40, 'orange', 'data-sheet="station"', 'Station') + pin(55, 30, 'orange', 'data-sheet="station"', 'Station') +
        pin(48, 62, 'violet', 'data-sheet="station"', 'Votre station jeu', true) + pin(72, 55, 'orange', 'data-sheet="station"', 'Station') + '</div>' +
        '<div class="legend"><span><i style="background:var(--violet)"></i>Votre station jeu</span><span><i style="background:var(--orange-v)"></i>Autres stations jeu</span></div>' +
        '<p class="small">Carte du Festival Exemple vue par les joueurs.</p>';
    } else if (t === 'ville') {
      body = '<div class="map">' + mapBg() + pin(40, 45, 'bleu', 'data-sheet="station"', 'Votre jeu en boutique', true) + pin(66, 34, 'bleu', 'data-demo="Autre commerce de la ville."', 'Jeu en boutique') +
        pin(25, 72, 'orange', 'data-demo="Fiche du festival."', 'Festival') + pin(78, 70, 'orange', 'data-demo="Fiche du festival."', 'Festival') + '</div>' +
        '<div class="legend"><span><i style="background:var(--bleu)"></i>Jeu en boutique</span><span><i style="background:var(--orange-v)"></i>Festivals</span></div>';
    } else if (t === 'jeu') {
      body = '<div class="jeu"><div class="jhero"><div class="row">' + logoBoutique() + '<div><div class="kick">Quiz + bonus</div><b style="font-size:18px">' + esc(S.etab.nom || 'Boutique Exemple') + '</b></div></div>' +
        '<p style="margin:12px 0 0;font-weight:700">Réponds aux questions et gagne un lot.</p></div></div><p class="small">La page du jeu telle que vos clients la voient.</p>';
    } else {
      body = billet(S.lots[0], 'Joueur A.');
    }
    return hd('Où j\'apparais', { k: 'Visibilité' }) + '<div class="seg" role="tablist">' + sg('festival', 'Festival') + sg('ville', 'Ville') + sg('jeu', 'Jeu') + sg('billet', 'Billet') + '</div>' + body;
  });
  function billet(l, nom) {
    return '<div class="billet"><div class="top">' + lotLogo(l, 's') + '<div><div class="kick" style="color:#fff;opacity:.85;margin:0">Billet gagnant</div><b style="font-size:17px">' + esc(l.titre) + '</b></div></div>' +
      '<div style="padding:16px" class="center">' + qr('billet-' + nom, 170) + '<p style="font-weight:800;margin:10px 0 2px">' + esc(nom) + '</p>' +
      '<p class="small" style="margin:0">Le commerçant scanne ce QR pour te remettre ton lot.</p></div><div class="cut"></div>' +
      '<div style="padding:12px 16px" class="small">Conditions : ' + esc(l.cond) + '</div></div>';
  }

  def('p-animations', 'p', 'Mes animations', function () {
    return hd('Mes animations', { noBack: true }) +
      animCards() +
      btn('Créer une animation', 'data-go="p-jeu"', '', 'plus');
  }, { tabs: 'pro' });
  def('p-festivals', 'p', 'Mes festivals', function () {
    return hd('Mes festivals', { noBack: true }) +
      (S.seEnvoye ? tap('flag', 'orange', seById(S.se || 'fe').nom, fById(S.seF || 'pdp').nom, 'data-go="p-se-envoye"', '<span class="chip orange">En attente</span>') : '') +
      tap('flag', 'orange', 'Marché de Noël Exemple', 'Sponsor digital', 'data-go="p-visible"', '<span class="chip ok">Validée</span>') +
      btn('Participer à un super event', 'data-go="p-se-carte"', 'orange', 'plus');
  }, { tabs: 'pro' });
  def('p-gagnants', 'p', 'Gagnants', function () {
    var a = S.gTab === 'a', h = '', n = 0;
    for (var i = 0; i < S.gagnants.length; i++) {
      var g = S.gagnants[i];
      if (a === !g.r) {
        n++;
        h += '<div class="card"><div class="row"><span class="grow"><b>' + g.n + '</b><br><span class="small">' + g.lot + ' · gagné le ' + g.g + (g.r ? ' · remis le ' + g.r : '') + '</span></span>' +
          (a ? '<button class="mini" data-act="remis" data-v="' + i + '">' + ic('check', 's') + 'Remis</button>' : '<span class="chip ok">Remis</span>') + '</div></div>';
      }
    }
    if (!n) { h = '<p class="sub center">Rien ici pour l\'instant.</p>'; }
    return hd('Gagnants', { noBack: true }) + '<div class="seg"><button class="' + (a ? 'on' : '') + '" data-act="gtab" data-v="a">À remettre</button><button class="' + (a ? '' : 'on') + '" data-act="gtab" data-v="r">Remis</button></div>' + h +
      (a && n ? btn('Envoyer un rappel groupé', 'data-demo="Un rappel serait envoyé aux ' + n + ' gagnants."', 'line', 'bell') : '') +
      btn('Scanner un billet', 'data-demo="La caméra s\'ouvrirait pour scanner le billet du gagnant."', '', 'qr');
  }, { tabs: 'pro' });
  def('p-profil', 'p', 'Profil et factures', function () {
    return hd('Profil', { noBack: true }) +
      '<div class="card"><div class="row">' + logoBoutique() + '<div class="grow"><b>' + esc(S.etab.nom || 'Boutique Exemple') + '</b><br><span class="small">' + esc(S.etab.adr || '[adresse à compléter]') + '</span></div></div></div>' +
      tap('store', '', 'Mon établissement', 'Nom, adresse, logo, horaires', 'data-sheet="etab"') +
      tap('file', '', 'Mes factures', 'Télécharger en PDF', 'data-sheet="factures"') +
      tap(isDark() ? 'sun' : 'moon', '', 'Thème ' + (isDark() ? 'clair' : 'sombre'), 'Changer l\'apparence', 'data-act="theme"') +
      tap('refresh', '', 'Recommencer la visite', 'Remet la démo à zéro', 'data-act="reset"');
  }, { tabs: 'pro' });

  /* ===== ORGANISATEUR ===== */
  def('o-accueil', 'o', 'Promesse organisateur', function () {
    return hd('Organisateur', { k: 'Flowin Super Event' }) +
      '<div class="preview" style="background:linear-gradient(135deg,#C2410C,#FF8A14)"><img src="../flowin-super-event-logo.svg" alt="Flowin Super Event" width="220" style="max-width:100%;display:block;margin:4px 0 10px" onerror="this.style.display=\'none\'">' +
      '<h1 style="color:#fff">Un événement. Tous ses partenaires. Un seul jeu.</h1><p style="margin:0;font-weight:700">Vos partenaires diffusent votre événement, en boutique et en ligne.</p></div>' +
      '<p class="small" style="margin:0 0 4px">Pour une mairie, un comité des fêtes ou une association de commerçants.</p>' +
      '<div class="card"><div class="form-tag">Ce que nous mesurons pour vous</div><ul class="list" style="margin-top:6px">' +
      '<li><span class="pic orange">' + ic('map') + '</span>Où les gens ont joué, station par station</li>' +
      '<li><span class="pic orange">' + ic('users') + '</span>Combien ont joué, jour par jour</li>' +
      '<li><span class="pic orange">' + ic('mail') + '</span>Les contacts recueillis, avec leur accord</li></ul></div>' +
      '<div class="card chiffre"><b>56 %</b><span>des participants souhaitent garder le contact</span></div>' +
      '<p class="small center">Tarif : sur étude, selon votre événement.</p>' +
      foot(btn('Prendre rendez-vous', 'data-sheet="rdv"', 'orange', 'cal') + '<div class="center"><button class="lnk" data-go="o-tableau">Voir un super event en cours</button></div>');
  });
  def('o-infos', 'o', 'Super event : nom et dates', function () {
    return hd('Nouveau super event', { k: 'Étape 1 sur 4', p: 25 }) + '<h1>Votre événement</h1><p class="sub">Construit avec vous après le rendez-vous.</p>' +
      field('Nom', 'org.nom', S.org.nom) + field('Début', 'org.deb', S.org.deb, 'date') + field('Fin', 'org.fin', S.org.fin, 'date') +
      foot(btn('Continuer', 'data-go="o-lieu"', 'orange'));
  });
  def('o-lieu', 'o', 'Super event : lieu sur la carte', function () {
    return hd('Nouveau super event', { k: 'Étape 2 sur 4', p: 50 }) + '<h1>Où ?</h1><p class="sub">Touchez la carte pour placer le cœur du festival.</p>' +
      '<div class="map" data-act="placer" style="cursor:crosshair">' + mapBg() + pin(S.org.px, S.org.py, 'orange', 'tabindex="-1"', 'Lieu', true) + '</div>' +
      field('Adresse', 'x4', 'Ville Exemple', 'text') + foot(btn('Continuer', 'data-go="o-jeu"', 'orange'));
  });
  def('o-jeu', 'o', 'Super event : jeu commun', function () {
    var h = '';
    for (var i = 0; i < JEUX.length; i++) {
      var j = JEUX[i];
      h += tap(j.ic, 'orange', j.nom, j.d, 'data-act="ojeu" data-v="' + j.id + '"', S.org.jeu === j.id ? '<span class="chip orange">Choisi</span>' : '');
    }
    return hd('Nouveau super event', { k: 'Étape 3 sur 4', p: 75 }) + '<h1>Le jeu commun</h1><p class="sub">Le même jeu dans toutes les stations.</p>' + h + foot(btn('Continuer', 'data-go="o-formules"', 'orange'));
  });
  def('o-formules', 'o', 'Super event : formules proposées', function () {
    var h = '';
    for (var i = 0; i < FORMULES_SE.length; i++) {
      var f = FORMULES_SE[i], on = S.org.f[f.id];
      h += '<label class="card check" style="display:flex"><input type="checkbox" data-act="of" data-v="' + f.id + '"' + (on ? ' checked' : '') + '><span><b>' + f.nom + '</b><br><span class="small">' + f.d + '</span><br><span class="small">' + f.px + ' · ' + PRIX_SE_NOTE.toLowerCase() + '</span></span></label>';
    }
    return hd('Nouveau super event', { k: 'Étape 4 sur 4', p: 100 }) + '<h1>Formules pour vos partenaires</h1>' + h + foot(btn('Publier et inviter les commerces', 'data-go="o-invite"', 'orange', 'send'));
  });
  def('o-invite', 'o', 'Invitation des commerces', function () {
    return hd('Inviter les commerces', { k: S.org.nom }) + '<div class="card center">' + qr('invite-' + S.org.nom, 170) +
      '<p class="small" style="margin:10px 0 0;word-break:break-all">flowin-events.vercel.app/rejoindre?se=demo</p></div>' +
      '<div class="opts two"><button class="opt" data-act="copier">' + ic('copy') + 'Copier le lien</button>' +
      '<button class="opt" data-demo="WhatsApp s\'ouvrirait avec l\'invitation.">' + ic('chat') + 'WhatsApp</button>' +
      '<button class="opt" data-demo="Un email d\'invitation serait préparé.">' + ic('mail') + 'Email</button>' +
      '<button class="opt" data-act="dl-png">' + ic('down') + 'QR (PNG)</button></div>' +
      foot(btn('Voir les demandes', 'data-go="o-demandes"', 'orange'));
  });
  def('o-tableau', 'o', 'Tableau de bord organisateur', function () {
    var att = 0, ok = 0;
    for (var i = 0; i < S.demandes.length; i++) { if (S.demandes[i].s === 'att') { att++; } if (S.demandes[i].s === 'ok') { ok++; } }
    var ou = [['Librairie Exemple', 212], ['Place centrale (exemple)', 168], ['Café Exemple', 94]], l = '';
    for (var k = 0; k < ou.length; k++) { l += '<li><span class="pic orange">' + ic('map') + '</span><span class="grow">' + ou[k][0] + '</span><b>' + ou[k][1] + '</b></li>'; }
    return hd(S.org.nom, { noBack: true, k: 'Flowin Super Event' }) +
      '<div class="kpis"><div class="kpi"><b>474</b><span>joueurs</span></div><div class="kpi"><b>265</b><span>contacts</span></div><div class="kpi"><b>' + ok + '</b><span>stations jeu</span></div></div>' +
      '<div class="card"><div class="form-tag">Où les gens ont joué (exemple)</div><ul class="list" style="margin-top:4px">' + l + '</ul></div>' +
      tap('inbox', 'orange', 'Demandes des partenaires', att + ' en attente', 'data-go="o-demandes"') +
      tap('map', 'orange', 'Carte des stations jeu', ok + ' stations jeu', 'data-go="o-carte"') +
      tap('qr', 'orange', 'Lien et QR d\'invitation', 'À envoyer à vos partenaires', 'data-go="o-invite"');
  }, { tabs: 'org' });
  def('o-demandes', 'o', 'Demandes à valider', function () {
    var h = '';
    for (var i = 0; i < S.demandes.length; i++) {
      var d = S.demandes[i];
      h += '<div class="card"><div class="row">' + logoBoutique('s') + '<span class="grow"><b>' + d.n + '</b><br><span class="small">' + d.f + '</span></span></div>' +
        (d.s === 'att' ? '<div class="row" style="margin-top:10px"><button class="btn sm line" data-act="dem" data-v="' + i + '" data-s="ko">Refuser</button><button class="btn sm orange" data-act="dem" data-v="' + i + '" data-s="ok">Accepter</button></div>'
          : '<div style="margin-top:8px"><span class="chip ' + (d.s === 'ok' ? 'ok' : 'ko') + '">' + (d.s === 'ok' ? 'Acceptée' : 'Refusée') + '</span></div>') + '</div>';
    }
    return hd('Demandes', { noBack: true, k: S.org.nom }) + h;
  }, { tabs: 'org' });
  def('o-carte', 'o', 'Carte des stations', function () {
    var p = '', xs = [[30, 35], [60, 28], [45, 60], [75, 62], [20, 70]], n = 0;
    for (var i = 0; i < S.demandes.length; i++) {
      if (S.demandes[i].s === 'ok') { p += pin(xs[n][0], xs[n][1], 'orange', 'data-demo="Station : ' + S.demandes[i].n + '"', S.demandes[i].n); n++; }
    }
    return hd('Stations', { noBack: true, k: S.org.nom }) + '<div class="map">' + mapBg() + p + '</div>' +
      '<div class="legend"><span><i style="background:var(--orange-v)"></i>Station validée (' + n + ')</span></div>' +
      '<p class="small">Acceptez des demandes pour voir de nouvelles stations apparaître.</p>';
  }, { tabs: 'org' });

  /* ===== JOUEUR : Quiz + bonus de l'Auto-École de l'ARA ===== */
  def('j-accueil', 'j', 'Accueil du jeu', function () {
    return '<div class="jeu" style="display:contents">' + hd('Quiz + bonus', { k: 'Auto-École de l\'ARA' }) +
      '<div class="jhero"><div class="row">' + logoAra() + '<div><div class="kick">Quiz + bonus</div><b style="font-size:19px">Auto-École de l\'ARA</b></div></div>' +
      '<h1 style="color:#fff;margin-top:14px">Teste ton code, gagne ta leçon.</h1><p style="margin:0;font-weight:600">' + QUIZ.length + ' questions, puis ' + BONUS.length + ' petites questions bonus.</p></div>' +
      '<div class="card"><div class="form-tag">À gagner</div><div class="row" style="margin-top:8px"><span class="pic bleu">' + ic('gift') + '</span><b class="grow" style="font-size:17px">1 heure de conduite offerte</b></div>' +
      '<p class="small" style="margin:8px 0 0">Valable 3 mois, sur rendez-vous.</p></div>' +
      foot(btn('Je joue', 'data-act="j-start"', 'bleu', 'play')) + '</div>';
  });
  def('j-quiz', 'j', 'Quiz (8 questions)', function () {
    var q = QUIZ[S.qi], h = '';
    for (var i = 0; i < q.r.length; i++) {
      var c = '';
      if (S.rep !== null) { if (i === q.ok) { c = ' good'; } else if (i === S.rep) { c = ' bad'; } }
      h += '<button class="opt' + c + '" data-act="j-rep" data-v="' + i + '"' + (S.rep !== null ? ' aria-disabled="true"' : '') + '><span class="pastille">' + 'ABC'.charAt(i) + '</span>' + esc(q.r[i]) + '</button>';
    }
    var exp = S.rep !== null ? '<div class="explain ' + (S.rep === q.ok ? 'ok' : 'ko') + '"><b>' + (S.rep === q.ok ? 'Bonne réponse.' : 'Pas tout à fait.') + '</b> ' + q.e + '</div>' : '';
    return '<div class="jeu" style="display:contents">' + hd('Question ' + (S.qi + 1) + ' sur ' + QUIZ.length, { k: 'Quiz', p: Math.round((S.qi + (S.rep !== null ? 1 : 0)) / QUIZ.length * 100) }) +
      '<h1 style="font-size:23px">' + esc(q.q) + '</h1><div class="opts">' + h + '</div>' + exp +
      (S.rep !== null ? foot(btn(S.qi < QUIZ.length - 1 ? 'Question suivante' : 'Passer aux questions bonus', 'data-act="j-next"', 'bleu')) : '') + '</div>';
  });
  def('j-bonus', 'j', 'Questions bonus (sondage)', function () {
    var b = BONUS[S.bi], h = '', cur = S.bonusRep[S.bi];
    for (var i = 0; i < b.r.length; i++) { h += '<button class="opt' + (cur === i ? ' on' : '') + '" data-act="j-bonus" data-v="' + i + '">' + esc(b.r[i]) + '</button>'; }
    return '<div class="jeu" style="display:contents">' + hd('Bonus ' + (S.bi + 1) + ' sur ' + BONUS.length, { k: 'Pas de mauvaise réponse', p: Math.round(S.bi / BONUS.length * 100) }) +
      '<h1 style="font-size:23px">' + esc(b.q) + '</h1><div class="opts">' + h + '</div>' +
      '<p class="small">Tes réponses aident l\'auto-école à mieux te connaître.</p>' +
      foot('<div class="center"><button class="lnk" data-act="j-bskip">Passer cette question</button></div>') + '</div>';
  });
  def('j-inscr', 'j', 'Inscription du joueur', function () {
    var g = S.j.genre;
    return '<div class="jeu" style="display:contents">' + hd('Dernière étape', { k: 'Pour recevoir ton lot' }) + '<h1>Qui es-tu ?</h1>' +
      field('Prénom', 'j.prenom', S.j.prenom, 'text', 'Ton prénom') + field('Email', 'j.email', S.j.email, 'email', 'toi@exemple.fr') +
      '<div class="f"><span class="form-tag" style="display:block;margin:10px 0 6px">Genre (facultatif)</span><div class="opts two">' +
      '<button class="opt' + (g === 'H' ? ' on' : '') + '" data-act="j-genre" data-v="H">Homme</button><button class="opt' + (g === 'F' ? ' on' : '') + '" data-act="j-genre" data-v="F">Femme</button></div></div>' +
      field('Code postal', 'j.cp', S.j.cp, 'text', '5 chiffres') +
      '<label class="check"><input type="checkbox" data-act="j-ok"' + (S.j.ok ? ' checked' : '') + '><span>J\'accepte que l\'Auto-École de l\'ARA et Flowin utilisent mes coordonnées pour le jeu et pour me recontacter. Je peux me désinscrire à tout moment.</span></label>' +
      foot(btn('Voir mon résultat', 'data-go="j-resultat"' + (S.j.ok ? '' : ' disabled'), 'bleu')) + '</div>';
  });
  def('j-resultat', 'j', 'Résultat', function () {
    return '<div class="jeu" style="display:contents">' + hd('Résultat', {}) + '<div class="big-ok" style="background:var(--bleu-c);color:var(--bleu)">' + ic('trophy') + '</div>' +
      '<h1 class="center">Bravo ' + esc(S.j.prenom || 'à toi') + ' !</h1><p class="sub center">Tu as ' + S.score + ' bonnes réponses sur ' + QUIZ.length + '.</p>' +
      '<div class="card center"><div class="form-tag">Tu gagnes</div><b style="font-size:19px;display:block;margin-top:6px">1 heure de conduite offerte</b></div>' +
      foot(btn('Voir mon billet gagnant', 'data-go="j-billet"', 'bleu', 'ticket')) + '</div>';
  });
  def('j-billet', 'j', 'Billet gagnant', function () {
    return '<div class="jeu" style="display:contents">' + hd('Ton billet', {}) + billet(S.lots[0], S.j.prenom || 'Joueur') +
      '<p class="small center">Montre ce billet à l\'Auto-École de l\'ARA.</p>' +
      foot(btn('Rejouer la démo', 'data-act="j-start"', 'line', 'refresh') + btn('Retour à l\'accueil', 'data-act="home"', 'line', 'home')) + '</div>';
  });

  /* ---------- Volets ---------- */
  var SHEETS = {
    apercu: function (v) {
      var j = jeuById(v);
      return { t: 'Aperçu : ' + j.nom, h: '<div class="preview" style="background:' + j.col + '"><div class="row"><span class="pic" style="background:rgba(255,255,255,.2);color:#fff">' + ic(j.ic) + '</span>' +
        '<b style="font-size:18px">' + j.nom + '</b></div><p style="margin:10px 0 0">' + j.d + '</p></div>' +
        (v === 'quiz' ? '<p class="small">Exemple réel : le Quiz + bonus de l\'Auto-École de l\'ARA.</p>' + btn('Essayer comme un joueur', 'data-act="j-start"', 'bleu', 'play') : '') +
        btn('Choisir ce jeu', 'data-act="jeu-close" data-v="' + v + '"') };
    },
    'q-edit': function (v) {
      var q = S.qs[+v];
      var h = '<label class="f"><span>Question</span><textarea class="in" id="qe-q">' + esc(q.q) + '</textarea></label>';
      for (var i = 0; i < q.r.length; i++) { h += '<label class="f"><span>Réponse ' + 'ABC'.charAt(i) + (i === q.ok ? ' (bonne réponse)' : '') + '</span><input class="in" id="qe-r' + i + '" value="' + esc(q.r[i]) + '"></label>'; }
      return { t: 'Modifier la question', h: h + btn('Enregistrer', 'data-act="q-save" data-v="' + v + '"') };
    },
    'lot-add': function () {
      return { t: 'Nouveau lot', h: '<label class="f"><span>Titre du lot</span><input class="in" id="la-t" placeholder="ex. Un café offert"></label>' +
        '<label class="f"><span>Conditions d\'utilisation</span><input class="in" id="la-c" placeholder="ex. Valable 1 mois"></label>' +
        '<label class="f"><span>Quantité à distribuer</span><input class="in" id="la-q" type="number" min="1" value="10"></label>' +
        '<div class="form-tag" style="margin:10px 0 6px">Mode</div><div class="opts two"><label class="opt"><input type="radio" name="la-m" value="instant" checked> Tout de suite</label><label class="opt"><input type="radio" name="la-m" value="tirage"> Tirage au sort</label></div>' +
        '<p class="small">Le logo de votre commerce est ajouté automatiquement.</p>' + btn('Ajouter ce lot', 'data-act="lot-save"') };
    },
    'qr-sup': function (v) {
      var u = S.sup[+v] || S.sup[0];
      var slug = u.n.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return { t: 'QR ' + u.n, h: '<div class="center">' + qr('sup-' + slug, 180) + '<p class="small" style="word-break:break-all">flowin-events.vercel.app/jouer?ev=demo&amp;src=' + esc(slug) + '</p>' +
        '<p class="small"><b>' + u.sc + ' scans</b> depuis ce support</p></div>' +
        btn('Télécharger (PNG)', 'data-act="dl-png"', '', 'down') + btn('Copier le lien', 'data-act="copier"', 'sec', 'copy') };
    },
    'qr-add': function () {
      var sug = ['Flyer', 'Google', 'Newsletter', 'LinkedIn', 'SMS'], h = '';
      for (var i = 0; i < sug.length; i++) { h += '<button class="mini" data-act="qr-sug" data-v="' + sug[i] + '">' + sug[i] + '</button>'; }
      return { t: 'Ajouter un support', h: '<p class="sub">Un nouveau QR digital, avec son propre compteur de scans.</p>' +
        '<label class="f"><span>Nom du support</span><input class="in" id="qa-n" placeholder="ex. Flyer du marché"></label>' +
        '<div class="row wrap" style="gap:6px">' + h + '</div>' + btn('Créer ce QR', 'data-act="qr-add"', '', 'plus') };
    },
    'lot-stock': function (v) {
      var l = S.lots[+v] || S.lots[0];
      return { t: 'Stock : ' + l.titre, h: '<p class="sub">' + l.qte + ' à gagner au total.</p>' +
        btn('Réapprovisionner', 'data-act="stock" data-v="' + v + '" data-s="1"', 'line', 'plus') +
        btn('Retirer (perte ou casse)', 'data-act="stock" data-v="' + v + '" data-s="-1"', 'line', 'x') };
    },
    payer: function () {
      var m = S.paie === 'mois';
      return { t: 'Publier votre animation', h: '<p class="sub">Votre jeu est prêt. Choisissez votre abonnement Flowin Animation.</p>' +
        '<div class="opts">' +
        '<button class="opt' + (m ? ' on' : '') + '" data-act="paie" data-v="mois">' + ic('cal') + '<span class="grow">Au mois</span><b>110 € HT / mois</b></button>' +
        '<button class="opt' + (m ? '' : ' on') + '" data-act="paie" data-v="an">' + ic('star') + '<span class="grow">À l\'année</span><b>990 € HT / an</b></button></div>' +
        (S.formule === 'kit' ? '<p class="small">Kit imprimé : prix communiqué avec votre commande [prix du kit à compléter].</p>' : '') +
        '<p class="small">Démo : aucun paiement réel.</p>' + btn('Payer et publier', 'data-act="publier"', '', 'lock') };
    },
    rdv: function () {
      return { t: 'Prendre rendez-vous', h: '<p class="sub">Parlons de votre événement. Choisissez comment nous joindre.</p>' +
        btn('Par WhatsApp', 'data-demo="WhatsApp s\'ouvrirait vers [numéro WhatsApp à compléter]."', 'orange', 'chat') +
        btn('Par email', 'data-demo="Un email s\'ouvrirait vers [adresse email à compléter]."', 'line', 'mail') };
    },
    station: function () {
      return { t: 'Votre station jeu', h: '<div class="row">' + logoBoutique() + '<div><b>' + esc(S.etab.nom || 'Boutique Exemple') + '</b><br><span class="small">Station jeu</span></div></div>' +
        '<p class="sub">Les joueurs viennent scanner votre QR de station et découvrent votre commerce.</p>' + btn('Fermer', 'data-close', 'line') };
    },
    etab: function () {
      return { t: 'Mon établissement', h: '<label class="f"><span>Nom</span><input class="in" value="' + esc(S.etab.nom || 'Boutique Exemple') + '"></label>' +
        '<label class="f"><span>Adresse</span><input class="in" value="' + esc(S.etab.adr || '') + '" placeholder="[adresse à compléter]"></label>' +
        btn('Changer le logo', 'data-demo="Le choix d\'image s\'ouvrirait."', 'line', 'edit') + btn('Enregistrer', 'data-act="close-ok"') };
    },
    factures: function () {
      return { t: 'Mes factures', h: '<p class="sub">Vos factures apparaissent ici après chaque commande.</p>' +
        '<ul class="list"><li>' + ic('file') + '<span class="grow">Facture d\'exemple<br><span class="small">Montant : sur devis</span></span><button class="mini" data-demo="Le PDF serait téléchargé.">' + ic('down', 's') + 'PDF</button></li></ul>' };
    }
  };

  /* ---------- Moteur ---------- */
  var app = document.getElementById('app'), tabsEl = document.getElementById('tabs');
  var sheetEl = document.getElementById('sheet'), sheetBd = document.getElementById('sheet-bd'), sheetT = document.getElementById('sheet-t');
  var toastEl = document.getElementById('toast'), toastTimer = null, lastFocus = null;
  var cur = 'accueil', hist = [];
  var TABS = {
    pro: [['p-dash', 'Accueil', 'home'], ['p-animations', 'Animations', 'grid'], ['p-festivals', 'Festivals', 'flag'], ['p-gagnants', 'Gagnants', 'trophy'], ['p-profil', 'Profil', 'user']],
    org: [['o-tableau', 'Accueil', 'home'], ['o-demandes', 'Demandes', 'inbox'], ['o-carte', 'Stations', 'map']]
  };

  function render(id, anim, keepScroll) {
    var sc = SCREENS[id]; if (!sc) { return; }
    var old = app.querySelector('.scr'), top = keepScroll && old ? old.scrollTop : 0;
    cur = id;
    app.innerHTML = '<div class="scr' + (anim ? ' ' + anim : '') + '" data-id="' + id + '">' + sc.r() + '</div>';
    var nw = app.querySelector('.scr'); nw.scrollTop = top;
    if (sc.tabs) {
      var t = TABS[sc.tabs], h = '';
      for (var i = 0; i < t.length; i++) { h += '<button class="' + (t[i][0] === id ? 'on' : '') + '" data-tab="' + t[i][0] + '"' + (t[i][0] === id ? ' aria-current="page"' : '') + '>' + ic(t[i][2]) + t[i][1] + '</button>'; }
      tabsEl.innerHTML = h; tabsEl.hidden = false; app.className = 'app tabbed';
    } else { tabsEl.hidden = true; app.className = 'app'; }
    sideMark();
    if (!keepScroll) { var h1 = nw.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); } }
  }
  function go(id) { if (id === cur) { return; } hist.push(cur); if (hist.length > 60) { hist.shift(); } render(id, 'in'); }
  function back() { var p = hist.pop(); render(p || 'accueil', 'in-back'); }
  function refresh() { render(cur, null, true); }
  function toast(t) {
    toastEl.textContent = t; toastEl.hidden = false;
    if (toastTimer) { clearTimeout(toastTimer); }
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }
  function openSheet(name, v) {
    var s = SHEETS[name](v); lastFocus = document.activeElement;
    sheetT.textContent = s.t; sheetBd.innerHTML = s.h; sheetEl.hidden = false;
    var f = sheetEl.querySelector('.sheet-hd .ib'); if (f) { f.focus(); }
  }
  function closeSheet() { if (sheetEl.hidden) { return; } sheetEl.hidden = true; sheetBd.innerHTML = ''; if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) { } } }

  function setPath(path, val) { var p = path.split('.'), o = S; for (var i = 0; i < p.length - 1; i++) { o = o[p[i]]; } o[p[p.length - 1]] = val; }

  function pickQuestions(n) {
    var out = [];
    for (var i = 0; i < n; i++) { out.push(nextQ()); }
    return out;
  }
  function nextQ() {
    var b = BANQUE[S.qNext % BANQUE.length]; S.qNext++;
    return { q: b.q, r: b.r.slice(0), ok: b.ok, v: false };
  }

  var ACT = {
    theme: function () { S.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('fl-visite-theme', S.theme); } catch (e) { } applyTheme(); refresh(); },
    home: function () { hist = []; render('accueil', 'in-back'); },
    reset: function () { var t = S.theme; S = initState(); S.theme = t; hist = []; render('accueil', 'in-back'); toast('La démo est remise à zéro.'); },
    siret: function () {
      S.etab.searching = true; refresh();
      setTimeout(function () {
        S.etab.searching = false; S.etab.found = true; S.etab.nom = 'Boutique Exemple'; S.etab.adr = '1 rue de l\'Exemple, Ville Exemple'; S.etab.sect = 'Commerce de détail';
        if (cur === 'p-etab') { refresh(); }
      }, 900);
    },
    'creer-compte': function () { hist = ['p-dash']; render('p-jeu', 'in'); toast('Votre espace est créé. Créez votre jeu.'); },
    jeu: function (el) { S.jeu = el.getAttribute('data-v'); refresh(); },
    'jeu-close': function (el) { S.jeu = el.getAttribute('data-v'); closeSheet(); if (cur === 'p-jeu') { refresh(); } else { go('p-jeu'); } },
    formule: function (el) { S.formule = el.getAttribute('data-v'); refresh(); },
    gen: function () {
      S.gen = 'loading'; refresh();
      setTimeout(function () {
        S.qs = pickQuestions(3); S.gen = 'done';
        if (cur === 'p-jeu') { refresh(); }
        if (!/route|routi|conduite|permis/i.test(S.theme_q)) { toast('Démo : l\'assistant propose ici des questions de sécurité routière.'); }
      }, 1100);
    },
    'q-ok': function (el) { var q = S.qs[+el.getAttribute('data-v')]; q.v = !q.v; refresh(); },
    'q-regen': function (el) { S.qs[+el.getAttribute('data-v')] = nextQ(); refresh(); toast('Nouvelle question proposée.'); },
    'q-save': function (el) {
      var q = S.qs[+el.getAttribute('data-v')];
      q.q = document.getElementById('qe-q').value;
      for (var i = 0; i < q.r.length; i++) { q.r[i] = document.getElementById('qe-r' + i).value; }
      q.v = true; closeSheet(); refresh();
    },
    'jeu-next': function () {
      if (S.jeu === 'quiz' && S.gen !== 'done') { toast('Générez d\'abord vos questions.'); return; }
      for (var i = 0; i < S.qs.length; i++) { S.qs[i].v = true; }
      go('p-lots');
    },
    paie: function (el) { S.paie = el.getAttribute('data-v'); closeSheet(); openSheet('payer'); },
    stock: function (el) {
      var l = S.lots[+el.getAttribute('data-v')], d = +el.getAttribute('data-s');
      l.qte = Math.max(l.hist.length, l.qte + d); closeSheet(); refresh(); toast(d > 0 ? 'Un lot ajouté au stock.' : 'Un lot retiré du stock.');
    },
    'lot-save': function () {
      var t = document.getElementById('la-t').value || 'Nouveau lot';
      var c = document.getElementById('la-c').value || '[conditions à compléter]';
      var q = parseInt(document.getElementById('la-q').value, 10) || 1;
      var m = sheetEl.querySelector('input[name="la-m"]:checked');
      S.lots.push({ titre: t, logo: 'be', cond: c, qte: q, mode: m ? m.value : 'instant', hist: [] });
      closeSheet(); refresh(); toast('Lot ajouté.');
    },
    publier: function () { S.publie = true; S.steps[0] = true; closeSheet(); hist = ['p-dash']; render('p-qr', 'in'); },
    'qr-print': function () { toast('Démo : l\'affiche A4 s\'ouvrirait, prête à imprimer.'); },
    'qr-wa': function () { toast('Démo : WhatsApp s\'ouvrirait avec le lien du jeu.'); },
    'qr-sug': function (el) { var f = document.getElementById('qa-n'); if (f) { f.value = el.getAttribute('data-v'); } },
    'qr-add': function () {
      var f = document.getElementById('qa-n'), n = f && f.value ? f.value : 'Nouveau support';
      S.sup.push({ n: n, ic: 'qr', sc: 0 }); closeSheet(); refresh(); toast('QR « ' + n + ' » créé.');
    },
    'dl-png': function () { toast('Démo : le QR serait téléchargé en PNG.'); },
    copier: function () {
      var u = 'https://flowin-events.vercel.app/visite-guidee/';
      try { if (navigator.clipboard) { navigator.clipboard.writeText(u).then(null, function () { }); } } catch (e) { }
      toast('Lien copié (démo).');
    },
    se: function (el) { S.se = el.getAttribute('data-v'); go('p-se-formule'); },
    seF: function (el) { S.seF = el.getAttribute('data-v'); refresh(); },
    'se-send': function () { S.seEnvoye = true; S.steps[2] = true; render('p-se-envoye', 'in'); hist.push('p-dash'); },
    'se-dem': function () { S.seDemande = true; go('p-se-demande-ok'); },
    vis: function (el) { S.visTab = el.getAttribute('data-v'); refresh(); },
    gtab: function (el) { S.gTab = el.getAttribute('data-v'); refresh(); },
    remis: function (el) { S.gagnants[+el.getAttribute('data-v')].r = '15/07'; refresh(); toast('Lot marqué comme remis.'); },
    'close-ok': function () { closeSheet(); toast('Enregistré (démo).'); },
    placer: function (el, ev) {
      var r = el.getBoundingClientRect();
      S.org.px = Math.max(5, Math.min(95, Math.round((ev.clientX - r.left) / r.width * 100)));
      S.org.py = Math.max(12, Math.min(95, Math.round((ev.clientY - r.top) / r.height * 100)));
      refresh();
    },
    ojeu: function (el) { S.org.jeu = el.getAttribute('data-v'); refresh(); },
    of: function (el) { S.org.f[el.getAttribute('data-v')] = el.checked; },
    dem: function (el) { var d = S.demandes[+el.getAttribute('data-v')]; d.s = el.getAttribute('data-s'); refresh(); toast(d.s === 'ok' ? 'Demande acceptée : la station apparaît sur la carte.' : 'Demande refusée.'); },
    'j-start': function () { closeSheet(); S.qi = 0; S.rep = null; S.score = 0; S.bi = 0; S.bonusRep = {}; go('j-quiz'); },
    'j-rep': function (el) {
      if (S.rep !== null) { return; }
      S.rep = +el.getAttribute('data-v'); if (S.rep === QUIZ[S.qi].ok) { S.score++; } refresh();
    },
    'j-next': function () {
      if (S.qi < QUIZ.length - 1) { S.qi++; S.rep = null; render('j-quiz', 'in'); } else { S.bi = 0; go('j-bonus'); }
    },
    'j-bonus': function (el) {
      S.bonusRep[S.bi] = +el.getAttribute('data-v'); refresh();
      setTimeout(function () { ACT['j-bskip'](); }, 280);
    },
    'j-bskip': function () { if (cur !== 'j-bonus') { return; } if (S.bi < BONUS.length - 1) { S.bi++; render('j-bonus', 'in'); } else { go('j-inscr'); } },
    'j-genre': function (el) { var v = el.getAttribute('data-v'); S.j.genre = S.j.genre === v ? '' : v; refresh(); },
    'j-ok': function (el) { S.j.ok = el.checked; refresh(); }
  };

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-go],[data-back],[data-act],[data-sheet],[data-demo],[data-close],[data-tab]') : null;
    if (!el || el.disabled) { return; }
    if (el.hasAttribute('data-close')) { closeSheet(); return; }
    if (el.hasAttribute('data-tab')) { var t = el.getAttribute('data-tab'); if (t !== cur) { hist.push(cur); render(t, null); } return; }
    if (el.hasAttribute('data-go')) { closeSheet(); go(el.getAttribute('data-go')); return; }
    if (el.hasAttribute('data-back')) { closeSheet(); back(); return; }
    if (el.hasAttribute('data-sheet')) { ev.stopPropagation(); openSheet(el.getAttribute('data-sheet'), el.getAttribute('data-v')); return; }
    if (el.hasAttribute('data-demo')) { toast('Démo : ' + el.getAttribute('data-demo')); return; }
    if (el.hasAttribute('data-act')) {
      var a = el.getAttribute('data-act');
      if (el.tagName === 'INPUT') { return; }
      if (ACT[a]) { ACT[a](el, ev); }
    }
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.tagName === 'INPUT' && el.hasAttribute('data-act') && ACT[el.getAttribute('data-act')]) { ACT[el.getAttribute('data-act')](el, ev); }
  });
  document.addEventListener('input', function (ev) {
    var el = ev.target, k = el.getAttribute && el.getAttribute('data-bind');
    if (!k) { return; }
    setPath(k, el.value);
    if (k === 'mdp') { var m = document.getElementById('mdp-check'); if (m) { m.innerHTML = mdpCheck(); } }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' || ev.key === 'Esc') { if (!sheetEl.hidden) { closeSheet(); } }
    if (ev.key === 'Enter' && ev.target.tagName === 'INPUT' && ev.target.getAttribute('data-bind') === 'etab.siret') { ACT.siret(); }
  });

  /* ---------- Liste latérale (ordinateur) ---------- */
  var side = document.getElementById('side-list');
  function buildSide() {
    var h = '', g = '', cols = { c: 'var(--texte2)', p: 'var(--violet)', o: 'var(--orange-v)', j: 'var(--bleu)' }, counts = {};
    for (var i = 0; i < ORDER.length; i++) { var s = SCREENS[ORDER[i]]; counts[s.g] = (counts[s.g] || 0) + 1; }
    for (var k = 0; k < ORDER.length; k++) {
      var id = ORDER[k], sc = SCREENS[id];
      if (sc.g !== g) { g = sc.g; h += '<h4><i style="background:' + cols[g] + '"></i>' + GROUPS[g] + ' <span class="small">(' + counts[g] + ')</span></h4>'; }
      h += '<a data-jump="' + id + '" href="#' + id + '">' + esc(sc.label) + '</a>';
    }
    side.innerHTML = h;
  }
  side.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-jump]'); if (!a) { return; }
    ev.preventDefault(); closeSheet();
    var id = a.getAttribute('data-jump');
    if (id === 'p-etab' && !S.etab.found) { /* laisse l'effet de pré-remplissage à montrer */ }
    if (id === 'p-se-formule' && !S.se) { S.se = 'fe'; }
    if (id === 'j-quiz') { S.rep = null; }
    go(id);
  });
  function sideMark() {
    var as = side.querySelectorAll('a');
    for (var i = 0; i < as.length; i++) { if (as[i].getAttribute('data-jump') === cur) { as[i].className = 'on'; } else { as[i].className = ''; } }
  }

  buildSide();
  var start = (location.hash || '').replace('#', '');
  render(SCREENS[start] ? start : 'accueil', 'in');
  window.__visite = { go: go, ids: ORDER, state: function () { return S; } };
})();
