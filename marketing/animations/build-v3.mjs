// Vidéos v3 (neuf films, style H pastel) : pages storyboard autonomes,
// scripts voix off horodatés (.srt + .txt) et note musique.
// Textes : src/h/films-v3.js (scénarios validés) et src/h/films-v4.js (réécritures v4).
// Dessins : src/h/v3-<id>.js, src/h/v4-<film>.js (id « s3-v4 » -> v4-s3.js).
// Usage : node build-v3.mjs [s1 s3 ...]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const ici = dirname(fileURLToPath(import.meta.url))
const lire = p => readFileSync(join(ici, p), 'utf8')
// Même cible que les vidéos existantes : ?preview=1 n'écrit rien (lib/parcours.ts estApercu).
const QR_DEMO = 'https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz&preview=1'

// Réécritures : films-v4.js, films-v5.js… ajoutent leurs films au tableau FILMS.
const EXTRAS = ['src/h/films-v4.js', 'src/h/films-v5.js'].filter(p => existsSync(join(ici, p)))
const FILMS = new Function(lire('src/h/films-v3.js') + ';' + EXTRAS.map(lire).join(';') + ';return FILMS')()
const version = id => { const m = /-v(\d+)$/.exec(id); return m ? +m[1] : 3 }
const srcFilm = id => version(id) > 3 ? `src/h/v${version(id)}-${id.replace(/-v\d+$/, '')}.js` : `src/h/v3-${id}.js`
const sortie = id => version(id) > 3 ? `${id}.html` : `${id}-v3.html`
const ECARTS = new Function('var window={};' + lire('src/h/ecarts-v3.js') + ';return window.ECARTS')()
const demandes = process.argv.slice(2)
const films = FILMS.filter(f => (!demandes.length || demandes.includes(f.id)) && existsSync(join(ici, srcFilm(f.id))))

const polices = ['500', '700', '800'].map(w => {
  const b64 = readFileSync(join(ici, `node_modules/@fontsource/manrope/files/manrope-latin-${w}-normal.woff2`)).toString('base64')
  return `@font-face{font-family:'Manrope';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2')}`
}).join('\n')

