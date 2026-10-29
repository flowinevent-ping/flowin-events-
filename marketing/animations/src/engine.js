/* Moteur commun des animations Flowin : dessin SVG 540 x 960, rendu
   deterministe render(t), lecteur, mode #record. Aucune ressource externe. */
(function () {
  'use strict'
  var NS = 'http://www.w3.org/2000/svg'
  var W = 540, H = 960
  /* Zones sures TikTok / Reels / Facebook : aucun texte dans les 10 % du haut,
     les 20 % du bas ni les 15 % de droite (interface des applis par-dessus). */
  var SAFE = { x0: 20, x1: 459, y0: 96, y1: 768 }
  /* Voile bas : tout ce qui passe dessous est masque (opaque des VEIL_FULL). */
  var VEIL_Y = 738, VEIL_FULL = 786

  var COL = {
    ink: '#1B3A5C', blue: '#3B5CC4', teal: '#00B4A0', orange: '#E85D04', amber: '#F59E0B',
    violet: '#7C5CC4', d1: '#13314f', d2: '#0E1B30', d3: '#0A1C32',
    jeu1: '#2a1036', jeu2: '#160820', magenta: '#E0218A', prune: '#7C2D92',
    pro: '#2563EB', proFond: '#f2edf7', proTexte: '#1c1024', proMut: '#8a7e93', proBord: '#efe9f2',
    rj: '#C2410C', rj2: '#FF8A14'
  }

  function E(tag, a, p) {
    var n = document.createElementNS(NS, tag)
    if (a) for (var k in a) if (a[k] !== null && a[k] !== undefined) n.setAttribute(k, a[k])
    if (p) p.appendChild(n)
    return n
  }
  function clamp(v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.max(a, Math.min(b, v)) }
  function lerp(a, b, p) { return a + (b - a) * p }
  function easeOut(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3) }
  function easeInOut(x) { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
  function prog(t, a, d) { return clamp((t - a) / d) }
  function pop(t, a) { var p = prog(t, a, 0.45); return p <= 0 ? 0 : p >= 1 ? 1 : 1 + 0.12 * Math.sin(p * Math.PI) * (1 - p) * 3 - 0.0 }

  var warnings = []
  var veilOn = false
  function gid() { return 'u' + (uid++) }
  /* Voile bas (couleur du fond) : masque le bas du telephone, sous lequel
     passent les boutons et pseudos de TikTok / Reels. */
  function veil(g, col) {
    veilOn = true
    var id = 'v' + (uid++)
    var lg = E('linearGradient', { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs)
    E('stop', { offset: 0, 'stop-color': col, 'stop-opacity': 0 }, lg)
    E('stop', { offset: 1, 'stop-color': col, 'stop-opacity': 1 }, lg)
    R(g, 0, VEIL_Y, W, VEIL_FULL - VEIL_Y, 0, 'url(#' + id + ')')
    R(g, 0, VEIL_FULL - 0.5, W, H - VEIL_FULL + 1, 0, col)
  }
  var defs = null, uid = 0

  /* Texte : maxW reduit la taille jusqu a tenir. Toute reduction forte est
     signalee (window.__warnings) pour la relecture avant export. */
  function T(p, x, y, str, o) {
    o = o || {}
    var size = o.size || 14
    var n = E('text', {
      x: x, y: y, 'font-family': 'Manrope, sans-serif', 'font-size': size, 'font-weight': o.w || 700,
      fill: o.fill || '#fff', 'text-anchor': o.anchor || 'start', opacity: o.op, 'letter-spacing': o.ls
    }, p)
    n.textContent = str
    if (o.maxW) {
      var s = size
      while (n.getComputedTextLength() > o.maxW && s > 6) { s -= 0.5; n.setAttribute('font-size', s) }
      if (s < size * 0.86) warnings.push('texte reduit a ' + Math.round(s / size * 100) + '% : ' + str)
    }
    return n
  }
  function R(p, x, y, w, h, r, fill, extra) {
    var a = { x: x, y: y, width: w, height: h, rx: r || 0, fill: fill || '#fff' }
    if (extra) for (var k in extra) a[k] = extra[k]
    return E('rect', a, p)
  }
  function C(p, cx, cy, r, fill, extra) {
    var a = { cx: cx, cy: cy, r: r, fill: fill }
    if (extra) for (var k in extra) a[k] = extra[k]
    return E('circle', a, p)
  }
  function P(p, d, fill, extra) {
    var a = { d: d, fill: fill || 'none' }
    if (extra) for (var k in extra) a[k] = extra[k]
    return E('path', a, p)
  }
  function G(p, tr, op) { return E('g', { transform: tr || null, opacity: op === undefined ? null : op }, p) }
  function grad(id, stops, x2, y2) {
    var g = E('linearGradient', { id: id, x1: 0, y1: 0, x2: x2 === undefined ? 0 : x2, y2: y2 === undefined ? 1 : y2 }, defs)
    stops.forEach(function (s) { E('stop', { offset: s[0], 'stop-color': s[1] }, g) })
    return 'url(#' + id + ')'
  }
  function clip(drawShape) {
    var id = 'c' + (uid++)
    var cp = E('clipPath', { id: id }, defs)
    drawShape(cp)
    return 'url(#' + id + ')'
  }

  /* ---------- Briques d interface (ecrans des telephones) ---------- */
  function statusBar(g, w, dark) {
    var f = dark ? 'rgba(255,255,255,.85)' : '#1c1024'
    T(g, 18, 20, '17:42', { size: 11, w: 800, fill: f })
    R(g, w - 40, 11, 20, 10, 3, 'none', { stroke: f, 'stroke-width': 1.4 })
    R(g, w - 38, 13, 14, 6, 1.5, f)
    for (var i = 0; i < 3; i++) R(g, w - 62 + i * 5, 17 - i * 3, 3, 4 + i * 3, 1, f)
  }
  function btn(g, x, y, w, h, label, o) {
    o = o || {}
    var fill = o.fill || grad('b' + (uid++), [[0, COL.prune], [1, COL.magenta]], 1, 0)
    R(g, x, y, w, h, h / 2, fill, o.stroke ? { stroke: o.stroke, 'stroke-width': 1.4 } : null)
    T(g, x + w / 2, y + h / 2 + (o.size || 14) * 0.36, label, { size: o.size || 14, w: 800, fill: o.color || '#fff', anchor: 'middle', maxW: w - 24 })
  }
  function tap(g, x, y, t, at) {
    var p = prog(t, at, 0.6)
    if (p <= 0 || p >= 1) return
    C(g, x, y, 10 + 26 * p, 'none', { stroke: '#fff', 'stroke-width': 3, opacity: 1 - p })
    C(g, x, y, 9, 'rgba(255,255,255,.75)', { opacity: 1 - p })
  }
  function check(g, cx, cy, r, col) {
    C(g, cx, cy, r, col || COL.teal)
    P(g, 'M' + (cx - r * 0.45) + ' ' + cy + ' L' + (cx - r * 0.1) + ' ' + (cy + r * 0.38) + ' L' + (cx + r * 0.5) + ' ' + (cy - r * 0.35), 'none', { stroke: '#fff', 'stroke-width': r * 0.28, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
  }
  function qrIcon(g, x, y, s, col) {
    col = col || '#1c1024'
    var m = s / 7
    ;[[0, 0], [4, 0], [0, 4]].forEach(function (q) {
      R(g, x + q[0] * m, y + q[1] * m, 3 * m, 3 * m, m * 0.4, 'none', { stroke: col, 'stroke-width': m * 0.7 })
      R(g, x + (q[0] + 1) * m, y + (q[1] + 1) * m, m, m, 0, col)
    })
    ;[[4, 4], [5.5, 4.2], [4.3, 5.6], [6, 6], [5, 5]].forEach(function (q) { R(g, x + q[0] * m, y + q[1] * m, m * 0.9, m * 0.9, 0, col) })
  }

  /* Telephone : coque, ecran clippe, encoche. draw(g, w, h). */
  function phone(p, x, y, w, h, draw) {
    var g = G(p, 'translate(' + x + ',' + y + ')')
    R(g, -4, 8, w + 8, h + 4, 38, 'rgba(10,20,40,.18)')
    R(g, 0, 0, w, h, 36, '#0B0B12')
    R(g, 4, 4, w - 8, h - 8, 32, '#22222e')
    var sx = 10, sy = 10, sw = w - 20, sh = h - 20
    var cl = clip(function (cp) { R(cp, sx, sy, sw, sh, 26, '#fff') })
    var holder = E('g', { 'clip-path': cl }, g)
    var sg = G(holder, 'translate(' + sx + ',' + sy + ')')
    draw(sg, sw, sh)
    R(g, w / 2 - 42, 16, 84, 20, 10, '#0B0B12')
    return g
  }

  /* ---------- Personnages (vectoriel plat) ----------
     spec : { skin, hair, hairStyle: 'bun' | 'short' | 'ponytail', shirt, shirt2 }
     Coiffures volontairement degagees du visage : le dessus du crane
     seulement, jamais de masse qui encadre le visage. */
  function person(p, cx, by, s, spec, pose, t, o) {
    o = o || {}
    var g = G(p, 'translate(' + cx + ',' + by + ') scale(' + (o.flip ? -s : s) + ',' + s + ')')
    var bob = Math.sin((t || 0) * 2.2 + (o.phase || 0)) * 2
    var hg = G(g, 'translate(0,' + bob.toFixed(2) + ')')
    var skin = spec.skin, hair = spec.hair
    // bras arriere (au repos, cote gauche)
    function arm(pts, sleeveCol) {
      var d = 'M' + pts.map(function (q) { return q[0] + ' ' + q[1] }).join(' L')
      P(g, d, 'none', { stroke: sleeveCol, 'stroke-width': 22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
      var e = pts[pts.length - 1]
      C(g, e[0], e[1], 11, skin)
    }
    // torse
    P(g, 'M-62 0 L-62 -78 Q-62 -112 -28 -112 L28 -112 Q62 -112 62 -78 L62 0 Z', spec.shirt)
    if (spec.shirt2) P(g, 'M-14 -112 L0 -86 L14 -112 Z', spec.shirt2)
    R(g, -12, -134, 24, 26, 8, skin)
    // queue de cheval : derriere la tete, d un seul cote
    if (spec.hairStyle === 'ponytail') {
      E('ellipse', { cx: 54, cy: -196, rx: 12, ry: 27, fill: hair, transform: 'rotate(52 54 -196)' }, hg)
      C(hg, 36, -204, 9, spec.tie || COL.orange)
    }
    if (spec.hairStyle === 'bun') C(hg, 0, -222, 18, hair)
    C(hg, -40, -166, 8, skin); C(hg, 40, -166, 8, skin)
    C(hg, 0, -170, 40, skin)
    // calotte : s arrete au-dessus des oreilles, front degage
    var cap = spec.hairStyle === 'short'
      ? 'M-41 -176 Q-44 -218 0 -217 Q44 -218 41 -176 Q36 -196 14 -198 Q-6 -186 -28 -194 Q-38 -190 -41 -176 Z'
      : 'M-41 -174 Q-44 -216 0 -216 Q44 -216 41 -174 Q32 -197 0 -198 Q-32 -197 -41 -174 Z'
    P(hg, cap, hair)
    // visage
    var blink = (Math.floor(((t || 0) + (o.phase || 0)) * 10) % 37) === 0
    if (blink) {
      P(hg, 'M-19 -168 L-9 -168 M9 -168 L19 -168', 'none', { stroke: '#1a1020', 'stroke-width': 2.6, 'stroke-linecap': 'round' })
    } else { C(hg, -14, -168, 4.4, '#1a1020'); C(hg, 14, -168, 4.4, '#1a1020') }
    P(hg, 'M-21 -182 Q-14 -186 -7 -182 M7 -182 Q14 -186 21 -182', 'none', { stroke: hair, 'stroke-width': 3, 'stroke-linecap': 'round' })
    var smile = o.happy ? 'M-14 -152 Q0 -138 14 -152' : 'M-11 -151 Q0 -144 11 -151'
    P(hg, smile, 'none', { stroke: '#1a1020', 'stroke-width': 3, 'stroke-linecap': 'round' })
    C(hg, -24, -156, 5, 'rgba(255,120,120,.25)'); C(hg, 24, -156, 5, 'rgba(255,120,120,.25)')
    // bras gauche au repos
    arm([[-54, -96], [-70, -52], [-66, -14]], spec.shirt)
    // bras droit selon la pose
    var sh = spec.shirt
    if (pose === 'phone') {
      arm([[54, -96], [72, -50], [34, -74]], sh)
      R(g, 12, -126, 36, 60, 7, '#14141c'); R(g, 15, -123, 30, 54, 5, '#2b2b3a')
      C(g, 34, -74, 11, skin)
    } else if (pose === 'scan') {
      arm([[54, -96], [96, -118], [124, -136]], sh)
      R(g, 112, -192, 34, 58, 7, '#14141c'); C(g, 129, -182, 3, '#55556a')
      C(g, 126, -138, 11, skin)
    } else if (pose === 'wave') {
      var a = Math.sin((t || 0) * 7) * 8
      arm([[54, -96], [82, -146], [82 + a, -196]], sh)
    } else if (pose === 'give') {
      arm([[54, -96], [96, -92], [136, -98]], sh)
      if (o.item === 'billet') {
        R(g, 122, -150, 58, 40, 6, '#fff', { stroke: COL.magenta, 'stroke-width': 3 })
        R(g, 130, -140, 26, 5, 2, COL.magenta); R(g, 130, -130, 40, 4, 2, '#c9bcd6'); R(g, 130, -122, 32, 4, 2, '#c9bcd6')
      }
      if (o.item === 'phoneOut') {
        R(g, 118, -166, 40, 66, 7, '#14141c'); R(g, 121, -163, 34, 60, 5, grad('po' + (uid++), [[0, COL.prune], [1, COL.magenta]]))
        R(g, 127, -142, 22, 14, 3, '#fff')
      }
      C(g, 136, -98, 11, skin)
    } else if (pose === 'point') {
      arm([[54, -96], [100, -108], [140, -122]], sh)
      P(g, 'M140 -122 L156 -130', 'none', { stroke: skin, 'stroke-width': 7, 'stroke-linecap': 'round' })
    } else {
      arm([[54, -96], [70, -52], [66, -14]], sh)
    }
    return g
  }

  /* ---------- Decors ---------- */
  function garland(g, y, t) {
    P(g, 'M-10 ' + y + ' Q270 ' + (y + 40) + ' 550 ' + y, 'none', { stroke: '#7a6a5a', 'stroke-width': 2 })
    var cols = [COL.orange, COL.teal, COL.blue, COL.amber, COL.violet, COL.magenta]
    for (var i = 0; i < 12; i++) {
      var x = 10 + i * 46, u = x / 540, yy = y + 4 * 40 * u * (1 - u) * 1 + 2
      var sw = Math.sin(t * 2 + i) * 2
      P(g, 'M' + (x - 11) + ' ' + yy + ' L' + (x + 11) + ' ' + yy + ' L' + (x + sw) + ' ' + (yy + 24) + ' Z', cols[i % cols.length])
    }
  }
  function bgFete(g, t) {
    R(g, 0, 0, W, H, 0, grad('sky' + (uid++), [[0, '#BFE3F8'], [1, '#F2F9FF']]))
    C(g, 440, 250, 46, '#FFE7A8', { opacity: 0.9 })
    P(g, 'M0 560 Q120 500 240 548 Q360 500 540 540 L540 620 L0 620 Z', '#9BC7A4')
    R(g, 0, 590, W, 70, 0, '#7FC4E8')
    for (var i = 0; i < 5; i++) R(g, 40 + i * 110 + Math.sin(t + i) * 6, 612 + (i % 2) * 18, 46, 3, 2, 'rgba(255,255,255,.7)')
    R(g, 0, 655, W, H - 655, 0, '#EADFC8')
    garland(g, 190, t)
  }
  /* Stand : enseigne au-dessus de l auvent ; behind() dessine ce qui se
     trouve derriere le comptoir (le commercant). */
  function stand(g, x, y, w, title, col, behind, fs) {
    var stripes = 6
    R(g, x + 6, y - 6, 8, 280, 2, '#b08968'); R(g, x + w - 14, y - 6, 8, 280, 2, '#b08968')
    R(g, x + 8, y - 54, w - 16, 42, 10, '#fff', { stroke: col, 'stroke-width': 2.5 })
    T(g, x + w / 2, y - 27, title, { size: fs || 15, w: 800, fill: COL.ink, anchor: 'middle', maxW: w - 34 })
    for (var i = 0; i < stripes; i++) R(g, x + i * w / stripes, y, w / stripes, 46, 0, i % 2 ? '#fff' : col)
    for (var j = 0; j < stripes; j++) C(g, x + (j + 0.5) * w / stripes, y + 46, w / stripes / 2, j % 2 ? '#fff' : col)
    if (behind) behind()
    R(g, x - 8, y + 190, w + 16, 100, 8, '#d9b38c'); R(g, x - 8, y + 190, w + 16, 14, 6, '#c69c72')
  }
  function qrPanel(g, x, y, s) {
    R(g, x, y, s, s * 1.32, 10, '#fff', { stroke: COL.ink, 'stroke-width': 2 })
    T(g, x + s / 2, y + 20, 'STATION', { size: 11, w: 800, fill: COL.magenta, anchor: 'middle', ls: 1.5 })
    qrIcon(g, x + s * 0.18, y + 30, s * 0.64, COL.ink)
    T(g, x + s / 2, y + s * 1.2, 'Fête du Lac', { size: 11.5, w: 800, fill: COL.ink, anchor: 'middle', maxW: s - 12 })
  }
  function bgSoft(g, theme) {
    var th = {
      jeu: [[0, '#3a1650'], [1, '#170a22']],
      pro: [[0, '#E9EEFB'], [1, '#F6F2FA']],
      rj: [[0, '#FFE9D6'], [1, '#FFF7EF']],
      nuit: [[0, COL.d1], [1, COL.d2]]
    }[theme]
    R(g, 0, 0, W, H, 0, grad('soft' + (uid++), th))
    var c = theme === 'jeu' ? 'rgba(224,33,138,.10)' : theme === 'pro' ? 'rgba(37,99,235,.08)' : theme === 'rj' ? 'rgba(232,93,4,.08)' : 'rgba(59,92,196,.18)'
    C(g, 470, 330, 160, c); C(g, 60, 820, 190, c)
  }
  function bgBureau(g) {
    R(g, 0, 0, W, H, 0, '#EEF2FA')
    R(g, 300, 210, 190, 170, 10, '#CFE4F7', { stroke: '#fff', 'stroke-width': 8 })
    R(g, 393, 210, 4, 170, 0, '#fff'); R(g, 300, 293, 190, 4, 0, '#fff')
    R(g, 0, 700, W, 260, 0, '#DCD3C4')
    R(g, 60, 640, 420, 26, 8, '#8c6b4f'); R(g, 80, 666, 18, 160, 4, '#7a5c43'); R(g, 442, 666, 18, 160, 4, '#7a5c43')
    R(g, 70, 470, 52, 70, 8, '#d0745a'); C(g, 96, 456, 30, '#5fa36a'); C(g, 80, 440, 18, '#6db878')
  }
  function bgBoutique(g) {
    R(g, 0, 0, W, H, 0, '#FFF4E8')
    for (var r = 0; r < 2; r++) {
      R(g, 40, 260 + r * 120, 460, 12, 4, '#c69c72')
      for (var i = 0; i < 6; i++) {
        E('ellipse', { cx: 80 + i * 74, cy: 240 + r * 120, rx: 28, ry: 16, fill: r ? '#d99a4e' : '#c98a3e' }, g)
        P(g, 'M' + (64 + i * 74) + ' ' + (236 + r * 120) + ' l8 -6 M' + (78 + i * 74) + ' ' + (236 + r * 120) + ' l8 -6', 'none', { stroke: '#f3d2a2', 'stroke-width': 3, 'stroke-linecap': 'round' })
      }
    }
    R(g, 0, 700, W, 260, 0, '#E5D2BC')
    R(g, 0, 640, W, 90, 0, '#b07a4f'); R(g, 0, 640, W, 14, 0, '#9a6640')
    R(g, 130, 190, 280, 0, 0, '#fff')
  }

  /* ---------- Lecteur & rendu ---------- */
  function build(S, svg) {
    var t0 = 0
    S.scenes.forEach(function (s) { s.start = t0; t0 += s.dur })
    var duration = t0
    var root = null

    /* Legende : bandeau blanc dans la zone sure du haut, gros caracteres,
       apparition en 0,25 s quelle que soit la duree de la scene. */
    function caption(g, lines, lt, accent) {
      var x0 = 24, y0 = 104, w = 428, lh = 38, h = 26 + lines.length * lh
      var op = easeOut(lt / 0.25)
      var cg = G(g, 'translate(0,' + ((1 - op) * -12).toFixed(1) + ')', op)
      R(cg, x0, y0 + 4, w, h, 18, 'rgba(10,20,40,.18)')
      R(cg, x0, y0, w, h, 18, '#fff')
      R(cg, x0, y0, 9, h, 4, accent || COL.blue)
      lines.forEach(function (l, i) {
        T(cg, x0 + 26, y0 + 44 + i * lh, l, { size: 29, w: 800, fill: COL.ink, maxW: w - 44 })
      })
    }

    function drawScene(s, t, g) {
      var lt = t - s.start
      s.draw(g, lt, s)
      if (s.caption) caption(g, s.caption, lt, S.accent)
    }

    /* Controle des zones sures : chaque texte visible doit tenir dans SAFE.
       Un texte entierement sous le voile opaque est invisible : ignore. */
    function controleZones(svg) {
      var box = svg.getBoundingClientRect(), k = W / box.width
      var out = []
      Array.prototype.forEach.call(svg.querySelectorAll('text'), function (n) {
        if (!n.textContent.trim()) return
        var op = 1, p = n
        while (p && p !== svg) {
          var o = p.getAttribute && p.getAttribute('opacity')
          if (o !== null && o !== undefined && o !== '') op *= Number(o)
          p = p.parentNode
        }
        if (op < 0.2) return
        var r = n.getBoundingClientRect()
        var x0 = (r.left - box.left) * k, x1 = (r.right - box.left) * k, y0 = (r.top - box.top) * k, y1 = (r.bottom - box.top) * k
        if (y0 >= H || x1 <= 0 || x0 >= W || y1 <= 0) return
        if (veilOn && y0 >= VEIL_FULL) return
        var why = []
        if (x0 < SAFE.x0) why.push('gauche')
        if (x1 > SAFE.x1 + 1) why.push('droite')
        if (y0 < SAFE.y0) why.push('haut')
        if (y1 > SAFE.y1 + 1) why.push('bas')
        if (why.length) out.push('hors zone sure (' + why.join(', ') + ') : ' + n.textContent)
      })
      return out
    }

    function render(t) {
      t = clamp(t, 0, duration - 1e-6)
      warnings.length = 0
      veilOn = false
      uid = 0
      while (svg.firstChild) svg.removeChild(svg.firstChild)
      defs = E('defs', null, svg)
      root = E('g', null, svg)
      var i = 0
      for (; i < S.scenes.length - 1; i++) if (t < S.scenes[i + 1].start) break
      var s = S.scenes[i]
      var lt = t - s.start
      var fade = 0.4
      if (i > 0 && lt < fade) {
        var prev = S.scenes[i - 1]
        drawScene(prev, prev.start + prev.dur - 0.001, G(root))
        var ng = G(root, null, easeInOut(lt / fade).toFixed(3))
        drawScene(s, t, ng)
      } else drawScene(s, t, G(root))
      window.__warnings = warnings.slice().concat(controleZones(svg))
      return i
    }

    /* Ecran de fin. o.mode 'social' : pas de QR (on ne scanne pas son propre
       ecran), un appel a l action et « lien en bio ». o.mode 'qr' : QR reel,
       petit et secondaire, pour les ecrans d animation et les evenements.
       Tout le texte reste dans la zone sure, centre sur la colonne utile. */
    function endCard(g, t, o) {
      R(g, 0, 0, W, H, 0, grad('end' + (uid++), [[0, COL.d1], [1, COL.d2]]))
      C(g, 480, 120, 180, 'rgba(59,92,196,.18)'); C(g, 40, 900, 200, 'rgba(0,180,160,.10)')
      var cx = 240
      var p = easeOut(prog(t, 0, 0.45))
      var lg = G(g, 'translate(0,' + ((1 - p) * 16).toFixed(1) + ')', p)
      C(lg, 142, 196, 9, '#fff')
      var tx = E('text', { x: 162, y: 216, 'font-family': 'Manrope, sans-serif', 'font-size': 62, 'font-weight': 800, fill: '#fff' }, lg)
      tx.textContent = 'Flow'
      var ts = E('tspan', { fill: '#6F8CF0' }, tx); ts.textContent = 'in'
      o.accroche.forEach(function (l, i) { T(lg, cx, 290 + i * 42, l, { size: 32, w: 800, fill: '#fff', anchor: 'middle', maxW: 420 }) })
      var yb = 290 + o.accroche.length * 42 + 10
      var qp = easeOut(prog(t, 0.25, 0.45))
      if (o.mode === 'qr') {
        var q = window.QR
        var size = 196, x = cx - size / 2, y = yb
        var qg = G(g, null, qp)
        R(qg, x - 5, y - 5, size + 10, size + 10, 18, 'rgba(0,0,0,.25)')
        R(qg, x, y, size, size, 14, '#fff')
        var m = size / (q.n + 8)
        P(qg, q.d, '#0E1B30', { transform: 'translate(' + (x + 4 * m) + ',' + (y + 4 * m) + ') scale(' + m + ')', 'shape-rendering': 'crispEdges' })
        T(g, cx, y + size + 42, o.scan, { size: 22, w: 800, fill: '#fff', anchor: 'middle', maxW: 420, op: qp })
        T(g, cx, y + size + 76, o.url, { size: 18, w: 700, fill: '#9FB4FF', anchor: 'middle', maxW: 420, op: qp })
      } else {
        var bg = G(g, null, qp)
        var bw = 360, bh = 66, bx = cx - bw / 2, by = yb + 24
        R(bg, bx, by, bw, bh, bh / 2, grad('cta' + (uid++), [[0, o.cta1 || COL.blue], [1, o.cta2 || COL.teal]], 1, 0))
        T(bg, cx, by + 42, o.cta, { size: 25, w: 800, fill: '#fff', anchor: 'middle', maxW: bw - 40 })
        T(bg, cx, by + bh + 56, 'Lien en bio', { size: 26, w: 800, fill: '#fff', anchor: 'middle' })
        T(bg, cx, by + bh + 92, o.url, { size: 20, w: 700, fill: '#9FB4FF', anchor: 'middle', maxW: 420 })
      }
    }

    /* Accroche des 1,5 premieres secondes : tres gros texte, visible des la
       premiere image (pas de fondu : c est aussi la vignette de la video). */
    function hookCard(g, t, o) {
      R(g, 0, 0, W, H, 0, grad('hk' + (uid++), o.fond))
      C(g, 470, 210, 190, 'rgba(255,255,255,.08)'); C(g, 60, 860, 230, 'rgba(255,255,255,.07)')
      var s = 1 + 0.035 * (1 - easeOut(prog(t, 0, 0.5)))
      var hg = G(g, 'translate(' + (240 * (1 - s)).toFixed(1) + ',' + (330 * (1 - s)).toFixed(1) + ') scale(' + s.toFixed(4) + ')')
      if (o.kicker) T(hg, 36, 170, o.kicker, { size: 20, w: 800, fill: 'rgba(255,255,255,.75)', ls: 2, maxW: 410 })
      o.lignes.forEach(function (l, i) {
        T(hg, 34, 252 + i * 62, l, { size: 52, w: 800, fill: i === o.forte ? (o.couleurForte || '#FFE27A') : '#fff', maxW: 418 })
      })
      if (o.visuel) o.visuel(g, t)
    }

    return { render: render, duration: duration, endCard: endCard, hookCard: hookCard }
  }

  /* ---------- Page : lecteur ou mode #record ---------- */
  function start(S) {
    var record = location.hash === '#record'
    document.body.className = record ? 'record' : 'player'
    var svg = document.getElementById('svg')
    var eng = build(S, svg)
    S.engine = eng
    var t = 0, playing = !record, last = null
    var ui = {}
    window.ANIM = { duration: eng.duration, ready: false, seek: function (x) { t = x; draw() }, scenes: S.scenes.map(function (s) { return { id: s.id, label: s.label, start: s.start, dur: s.dur, caption: !!s.caption } }) }

    function fmt(x) { var s = Math.floor(x); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) }
    function draw() {
      var i = eng.render(t)
      if (!record) {
        ui.range.value = String(t / eng.duration * 1000)
        ui.time.textContent = fmt(t) + ' / ' + fmt(eng.duration)
        Array.prototype.forEach.call(ui.list.children, function (b, k) { b.className = k === i ? 'on' : '' })
        ui.play.textContent = playing ? 'Pause' : 'Lecture'
      }
    }
    if (!record) {
      ui.play = document.getElementById('play'); ui.restart = document.getElementById('restart')
      ui.range = document.getElementById('range'); ui.time = document.getElementById('time'); ui.list = document.getElementById('scenes')
      S.scenes.forEach(function (s, k) {
        var b = document.createElement('button')
        b.textContent = (k + 1) + '. ' + s.label + ' (' + s.start.toFixed(1) + ' s)'
        b.onclick = function () { t = s.start + 0.01; draw() }
        ui.list.appendChild(b)
      })
      ui.play.onclick = function () { if (t >= eng.duration - 0.05) t = 0; playing = !playing; last = null; draw() }
      ui.restart.onclick = function () { t = 0; playing = true; last = null; draw() }
      ui.range.oninput = function () { t = Number(ui.range.value) / 1000 * eng.duration; playing = false; draw() }
      var loop = function (ts) {
        if (playing) {
          if (last !== null) t += (ts - last) / 1000
          if (t >= eng.duration) { t = eng.duration - 0.001; playing = false }
          draw()
        }
        last = ts
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    }
    var fonts = ['500', '700', '800'].map(function (w) { return document.fonts.load(w + ' 20px Manrope') })
    Promise.all(fonts).then(function () { return document.fonts.ready }).then(function () {
      draw()
      window.ANIM.ready = true
    })
  }

  window.FL = {
    W: W, H: H, COL: COL, E: E, T: T, R: R, C: C, P: P, G: G, grad: grad, clip: clip, veil: veil, SAFE: SAFE,
    clamp: clamp, lerp: lerp, easeOut: easeOut, easeInOut: easeInOut, prog: prog, pop: pop,
    statusBar: statusBar, btn: btn, tap: tap, check: check, qrIcon: qrIcon, phone: phone,
    person: person, bgFete: bgFete, bgSoft: bgSoft, bgBureau: bgBureau, bgBoutique: bgBoutique,
    stand: stand, qrPanel: qrPanel, start: start, gid: gid
  }
})()
