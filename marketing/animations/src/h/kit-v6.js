/* Briques v6 : grands chiffres peints (taches nettes v5), numéro d'étape
   peint, mention de source. Aucun pictogramme. */
(function () {
  var F = window.FH, K3 = window.K3, K5 = window.K5, C = F.C, INK = C.ink
  var K6 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  // Grand chiffre posé sur deux taches nettes.
  K6.chiffre = function (txt, cx, cy, size, col1, col2, lt, a, seed, o) {
    o = o || {}
    var p = F.prog(lt, a, 1.4), w = o.largeur || size * 0.55 * txt.length
    var g = K5.tache(cx + w * 0.12, cy - size * 0.3, Math.max(size * 0.55, w * 0.42), col2, (seed || 3) + 7, p * 1.05, { coulures: o.coulures === undefined ? 0 : o.coulures })
    g += K5.tache(cx - w * 0.08, cy - size * 0.38, Math.max(size * 0.45, w * 0.34), col1, seed || 3, p)
    var q = F.easeOut(F.prog(lt, a + 0.15, 0.45)), s = 0.7 + 0.3 * q
    g += '<g opacity="' + q.toFixed(3) + '" transform="translate(' + n1(cx) + ',' + n1(cy) + ') scale(' + s.toFixed(3) + ')"><text class="safe" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + size + '" letter-spacing="' + n1(-0.05 * size) + '" fill="' + INK + '">' + F.esc(txt) + '</text></g>'
    return g
  }
  // Numéro d'étape « 01 » peint, en haut à gauche.
  K6.etape = function (num, col, lt, seed) {
    var g = K5.tache(92, 146, 58, col, seed || 5, F.prog(lt, 0.05, 1.0), { coulures: 0 })
    g += K3.op(F.easeOut(F.prog(lt, 0.15, 0.35)), '<text class="safe" x="92" y="168" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="62" letter-spacing="-3" fill="' + INK + '">' + num + '</text>')
    return g
  }
  // Mention de source, en petit, au-dessus de la zone basse.
  K6.source = function (t, lt, a) {
    return '<text class="safe" x="30" y="758" font-family="Manrope" font-weight="700" font-size="15" fill="rgba(21,12,28,.62)" opacity="' + F.easeOut(F.prog(lt, a === undefined ? 0.8 : a, 0.4)).toFixed(3) + '">' + F.esc(t) + '</text>'
  }
  window.K6 = K6
})()
