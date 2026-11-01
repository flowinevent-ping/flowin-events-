/**
 * MOTEUR D'ECRANS DES MASTERS — portage fidele des maquettes validees.
 *
 * Source : scratchpad/maquettes-jeux/index.html (Romain, maquettes « Les 5 jeux,
 * écran par écran »). Chaque ecran est la fonction de la maquette, branchee sur
 * une VueMaster (contenu resolu : master + personnalisations + donnees reelles,
 * lib/masters/resolve.ts) et sur l'etat de la partie en cours (EtatPartie).
 *
 * Les ecrans sont produits en HTML (comme la maquette) et injectes par
 * app/jouer/JouerClient.tsx, qui gere la navigation (data-go) et les vraies
 * actions (reponse, roue, tombola, vote, inscription). TOUT texte venant des
 * donnees passe par esc() : aucun HTML saisi par un pro n'est interprete.
 */
import type { VueMaster } from './resolve'
import type { LotAffiche } from './types'
import { L } from './defs'

/* ── Etat de la partie ─────────────────────────────────────────────────── */
export interface EtatPartie {
  qi: number
  rep: (number | null)[]
  bonnes: number
  bonusFait: boolean
  ticket: string
  ticketBonus: string
  gain: { lot: string; cond: string; token?: string } | null
  caseIdx: number | null
  rotation: number
  voteIdx: number | null
  /** true : le vote porte sur une vitrine (exemple 2 du vote). */
  vitrineVote: boolean
  tombolaNo: string
  after: string | null
  profil: { prenom?: string; nom?: string; email?: string; tel?: string; cp?: string; age?: string } | null
  parrainN: number
  erreur: string
  envoi: boolean
}

export function etatInitial(): EtatPartie {
  return { qi: 0, rep: [], bonnes: 0, bonusFait: false, ticket: '', ticketBonus: '', gain: null, caseIdx: null, rotation: -12, voteIdx: null, vitrineVote: false, tombolaNo: '', after: null, profil: null, parrainN: 0, erreur: '', envoi: false }
}

/* ── Outils ────────────────────────────────────────────────────────────── */
export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
/** Les « [… à compléter] » sont mis en evidence (classe placeholder). */
function txt(s: unknown): string {
  return esc(s).replace(/\[([^\]]+)\]/g, '<span class="placeholder">[$1]</span>')
}
function urlSure(u: unknown): string {
  const s = String(u || '').trim()
  return /^(https?:\/\/|\/)/i.test(s) ? esc(s) : ''
}
function n1(x: number) { return (+x).toFixed(1) }
function rnd(seed: number) { let s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280 } }
type Geo = [string, number, number, number, string, number?, number?]
function geo(list: Geo[]): string {
  return list.map(function (g) {
    const s = g[0], w = g[3], h = s === 'h' ? w / 2 : (s === 'p' ? w / 2.6 : w)
    let st = 'left:' + g[1] + 'px;top:' + g[2] + 'px;width:' + w + 'px;height:' + n1(h) + 'px;'
    st += s === 'o' ? 'border:' + Math.round(w / 7) + 'px solid ' + g[4] + ';' : 'background:' + g[4] + ';'
    if (g[5]) st += 'transform:rotate(' + g[5] + 'deg);'
    st += '--d:' + (g[6] || 0) + 's'
    return '<i class="geo g-' + s + ' a-grow" style="' + st + '" aria-hidden="true"></i>'
  }).join('')
}
/** QR d'illustration (la maquette). Le vrai QR du billet est pose par le client (data-qr). */
function qr(seed: number, px: number): string {
  const n = 25, R = rnd(seed), m: boolean[][] = []
  let x: number, y: number
  for (y = 0; y < n; y++) { m[y] = []; for (x = 0; x < n; x++) m[y][x] = R() > .5 }
  function fin(x0: number, y0: number) { for (let j = -1; j < 8; j++) for (let i = -1; i < 8; i++) { const X = x0 + i, Y = y0 + j; if (X < 0 || Y < 0 || X >= n || Y >= n) continue; m[Y][X] = (i === -1 || j === -1 || i === 7 || j === 7) ? false : (i === 0 || j === 0 || i === 6 || j === 6) ? true : (i >= 2 && i <= 4 && j >= 2 && j <= 4) } }
  fin(0, 0); fin(18, 0); fin(0, 18); for (let t = 8; t < 17; t++) { m[6][t] = t % 2 === 0; m[t][6] = t % 2 === 0 }
  let d = ''; for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (m[y][x]) d += 'M' + x + ' ' + y + 'h1v1h-1z'
  return '<svg width="' + px + '" height="' + px + '" viewBox="-1 -1 27 27" aria-label="QR code" shape-rendering="crispEdges"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><path d="' + d + '" fill="#1B3A5C"/></svg>'
}
const P: Record<string, string> = {
  chevL: '<path d="M15 18l-6-6 6-6"/>', chevR: '<path d="M9 6l6 6-6 6"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>', store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v1.5a3 3 0 0 1-5.33 1.9 3 3 0 0 1-5.34 0A3 3 0 0 1 4 10.5z"/><path d="M5.5 13v7h13v-7M10 20v-4h4v4"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>', list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6.5v11" stroke-dasharray="2 2.6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', route: '<path d="M3 11l18-8-8 18-2-8z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>',
  replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>', chat: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>', sms: '<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M8 21l3-4"/><path d="M7.5 10.5h.01M12 10.5h.01M16.5 10.5h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6 8.5-6"/>', phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>', share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2 .8 3.5 2.8 3.5 5.7"/>',
  handshake: '<path d="M3 12l4-4 4 2 3-2 7 4"/><path d="M7 8v6l4 4 2-1 2 1 4-4"/>', spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>',
}
export function icon(k: string, s?: number, sw?: number): string {
  s = s || 22
  return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[k] + '</svg>'
}

const FIN_OK = 'Une partie par jour et par commerce'
const PREMIER_ECRAN: Record<string, string> = { quiz: 'q-question', solo: 'q-question', tombola: 't-tirer', spin: 'r-roue', vote: 'v-choix' }

/* ── Briques communes ──────────────────────────────────────────────────── */
function sb(): string {
  return '<div class="sb"><span>9:41</span><span class="r"><span class="bars"><i style="height:4px"></i><i style="height:6px"></i><i style="height:8px"></i><i style="height:11px"></i></span><span class="bat"><i></i></span></span></div>'
}
/** La barre d'etat du telephone n'est dessinee que dans les apercus (cadre SA / pro). */
let AVEC_BARRE = true
export function regleBarre(v: boolean) { AVEC_BARRE = v }
function barre(): string { return AVEC_BARRE ? sb() : '<div style="height:14px;flex:none"></div>' }

function mono(v: VueMaster, style?: string): string {
  if (v.who.logo && urlSure(v.who.logo)) return '<span class="mono" style="background:#fff;border:1.5px solid var(--line);overflow:hidden;' + (style || '') + '"><img class="fm-logo" alt="" src="' + urlSure(v.who.logo) + '"></span>'
  return '<span class="mono"' + (style ? ' style="' + style + '"' : '') + '>' + esc(v.who.mono) + '</span>'
}
interface OptsHdr { back?: string; title?: string; small?: string; noMe?: boolean }
function hdr(v: VueMaster, o?: OptsHdr): string {
  o = o || {}
  const left = o.back ? '<button class="iconbtn" data-go="@retour" data-repli="\' + o.back + \'" aria-label="Retour">' + icon('chevL', 22, 2) + '</button>' : ''
  const me = o.noMe ? '<span style="width:44px"></span>' : '<button class="iconbtn" data-go="c-profil" aria-label="Mon profil">' + icon('user', 21) + '</button>'
  if (o.title) return '<div class="hdr">' + (left || '<span style="width:44px"></span>') + '<div class="ttl">' + esc(o.title) + (o.small ? '<small>' + esc(o.small) + '</small>' : '') + '</div>' + me + '</div>'
  return '<div class="hdr">' + left + '<div class="brand" style="flex:1">' + mono(v) + '<div style="min-width:0"><b>' + esc(v.who.nom) + '</b><i>' + esc(v.who.tag) + '</i></div></div>' + me + '</div>'
}
function btn(lbl: string, go: string, cls?: string, extra?: string): string {
  return '<button class="btn ' + (cls || '') + '"' + (go ? ' data-go="' + go + '"' : '') + (extra || '') + '>' + lbl + '</button>'
}
function foot(inner: string): string { return '<div class="foot">' + inner + '</div>' }
function glyph(l: LotAffiche): string { return '<span class="glyph g-' + esc(l.type) + '"><b>' + esc(l.big) + '</b><small>' + esc(l.small) + '</small></span>' }
function modeTag(v: VueMaster, m: string): string { return m === 'imm' ? '<span class="tag imm">Gain immédiat</span>' : '<span class="tag tir">Tirage le ' + esc(courte(v.tirage)) + '</span>' }
/** « 30 novembre 2026 » -> « 30 novembre » (comme la maquette). */
function courte(t: string): string { return /^\d{1,2} \S+ \d{4}$/.test(t) ? t.replace(/ \d{4}$/, '') : t }
function lotRow(v: VueMaster, l: LotAffiche): string {
  return '<div class="lot">' + glyph(l) + '<div class="tx"><b>' + txt(l.nom) + '</b><small>' + txt(l.cond) + '</small>' + modeTag(v, l.mode) + '</div></div>'
}
const LCOL = ['#3B5CC4', '#00B4A0', '#E85D04', '#7C5CC4', '#0B9E6E', '#F59E0B', '#1B3A5C', '#2C49A6', '#13A89E', '#C24A03']
/** Logo d'illustration generique (maquette) : utilise quand un partenaire n'a pas de logo. */
function plogo(i: number, w: number, h: number): string {
  const c = LCOL[i % LCOL.length], c2 = LCOL[(i + 3) % LCOL.length], vv = i % 8
  let m = ''
  if (vv === 0) m = '<circle cx="20" cy="20" r="15" fill="' + c + '"/><circle cx="20" cy="20" r="6.5" fill="#fff"/>'
  if (vv === 1) m = '<path d="M4 32 L16 12 L24 24 L28 18 L37 32Z" fill="' + c + '"/><circle cx="29" cy="10" r="4.5" fill="' + c2 + '"/>'
  if (vv === 2) m = '<path d="M20 4 L34 12 L34 28 L20 36 L6 28 L6 12Z" fill="' + c + '"/><path d="M20 13 L27 17 L27 25 L20 29 L13 25 L13 17Z" fill="#fff"/>'
  if (vv === 3) m = '<path d="M8 32 C8 14 20 6 34 6 C34 22 26 32 8 32Z" fill="' + c + '"/><path d="M10 30 L28 12" stroke="#fff" stroke-width="2.5"/>'
  if (vv === 4) m = '<path d="M6 10 L18 20 L6 30" stroke="' + c + '" stroke-width="6" fill="none" stroke-linejoin="round"/><path d="M20 10 L32 20 L20 30" stroke="' + c2 + '" stroke-width="6" fill="none" stroke-linejoin="round"/>'
  if (vv === 5) m = '<rect x="5" y="5" width="13" height="13" rx="3" fill="' + c + '"/><rect x="22" y="5" width="13" height="13" rx="3" fill="' + c2 + '"/><rect x="5" y="22" width="13" height="13" rx="3" fill="' + c2 + '"/><rect x="22" y="22" width="13" height="13" rx="7" fill="' + c + '"/>'
  if (vv === 6) m = '<path d="M4 15 Q12 7 20 15 T36 15" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M4 27 Q12 19 20 27 T36 27" stroke="' + c2 + '" stroke-width="5" fill="none" stroke-linecap="round"/>'
  if (vv === 7) m = '<circle cx="20" cy="11" r="7" fill="' + c + '"/><circle cx="11" cy="25" r="7" fill="' + c2 + '"/><circle cx="29" cy="25" r="7" fill="' + c + '" opacity=".8"/>'
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 100 40" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + m + '<rect x="44" y="11" width="' + (38 + (i * 7) % 16) + '" height="8" rx="4" fill="#1B3A5C"/><rect x="44" y="24" width="' + (26 + (i * 5) % 14) + '" height="5" rx="2.5" fill="' + c + '"/></svg>'
}
function logoPart(v: VueMaster, i: number, w: number, h: number): string {
  const p = v.partenaires[i]
  if (p && p.logo && urlSure(p.logo)) return '<img alt="" src="' + urlSure(p.logo) + '" style="max-width:' + w + 'px;max-height:' + h + 'px;object-fit:contain">'
  return plogo(i, w, h)
}
let pbN = 0
/** Marqueur : le bandeau partenaires est deplace EN BAS de l'ecran (Romain,
 *  31/10) — dans le pied (sous le bouton) ou le dock (au-dessus de la barre de
 *  navigation), sinon en bas de l'ecran. Voir placerBandeau(). */
