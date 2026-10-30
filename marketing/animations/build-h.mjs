// Pages style H (« typo + vrais écrans ») au format storyboard : lecteur 9:16
// à gauche, liste des scènes horodatées et cliquables à droite. Autonomes
// (polices et QR intégrés). Usage : node build-h.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const ici = dirname(fileURLToPath(import.meta.url))
const lire = p => readFileSync(join(ici, p), 'utf8')

// Même cible que la V3 : ?preview=1 n'écrit aucun joueur ni participation
// (lib/parcours.ts estApercu) ; scanner ne crée pas de compte.
export const VIDEOS_H = [
  { id: 'participants-h', src: 'src/h/participants-h.js', qr: 'https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz&preview=1', eyebrow: 'ANIMATION EXPLICATIVE · 38 S · 9:16', title: 'Comment on joue avec Flowin' },
  { id: 'participants-commerces-h', src: 'src/h/participants-commerces-h.js', kit: true, qr: 'https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz&preview=1', eyebrow: 'ANIMATION EXPLICATIVE · 44 S · 9:16', title: 'Flowin chez tes commerçants' },
  { id: 'participants-festival-h', src: 'src/h/participants-festival-h.js', kit: true, qr: 'https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz&preview=1', eyebrow: 'ANIMATION EXPLICATIVE · 33 S · 9:16', title: 'Flowin à ton festival' },
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
:root{--bg:#150C1C;--card:#1E1226;--txt:#F6F1FA;--mut:#BBAACB;--line:rgba(255,255,255,.12);--mag:#E0218A}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--txt);font-family:Manrope,sans-serif}
body.record #ui,body.record #side{display:none}
body.record #wrap{display:block;padding:0}
body.record #left{position:static;max-width:none;margin:0;width:540px}
body.record #stage{width:540px;height:960px;border-radius:0;box-shadow:none}
body.record svg{display:block;width:540px;height:960px}
#wrap{display:grid;grid-template-columns:minmax(260px,420px) 1fr;gap:32px;max-width:1180px;margin:0 auto;padding:28px 20px;align-items:start}
#left{position:sticky;top:20px}
#stage{width:100%;aspect-ratio:9/16;border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}
#stage svg{display:block;width:100%;height:100%}
#ui{display:flex;gap:8px;align-items:center;margin-top:12px}
#ui button{font:800 14px Manrope,sans-serif;border:0;border-radius:100px;padding:10px 16px;background:var(--mag);color:#fff;cursor:pointer}
#ui button#restart{background:rgba(255,255,255,.1)}
#range{flex:1;accent-color:#E0218A}
#time{font:700 13px Manrope,sans-serif;min-width:84px;text-align:right;color:var(--mut)}
.eyebrow{font:800 12px Manrope,sans-serif;letter-spacing:.14em;color:var(--mag)}
h1{font:800 clamp(28px,4vw,44px)/1.05 Manrope,sans-serif;letter-spacing:-.04em;margin:10px 0 8px}
.sous{color:var(--mut);font:600 16px/1.5 Manrope,sans-serif;margin:0 0 22px;max-width:620px}
ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
li{display:grid;grid-template-columns:92px 1fr;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;cursor:pointer;transition:.2s}
li.on{border-color:var(--mag);background:rgba(224,33,138,.12)}
.tc{font:800 13px Manrope,sans-serif;color:var(--mut);padding-top:3px}
li.on .tc{color:var(--mag)}
.st{font:800 18px Manrope,sans-serif;letter-spacing:-.02em}
.sd{font:600 14px/1.45 Manrope,sans-serif;color:var(--mut);margin-top:4px}
.se{font:700 13.5px/1.4 Manrope,sans-serif;margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.06)}
.se b{color:var(--mag);font-weight:800;margin-right:6px}
@media (max-width:820px){#wrap{grid-template-columns:1fr}#left{position:static;max-width:380px;margin:0 auto;width:100%}}
`

for (const v of VIDEOS_H) {
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${v.title}</title>
<style>${css}</style></head>
<body>
<div id="wrap">
  <div id="left">
    <div id="stage"><svg id="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 960" width="540" height="960"></svg></div>
    <div id="ui"><button id="play">Lecture</button><button id="restart">Rejouer</button><input id="range" type="range" min="0" max="1000" value="0"><span id="time">0:00</span></div>
  </div>
  <div id="side">
    <div class="eyebrow">${v.eyebrow}</div>
    <h1 id="titre"></h1>
    <p class="sous" id="sous"></p>
    <ol id="liste"></ol>
  </div>
</div>
<script>window.QR=${JSON.stringify(qrPath(v.qr))}</script>
<script>${lire('src/h/engine-h.js')}</script>
${v.kit ? `<script>${lire('src/h/kit-h.js')}</script>` : ''}
<script>${lire(v.src)}</script>
<script>
(function(){
  var S=window.SCENARIO,a=0,h='';
  function f(x){var m=Math.floor(x/60),s=Math.round((x%60)*10)/10;return m+':'+(s<10?'0':'')+String(s).replace('.',',')}
  document.getElementById('titre').textContent=S.titre;
  document.getElementById('sous').textContent=S.sous;
  S.scenes.forEach(function(s,i){
    var ec=(s.mots?s.mots.join(' ')+' — ':'')+s.caption;
    h+='<li data-scene="'+i+'"><div class="tc">'+f(a)+' – '+f(a+s.dur)+'</div><div><div class="st">'+(i+1)+'. '+s.label+'</div><div class="sd">'+s.desc+'</div><div class="se"><b>À l’écran</b>'+ec+'</div></div></li>';
    a+=s.dur;
  });
  document.getElementById('liste').innerHTML=h;
})();
FLH.start(window.SCENARIO)
</script>
</body></html>
`
  writeFileSync(join(ici, `${v.id}.html`), html)
  console.log(`${v.id}.html  (${Math.round(html.length / 1024)} ko)  QR -> ${v.qr}`)
}
