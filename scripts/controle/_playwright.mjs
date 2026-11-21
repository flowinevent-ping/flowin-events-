// Aide commune : trouve Playwright et un Chromium utilisable (versions décalées tolérées).
import { createRequire } from 'node:module';
import { readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function chargerPlaywright() {
  const chemins = [join(RACINE, 'admin', 'package.json'), join(RACINE, 'package.json'), join(process.cwd(), 'package.json')];
  for (const p of chemins) {
    if (!existsSync(p)) continue;
    try { return createRequire(p)('playwright'); } catch (e) { /* suivant */ }
  }
  try { return createRequire(import.meta.url)('playwright'); } catch (e) { return null; }
}

export async function lancer(pw) {
  try { return await pw.chromium.launch({ args: ['--no-sandbox'] }); } catch (e) { /* repli ci-dessous */ }
  // Repli : un Chromium d'une autre version déjà présent sur la machine
  const cand = [];
  const racine = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    for (const d of readdirSync(racine)) {
      if (/^chromium-\d+$/.test(d)) { cand.push(join(racine, d, 'chrome-linux64', 'chrome'), join(racine, d, 'chrome-linux', 'chrome')); }
    }
  } catch (e) { /* ignoré */ }
  cand.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser');
  let derniere;
  for (const c of cand) {
    if (!existsSync(c)) continue;
    try { return await pw.chromium.launch({ executablePath: c, args: ['--no-sandbox'] }); } catch (e) { derniere = e; }
  }
  throw derniere || new Error('aucun Chromium trouvé');
}