const BAND = '<!--BAND-->'
function placerBandeau(v: VueMaster, html: string): string {
  if (html.indexOf(BAND) < 0) return html
  html = html.split(BAND).join('')
  const b = pband(v).replace('class="pband"', 'class="pband bas"')
  if (!b) return html
  const iDock = html.lastIndexOf('<div class="dock">')
  if (iDock >= 0) {
    const iNav = html.indexOf('<nav class="nav">', iDock)
    return iNav >= 0 ? html.slice(0, iNav) + b + html.slice(iNav) : html.slice(0, html.length - 6) + b + html.slice(html.length - 6)
  }
  if (html.lastIndexOf('<div class="foot">') >= 0) {
    const fin = html.lastIndexOf('</div></div>')
    return html.slice(0, fin) + b + html.slice(fin)
  }
  return html.slice(0, html.length - 6) + b + html.slice(html.length - 6)
}
/** Bandeau defilant « Nos partenaires » (logos). Absent si l'animation n'a aucun partenaire. */
function pband(v: VueMaster): string {
  if (!v.partenaires.length) return ''
  const off = (pbN * 118) % 708, del = (pbN * 3.2) % 26; pbN++
  const it = v.partenaires.map(function (p, i) { return '<span class="vg"><span class="plogo" style="width:108px;height:54px">' + logoPart(v, i, 88, 34) + '</span><b>' + esc(p.nom) + '</b></span>' }).join('')
  return '<div class="pband" data-go="c-partenaires"><div class="ph2">Nos partenaires<span>Voir tout ' + icon('chevR', 14, 2.4) + '</span></div><div class="mq"><div class="mqi" style="transform:translateX(-' + off + 'px);animation-delay:-' + del.toFixed(1) + 's">' + it + it + '</div></div></div>'
}
function navbar(on: string): string {
  const it = [['play', 'Jouer', 's-accueil'], ['store', 'Commerces', 'c-commerces'], ['handshake', 'Partenaires', 'c-partenaires'], ['user', 'Profil', 'c-profil']]
  return '<nav class="nav">' + it.map(function (x) { return '<a data-go="' + x[2] + '" class="' + (on === x[2] ? 'on' : '') + '">' + icon(x[0], 23) + x[1] + '</a>' }).join('') + '</nav>'
}
function dock(o: { cta?: string; nav?: string | false }): string { return '<div class="dock">' + (o.cta ? '<div class="cta">' + o.cta + '</div>' : '') + (o.nav === false ? '' : navbar(o.nav || '')) + '</div>' }
function etapes(i: number): string {
  const e = ['Jouer', 'Résultat', 'Mon ticket']
  return '<div class="etapes">' + e.map(function (t, k) { return (k ? '<span class="s' + (k <= i ? ' on' : '') + '"></span>' : '') + '<span class="e' + (k === i ? ' on' : k < i ? ' done' : '') + '"><i>' + (k < i ? '✓' : k + 1) + '</i>' + t + '</span>' }).join('') + '</div>'
}
function confetti(n: number, seed?: number, base?: number): string {
  base = base || 0
  const R = rnd(seed || 7), cols = ['#3B5CC4', '#00B4A0', '#0B9E6E', '#F59E0B', '#7C5CC4', '#6A93FF']
  let h = '<div class="confetti" aria-hidden="true">'
  for (let i = 0; i < n; i++) { const w = 6 + R() * 8, ht = R() > .5 ? w : w * 1.6, c = cols[Math.floor(R() * cols.length)]; h += '<i style="left:' + n1(R() * 390) + 'px;width:' + n1(w) + 'px;height:' + n1(ht) + 'px;background:' + c + ';border-radius:' + (R() > .5 ? '50%' : '3px') + ';--dx:' + n1((R() - .5) * 120) + 'px;--r:' + Math.floor(R() * 720 - 360) + 'deg;--t:' + n1(1.8 + R() * 1.6) + 's;--d:' + n1(base + R() * .6) + 's"></i>' }
  return h + '</div>'
}
function homeDeco(): string { return geo([['c', 272, 214, 130, 'var(--c)', 0, 0], ['h', 318, 320, 84, 'var(--c3)', 0, .1], ['o', 246, 222, 36, 'var(--c2)', 0, .2]]) }
function tirLigne(v: VueMaster): string { return '<div class="tirline">' + icon('cal', 20) + 'Tirage au sort le ' + txt(v.tirage) + '</div>' }
function nbLots(n: number): string { return n + ' lot' + (n > 1 ? 's' : '') }
function codeTicket(r: EtatPartie): string { return r.ticket || 'TK-0000' }
function numCourt(code: string): string { const m = String(code).match(/(\d{3,})\s*$/); return m ? m[1].slice(-4) : code }

/* ── Ecrans ────────────────────────────────────────────────────────────── */
type Ecran = { r: (v: VueMaster, r: EtatPartie) => string; tall?: boolean }
const S: Record<string, Ecran> = {}

S['s-flash'] = { r: function (v) {
  const logo = v.who.logo && urlSure(v.who.logo)
  return '<div class="scr" style="--bg:var(--home);background:var(--home)">' + barre() + geo([['c', 95, 150, 200, 'var(--c)', 0, 0], ['h', 40, 330, 120, 'var(--c3)', 0, .15], ['r', 268, 312, 64, '#fff', 18, .25], ['o', 282, 110, 56, '#fff', 0, .3]]) +
    '<div class="body" style="align-items:center;text-align:center;padding-top:150px">' +
    '<div class="a-pop" style="--d:.45s;width:130px;height:130px;border-radius:38px;background:#fff;border:1.5px solid var(--line);display:grid;place-items:center;overflow:hidden">' + (logo ? '<img class="fm-logo" alt="" src="' + logo + '" style="width:110px;height:110px">' : '<span class="mono" style="width:94px;height:94px;border-radius:28px;font-size:33px">' + esc(v.who.mono) + '</span>') + '</div>' +
    '<div class="a-rise card" style="--d:.75s;margin-top:150px;padding:18px 22px;width:100%"><div class="kicker" style="color:var(--muted)">Bienvenue chez</div><div class="h2" style="font-size:29px;margin-top:6px">' + esc(v.who.nom) + '</div><p class="sub" style="margin-top:6px">qui t\'offre une partie gratuite</p></div></div>' +
    foot(btn('Découvrir le jeu', 's-accueil', 'a-rise', ' style="--d:1s"') + '<div class="mention">Jeu proposé avec <b style="color:var(--ink);font-weight:800">Flow<span style="color:var(--fl-blue)">in</span></b></div>') + '</div>'
} }

S['s-accueil'] = { tall: true, r: function (v) {
  const q = v.key === 'quiz'
  const hero = v.images.hero && urlSure(v.images.hero)
  return '<div class="scr" style="--bg:var(--home);background:var(--home)">' + barre() + (q ? '' : homeDeco()) + hdr(v) + BAND +
    '<div class="body">' + (q
      ? '<div class="heroband"' + (hero ? ' style="background:linear-gradient(135deg,rgba(27,58,92,.82),rgba(59,92,196,.72)),url(' + hero + ') center/cover"' : '') + '>' + geo([['c', 230, -40, 150, 'rgba(255,255,255,.08)'], ['h', 268, 118, 96, 'var(--c3)']]) + '<div class="kicker">' + esc(v.who.nom) + '</div><h1 class="big a-rise" style="color:#fff">Jouer<br>et gagner</h1><p style="font-size:14.5px;font-weight:600;color:rgba(255,255,255,.85);margin-top:8px">' + esc(v.accueilSous) + '</p></div>'
      : '<div class="kicker" style="margin-top:10px">' + esc(v.who.nom) + '</div><h1 class="big a-rise">Jouer<br>et gagner</h1>') +
    '<div class="card gain a-rise" style="--d:.1s"><div class="lbl"><span>À gagner</span><span style="letter-spacing:.04em;text-transform:none">' + nbLots(v.lots.length) + '</span></div>' + v.lots.map(function (l) { return lotRow(v, l) }).join('') + tirLigne(v) + '</div>' +
    '<div style="font-size:17px;font-weight:800;margin-top:20px">Comment jouer ?</div><div class="card howto a-rise" style="--d:.2s">' + v.how.map(function (h, i) { return '<div class="how"><span class="n">' + (i + 1) + '</span><div><b>' + esc(h[0]) + '</b><span>' + esc(h[1]) + '</span></div></div>' }).join('') + '</div>' +
    '<div class="mention" style="text-align:left;margin-top:10px">' + FIN_OK + ' · ' + esc(v.achat) + ' chez ce commerçant</div>' +
    '<button class="lnk" data-pwa-entree data-go="c-raccourci" style="text-align:left;padding-left:0">' + icon('phone', 18, 2) + ' Installer le raccourci sur mon téléphone</button></div>' +
    dock({ cta: btn('Je joue maintenant', 's-regles', 'a-pulse'), nav: 's-accueil' }) + '</div>'
} }

S['s-regles'] = { r: function (v) {
  const reg = (v.key === 'spin' || v.key === 'tombola')
  return '<div class="scr bg-w">' + barre() + hdr(v, { back: 's-accueil' }) + BAND + etapes(0) +
    '<div class="body"><div class="kicker" style="margin-top:14px">Règles du jeu</div><h2 class="h2">Avant de jouer</h2>' +
    '<div class="card infobox">' +
    '<div class="inforow">' + icon('store', 21) + '<span><b style="color:var(--ink)">1 partie par jour et par commerce</b><br>À jouer sur place, en flashant le QR</span></div>' +
    '<div class="inforow">' + icon('ticket', 21) + '<span><b style="color:var(--ink)">' + esc(v.achat) + '</b><br>Chaque commerce choisit sa règle</span></div>' +
    '<div class="inforow">' + icon('cal', 21) + '<span><b style="color:var(--ink)">Tirage au sort le ' + txt(v.tirage) + '</b><br>Les gagnants sont prévenus par email</span></div>' +
    '<div class="inforow">' + icon('users', 21) + '<span><b style="color:var(--ink)">Parrainage</b><br>' + esc(v.parrain) + '</span></div>' +
    (reg ? '<div class="inforow">' + icon('info', 21) + '<span>Cases, lots et chances sont réglés par le commerce et par Flowin.</span></div>' : '') +
    '</div></div>' + foot(btn('C\'est parti', PREMIER_ECRAN[v.key] || 'q-question')) + '</div>'
} }

/* Quiz */
function quizScreen(v: VueMaster, r: EtatPartie, state: 'idle' | 'ok' | 'ko'): string {
  const q = v.questions[r.qi] || { txt: '[question à compléter]', opts: ['[réponse]', '[réponse]'], ok: 0, expl: '' }
  const tot = v.questions.length || 1, ring = 138.2, left = 30
  const choix = r.rep[r.qi]
  let h = '<div class="scr ' + (v.key === 'quiz' ? 'stage' : 'bg-o') + '">' + barre() + '<div class="qtop"><button class="iconbtn" data-go="s-accueil" aria-label="Quitter">' + icon('x', 20, 2) + '</button><div class="mid"><small>QUESTION ' + (r.qi + 1) + ' / ' + tot + '</small><div class="prog">' + v.questions.map(function (_, i) { return '<i class="' + (i <= r.qi ? 'on' : '') + '"></i>' }).join('') + '</div></div>' +
    '<div class="timer"><svg width="54" height="54" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" fill="#fff" stroke="#E7ECF3" stroke-width="5"/><circle class="tring" cx="27" cy="27" r="22" fill="none" stroke="var(--ring,var(--c))" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + ring + '" stroke-dashoffset="' + (state === 'idle' ? 0 : n1(ring * .6)) + '"/></svg><b class="tnum">' + (state === 'idle' ? left : '') + '</b></div></div>' +
    BAND + '<div class="body"><div class="card qcard">' + geo([['c', 290, -40, 100, 'var(--c2)']]) + '<div class="kicker" style="position:relative">' + esc(v.who.nom) + '</div><h2 class="qtxt">' + esc(q.txt) + '</h2></div><div class="opts">'
  q.opts.forEach(function (o, i) {
    let cls = '', end = ''
    if (state === 'ok') { if (i === q.ok) { cls = 'ok'; end = icon('check', 24, 3) } else cls = 'faded' }
    if (state === 'ko') { if (i === choix) { cls = 'ko'; end = icon('x', 22, 3) } else if (i === q.ok) { cls = 'reveal'; end = '<span style="color:var(--ok)">' + icon('check', 24, 3) + '</span>' } else cls = 'faded' }
    h += '<button class="opt ' + cls + '"' + (state === 'idle' ? ' data-rep="' + i + '"' : '') + '><span class="k">' + 'ABCDEF'[i] + '</span><span>' + esc(o) + '</span><span class="end">' + end + '</span></button>'
  })
  h += '</div>' + (state === 'idle' ? '<p class="mention">Touche une réponse</p>' : '') + '</div>'
  const suite = r.qi + 1 < v.questions.length ? 'q-suivante' : 'q-resultat'
  const lblSuite = r.qi + 1 < v.questions.length ? 'Question suivante' : 'Voir mon score'
  if (state === 'ok') h += confetti(30, 5) + '<div class="fb"><div class="fh"><span class="badge" style="background:var(--ok)">' + icon('check', 26, 3) + '</span><h3 style="color:var(--ok)">Bonne réponse&nbsp;!</h3></div><p>' + esc(q.expl) + '</p>' + btn(lblSuite, suite) + '</div>'
  if (state === 'ko') h += '<div class="fb"><div class="fh"><span class="badge" style="background:var(--ko)">' + icon('x', 24, 3) + '</span><h3 style="color:var(--ko)">' + (choix == null ? 'Temps écoulé…' : 'Pas tout à fait…') + '</h3></div><p>La bonne réponse était <b>' + esc(q.opts[q.ok]) + '</b>. ' + esc(q.expl) + '</p>' + btn(lblSuite, suite) + '</div>'
  return h + '</div>'
}
S['q-question'] = { r: function (v, r) { return quizScreen(v, r, 'idle') } }
S['q-bonne'] = { r: function (v, r) { return quizScreen(v, r, 'ok') } }
S['q-mauvaise'] = { r: function (v, r) { return quizScreen(v, r, 'ko') } }
S['q-resultat'] = { r: function (v, r) {
  const bonus = v.key === 'quiz' && v.bonus.length > 0, tot = v.questions.length, parfait = r.bonnes >= tot && tot > 0
  const pct = tot ? r.bonnes / tot : 0
  return '<div class="scr ' + (v.key === 'quiz' ? 'stage' : 'bg-w') + '">' + (parfait ? confetti(36, 9) : '') + barre() + hdr(v) + BAND + etapes(1) +
    '<div class="body" style="text-align:center"><div class="kicker" style="margin-top:12px">Ton score</div>' +
    '<div class="ring"><svg width="206" height="206" viewBox="0 0 206 206"><circle cx="103" cy="103" r="92" fill="none" stroke="#E7ECF3" stroke-width="14"/><circle class="arc" cx="103" cy="103" r="92" fill="none" stroke="var(--ring,var(--c))" stroke-width="14" stroke-linecap="round" style="stroke-dashoffset:' + n1(578 * (1 - pct)) + '"/></svg><div class="v"><b class="score num" data-score="' + r.bonnes + '" data-tot="' + tot + '">' + r.bonnes + '/' + tot + '</b><small>bonnes réponses</small></div></div>' +
    '<h2 class="h2 a-rise" style="--d:1.1s;margin-top:14px;font-size:34px">' + (parfait ? 'Sans faute&nbsp;!' : 'Presque&nbsp;!') + '</h2>' +
    (parfait
      ? '<div class="card reward a-rise" style="--d:1.3s">' + glyph(L('ticket', '1', 'ticket')) + '<div class="tx"><small>Tu gagnes</small><b>1 ticket pour le tirage</b><span>Tirage le ' + txt(v.tirage) + '</span></div></div>'
      : '<div class="card reward a-rise" style="--d:1.3s">' + glyph(L('ticket', '0', 'ticket')) + '<div class="tx"><small>Il faut ' + tot + '/' + tot + ' pour le ticket</small><b>' + (bonus ? 'Les questions bonus te donnent un ticket' : 'Reviens demain pour retenter') + '</b><span>Tirage le ' + txt(v.tirage) + '</span></div></div>') +
    '</div>' +
    foot(bonus ? btn('Questions bonus : +1 ticket', 'q-bonusintro', 'a-pulse', ' style="background:#fff;color:var(--fl-ink)"') + '<button class="lnk" data-go="c-parrainage" data-after="c-ticket">Passer et valider mon ticket</button>' : btn(parfait ? 'Valider mon ticket' : 'Enregistrer ma participation', 'c-parrainage', '', ' data-after="c-ticket"')) + '</div>'
} }
S['q-bonusintro'] = { r: function (v) {
  return '<div class="scr bg-s">' + barre() + geo([['c', 90, 140, 210, '#fff'], ['h', 230, 300, 120, 'var(--c)', 0, .15], ['o', 60, 120, 60, 'var(--c3)', 0, .25]]) + hdr(v) +
    '<div class="body" style="text-align:center;align-items:center"><div class="card a-pop" style="--d:.3s;margin-top:70px;width:150px;height:150px;border-radius:44px;display:grid;place-items:center"><span class="glyph g-ticket" style="width:104px;height:104px;border-radius:30px"><b style="font-size:40px">+1</b><small style="font-size:12px">ticket</small></span></div>' +
    '<h2 class="h2 a-rise" style="--d:.5s;margin-top:80px;font-size:32px">Réponds aux<br>questions bonus,</h2><div class="a-rise" style="--d:.6s;font-size:22px;font-weight:800;color:var(--c-ink);margin-top:6px">gagne un ticket supplémentaire</div><p class="sub a-rise" style="--d:.7s">' + v.bonus.length + ' questions rapides pour aider ' + esc(v.who.nom) + ' à mieux te connaître.</p></div>' +
    foot(btn('Je réponds', 'q-bonus') + '<button class="lnk" data-go="c-parrainage" data-after="c-ticket">Plus tard</button>') + '</div>'
} }
S['q-bonus'] = { tall: true, r: function (v) {
  const n = v.bonus.length
  return '<div class="scr bg-o">' + barre() + hdr(v, { back: 'q-bonusintro', title: 'Questions bonus', small: n + ' questions · +1 ticket' }) +
    '<div class="body" style="padding-top:4px"><span class="plus1" style="align-self:flex-start"><i>+1</i>ticket supplémentaire</span>' +
    v.bonus.map(function (q, i) { return '<div class="card bcard a-rise" style="--d:' + (i * .07) + 's"><div class="kicker">Bonus ' + (i + 1) + ' / ' + n + '</div><h4>' + esc(q.label) + '</h4><div class="chips">' + q.opts.map(function (o) { return '<button class="chip" data-one="b' + i + '" data-val="' + esc(o) + '">' + esc(o) + '</button>' }).join('') + '</div></div>' }).join('') + '</div>' +
    foot(btn('Valider mes réponses', 'q-bonusvalider', '', ' data-bonus-need disabled') + '<p class="mention" data-bonus-msg>Réponds aux ' + n + ' questions pour gagner le ticket.</p><button class="lnk" data-go="c-parrainage" data-after="c-ticket">Passer</button>') + '</div>'
} }
S['q-bonusok'] = { r: function (v, r) {
  const deux = r.bonnes >= v.questions.length
  return '<div class="scr bg-w">' + confetti(36, 12) + barre() + hdr(v) + '<div class="body" style="align-items:center;text-align:center">' +
    '<div style="position:relative;width:250px;height:200px;margin-top:40px">' + (deux ? '<div style="position:absolute;left:30px;top:40px;width:190px;height:110px;border-radius:20px;background:#fff;border:1.5px solid var(--line);transform:rotate(-8deg);padding:16px;text-align:left"><small style="font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--c-ink)">TICKET QUIZ</small><b style="display:block;font-size:22px;font-weight:800;margin-top:8px" class="num">Ticket 1</b></div>' : '') +
    '<div class="a-fly" style="--d:.3s;position:absolute;left:40px;top:30px;width:190px;height:110px;border-radius:20px;background:var(--c);color:var(--c-on);transform:rotate(6deg);padding:16px;text-align:left;box-shadow:0 14px 26px rgba(27,58,92,.14)"><small style="font-size:10px;font-weight:800;letter-spacing:.14em">TICKET BONUS</small><b style="display:block;font-size:22px;font-weight:800;margin-top:8px" class="num">Ticket ' + (deux ? 2 : 1) + '</b></div>' +
    '<span class="a-pop" style="--d:.9s;position:absolute;right:-6px;top:0;width:64px;height:64px;border-radius:50%;background:#fff;border:1.5px solid var(--ink);display:grid;place-items:center;font-size:23px;font-weight:800">+1</span></div>' +
    '<h2 class="big a-rise" style="--d:1s;font-size:46px;margin-top:20px">' + (deux ? '2 tickets' : '1 ticket') + '</h2><p class="sub a-rise" style="--d:1.1s">Merci pour tes réponses&nbsp;! ' + (deux ? 'Tes deux tickets sont prêts' : 'Ton ticket est prêt') + ', il ne reste qu\'à ' + (deux ? 'les' : 'le') + ' valider.</p></div>' + foot(btn(deux ? 'Valider mes tickets' : 'Valider mon ticket', 'c-parrainage', '', ' data-after="c-ticket"')) + '</div>'
} }

