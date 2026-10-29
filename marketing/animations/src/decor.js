/* Scenes illustrees partagees : la meme Fete du Lac, la meme boutique,
   vues depuis chaque video. */
(function () {
  'use strict'
  var F = window.FL, COL = F.COL, T = F.T, R = F.R, C = F.C, P = F.P, G = F.G
  var S = window.STORY, K = window.CAST

  function miniStand(g, x, y, s, nom, col) {
    var mg = G(g, 'translate(' + x + ',' + y + ') scale(' + s + ')')
    F.stand(mg, 0, 0, 200, nom, col, null, 30)
    F.qrPanel(mg, 60, 196, 80)
  }

  /* La station de la boulangerie pendant la fete. */
  function fete(g, t, o) {
    o = o || {}
    F.bgFete(g, t)
    if (o.autres) {
      miniStand(g, 18, 330, 0.5, 'Café du Port', COL.teal)
      miniStand(g, 136, 352, 0.42, 'Vélos du Lac', COL.violet)
    }
    var sx = 292, sy = 330, sw = 230
    F.stand(g, sx, sy, sw, S.shop, COL.orange, function () {
      F.person(g, sx + sw * 0.62, sy + 214, 0.66, K.mei, 'idle', t, { happy: true, phase: 1 })
    })
    F.qrPanel(g, sx + 14, sy + 176, 84)
    var a = F.easeOut(F.prog(t, 0.2, 0.7))
    var ax = F.lerp(70, 150, a)
    F.person(g, ax, 940, 1.42, K.aminata, a > 0.8 ? 'scan' : 'idle', t, { happy: true })
    if (t > 1.2) {
      var p = (t * 1.6) % 1
      var px = ax + 129 * 1.42, py = 940 - 192 * 1.42
      var qx = sx + 14 + 42, qy = sy + 176 + 55
      var op = 0.35 + 0.35 * Math.sin(t * 6)
      P(g, 'M' + (px - 10) + ' ' + py + ' L' + (qx - 30) + ' ' + (qy + 30) + ' L' + (qx + 30) + ' ' + (qy + 30) + ' L' + (px + 10) + ' ' + py + ' Z', 'rgba(0,180,160,' + op.toFixed(2) + ')')
      R(g, qx - 34, qy - 40 + p * 80, 68, 3, 2, COL.teal)
    }
    if (t > 2.4) {
      var b = F.easeOut(F.prog(t, 2.4, 0.4))
      var bg = G(g, 'translate(452,668) scale(' + b + ')')
      R(bg, -52, -20, 104, 34, 17, '#fff', { stroke: COL.teal, 'stroke-width': 2 })
      T(bg, 0, 3, 'QR flashé', { size: 14, w: 800, fill: COL.ink, anchor: 'middle' })
    }
  }

  function comptoirBoutique(g) {
    R(g, 0, 650, F.W, 100, 0, '#b07a4f'); R(g, 0, 650, F.W, 16, 0, '#9a6640')
    R(g, 300, 600, 120, 50, 6, '#fff', { stroke: '#e3cfb8', 'stroke-width': 2 })
    R(g, 312, 612, 50, 8, 3, '#d9c4ad'); R(g, 312, 628, 80, 6, 3, '#e8d9c8')
  }
  function enseigne(g) {
    R(g, 90, 92 + 72, 360, 62, 14, '#fff', { stroke: COL.orange, 'stroke-width': 3 })
    T(g, 270, 92 + 112, S.shop, { size: 24, w: 800, fill: COL.ink, anchor: 'middle', maxW: 330 })
  }

  /* Mei dans sa boutique (seule, ou avec Aminata qui retire son lot). */
  function boutique(g, t, o) {
    o = o || {}
    F.bgBoutique(g)
    if (o.enseigne) enseigne(g)
    if (o.retrait) {
      F.person(g, 400, 700, 1.15, K.mei, t > 1.6 ? 'give' : 'idle', t, { flip: true, happy: true, item: 'billet', phase: 1 })
      comptoirBoutique(g)
      F.person(g, 150, 960, 1.35, K.aminata, 'give', t, { item: 'phoneOut', happy: true })
      if (t > 2.2) {
        var b = F.easeOut(F.prog(t, 2.2, 0.4))
        var bg = G(g, 'translate(270,330) scale(' + b + ')')
        R(bg, -96, -24, 192, 44, 22, '#E7F8F1', { stroke: '#0F9E73', 'stroke-width': 2 })
        F.check(bg, -70, -2, 11, '#0F9E73')
        T(bg, 8, 5, 'Billet validé', { size: 17, w: 800, fill: '#0B6E50', anchor: 'middle' })
      }
    } else {
      F.person(g, 270, 700, 1.3, K.mei, 'wave', t, { happy: true })
      comptoirBoutique(g)
    }
  }

  /* Hugo a son bureau, l affiche de la fete au mur. */
  function bureau(g, t) {
    F.bgBureau(g)
    R(g, 120, 200, 150, 200, 8, '#fff', { stroke: '#d9e2f2', 'stroke-width': 3 })
    R(g, 120, 200, 150, 70, 8, COL.blue)
    T(g, 195, 232, S.event, { size: 18, w: 800, anchor: 'middle', maxW: 136 })
    T(g, 195, 254, S.ville, { size: 13, w: 700, anchor: 'middle', fill: 'rgba(255,255,255,.85)' })
    for (var i = 0; i < 4; i++) R(g, 136, 290 + i * 22, 118 - (i % 2) * 30, 8, 4, '#E3E9F5')
    F.person(g, 300, 900, 1.45, K.hugo, 'wave', t, { happy: true })
  }

  function fin(g, t, scen) { scen.engine.endCard(g, t, scen.end) }

  window.DECOR = { fete: fete, boutique: boutique, bureau: bureau, fin: fin }
})()
