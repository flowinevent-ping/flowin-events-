// Contrôle automatique niveau 2 : pages de production (famille « pages »).
// Usage : node scripts/controle/smoke.mjs [--out fichier.json] [--base https://...]
// Sortie : tableau JSON de {famille, code, libelle, statut, gravite, detail, action}. Code de sortie 0 toujours.
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerPlaywright, lancer } from './_playwright.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = resolve(ICI, '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const BASE = opt('--base', 'https://flowin-events.vercel.app').replace(/\/$/, '');
const SORTIE = opt('--out', '');

const PAGES = [
  ['/landing', 'landing', 'Page d\'accueil'],
  ['/nds', 'nds', 'Jeu Nuits du Sud'],
  ['/jouer', 'jouer', 'Page Jouer'],
  ['/parcours/quiz', 'quiz', 'Parcours quiz'],
  ['/moi', 'moi', 'Profil joueur'],
  ['/pro/connexion', 'pro-connexion', 'Connexion pro'],
  ['/se/se-nds-2026', 'se-nds', 'Super Event Nuits du Sud'],
  ['/dashboard.html', 'dashboard', 'Tableau de bord Flowin'],
];
const DEMO_EXCLUS = ['/pro/connexion'];
const resultats = [];
const add = (code, libelle, statut, gravite, detail, action) =>
  resultats.push({ famille: 'pages', code, libelle, statut, gravite, detail, action: action || '' });