/* Inscription et gain */
S['c-inscription'] = { tall: true, r: function (v, r) {
  const ages = ['Moins de 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65 et +'], src = ['Instagram', 'Facebook', 'Affiche', 'Bouche à oreille', 'Autre']
  const imm = r.after === 'c-billet'
  const lotGagne = imm ? (r.caseIdx != null && v.cases[r.caseIdx] ? L('produit', '1', 'offert', v.cases[r.caseIdx].label, 'Gain immédiat', 'imm') : v.billet) : null
  const rec = imm && lotGagne ? { gl: lotGagne, t: lotGagne.nom, s: 'Gain immédiat · ton billet est prêt' } : { gl: L('ticket', '1', 'ticket'), t: v.key === 'vote' ? 'Ton ticket pour la loterie' : 'Ton ticket pour le tirage', s: 'Tirage au sort le ' + v.tirage }
  const p = r.profil || {}
  return '<div class="scr bg-w">' + barre() + hdr(v, { back: 'c-parrainage', title: 'Dernière étape', small: 'Tes coordonnées' }) + etapes(2) +
    '<div class="body" style="padding-top:12px"><h2 class="h2" style="font-size:28px">Où t\'envoyer<br>ton gain ?</h2>' +
    '<div class="card recap">' + glyph(rec.gl) + '<div><b>' + txt(rec.t) + '</b><small>' + txt(rec.s) + '</small></div></div>' +
    '<div class="two"><div class="fld"><label for="f1">Prénom</label><input id="f1" class="inp" autocomplete="given-name" value="' + esc(p.prenom || '') + '"></div><div class="fld"><label for="f2">Nom</label><input id="f2" class="inp" autocomplete="family-name" value="' + esc(p.nom || '') + '"></div></div>' +
    '<div class="fld"><label for="f3">Email</label><input id="f3" class="inp" type="email" autocomplete="email" value="' + esc(p.email || '') + '"></div>' +
    '<div class="fld"><label for="f4">Téléphone</label><input id="f4" class="inp" type="tel" autocomplete="tel" value="' + esc(p.tel || '') + '"></div>' +
    '<div class="fld"><div class="lab">Sexe <span class="opt-l">facultatif</span></div><div class="seg" role="radiogroup" aria-label="Sexe"><button data-seg data-genre="Homme">Homme</button><button data-seg data-genre="Femme">Femme</button></div></div>' +
    '<div class="fld"><div class="lab">Tranche d\'âge</div><div class="ages">' + ages.map(function (a) { return '<button class="chip' + (p.age === a ? ' on' : '') + '" data-one="age" data-val="' + esc(a) + '">' + a + '</button>' }).join('') + '</div></div>' +
    '<div class="fld"><label for="f6">Code postal</label><input id="f6" class="inp" inputmode="numeric" autocomplete="postal-code" style="width:50%" value="' + esc(p.cp || '') + '"></div>' +
    '<div class="fld"><div class="lab">Comment nous as-tu connus ?</div><div class="chips">' + src.map(function (s) { return '<button class="chip" data-one="src" data-val="' + esc(s) + '">' + s + '</button>' }).join('') + '</div></div>' +
    '<div style="margin-top:16px"><div class="consent" data-tog data-req data-consent="jeu" role="checkbox" aria-checked="false" tabindex="0"><span class="box">' + icon('check', 16, 3) + '</span><div><p>J\'autorise Flowin à conserver mes coordonnées uniquement dans le cadre du jeu. Mes données ne sont ni échangées ni revendues.</p><em class="req">Obligatoire</em></div></div>' +
    '<div class="consent" data-tog data-consent="anim" role="checkbox" aria-checked="false" tabindex="0"><span class="box">' + icon('check', 16, 3) + '</span><div><p>J\'autorise Flowin à me faire participer à ses animations.</p><em>Facultatif</em></div></div></div>' +
    (r.erreur ? '<p class="fm-err" role="alert">' + esc(r.erreur) + '</p>' : '') + '</div>' +
    foot(btn(r.envoi ? 'Envoi…' : 'Valider et recevoir mon gain', 'c-valider', '', ' data-need disabled') + '<p class="mention">Coche la première case pour valider.</p>') + '</div>'
} }

S['c-billet'] = { tall: true, r: function (v, r) {
  const nom = r.gain ? r.gain.lot : (r.caseIdx != null && v.cases[r.caseIdx] ? v.cases[r.caseIdx].label : v.billet.nom)
  const cond = r.gain ? (r.gain.cond || 'Gain immédiat') : v.billet.cond
  const code = r.ticket || 'BL-0000-0000'
  return '<div class="scr bg-m">' + confetti(42, 3) + barre() + hdr(v, { title: 'Gagné !', small: 'Gain immédiat', back: 's-accueil' }) +
    '<div class="body" style="padding-top:2px"><h2 class="h2 a-rise" style="text-align:center;font-size:33px">Bravo, c\'est gagné&nbsp;!</h2>' +
    '<div class="billet"><div class="bt">' + geo([['c', 250, -40, 140, '#fff'], ['h', 300, 70, 70, '#fff']]) + '<small>Billet gagnant · ' + esc(v.billetChez) + '</small><h3>' + esc(nom) + '</h3><span>' + esc(cond) + '</span></div><div class="perf"><i></i><i></i></div>' +
    '<div class="bb"><div class="qrw" data-qr="' + esc(code) + '">' + qr(42, 110) + '</div><dl class="kv"><dt>N° de billet</dt><dd class="num">' + esc(code) + '</dd><dt>Valable jusqu\'au</dt><dd>' + txt(v.tirage) + '</dd><dt>Où</dt><dd>' + esc(v.billetChez) + '</dd></dl></div></div>' +
    '<p class="mention" style="color:var(--ink2);font-size:13.5px">Montre ce billet en caisse : le commerçant le valide avec son code. Il est rangé dans ton profil.</p></div>' +
    dock({ cta: btn('Parrainer mes amis', 'c-parrainage'), nav: '' }) + '</div>'
} }

S['c-ticket'] = { tall: true, r: function (v, r) {
  const parfait = r.bonnes >= v.questions.length && v.questions.length > 0
  const n = (v.key === 'quiz' || v.key === 'solo') ? ((parfait ? 1 : 0) + (r.bonusFait ? 1 : 0)) : 1
  const code = codeTicket(r)
  return '<div class="scr bg-o">' + barre() + hdr(v, { title: n ? 'Ticket validé' : 'Participation validée', small: v.key === 'vote' ? 'Loterie' : 'Tirage au sort', back: 's-accueil' }) +
    '<div class="body" style="padding-top:2px"><h2 class="h2 a-rise" style="font-size:33px">' + (n ? 'Tu es<br>dans le tirage&nbsp;!' : 'Merci<br>d\'avoir joué&nbsp;!') + '</h2>' +
    (n ? '<div class="tk"><div class="main"><small>Ticket · ' + esc(v.who.nom) + '</small><b class="num">' + esc(code) + '</b><span>Tirage au sort le ' + txt(v.tirage) + '</span></div><div class="stub"><b>N° ' + esc(numCourt(code)) + '</b></div></div>' : '') +
    '<div class="card stack a-rise" style="--d:.5s"><span class="cnt">' + n + '</span><p>' + (n > 1 ? 'tickets pour ce tirage. ' : 'ticket pour ce tirage. ') + (n ? 'On te prévient par email si tu gagnes.' : 'Fais un sans-faute demain pour gagner ton ticket.') + '</p></div>' +
    '<div class="card infobox a-rise" style="--d:.6s"><div class="inforow">' + icon('users', 21) + '<span>' + esc(v.parrain) + '</span></div><div class="inforow">' + icon('clock', 21) + 'Reviens demain : une partie par jour et par commerce</div></div></div>' +
    dock({ cta: btn('Parrainer mes amis', 'c-parrainage'), nav: '' }) + '</div>'
} }

S['c-parrainage'] = { tall: true, r: function (v, r) {
  const three = (v.key === 'spin' || v.key === 'tombola')
  const se = v.superEvent
  /* Etape AVANT les coordonnees (Romain, 31/10) : resultat -> parrainage ->
     coordonnees -> « Valider et recevoir mon gain ». */
  const avant = !r.ticket && !!r.after
  return '<div class="scr bg-w">' + barre() + hdr(v, { back: 's-accueil', title: 'Parraine tes amis', small: 'Gagne plus de chances' }) +
    '<div class="body" style="padding-top:6px"><div class="card event" style="padding:16px;margin-top:4px;background:var(--home)">' + geo([['c', 255, -30, 110, 'var(--c)'], ['o', 300, 62, 40, '#fff']]) +
    '<div class="kicker" style="color:var(--ink)">Ta récompense</div><div style="font-size:20px;font-weight:800;line-height:1.2;margin-top:6px;max-width:215px">' + esc(v.parrain) + '</div>' +
    (three ? '<div class="dots3">' + [0, 1, 2].map(function (i) { return '<i class="' + (i < r.parrainN ? 'on' : '') + '"></i>' }).join('') + '</div><div style="font-size:13px;font-weight:800;margin-top:6px">' + r.parrainN + ' ami' + (r.parrainN > 1 ? 's' : '') + ' sur 3 aujourd\'hui</div>' : '') + '</div>' +
    (avant ? '<div class="fld" style="margin-top:12px"><label for="fpar">Ton email, pour que tes parrainages te soient crédités</label><input id="fpar" class="inp" type="email" autocomplete="email" value="' + esc(r.profil && r.profil.email || '') + '" placeholder="ton@email.fr"></div>' : '') +
    '<div class="share"><button data-share="wa">' + icon('chat', 26) + 'WhatsApp</button><button data-share="sms">' + icon('sms', 26) + 'SMS</button><button data-share="mail">' + icon('mail', 26) + 'Email</button></div>' +
    '<div class="card msg"><div class="mh">Ce que reçoit ton ami</div><div class="bubble">Je joue chez ' + esc(v.who.nom) + ' : une partie gratuite par jour, des lots à gagner. Viens jouer avec moi&nbsp;! <span class="placeholder">[lien d\'invitation]</span></div>' +
    '<div class="mini">' + mono(v, 'width:40px;height:40px;font-size:13px') + '<div style="flex:1;min-width:0"><b style="display:block;font-size:14.5px;font-weight:800">' + esc(v.who.nom) + '</b><small style="display:block;font-size:12px;font-weight:600;color:var(--muted)">Fiche du commerce · ' + txt(v.commerce.adresse) + '</small></div></div>' +
    '<div class="mini"><span class="glyph g-ticket" style="width:40px;height:40px;border-radius:12px"><b style="font-size:13px">JEU</b></span><div style="flex:1"><b style="display:block;font-size:14.5px;font-weight:800">Jeu en cours : ' + esc(v.label) + '</b><small style="display:block;font-size:12px;font-weight:600;color:var(--muted)">À jouer sur place, jusqu\'au ' + txt(v.tirage) + '</small></div></div></div>' +
    (se ? '<div class="sect"><h4>Événement en cours</h4><span>Super event</span></div>' +
      '<div class="card event comic" data-go="sj-accueil" style="cursor:pointer"><span class="super-logo" style="font-size:26px">Super</span> <span class="se-word" style="font-size:22px">event</span><br><span class="tag dist" style="margin:8px 0 0">' + esc(se.nom) + '</span><div style="font-size:19px;font-weight:800;margin-top:8px;max-width:250px">Super jeu et super ticket</div><p style="font-size:13.5px;font-weight:600;color:var(--ink2);margin-top:4px;max-width:270px;line-height:1.45">Le jeu Flowin du moment, à jouer sur place dans les commerces participants. Chaque commerce joué = 1 ticket de plus.</p><button class="act" style="margin-top:12px;padding:0 16px" data-go="sj-accueil">' + icon('map', 18) + 'Voir le super event</button></div>' : '') +
    '</div>' + (avant ? foot(btn('Continuer : mes coordonnées', 'c-inscription') + '<p class="mention">Tu peux parrainer maintenant ou plus tard, depuis ton profil.</p>') : dock({ nav: '' })) + '</div>'
} }

