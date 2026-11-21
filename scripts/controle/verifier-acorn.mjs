// Vérifie que le JavaScript intégré de dashboard.html passe Acorn ecmaVersion 2020 (0 erreur).
// Usage : node scripts/controle/verifier-acorn.mjs [chemin/dashboard.html]
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const acorn = createRequire(resolve(racine, 'admin', 'package.json'))('acorn');
const fichier = process.argv[2] || resolve(racine, 'admin/public/dashboard.html');
const html = readFileSync(fichier, 'utf8');
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let m, n = 0, erreurs = 0;
while ((m = re.exec(html))) {
  n++;
  const ligneDebut = html.slice(0, m.index).split('\n').length;
  try { acorn.parse(m[1], { ecmaVersion: 2020 }); }
  catch (e) { erreurs++; console.log('ERREUR bloc ' + n + ' (ligne ~' + (ligneDebut + (e.loc ? e.loc.line : 0)) + ') : ' + e.message); }
}
console.log('Acorn ecmaVersion 2020 : ' + n + ' bloc(s) de script, ' + erreurs + ' erreur(s).');
process.exit(erreurs ? 1 : 0);
