// Écrit le résumé en français (Markdown) du job GitHub Actions et le fichier resultats-code.json.
// Lit les variables R_TSC, R_BUILD, R_ACORN, R_GITLEAKS (success / failure / skipped) et resultats-smoke.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const etat = (v) => (v === 'success' ? 'vert' : v === 'failure' ? 'rouge' : 'orange');
const code = [
  ['CODE-TSC', 'Types TypeScript (tsc)', process.env.R_TSC, 'bloquant', 'Corriger les erreurs de types (voir tsc.log).'],
  ['CODE-BUILD', 'Compilation Next.js', process.env.R_BUILD, 'bloquant', 'Corriger la compilation (voir build.log).'],
  ['CODE-ACORN', 'JavaScript du dashboard (Acorn 2020)', process.env.R_ACORN, 'bloquant', 'Remplacer la syntaxe non compatible iOS (voir acorn.log).'],
  ['CODE-SECRETS', 'Recherche de secrets (gitleaks)', process.env.R_GITLEAKS, 'bloquant', 'Retirer le secret du dépôt et le renouveler.'],
].map(([c, l, v, g, a]) => ({
  famille: 'propreté', code: c, libelle: l, statut: etat(v), gravite: g,
  detail: v === 'success' ? 'Contrôle réussi.' : v === 'failure' ? 'Contrôle en échec.' : 'Contrôle non exécuté.',
  action: v === 'success' ? '' : a,
}));
writeFileSync('resultats-code.json', JSON.stringify(code, null, 2) + '\n');

let smoke = [];
try { if (existsSync('resultats-smoke.json')) smoke = JSON.parse(readFileSync('resultats-smoke.json', 'utf8')); } catch (e) { /* ignoré */ }
const tout = code.concat(smoke);
const n = (s) => tout.filter((r) => r.statut === s).length;
const lignes = ['## Contrôle qualité', '',
  'Vert : ' + n('vert') + ' · Orange : ' + n('orange') + ' · Rouge : ' + n('rouge'), '',
  n('rouge') + n('orange') === 0 ? 'Tout est vert.' : (n('rouge') + n('orange')) + ' point(s) à traiter.', '',
  '| Contrôle | État | Détail |', '|---|---|---|'];
for (const r of tout) lignes.push('| ' + r.libelle + ' | ' + r.statut + ' | ' + String(r.detail || '').replace(/\|/g, '/') + ' |');
lignes.push('', 'Les résultats complets sont dans l\'artefact « resultats-controle » de cette exécution.');
console.log(lignes.join('\n'));