S['c-profil'] = { tall: true, r: function (v, r) {
  const p = r.profil
  const nomComplet = p && (p.prenom || p.nom) ? ((p.prenom || '') + ' ' + (p.nom || '')).trim() : 'Mon profil'
  const ini = p && p.prenom ? (p.prenom[0] + (p.nom ? p.nom[0] : '')).toUpperCase() : 'MO'
  const parfait = r.bonnes >= v.questions.length && v.questions.length > 0
  const nbT = r.ticket ? ((v.key === 'quiz' || v.key === 'solo') ? ((parfait ? 1 : 0) + (r.bonusFait ? 1 : 0)) : 1) : 0
  const aGain = !!(r.gain || (r.after === 'c-billet' && r.ticket))
  return '<div class="scr bg-o">' + barre() + geo([['c', 318, 74, 92, 'var(--c)']]) +
    '<div class="body" style="padding-top:6px"><div style="display:flex;gap:14px;align-items:center"><button class="iconbtn" data-go="@retour" data-repli="s-accueil" aria-label="Retour">' + icon('chevL', 22, 2) + '</button><span class="avatar">' + esc(ini) + '</span><div><div class="kicker" style="color:var(--muted)">Mon profil</div><div style="font-size:23px;font-weight:800;letter-spacing:-.03em;margin-top:2px">' + esc(nomComplet) + '</div></div></div>' +
    '<div class="kpis"><div class="card kpi"><b>' + (aGain ? 1 : 0) + '</b><span>lot à retirer</span></div><div class="card kpi"><b>' + nbT + '</b><span>tickets en jeu</span></div></div>' +
    '<div class="sect"><h4>Mes lots gagnés</h4><span>Billets QR</span></div>' +
    (aGain ? '<div class="card mb" data-go="c-billet"><div style="padding:4px;border:1.5px solid var(--line);border-radius:12px">' + qr(42, 44) + '</div><div class="tx"><b>' + esc(r.gain ? r.gain.lot : v.billet.nom) + '</b><small>' + esc(v.billetChez) + '</small><span class="tag imm">À retirer</span></div>' + icon('chevR', 20, 2) + '</div>'
      : '<div class="card" style="padding:14px 16px;font-size:14px;font-weight:600;color:var(--ink2)">Aucun lot pour l\'instant. Tes billets gagnants arriveront ici.</div>') +
    '<div class="sect"><h4>Mes tickets</h4><span>Tirage le ' + esc(courte(v.tirage)) + '</span></div>' +
    (nbT ? '<div class="mt"><span class="l"></span><div class="c"><b class="num">' + esc(r.ticket) + '</b><small>' + esc(v.who.nom) + ' · aujourd\'hui</small></div><div class="r">' + icon('ticket', 22) + '</div></div>' : '<div class="card" style="padding:14px 16px;font-size:14px;font-weight:600;color:var(--ink2)">Pas encore de ticket aujourd\'hui.</div>') +
    '<div class="sect"><h4>Mes coordonnées</h4></div>' +
    '<div class="card rows"><div><span>Prénom, nom</span><b>' + (p && (p.prenom || p.nom) ? esc(nomComplet) : '<span class="placeholder">[à saisir en jouant]</span>') + '</b></div><div><span>Email</span><b>' + (p && p.email ? esc(p.email) : '<span class="placeholder">[email saisi]</span>') + '</b></div><div><span>Téléphone</span><b>' + (p && p.tel ? esc(p.tel) : '<span class="placeholder">[téléphone saisi]</span>') + '</b></div><div><span>Code postal</span><b>' + (p && p.cp ? esc(p.cp) : '<span class="placeholder">[saisi]</span>') + '</b></div><div><span>Tranche d\'âge</span><b>' + (p && p.age ? esc(p.age) : '<span class="placeholder">[saisie]</span>') + '</b></div></div>' +
    '<button class="card action" data-go="c-connexion"><span class="ai">' + icon('key', 22) + '</span><div style="flex:1"><b>Créer un mot de passe</b><small>Ton espace client : tickets et lots retrouvés partout</small></div>' + icon('chevR', 20, 2) + '</button>' +
    '<button class="card action" data-pwa-entree data-go="c-raccourci"><span class="ai">' + icon('phone', 22) + '</span><div style="flex:1"><b>Installer le raccourci sur mon téléphone</b><small>Flowin en un geste, comme une application</small></div>' + icon('chevR', 20, 2) + '</button>' +
    '<button class="card action" data-go="c-parrainage"><span class="ai">' + icon('users', 22) + '</span><div style="flex:1"><b>Parrainer mes amis</b><small>WhatsApp, SMS ou email</small></div>' + icon('chevR', 20, 2) + '</button>' +
    '</div>' + dock({ nav: 'c-profil' }) + '</div>'
} }

S['c-connexion'] = { tall: true, r: function (v, r) {
  return '<div class="scr bg-w">' + barre() + hdr(v, { back: 'c-profil', title: 'Mon espace', small: 'Connexion', noMe: true }) +
    '<div class="body"><h2 class="h2" style="margin-top:6px">Retrouve tes tickets<br>et tes lots</h2><p class="sub" style="font-size:14.5px">Connecte-toi avec l\'email ou le téléphone donné en jouant.</p>' +
    '<div class="seg" style="margin-top:16px"><button class="on" data-seg data-cx="email">Email</button><button data-seg data-cx="tel">Téléphone</button></div>' +
    '<div class="fld"><label for="c1" data-cx-lbl>Ton email</label><input id="c1" class="inp" type="email" autocomplete="email" value="' + esc(r.profil && r.profil.email || '') + '"></div>' +
    btn('Recevoir mon code de connexion', 'c-code', '', ' style="margin-top:16px"') +
    '<div class="card" style="padding:16px;margin-top:22px"><div style="display:flex;gap:12px;align-items:center"><span class="sicon" style="width:46px;height:46px;border-radius:14px">' + icon('key', 22) + '</span><div><b style="display:block;font-size:16.5px;font-weight:800">Créer un mot de passe</b><small style="display:block;font-size:12.5px;font-weight:600;color:var(--muted)">Facultatif : pour te connecter sans code</small></div></div>' +
    '<div class="fld"><label for="c2">Mot de passe</label><input id="c2" class="inp" type="password" autocomplete="new-password"></div>' +
    '<div class="fld"><label for="c3">Confirme le mot de passe</label><input id="c3" class="inp" type="password" autocomplete="new-password"></div>' +
    '<button class="btn line" style="margin-top:14px" data-go="c-mdp">Créer mon espace client</button>' + (r.erreur ? '<p class="fm-err" role="alert">' + esc(r.erreur) + '</p>' : '') + '</div></div>' + dock({ nav: 'c-profil' }) + '</div>'
} }

function dotsI(): string { return '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>' }
function raccourci(v: VueMaster, os: string): string {
  const ios = os === 'ios'
  const stI = [['Ouvre cette page dans <b>Safari</b>', ''], ['Touche le bouton <b>Partager</b>', icon('share', 18, 2)], ['Fais défiler, choisis <b>« Sur l\'écran d\'accueil »</b>', icon('plus', 18, 2)], ['Touche <b>« Ajouter »</b> en haut à droite', '']]
  const stA = [['Ouvre cette page dans <b>Chrome</b>', ''], ['Touche le menu <b>⋮</b> en haut à droite', dotsI()], ['Choisis <b>« Installer l\'application »</b> ou <b>« Ajouter à l\'écran d\'accueil »</b>', icon('plus', 18, 2)], ['Confirme avec <b>« Installer »</b>', '']]
  function steps(list: string[][], k: string) { return '<div class="card infobox" data-os="' + k + '" style="margin-top:12px;' + ((k === 'ios') === ios ? '' : 'display:none') + '">' + list.map(function (x, i) { return '<div class="inforow"><b style="color:var(--c-ink);width:22px;font-size:17px">' + (i + 1) + '</b><span style="flex:1">' + x[0] + '</span>' + (x[1] ? '<span class="sicon" style="width:36px;height:36px;border-radius:11px">' + x[1] + '</span>' : '') + '</div>' }).join('') + '</div>' }
  return '<div class="scr bg-o">' + barre() + hdr(v) + '<div class="body"><div class="kicker" style="margin-top:8px">' + esc(v.who.nom) + '</div><h1 class="big">Jouer<br>et gagner</h1><div class="card gain">' + v.lots.slice(0, 1).map(function (l) { return lotRow(v, l) }).join('') + '</div></div>' +
    '<div class="veil" data-go="@retour"></div><div class="sheet"><div class="grab"></div><h3 style="font-size:24px;font-weight:800;letter-spacing:-.03em;line-height:1.1">Installe le raccourci<br>sur ton téléphone</h3>' +
    '<div class="seg" style="margin-top:14px"><button class="' + (ios ? 'on' : '') + '" data-one="os" data-osv="ios">iPhone</button><button class="' + (ios ? '' : 'on') + '" data-one="os" data-osv="and">Android</button></div>' +
    steps(stI, 'ios') + steps(stA, 'and') + '<p class="mention" style="text-align:left" data-os-note>' + (ios ? 'Sur iPhone, le raccourci s\'installe depuis Safari uniquement.' : 'Sur Android, depuis Chrome (ou le navigateur du téléphone).') + '</p>' +
    '<button class="btn" data-pwa-installer style="display:none;margin-top:12px;width:100%">Installer maintenant</button>' +
    '<div style="margin-top:12px">' + btn('C\'est fait, c\'est installé', '@retour', '', ' data-pwa-fait') + '</div>' +
    '<button class="lnk" data-pwa-refus data-go="@retour" style="display:block;margin:10px auto 0;text-align:center">Plus tard</button></div></div>'
}
S['c-raccourci'] = { r: function (v) { return raccourci(v, 'ios') } }
S['c-raccourci-a'] = { r: function (v) { return raccourci(v, 'and') } }

S['c-commerces'] = { tall: true, r: function (v) {
  return '<div class="scr bg-o">' + barre() + '<div class="body" style="padding-top:4px"><button class="iconbtn" data-go="@retour" data-repli="s-accueil" aria-label="Retour" style="margin-bottom:8px">' + icon('chevL', 22, 2) + '</button><div class="kicker">Où jouer</div><h2 class="h2">Les commerces</h2>' +
    (v.demo ? '<div class="toggle"><button class="on">' + icon('list', 18, 2) + 'Liste</button><button data-go="c-carte">' + icon('map', 18, 2) + 'Carte</button></div>' : (v.superEvent && v.superEvent.id ? '<div class="toggle"><button class="on">' + icon('list', 18, 2) + 'Liste</button><a href="/se/' + encodeURIComponent(v.superEvent.id) + '" style="text-decoration:none;color:inherit;display:flex;align-items:center;justify-content:center;gap:8px;flex:1;font-weight:800;font-size:15px">' + icon('map', 18, 2) + 'Carte</a></div>' : '<div style="height:12px"></div>')) +
    v.commerces.map(function (p, i) { return '<div class="card pcard a-rise" style="--d:' + (i * .05) + 's" ' + (p.href ? 'data-href="' + esc(p.href) + '"' : 'data-go="c-fiche"') + '><span class="pmono" style="background:' + ['#E6F7F4', '#EAEFFB', '#F4F6F9'][i % 3] + ';color:' + ['#00796B', '#2C49A6', '#8E3B6E'][i % 3] + '">' + esc(p.mono) + '</span><div class="tx"><b>' + esc(p.nom) + '</b><small>' + (p.cat ? esc(p.cat) + ' · ' : '') + txt(p.adresse || '[adresse à compléter]') + '</small>' + (p.enjeu ? '<div class="enjeu">En jeu : ' + txt(p.enjeu) + '</div>' : '') + '<div class="surplace">' + icon('pin', 15, 2) + 'À jouer sur place chez le commerçant</div></div>' + icon('chevR', 20, 2) + '</div>' }).join('') +
    v.partenaires.filter(function (p) { return p.sponsor }).map(function (p) { return '<div class="card pcard"><span class="pmono" style="background:#fff;color:var(--ink)">' + esc(p.nom.slice(0, 2).toUpperCase()) + '</span><div class="tx"><b>' + esc(p.nom) + '</b><small>Sponsor de l\'événement</small>' + (p.distance ? '<span class="tag dist">Participation à distance autorisée</span>' : '') + '</div></div>' }).join('') +
    '</div>' + dock({ nav: 'c-commerces' }) + '</div>'
} }

