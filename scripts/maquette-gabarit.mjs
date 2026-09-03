/**
 * Injecte la charte du gabarit dans la maquette navigable.
 *
 * Romain, 03/09 : « pourquoi dans le preview il y a encore ce visuel hors
 * sujet ». Parce que docs/maquette-parcours-creation.html portait encore
 * l'apercu invente, alors que le dashboard, lui, affiche desormais le vrai
 * parcours. Deux versions de la verite : c'est exactement ce qu'il ne faut pas.
 *
 * Ce script recopie NDS_CSS, NDS_CSS_APP et NDS_SPRITE depuis
 * admin/lib/nds2026Design.ts — la source unique — dans la maquette, entre deux
 * marqueurs. La maquette ne peut donc plus deriver de l'application : on la
 * regenere, on ne la retouche pas a la main.
 *
 *   node scripts/maquette-gabarit.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const SRC = 'admin/lib/nds2026Design.ts'
const CIBLE = 'docs/maquette-parcours-creation.html'
const DEBUT = '/* GABARIT-DEBUT — genere par scripts/maquette-gabarit.mjs, ne pas editer */'
const FIN = '/* GABARIT-FIN */'

const ts = readFileSync(SRC, 'utf8')

function litConstante(nom) {
  const m = ts.match(new RegExp('export const ' + nom + ' = `([\\s\\S]*?)`\\n', 'm'))
  if (!m) throw new Error(`Constante ${nom} introuvable dans ${SRC}`)
  return m[1]
}

const css = litConstante('NDS_CSS') + litConstante('NDS_CSS_APP')
const sprite = litConstante('NDS_SPRITE')

const bloc = [
  DEBUT,
  'var GAB_CSS = ' + JSON.stringify(css) + ';',
  'var GAB_SPRITE = ' + JSON.stringify(sprite) + ';',
  FIN,
].join('\n')

const html = readFileSync(CIBLE, 'utf8')
const i = html.indexOf(DEBUT)
const j = html.indexOf(FIN)
if (i === -1 || j === -1) throw new Error(`Marqueurs ${DEBUT} / ${FIN} absents de ${CIBLE}`)
const neuf = html.slice(0, i) + bloc + html.slice(j + FIN.length)
writeFileSync(CIBLE, neuf)

const md5 = s => createHash('md5').update(s).digest('hex')
console.log('charte injectee  —', css.length, 'octets, md5', md5(css))
console.log('sprite injecte   —', sprite.length, 'octets, md5', md5(sprite))
