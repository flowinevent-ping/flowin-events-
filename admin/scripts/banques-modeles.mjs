// Controle automatique + generation SQL des banques modeles.
//   node scripts/banques-modeles.mjs controle   -> verifie le contenu (code de sortie 1 si erreur)
//   node scripts/banques-modeles.mjs sql        -> ecrit ../sql/12-banques-quiz.sql (NON applique)
// Les fichiers TypeScript de lib/banquesModeles sont transpiles a la volee (module typescript).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const ici = path.dirname(fileURLToPath(import.meta.url))
const racine = path.join(ici, '..')
const require = createRequire(import.meta.url)
const ts = require(path.join(racine, 'node_modules', 'typescript'))

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'banques-modeles-'))
const src = path.join(racine, 'lib')
function compiler(rel) {
  const entree = path.join(src, rel + '.ts')
  const sortie = path.join(tmp, rel + '.cjs')
  fs.mkdirSync(path.dirname(sortie), { recursive: true })
  const js = ts.transpileModule(fs.readFileSync(entree, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
    .replace(/require\("(\.[^"]+)"\)/g, (_m, p) => `require("${p}.cjs")`)
  fs.writeFileSync(sortie, js)
}
;['banquesModeles/outils', 'banquesModeles/resoudre', 'banquesModeles/restaurationQuiz', 'banquesModeles/restaurationBonus', 'banquesModeles/metiers', 'banquesModeles/personnalises', 'banquesModeles/index'].forEach(compiler)
const cat = require(path.join(tmp, 'banquesModeles/index.cjs'))
const res = require(path.join(tmp, 'banquesModeles/resoudre.cjs'))

const erreurs = []
const err = (m) => erreurs.push(m)
const stats = {}
const enoncesVus = new Map()
const idsVus = new Set()
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim()

for (const b of cat.BANQUES_MODELES) {
  if (idsVus.has(b.id)) err(`banque en double : ${b.id}`)
  idsVus.add(b.id)
  const ids = new Set()
  for (const q of b.questions) {
    if (ids.has(q.id)) err(`${b.id} : id en double ${q.id}`)
    ids.add(q.id)
    const enonce = q.type === 'qcm' ? q.texte : q.label
    const k = norm(enonce)
    if (enoncesVus.has(k)) err(`énoncé en double : « ${enonce} » (${b.id} et ${enoncesVus.get(k)})`)
    enoncesVus.set(k, b.id)
    if (b.genre === 'quiz') {
      if (q.type !== 'qcm') { err(`${q.id} : type ${q.type} dans une banque quiz`); continue }
      if (!q.theme) err(`${q.id} : thème manquant`)
      if (['facile', 'moyen', 'difficile'].indexOf(q.difficulte) < 0) err(`${q.id} : difficulté invalide`)
      let jouable = q
      if (q.modele) {
        // Modele : doit etre incomplet tel quel (aucune valeur inventee), et complet une fois rempli.
        const d0 = res.diagnostiquerModele(q)
        if (d0.complet) err(`${q.id} : modèle déjà « complet » (valeur pré-remplie ?)`)
        q.modele.variables.forEach((v) => { if ((v.valeur || '').trim()) err(`${q.id} : variable ${v.cle} pré-remplie`); if (!/\[.*à compléter.*\]/.test(v.placeholder)) err(`${q.id} : placeholder de ${v.cle} sans « à compléter »`) })
        const rempli = JSON.parse(JSON.stringify(q))
        const fict = { etablissement: 'Établissement Exemple', reponse: rempli.modele.mode === 'annee' ? '1998' : rempli.modele.mode === 'nombre' ? '80' : 'Réponse test', produit: 'légumes', leurre1: 'Fausse A', leurre2: 'Fausse B', leurre3: 'Fausse C' }
        rempli.modele.variables.forEach((v) => { v.valeur = fict[v.cle] ?? 'x' })
        const d = res.diagnostiquerModele(rempli)
        if (!d.complet) err(`${q.id} : modèle rempli non jouable (${d.probleme || 'incomplet'})`)
        else jouable = d.resolue
        if (res.resoudreQuestion(q) !== null) err(`${q.id} : modèle vide posé au joueur !`)
        // chaque {variable} du texte doit être déclarée
        const decl = new Set(q.modele.variables.map((v) => v.cle))
        const util = (q.texte + ' ' + q.options.join(' ') + ' ' + (q.explication || '')).match(/\{([a-z0-9_]+)\}/gi) || []
        util.forEach((u) => { if (!decl.has(u.slice(1, -1))) err(`${q.id} : variable ${u} non déclarée`) })
      } else if (/\{[^}]*\}/.test(q.texte + q.options.join('') + (q.explication || ''))) err(`${q.id} : accolades dans une question ordinaire`)
      if (jouable.options.length !== 4) err(`${q.id} : ${jouable.options.length} réponses (4 attendues)`)
      if (!(jouable.bonne >= 0 && jouable.bonne < 4)) err(`${q.id} : index de bonne réponse invalide`)
      const bas = jouable.options.map(norm)
      if (new Set(bas).size !== bas.length) err(`${q.id} : réponses en double`)
      if (jouable.options.some((o) => !o.trim())) err(`${q.id} : réponse vide`)
      if (!q.modele && !q.explication) err(`${q.id} : explication manquante`)
      if ((jouable.texte + jouable.options.join(' ') + (jouable.explication || '')).match(/\{[^}]*\}/)) err(`${q.id} : variable visible côté joueur`)
    } else {
      if (q.type !== 'single' && q.type !== 'multi') err(`${q.id} : type ${q.type} dans une banque bonus`)
      if (q.options.length < 2) err(`${q.id} : moins de 2 options`)
      if ('bonne' in q) err(`${q.id} : « bonne » dans un sondage`)
      if (/\d+\s?%/.test(JSON.stringify(q))) err(`${q.id} : pourcentage écrit en dur dans un sondage`)
      if (/\{[^}]*\}/.test(q.label + q.options.map((o) => o.label).join(' '))) err(`${q.id} : accolades dans un sondage`)
    }
    // contenu interdit : coordonnees, marques, genre « Autre »
    const txt = JSON.stringify(q)
    if (/@|https?:\/\/|\b0[1-9]( ?\d{2}){4}\b|\bSIRET\b|TVA/i.test(txt)) err(`${q.id} : coordonnées / lien suspect`)
  }
  for (const m of b.metiers) {
    stats[m] = stats[m] || { quiz: 0, quizPerso: 0, bonus: 0 }
    if (b.genre === 'bonus') stats[m].bonus += b.questions.length
    else if (b.personnalisable) stats[m].quizPerso += b.questions.length
    else stats[m].quiz += b.questions.length
  }
}
// Seuils demandes
const seuils = { restaurateur: [60, 25], boulanger: [20, 10], boucher: [20, 10], libraire: [20, 10] }
for (const [m, [qz, bn]] of Object.entries(seuils)) {
  const s = stats[m] || { quiz: 0, bonus: 0 }
  if (s.quiz < qz) err(`${m} : ${s.quiz} quiz (< ${qz})`)
  if (s.bonus < bn) err(`${m} : ${s.bonus} bonus (< ${bn})`)
}
// Au moins 3 niveaux de difficulte dans la restauration
const diffs = new Set()
cat.modelesDuMetier('restaurateur').filter((b) => b.genre === 'quiz' && !b.personnalisable).forEach((b) => b.questions.forEach((q) => diffs.add(q.difficulte)))
if (diffs.size !== 3) err('restauration : les 3 niveaux de difficulté ne sont pas tous présents')