// Affiches réelles (kit digital NDS), QR de station remplacé par le QR démo.
const ASSETS = {
  afficheStation: 'data:image/jpeg;base64,' + readFileSync(join(ici, 'assets/affiche-station-caisse.jpg')).toString('base64'),
  affichePartenaire: 'data:image/jpeg;base64,' + readFileSync(join(ici, 'assets/affiche-a4-partenaire.jpg')).toString('base64'),
}

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
.sous{color:var(--mut);font:600 16px/1.5 Manrope,sans-serif;margin:0 0 10px;max-width:620px}
.meta{color:var(--mut);font:600 13px/1.5 Manrope,sans-serif;margin:0 0 22px;max-width:620px}
.meta b{color:var(--txt)}
ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
li{display:grid;grid-template-columns:92px 1fr;gap:14px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;cursor:pointer;transition:.2s}
li.on{border-color:var(--mag);background:rgba(224,33,138,.12)}
.tc{font:800 13px Manrope,sans-serif;color:var(--mut);padding-top:3px}
li.on .tc{color:var(--mag)}
.st{font:800 18px Manrope,sans-serif;letter-spacing:-.02em}
.sd{font:600 14px/1.45 Manrope,sans-serif;color:var(--mut);margin-top:4px}
.se{font:700 13.5px/1.4 Manrope,sans-serif;margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.06)}
.se b{color:var(--mag);font-weight:800;margin-right:6px}
.vo b{color:#F5A100}
.ec{font:600 12.5px/1.4 Manrope,sans-serif;color:#F5A100;margin-top:6px;font-style:italic}
@media (max-width:820px){#wrap{grid-template-columns:1fr}#left{position:static;max-width:380px;margin:0 auto;width:100%}}
`

// Temps : « 0:03,5 » (page) et « 00:00:03,500 » (SRT).
const tPage = x => { const m = Math.floor(x / 60), s = Math.round((x % 60) * 10) / 10; return m + ':' + (s < 10 ? '0' : '') + String(s).replace('.', ',') }
const tSrt = x => { const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}` }

// Direction de voix retenue pour les neuf vidéos (consigne client).
const DIRECTION_VOIX = 'Voix féminine, cool, posée, suave, chaleureuse, un peu « waouh », pas ultra dynamique. Tutoiement côté joueurs, vouvoiement côté pros.'
mkdirSync(join(ici, 'voix-off'), { recursive: true })
writeFileSync(join(ici, 'voix-off/README.md'), `# Voix off et musique des vidéos v3

Image d'abord, son ensuite : les MP4 sont muets ; la voix off et la musique sont livrées à part et se posent au montage.

## Direction de voix (toutes les vidéos)
${DIRECTION_VOIX}

## Fichiers
- \`<id>.srt\` : sous-titres horodatés de la voix off (une réplique par scène, calée sur le minutage de la vidéo).
- \`<id>.txt\` : script lisible : direction de voix, note musique du film, puis chaque scène (temps, voix off, texte à l'écran, écart éventuel avec le scénario validé).

## Musique par film
${FILMS.map(f => `- **${f.id} — ${f.title}** (${f.dur} s) : ${f.music}`).join('\n')}
`)
for (const f of films) {
  const n = f.s.length
  // Voix off horodatée : chaque réplique sur la durée de sa scène.
  const srt = [], txt = [`${f.tab} — ${f.title}`, `Durée : ${f.dur} s · 9:16 · MP4 muet (voix et musique à poser au montage)`, '', `DIRECTION DE VOIX (toutes les vidéos) : ${DIRECTION_VOIX}`, `Adresse dans ce film : ${/vouvoiement/.test(f.voice) && /tutoiement/.test(f.voice) ? 'tutoiement côté client, vouvoiement côté commerçant' : /vouvoiement/.test(f.voice) ? 'vouvoiement (pros)' : 'tutoiement (joueurs)'}.`, `MUSIQUE : ${f.music}`, `APPEL À L'ACTION : ${f.cta}`, '', 'SCRIPT HORODATÉ', '']
  const E = ECARTS[f.id] || {}
  f.s.forEach((s, i) => {
    const a = s[0], b = i + 1 < n ? f.s[i + 1][0] : f.dur, e = E[i] || {}
    const vo = e.vo || s[4], ecran = e.ecran || s[3]
    srt.push(`${i + 1}\n${tSrt(a + 0.15)} --> ${tSrt(b - 0.15)}\n${vo}\n`)
    txt.push(`[${tPage(a)} – ${tPage(b)}] ${s[1]}`, `   Voix off : ${vo}`, `   À l'écran : ${ecran}`)
    if (e.pourquoi) txt.push(`   Écart avec le scénario validé (voix off d'origine : « ${s[4]} » ; écran d'origine : « ${s[3]} ») : ${e.pourquoi}`)
    txt.push('')
  })
  writeFileSync(join(ici, `voix-off/${f.id}.srt`), srt.join('\n'))
  writeFileSync(join(ici, `voix-off/${f.id}.txt`), txt.join('\n'))

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${f.title}</title>
<style>${css}</style></head>
<body>
<div id="wrap">
  <div id="left">
    <div id="stage"><svg id="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 960" width="540" height="960"></svg></div>
    <div id="ui"><button id="play">Lecture</button><button id="restart">Rejouer</button><input id="range" type="range" min="0" max="1000" value="0"><span id="time">0:00</span></div>
  </div>
  <div id="side">
    <div class="eyebrow">ANIMATION EXPLICATIVE · ${f.dur} S · 9:16</div>
    <h1 id="titre"></h1>
    <p class="sous" id="sous"></p>
    <p class="meta"><b>Voix :</b> ${DIRECTION_VOIX}<br><b>Musique :</b> ${f.music}<br><b>Appel à l’action :</b> ${f.cta}<br>MP4 muet : voix off et musique se posent au montage (script horodaté dans <code>voix-off/${f.id}.srt</code>).</p>
    <ol id="liste"></ol>
  </div>
</div>
<script>window.QR=${JSON.stringify(qrPath(QR_DEMO))};window.ASSETS=${JSON.stringify(ASSETS)}</script>
<script>${lire('src/h/films-v3.js')}</script>
${EXTRAS.map(p => `<script>${lire(p)}</script>`).join('\n')}
<script>${lire('src/h/ecarts-v3.js')}</script>
<script>${lire('src/h/engine-h.js')}</script>
<script>${lire('src/h/kit-h.js')}</script>
<script>${lire('src/h/kit-v3.js')}</script>
<script>${lire('src/h/kit-v4.js')}</script>
<script>${lire('src/h/kit-v5.js')}</script>
<script>${lire(srcFilm(f.id))}</script>
<script>
(function(){
  var S=window.SCENARIO,a=0,h='';
  function f(x){var m=Math.floor(x/60),s=Math.round((x%60)*10)/10;return m+':'+(s<10?'0':'')+String(s).replace('.',',')}
  function e(x){return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  document.getElementById('titre').textContent=S.titre;
  document.getElementById('sous').textContent=S.sous;
  S.scenes.forEach(function(s,i){
    h+='<li data-scene="'+i+'"><div class="tc">'+f(a)+' – '+f(a+s.dur)+'</div><div><div class="st">'+(i+1)+'. '+e(s.label)+'</div><div class="sd">'+e(s.desc)+'</div><div class="se"><b>À l’écran</b>'+e(s.ecran)+'</div><div class="se vo"><b>Voix off</b>'+e(s.vo)+'</div>'+(s.ecart?'<div class="ec">Écart : '+e(s.ecart)+'</div>':'')+'</div></li>';
    a+=s.dur;
  });
  document.getElementById('liste').innerHTML=h;
})();
FLH.start(window.SCENARIO)
</script>
</body></html>
`
  writeFileSync(join(ici, sortie(f.id)), html)
  console.log(`${sortie(f.id)}  (${Math.round(html.length / 1024)} ko)  ${f.dur} s  QR -> ${QR_DEMO}`)
}
