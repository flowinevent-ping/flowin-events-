/* Briques des neuf vidéos v3 (style H pastel). S'appuie sur engine-h.js (FH)
   et kit-h.js (KH). Les écrans reproduisent l'application (sources citées
   au-dessus de chaque écran) ; les chiffres affichés sont des valeurs
   d'illustration, signalées comme telles à l'écran. */
(function () {
  var F = window.FH, K = window.KH, C = F.C, INK = C.ink, MAG = C.mag
  var K3 = {}
  // Fonds pastel validés (direction artistique v3).
  var P = K3.P = { beurre: '#FDF6B2', rose: '#F9D5E5', menthe: '#D9F2EA', ciel: '#D7EEF9', lilas: '#E6DDF7' }
  var PRO = K3.PRO = { fond: '#f2edf7', carte: '#fff', bord: '#e7def0', texte: '#1c1024', mut: '#8a7e93', acc: '#2563EB', acc2: '#0EA5E9', or: '#F5A100', vio: '#7C2D92', ok: '#1e9e6a' }
  var num = function (x) { return (+x).toFixed(1) }
  function txt(x, y, t, size, o) {
    o = o || {}
    return '<text x="' + num(x) + '" y="' + num(y) + '" font-family="Manrope" font-weight="' + (o.w || 800) + '" font-size="' + num(size) + '" fill="' + (o.fill || INK) + '"' +
      (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + (o.op !== undefined ? ' opacity="' + (+o.op).toFixed(3) + '"' : '') + '>' + F.esc(t) + '</text>'
  }
  K3.txt = txt
  function rect(x, y, w, h, r, fill, o) {
    o = o || {}
    return '<rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '" rx="' + num(r) + '" fill="' + fill + '"' +
      (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + (o.sw || 1) + '"' : '') + (o.op !== undefined ? ' opacity="' + (+o.op).toFixed(3) + '"' : '') + '/>'
  }
  K3.rect = rect
  function check(cx, cy, r, col) {
    return '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(r) + '" fill="' + (col || '#1e9e6a') + '"/><path d="M' + num(cx - r * 0.45) + ',' + num(cy) + ' L' + num(cx - r * 0.1) + ',' + num(cy + r * 0.35) + ' L' + num(cx + r * 0.5) + ',' + num(cy - r * 0.35) + '" stroke="#fff" stroke-width="' + num(r * 0.22) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  }
  K3.check = check
  K3.op = function (p, inner) { return p <= 0 ? '' : '<g opacity="' + Math.min(1, p).toFixed(3) + '">' + inner + '</g>' }
  K3.at = function (x, y, s, inner, rot) { return '<g transform="translate(' + num(x) + ',' + num(y) + ')' + (s !== undefined && s !== 1 ? ' scale(' + (+s).toFixed(3) + ')' : '') + (rot ? ' rotate(' + rot + ')' : '') + '">' + inner + '</g>' }
  K3.pop = function (lt, a, d) { return F.easeOut(F.prog(lt, a, d || 0.4)) }

  // Gros titre (avant « · ») et petit texte (après « · ») d'une scène.
  K3.titre = function (sc, lt, img0) {
    var g = F.mots(sc.mots, lt, INK, img0 ? false : undefined, sc.y0, sc.max)
    if (sc.petit) g += K.sous(sc.petit, lt, { img0: img0, a: 0.45, size: sc.petitSize || 24 })
    else F._basSous = F._basMots - 10
    return g
  }

  // Macaron « Plug & Play » (plaquette-nds.html, .ss-pill) : pilule, dégradé
  // 135° #F5A100 -> #EC5B45, texte blanc Manrope 800.
  K3.pill = function (x, y, h, anchor) {
    var gid = F.id('pp'), w = h * 4.1, x0 = anchor === 'middle' ? x - w / 2 : x
    return '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F5A100"/><stop offset="1" stop-color="#EC5B45"/></linearGradient></defs>' +
      rect(x0, y - h / 2, w, h, h / 2, 'url(#' + gid + ')') + txt(x0 + w / 2, y + h * 0.17, 'Plug & Play', h * 0.46, { fill: '#fff', anchor: 'middle', ls: -0.2 })
  }
  // Logo Flowin + macaron Plug & Play, centrés ensemble.
  K3.signature = function (cx, y, s) {
    s = s || 1
    return F.logo(cx - 72 * s, y, 64 * s, INK, 'middle') + K3.pill(cx + 52 * s, y - 20 * s, 40 * s)
  }
  // Écran de fin commun : appel à l'action, QR démo, logo + Plug & Play.
  K3.fin = function (lt, img0, lignes, o) {
    o = o || {}
    var g = '', y = 160, n = lignes.length, size = o.size || (n > 2 ? 40 : 46)
    lignes.forEach(function (l, i) {
      var p = img0 ? 1 : F.easeOut(F.prog(lt, 0.1 + i * 0.12, 0.4))
      g += '<text class="safe" x="30" y="' + num(y + (1 - p) * 30) + '" font-family="Manrope" font-weight="800" font-size="' + size + '" letter-spacing="' + (-0.04 * size).toFixed(1) + '" fill="' + (i === n - 1 ? MAG : INK) + '" opacity="' + p.toFixed(3) + '">' + F.esc(l) + '</text>'
      y += size * 1.08
    })
    var qy = Math.max(300, y + 28)
    var pq = img0 ? 1 : F.easeOut(F.prog(lt, 0.35, 0.45))
    g += K3.op(pq, F.qr(150, qy, 180))
    g += F.flash(240, qy + 90, lt, 0.5, 2)
    g += K.T(240, qy + 236, 'Scanne pour essayer le jeu', { size: 19, w: 700, anchor: 'middle', fill: 'rgba(21,12,28,.7)' })
    var ps = img0 ? 1 : F.easeOut(F.prog(lt, 0.8, 0.45))
    g += K3.op(ps, K3.signature(240, Math.min(730, qy + 330), 1))
    return g
  }

  // Images réelles (window.ASSETS, intégrées par build-v3.mjs).
  K3.img = function (key, x, y, w, h, o) {
    o = o || {}
    var cid = F.id('ic'), r = o.r === undefined ? 10 : o.r
    return (o.ombre === false ? '' : rect(x + 6, y + 10, w, h, r, 'rgba(0,0,0,.22)')) +
      '<clipPath id="' + cid + '"><rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '" rx="' + r + '"/></clipPath>' +
      '<image clip-path="url(#' + cid + ')" href="' + window.ASSETS[key] + '" x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '" preserveAspectRatio="xMidYMid slice"/>'
  }
  // Zoom dans une image : (fx, fy) point visé dans l'image (0..1), z facteur.
  K3.zoom = function (key, x, y, w, h, ratio, fx, fy, z, r) {
    var cid = F.id('zc'), iw = w * z, ih = iw * ratio
    var ix = x + w / 2 - fx * iw, iy = y + h / 2 - fy * ih
    ix = Math.min(x, Math.max(x + w - iw, ix)); iy = Math.min(y, Math.max(y + h - ih, iy))
    return rect(x + 6, y + 10, w, h, r || 14, 'rgba(0,0,0,.22)') +
      '<clipPath id="' + cid + '"><rect x="' + num(x) + '" y="' + num(y) + '" width="' + num(w) + '" height="' + num(h) + '" rx="' + (r || 14) + '"/></clipPath>' +
      '<image clip-path="url(#' + cid + ')" href="' + window.ASSETS[key] + '" x="' + num(ix) + '" y="' + num(iy) + '" width="' + num(iw) + '" height="' + num(ih) + '"/>'
  }

  // Silhouette pleine, sans visage. o.tel : bras levé avec téléphone.
  K3.perso = function (x, y, s, o) {
    o = o || {}
    var col = o.col || INK, g = '<g transform="translate(' + num(x) + ',' + num(y) + ') scale(' + (s || 1) + ')" fill="' + col + '">'
    g += '<circle cy="-112" r="22"/><path d="M-34,0 L-34,-58 Q-34,-84 0,-84 Q34,-84 34,-58 L34,0 Z"/>'
    if (o.tel) g += '<path d="M24,-74 L52,-112" stroke="' + col + '" stroke-width="14" stroke-linecap="round"/><rect x="44" y="-140" width="20" height="34" rx="4" transform="rotate(18 54 -123)"/><rect x="47" y="-136" width="14" height="24" rx="2" fill="#fff" opacity=".85" transform="rotate(18 54 -123)"/>'
    if (o.sac) g += '<rect x="30" y="-46" width="26" height="30" rx="4" fill="' + MAG + '"/><path d="M36,-46 Q43,-60 50,-46" stroke="' + MAG + '" stroke-width="3" fill="none"/>'
    return g + '</g>'
  }

  // Macaron vitrine Flowin (matériel du kit, dessin indicatif).
  K3.macaron = function (x, y, r, allume) {
    var a = allume === undefined ? 1 : allume
    var g = '<g transform="translate(' + num(x) + ',' + num(y) + ')">'
    if (a > 0) g += '<circle r="' + num(r * (1.25 + 0.15 * a)) + '" fill="' + MAG + '" opacity="' + (0.18 * a).toFixed(3) + '"/>'
    g += '<circle r="' + num(r) + '" fill="#fff" stroke="' + (a > 0.5 ? MAG : INK) + '" stroke-width="' + num(r * 0.09) + '"/>'
    g += txt(0, -r * 0.3, 'JOUEZ ICI', r * 0.2, { anchor: 'middle', ls: r * 0.01 })
    g += F.logo(0, r * 0.2, r * 0.42, INK, 'middle')
    g += '<rect x="' + num(-r * 0.17) + '" y="' + num(r * 0.34) + '" width="' + num(r * 0.34) + '" height="' + num(r * 0.34) + '" rx="' + num(r * 0.05) + '" fill="' + INK + '"/><rect x="' + num(-r * 0.09) + '" y="' + num(r * 0.42) + '" width="' + num(r * 0.07) + '" height="' + num(r * 0.07) + '" fill="#fff"/><rect x="' + num(r * 0.02) + '" y="' + num(r * 0.53) + '" width="' + num(r * 0.07) + '" height="' + num(r * 0.07) + '" fill="#fff"/>'
    return g + '</g>'
  }
  // Support de caisse (chevalet) avec QR.
  K3.chevalet = function (x, y, w) {
    var h = w * 1.25
    return '<g transform="translate(' + num(x) + ',' + num(y) + ')">' +
      '<path d="M' + num(-w * 0.5) + ',' + num(h * 0.5) + ' L' + num(-w * 0.42) + ',' + num(-h * 0.5) + ' L' + num(w * 0.42) + ',' + num(-h * 0.5) + ' L' + num(w * 0.5) + ',' + num(h * 0.5) + ' Z" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
      txt(0, -h * 0.32, 'FLASHEZ & JOUEZ', w * 0.085, { anchor: 'middle' }) + F.qr(-w * 0.26, -h * 0.22, w * 0.52) +
      F.logo(0, h * 0.42, w * 0.15, INK, 'middle') + '</g>'
  }
  // Affiche Flowin dessinée (commerce) ; o.marque = encart logo sponsor.
  K3.affiche = function (x, y, w, rot, o) {
    o = o || {}
    var h = w * 1.41
    var g = '<g transform="translate(' + num(x) + ',' + num(y) + ') rotate(' + (rot || 0) + ')">' + rect(-w / 2 + 5, -h / 2 + 8, w, h, 6, 'rgba(0,0,0,.2)') + rect(-w / 2, -h / 2, w, h, 6, '#fff')
    g += rect(-w / 2, -h / 2, w, h * 0.3, 6, INK) + rect(-w / 2, -h / 2 + h * 0.24, w, h * 0.06, 0, INK)
    g += txt(0, -h / 2 + h * 0.12, 'JOUEZ', w * 0.16, { anchor: 'middle', fill: '#fff', ls: -1 }) + txt(0, -h / 2 + h * 0.22, 'ICI !', w * 0.16, { anchor: 'middle', fill: MAG, ls: -1 })
    g += o.sansQR ? rect(-w * 0.3, -h * 0.13, w * 0.6, w * 0.5, 6, P.beurre) + txt(0, -h * 0.13 + w * 0.32, 'PROMO', w * 0.13, { anchor: 'middle', fill: MAG }) : F.qr(-w * 0.22, -h * 0.12, w * 0.44)
    g += txt(0, h * 0.3, 'Jeu gratuit · sans achat obligatoire', w * 0.045, { anchor: 'middle', w: 700, fill: '#6b6174' })
    if (o.marque) g += rect(-w * 0.36, h * 0.34, w * 0.72, h * 0.1, 4, '#F4F0F8', { stroke: o.marqueCol || MAG, sw: 2 }) + txt(0, h * 0.405, 'VOTRE MARQUE', w * 0.07, { anchor: 'middle', fill: o.marqueCol || MAG })
    else g += F.logo(0, h * 0.43, w * 0.13, INK, 'middle')
    return g + '</g>'
  }
  // Boîte du kit Flowin.
  K3.boite = function (x, y, w, ouvert) {
    var h = w * 0.55
    return '<g transform="translate(' + num(x) + ',' + num(y) + ')">' + rect(-w / 2 + 6, -h / 2 + 10, w, h, 10, 'rgba(0,0,0,.18)') + rect(-w / 2, -h / 2, w, h, 10, '#E9C99A') +
      '<path d="M' + num(-w / 2) + ',' + num(-h / 2) + ' L' + num(-w / 2 - w * 0.08 * ouvert) + ',' + num(-h / 2 - h * 0.5 * ouvert) + ' L' + num(-w * 0.02) + ',' + num(-h / 2 - h * 0.5 * ouvert) + ' L0,' + num(-h / 2) + ' Z" fill="#D9B27C"/>' +
      '<path d="M' + num(w / 2) + ',' + num(-h / 2) + ' L' + num(w / 2 + w * 0.08 * ouvert) + ',' + num(-h / 2 - h * 0.5 * ouvert) + ' L' + num(w * 0.02) + ',' + num(-h / 2 - h * 0.5 * ouvert) + ' L0,' + num(-h / 2) + ' Z" fill="#D9B27C"/>' +
      F.logo(0, h * 0.12, w * 0.16, INK, 'middle') + '</g>'
  }
  // Carte de fidélité papier.
  K3.fidelite = function (x, y, w, rot) {
    var h = w * 0.6, g = '<g transform="translate(' + num(x) + ',' + num(y) + ') rotate(' + (rot || 0) + ')">' + rect(-w / 2 + 4, -h / 2 + 6, w, h, 8, 'rgba(0,0,0,.15)') + rect(-w / 2, -h / 2, w, h, 8, '#FFF8EC', { stroke: '#d8cbb4', sw: 2 })
    g += txt(-w / 2 + 14, -h / 2 + 26, 'CARTE DE FIDÉLITÉ', w * 0.07, { fill: '#8a7a63' })
    for (var k = 0; k < 10; k++) { var cx = -w / 2 + 24 + (k % 5) * (w - 48) / 4, cy = -h * 0.02 + Math.floor(k / 5) * h * 0.3; g += '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(w * 0.055) + '" fill="none" stroke="#c9b99c" stroke-width="2"/>' + (k < 2 ? '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(w * 0.035) + '" fill="#c9b99c"/>' : '') }
    return g + '</g>'
  }
  // Vitrine de commerce : store rayé, enseigne, vitre ; o.macaron = 0..1.
  K3.vitrine = function (x, y, w, h, o) {
    o = o || {}
    var col = o.col || MAG, g = '<g transform="translate(' + num(x) + ',' + num(y) + ')">'
    g += rect(0, 0, w, h, 6, '#fff', { stroke: INK, sw: 3 })
    g += rect(-6, -4, w + 12, h * 0.16, 4, INK)
    g += txt(w / 2, h * 0.105, o.nom || '', Math.min(w * 0.11, 22), { anchor: 'middle', fill: '#fff' })
    var n = 6, sw = (w + 12) / n
    for (var k = 0; k < n; k++) g += '<path d="M' + num(-6 + k * sw) + ',' + num(h * 0.16 - 4) + ' L' + num(-6 + (k + 1) * sw) + ',' + num(h * 0.16 - 4) + ' L' + num(-6 + (k + 0.5) * sw) + ',' + num(h * 0.27) + ' Z" fill="' + (k % 2 ? '#fff' : col) + '" stroke="' + INK + '" stroke-width="2"/>'
    g += rect(w * 0.08, h * 0.34, w * 0.5, h * 0.6, 4, o.vitre || '#EAF6FB', { stroke: INK, sw: 2.5 })
    g += rect(w * 0.66, h * 0.34, w * 0.26, h * 0.66, 3, INK)
    if (o.icone) g += K3.icone(o.icone, w * 0.33, h * 0.66)
    if (o.macaron !== undefined) g += K3.macaron(w * 0.79, h * 0.52, Math.min(w, h) * 0.12, o.macaron)
    if (o.affiche) g += K3.affiche(w * 0.24, h * 0.62, w * 0.22, -2)
    return g + '</g>'
  }

  /* ── Écrans joueur ─────────────────────────────────────────────────── */
  // En-tête de jeu générique (ParcoursHero) : pastille, nom, étiquette.
  K3.entete = function (u, nom, tag) {
    var bid = F.id('bdg')
    return '<defs><linearGradient id="' + bid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + C.gold + '"/><stop offset="1" stop-color="' + MAG + '"/></linearGradient></defs>' +
      rect(14 * u, 30 * u, 30 * u, 30 * u, 10 * u, 'url(#' + bid + ')') +
      txt(29 * u, 50 * u, nom.charAt(0), 15 * u, { anchor: 'middle', fill: '#fff' }) +
      txt(52 * u, 43 * u, nom, 13.5 * u, { fill: '#fff' }) +
      txt(52 * u, 56 * u, tag, 8.5 * u, { fill: 'rgba(255,255,255,.55)', ls: 0.7 * u })
  }
  // Quiz d'un commerce (QuizClient) : question 2/5, bonne réponse cochée.
  K3.ecranQuizC = function (nom, choix, q) {
    q = q || { l1: 'Le muguet porte', l2: 'bonheur le… ?', o: ['14 février', '1er mai', '21 juin', '25 décembre'], ok: 1 }
    return function (sw, sh) {
      var u = sw / 240, g = F.degradeQuiz(sw, sh) + K3.entete(u, nom, 'QUIZ · JEU GRATUIT')
      g += txt(14 * u, 96 * u, '2 / 5', 10.5 * u, { w: 700, fill: 'rgba(255,255,255,.45)' })
      g += rect(44 * u, 91 * u, 182 * u, 4 * u, 2 * u, 'rgba(255,255,255,.1)') + rect(44 * u, 91 * u, 73 * u, 4 * u, 2 * u, MAG)
      g += txt(14 * u, 128 * u, q.l1, 17 * u, { fill: '#fff' }) + txt(14 * u, 150 * u, q.l2, 17 * u, { fill: '#fff' })
      q.o.forEach(function (o, k) {
        var y = (172 + k * 50) * u, ok = k === q.ok ? choix : 0
        g += rect(14 * u, y, 212 * u, 40 * u, 12 * u, ok ? 'rgba(0,180,160,' + (0.22 * ok).toFixed(3) + ')' : 'rgba(255,255,255,.05)', { stroke: ok > 0.5 ? C.teal : 'rgba(255,255,255,.14)', sw: 1.5 * u })
        g += txt(28 * u, y + 25 * u, o, 13 * u, { w: 600, fill: '#fff' })
        if (ok > 0) g += K3.op(ok, check(206 * u, y + 20 * u, 10 * u, C.teal))
      })
      return g
    }
  }
  // Roue (SpinClient) : segments = lots, bouton « Faire tourner la roue ».
  K3.ecranRoue = function (nom, angle, segs) {
    segs = segs || ['Bouquet', 'Perdu', '-10 %', 'Perdu', 'Plante', 'Perdu']
    return function (sw, sh) {
      var u = sw / 240, g = F.degradeQuiz(sw, sh) + K3.entete(u, nom, 'ROUE · JEU GRATUIT')
      var cx = 120 * u, cy = 200 * u, R = 88 * u, cols = ['#00B4A0', '#3B5CC4', '#F97316', '#7C3AED', '#E0218A', '#06B6D4'], n = segs.length
      g += '<g transform="rotate(' + num(angle) + ' ' + num(cx) + ' ' + num(cy) + ')">'
      for (var i = 0; i < n; i++) {
        var a1 = i * 2 * Math.PI / n - Math.PI / 2, a2 = a1 + 2 * Math.PI / n, am = (a1 + a2) / 2
        g += '<path d="M' + num(cx) + ',' + num(cy) + ' L' + num(cx + R * Math.cos(a1)) + ',' + num(cy + R * Math.sin(a1)) + ' A' + num(R) + ',' + num(R) + ' 0 0 1 ' + num(cx + R * Math.cos(a2)) + ',' + num(cy + R * Math.sin(a2)) + ' Z" fill="' + cols[i % cols.length] + '" stroke="#fff" stroke-width="' + num(1.5 * u) + '"/>'
        g += '<text x="' + num(cx + R * 0.62 * Math.cos(am)) + '" y="' + num(cy + R * 0.62 * Math.sin(am) + 4 * u) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + num(10 * u) + '" fill="#fff" transform="rotate(' + num(am * 180 / Math.PI + 90) + ' ' + num(cx + R * 0.62 * Math.cos(am)) + ' ' + num(cy + R * 0.62 * Math.sin(am)) + ')">' + F.esc(segs[i]) + '</text>'
      }
      g += '</g><circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(14 * u) + '" fill="#fff"/>'
      g += '<path d="M' + num(cx - 10 * u) + ',' + num(cy - R - 8 * u) + ' L' + num(cx + 10 * u) + ',' + num(cy - R - 8 * u) + ' L' + num(cx) + ',' + num(cy - R + 12 * u) + ' Z" fill="#fff"/>'
      g += rect(30 * u, 318 * u, 180 * u, 40 * u, 20 * u, MAG) + txt(120 * u, 343 * u, 'Faire tourner la roue', 12.5 * u, { anchor: 'middle', fill: '#fff' })
      return g
    }
  }
  // Tombola (TombolaClient) : « Tu es dans la course ! ».
  K3.ecranTombola = function (nom) {
    return function (sw, sh) {
      var u = sw / 240, g = F.degradeQuiz(sw, sh) + K3.entete(u, nom, 'TOMBOLA · JEU GRATUIT')
      g += check(120 * u, 140 * u, 30 * u, C.teal)
      g += txt(120 * u, 205 * u, 'Tu es dans la course !', 18 * u, { anchor: 'middle', fill: '#fff' })
      g += txt(120 * u, 226 * u, 'Ton numéro de tombola a été enregistré', 9.5 * u, { anchor: 'middle', w: 600, fill: 'rgba(255,255,255,.55)' })
      g += rect(26 * u, 246 * u, 188 * u, 70 * u, 14 * u, 'rgba(255,255,255,.08)', { stroke: 'rgba(255,255,255,.2)', sw: u })
      g += txt(120 * u, 270 * u, 'Ton ticket tombola', 12 * u, { anchor: 'middle', fill: '#fff' })
      g += txt(120 * u, 300 * u, 'TB-0427', 20 * u, { anchor: 'middle', fill: C.gold, ls: 2 * u })
      return g
    }
  }
  // Email gagnant (supabase/functions/send-ticket-gagnant, objet et corps réels).
  K3.ecranEmail = function (lot, ouvert) {
    return function (sw, sh) {
      var u = sw / 240, g = rect(0, 0, sw, sh, 0, '#fff')
      g += rect(0, 0, sw, 62 * u, 0, '#f4f1f7') + txt(14 * u, 46 * u, 'Boîte de réception', 12 * u, { fill: INK })
      g += txt(14 * u, 88 * u, 'Nuits du Sud & Flowin', 11 * u, { fill: INK })
      g += txt(14 * u, 104 * u, 'Grand Jeu Concours —', 11 * u, { w: 700, fill: '#4a4058' })
      g += txt(14 * u, 120 * u, 'Vous avez gagné !', 13 * u, { fill: MAG })
      g += '<path d="M' + 14 * u + ',' + 132 * u + ' L' + 226 * u + ',' + 132 * u + '" stroke="#ece6f1" stroke-width="' + u + '"/>'
      var p = ouvert === undefined ? 1 : ouvert
      if (p > 0) {
        var gg = txt(14 * u, 156 * u, 'Waouh, bravo ! Au grand tirage', 10 * u, { w: 600, fill: '#4a4058' }) + txt(14 * u, 170 * u, 'du jeu, tu as gagné :', 10 * u, { w: 600, fill: '#4a4058' })
        gg += rect(14 * u, 182 * u, 212 * u, 40 * u, 10 * u, '#f6eefb') + txt(120 * u, 207 * u, lot, 13 * u, { anchor: 'middle', fill: INK })
        gg += txt(120 * u, 248 * u, '>>> TON BILLET EST ICI <<<', 11 * u, { anchor: 'middle', fill: C.violet })
        gg += rect(40 * u, 260 * u, 160 * u, 34 * u, 17 * u, C.violet) + txt(120 * u, 282 * u, 'Ouvrir mon billet', 11.5 * u, { anchor: 'middle', fill: '#fff' })
        gg += txt(14 * u, 322 * u, '1. Rends-toi chez le commerçant', 9.5 * u, { w: 600, fill: '#6b6174' }) + txt(14 * u, 338 * u, '2. Présente ton billet', 9.5 * u, { w: 600, fill: '#6b6174' }) + txt(14 * u, 354 * u, '3. Il scanne le QR et valide', 9.5 * u, { w: 600, fill: '#6b6174' })
        g += K3.op(p, gg)
      }
      return g
    }
  }
  // Billet gagnant (public/nds/billets-partenaires.html) : QR à scanner.
  K3.ecranBilletQR = function (lot, commerce, titre) {
    return function (sw, sh) {
      var u = sw / 240, g = rect(0, 0, sw, sh, 0, '#efe9f5')
      g += rect(10 * u, 30 * u, 220 * u, 340 * u, 18 * u, '#fff')
      g += '<path d="M' + 10 * u + ',' + 48 * u + ' Q' + 10 * u + ',' + 30 * u + ' ' + 28 * u + ',' + 30 * u + ' L' + 212 * u + ',' + 30 * u + ' Q' + 230 * u + ',' + 30 * u + ' ' + 230 * u + ',' + 48 * u + ' L' + 230 * u + ',' + 84 * u + ' L' + 10 * u + ',' + 84 * u + ' Z" fill="#5f1f74"/>'
      g += txt(24 * u, 55 * u, (titre || 'GRAND JEU').toUpperCase(), 8.5 * u, { fill: '#fff', ls: 1.6 * u }) + txt(24 * u, 69 * u, 'ÉDITION 2026', 8.5 * u, { fill: 'rgba(255,255,255,.7)', ls: 1.6 * u })
      g += F.logo(214 * u, 66 * u, 15 * u, '#fff', 'end')
      g += rect(10 * u, 84 * u, 220 * u, 4 * u, 0, '#F5B544')
      g += txt(120 * u, 108 * u, 'COMMERCE PARTENAIRE', 7.5 * u, { anchor: 'middle', fill: '#8d8499', ls: 1.4 * u })
      g += txt(120 * u, 126 * u, commerce, 14 * u, { anchor: 'middle' })
      g += txt(120 * u, 156 * u, lot, 13 * u, { anchor: 'middle', fill: C.violet })
      var q = 110 * u
      g += F.qr(120 * u - q / 2, 176 * u, q)
      g += txt(120 * u, 318 * u, 'PQ-2026-4128', 12 * u, { anchor: 'middle', ls: 1.2 * u })
      g += txt(120 * u, 338 * u, 'Le commerçant scanne ce code pour valider', 8 * u, { anchor: 'middle', w: 600, fill: '#8d8499' })
      return g
    }
  }
  // Validation côté commerce (public/lot.html) : étape 0 code pro, 1 billet
  // valable, 2 retrait validé. code = 0..4 chiffres saisis.
  K3.ecranRetrait = function (etape, code, commerce, lot) {
    return function (sw, sh) {
      var u = sw / 240, g = rect(0, 0, sw, sh, 0, '#f2edf7')
      g += rect(10 * u, 30 * u, 220 * u, 330 * u, 18 * u, '#fff') + rect(10 * u, 30 * u, 220 * u, 5 * u, 2 * u, '#F5B544')
      if (etape === 0) {
        g += txt(120 * u, 70 * u, lot, 14 * u, { anchor: 'middle' }) + txt(120 * u, 90 * u, 'N° de billet  PQ-2026-4128', 9 * u, { anchor: 'middle', w: 700, fill: '#7c7389' })
        g += txt(24 * u, 132 * u, 'Code professionnel', 12 * u, {})
        g += txt(24 * u, 150 * u, 'Il autorise la validation des billets', 8.5 * u, { w: 600, fill: '#7c7389' }) + txt(24 * u, 162 * u, 'de votre établissement.', 8.5 * u, { w: 600, fill: '#7c7389' })
        for (var k = 0; k < 4; k++) {
          g += rect((34 + k * 46) * u, 178 * u, 36 * u, 44 * u, 10 * u, '#faf7fc', { stroke: k < code ? C.violet : '#e4dcec', sw: 1.6 * u })
          if (k < code) g += '<circle cx="' + num((52 + k * 46) * u) + '" cy="' + num(200 * u) + '" r="' + num(5 * u) + '" fill="' + INK + '"/>'
        }
        g += rect(24 * u, 244 * u, 192 * u, 40 * u, 20 * u, code >= 4 ? C.violet : '#cdbfd8') + txt(120 * u, 269 * u, 'Accéder à la validation', 12 * u, { anchor: 'middle', fill: '#fff' })
      } else if (etape === 1) {
        g += txt(120 * u, 66 * u, 'COMMERCE PARTENAIRE', 7.5 * u, { anchor: 'middle', fill: '#7c7389', ls: 1.4 * u }) + txt(120 * u, 84 * u, commerce, 13.5 * u, { anchor: 'middle' })
        g += rect(70 * u, 98 * u, 100 * u, 22 * u, 11 * u, 'rgba(30,158,106,.12)') + txt(120 * u, 113 * u, 'Billet valable', 10 * u, { anchor: 'middle', fill: '#1e9e6a' })
        g += rect(80 * u, 134 * u, 80 * u, 18 * u, 9 * u, C.violet) + txt(120 * u, 147 * u, 'Bon cadeau', 9 * u, { anchor: 'middle', fill: '#fff' })
        g += txt(120 * u, 176 * u, lot, 15 * u, { anchor: 'middle' })
        g += txt(24 * u, 210 * u, 'N° de billet', 9 * u, { w: 700, fill: '#7c7389' }) + txt(216 * u, 210 * u, 'PQ-2026-4128', 9.5 * u, { anchor: 'end' })
        g += rect(24 * u, 290 * u, 192 * u, 42 * u, 21 * u, C.violet) + txt(120 * u, 316 * u, 'Valider le retrait du lot', 12 * u, { anchor: 'middle', fill: '#fff' })
      } else {
        g += check(120 * u, 120 * u, 34 * u, '#1e9e6a')
        g += txt(120 * u, 192 * u, 'Retrait validé', 20 * u, { anchor: 'middle' })
        g += txt(120 * u, 214 * u, 'Le lot peut être remis au client.', 10 * u, { anchor: 'middle', w: 600, fill: '#7c7389' })
        g += rect(26 * u, 236 * u, 188 * u, 64 * u, 14 * u, '#faf7fc', { stroke: '#efeaf4', sw: u })
        g += txt(120 * u, 258 * u, 'COMMERCE PARTENAIRE', 7.5 * u, { anchor: 'middle', fill: '#7c7389', ls: 1.4 * u }) + txt(120 * u, 282 * u, commerce, 13 * u, { anchor: 'middle' })
      }
      return g
    }
  }
  // Vote (VoteClient) : « Votez ! », choix « Sélectionné », « Valider mon vote ».
  K3.ecranVote = function (nom, choix, items, titre) {
    items = items || ['Fête des commerces', 'Marché de nuit', 'Concours de vitrines']
    return function (sw, sh) {
      var u = sw / 240, g = F.degradeQuiz(sw, sh) + K3.entete(u, nom, 'VOTE · JEU GRATUIT')
      g += txt(14 * u, 108 * u, 'Votez !', 20 * u, { fill: '#fff' })
      g += txt(14 * u, 128 * u, titre || 'Votre animation préférée ?', 11 * u, { w: 600, fill: 'rgba(255,255,255,.65)' })
      items.forEach(function (o, k) {
        var y = (146 + k * 54) * u, s = k === 1 ? choix : 0
        g += rect(14 * u, y, 212 * u, 44 * u, 12 * u, s ? 'rgba(224,33,138,' + (0.25 * s).toFixed(3) + ')' : 'rgba(255,255,255,.05)', { stroke: s > 0.5 ? MAG : 'rgba(255,255,255,.14)', sw: 1.5 * u })
        g += txt(28 * u, y + 27 * u, o, 12.5 * u, { w: 700, fill: '#fff' })
        if (s > 0.5) g += txt(214 * u, y + 27 * u, 'Sélectionné', 9 * u, { anchor: 'end', fill: '#fff' })
      })
      g += rect(30 * u, 318 * u, 180 * u, 40 * u, 20 * u, MAG, { op: 0.5 + 0.5 * choix }) + txt(120 * u, 343 * u, 'Valider mon vote →', 12.5 * u, { anchor: 'middle', fill: '#fff' })
      return g
    }
  }

  /* ── Écrans de l'espace pro (CHARTE_PRO : fond #f2edf7, accent #2563EB) ── */
  K3.proFond = function (sw, sh, u, titre, sous) {
    var g = rect(0, 0, sw, sh, 0, PRO.fond)
    g += rect(0, 0, sw, 58 * u, 0, '#0F1E33') + F.logo(14 * u, 44 * u, 15 * u, '#fff') + txt(66 * u, 44 * u, 'Pro', 11 * u, { fill: PRO.acc2 })
    g += txt(14 * u, 86 * u, titre, 15 * u, { fill: PRO.texte })
    if (sous) g += txt(14 * u, 100 * u, sous, 8.5 * u, { w: 600, fill: PRO.mut })
    return g
  }
  K3.onglets = function (u, y, noms, actif) {
    var g = '', x = 14 * u
    noms.forEach(function (n, k) {
      var w = (n.length * 5.4 + 16) * u
      g += rect(x, y, w, 18 * u, 9 * u, k === actif ? PRO.acc : '#fff', { stroke: k === actif ? PRO.acc : PRO.bord, sw: u })
      g += txt(x + w / 2, y + 12.5 * u, n, 8.5 * u, { anchor: 'middle', fill: k === actif ? '#fff' : PRO.texte })
      x += w + 5 * u
    })
    return g
  }
  K3.mini = function (u, x, y, w, v, l) {
    return rect(x, y, w, 40 * u, 9 * u, '#fff', { stroke: PRO.bord, sw: u }) + txt(x + 8 * u, y + 19 * u, v, 13 * u, { fill: PRO.texte }) + txt(x + 8 * u, y + 32 * u, l, 7 * u, { w: 700, fill: PRO.mut })
  }
  K3.illus = function (u, sw, y) { return txt(sw / 2, y, 'Valeurs d’illustration', 7.5 * u, { anchor: 'middle', w: 700, fill: PRO.mut }) }
  // Trafic (BlocsOperations, ContenuTracking) : flashs, physique, digital,
  // parties, joueurs, puis « Source d'arrivée » (QR de suivi par support).
  K3.ecranTrafic = function (p, sources, titreListe) {
    sources = sources || [['affiche-vitrine', 0.9], ['support-caisse', 0.7], ['Réseaux · instagram', 0.55]]
    return function (sw, sh) {
      var u = sw / 240, k = F.clamp(p, 0, 1), g = K3.proFond(sw, sh, u, 'Mes super data', 'CRM, gagnants et trafic de vos opérations.')
      g += K3.onglets(u, 110 * u, ['CRM', 'Gagnants & tirage', 'Trafic'], 2)
      var v = function (x) { return String(Math.round(x * k)) }
      g += K3.mini(u, 14 * u, 140 * u, 68 * u, v(214), 'flashs QR') + K3.mini(u, 86 * u, 140 * u, 68 * u, v(150), 'dont physique') + K3.mini(u, 158 * u, 140 * u, 68 * u, v(64), 'dont digital')
      g += K3.mini(u, 14 * u, 186 * u, 104 * u, v(168), 'parties') + K3.mini(u, 122 * u, 186 * u, 104 * u, v(121), 'joueurs')
      g += txt(14 * u, 248 * u, titreListe || 'SOURCE D’ARRIVÉE', 7.5 * u, { fill: PRO.mut, ls: 0.6 * u })
      var pas = sources.length > 3 ? 25 : 30
      sources.forEach(function (s, i) {
        var y = (258 + i * pas) * u, w = 120 * u * s[1] * F.easeOut(F.clamp(k * 1.4 - i * 0.15, 0, 1))
        g += rect(14 * u, y, 212 * u, (pas - 6) * u, 7 * u, '#fff', { stroke: PRO.bord, sw: u }) + txt(22 * u, y + (pas - 6) * 0.65 * u, s[0], 8.5 * u, { fill: PRO.texte })
        g += rect(104 * u, y + (pas - 14) / 2 * u, w, 8 * u, 4 * u, i === 2 ? PRO.acc2 : PRO.acc)
      })
      g += K3.illus(u, sw, 360 * u)
      return g
    }
  }
  // CRM (components/pro/CrmPro.tsx) : opt-in, sélection, « Envoyer un email ».
  K3.ecranCRM = function (sel, envoi) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Mes super data', 'CRM, gagnants et trafic de vos opérations.')
      g += K3.onglets(u, 110 * u, ['CRM', 'Gagnants & tirage', 'Trafic'], 0)
      g += K3.mini(u, 14 * u, 136 * u, 104 * u, '86', 'contacts') + K3.mini(u, 122 * u, 136 * u, 104 * u, '52', 'opt-in (relançables)')
      g += rect(14 * u, 184 * u, 10 * u, 10 * u, 2 * u, PRO.acc) + '<path d="M' + 16.5 * u + ',' + 189 * u + ' l2.5,2.5 l4,-5" stroke="#fff" stroke-width="' + 1.6 * u + '" fill="none"/>' + txt(30 * u, 193 * u, 'Opt-in seulement', 9 * u, { w: 700, fill: PRO.texte })
      var rows = [['M•••• D.', 'Quiz · gagnant'], ['S•••• L.', 'Roue'], ['A•••• B.', 'Quiz'], ['K•••• R.', 'Roue · gagnant']]
      rows.forEach(function (r, i) {
        var y = (204 + i * 30) * u, on = i < Math.round(sel * 4)
        g += rect(14 * u, y, 212 * u, 26 * u, 7 * u, on ? '#eef4ff' : '#fff', { stroke: on ? PRO.acc : PRO.bord, sw: u })
        g += rect(20 * u, y + 8 * u, 10 * u, 10 * u, 2 * u, on ? PRO.acc : '#fff', { stroke: on ? PRO.acc : PRO.bord, sw: u })
        g += txt(38 * u, y + 17 * u, r[0], 9.5 * u, { fill: PRO.texte }) + txt(100 * u, y + 17 * u, r[1], 8 * u, { w: 600, fill: PRO.mut })
        g += txt(218 * u, y + 17 * u, 'opt-in ✓', 7.5 * u, { anchor: 'end', fill: PRO.ok })
      })
      g += rect(14 * u, 330 * u, 128 * u, 30 * u, 15 * u, PRO.acc, { op: 0.6 + 0.4 * envoi }) + txt(78 * u, 349 * u, 'Envoyer un email', 10 * u, { anchor: 'middle', fill: '#fff' })
      if (envoi > 0.5) g += check(160 * u, 345 * u, 9 * u, PRO.ok)
      g += K3.illus(u, sw, 378 * u)
      return g
    }
  }
  // Tirage (components/pro/GagnantsClient.tsx) : étape 0 « Lancer le tirage »,
  // 1 « Gagnant proposé », 2 billet envoyé.
  K3.ecranTirage = function (etape, lot) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Gagnants & tirage', '')
      g += K3.onglets(u, 98 * u, ['CRM', 'Gagnants & tirage', 'Trafic'], 1)
      g += rect(14 * u, 128 * u, 212 * u, 220 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: u })
      g += txt(26 * u, 152 * u, 'Tirage au sort', 13 * u, { fill: PRO.texte })
      g += txt(26 * u, 170 * u, 'Lot : ' + lot, 9.5 * u, { w: 700, fill: PRO.mut })
      g += rect(26 * u, 184 * u, 120 * u, 30 * u, 15 * u, etape === 0 ? PRO.acc : '#c9d6f5') + txt(86 * u, 203 * u, 'Lancer le tirage', 10 * u, { anchor: 'middle', fill: '#fff' })
      if (etape >= 1) {
        g += txt(26 * u, 238 * u, 'GAGNANT PROPOSÉ', 7.5 * u, { fill: PRO.mut, ls: 0.6 * u })
        g += txt(26 * u, 258 * u, 'C•••• M.', 14 * u, { fill: PRO.texte })
        g += rect(26 * u, 272 * u, 188 * u, 30 * u, 15 * u, etape === 1 ? PRO.acc : PRO.ok) + txt(120 * u, 291 * u, etape === 1 ? 'Confirmer et envoyer le billet' : 'Billet envoyé', 9.5 * u, { anchor: 'middle', fill: '#fff' })
      }
      if (etape >= 2) g += check(200 * u, 252 * u, 10 * u, PRO.ok) + txt(26 * u, 330 * u, 'Le gagnant reçoit son billet par email.', 8.5 * u, { w: 700, fill: PRO.mut })
      return g
    }
  }
  // Statistiques (BlocsOperations, StatsUniformes) : camemberts Sexe,
  // Tranches d'âge, Codes postaux ; pic journalier ; parties par jour.
  K3.camembert = function (cx, cy, r, parts, cols, p) {
    var g = '', a = -Math.PI / 2, tot = 0
    parts.forEach(function (x) { tot += x })
    parts.forEach(function (x, i) {
      var d = x / tot * 2 * Math.PI * p, a2 = a + d
      if (d > 0.001) g += '<path d="M' + num(cx) + ',' + num(cy) + ' L' + num(cx + r * Math.cos(a)) + ',' + num(cy + r * Math.sin(a)) + ' A' + num(r) + ',' + num(r) + ' 0 ' + (d > Math.PI ? 1 : 0) + ' 1 ' + num(cx + r * Math.cos(a2)) + ',' + num(cy + r * Math.sin(a2)) + ' Z" fill="' + cols[i % cols.length] + '"/>'
      a = a2
    })
    return '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(r) + '" fill="#eee8f3"/>' + g + '<circle cx="' + num(cx) + '" cy="' + num(cy) + '" r="' + num(r * 0.45) + '" fill="#fff"/>'
  }
  K3.ecranStats = function (p, mode) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Trafic', 'Toute l’opération — toutes stations')
      var cols = [PRO.acc, PRO.acc2, PRO.or, '#7C3AED', '#E0218A']
      if (mode === 'jours') {
        g += K3.mini(u, 14 * u, 110 * u, 104 * u, 'sam. 12', 'pic journalier') + K3.mini(u, 122 * u, 110 * u, 104 * u, '18h', 'pic horaire')
        g += rect(14 * u, 160 * u, 212 * u, 190 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: u })
        g += txt(24 * u, 180 * u, 'Parties par jour', 10 * u, { fill: PRO.texte })
        var h = [0.35, 0.5, 0.42, 0.6, 0.78, 1, 0.7], j = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
        h.forEach(function (x, i) {
          var bh = 120 * u * x * F.easeOut(F.clamp(p * 1.5 - i * 0.08, 0, 1)), bx = (30 + i * 27) * u
          g += rect(bx, 320 * u - bh, 18 * u, bh, 4 * u, i === 5 ? PRO.acc : PRO.acc2) + txt(bx + 9 * u, 336 * u, j[i], 8 * u, { anchor: 'middle', fill: PRO.mut })
        })
      } else if (mode === 'cp') {
        g += rect(14 * u, 110 * u, 212 * u, 240 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: u })
        g += txt(24 * u, 132 * u, 'Codes postaux', 11 * u, { fill: PRO.texte })
        g += K3.camembert(120 * u, 205 * u, 52 * u, [45, 25, 18, 12], cols, p)
        ;[['Même commune', 0], ['Communes voisines', 1], ['Département', 2], ['Hors département', 3]].forEach(function (l, i) {
          var y = (282 + i * 16) * u
          g += rect(30 * u, y - 7 * u, 8 * u, 8 * u, 2 * u, cols[l[1]]) + txt(44 * u, y, l[0], 8.5 * u, { w: 700, fill: PRO.texte, op: F.clamp(p * 2 - i * 0.2, 0, 1) })
        })
      } else {
        g += rect(14 * u, 110 * u, 103 * u, 130 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: u }) + rect(123 * u, 110 * u, 103 * u, 130 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: u })
        g += txt(22 * u, 128 * u, 'Sexe', 9.5 * u, { fill: PRO.texte }) + txt(131 * u, 128 * u, 'Tranches d’âge', 9.5 * u, { fill: PRO.texte })
        g += K3.camembert(65 * u, 180 * u, 36 * u, [55, 45], [PRO.acc, '#E0218A'], p) + K3.camembert(174 * u, 180 * u, 36 * u, [20, 35, 28, 17], cols, p)
        g += txt(22 * u, 232 * u, 'Femme · Homme', 7.5 * u, { w: 700, fill: PRO.mut }) + txt(131 * u, 232 * u, '18-25 · 26-40 · 41-60…', 7.5 * u, { w: 700, fill: PRO.mut })
        g += rect(14 * u, 248 * u, 212 * u, 100 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: u })
        g += txt(22 * u, 266 * u, 'Codes postaux', 9.5 * u, { fill: PRO.texte })
        g += K3.camembert(60 * u, 306 * u, 30 * u, [45, 25, 18, 12], cols, p)
        g += txt(102 * u, 296 * u, 'D’où vient votre', 9 * u, { w: 700, fill: PRO.texte }) + txt(102 * u, 310 * u, 'public, commune', 9 * u, { w: 700, fill: PRO.texte }) + txt(102 * u, 324 * u, 'par commune.', 9 * u, { w: 700, fill: PRO.texte })
      }
      g += K3.illus(u, sw, 366 * u)
      return g
    }
  }
  // Réponses aux questions (ContenuReponses) : barres de résultats.
  K3.ecranResultats = function (p, titre, items, valeurs) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Réponses aux questions', 'En direct, à chaque partie.')
      g += rect(14 * u, 112 * u, 212 * u, 236 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: u })
      g += txt(24 * u, 136 * u, titre, 10.5 * u, { fill: PRO.texte })
      items.forEach(function (it, i) {
        var y = (160 + i * 44) * u, w = 190 * u * valeurs[i] * F.easeOut(F.clamp(p * 1.4 - i * 0.12, 0, 1))
        g += txt(24 * u, y + 10 * u, it, 9.5 * u, { w: 700, fill: PRO.texte })
        g += rect(24 * u, y + 17 * u, 190 * u, 10 * u, 5 * u, '#eee8f3') + rect(24 * u, y + 17 * u, w, 10 * u, 5 * u, i === 0 ? PRO.acc : PRO.acc2)
      })
      g += K3.illus(u, sw, 366 * u)
      return g
    }
  }

  /* ── Parcours de création (components/creation/ParcoursCreation.tsx) ── */
  K3.etapes = function (u, actif) {
    var noms = ['Votre animation', 'Jeu', 'Lots', 'Diffusion & QR'], g = '', x = 10 * u, y = 108 * u
    noms.forEach(function (n, k) {
      var w = (n.length * 4.6 + 22) * u, on = k === actif, fait = k < actif
      g += rect(x, y, w, 18 * u, 9 * u, on ? PRO.acc : '#fff', { stroke: on ? PRO.acc : PRO.bord, sw: 1.2 * u })
      g += '<circle cx="' + num(x + 9 * u) + '" cy="' + num(y + 9 * u) + '" r="' + num(5.5 * u) + '" fill="' + (on ? 'rgba(255,255,255,.3)' : fait ? '#16a34a' : PRO.bord) + '"/>' + txt(x + 9 * u, y + 11.5 * u, String(k + 1), 6.5 * u, { anchor: 'middle', fill: '#fff' })
      g += txt(x + 17 * u, y + 12.5 * u, n, 7 * u, { fill: on ? '#fff' : fait ? '#16a34a' : PRO.mut })
      x += w + 3 * u
    })
    return g
  }
  // Étape 0 « Que voulez-vous faire ? » ; hl = carte « Créer une animation » choisie.
  K3.ecranChoix = function (hl) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Que voulez-vous faire ?', 'Quatre étapes, avec le jeu tel que vos clients le verront.')
      var cartes = [['Créer une animation', 'Chez vous : un jeu, vos lots, gain', 'immédiat ou tirage au sort.', PRO.acc, 'Commencer'], ['Rejoindre un super event', 'Devenez une station d’un festival', 'ou d’une opération de commerçants.', '#F97316', 'Voir la carte'], ['Proposer un super event', 'Flowin la crée avec vous.', '', '#F97316', 'Demander à Flowin']]
      cartes.forEach(function (c, i) {
        var y = (116 + i * 84) * u, on = i === 0 ? hl : 0
        g += rect(14 * u, y, 212 * u, 76 * u, 14 * u, '#fff', { stroke: on > 0.5 ? c[3] : PRO.bord, sw: (1.2 + 1.2 * on) * u })
        g += '<circle cx="' + num(38 * u) + '" cy="' + num(y + 28 * u) + '" r="' + num(15 * u) + '" fill="' + c[3] + '" opacity="' + (0.15 + 0.85 * on).toFixed(2) + '"/>'
        g += txt(62 * u, y + 24 * u, c[0], 11 * u, { fill: PRO.texte }) + txt(62 * u, y + 38 * u, c[1], 7.5 * u, { w: 600, fill: PRO.mut }) + txt(62 * u, y + 49 * u, c[2], 7.5 * u, { w: 600, fill: PRO.mut })
        g += txt(62 * u, y + 66 * u, c[4] + ' →', 8.5 * u, { fill: c[3] })
      })
      return g
    }
  }
  // Étape 2 « Quel jeu ? ».
  K3.ecranJeu = function (sel) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Créer une animation', '') + K3.etapes(u, 1)
      g += txt(14 * u, 150 * u, 'Quel jeu ?', 14 * u, { fill: PRO.texte })
      var jeux = [['Quiz + bonus — marque blanche', 'Questions à choix multiple, bonus', 'quiz'], ['Roue de la fortune', 'Tirage instantané, segments = lots', 'roue'], ['Tombola', 'Inscription + grand tirage', 'tombola'], ['Vote', 'Vote produits / artistes', 'vote']]
      jeux.forEach(function (j, i) {
        var y = (162 + i * 48) * u, on = i === sel
        g += rect(14 * u, y, 212 * u, 42 * u, 12 * u, on ? '#eef4ff' : '#fff', { stroke: on ? PRO.acc : PRO.bord, sw: (on ? 2 : 1.2) * u })
        g += K3.at(34 * u, y + 21 * u, 0.5 * u, K.icone(j[2], 0, 0))
        g += txt(56 * u, y + 18 * u, j[0], 9.5 * u, { fill: PRO.texte }) + txt(56 * u, y + 31 * u, j[1], 7 * u, { w: 600, fill: PRO.mut })
        if (on) g += check(212 * u, y + 21 * u, 7 * u, PRO.acc)
      })
      g += rect(130 * u, 360 * u, 96 * u, 26 * u, 13 * u, PRO.acc) + txt(178 * u, 377 * u, 'Suivant →', 9.5 * u, { anchor: 'middle', fill: '#fff' })
      return g
    }
  }
  // Étape 3 « Vos lots » : nom, quantité, valeur, tirage / gain immédiat, conditions.
  K3.ecranLots = function (p) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Créer une animation', '') + K3.etapes(u, 2)
      g += txt(14 * u, 150 * u, 'Vos lots', 14 * u, { fill: PRO.texte })
      g += txt(14 * u, 164 * u, 'Quantité, valeur et conditions.', 8 * u, { w: 600, fill: PRO.mut })
      var champ = function (y, l, v, k) {
        var t = v.slice(0, Math.round(v.length * F.clamp(p * 2.2 - k * 0.45, 0, 1)))
        return txt(14 * u, y, l, 7.5 * u, { fill: PRO.mut }) + rect(14 * u, y + 4 * u, 212 * u, 24 * u, 7 * u, '#faf7fd', { stroke: PRO.bord, sw: u }) + txt(22 * u, y + 20 * u, t, 9.5 * u, { w: 700, fill: PRO.texte })
      }
      g += champ(184 * u, 'NOM DU LOT', 'Bouquet de saison', 0)
      g += txt(14 * u, 230 * u, 'QUANTITÉ', 7.5 * u, { fill: PRO.mut }) + rect(14 * u, 234 * u, 100 * u, 24 * u, 7 * u, '#faf7fd', { stroke: PRO.bord, sw: u }) + txt(22 * u, 250 * u, p > 0.3 ? '5' : '', 9.5 * u, { fill: PRO.texte })
      g += txt(126 * u, 230 * u, 'VALEUR (€)', 7.5 * u, { fill: PRO.mut }) + rect(126 * u, 234 * u, 100 * u, 24 * u, 7 * u, '#faf7fd', { stroke: PRO.bord, sw: u }) + txt(134 * u, 250 * u, p > 0.4 ? '30' : '', 9.5 * u, { fill: PRO.texte })
      var gi = p > 0.55
      g += rect(14 * u, 268 * u, 104 * u, 22 * u, 11 * u, gi ? '#fff' : PRO.acc, { stroke: PRO.acc, sw: u }) + txt(66 * u, 283 * u, 'Tirage au sort', 8.5 * u, { anchor: 'middle', fill: gi ? PRO.acc : '#fff' })
      g += rect(122 * u, 268 * u, 104 * u, 22 * u, 11 * u, gi ? PRO.acc : '#fff', { stroke: PRO.acc, sw: u }) + txt(174 * u, 283 * u, 'Gain immédiat', 8.5 * u, { anchor: 'middle', fill: gi ? '#fff' : PRO.acc })
      g += champ(304 * u, 'CONDITIONS', 'Dès 20 € d’achat, jusqu’au 30/09', 1.2)
      g += rect(130 * u, 360 * u, 96 * u, 26 * u, 13 * u, PRO.acc) + txt(178 * u, 377 * u, 'Suivant →', 9.5 * u, { anchor: 'middle', fill: '#fff' })
      return g
    }
  }
  // Fin : « Le jeu est en ligne : 3 QR, un par usage » + Affiche A4.
  K3.ecranQRs = function (p) {
    return function (sw, sh) {
      var u = sw / 240, g = K3.proFond(sw, sh, u, 'Animation créée', 'En attente de validation par Flowin avant mise en ligne.') + K3.etapes(u, 4)
      g += txt(14 * u, 150 * u, 'Le jeu est en ligne :', 12 * u, { fill: PRO.texte }) + txt(14 * u, 165 * u, '3 QR, un par usage', 12 * u, { fill: PRO.texte })
      ;[['En magasin', 'À imprimer, à afficher'], ['Réseaux sociaux', 'Lien pour vos posts'], ['Tracking', 'Un support précis']].forEach(function (t, i) {
        var y = (178 + i * 64) * u, q = F.easeOut(F.clamp(p * 2 - i * 0.3, 0, 1))
        g += rect(14 * u, y, 212 * u, 58 * u, 12 * u, '#fff', { stroke: PRO.bord, sw: 1.2 * u })
        g += K3.op(q, F.qr(24 * u, y + 9 * u, 40 * u))
        g += txt(78 * u, y + 24 * u, t[0], 10.5 * u, { fill: PRO.texte }) + txt(78 * u, y + 38 * u, t[1], 7.5 * u, { w: 600, fill: PRO.mut })
        if (i === 0) g += rect(160 * u, y + 32 * u, 58 * u, 18 * u, 9 * u, '#fff', { stroke: PRO.bord, sw: u }) + txt(189 * u, y + 44 * u, 'Affiche A4', 7.5 * u, { anchor: 'middle', fill: PRO.texte })
      })
      return g
    }
  }

  /* ── Graphismes ────────────────────────────────────────────────────── */
  // Jauge qui monte (sans chiffre : illustration de tendance).
  K3.jauge = function (x, y, w, h, p, label, col) {
    var hh = h * p
    return rect(x, y, w, h, w / 2, '#fff', { op: 0.6 }) + rect(x, y + h - hh, w, hh, w / 2, col || INK) +
      '<path d="M' + num(x + w / 2 - 14) + ',' + num(y + h - hh - 14) + ' L' + num(x + w / 2) + ',' + num(y + h - hh - 32) + ' L' + num(x + w / 2 + 14) + ',' + num(y + h - hh - 14) + '" stroke="' + (col || INK) + '" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="' + F.clamp(p * 3, 0, 1).toFixed(2) + '"/>' +
      '<text class="safe" x="' + num(x + w / 2) + '" y="' + num(y + h + 34) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="22" fill="' + INK + '">' + F.esc(label) + '</text>'
  }
  // Carte de lot (blanche) avec icône.
  K3.lot = function (x, y, w, titre, sous, icone, p) {
    if (p <= 0) return ''
    var h = sous ? 96 : 80
    return '<g opacity="' + Math.min(1, p).toFixed(3) + '" transform="translate(' + num(x + (1 - p) * 40) + ',' + num(y) + ')">' + rect(4, 6, w, h, 16, 'rgba(0,0,0,.12)') + rect(0, 0, w, h, 16, '#fff') + K3.icone(icone, 44, h / 2) +
      '<text class="safe" x="86" y="' + (sous ? 40 : 49) + '" font-family="Manrope" font-weight="800" font-size="22" fill="' + INK + '">' + F.esc(titre) + '</text>' +
      (sous ? '<text class="safe" x="86" y="68" font-family="Manrope" font-weight="700" font-size="16" fill="#6b6174">' + F.esc(sous) + '</text>' : '') + '</g>'
  }
  // Post réseau social (carré) : nom de la boutique, visuel, QR tracé.
  K3.post = function (x, y, w, nom, rot) {
    var h = w * 1.3, g = '<g transform="translate(' + num(x) + ',' + num(y) + ') rotate(' + (rot || 0) + ')">' + rect(-w / 2 + 5, -h / 2 + 8, w, h, 14, 'rgba(0,0,0,.18)') + rect(-w / 2, -h / 2, w, h, 14, '#fff')
    g += '<circle cx="' + num(-w / 2 + 22) + '" cy="' + num(-h / 2 + 22) + '" r="11" fill="' + MAG + '"/>' + txt(-w / 2 + 40, -h / 2 + 27, nom, 13, {})
    g += rect(-w / 2 + 10, -h / 2 + 42, w - 20, w - 20, 8, P.rose)
    g += txt(0, -h / 2 + 42 + (w - 20) * 0.32, 'JEU GRATUIT', w * 0.1, { anchor: 'middle', ls: -0.5 }) + txt(0, -h / 2 + 42 + (w - 20) * 0.46, 'cette semaine !', w * 0.07, { anchor: 'middle', w: 700 })
    g += F.qr(-w * 0.16, -h / 2 + 42 + (w - 20) * 0.55, w * 0.32)
    g += txt(-w / 2 + 12, h / 2 - 16, '♥  ✉  ↗', 15, { fill: INK })
    return g + '</g>'
  }
  // Calendrier (feuille) avec un libellé.
  K3.calendrier = function (x, y, w, mois, jour, label, p) {
    var h = w * 1.05
    return '<g opacity="' + p.toFixed(3) + '" transform="translate(' + num(x) + ',' + num(y + (1 - p) * 30) + ')">' + rect(4, 6, w, h, 12, 'rgba(0,0,0,.14)') + rect(0, 0, w, h, 12, '#fff') + rect(0, 0, w, h * 0.26, 12, MAG) + rect(0, h * 0.14, w, h * 0.12, 0, MAG) +
      txt(w / 2, h * 0.19, mois, w * 0.15, { anchor: 'middle', fill: '#fff' }) + txt(w / 2, h * 0.66, jour, w * 0.36, { anchor: 'middle', ls: -2 }) +
      '<text class="safe" x="' + num(w / 2) + '" y="' + num(h * 0.9) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + num(w * 0.105) + '" fill="#6b6174">' + F.esc(label) + '</text></g>'
  }
  // Logo sponsor générique (placeholder, aucune vraie marque).
  K3.marque = function (x, y, w, col) {
    var h = w * 0.42
    return '<g transform="translate(' + num(x) + ',' + num(y) + ')">' + rect(-w / 2, -h / 2, w, h, h * 0.2, '#fff', { stroke: col || MAG, sw: 3 }) +
      '<circle cx="' + num(-w * 0.32) + '" cy="0" r="' + num(h * 0.26) + '" fill="' + (col || MAG) + '"/>' + txt(w * 0.13, h * 0.1, 'VOTRE MARQUE', w * 0.072, { anchor: 'middle', fill: col || MAG }) + '</g>'
  }
  // Pastille de rue / commerce sur un plan (cercle + icône), allumée p.
  K3.point = function (x, y, p, icone) {
    var s = 0.7 + 0.3 * p
    return '<g transform="translate(' + num(x) + ',' + num(y) + ') scale(' + s.toFixed(3) + ')">' + (p > 0 ? '<circle r="36" fill="' + MAG + '" opacity="' + (0.2 * p).toFixed(3) + '"/>' : '') +
      '<circle r="26" fill="' + (p > 0.5 ? '#fff' : 'rgba(255,255,255,.5)') + '" stroke="' + (p > 0.5 ? MAG : INK) + '" stroke-width="3"/>' + K3.at(0, 0, 0.62, K3.icone(icone || 'boutique', 0, 0)) + '</g>'
  }
  // Assemble un film à partir de FILMS (textes validés) et des dessins :
  // durées = écarts entre les temps de début ; texte écran et voix off repris
  // tels quels, sauf `ecran` surchargé (écart signalé dans `ecart`).
  K3.film = function (id, o) {
    var f = window.FILMS.filter(function (x) { return x.id === id })[0]
    var E = (window.ECARTS || {})[id] || {}
    var scenes = f.s.map(function (s, i) {
      var d = o.scenes[i] || {}, e = E[i] || {}, fin = i + 1 < f.s.length ? f.s[i + 1][0] : f.dur
      var ecran = e.ecran || s[3], parts = ecran.split(' · ')
      return {
        label: s[1], desc: s[2], ecran: ecran, vo: e.vo || s[4], ecart: e.pourquoi || '', dur: +(fin - s[0]).toFixed(2),
        caption: ecran, bg: d.bg, from: d.from, mots: d.mots, max: d.max, y0: d.y0,
        petit: d.petit !== undefined ? d.petit : (parts[1] ? [parts[1]] : null), petitSize: d.petitSize, draw: d.draw
      }
    })
    return { id: id, titre: f.title, sous: f.lede, film: f, end: { mode: 'qr' }, ring: o.ring || INK, scenes: scenes }
  }
  // Icônes supplémentaires (lots indicatifs fournis par le client).
  K3.icone = function (k, x, y) {
    if (k === 'vip') return '<g transform="translate(' + x + ',' + y + ')"><rect x="-30" y="-20" width="60" height="40" rx="8" fill="' + INK + '"/><text y="8" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="20" fill="' + C.gold + '">VIP</text><path d="M-30,-6 L30,-6" stroke="' + C.gold + '" stroke-width="2" opacity=".5"/></g>'
    if (k === 'soin') return '<g transform="translate(' + x + ',' + y + ')"><rect x="-10" y="-26" width="20" height="10" rx="2" fill="' + INK + '"/><rect x="-16" y="-16" width="32" height="42" rx="8" fill="' + C.teal + '"/><rect x="-10" y="-2" width="20" height="12" rx="3" fill="#fff"/></g>'
    if (k === 'massage') return '<g transform="translate(' + x + ',' + y + ')"><ellipse cx="0" cy="12" rx="28" ry="10" fill="' + C.lilac + '"/><circle cx="-12" cy="-4" r="9" fill="' + C.mag + '"/><circle cx="6" cy="-10" r="11" fill="' + C.gold + '"/><circle cx="18" cy="2" r="7" fill="' + C.teal + '"/></g>'
    if (k === 'remise') return '<g transform="translate(' + x + ',' + y + ') rotate(-8)"><path d="M-28,-18 L18,-18 L30,0 L18,18 L-28,18 Z" fill="' + C.mag + '"/><circle cx="16" cy="0" r="4" fill="#fff"/><text x="-6" y="7" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" fill="#fff">%</text></g>'
    if (k === 'fleur') { var g = '<g transform="translate(' + x + ',' + y + ')"><path d="M0,4 L0,28" stroke="' + C.teal + '" stroke-width="4"/>'; for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; g += '<circle cx="' + (10 * Math.cos(a)).toFixed(1) + '" cy="' + (-6 + 10 * Math.sin(a)).toFixed(1) + '" r="8" fill="' + C.mag + '"/>' } return g + '<circle cx="0" cy="-6" r="6" fill="' + C.gold + '"/></g>' }
    if (k === 'pain') return '<g transform="translate(' + x + ',' + y + ') rotate(-20)"><ellipse rx="30" ry="12" fill="#D9A25F"/><path d="M-14,-6 L-8,6 M0,-8 L6,6 M12,-6 L18,4" stroke="#fff" stroke-width="3" opacity=".7"/></g>'
    if (k === 'livre') return '<g transform="translate(' + x + ',' + y + ')"><rect x="-24" y="-18" width="22" height="36" rx="3" fill="' + C.violet + '"/><rect x="2" y="-18" width="22" height="36" rx="3" fill="' + C.mag + '"/><path d="M0,-18 L0,18" stroke="' + INK + '" stroke-width="3"/></g>'
    return K.icone(k, x, y)
  }
  window.K3 = K3
})()
