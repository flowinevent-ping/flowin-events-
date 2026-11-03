// Liste les elements qui depassent la largeur de l'ecran (390 px) sur une page de l'espace pro.
// usage : node debord.js <chemin> [uid email]
const { chromium } = require('playwright')
const BASE = 'http://127.0.0.1:3100'
;(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME_BIN })
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage()
  await p.goto(BASE + process.argv[2], { waitUntil: 'networkidle', timeout: 90000 })
  await p.waitForTimeout(800)
  const r = await p.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(e => { const b = e.getBoundingClientRect(); return b.right > window.innerWidth + 1 && b.width > 0 && getComputedStyle(e).position !== 'fixed' })
    .slice(0, 14).map(e => e.tagName + '.' + (typeof e.className === 'string' ? e.className.slice(0, 30) : '') + ' w=' + Math.round(e.getBoundingClientRect().width) + ' r=' + Math.round(e.getBoundingClientRect().right) + ' | ' + (e.textContent || '').trim().slice(0, 40)))
  console.log(r.join('\n'))
  await br.close()
})()
