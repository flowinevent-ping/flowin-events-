/**
 * AUDIT EN LECTURE SEULE du kit imprimable Nuits du Sud (admin/public/nds/**) : decode le QR de chaque
 * image PNG (et de la 1re page des PDF d'affiches) avec jsQR et compare l'URL au nom du fichier.
 * Ne modifie AUCUN fichier du kit. Sortie : JSON + tableau.
 * usage : NODE_PATH=... node audit-kit-nds.js <dossier admin/public/nds> <sortie.json>
 */
const jsQR = require('jsqr')
const { PNG } = require('pngjs')
const fs = require('fs')
const path = require('path')
const cp = require('child_process')

const RACINE = path.resolve(process.argv[2])
const SORTIE = process.argv[3] || 'kit-nds.json'

function parcourir(d, out) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (['node_modules', 'vendor', 'clips', 'bilan', 'montage', 'ecrans-v2', 'refs-romain'].indexOf(e.name) < 0) parcourir(p, out) } else out.push(p)
  })
  return out
}
function decoder(buf) {
  let png
  try { png = PNG.sync.read(buf) } catch (e) { return { erreur: 'png illisible' } }
  /* essai pleine taille puis reduit (jsQR est plus fiable sur des images de taille moderee) */
  const essais = [1, 2, 3, 4]
  for (const f of essais) {
    const w = Math.floor(png.width / f), h = Math.floor(png.height / f)
    const data = new Uint8ClampedArray(w * h * 4)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y * f) * png.width + x * f) * 4, o = (y * w + x) * 4; data[o] = png.data[i]; data[o + 1] = png.data[i + 1]; data[o + 2] = png.data[i + 2]; data[o + 3] = 255 }
    const r = jsQR(data, w, h, { inversionAttempts: 'attemptBoth' })
    if (r) return { url: r.data }
  }
  return { url: null }
}

const fichiers = parcourir(RACINE, []).filter(f => /\.(png|pdf)$/i.test(f))
const lignes = []
for (const f of fichiers) {
  const rel = path.relative(RACINE, f)
  const base = path.basename(f)
  /* seuls les fichiers qui peuvent porter un QR de station : stations, forex, affiches A4, QR, pendentifs, planches */
  if (!/(station|forex|nds_a4|^qr|qr_|qr-|pendentif|planche|a4|affiche|vignette|caisse|bar-|brigade)/i.test(base)) continue
  let res
  if (/\.pdf$/i.test(f)) {
    const tmp = '/tmp/qa-kit-nds-' + process.pid
    try {
      cp.execFileSync('pdftoppm', ['-r', '110', '-f', '1', '-l', '1', '-png', f, tmp], { stdio: 'ignore' })
      const sorties = fs.readdirSync('/tmp').filter(x => x.indexOf('qa-kit-nds-' + process.pid) === 0)
      res = sorties.length ? decoder(fs.readFileSync('/tmp/' + sorties[0])) : { erreur: 'rasterisation impossible' }
      sorties.forEach(x => fs.unlinkSync('/tmp/' + x))
    } catch (e) { res = { erreur: 'pdf non lu' } }
  } else {
    res = decoder(fs.readFileSync(f))
  }
  let ev = '', source = ''
  if (res.url) { try { const u = new URL(res.url); ev = u.searchParams.get('ev') || ''; source = u.searchParams.get('source') || u.searchParams.get('station') || '' } catch (e) { /* pas une URL */ } }
  lignes.push({ fichier: rel, url: res.url || null, ev, source, erreur: res.erreur || null })
  console.log((res.url ? 'QR  ' : '-   ') + rel + (res.url ? '  =>  ' + res.url : res.erreur ? '  (' + res.erreur + ')' : '  (pas de QR decodable)'))
}
fs.writeFileSync(SORTIE, JSON.stringify(lignes, null, 2))
console.log('\n' + lignes.filter(l => l.url).length + ' fichier(s) avec QR decode sur ' + lignes.length + ' examines')
