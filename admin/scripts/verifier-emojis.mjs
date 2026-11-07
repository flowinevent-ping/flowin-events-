#!/usr/bin/env node
/**
 * Verifie qu aucun emoji n est affiche dans l interface (regle : pictogrammes
 * seulement -- composants Icon / Ico). Parcourt admin/app, admin/components,
 * admin/lib (.ts, .tsx, .js, .jsx, .css) et echoue (code 1) si un emoji
 * apparait hors commentaire.
 *
 * Commentaires ignores : // ... en fin de ligne, blocs /* ... *\/ et {/* ... *\/}.
 * Les fleches, coches et symboles typographiques (→ ✓ × • …) ne sont pas des
 * emojis au sens de cette regle et restent autorises.
 *
 * Usage : node scripts/verifier-emojis.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOSSIERS = ['app', 'components', 'lib']
const EXT = /\.(tsx?|jsx?|mjs|css)$/

/* Pictogrammes emoji : plans supplementaires (U+1F000+), symboles divers
   U+2600-27BF a presentation emoji, et selecteur de variation U+FE0F. */
const EMOJI = /[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]\u{FE0F}?|\u{FE0F}|[\u{2B50}\u{2B55}\u{2B1B}\u{2B1C}\u{231A}\u{231B}\u{23E9}-\u{23FA}]/u
/* Caracteres de la plage 2600-27BF admis (typographie, pas emoji). */
const ADMIS = new Set(['✓', '✔', '✕', '✗', '✘', '★', '☆', '❯', '❮', '➜', '➔', '❝', '❞', '✦', '✧', '♦', '♥', '♠', '♣', '☰', '✎', '✏', '❤'])

function fichiers(dir) {
  const out = []
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    const st = statSync(p)
    if (st.isDirectory()) { if (n !== 'node_modules' && !n.startsWith('.')) out.push(...fichiers(p)) }
    else if (EXT.test(n)) out.push(p)
  }
  return out
}

/** Retire les commentaires en preservant les retours ligne (numeros justes).
 *  Approximation volontairement simple : ignore les // precedes de ':' (URL). */
function sansCommentaires(src) {
  let s = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  s = s.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length))
  return s
}

const fautes = []
for (const d of DOSSIERS) {
  for (const f of fichiers(join(RACINE, d))) {
    const lignes = sansCommentaires(readFileSync(f, 'utf8')).split('\n')
    lignes.forEach((l, i) => {
      for (const ch of l.match(new RegExp(EMOJI.source, 'gu')) ?? []) {
        const base = ch.replace(/\u{FE0F}/u, '')
        if (ch !== '\u{FE0F}' && ADMIS.has(base)) continue
        fautes.push(`${relative(RACINE, f)}:${i + 1}  ${ch}  ${l.trim().slice(0, 110)}`)
        break
      }
    })
  }
}

if (fautes.length) {
  console.error(`${fautes.length} emoji(s) dans l interface :`)
  fautes.forEach(x => console.error('  ' + x))
  process.exit(1)
}
console.log('Aucun emoji dans admin/app, admin/components, admin/lib.')