// Position de la bonne reponse : ne doit pas etre toujours la meme
const pos = [0, 0, 0, 0]
cat.BANQUES_MODELES.filter((b) => b.genre === 'quiz' && !b.personnalisable).forEach((b) => b.questions.forEach((q) => { pos[q.bonne]++ }))

const mode = process.argv[2] || 'controle'
if (mode === 'controle') {
  console.log('Questions par métier :', JSON.stringify(stats))
  console.log('Répartition de la bonne réponse (A/B/C/D) :', pos.join(' / '))
  console.log('Banques modèles :', cat.BANQUES_MODELES.length)
  if (erreurs.length) { console.error('\nERREURS (' + erreurs.length + ') :\n- ' + erreurs.join('\n- ')); process.exit(1) }
  console.log('OK : 0 erreur de contrôle.')
} else if (mode === 'sql') {
  if (erreurs.length) { console.error(erreurs.join('\n')); process.exit(1) }
  const esc = (s) => s.replace(/'/g, "''")
  const lignes = []
  lignes.push(`-- ══════════════════════════════════════════════════════════════════════════
-- FLOWIN · BANQUES MODÈLES — restauration, boulanger, boucher, libraire
-- Généré par admin/scripts/banques-modeles.mjs depuis admin/lib/banquesModeles/ (source de vérité).
-- NE PAS RÉÉDITER À LA MAIN : modifier les fichiers TypeScript puis relancer
--   node scripts/banques-modeles.mjs sql
--
-- ⚠ FICHIER NON APPLIQUÉ. À relire puis exécuter par Romain (execute_sql = DML).
-- Aucun DDL : la table public.banques et ses colonnes (nom, pro_id, event_ids, questions, tags,
-- statut) existent déjà en production.
--
-- Idempotent ET non destructif : ON CONFLICT (id) DO NOTHING. Si un pro a déjà modifié une banque
-- modèle, le rejouer n'écrase rien.
-- Banques « communes » : pro_id = 'flowin' (comme les banques communes du Super Admin).
-- Les banques « questions personnalisées (à compléter) » ne sont PAS insérées ici : elles se copient
-- depuis l'écran « Banques de questions » vers le compte du commerçant, qui renseigne ses réponses.
-- ══════════════════════════════════════════════════════════════════════════
`)
  let n = 0
  for (const b of cat.BANQUES_MODELES) {
    if (b.personnalisable) continue
    n++
    const tags = cat.tagsDe(b).map((t) => `'${esc(t)}'`).join(',')
    lignes.push(`INSERT INTO public.banques (id, nom, pro_id, event_ids, questions, tags, statut)
VALUES ('${b.id}', '${esc(b.nom)}', 'flowin', ARRAY[]::text[],
  '${esc(JSON.stringify(b.questions))}'::jsonb,
  ARRAY[${tags}]::text[], 'valide')
ON CONFLICT (id) DO NOTHING;
`)
  }
  lignes.push(`-- Contrôle après exécution : ${n} banques attendues.\nSELECT id, nom, jsonb_array_length(questions) AS nb_questions, tags FROM public.banques WHERE id LIKE 'bq-modele-%' ORDER BY id;\n`)
  const sortie = path.join(racine, '..', 'sql', '12-banques-quiz.sql')
  fs.writeFileSync(sortie, lignes.join('\n'))
  console.log('SQL écrit :', sortie, '(', n, 'banques )')
}
fs.rmSync(tmp, { recursive: true, force: true })