async function main() {
  const pw = chargerPlaywright();
  if (!pw) {
    add('PAGES-OUTIL', 'Navigateur de test indisponible', 'orange', 'important',
      'Playwright introuvable : les pages n\'ont pas pu être ouvertes.', 'Installer Playwright (npm install dans admin/) puis relancer.');
  } else {
    let navigateur;
    try {
      navigateur = await lancer(pw);
    } catch (e) {
      add('PAGES-OUTIL', 'Navigateur de test indisponible', 'orange', 'important',
        'Chromium n\'a pas démarré : ' + String(e.message).split('\n')[0], 'Lancer « npx playwright install chromium » puis relancer.');
    }
    if (navigateur) {
      const erreursJs = [];
      const ecritures = [];
      for (const [chemin, slug, nom] of PAGES) {
        // 1) Visite normale : statut et erreurs JavaScript non rattrapées
        const ctx = await navigateur.newContext({ viewport: { width: 390, height: 800 } });
        const page = await ctx.newPage();
        const errs = [];
        page.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 160)));
        let statut = 0, detailNav = '';
        try {
          const rep = await page.goto(BASE + chemin, { waitUntil: 'load', timeout: 45000 });
          statut = rep ? rep.status() : 0;
          await page.waitForTimeout(1500);
        } catch (e) { detailNav = String(e.message).split('\n')[0].slice(0, 140); }
        await ctx.close();
        if (statut === 200) add('PAGES-200-' + slug, nom + ' : répond', 'vert', 'bloquant', 'Code 200 sur ' + chemin + '.');
        else add('PAGES-200-' + slug, nom + ' : ne répond pas', 'rouge', 'bloquant',
          'Code ' + (statut || 'aucun') + ' sur ' + chemin + (detailNav ? ' (' + detailNav + ')' : '') + '.',
          'Vérifier le dernier déploiement Vercel ; page prioritaire à corriger.');
        if (errs.length) erreursJs.push(chemin + ' : ' + errs[0]);

        // 2) Visite ?demo=1 : aucune écriture (non-GET) vers supabase.co
        if (DEMO_EXCLUS.indexOf(chemin) >= 0) continue;
        const ctx2 = await navigateur.newContext({ viewport: { width: 390, height: 800 } });
        const p2 = await ctx2.newPage();
        const ecr = [];
        p2.on('request', (r) => {
          try {
            if (r.url().indexOf('supabase.co') >= 0 && r.method() !== 'GET' && r.method() !== 'OPTIONS' && r.method() !== 'HEAD') {
              ecr.push(r.method() + ' ' + new URL(r.url()).pathname.slice(0, 60));
            }
          } catch (e) { /* ignoré */ }
        });
        p2.on('pageerror', (e) => { const m = chemin + ' (demo) : ' + String(e.message || e).slice(0, 160); if (erreursJs.indexOf(m) < 0) erreursJs.push(m); });
        try {
          await p2.goto(BASE + chemin + (chemin.indexOf('?') >= 0 ? '&' : '?') + 'demo=1', { waitUntil: 'load', timeout: 45000 });
          await p2.waitForTimeout(2500);
        } catch (e) { /* le statut est déjà couvert plus haut */ }
        await ctx2.close();
        if (ecr.length) ecritures.push(chemin + ' : ' + ecr.length + ' (' + ecr[0] + ')');
      }
      await navigateur.close();
      if (erreursJs.length === 0) add('PAGES-JS', 'Aucune erreur JavaScript', 'vert', 'important', 'Aucune erreur non rattrapée sur les ' + PAGES.length + ' pages.');
      else add('PAGES-JS', 'Erreurs JavaScript sur des pages', 'orange', 'important',
        erreursJs.length + ' page(s) : ' + erreursJs.slice(0, 3).join(' | '), 'Faire corriger par l\'agent produit-ergonomie.');
      if (ecritures.length === 0) add('PAGES-DEMO', 'Mode démo : aucune écriture en base', 'vert', 'bloquant', 'Zéro requête d\'écriture vers supabase.co en ?demo=1.');
      else add('PAGES-DEMO', 'Mode démo : écritures en base détectées', 'rouge', 'bloquant',
        ecritures.join(' | '), 'Urgent : le mode démo écrit en production ; confier à securite-donnees et produit-ergonomie.');
    }
  }

  // Vidéos publiques /videos/v8/
  try {
    const dossier = join(RACINE, 'admin', 'public', 'videos', 'v8');
    const fichiers = readdirSync(dossier).filter((f) => /\.(mp4|webm|mov)$/i.test(f));
    const mauvais = [];
    for (const f of fichiers) {
      let code = 0;
      try {
        const r = await fetch(BASE + '/videos/v8/' + f, { headers: { Range: 'bytes=0-0' } });
        code = r.status;
        try { await r.body?.cancel(); } catch (e) { /* ignoré */ }
      } catch (e) { code = 0; }
      if (code !== 200 && code !== 206) mauvais.push(f + ' (' + (code || 'erreur') + ')');
    }
    if (fichiers.length === 0) add('PAGES-VIDEOS', 'Vidéos v8 : aucune trouvée dans le dépôt', 'orange', 'important', 'Dossier admin/public/videos/v8 vide.', 'Vérifier le dépôt.');
    else if (mauvais.length === 0) add('PAGES-VIDEOS', 'Vidéos v8 accessibles', 'vert', 'important', fichiers.length + ' vidéos répondent (200/206).');
    else add('PAGES-VIDEOS', 'Vidéos v8 inaccessibles', 'rouge', 'important', mauvais.join(', '), 'Republier les vidéos concernées (creation-materiel).');
  } catch (e) {
    add('PAGES-VIDEOS', 'Vidéos v8 non contrôlées', 'orange', 'info', String(e.message).slice(0, 120), 'Relancer depuis la racine du dépôt.');
  }

  // Miroir du dashboard (MD5 identique)
  try {
    const md5 = (p) => createHash('md5').update(readFileSync(join(RACINE, p))).digest('hex');
    const a = md5('admin/public/dashboard.html'), b = md5('admin/public/static/dashboard.html');
    if (a === b) add('PAGES-MIROIR', 'Miroir du dashboard identique', 'vert', 'bloquant', 'MD5 identique : ' + a.slice(0, 8) + '.');
    else add('PAGES-MIROIR', 'Miroir du dashboard différent', 'rouge', 'bloquant', 'MD5 ' + a.slice(0, 8) + ' contre ' + b.slice(0, 8) + '.', 'Recopier dashboard.html vers static/dashboard.html avant tout push.');
  } catch (e) {
    add('PAGES-MIROIR', 'Miroir du dashboard non contrôlé', 'orange', 'important', String(e.message).slice(0, 120), 'Lancer depuis le dépôt.');
  }

  const json = JSON.stringify(resultats, null, 2);
  if (SORTIE) writeFileSync(SORTIE, json + '\n');
  console.log(json);
}

main().catch((e) => {
  add('PAGES-ERREUR', 'Contrôle des pages interrompu', 'orange', 'important', String(e && e.message || e).slice(0, 160), 'Relancer ; si cela persiste, prévenir recette-tests.');
  const json = JSON.stringify(resultats, null, 2);
  if (SORTIE) writeFileSync(SORTIE, json + '\n');
  console.log(json);
}).finally(() => process.exit(0));
