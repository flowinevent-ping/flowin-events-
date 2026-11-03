/** Playwright : « satisfait ou rembourse » absent du texte VISIBLE quand GARANTIE_ACTIVE=false, de retour quand true (config interceptee). */
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:3100'
let ko = 0; const v = (n, ok, d) => { console.log((ok ? 'OK ' : 'KO ') + n + (d ? ' [' + d + ']' : '')); if (!ok) ko++ }
const PAGES = ['bon-commande-animation.html', 'cgv-animation-magasin.html', 'plaquette-animation-magasin.html']
const RE = /satisfait ou rembours|garantie satisfait|rembours[ée] en cas/i
;(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_BIN })
  for (const actif of [false, true]) for (const pg of PAGES) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage()
    await ctx.route('**/flowin-config.js', r => r.fulfill({ contentType: 'application/javascript', body: 'window.FLOWIN_CONFIG={GARANTIE_ACTIVE:' + actif + '};' }))
    await p.goto(BASE + '/' + pg, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
    // texte visible : toutes les sections, y compris celles qui ne sont pas « on » (on teste le DOM rendu non cache)
    const visible = await p.evaluate(() => { var t = ''; var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); var n; while ((n = w.nextNode())) { var e = n.parentElement; if (!e || /SCRIPT|STYLE/.test(e.tagName)) continue; if (e.closest('[hidden]')) continue; var cs = getComputedStyle(e); if (cs.display === 'none') continue; t += ' ' + n.textContent } return t })
    const trouve = RE.test(visible)
    v(pg + ' garantie=' + actif + ' : texte visible ' + (actif ? 'présent' : 'absent'), actif ? trouve : !trouve)
    await ctx.close()
  }
  await br.close(); console.log('KO=' + ko); process.exit(ko)
})()
