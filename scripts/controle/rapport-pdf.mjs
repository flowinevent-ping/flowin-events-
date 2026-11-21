// Rapport de contrôle qualité : un seul PDF (A4) + sa source HTML + le JSON fusionné.
// Usage :
//   node scripts/controle/rapport-pdf.mjs resultats-smoke.json resultats-base.json [--prev ancien.json]
//        [--date AAAA-MM-JJ] [--out-dir docs/rapports] [--no-prev]
// Les fichiers absents ou illisibles sont ignorés (le rapport le dit). Format d'une ligne :
//   {famille, code, libelle, statut: vert|orange|rouge, gravite: bloquant|important|info, detail, action}
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerPlaywright, lancer } from './_playwright.mjs';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const fichiers = [];
let prevArg = '', dateArg = '', sortieDir = join(RACINE, 'docs', 'rapports'), sansPrev = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--prev') prevArg = argv[++i];
  else if (argv[i] === '--date') dateArg = argv[++i];
  else if (argv[i] === '--out-dir') sortieDir = resolve(argv[++i]);
  else if (argv[i] === '--no-prev') sansPrev = true;
  else fichiers.push(argv[i]);
}
const date = dateArg || new Date().toISOString().slice(0, 10);

// Familles, dans l'ordre du rapport ; agent responsable = nom dans .claude/agents
const FAMILLES = [
  { cle: 'securite', nom: 'Sécurité', agent: 'securite-donnees', base: true },
  { cle: 'integrite', nom: 'Intégrité', agent: 'securite-donnees', base: true },
  { cle: 'envois', nom: 'Envois', agent: 'flux-integrations', base: true },
  { cle: 'proprete', nom: 'Propreté', agent: 'recette-tests', base: true },
  { cle: 'produit', nom: 'Produit', agent: 'produit-ergonomie', base: true },
  { cle: 'facturation', nom: 'Facturation', agent: 'facturation-crm', base: true },
  { cle: 'pages', nom: 'Pages', agent: 'recette-tests', base: false },
  { cle: 'derive', nom: 'Dérive', agent: 'recette-tests', base: true },
];
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ORDRE = { rouge: 0, orange: 1, vert: 2 };
const TEXTE = { vert: 'VERT', orange: 'ORANGE', rouge: 'ROUGE' };
const GRAV = { bloquant: 0, important: 1, info: 2 };

function lire(chemin) {
  if (!chemin || !existsSync(chemin)) return { ok: false, lignes: [] };
  try {
    let j = JSON.parse(readFileSync(chemin, 'utf8'));
    if (j && !Array.isArray(j)) j = j.controles || j.resultats || j.results || j.rows || [];
    if (!Array.isArray(j)) return { ok: false, lignes: [] };
    return { ok: true, lignes: j.filter((r) => r && r.code).map(nettoyer) };
  } catch (e) { return { ok: false, lignes: [] }; }
}
function nettoyer(r) {
  const st = norm(r.statut);
  return {
    famille: norm(r.famille), code: String(r.code), libelle: String(r.libelle || r.code),
    statut: st === 'vert' || st === 'orange' || st === 'rouge' ? st : 'orange',
    gravite: ['bloquant', 'important', 'info'].indexOf(norm(r.gravite)) >= 0 ? norm(r.gravite) : 'info',
    detail: String(r.detail || ''), action: String(r.action || ''),
  };
}

// --- Chargement
const lus = fichiers.map((f) => ({ f, ...lire(f) }));
const manquants = lus.filter((l) => !l.ok).map((l) => l.f);
const toutes = [];
for (const l of lus) for (const r of l.lignes) toutes.push(r);
const estBase = (r) => r.code.indexOf('CODE-') !== 0 && r.famille !== 'pages';
const baseDispo = toutes.some(estBase);

// --- Précédent
let prevLignes = null, prevNom = '';
if (!sansPrev) {
  let p = prevArg;
  if (!p && existsSync(sortieDir)) {
    const cands = readdirSync(sortieDir).filter((f) => /^controle-\d{4}-\d{2}-\d{2}\.json$/.test(f) && f < 'controle-' + date + '.json').sort();
    if (cands.length) p = join(sortieDir, cands[cands.length - 1]);
  }
  const l = lire(p);
  if (l.ok) { prevLignes = l.lignes; prevNom = p.split('/').pop(); }
}