function mapSvg(): string {
  return '<svg class="base" viewBox="0 0 390 560" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><rect width="390" height="560" fill="#EEF2F7"/>' +
    '<path d="M-20 400 C 80 370 120 440 210 420 S 340 350 420 380 L420 440 C 340 410 290 480 210 480 S 80 440 -20 470Z" fill="#D6E6F0"/>' +
    '<path d="M30 140 C 70 110 140 120 150 170 S 110 250 60 240 S 0 180 30 140Z" fill="#E3F1EA"/><path d="M270 480 C 320 460 380 480 380 520 S 320 570 280 550 S 240 500 270 480Z" fill="#E3F1EA"/>' +
    '<g stroke="#fff" stroke-width="16" stroke-linecap="round" fill="none"><path d="M-10 300 L400 260"/><path d="M120 -10 L170 620"/><path d="M290 -10 C 270 150 300 300 260 620"/><path d="M-10 190 C 120 210 250 190 400 140"/></g>' +
    '<g fill="#DCE3EC"><rect x="185" y="90" width="80" height="60" rx="10"/><rect x="25" y="320" width="80" height="50" rx="10"/><rect x="190" y="300" width="70" height="44" rx="10"/><rect x="310" y="180" width="60" height="70" rx="10"/></g></svg>'
}
function mapPins(pins: (number | string)[][]): string { return pins.map(function (p, i) { return '<div class="pin ' + p[2] + ' a-pop" style="left:' + p[0] + 'px;top:' + p[1] + 'px;--d:' + (i * .08) + 's"><div class="p">' + (String(p[2]).indexOf('done') >= 0 ? icon('check', 20, 3) : '<b>' + p[3] + '</b>') + '</div></div>' }).join('') }
S['c-carte'] = { tall: true, r: function (v) {
  return '<div class="scr bg-o">' + barre() + '<div style="padding:0 20px 10px;flex:none"><button class="iconbtn" data-go="@retour" data-repli="s-accueil" aria-label="Retour" style="margin-bottom:8px">' + icon('chevL', 22, 2) + '</button><div class="toggle" style="margin-top:0"><button data-go="c-commerces">' + icon('list', 18, 2) + 'Liste</button><button class="on">' + icon('map', 18, 2) + 'Carte</button></div></div>' +
    '<div class="map">' + mapSvg() + mapPins([[90, 260, 'done'], [200, 215, 'done'], [315, 170, 'todo', 3], [230, 370, 'todo here', 4], [80, 400, 'todo', 5], [330, 520, 'todo', 6]]) +
    '<div class="card msheet"><div style="display:flex;gap:12px;align-items:center"><span class="pmono" style="background:#EAEFFB;color:#8F5400;width:48px;height:48px">' + esc(v.who.mono) + '</span><div style="flex:1"><div class="kicker" style="font-size:10.5px">À jouer aujourd\'hui</div><b style="display:block;font-size:17px;font-weight:800">' + esc(v.who.nom) + '</b><small class="placeholder" style="font-size:12.5px">[adresse à compléter]</small></div></div><div class="surplace">' + icon('pin', 15, 2) + 'À jouer sur place chez le commerçant</div><div style="display:flex;gap:10px;margin-top:10px"><button class="act" style="flex:1" data-go="c-fiche">Voir la fiche</button><button class="act" style="flex:1">' + icon('route', 18) + 'Y aller</button></div></div></div>' +
    dock({ nav: 'c-commerces' }) + '</div>'
} }

S['c-fiche'] = { tall: true, r: function (v) {
  const adr = v.commerce.adresse
  const iti = adr && adr.indexOf('[') < 0 ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(adr) : ''
  return '<div class="scr bg-w"><div style="background:var(--sky);padding:0 20px 20px;position:relative;overflow:hidden">' + geo([['c', 270, 60, 140, 'var(--c)'], ['h', 220, 170, 80, '#fff']]) + barre() +
    '<div style="position:relative;z-index:1"><button class="iconbtn" data-go="@retour" data-repli="c-commerces" aria-label="Retour">' + icon('chevL', 22, 2) + '</button><div class="bigmono" style="color:var(--c-ink);overflow:hidden">' + (v.who.logo && urlSure(v.who.logo) ? '<img class="fm-logo" alt="" src="' + urlSure(v.who.logo) + '">' : esc(v.who.mono)) + '</div><div class="h2" style="margin-top:12px">' + esc(v.who.nom) + '</div><p class="sub" style="font-size:14.5px;margin-top:4px">' + txt(v.commerce.activite || '[activité à compléter]') + '</p></div></div>' +
    '<div class="body" style="padding-top:14px"><div class="card rows" style="margin-top:0"><div><span>Adresse</span><b>' + txt(adr) + '</b></div><div><span>Horaires</span><b>' + txt(v.commerce.horaires) + '</b></div><div><span>Achat</span><b>' + esc(v.achat) + '</b></div></div>' +
    '<div class="acts">' + (iti ? '<a class="act" target="_blank" rel="noopener" href="' + esc(iti) + '" style="text-decoration:none;color:inherit">' + icon('route', 19) + 'Itinéraire</a>' : '<button class="act">' + icon('route', 19) + 'Itinéraire</button>') + (urlSure(v.commerce.site) ? '<a class="act" target="_blank" rel="noopener" href="' + urlSure(v.commerce.site) + '" style="text-decoration:none;color:inherit">' + icon('globe', 19) + 'Site web</a>' : '<button class="act">' + icon('globe', 19) + 'Site web</button>') + '</div>' +
    '<div class="sect"><h4>Lots en jeu</h4><span>' + nbLots(v.lots.length) + '</span></div><div class="card gain" style="margin-top:0">' + v.lots.map(function (l) { return lotRow(v, l) }).join('') + '</div>' +
    '<div class="card infobox"><div class="inforow">' + icon('pin', 21) + '<b style="color:var(--ink)">À jouer sur place chez le commerçant</b></div></div></div>' + dock({ nav: 'c-commerces' }) + '</div>'
} }

S['c-partenaires'] = { tall: true, r: function (v) {
  const sp = v.partenaires.map(function (p, i) { return { p: p, i: i } }).filter(function (x) { return x.p.sponsor })
  const pa = v.partenaires.map(function (p, i) { return { p: p, i: i } }).filter(function (x) { return !x.p.sponsor })
  function tile(x: { p: { nom: string; distance?: boolean }; i: number }, big?: boolean) { return '<button class="vtile" data-go="c-fichepart" data-part="' + x.i + '"><span class="plogo" style="aspect-ratio:' + (big ? '1.5/1' : '1/1') + ';border-radius:18px;position:relative">' + logoPart(v, x.i, big ? 130 : 84, big ? 52 : 34) + (x.p.distance ? '<em style="position:absolute;right:7px;top:7px;width:11px;height:11px;border-radius:50%;background:var(--fl-blue);border:2px solid #fff"></em>' : '') + '</span><b>' + esc(x.p.nom) + '</b></button>' }
  return '<div class="scr bg-o">' + barre() + '<div class="body" style="padding-top:4px"><button class="iconbtn" data-go="@retour" data-repli="s-accueil" aria-label="Retour" style="margin-bottom:8px">' + icon('chevL', 22, 2) + '</button><div class="kicker">Ils rendent le jeu possible</div><h2 class="h2">Partenaires<br>et sponsors</h2>' +
    (!v.partenaires.length ? '<div class="card" style="padding:16px;margin-top:16px;font-size:14px;font-weight:600;color:var(--ink2)">Les partenaires de l\'animation s\'afficheront ici. <span class="placeholder">[partenaires à compléter]</span></div>' : '') +
    (sp.length ? '<div class="sect" style="margin-top:16px"><h4>Sponsors</h4><span>' + sp.length + '</span></div><div class="vgrid3" style="grid-template-columns:1fr 1fr">' + sp.map(function (x) { return tile(x, true) }).join('') + '</div>' : '') +
    (pa.length ? '<div class="sect"><h4>Partenaires</h4><span>' + pa.length + '</span></div><div class="vgrid3">' + pa.map(function (x) { return tile(x) }).join('') + '</div>' : '') +
    (v.partenaires.some(function (p) { return p.distance }) ? '<p class="mention" style="text-align:left;display:flex;gap:8px;align-items:center"><span style="width:10px;height:10px;border-radius:50%;background:var(--fl-blue);flex:none"></span>Participation à distance autorisée</p>' : '') + '</div>' + dock({ nav: 'c-partenaires' }) + '</div>'
} }
let PART_COURANT = 0
export function regleParte(i: number) { PART_COURANT = i }
S['c-fichepart'] = { tall: true, r: function (v) {
  const i = Math.min(PART_COURANT, Math.max(0, v.partenaires.length - 1)), p = v.partenaires[i] || { nom: '[partenaire à compléter]' } as { nom: string; desc?: string; distance?: boolean; lots?: LotAffiche[]; site?: string | null; instagram?: string | null; facebook?: string | null }
  const lien = function (u: string | null | undefined, ic: string, lb: string) { return urlSure(u) ? '<a target="_blank" rel="noopener" href="' + urlSure(u) + '" style="text-decoration:none;color:inherit;display:inline-flex;align-items:center;gap:6px">' + icon(ic, 16, 2) + lb + '</a>' : '<button>' + icon(ic, 16, 2) + lb + '</button>' }
  return '<div class="scr bg-w"><div style="background:var(--fl-paper);padding:0 20px 20px;position:relative;overflow:hidden;border-bottom:1.5px solid var(--line)">' + geo([['c', 270, 40, 150, 'var(--fl-sky)'], ['h', 230, 170, 90, 'var(--c3)']]) + barre() +
    '<div style="position:relative;z-index:1"><button class="iconbtn" data-go="@retour" data-repli="c-partenaires" aria-label="Retour">' + icon('chevL', 22, 2) + '</button><span class="plogo" style="width:170px;height:100px;margin-top:12px;border-radius:22px">' + logoPart(v, i, 150, 60) + '</span><div class="h2" style="margin-top:12px">' + esc(p.nom) + '</div><p class="sub" style="font-size:14.5px;margin-top:4px">' + txt(p.desc || '[description à compléter]') + '</p>' + (p.distance ? '<span class="tag dist">Participation à distance autorisée</span>' : '') + '</div></div>' +
    '<div class="body" style="padding-top:14px">' + (p.lots && p.lots.length ? '<div class="sect" style="margin-top:4px"><h4>Lots offerts</h4><span>' + nbLots(p.lots.length) + '</span></div><div class="card gain" style="margin-top:0">' + p.lots.map(function (l) { return lotRow(v, l) }).join('') + '</div>' : '') +
    '<div class="sect"><h4>Ses liens</h4><span>' + (p.site || p.instagram || p.facebook ? '' : 'à compléter') + '</span></div><div class="links">' + lien(p.site, 'globe', 'Site web') + lien(p.instagram, 'ext', 'Instagram') + lien(p.facebook, 'ext', 'Facebook') + '</div>' +
    '<div class="card infobox">' + (p.distance ? '<div class="inforow">' + icon('globe', 21) + '<span><b style="color:var(--ink)">Jouable à distance</b><br>Ce sponsor autorise la participation sans venir sur place.</span></div>' : '') + '<div class="inforow">' + icon('pin', 21) + '<span>Pour les commerces : <b style="color:var(--ink)">à jouer sur place</b>, chez le commerçant.</span></div></div></div>' + dock({ nav: 'c-partenaires' }) + '</div>'
} }

S['c-demain'] = { r: function (v) {
  return '<div class="scr" style="--bg:var(--home);background:var(--home)">' + barre() + geo([['c', 105, 120, 180, 'var(--c)'], ['h', 240, 250, 110, 'var(--c3)', 0, .1], ['o', 60, 90, 50, '#fff', 0, .2]]) + hdr(v) +
    '<div class="body" style="text-align:center;align-items:center"><div class="card a-pop" style="--d:.4s;margin-top:40px;width:172px;height:172px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">Prochaine partie</span><b style="font-size:38px;font-weight:800;letter-spacing:-.04em;line-height:1.05" class="num" data-compte>demain</b></div>' +
    '<h2 class="big a-rise" style="--d:.6s;font-size:46px;margin-top:98px">Reviens<br>demain&nbsp;!</h2><p class="sub a-rise" style="--d:.7s;max-width:310px">Tu as déjà joué dans ce commerce aujourd\'hui. Une nouvelle partie t\'attend demain, sur place.</p></div>' +
    foot(btn('Jouer chez un autre commerce', 'c-commerces') + '<button class="lnk" data-go="c-profil">Voir mes tickets</button>') + '</div>'
} }

S['c-digital'] = { r: function (v) {
  return '<div class="scr" style="--bg:var(--home);background:var(--home)">' + barre() + homeDeco() + hdr(v) + '<div class="body"><div class="kicker" style="margin-top:6px">' + esc(v.who.nom) + '</div><h1 class="big">Jouer<br>et gagner</h1><div class="card gain">' + v.lots.slice(0, 2).map(function (l) { return lotRow(v, l) }).join('') + '</div></div>' +
    '<div class="veil"></div><div class="sheet"><div class="grab"></div><span class="sicon">' + icon('store', 30, 1.7) + '</span>' +
    '<h3 style="font-size:25px;font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-top:14px">Ta partie en ligne<br>est déjà jouée</h3>' +
    '<p style="font-size:16px;line-height:1.5;font-weight:600;color:var(--ink2);margin:10px 0 20px">Rends-toi en magasin pour continuer à jouer une fois par jour et tenter de gagner tes lots et tes tickets.</p>' +
    btn('Trouver un commerce', 'c-commerces') + '<button class="lnk" data-go="c-profil" style="color:var(--ink2)">Fermer</button></div></div>'
} }

