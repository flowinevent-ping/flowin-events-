/**
 * Test du domaine fige et des adresses cibles (lib/qrPermalien.ts) : aucune URL de preview, de
 * localhost ou d'IP ne peut finir dans un QR ; la variable de domaine est validee.
 * usage : node test-domaine.js   (depuis admin/, avec typescript installe)
 */
const ts = require('typescript')
const fs = require('fs')
const path = require('path')
const Module = require('module')

const src = fs.readFileSync(path.resolve(__dirname, '../../lib/qrPermalien.ts'), 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText
const m = new Module('qrPermalien')
m.paths = Module._nodeModulePaths(__dirname)
const stub = { estModuleMaster: x => ['quiz', 'quizsolo', 'spin', 'tombola', 'vote'].indexOf(x) >= 0 }
const orig = m.require.bind(m)
m.require = id => (id === '@/lib/masters/apercu' ? stub : orig(id))
m._compile(js.replace('require("@/lib/masters/apercu")', 'require("@/lib/masters/apercu")'), 'qrPermalien.js')
const L = m.exports

let ko = 0
const t = (nom, ok, d) => { console.log((ok ? 'OK   ' : 'ECHEC') + ' ' + nom + (d ? ' — ' + d : '')); if (!ok) ko++ }
const P = 'https://flowin-events.vercel.app'
t('Sans variable : domaine de production fige', L.baseCanonique('') === P && L.baseCanonique(undefined) === P)
t('Futur domaine propre accepte', L.baseCanonique('https://jeu.flowin.events') === 'https://jeu.flowin.events')
t('Slash final retire', L.baseCanonique('https://jeu.flowin.events/') === 'https://jeu.flowin.events')
;['https://flowin-events-git-feat-qr-flowinevent.vercel.app', 'https://flowin-events-abc123xyz-flowin-team.vercel.app', 'http://flowin-events.vercel.app',
  'http://localhost:3000', 'https://127.0.0.1', 'https://jeu.flowin.events/chemin', 'https://jeu.flowin.events?x=1', 'n importe quoi'].forEach(v =>
  t('Valeur refusee, retombe sur la production : ' + v, L.baseCanonique(v) === P, L.baseCanonique(v)))
t('estUrlNonImprimable : apercu Vercel', L.estUrlNonImprimable('https://flowin-events-git-main-team.vercel.app') === true)
t('estUrlNonImprimable : production', L.estUrlNonImprimable(P) === false)
t('Lien permanent', L.lienPermanent('a1b2c3d4e5f6') === P + '/q/a1b2c3d4e5f6', L.lienPermanent('a1b2c3d4e5f6'))
t('Code valide : 12 car.', L.estCodeValide('a1b2c3d4e5f6') && !L.estCodeValide('A1B2C3D4E5F6') && !L.estCodeValide('abc') && !L.estCodeValide('a'.repeat(33)) && !L.estCodeValide('../etc/passwd') && !L.estCodeValide(''))
t('Cible : quiz -> /jouer', L.cibleJeu({ id: 'ev 1', module: 'quiz' }, 'caisse') === '/jouer?ev=ev%201&source=caisse', L.cibleJeu({ id: 'ev 1', module: 'quiz' }, 'caisse'))
t('Cible : Quiz Master -> /parcours/quizmaster', L.cibleJeu({ id: 'e', module: 'quizmaster' }, null) === '/parcours/quizmaster?ev=e')
t('Cible : ancienne presentation (masterOff) -> /parcours/quiz', L.cibleJeu({ id: 'e', module: 'quiz', cfg: { masterOff: true } }, 's') === '/parcours/quiz?ev=e&source=s')
t('Cible : module piege (../, ?, //) ignore', L.cibleJeu({ id: 'e', module: '../../evil?x=' }, null) === '/jouer?ev=e', L.cibleJeu({ id: 'e', module: '../../evil?x=' }, null))
t('Cible : source encodee', L.cibleJeu({ id: 'e', module: 'spin' }, 'a&b=c') === '/jouer?ev=e&source=a%26b%3Dc')
t('Ancien lien : conserve le format historique', L.lienAncien('ev-1', 'spin', 'caisse') === P + '/parcours/spin?ev=ev-1&source=caisse')
t('Nom de fichier : commerce + QR + support + code', L.nomFichierQr({ titre: 'Boulangerie Dupont', qr: 'Caisse', support: 'Caisse', code: 'a1b2c3d4e5f6' }, 'png') === 'qr-boulangerie-dupont-caisse-a1b2c3d4e5f6.png', L.nomFichierQr({ titre: 'Boulangerie Dupont', qr: 'Caisse', support: 'Caisse', code: 'a1b2c3d4e5f6' }, 'png'))
console.log(ko ? ko + ' echec(s)' : 'tout est OK')
process.exit(ko ? 1 : 0)