// --- Calculs
const compte = (rows) => ({ vert: rows.filter((r) => r.statut === 'vert').length, orange: rows.filter((r) => r.statut === 'orange').length, rouge: rows.filter((r) => r.statut === 'rouge').length });
const total = compte(toutes);
const aCorriger = total.orange + total.rouge;
const pill = (s) => '<span class="pill ' + s + '">' + TEXTE[s] + '</span>';
const trier = (rows) => rows.slice().sort((a, b) => ORDRE[a.statut] - ORDRE[b.statut] || GRAV[a.gravite] - GRAV[b.gravite] || a.code.localeCompare(b.code));
const dependRomain = trier(toutes.filter((r) => r.statut !== 'vert' && /romain|confirm|valid|d[eé]cid|ex[eé]cut|go explicite/i.test(r.action)));
const agentDe = (famille) => { const f = FAMILLES.find((x) => x.cle === famille); return f ? f.agent : 'recette-tests'; };
const dateFr = new Date(date + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

const fl = (statut, prev) => {
  if (!prev) return '';
  const d = ORDRE[statut] - ORDRE[prev]; // plus grand = meilleur
  return d > 0 ? '<span class="tr mieux">&uarr; mieux</span>' : d < 0 ? '<span class="tr moins">&darr; moins bien</span>' : '<span class="tr">&rarr; stable</span>';
};
const prevPar = {};
if (prevLignes) for (const r of prevLignes) prevPar[r.code] = r.statut;

// --- HTML
const sections = [];
const toc = [];
toc.push('<li><a href="#a-faire">Ce qui dépend de Romain</a></li>');
for (const f of FAMILLES) {
  const rows = trier(toutes.filter((r) => r.famille === f.cle));
  const c = compte(rows);
  let corps;
  if (!rows.length) {
    corps = '<p class="vide">' + (f.base && !baseDispo ? 'Contrôles de la base : en cours de mise en place.' : 'Aucun contrôle reçu pour cette famille.') + '</p>';
  } else {
    corps = rows.map((r) => {
      const ps = prevPar[r.code];
      return '<article class="ligne ' + r.statut + '"><div class="tete">' + pill(r.statut) +
        '<span class="gr">' + esc(r.gravite) + '</span>' + fl(r.statut, ps) + '</div>' +
        '<h3>' + esc(r.libelle) + '</h3>' +
        (r.detail ? '<p class="detail">' + esc(r.detail) + '</p>' : '') +
        (r.statut !== 'vert' && r.action ? '<p class="action"><b>À faire :</b> ' + esc(r.action) + '</p>' : '') +
        (r.statut !== 'vert' ? '<p class="qui"><b>Qui :</b> ' + esc(agentDe(r.famille)) + '</p>' : '') +
        '<p class="code">' + esc(r.code) + '</p></article>';
    }).join('\n');
  }
  const resume = rows.length ? c.rouge + ' rouge, ' + c.orange + ' orange, ' + c.vert + ' vert' : (f.base && !baseDispo ? 'en cours de mise en place' : 'aucun contrôle');
  toc.push('<li><a href="#f-' + f.cle + '">' + esc(f.nom) + '</a> <span class="mini">' + esc(resume) + '</span></li>');
  sections.push('<section id="f-' + f.cle + '"><h2>' + esc(f.nom) + '</h2><p class="resp">Agent responsable : ' + esc(f.agent) + '</p>' + corps + '</section>');
}

const histo = [];
if (prevLignes) {
  histo.push('<section id="historique"><h2>Historique</h2><p class="resp">Comparé à : ' + esc(prevNom) + '</p><table><thead><tr><th>Famille</th><th>Avant (rouge / orange / vert)</th><th>Maintenant</th><th>Tendance</th></tr></thead><tbody>');
  for (const f of FAMILLES) {
    const a = compte(prevLignes.filter((r) => r.famille === f.cle)), b = compte(toutes.filter((r) => r.famille === f.cle));
    if (!(a.vert + a.orange + a.rouge + b.vert + b.orange + b.rouge)) continue;
    const mal = (x) => x.rouge * 2 + x.orange;
    const t = mal(b) < mal(a) ? '<span class="tr mieux">&uarr; mieux</span>' : mal(b) > mal(a) ? '<span class="tr moins">&darr; moins bien</span>' : '<span class="tr">&rarr; stable</span>';
    histo.push('<tr><td>' + esc(f.nom) + '</td><td>' + a.rouge + ' / ' + a.orange + ' / ' + a.vert + '</td><td>' + b.rouge + ' / ' + b.orange + ' / ' + b.vert + '</td><td>' + t + '</td></tr>');
  }
  histo.push('</tbody></table></section>');
  toc.push('<li><a href="#historique">Historique</a></li>');
}

const banniere = !toutes.length ? ['orange', 'Aucun résultat reçu']
  : aCorriger === 0 ? ['vert', 'Tout est vert : ' + total.vert + ' contrôles réussis']
  : [total.rouge ? 'rouge' : 'orange', aCorriger + ' point' + (aCorriger > 1 ? 's' : '') + ' à corriger (' + total.rouge + ' rouge, ' + total.orange + ' orange)'];

const css = `
@page { size: A4; margin: 16mm 14mm 18mm 14mm; }
:root { --bleu:#3B5CC4; --encre:#1B3A5C; --gris:#5B6B7F; --trait:#D9E0EC; --fond:#F5F7FB; }
* { box-sizing: border-box; }
body { font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif; color: var(--encre); font-size: 12pt; line-height: 1.45; margin: 0; background: #fff; }
h1 { font-size: 26pt; margin: 0 0 6pt; color: var(--bleu); line-height: 1.15; }
h2 { font-size: 17pt; color: var(--bleu); border-bottom: 2px solid var(--bleu); padding-bottom: 4pt; margin: 0 0 8pt; }
h3 { font-size: 12.5pt; margin: 4pt 0 3pt; }
a { color: var(--bleu); }
.couv { page-break-after: always; }
.marque { color: var(--gris); font-size: 11pt; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 30mm; }
.date { font-size: 14pt; color: var(--gris); margin-bottom: 12mm; }
.banniere { border-left: 8px solid; padding: 12pt 14pt; font-size: 16pt; font-weight: bold; border-radius: 4px; margin-bottom: 10mm; }
.banniere.vert { background:#E3F3EA; border-color:#1E7A46; color:#14532D; }
.banniere.orange { background:#FFF0DC; border-color:#C2410C; color:#7C2D0A; }
.banniere.rouge { background:#FCE6E6; border-color:#B42318; color:#7A1410; }
.chiffres { display: flex; gap: 8pt; margin-bottom: 10mm; }
.chiffres div { flex: 1; border: 1px solid var(--trait); border-radius: 6px; padding: 8pt; text-align: center; }
.chiffres b { display:block; font-size: 22pt; }
.note { background: var(--fond); border: 1px solid var(--trait); border-radius: 6px; padding: 8pt 10pt; font-size: 11pt; margin-bottom: 8pt; }
nav { page-break-after: always; }
nav ol { padding-left: 18pt; font-size: 13pt; }
nav li { margin-bottom: 7pt; }
.mini { color: var(--gris); font-size: 10.5pt; margin-left: 6pt; }
section { margin-bottom: 12mm; }
.resp { color: var(--gris); font-size: 10.5pt; margin: 0 0 8pt; }
.vide { color: var(--gris); font-style: italic; }
.ligne { border: 1px solid var(--trait); border-left: 6px solid; border-radius: 6px; padding: 8pt 10pt; margin-bottom: 8pt; page-break-inside: avoid; }
.ligne.vert { border-left-color:#1E7A46; } .ligne.orange { border-left-color:#C2410C; } .ligne.rouge { border-left-color:#B42318; }
.tete { display:flex; gap:8pt; align-items:center; }
.pill { display:inline-block; font-weight:bold; font-size:10pt; padding:2pt 9pt; border-radius:20pt; letter-spacing:.05em; }
.pill.vert { background:#E3F3EA; color:#14532D; border:1px solid #1E7A46; }
.pill.orange { background:#FFF0DC; color:#7C2D0A; border:1px solid #C2410C; }
.pill.rouge { background:#FCE6E6; color:#7A1410; border:1px solid #B42318; }
.gr { font-size: 10pt; color: var(--gris); }
.detail, .action, .qui { margin: 2pt 0; font-size: 11.5pt; }
.code { margin: 3pt 0 0; font-size: 8.5pt; color: var(--gris); font-family: "DejaVu Sans Mono", monospace; }
.tr { font-size: 10pt; font-weight: bold; color: var(--gris); }
.tr.mieux { color:#1E7A46; } .tr.moins { color:#B42318; }
table { width:100%; border-collapse: collapse; font-size: 11pt; }
th, td { border: 1px solid var(--trait); padding: 5pt 7pt; text-align: left; }
th { background: var(--fond); }
.romain { list-style: none; padding: 0; }
`;

const aFaireHtml = dependRomain.length
  ? dependRomain.map((r) => '<article class="ligne ' + r.statut + '"><div class="tete">' + pill(r.statut) + '</div><h3>' + esc(r.libelle) + '</h3><p class="action"><b>À faire :</b> ' + esc(r.action) + '</p><p class="code">' + esc(r.code) + '</p></article>').join('\n')
  : '<p class="vide">Rien ne dépend de Romain dans les contrôles reçus.</p>';

const notes = [];
if (!baseDispo) notes.push('Contrôles de la base : en cours de mise en place. Ce rapport ne contient pour l\'instant que les contrôles des pages et du code.');
if (manquants.length) notes.push('Fichier(s) de résultats absent(s) ou illisible(s) : ' + manquants.map((m) => esc(m.split('/').pop())).join(', ') + '.');
if (!prevLignes) notes.push('Premier rapport : pas encore d\'historique.');

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Contrôle qualité Flowin Event - ${esc(date)}</title><style>${css}</style></head><body>
<div class="couv"><div class="marque">Flowin Event</div><h1>Rapport de contrôle qualité</h1><div class="date">${esc(dateFr)}</div>
<div class="banniere ${banniere[0]}" role="status">${esc(banniere[1])}</div>
<div class="chiffres"><div><b>${total.vert}</b>vert</div><div><b>${total.orange}</b>orange</div><div><b>${total.rouge}</b>rouge</div></div>
${notes.map((n) => '<div class="note">' + n + '</div>').join('\n')}
<div class="note">Vert : rien à faire. Orange : à traiter bientôt. Rouge : à traiter en priorité. La couleur est toujours écrite en toutes lettres.</div></div>
<nav id="sommaire"><h2>Sommaire</h2><ol>${toc.join('\n')}</ol></nav>
<section id="a-faire"><h2>Ce qui dépend de Romain</h2>${aFaireHtml}</section>
${sections.join('\n')}
${histo.join('\n')}
</body></html>`;

mkdirSync(sortieDir, { recursive: true });
const base = join(sortieDir, 'controle-' + date);
writeFileSync(base + '.html', html);
writeFileSync(base + '.json', JSON.stringify(toutes, null, 2) + '\n');

const pw = chargerPlaywright();
if (!pw) { console.log('Playwright introuvable : HTML et JSON écrits, PDF non généré.'); process.exit(0); }
const nav = await lancer(pw);
const page = await nav.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.emulateMedia({ media: 'print' });
let options = 'outline+tagged';
try {
  await page.pdf({ path: base + '.pdf', format: 'A4', printBackground: true, outline: true, tagged: true, displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#5B6B7F;font-family:sans-serif">Flowin Event - contrôle qualité ' + date + ' - page <span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '16mm', bottom: '18mm', left: '14mm', right: '14mm' } });
} catch (e) {
  options = 'sans signets ni PDF balisé (' + String(e.message).split('\n')[0] + ')';
  await page.pdf({ path: base + '.pdf', format: 'A4', printBackground: true });
}
await nav.close();
console.log('PDF : ' + base + '.pdf (' + options + ')');
console.log('HTML : ' + base + '.html');
console.log('Bilan : ' + total.rouge + ' rouge, ' + total.orange + ' orange, ' + total.vert + ' vert ; base ' + (baseDispo ? 'présente' : 'absente'));
