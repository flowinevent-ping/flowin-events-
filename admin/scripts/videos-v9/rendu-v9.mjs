// Rendu image par image (24 i/s) de films-v9.html : node rendu-v9.mjs <film> <dossier_images> [t0 t1 pas]  (film : v9acom, v9apart, v9separt, v9seorg)
import { createRequire } from 'module'; const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url'
const here = path.dirname(fileURLToPath(import.meta.url))
const [film, out, a, b, pas] = process.argv.slice(2)
const url = 'file://' + path.join(here, '..', '..', 'public', 'videos', 'scenes', 'films-v10.html') + '#' + film
fs.mkdirSync(out, { recursive: true })
const br = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM, args: ['--no-sandbox'] } : {}); const pg = await br.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
const errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
await pg.goto(url); await pg.waitForTimeout(600)
const dur = await pg.evaluate(() => window.DUREE)
const t0 = a ? parseFloat(a) : 0, t1 = b ? parseFloat(b) : dur, st = pas ? parseFloat(pas) : 1 / 24
let n = 0
for (let t = t0; t < t1 - 1e-6; t += st) {
  await pg.evaluate(x => window.render(x), t)
  await pg.screenshot({ path: path.join(out, 'f' + String(n++).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 })
}
console.log(film, 'duree', dur.toFixed(2), 'images', n, 'erreurs', JSON.stringify(errs.slice(0, 5)))
await br.close()
