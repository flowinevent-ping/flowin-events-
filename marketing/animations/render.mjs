// Planches de relecture, verification des QR, export MP4.
// Usage :
//   node render.mjs --planches            planches 8 images + lecture des QR
//   node render.mjs [participants ...]    planches + export MP4 (toutes par defaut)
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const ici = dirname(fileURLToPath(import.meta.url))
const FPS = 30
const args = process.argv.slice(2)
const planchesSeules = args.includes('--planches')
const tous = ['participants-15', 'participants-30', 'organisateurs-15', 'organisateurs-30', 'partenaires-15', 'partenaires-30']
const ids = args.filter(a => !a.startsWith('--'))
const videos = ids.length ? ids : tous
mkdirSync(join(ici, 'planches'), { recursive: true })

const browser = await chromium.launch()

async function ouvrir(id) {
  const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  const erreurs = []
  page.on('pageerror', e => erreurs.push(e.message))
  page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()) })
  await page.goto(pathToFileURL(join(ici, `${id}.html`)).href + '#record')
  await page.waitForFunction(() => window.ANIM && window.ANIM.ready === true, null, { timeout: 30000 })
  return { ctx, page, erreurs }
}

async function planche(id, toutes) {
  const { ctx, page, erreurs } = await ouvrir(id)
  const info = await page.evaluate(() => ({ duration: window.ANIM.duration, scenes: window.ANIM.scenes, mode: window.SCENARIO.end.mode }))
  const sc = info.scenes
  // v3 : plans courts validés (2,5 s mini), gros titre lisible >= 1,5 s.
  const minLegende = id.endsWith('-v3') ? 2.5 : info.duration < 20 ? 2 : 3
  const avertissements = []
  // Controle sur toute la video : zones sures et textes reduits, a plusieurs
  // instants de chaque scene (apres le fondu d entree).
  for (const s of sc) {
    if (s.caption && s.dur < minLegende) avertissements.push(`[${s.label}] legende affichee ${s.dur} s < ${minLegende} s`)
    for (const f of [0.25, 0.6, 0.95]) {
      const t = s.start + Math.min(s.dur - 0.05, Math.max(0.45, s.dur * f))
      await page.evaluate(x => window.ANIM.seek(x), t)
      const w = await page.evaluate(() => window.__warnings || [])
      w.forEach(x => { const m = `[${s.label}] ${x}`; if (!avertissements.includes(m)) avertissements.push(m) })
    }
  }
  // Images cles : la toute premiere image (vignette de la video), les scenes
  // du milieu (6 au plus, reparties) et l ecran de fin.
  const milieu = sc.slice(1, -1)
  const pris = []
  if (toutes) sc.forEach(s => pris.push([s, s.start + Math.min(s.dur - 0.25, Math.max(1.2, s.dur * 0.7))]))
  else {
    pris.push([sc[0], 0])
    const n = Math.min(6, milieu.length)
    for (let k = 0; k < n; k++) { const s = milieu[Math.round(k * (milieu.length - 1) / Math.max(1, n - 1))]; pris.push([s, s.start + Math.min(s.dur - 0.25, Math.max(1.2, s.dur * 0.7))]) }
    const f = sc[sc.length - 1]; pris.push([f, f.start + f.dur - 0.3])
  }
  const images = []
  for (const [s, t] of pris) {
    await page.evaluate(x => window.ANIM.seek(x), t)
    const buf = await page.screenshot({ type: 'png' })
    images.push({ label: `${s.label} — ${t.toFixed(1)} s`, b64: buf.toString('base64') })
  }
  // QR : decodage de l ecran de fin en pleine resolution.
  const fin = sc[sc.length - 1]
  await page.evaluate(x => window.ANIM.seek(x), fin.start + fin.dur - 0.2)
  const png = PNG.sync.read(await page.screenshot({ type: 'png' }))
  const qr = info.mode === 'qr' ? jsQR(new Uint8ClampedArray(png.data), png.width, png.height) : null
  await ctx.close()

  const p2 = await browser.newPage({ viewport: { width: toutes ? 1400 : 1120, height: 1060 } })
  const html = `<html><body style="margin:0;background:#111;font-family:sans-serif;color:#fff">
  <div style="padding:8px 12px;font:700 15px sans-serif">${id} — ${info.duration.toFixed(1)} s</div>
  <div style="display:grid;grid-template-columns:repeat(${toutes ? 5 : 4},270px);gap:8px;padding:0 12px">
  ${images.map(i => `<div><img src="data:image/png;base64,${i.b64}" style="width:270px;height:480px;display:block"><div style="font:600 11px sans-serif;padding:3px 0 0">${i.label}</div></div>`).join('')}
  </div></body></html>`
  await p2.setContent(html)
  const out = join(ici, 'planches', `${id}${toutes ? '-toutes-scenes' : ''}.png`)
  await p2.screenshot({ path: out, fullPage: true })
  await p2.close()
  return { id, duration: info.duration, out, qr: qr ? qr.data : null, avertissements, erreurs }
}

async function exporter(id) {
  const { ctx, page, erreurs } = await ouvrir(id)
  const duration = await page.evaluate(() => window.ANIM.duration)
  const n = Math.round(duration * FPS)
  const out = join(ici, `${id}.mp4`)
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', String(FPS), out],
    { stdio: ['pipe', 'inherit', 'inherit'] })
  const fini = new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))))
  for (let i = 0; i < n; i++) {
    await page.evaluate(x => window.ANIM.seek(x), i / FPS)
    const buf = await page.screenshot({ type: 'png' })
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
    if (i % 150 === 0) process.stdout.write(`  ${id} ${i}/${n}\r`)
  }
  ff.stdin.end()
  await fini
  await ctx.close()
  if (erreurs.length) console.log(`  erreurs page ${id} :`, erreurs)
  return out
}

const rapport = []
for (const id of videos) {
  if (args.includes('--toutes')) await planche(id, true)
  const r = await planche(id)
  rapport.push(r)
  console.log(`${id} : ${r.duration.toFixed(1)} s, planche ${r.out}`)
  console.log(`  QR lu : ${r.qr || '(pas de QR sur cette coupe ou ILLISIBLE)'}`)
  if (r.avertissements.length) console.log('  avertissements :\n   ' + r.avertissements.join('\n   '))
  if (r.erreurs.length) console.log('  erreurs page :', r.erreurs)
}
// Le rapport garde les vidéos non relancées et remplace celles du jour.
let ancien = []
try { ancien = JSON.parse(readFileSync(join(ici, 'planches', 'rapport.json'), 'utf8')) } catch (e) { ancien = [] }
const neufs = rapport.map(({ id, duration, qr, avertissements, erreurs }) => ({ id, duration, qr, avertissements, erreurs }))
writeFileSync(join(ici, 'planches', 'rapport.json'), JSON.stringify(ancien.filter(a => !neufs.some(n => n.id === a.id)).concat(neufs), null, 2))

if (!planchesSeules) {
  for (const id of videos) {
    const out = await exporter(id)
    console.log(`\n${out}`)
  }
}
await browser.close()
