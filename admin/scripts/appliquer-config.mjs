// Recopie la configuration centrale (source unique : admin/public/flowin-config.js) vers ses miroirs, ou la verifie.
//   node admin/scripts/appliquer-config.mjs            recopie GARANTIE_ACTIVE
//   node admin/scripts/appliquer-config.mjs --verifier ne modifie rien ; sort en erreur si une copie differe
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const racine = join(dirname(fileURLToPath(import.meta.url)), '../..')
const lire = p => readFileSync(join(racine, p), 'utf8')
const source = lire('admin/public/flowin-config.js')
const m = /GARANTIE_ACTIVE:\s*(true|false)/.exec(source)
if (!m) { console.error('GARANTIE_ACTIVE introuvable dans admin/public/flowin-config.js'); process.exit(2) }
const valeur = m[1]
const verifier = process.argv.includes('--verifier')
let ko = 0
function maj(chemin, avant, apres, description) {
  const t = lire(chemin)
  const n = t.replace(avant, apres)
  if (n === t) { console.log('OK    ' + description); return }
  if (verifier) { console.log('DIFFERENT ' + description + ' (' + chemin + ')'); ko++; return }
  writeFileSync(join(racine, chemin), n); console.log('MIS A JOUR ' + description)
}
maj('admin/lib/flowinConfig.ts', /GARANTIE_ACTIVE = (true|false) \/\* @config GARANTIE_ACTIVE \*\//, `GARANTIE_ACTIVE = ${valeur} /* @config GARANTIE_ACTIVE */`, 'lib/flowinConfig.ts')
// miroir de la config pour les fonctions edge : copie octet pour octet
const a = lire('admin/public/flowin-config.js'), b = lire('supabase/functions/_shared/flowin-config.js')
if (a === b) console.log('OK    supabase/functions/_shared/flowin-config.js')
else if (verifier) { console.log('DIFFERENT supabase/functions/_shared/flowin-config.js'); ko++ }
else { writeFileSync(join(racine, 'supabase/functions/_shared/flowin-config.js'), a); console.log('MIS A JOUR supabase/functions/_shared/flowin-config.js') }
console.log('GARANTIE_ACTIVE = ' + valeur)
process.exit(ko)
