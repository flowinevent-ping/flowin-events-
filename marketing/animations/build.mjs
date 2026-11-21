// Genere les pages HTML autonomes (polices et QR codes integres).
// Usage : node build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const ici = dirname(fileURLToPath(import.meta.url))
const lire = p => readFileSync(join(ici, p), 'utf8')

// Cible reelle de chaque QR de fin (justification dans SCENARIOS.md).
export const VIDEOS = [
  // Coupes 15 s (reseaux sociaux) : ecran de fin sans QR, mais la page garde
  // la meme cible pour le lien « en bio » (voir SCENARIOS.md).
  // Participants : ?preview=1 n ecrit aucun joueur, aucune participation ni
  // visite (lib/parcours.ts estApercu, lib/track.ts) : scanner ne cree pas de compte.
  { id: 'participants-15', qr: 'https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz&preview=1' },
  { id: 'participants-30', qr: 'https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz&preview=1' },
  { id: 'organisateurs-15', qr: 'https://flowin-events.vercel.app/pro/inscription' },
  { id: 'organisateurs-30', qr: 'https://flowin-events.vercel.app/pro/inscription' },
  { id: 'partenaires-15', qr: 'https://flowin-events.vercel.app/pro/inscription' },
  { id: 'partenaires-30', qr: 'https://flowin-events.vercel.app/pro/inscription' },
]

const polices = ['500', '700', '800'].map(w => {
  const b64 = readFileSync(join(ici, `node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`)).toString('base64')
  return `@font-face{font-family:'Manrope';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`
}).join('\n')

function qrPath(url) {
  const q = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const n = q.modules.size, d = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules.get(y, x)) d.push(`M${x} ${y}h1v1h-1z`)
  return { n, d: d.join(''), url }
}

const css = `
${polices}
*{box-sizing:border-box}
html,body{margin:0;background:#0A1424;color:#fff;font-family:Manrope,sans-serif}
body.record #ui{display:none}
body.record #stage{width:540px;height:960px}
body.record svg{display:block;width:540px;height:960px}
body.player{display:flex;flex-direction:column;align-items:center;padding:16px;gap:12px;min-height:100vh}
body.player #stage{width:min(100%,calc((100vh - 190px) * 0.5625));aspect-ratio:9/16;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.45)}
body.player svg{display:block;width:100%;height:100%}
#ui{width:min(100%,560px);display:flex;flex-direction:column;gap:10px}
#bar{display:flex;gap:8px;align-items:center}
#bar button{font:800 14px Manrope,sans-serif;border:0;border-radius:10px;padding:10px 16px;background:#3B5CC4;color:#fff;cursor:pointer}
#bar button#restart{background:#13314f}
#range{flex:1;accent-color:#00B4A0}
#time{font:700 13px Manrope,sans-serif;min-width:88px;text-align:right;color:#9FB4FF}
#scenes{display:flex;flex-wrap:wrap;gap:6px}
#scenes button{font:700 12px Manrope,sans-serif;border:1px solid #23406a;background:#0E1B30;color:#cfe0ff;border-radius:8px;padding:6px 9px;cursor:pointer}
#scenes button.on{background:#00B4A0;border-color:#00B4A0;color:#04121f}
`

for (const v of VIDEOS) {
  const scen = lire(`src/scenarios/${v.id}.js`)
  const titre = (scen.match(/titre: '([^']+)'/) || [])[1] || 'Flowin'
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titre}</title>
<style>${css}</style></head>
<body>
<div id="stage"><svg id="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 960" width="540" height="960"></svg></div>
<div id="ui">
  <div id="bar"><button id="play">Lecture</button><button id="restart">Rejouer</button><input id="range" type="range" min="0" max="1000" value="0"><span id="time">0:00</span></div>
  <div id="scenes"></div>
</div>
<script>window.QR=${JSON.stringify(qrPath(v.qr))}</script>
<script>${lire('src/engine.js')}</script>
<script>${lire('src/cast.js')}</script>
<script>${lire('src/decor.js')}</script>
<script>${scen}</script>
<script>FL.start(window.SCENARIO)</script>
</body></html>
`
  writeFileSync(join(ici, `${v.id}.html`), html)
  console.log(`${v.id}.html  (${Math.round(html.length / 1024)} ko)  QR -> ${v.qr}`)
}