/* Commercant (retrait d'un lot) — demonstration dans l'apercu du master */
function proHdr(back?: string): string { return '<div class="prohdr">' + (back ? '<button class="iconbtn" data-go="@retour" data-repli="\' + back + \'" aria-label="Retour">' + icon('chevL', 22, 2) + '</button>' : '<span style="width:44px"></span>') + '<span class="wm">Flow<span>in</span><em>PRO</em></span><span style="width:44px"></span></div>' }
S['m-code'] = { r: function (v) {
  const l = v.billet
  return '<div class="scr bg-o">' + barre() + proHdr() + '<div class="body" style="padding-top:0"><div class="kicker" style="color:var(--muted)">Retrait d\'un lot</div><h2 class="h2">Billet scanné</h2>' +
    '<div class="card rlot" style="margin-top:16px">' + glyph(l) + '<div class="tx"><b>' + esc(l.nom) + '</b><small style="font-size:12.5px;color:var(--muted);font-weight:700">N° BL-0000-0000 · ' + esc(v.billetChez) + '</small></div></div>' +
    '<div style="margin-top:24px;display:flex;align-items:center;gap:10px">' + icon('lock', 22) + '<b style="font-size:17px;font-weight:800">Code professionnel</b></div><p style="font-size:14px;font-weight:600;color:var(--ink2);margin-top:6px;line-height:1.45">Le code à 4 chiffres reçu à l\'inscription de votre commerce. Il autorise la validation de vos billets.</p>' +
    '<div class="pinbox"><span class="f">•</span><span class="f">•</span><span class="f">•</span><span class="cur"></span></div></div>' + foot(btn('Accéder à la validation', 'm-valider', 'teal')) + '</div>'
} }
S['m-valider'] = { r: function (v) {
  const l = v.billet
  return '<div class="scr bg-o">' + barre() + proHdr('m-code') + '<div class="body" style="padding-top:0"><span class="badge-ok a-pop" style="align-self:flex-start"><i></i>Billet valable</span><h2 class="h2" style="margin-top:14px;font-size:29px">' + esc(l.nom) + '</h2>' +
    '<div class="card rows"><div><span>Bénéficiaire</span><b>Prénom E.</b></div><div><span>N° de billet</span><b class="num">BL-0000-0000</b></div><div><span>Commerce</span><b>' + esc(v.billetChez) + '</b></div><div><span>Valable jusqu\'au</span><b>' + txt(v.tirage) + '</b></div></div>' +
    '<div class="card rows"><div style="display:block"><span style="display:block;font-size:12px;letter-spacing:.1em;text-transform:uppercase">Conditions</span><b style="display:block;text-align:left;font-weight:700;margin-top:4px;color:var(--ink2);font-size:14px">' + esc(l.cond) + '. Un billet ne peut être utilisé qu\'une seule fois.</b></div></div></div>' +
    foot(btn('Valider le retrait', 'm-ok', 'teal') + '<p class="mention">Remettez le lot au client après validation.</p>') + '</div>'
} }
S['m-ok'] = { r: function (v) {
  return '<div class="scr bg-m">' + barre() + proHdr() + '<div class="body" style="text-align:center;align-items:center;padding-top:0"><div class="okcircle"><svg width="78" height="78" viewBox="0 0 24 24" fill="none" stroke="#0B7A72" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path class="draw" d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
    '<h2 class="big a-rise" style="--d:.5s;font-size:46px;margin-top:30px">Retrait<br>validé</h2><p class="sub a-rise" style="--d:.6s">Le lot peut être remis au client.</p>' +
    '<div class="card rows a-rise" style="--d:.7s;width:100%;text-align:left"><div><span>Lot</span><b>' + esc(v.billet.nom) + '</b></div><div><span>Billet</span><b class="num">BL-0000-0000</b></div><div><span>Validé</span><b>Aujourd\'hui</b></div></div></div>' +
    foot(btn('Scanner un autre billet', 'm-code', 'line')) + '</div>'
} }

/* Tombola */
function tombolaTicket(v: VueMaster, r: EtatPartie): string {
  const no = (r.tombolaNo || '0427').slice(-4).split('').map(function (d) { return +d || 0 })
  return '<div class="ptk"><small>Ticket tombola</small><div class="no"><span>TK-</span>' + no.map(function (d, i) { let s = ''; for (let k = 9; k >= 1; k--) s += '<span style="display:block">' + ((d + k) % 10) + '</span>'; s += '<span style="display:block">' + d + '</span>'; return '<span class="roll"><i style="--d:' + (1.8 + i * .18) + 's">' + s + '</i></span>' }).join('') + '</div>' +
    '<div class="line"></div><div style="font-size:14px;font-weight:800">Tirage au sort le ' + txt(v.tirage) + '</div><div class="bar"></div><div style="font-size:11px;font-weight:700;color:var(--muted);margin-top:6px">' + esc(v.who.nom) + '</div></div>'
}
S['t-tirer'] = { r: function (v) {
  return '<div class="scr bg-o">' + barre() + geo([['c', -50, 560, 170, 'var(--c2)'], ['h', 280, 640, 120, 'var(--c)', 0, .1]]) + hdr(v, { back: 's-regles' }) + BAND + etapes(0) +
    '<div class="body" style="text-align:center"><div class="kicker" style="margin-top:14px">Tombola du jour</div><h2 class="h2" style="font-size:34px;margin-top:6px">Ton ticket<br>t\'attend</h2><div class="machine"><div class="slot"></div></div>' +
    '<button class="bigbtn" data-go="t-impression">Tirer<br>mon ticket</button><p class="mention" style="margin-top:34px">Un ticket par jour et par commerce</p></div></div>'
} }
S['t-impression'] = { r: function (v, r) {
  return '<div class="scr bg-o">' + barre() + hdr(v) + BAND + etapes(0) + '<div class="body" style="text-align:center"><div class="kicker" style="margin-top:14px">Impression…</div><div class="machine"><div class="slot"></div><div class="paper">' + tombolaTicket(v, r) + '</div></div>' +
    '<p class="sub a-rise" style="--d:3s;margin-top:2px">Ton ticket est imprimé.</p></div>' + foot(btn('Découvrir le résultat', 't-resultat', 'a-rise', ' style="--d:3.1s"')) + '</div>'
} }
S['t-res-tirage'] = { r: function (v, r) {
  const premier = v.lots.find(function (l) { return l.mode === 'tir' }) || v.lots[0]
  return '<div class="scr bg-w">' + barre() + hdr(v) + BAND + etapes(1) + '<div class="body" style="text-align:center;align-items:center">' +
    '<div class="tk" style="width:100%;text-align:left"><div class="main"><small>Ticket tombola</small><b class="num">TK-' + esc((r.tombolaNo || '0427').slice(-4)) + '</b><span>Tirage au sort le ' + txt(v.tirage) + '</span></div><div class="stub"><b>N° ' + esc((r.tombolaNo || '0427').slice(-4)) + '</b></div></div>' +
    '<h2 class="h2 a-rise" style="--d:.6s;margin-top:30px;font-size:32px">Ton ticket<br>est dans le tirage</h2><p class="sub a-rise" style="--d:.7s">Valide ton ticket pour être prévenu si tu gagnes' + (premier ? ' : ' + esc(premier.nom.charAt(0).toLowerCase() + premier.nom.slice(1)) : '') + '.</p></div>' +
    foot(btn('Valider mon ticket', 'c-parrainage', '', ' data-after="c-ticket"')) + '</div>'
} }
S['t-res-instant'] = { r: function (v) {
  return '<div class="scr bg-m">' + confetti(46, 21) + barre() + hdr(v) + BAND + etapes(1) + '<div class="body" style="text-align:center;align-items:center">' +
    '<span class="tag tir a-pop" style="--d:.2s;font-size:13px;padding:7px 16px;margin-top:22px;letter-spacing:.08em;text-transform:uppercase">Ticket gagnant</span>' +
    '<h2 class="big a-rise" style="--d:.4s;font-size:50px;margin-top:18px">Gagné,<br>tout de<br>suite&nbsp;!</h2><div class="card reward a-rise" style="--d:.7s;width:100%">' + glyph(v.billet) + '<div class="tx"><small>Gain immédiat</small><b>' + esc(v.billet.nom) + '</b><span>Il va dans ton profil. Ton ticket reste en jeu pour le tirage.</span></div></div></div>' +
    foot(btn('Recevoir mon billet', 'c-parrainage', '', ' data-after="c-billet"')) + '</div>'
} }

/* Roue */
function wheelSvg(v: VueMaster): string {
  const cx = 165, cy = 165, r = 146, n = Math.max(2, v.cases.length), pas = 360 / n
  let h = '<svg viewBox="0 0 330 330"><circle cx="165" cy="165" r="163" fill="#fff" stroke="#C9D4E3" stroke-width="1.5"/>'
  v.cases.forEach(function (s, i) {
    const a0 = (i * pas - pas / 2) * Math.PI / 180, a1 = (i * pas + pas / 2) * Math.PI / 180
    h += '<path d="M' + cx + ' ' + cy + ' L' + n1(cx + r * Math.sin(a0)) + ' ' + n1(cy - r * Math.cos(a0)) + ' A' + r + ' ' + r + ' 0 ' + (pas > 180 ? 1 : 0) + ' 1 ' + n1(cx + r * Math.sin(a1)) + ' ' + n1(cy - r * Math.cos(a1)) + 'Z" fill="' + esc(s.fond) + '" stroke="#fff" stroke-width="3"/>'
    h += '<g transform="rotate(' + (i * pas) + ' ' + cx + ' ' + cy + ')"><text x="' + cx + '" y="' + (cy - r * .6) + '" transform="rotate(-90 ' + cx + ' ' + (cy - r * .6) + ')" text-anchor="middle" dominant-baseline="central" font-family="Roboto,sans-serif" font-weight="800" font-size="' + (s.label.length > 11 ? 12.5 : 15) + '" fill="' + esc(s.texte) + '">' + esc(s.label.length > 16 ? s.label.slice(0, 15) + '…' : s.label) + '</text></g>'
  })
  for (let k = 0; k < 16; k++) { const a = k * 22.5 * Math.PI / 180; h += '<circle class="bulb' + (k % 2 ? ' b2' : '') + '" cx="' + n1(cx + 155 * Math.sin(a)) + '" cy="' + n1(cy - 155 * Math.cos(a)) + '" r="4" fill="#F5A100"/>' }
  return h + '<circle cx="165" cy="165" r="34" fill="#fff" stroke="#C9D4E3" stroke-width="1.5"/><circle cx="165" cy="165" r="14" fill="var(--c)"/></svg>'
}
function pointer(): string { return '<svg class="pointer" viewBox="0 0 40 48"><path d="M20 46 L4 12 A16 16 0 1 1 36 12 Z" fill="#fff" stroke="#C9D4E3" stroke-width="1.5"/><circle cx="20" cy="15" r="6" fill="var(--c)"/></svg>' }
function wheelBlock(v: VueMaster, rot: number): string { return '<div class="wheelbox">' + pointer() + '<div class="wheel" style="transform:rotate(' + rot + 'deg)">' + wheelSvg(v) + '</div></div>' }
/** Rotation finale qui amene la case i sous l'aiguille. */
export function rotationPourCase(v: VueMaster, i: number): number { const pas = 360 / Math.max(2, v.cases.length); return 360 * 5 - i * pas }
function caseCourante(v: VueMaster, r: EtatPartie) { return r.caseIdx != null ? v.cases[r.caseIdx] : null }
S['r-roue'] = { r: function (v) {
  const tir = v.lots.find(function (l) { return l.mode === 'tir' })
  return '<div class="scr bg-m">' + barre() + hdr(v, { back: 's-regles' }) + BAND + etapes(0) + '<div class="body" style="text-align:center"><div class="kicker" style="margin-top:12px">Un tour offert</div><h2 class="h2" style="font-size:33px;margin-top:4px">Tente ta chance</h2>' + wheelBlock(v, -12) +
    '<div class="legend">' + icon('ticket', 18) + 'Case « Ticket » : 1 ticket pour le tirage du ' + txt(courte(v.tirage)) + (tir ? '' : '') + '</div></div>' + foot(btn('Lancer la roue', 'r-lancer', 'a-pulse')) + '</div>'
} }
S['r-tourne'] = { r: function (v, r) {
  const c = caseCourante(v, r)
  const lib = c ? (c.issue === 'imm' ? 'Gain immédiat' : c.issue === 'tir' ? 'Ticket pour le tirage' : 'Pas cette fois') : ''
  return '<div class="scr bg-m">' + (c && c.issue !== 'perdu' ? confetti(40, 31, 4.7) : '') + barre() + hdr(v) + BAND + etapes(0) + '<div class="body" style="text-align:center"><div class="kicker" style="margin-top:12px">C\'est parti…</div><h2 class="h2" style="font-size:33px;margin-top:4px">Ça tourne&nbsp;!</h2>' +
    '<div style="position:relative">' + wheelBlock(v, r.rotation) + '<div class="resultchip"><small>' + esc(lib) + '</small><b>' + esc(c ? c.label : '') + '</b></div></div><div class="legend after">La roue s\'est arrêtée sur « ' + esc(c ? c.label : '') + ' ».</div></div>' + foot(btn(c && c.issue === 'perdu' ? 'Voir le résultat' : 'Recevoir mon gain', 'r-resultat', 'after')) + '</div>'
} }
S['r-gain'] = { r: function (v, r) {
  const c = caseCourante(v, r), lb = c ? c.label : v.billet.nom
  return '<div class="scr bg-w">' + confetti(44, 41) + barre() + hdr(v) + BAND + etapes(1) + '<div class="body" style="text-align:center;align-items:center"><div class="card a-pop" style="--d:.1s;margin-top:22px;width:150px;height:150px;border-radius:44px;display:grid;place-items:center"><span class="glyph g-produit" style="width:110px;height:110px;border-radius:32px"><b style="font-size:46px">1</b><small style="font-size:13px">offert</small></span></div>' +
    '<div class="kicker a-rise" style="--d:.4s;margin-top:26px">Gain immédiat</div><h2 class="big a-rise" style="--d:.45s;font-size:' + (lb.length > 14 ? 40 : 50) + 'px;margin-top:8px">' + esc(lb) + '&nbsp;!</h2><p class="sub a-rise" style="--d:.6s">Ton billet QR va dans ton profil : montre-le au comptoir.</p></div>' + foot(btn('Recevoir mon billet', 'c-parrainage', '', ' data-after="c-billet"')) + '</div>'
} }
S['r-ticket'] = { r: function (v, r) {
  const tir = v.lots.find(function (l) { return l.mode === 'tir' })
  return '<div class="scr bg-w">' + barre() + hdr(v) + BAND + etapes(1) + '<div class="body" style="text-align:center;align-items:center"><div style="transform:scale(.6);transform-origin:top center;height:208px;margin-top:6px">' + wheelBlock(v, r.rotation) + '</div>' +
    '<div class="tk" style="width:100%;text-align:left;margin-top:10px"><div class="main"><small>Case « ' + esc(caseCourante(v, r) ? caseCourante(v, r).label : 'Ticket') + ' »</small><b class="num">Ticket</b><span>Tirage au sort le ' + txt(v.tirage) + '</span></div><div class="stub"><b>Tirage</b></div></div><h2 class="h2 a-rise" style="--d:.5s;font-size:29px;margin-top:20px">' + (tir ? 'Un ticket pour<br>' + esc(tir.nom.charAt(0).toLowerCase() + tir.nom.slice(1)) : 'Un ticket<br>pour le tirage') + '</h2></div>' + foot(btn('Valider mon ticket', 'c-parrainage', '', ' data-after="c-ticket"')) + '</div>'
} }
S['r-perdu'] = { r: function (v, r) {
  return '<div class="scr bg-w">' + barre() + hdr(v) + BAND + etapes(1) + '<div class="body" style="text-align:center;align-items:center"><div style="transform:scale(.6);transform-origin:top center;height:208px;margin-top:6px">' + wheelBlock(v, r.rotation) + '</div>' +
    '<h2 class="big a-rise" style="--d:.3s;font-size:46px;margin-top:26px">Pas cette<br>fois…</h2><p class="sub a-rise" style="--d:.4s;max-width:310px">Parraine 3 amis aujourd\'hui et relance la roue une fois. Sinon, la roue t\'attend demain.</p></div>' + foot(btn('Parrainer 3 amis', 'c-parrainage') + '<button class="lnk" data-go="c-commerces">Les autres commerces</button>') + '</div>'
} }

