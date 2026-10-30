/* Moteur style H « typo + vrais écrans » : un aplat par scène, mot géant
   Manrope 800, un seul objet réel, anneau de flash aux transitions.
   render(t) déterministe ; window.ANIM = { duration, scenes, seek(t), ready }.
   Zones sûres (9:16, 540 x 960) : haut 10 %, bas 20 %, droite 15 %. */
(function () {
  var W = 540, H = 960, SAFE = { top: 96, bottom: 768, right: 459, left: 24 }
  var C = { ink: '#150C1C', mag: '#E0218A', gold: '#F5A100', violet: '#7C2D92', teal: '#00B4A0', hero: '#6e2785', white: '#FFFFFF',
    butter: '#FEFBA8', pink: '#F9C9DF', mint: '#B6EBDF', sky: '#C4E2F8', lilac: '#DCCDF4' }
  var uid = 0
  function id(p) { uid++; return p + uid }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)) }
  function prog(t, a, d) { return clamp((t - a) / d, 0, 1) }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3) }
  function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;') }

  // Taille de chaque mot géant : mesurée une fois les polices chargées pour
  // remplir 420 px (de x = 30 à 450, dans la zone sûre droite).
  var tailles = {}
  function mesurer(mots) {
    var svg = document.getElementById('svg')
    mots.forEach(function (m) {
      if (tailles[m]) return
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      el.setAttribute('font-family', 'Manrope'); el.setAttribute('font-weight', '800'); el.setAttribute('font-size', '100')
      el.setAttribute('letter-spacing', '-4'); el.textContent = m
      svg.appendChild(el)
      var w = el.getComputedTextLength()
      svg.removeChild(el)
      tailles[m] = Math.min(130, Math.floor(100 * 420 / w))
    })
  }

  var F = {
    C: C, W: W, H: H, SAFE: SAFE, prog: prog, easeOut: easeOut, easeInOut: easeInOut, clamp: clamp, id: id, esc: esc,
    // Mot(s) géant(s) empilés en haut. lt = temps local ; entree = false pour l image 0.
    mots: function (lignes, lt, col, entree, y0) {
      var y = y0 || SAFE.top + 8, g = ''
      lignes.forEach(function (m, i) {
        var s = tailles[m] || 100, p = entree === false ? 1 : easeOut(prog(lt, 0.12 + i * 0.12, 0.38))
        y += s * 0.76
        g += '<text class="safe" data-cap="' + (0.74 * s).toFixed(1) + '" x="30" y="' + (y + (1 - p) * 40).toFixed(1) + '" font-family="Manrope" font-weight="800" font-size="' + s + '" letter-spacing="' + (-0.04 * s).toFixed(1) + '" fill="' + col + '" opacity="' + p.toFixed(3) + '">' + esc(m) + '</text>'
        y += s * 0.16
      })
      F._basMots = y
      return g
    },
    texte: function (x, y, t, o) {
      o = o || {}
      return '<text class="safe" x="' + x + '" y="' + y + '" font-family="Manrope" font-weight="' + (o.w || 700) + '" font-size="' + (o.size || 24) + '" fill="' + (o.fill || '#fff') + '"' +
        (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') + ' opacity="' + (o.op === undefined ? 1 : o.op) + '">' + esc(t) + '</text>'
    },
    anneau: function (cx, cy, r, op, w) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" fill="none" stroke="' + (F.ringCol || '#fff') + '" stroke-width="' + (w || 3) + '" opacity="' + op.toFixed(3) + '"/>' },
    // Anneaux qui s ouvrent depuis un point (geste « flash »).
    flash: function (cx, cy, lt, a, n) {
      var g = ''
      for (var k = 0; k < (n || 3); k++) {
        var p = prog(lt, a + k * 0.18, 0.9)
        if (p > 0 && p < 1) g += F.anneau(cx, cy, 30 + easeOut(p) * 220, (1 - p) * 0.95, 3)
      }
      return g
    },
    qr: function (x, y, size, fg) {
      var q = window.QR, m = size / q.n
      return '<rect x="' + (x - size * 0.06) + '" y="' + (y - size * 0.06) + '" width="' + size * 1.12 + '" height="' + size * 1.12 + '" fill="#fff"/>' +
        '<g transform="translate(' + x + ',' + y + ') scale(' + m + ')"><path d="' + q.d + '" fill="' + (fg || C.ink) + '"/></g>'
    },
    logo: function (x, y, size, col, anchor) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'start') + '" font-family="Manrope" font-weight="800" font-size="' + size + '" fill="' + col + '" letter-spacing="' + (-0.04 * size) + '">Flow<tspan fill="' + C.mag + '">in</tspan></text>'
    },
    // Téléphone fin : bord 8 px ; ecran(sw, sh) dessine le contenu.
    phone: function (x, y, w, h, rot, ecran) {
      var cid = id('scr'), sw = w - 16, sh = h - 16
      return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ')">' +
        '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + w * 0.14 + '" fill="#0B0710"/>' +
        '<g transform="translate(' + (-sw / 2) + ',' + (-sh / 2) + ')"><clipPath id="' + cid + '"><rect width="' + sw + '" height="' + sh + '" rx="' + w * 0.12 + '"/></clipPath>' +
        '<g clip-path="url(#' + cid + ')">' + ecran(sw, sh) + '</g></g></g>'
    },
    sticker: function (x, y, w, rot) {
      var h = w * 1.2, q = w * 0.66
      return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ')">' +
        '<rect x="' + (-w / 2 + 5) + '" y="' + (-h / 2 + 8) + '" width="' + w + '" height="' + h + '" rx="' + w * 0.1 + '" fill="rgba(0,0,0,.22)"/>' +
        '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + w * 0.1 + '" fill="#fff"/>' +
        '<text x="0" y="' + (-h / 2 + w * 0.15) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + w * 0.075 + '" letter-spacing="' + w * 0.004 + '" fill="' + C.ink + '">STATION DE JEU</text>' +
        F.qr(-q / 2, -h / 2 + w * 0.24, q) + F.logo(0, h / 2 - w * 0.08, w * 0.14, C.ink, 'middle') + '</g>'
    },
    degradeQuiz: function (sw, sh) {
      var gid = id('stg')
      return '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e2785"/><stop offset=".45" stop-color="#3a1450"/><stop offset="1" stop-color="#160820"/></linearGradient></defs><rect width="' + sw + '" height="' + sh + '" fill="url(#' + gid + ')"/>'
    },
    // En-tête qz-hero (plaquette NDS) : pastille, nom, étiquette.
    entete: function (u, tag) {
      var bid = id('bdg')
      return '<defs><linearGradient id="' + bid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + C.gold + '"/><stop offset="1" stop-color="' + C.mag + '"/></linearGradient></defs>' +
        '<rect x="' + 14 * u + '" y="' + 30 * u + '" width="' + 30 * u + '" height="' + 30 * u + '" rx="' + 10 * u + '" fill="url(#' + bid + ')"/>' +
        '<path d="M' + 22 * u + ',' + 45 * u + ' L' + 26 * u + ',' + 40 * u + ' L' + 29 * u + ',' + 44 * u + ' L' + 33 * u + ',' + 38 * u + ' L' + 37 * u + ',' + 45 * u + '" stroke="#fff" stroke-width="' + 2 * u + '" fill="none" stroke-linejoin="round"/>' +
        '<text x="' + 52 * u + '" y="' + 43 * u + '" font-family="Manrope" font-weight="800" font-size="' + 13.5 * u + '" fill="#fff">Nuits du Sud</text>' +
        '<text x="' + 52 * u + '" y="' + 56 * u + '" font-family="Manrope" font-weight="800" font-size="' + 8.5 * u + '" fill="rgba(255,255,255,.55)" letter-spacing="' + 0.7 * u + '">' + tag + '</text>'
    },
    // Écran quiz : choix = 0..1 (sélection de « Juillet »).
    ecranQuiz: function (choix) {
      return function (sw, sh) {
        var u = sw / 240, g = F.degradeQuiz(sw, sh) + F.entete(u, 'QUIZ · STATION DE JEU')
        g += '<text x="' + 14 * u + '" y="' + 96 * u + '" font-family="Manrope" font-weight="700" font-size="' + 10.5 * u + '" fill="rgba(255,255,255,.45)">3 / 5</text>'
        g += '<rect x="' + 44 * u + '" y="' + 91 * u + '" width="' + 182 * u + '" height="' + 4 * u + '" rx="' + 2 * u + '" fill="rgba(255,255,255,.1)"/><rect x="' + 44 * u + '" y="' + 91 * u + '" width="' + 109 * u + '" height="' + 4 * u + '" rx="' + 2 * u + '" fill="' + C.mag + '"/>'
        g += '<text x="' + 14 * u + '" y="' + 128 * u + '" font-family="Manrope" font-weight="800" font-size="' + 17 * u + '" fill="#fff">Le festival a lieu</text>'
        g += '<text x="' + 14 * u + '" y="' + 150 * u + '" font-family="Manrope" font-weight="800" font-size="' + 17 * u + '" fill="#fff">en… ?</text>'
        ;['Mars', 'Juillet', 'Octobre', 'Décembre'].forEach(function (o, k) {
          var y = (172 + k * 50) * u, ok = k === 1 ? choix : 0
          g += '<rect x="' + 14 * u + '" y="' + y + '" width="' + 212 * u + '" height="' + 40 * u + '" rx="' + 12 * u + '" fill="' + (ok ? 'rgba(0,180,160,' + (0.22 * ok).toFixed(3) + ')' : 'rgba(255,255,255,.05)') + '" stroke="' + (ok > 0.5 ? C.teal : 'rgba(255,255,255,.14)') + '" stroke-width="' + 1.5 * u + '"/>'
          g += '<text x="' + 28 * u + '" y="' + (y + 25 * u) + '" font-family="Manrope" font-weight="600" font-size="' + 13 * u + '" fill="#fff">' + o + '</text>'
          if (k === 1 && ok > 0) g += '<g opacity="' + ok.toFixed(3) + '"><circle cx="' + 206 * u + '" cy="' + (y + 20 * u) + '" r="' + 10 * u + '" fill="' + C.teal + '"/><path d="M' + 201 * u + ',' + (y + 20 * u) + ' L' + 205 * u + ',' + (y + 24 * u) + ' L' + 212 * u + ',' + (y + 16 * u) + '" stroke="#fff" stroke-width="' + 2.4 * u + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>'
        })
        return g
      }
    },
    // Écran bonus (questions bonus du quiz NDS, « Bonus 1/2 »).
    ecranBonus: function (choix) {
      return function (sw, sh) {
        var u = sw / 240, g = F.degradeQuiz(sw, sh) + F.entete(u, 'QUESTIONS BONUS')
        g += '<rect x="' + 14 * u + '" y="' + 80 * u + '" width="' + 64 * u + '" height="' + 20 * u + '" rx="' + 10 * u + '" fill="' + C.gold + '"/>'
        g += '<text x="' + 46 * u + '" y="' + 94 * u + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + 10 * u + '" fill="' + C.ink + '">BONUS 1/2</text>'
        g += '<text x="' + 14 * u + '" y="' + 128 * u + '" font-family="Manrope" font-weight="800" font-size="' + 17 * u + '" fill="#fff">Comment as-tu connu</text>'
        g += '<text x="' + 14 * u + '" y="' + 150 * u + '" font-family="Manrope" font-weight="800" font-size="' + 17 * u + '" fill="#fff">le festival ?</text>'
        ;['Affiche', 'Réseaux sociaux', 'Bouche à oreille'].forEach(function (o, k) {
          var y = (172 + k * 50) * u, ok = k === 1 ? choix : 0
          g += '<rect x="' + 14 * u + '" y="' + y + '" width="' + 212 * u + '" height="' + 40 * u + '" rx="' + 12 * u + '" fill="' + (ok ? 'rgba(245,161,0,' + (0.25 * ok).toFixed(3) + ')' : 'rgba(255,255,255,.05)') + '" stroke="' + (ok > 0.5 ? C.gold : 'rgba(255,255,255,.14)') + '" stroke-width="' + 1.5 * u + '"/>'
          g += '<text x="' + 28 * u + '" y="' + (y + 25 * u) + '" font-family="Manrope" font-weight="600" font-size="' + 13 * u + '" fill="#fff">' + o + '</text>'
        })
        return g
      }
    },
    ecranScore: function (sw, sh) {
      return F.degradeQuiz(sw, sh) +
        '<text x="' + sw / 2 + '" y="' + sh * 0.42 + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + sw * 0.05 + '" letter-spacing="' + sw * 0.006 + '" fill="rgba(255,255,255,.5)">TON SCORE</text>' +
        '<text x="' + sw / 2 + '" y="' + sh * 0.56 + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + sw * 0.26 + '" fill="#fff" letter-spacing="' + (-sw * 0.01) + '">5/5</text>' +
        '<text x="' + sw / 2 + '" y="' + sh * 0.64 + '" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="' + sw * 0.06 + '" fill="#fff">Ticket acquis.</text>'
    },
    ecranScan: function (sw, sh) {
      var q = sw * 0.6, qx = (sw - q) / 2, qy = sh * 0.3, c = sw * 0.12, m = 22, x0 = qx - m, y0 = qy - m, x1 = qx + q + m, y1 = qy + q + m
      return '<rect width="' + sw + '" height="' + sh + '" fill="#2A2230"/>' + F.qr(qx, qy, q) +
        '<path d="M' + x0 + ',' + (y0 + c) + ' L' + x0 + ',' + y0 + ' L' + (x0 + c) + ',' + y0 + ' M' + (x1 - c) + ',' + y0 + ' L' + x1 + ',' + y0 + ' L' + x1 + ',' + (y0 + c) + ' M' + x1 + ',' + (y1 - c) + ' L' + x1 + ',' + y1 + ' L' + (x1 - c) + ',' + y1 + ' M' + (x0 + c) + ',' + y1 + ' L' + x0 + ',' + y1 + ' L' + x0 + ',' + (y1 - c) + '" stroke="#fff" stroke-width="' + sw * 0.025 + '" fill="none" stroke-linecap="round"/>' +
        '<rect x="' + sw * 0.16 + '" y="' + sh * 0.8 + '" width="' + sw * 0.68 + '" height="' + sh * 0.07 + '" rx="' + sh * 0.035 + '" fill="rgba(255,255,255,.14)"/>' +
        '<text x="' + sw / 2 + '" y="' + sh * 0.845 + '" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="' + sw * 0.058 + '" fill="#fff">Station de jeu détectée</text>'
    },
    ticket: function (x, y, w, rot, fond) {
      var h = w * 0.62
      return '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ')">' +
        '<rect x="' + (-w / 2 + 6) + '" y="' + (-h / 2 + 10) + '" width="' + w + '" height="' + h + '" rx="' + w * 0.07 + '" fill="rgba(0,0,0,.22)"/>' +
        '<rect x="' + (-w / 2) + '" y="' + (-h / 2) + '" width="' + w + '" height="' + h + '" rx="' + w * 0.07 + '" fill="#fff"/>' +
        '<circle cx="' + (-w / 2) + '" cy="' + h * 0.12 + '" r="' + w * 0.045 + '" fill="' + fond + '"/><circle cx="' + w / 2 + '" cy="' + h * 0.12 + '" r="' + w * 0.045 + '" fill="' + fond + '"/>' +
        '<path d="M' + (-w / 2 + w * 0.07) + ',' + h * 0.12 + ' L' + (w / 2 - w * 0.07) + ',' + h * 0.12 + '" stroke="#e4dee9" stroke-width="' + w * 0.008 + '" stroke-dasharray="' + w * 0.02 + ' ' + w * 0.016 + '"/>' +
        '<text x="' + (-w / 2 + w * 0.08) + '" y="' + (-h / 2 + h * 0.2) + '" font-family="Manrope" font-weight="800" font-size="' + w * 0.045 + '" letter-spacing="' + w * 0.005 + '" fill="' + C.mag + '">TON TICKET</text>' +
        '<text x="' + (-w / 2 + w * 0.08) + '" y="' + (-h / 2 + h * 0.43) + '" font-family="Manrope" font-weight="800" font-size="' + w * 0.105 + '" fill="' + C.ink + '">PQ-2026-4128</text>' +
        '<text x="' + (-w / 2 + w * 0.08) + '" y="' + h * 0.32 + '" font-family="Manrope" font-weight="700" font-size="' + w * 0.05 + '" fill="#6b6174">Tirage au sort</text>' +
        '<text x="' + (-w / 2 + w * 0.08) + '" y="' + h * 0.42 + '" font-family="Manrope" font-weight="700" font-size="' + w * 0.042 + '" fill="#9d8fab">Nuits du Sud · Vence</text>' +
        '</g>'
    }
  }
  window.FH = F

  var SC, total = 0, svgEl, playing = false, t0 = 0, cur = 0
  function scenes() { var a = 0; return SC.scenes.map(function (s) { var o = { label: s.label, start: a, dur: s.dur, caption: s.caption || '' }; a += s.dur; return o }) }

  function render(t) {
    uid = 0
    t = clamp(t, 0, total - 1e-4)
    var a = 0, i = 0
    for (; i < SC.scenes.length; i++) { if (t < a + SC.scenes[i].dur) break; a += SC.scenes[i].dur }
    i = Math.min(i, SC.scenes.length - 1)
    var s = SC.scenes[i], lt = t - a, g = ''
    var dessine = function (sc, l, idx) { return '<rect width="540" height="960" fill="' + sc.bg + '"/>' + sc.draw(l, idx === 0 && l < 0.001) }
    // Transition : la scène suivante s ouvre en cercle depuis son point de flash,
    // bordée d un anneau blanc (0,5 s).
    var TR = 0.5
    if (i > 0 && lt < TR) {
      var p = s.from || [270, 480], r = easeInOut(lt / TR) * 1150, cid = 'tr' + i
      g += dessine(SC.scenes[i - 1], SC.scenes[i - 1].dur, i - 1)
      g += '<clipPath id="' + cid + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r.toFixed(1) + '"/></clipPath><g clip-path="url(#' + cid + ')">' + dessine(s, lt, i) + '</g>'
      g += F.anneau(p[0], p[1], r, 1 - lt / TR, 4)
    } else g += dessine(s, lt, i)
    svgEl.innerHTML = g
    cur = i
    if (window.__onScene) window.__onScene(i, t)
    // Contrôle des zones sûres sur les textes importants.
    var w = []
    var els = svgEl.querySelectorAll('text.safe')
    for (var k = 0; k < els.length; k++) {
      if (+els[k].getAttribute('opacity') < 0.5) continue
      var b = els[k].getBBox(), cap = els[k].getAttribute('data-cap')
      // Mots géants : le haut visible est la hauteur des capitales, pas la boîte de la police.
      if (cap) b = { x: b.x, width: b.width, y: +els[k].getAttribute('y') - +cap, height: +cap }
      if (b.y < SAFE.top - 2 || b.y + b.height > SAFE.bottom + 2 || b.x + b.width > SAFE.right + 2 || b.x < SAFE.left - 2) w.push('texte hors zone sûre : « ' + els[k].textContent + ' »')
    }
    window.__warnings = w
  }

  function fmt(x) { var m = Math.floor(x / 60), s = Math.floor(x % 60); return m + ':' + (s < 10 ? '0' : '') + s }
  function boucle() {
    if (!playing) return
    var t = (performance.now() - t0) / 1000
    if (t >= total) { t = total - 1e-3; playing = false; document.getElementById('play').textContent = 'Lecture' }
    seek(t, true)
    if (playing) requestAnimationFrame(boucle)
  }
  var tc = 0
  function seek(t, interne) {
    tc = t
    render(t)
    var r = document.getElementById('range'), tm = document.getElementById('time')
    if (r) r.value = Math.round(t / total * 1000)
    if (tm) tm.textContent = fmt(t) + ' / ' + fmt(total)
    if (!interne && playing) t0 = performance.now() - t * 1000
  }

  window.FLH = {
    start: function (sc) {
      SC = sc; svgEl = document.getElementById('svg'); F.ringCol = sc.ring || '#fff'
      total = sc.scenes.reduce(function (a, s) { return a + s.dur }, 0)
      if (location.hash === '#record') document.body.className = 'record'
      var mots = []; sc.scenes.forEach(function (s) { (s.mots || []).forEach(function (m) { mots.push(m) }) })
      document.fonts.ready.then(function () {
        mesurer(mots)
        window.ANIM = { duration: total, scenes: scenes(), seek: function (x) { seek(x) }, ready: true }
        render(0)
        var play = document.getElementById('play')
        if (play) {
          play.onclick = function () {
            if (playing) { playing = false; play.textContent = 'Lecture'; return }
            if (tc >= total - 0.01) tc = 0
            playing = true; play.textContent = 'Pause'; t0 = performance.now() - tc * 1000; requestAnimationFrame(boucle)
          }
          document.getElementById('restart').onclick = function () { tc = 0; playing = true; play.textContent = 'Pause'; t0 = performance.now(); requestAnimationFrame(boucle) }
          document.getElementById('range').oninput = function (e) { seek(e.target.value / 1000 * total) }
          var items = document.querySelectorAll('[data-scene]')
          for (var k = 0; k < items.length; k++) (function (el) { el.onclick = function () { seek(window.ANIM.scenes[+el.dataset.scene].start + 0.6) } })(items[k])
          window.__onScene = function (i) { for (var k = 0; k < items.length; k++) items[k].classList.toggle('on', +items[k].dataset.scene === i) }
          seek(0)
        }
      })
    }
  }
})()