/* Vote */
const ART_COUL = [['#3B5CC4', '#EAEFFB'], ['#13A89E', '#F4F6F9'], ['#8E3B6E', '#E6F7F4'], ['#F5A100', '#EAEFFB'], ['#3A6FD8', '#E6F7F4']]
function avatar(v: VueMaster, i: number, s?: number): string {
  s = s || 62
  const c = v.candidats[i], a = ART_COUL[i % ART_COUL.length]
  if (c && c.photo && urlSure(c.photo)) return '<span class="av" style="position:relative;overflow:hidden;display:inline-block;flex:none;border-radius:18px;background:' + a[1] + ';width:' + s + 'px;height:' + s + 'px"><img alt="" src="' + urlSure(c.photo) + '"></span>'
  return '<span class="av" style="position:relative;overflow:hidden;display:inline-block;flex:none;border-radius:18px;background:' + a[1] + ';width:' + s + 'px;height:' + s + 'px">' + geo([['c', s * .2, s * .18, s * .6, a[0]], ['h', s * .05, s * .62, s * .9, a[0]]]) + '</span>'
}
S['v-choix'] = { tall: true, r: function (v, r) {
  return '<div class="scr bg-s">' + barre() + hdr(v, { back: 's-regles' }) + BAND + etapes(0) + '<div class="body"><div class="kicker" style="margin-top:14px">' + esc(v.voteKicker) + '</div><h2 class="h2" style="font-size:30px">' + esc(v.voteTitre) + '</h2>' +
    '<div class="artists">' + v.candidats.map(function (a, i) { return '<button class="card art' + (r.voteIdx === i ? ' on' : '') + '" data-one="art" data-vote="' + i + '">' + avatar(v, i) + '<div><b>' + esc(a.nom) + '</b><small>' + txt(a.sous || '') + '</small></div><span class="rad">' + icon('check', 16, 3) + '</span></button>' }).join('') + '</div>' +
    (v.candidats.some(function (c) { return !c.photo }) ? '<p class="mention">Visuels d\'illustration : photos à fournir</p>' : '') + '</div>' + foot(btn('Voter', 'v-voter', '', r.voteIdx == null ? ' data-vote-need disabled' : ' data-vote-need')) + '</div>'
} }
S['v-envoi'] = { r: function (v, r) {
  const i = r.voteIdx == null ? 0 : r.voteIdx
  return '<div class="scr bg-s">' + barre() + hdr(v) + BAND + etapes(1) + '<div class="body" style="text-align:center;align-items:center"><div class="urn"><div class="card2">' + avatar(v, i, 94) + '</div><div class="lid"></div><div class="box"><b>VOTE</b></div><div class="vok">' + icon('check', 38, 3) + '</div></div>' +
    '<h2 class="big a-rise" style="--d:2s;font-size:52px;margin-top:30px">A voté&nbsp;!</h2><p class="sub a-rise" style="--d:2.1s">Ton vote pour ' + esc(v.candidats[i] ? v.candidats[i].nom : '') + ' est enregistré.</p></div>' + foot(btn('Continuer', 'v-resultat', 'a-rise', ' style="--d:2.2s"')) + '</div>'
} }
S['v-resultat'] = { r: function (v, r) {
  const lot = v.lots[0]
  return '<div class="scr bg-w">' + barre() + hdr(v) + BAND + etapes(1) + '<div class="body"><div class="kicker" style="margin-top:12px">Ton vote est compté</div><h2 class="h2" style="font-size:30px">Merci pour<br>ton vote&nbsp;!</h2>' +
    '<div class="card" style="padding:14px 16px;margin-top:16px;display:flex;gap:12px;align-items:center">' + avatar(v, r.voteIdx || 0, 52) + '<div><small style="display:block;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)">Ton choix</small><b style="font-size:17px;font-weight:800">' + esc(v.candidats[r.voteIdx || 0] ? v.candidats[r.voteIdx || 0].nom : '') + '</b></div></div>' +
    '<p class="mention" style="text-align:left">Les résultats sont annoncés par l\'organisateur.</p><div class="card reward a-rise" style="--d:.8s">' + glyph(L('ticket', '1', 'ticket')) + '<div class="tx"><small>Ton vote te fait participer</small><b>Loterie' + (lot ? ' : ' + esc(lot.nom) : '') + '</b><span>Tirage le ' + txt(v.tirage) + '</span></div></div></div>' +
    foot(btn('Recevoir mon ticket', 'c-parrainage', '', ' data-after="c-ticket"')) + '</div>'
} }

/* Vote — exemple 2 : « la plus belle vitrine » (carte, QR de la vitrine, ticket + sondage) */
S['v2-carte'] = { tall: true, r: function (v, r) {
  const vit = v.vitrines.length ? v.vitrines : [{ nom: '[vitrine à compléter]', sous: '' }]
  const cur = r.voteIdx == null ? Math.min(3, vit.length - 1) : r.voteIdx
  return '<div class="scr bg-o">' + barre() + '<div class="hdr"><div class="brand" style="flex:1"><span class="mono">' + esc(monogramme2(v.vitrineAsso)) + '</span><div style="min-width:0"><b>' + esc(v.vitrineAsso) + '</b><i>Vote · Vitrines de Noël</i></div></div></div>' +
    '<div style="padding:0 20px 10px;flex:none"><h2 class="h2" style="font-size:27px">La plus belle vitrine</h2><p class="sub" style="font-size:14px;margin-top:4px">Rends-toi devant les vitrines et flashe le QR de ta préférée.</p></div>' +
    '<div class="map">' + mapSvg() + mapPins([[90, 240, 'done'], [200, 200, 'todo', 2], [315, 160, 'todo', 3], [230, 350, 'todo here', 4], [80, 390, 'todo', 5]]) +
    '<div class="card msheet"><div style="display:flex;gap:12px;align-items:center"><span class="pmono" style="background:#E6F7F4;color:#00796B;width:48px;height:48px">' + esc(monogramme2(vit[cur].nom)) + '</span><div style="flex:1"><div class="kicker" style="font-size:10.5px">Vitrine ' + (cur + 1) + '</div><b style="display:block;font-size:17px;font-weight:800">' + esc(vit[cur].nom) + '</b><small class="placeholder" style="font-size:12.5px">[adresse à compléter]</small></div></div><div class="surplace">' + icon('scan', 15, 2) + 'Flashe le QR collé sur la vitrine pour voter</div><button class="btn" style="margin-top:10px;min-height:48px;font-size:16px" data-go="v2-flash" data-vote="' + cur + '" data-vitrine="' + cur + '">Voter pour cette vitrine</button></div></div>' +
    dock({ nav: 'c-commerces' }) + '</div>'
} }
S['v2-flash'] = { r: function (v, r) {
  const vit = v.vitrines.length ? v.vitrines : [{ nom: '[vitrine à compléter]', sous: '', photo: '' }]
  const i = Math.min(r.voteIdx == null ? 3 : r.voteIdx, vit.length - 1), c = vit[i]
  const photo = c.photo && urlSure(c.photo)
  return '<div class="scr bg-s">' + barre() + '<div class="hdr"><button class="iconbtn" data-go="@retour" data-repli="v2-carte" aria-label="Retour">' + icon('chevL', 22, 2) + '</button><div class="brand" style="flex:1"><span class="mono">' + esc(monogramme2(v.vitrineAsso)) + '</span><div style="min-width:0"><b>Vitrines de Noël</b><i>Vote · Jeu gratuit</i></div></div></div>' +
    '<div class="body"><div class="kicker" style="margin-top:8px">Vitrine ' + (i + 1) + ' sur ' + vit.length + '</div><h2 class="h2" style="font-size:30px">' + esc(c.nom) + '</h2><div class="vitrine" style="margin-top:14px">' + (photo ? '<img alt="" src="' + photo + '">' : geo([['h', 40, 120, 200, 'var(--fl-spin)'], ['c', 210, 40, 90, '#F5A100'], ['r', 260, 140, 60, '#EAEFFB', 12], ['o', 60, 30, 50, 'var(--fl-solo)']])) + '</div>' +
    (photo ? '' : '<p class="mention">Photo de la vitrine à fournir</p>') + '<div class="card infobox"><div class="inforow">' + icon('ticket', 21) + 'Ton vote = 1 ticket pour le tirage + ' + v.sondage.length + ' questions</div></div></div>' + foot(btn('Je vote pour cette vitrine', 'v2-sondage')) + '</div>'
} }
S['v2-sondage'] = { tall: true, r: function (v) {
  const n = v.sondage.length
  return '<div class="scr bg-w">' + barre() + '<div class="hdr"><span style="width:44px"></span><div class="ttl">A voté !<small>Vitrines de Noël</small></div><span style="width:44px"></span></div>' +
    '<div class="body"><div class="tk" style="margin-top:6px"><div class="main"><small>Ticket · vitrines de Noël</small><b class="num">TK-1204</b><span>Tirage au sort le ' + txt(v.tirage) + '</span></div><div class="stub"><b>N° 1204</b></div></div>' +
    v.sondage.map(function (q, i) { return '<div class="card bcard"><div class="kicker">Question ' + (i + 1) + ' / ' + n + '</div><h4>' + esc(q.label) + '</h4><div class="chips">' + q.opts.map(function (o) { return '<button class="chip" data-one="s' + i + '" data-val="' + esc(o) + '">' + esc(o) + '</button>' }).join('') + '</div></div>' }).join('') +
    '<p class="mention" style="text-align:left">Réglé par l\'association des commerçants, un commerce ou l\'organisateur.</p></div>' + foot(btn('Valider', 'c-parrainage', '', ' data-after="c-ticket" data-sondage')) + '</div>'
} }
function monogramme2(nom: string): string { const m = String(nom || '').replace(/[^0-9A-Za-zÀ-ÖØ-öø-ÿ ]/g, ' ').split(/\s+/).filter(function (x) { return x && ['de', 'des', 'du', 'la', 'le', 'les', 'd', 'l'].indexOf(x.toLowerCase()) < 0 }); return !m.length ? 'FL' : m.length === 1 ? m[0].slice(0, 2).toUpperCase() : (m[0][0] + m[1][0]).toUpperCase() }

/* Univers SUPER EVENT (joueur) */
function burst(t: string, w: number, bg: string, fg: string, rot?: number, fs?: number): string {
  const pts: string[] = [], n = 22
  for (let k = 0; k < n * 2; k++) { const a = k * Math.PI / n, r = k % 2 ? w * .36 : w * .5; pts.push(n1(w / 2 + r * Math.cos(a)) + ',' + n1(w / 2 + r * Math.sin(a))) }
  return '<svg width="' + w + '" height="' + w + '" viewBox="0 0 ' + w + ' ' + w + '" style="transform:rotate(' + (rot || 0) + 'deg);overflow:visible" aria-hidden="true"><polygon points="' + pts.join(' ') + '" fill="' + bg + '" stroke="#1B3A5C" stroke-width="3" stroke-linejoin="round"/><text x="' + w / 2 + '" y="' + (w / 2 + 1) + '" text-anchor="middle" dominant-baseline="central" font-family="Bangers" font-size="' + (fs || w * .22) + '" fill="' + fg + '" letter-spacing="1">' + esc(t) + '</text></svg>'
}
function superHead(back?: string, flo?: boolean): string {
  return (flo ? '<div style="text-align:center;flex:none;padding:6px 0 2px"><span class="flowin-comic" style="font-size:46px">Flow<em>in</em></span><div style="font-family:Bangers;font-size:16px;letter-spacing:.14em;color:var(--fl-ink);margin-top:4px">présente</div></div>' : '') + '<div class="hdr">' + (back ? '<button class="iconbtn" data-go="@retour" data-repli="\' + back + \'" aria-label="Retour">' + icon('chevL', 22, 2) + '</button>' : '<span style="width:44px"></span>') + '<div style="flex:1;text-align:center"><span class="super-logo" style="font-size:34px">Super</span> <span class="se-word" style="font-size:28px">event</span></div><button class="iconbtn" ' + cibleSe('sj-tickets') + ' aria-label="Mes super tickets">' + icon('ticket', 21) + '</button></div>'
}
/** En reel, la carte et les tickets sont ceux de la page /se/<id> (donnees reelles). */
let SE_REEL = ''
export function regleSuperReel(id: string) { SE_REEL = id }
function cibleSe(go: string): string { return 'data-go="' + go + '"' }
function superNav(on: string): string { const it = [['play', 'Jouer', 'sj-accueil'], ['map', 'Carte', 'sj-carte'], ['spark', 'En cours', 'sj-encours'], ['ticket', 'Tickets', 'sj-tickets']]; return '<div class="dock"><nav class="nav">' + it.map(function (x) { return '<a ' + cibleSe(x[2]) + ' class="' + (on === x[2] ? 'on' : '') + '">' + icon(x[0], 23) + x[1] + '</a>' }).join('') + '</nav></div>' }
function seInfo(v: VueMaster) { const se = v.superEvent; return { nom: se ? se.nom : v.who.nom, dates: se ? se.dates : '1er → 31 décembre 2026', n: se ? se.nbStations : 12 } }
S['sj-accueil'] = { tall: true, r: function (v) {
  const s = seInfo(v)
  return '<div class="scr">' + barre() + superHead(v.key !== 'sej' ? '@retour' : undefined, true) + BAND +
    '<div class="body"><div class="panel" style="padding:18px 16px 16px;margin-top:8px"><span class="ptag">En cours</span><div style="position:absolute;right:-14px;top:-14px">' + burst(s.n + ' STATIONS', 132, '#FFD23F', '#E2231A', 8, 15) + '</div>' +
    '<div class="h2" style="font-size:34px;margin-top:22px;max-width:220px;line-height:.95">' + esc(s.nom) + '</div><p style="font-size:14px;font-weight:700;color:var(--ink2);margin-top:6px">' + txt(s.dates) + ' · ' + s.n + ' commerces</p>' +
    '<div class="bubble2" style="margin-top:14px">Chaque commerce joué = 1 super ticket&nbsp;!</div></div>' +
    '<div class="panel" style="padding:14px 16px 6px;margin-top:22px;box-shadow:5px 5px 0 var(--fl-super-rouge)"><div class="bang" style="font-size:24px;color:var(--fl-super-rouge-ink)">Le grand tirage</div>' + ((v.superEvent && v.superEvent.lots && v.superEvent.lots.length) || v.key !== 'sej' ? ((v.superEvent && v.superEvent.lots) || []) : v.lots).map(function (l) { return lotRow(v, l) }).join('') + '</div>' +
    '<div class="panel" style="padding:12px 16px;margin-top:22px;display:flex;gap:12px;align-items:center"><span class="bang" style="font-size:44px;color:var(--fl-super-bleu);line-height:1">1</span><span style="font-weight:800;font-size:14.5px">Va à une station · <span class="bang" style="font-size:26px;color:var(--fl-super-rouge)">2</span> flashe le QR · <span class="bang" style="font-size:26px;color:var(--fl-super-rouge-ink)">3</span> joue au super jeu</span></div></div>' +
    foot(btn('Voir la carte des stations', 'sj-carte')) + '</div>'
} }
S['sj-carte'] = { tall: true, r: function (v) {
  const s = seInfo(v)
  if (SE_REEL) {
    /* Carte reelle (SuperEventMap, OpenStreetMap) montee par le client dans
       [data-carte-se] ; geolocalisation sur demande uniquement. */
    const st = (v.superEvent && v.superEvent.stations) || []
    return '<div class="scr">' + barre() + superHead('@retour') +
      '<div class="body" style="padding-top:4px"><div class="h2" style="font-size:30px">La carte des stations</div><div style="display:flex;justify-content:space-between;font-weight:800;font-size:13.5px;margin:6px 0 6px"><span data-se-prog>' + st.length + ' station' + (st.length > 1 ? 's' : '') + ' participante' + (st.length > 1 ? 's' : '') + '</span><span style="color:var(--fl-super-rouge-ink)">1 commerce joué = 1 super ticket</span></div><div class="sbar"><i data-se-barre style="width:0%"></i></div>' +
      '<div class="panel" style="height:330px;margin-top:16px;padding:0;overflow:hidden"><div data-carte-se style="height:100%;width:100%"></div></div>' +
      '<div class="card" style="padding:14px 16px;margin-top:18px;background:#fff"><b style="display:block;font-size:15.5px;font-weight:800">Autour de moi</b><p style="font-size:13px;font-weight:600;color:var(--ink2);margin-top:4px;line-height:1.45">Pour trier les commerces par distance, Flowin a besoin de ta position. Elle n\'est demandée que si tu touches le bouton.</p>' +
      '<div class="consent" data-tog data-consent-geo role="checkbox" aria-checked="false" tabindex="0" style="margin-top:10px"><span class="box">' + icon('check', 16, 3) + '</span><div><p>J\'accepte que ma position approximative (arrondie à environ 1 km) soit enregistrée par Flowin avec ma participation.</p><em>Facultatif</em></div></div>' +
      '<button class="btn line" style="margin-top:12px" data-go="sj-geo">' + icon('pin', 18, 2) + 'Voir les commerces autour de moi</button><p class="mention" data-geo-msg style="text-align:left"></p></div>' +
      '<div data-stations>' + st.map(function (x, k) { return '<div class="card pcard" style="margin-top:10px;background:#fff" data-href="/jouer?ev=' + encodeURIComponent(x.id) + '" data-station="' + esc(x.id) + '"><span class="pmono" style="background:#E6F7F4;color:#00796B;border:2.5px solid #1B3A5C">' + esc(x.nom.slice(0, 2).toUpperCase()) + '</span><div class="tx"><b>' + esc(x.nom) + '</b><small>' + txt(x.adresse || '[adresse à compléter]') + '</small><div class="surplace" data-dist>' + icon('pin', 15, 2) + 'Station ' + (k + 1) + ' · à jouer sur place</div></div>' + icon('chevR', 20, 2) + '</div>' }).join('') + (st.length ? '' : '<div class="card" style="padding:14px 16px;margin-top:10px">Les stations s\'afficheront ici. <span class="placeholder">[stations à compléter]</span></div>') + '</div>' +
      '</div>' + superNav('sj-carte') + '</div>'
  }
  return '<div class="scr">' + barre() + superHead('sj-accueil') +
    '<div class="body" style="padding-top:4px"><div class="h2" style="font-size:30px">La carte des stations</div><div style="display:flex;justify-content:space-between;font-weight:800;font-size:13.5px;margin:6px 0 6px"><span>4 stations jouées sur ' + s.n + '</span><span style="color:var(--fl-super-rouge-ink)">+' + Math.max(0, s.n - 4) + ' tickets possibles</span></div><div class="sbar"><i style="width:33%"></i></div>' +
    '<div class="panel" style="height:470px;margin-top:16px">' + mapSvg().replace('class="base"', 'class="base" style="position:absolute;inset:0;width:100%;height:100%"') +
    [[60, 170, 'd'], [150, 130, 'd'], [255, 110, 't', 3], [300, 250, 'd'], [175, 300, 'h', 5], [70, 330, 't', 6], [260, 400, 't', 7]].map(function (q, i) { const bg = q[2] === 'd' ? '#FFD23F' : '#E2231A', fg = q[2] === 'd' ? '#1B3A5C' : '#fff'; return '<div class="spin2" style="--d:' + (i * .07) + 's;position:absolute;left:' + ((q[0] as number) - 21) + 'px;top:' + ((q[1] as number) - 21) + 'px;width:42px;height:42px;border-radius:50%;background:' + bg + ';color:' + fg + ';border:3px solid #1B3A5C;box-shadow:3px 3px 0 #1B3A5C;display:grid;place-items:center;font-family:Bangers;font-size:20px;z-index:2">' + (q[2] === 'd' ? icon('check', 20, 3) : q[3]) + '</div>' }).join('') +
    '<div style="position:absolute;left:120px;top:228px;z-index:3"><span class="bubble2" style="font-size:13px">Tu es ici&nbsp;!</span></div></div>' +
    '<div class="card" style="padding:12px 14px;margin-top:18px;display:flex;gap:12px;align-items:center;background:#fff"><span class="pmono" style="background:#E6F7F4;color:#00796B;border:2.5px solid #1B3A5C">CE</span><div style="flex:1"><div class="kicker" style="font-size:10.5px">Station 5 · à jouer</div><b style="display:block;font-size:16.5px;font-weight:800">Café Exemple</b><small class="placeholder">[adresse à compléter]</small></div><button class="iconbtn" data-go="sj-station" aria-label="Jouer">' + icon('route', 20) + '</button></div></div>' + superNav('sj-carte') + '</div>'
} }
S['sj-station'] = { r: function () {
  return '<div class="scr">' + confetti(40, 51) + barre() + superHead('sj-carte') +
    '<div class="body" style="text-align:center;align-items:center"><div class="spin2" style="--d:.1s;margin-top:20px">' + burst('BOUM !', 230, '#FFD23F', '#E2231A', -6, 60) + '</div>' +
    '<div class="panel spin2" style="--d:.5s;padding:16px 20px;margin-top:6px;width:100%;box-shadow:5px 5px 0 var(--fl-super-bleu)"><span class="ptag">Station 5</span><div class="bang" style="font-size:40px;color:var(--fl-super-rouge-ink);margin-top:12px">+1 super ticket</div><p style="font-size:15px;font-weight:700;color:var(--ink2)">Café Exemple est validé. Tu as <b style="color:var(--ink)">5 tickets</b> pour le grand tirage.</p></div>' +
    '<div class="bubble2 a-rise" style="--d:.9s;margin-top:22px">Plus que 7 stations&nbsp;!</div></div>' + foot(btn('Station suivante', 'sj-carte') + '<button class="lnk" data-go="sj-tickets" style="color:var(--fl-super-rouge-ink)">Mes super tickets</button>') + '</div>'
} }
S['sj-encours'] = { tall: true, r: function (v) {
  const s = seInfo(v)
  const ev = (SE_REEL ? [[s.nom, 'Super jeu', 'En cours · ' + s.dates, 0, s.n, '#FFD23F']] : [[s.nom, 'Super quiz', 'En cours · ' + s.dates, 4, s.n, '#FFD23F'], ['Festival Exemple', 'Super ticket', 'Bientôt · [dates à compléter]', 0, 8, '#fff'], ['Fête du quartier Exemple', 'Roue', 'Bientôt · [dates à compléter]', 0, 6, '#fff']]) as (string | number)[][]
  return '<div class="scr">' + barre() + superHead() + '<div class="body" style="padding-top:4px"><div class="h2" style="font-size:31px">Événements en cours</div>' +
    ev.map(function (e, i) { return '<div class="panel" style="padding:14px 16px;margin-top:' + (i ? 18 : 12) + 'px;' + (i ? '' : 'box-shadow:5px 5px 0 var(--fl-super-rouge)') + '"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><div class="bang" style="font-size:24px;line-height:1">' + esc(e[0]) + '</div><small style="display:block;font-size:12.5px;font-weight:700;color:var(--muted);margin-top:4px">' + txt(e[2]) + '</small></div><span style="background:' + e[5] + ';border:2.5px solid #1B3A5C;border-radius:8px;padding:3px 8px;font-family:Bangers;font-size:15px;letter-spacing:.05em;white-space:nowrap">' + esc(e[1]) + '</span></div>' +
      (e[3] ? '<div style="display:flex;justify-content:space-between;font-weight:800;font-size:13px;margin:10px 0 5px"><span>Ta progression</span><span>' + e[3] + ' / ' + e[4] + ' stations</span></div><div class="sbar"><i style="width:' + Math.round((e[3] as number) / (e[4] as number) * 100) + '%"></i></div>' : '<div style="font-size:13px;font-weight:700;color:var(--ink2);margin-top:8px">' + e[4] + ' stations prévues · on te prévient à l\'ouverture</div>') + '</div>' }).join('') +
    '<div style="margin-top:20px;text-align:center">' + burst('SUR PLACE', 150, '#fff', '#2B5FD9', -4, 25) + '</div></div>' + superNav('sj-encours') + '</div>'
} }
S['sj-tickets'] = { tall: true, r: function (v) {
  if (SE_REEL) {
    return '<div class="scr">' + barre() + superHead('@retour') + '<div class="body" style="padding-top:4px"><div style="display:flex;align-items:center;gap:14px"><span class="bang" data-se-nb style="font-size:86px;color:var(--fl-super-rouge);line-height:.9;-webkit-text-stroke:2px #1B3A5C">0</span><div><div class="h2" style="font-size:30px;line-height:.95">Super tickets</div><p style="font-size:13.5px;font-weight:700;color:var(--ink2)">Grand tirage le ' + txt(v.tirage) + '</p></div></div>' +
      '<div data-se-tickets><div class="card" style="padding:14px 16px;margin-top:12px;font-weight:600;color:var(--ink2)">Chargement de tes super tickets…</div></div>' +
      '<div class="bubble2" style="margin-top:22px">Parraine un ami : +1 super ticket&nbsp;!</div></div>' + superNav('sj-tickets') + '</div>'
  }
  const st = ['Boulangerie Exemple', 'Fleuriste Exemple', 'Librairie Exemple', 'Opticien Exemple', 'Café Exemple']
  return '<div class="scr">' + barre() + superHead('sj-accueil') + '<div class="body" style="padding-top:4px"><div style="display:flex;align-items:center;gap:14px"><span class="bang" style="font-size:86px;color:var(--fl-super-rouge);line-height:.9;-webkit-text-stroke:2px #1B3A5C">5</span><div><div class="h2" style="font-size:30px;line-height:.95">Super tickets</div><p style="font-size:13.5px;font-weight:700;color:var(--ink2)">Grand tirage le ' + txt(v.tirage) + '</p></div></div>' +
    st.map(function (n, i) { return '<div class="panel a-rise" style="--d:' + (i * .06) + 's;display:flex;margin-top:12px;box-shadow:4px 4px 0 #1B3A5C"><span style="width:14px;background:' + (i % 2 ? 'var(--fl-super-bleu)' : 'var(--fl-super-rouge)') + ';border-right:3px solid #1B3A5C"></span><div style="flex:1;padding:10px 14px"><b class="num" style="font-size:16px;font-weight:800">ST-0' + (41 + i) + '</b><small style="display:block;font-size:12.5px;font-weight:700;color:var(--muted)">Station ' + (i + 1) + ' · ' + n + '</small></div><div style="display:grid;place-items:center;padding:0 14px;border-left:3px dotted #1B3A5C">' + icon('ticket', 22) + '</div></div>' }).join('') +
    '<div class="bubble2" style="margin-top:22px">Parraine un ami : +1 super ticket&nbsp;!</div></div>' + superNav('sj-tickets') + '</div>'
} }

/* ── Deroules (ordre du storyboard des maquettes) ──────────────────────── */
const COMMUN_FIN = ['c-profil', 'c-connexion', 'c-raccourci', 'c-raccourci-a', 'c-commerces', 'c-carte', 'c-fiche', 'c-partenaires', 'c-fichepart', 'c-demain', 'c-digital', 'm-code', 'm-valider', 'm-ok']
export const DEROULES: Record<string, string[]> = {
  quiz: ['s-flash', 's-accueil', 's-regles', 'q-question', 'q-bonne', 'q-mauvaise', 'q-resultat', 'q-bonusintro', 'q-bonus', 'q-bonusok', 'c-parrainage', 'c-inscription', 'c-ticket'].concat(COMMUN_FIN),
  solo: ['s-flash', 's-accueil', 's-regles', 'q-question', 'q-bonne', 'q-mauvaise', 'q-resultat', 'c-parrainage', 'c-inscription', 'c-ticket'].concat(COMMUN_FIN),
  spin: ['s-flash', 's-accueil', 's-regles', 'r-roue', 'r-tourne', 'r-gain', 'r-ticket', 'r-perdu', 'c-parrainage', 'c-inscription', 'c-billet', 'c-ticket'].concat(COMMUN_FIN),
  tombola: ['s-flash', 's-accueil', 's-regles', 't-tirer', 't-impression', 't-res-tirage', 't-res-instant', 'c-parrainage', 'c-inscription', 'c-ticket', 'c-billet'].concat(COMMUN_FIN),
  vote: ['s-flash', 's-accueil', 's-regles', 'v-choix', 'v-envoi', 'v-resultat', 'c-parrainage', 'c-inscription', 'c-ticket', 'v2-carte', 'v2-flash', 'v2-sondage'].concat(COMMUN_FIN),
  sej: ['sj-accueil', 'sj-carte', 'sj-station', 'sj-encours', 'sj-tickets'],
}
/** Ecrans qui animent quelque chose a l'entree (gere par le client). */
export function ecranExiste(id: string): boolean { return !!S[id] }

export function rendreEcran(v: VueMaster, r: EtatPartie, id: string): string {
  const s = S[id] || S['s-accueil']
  const theme = id.indexOf('sj-') === 0 ? 't-super' : v.theme
  return placerBandeau(v, s.r(v, r)).replace('<div class="scr', '<div data-id="' + id + '" class="' + theme + ' scr' + (s.tall ? ' tall' : ''))
}
