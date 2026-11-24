/**
 * Tests de la logique pure du lot 3 (lib/inscriptionPro.ts : erreursEtape, etapeDepuisAncienne, statutDemande).
 * Lancer : node scripts/tests-inscription-pro.mjs  (depuis admin/). Aucun reseau, aucune ecriture.
 * Le fichier TypeScript est transpile en memoire ; ses imports (supabase, proFiche...) sont remplaces par des bouchons.
 */
import fs from 'fs'
import vm from 'vm'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const ts = require('typescript')
const src = fs.readFileSync(new URL('../lib/inscriptionPro.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const mod = { exports: {} }
vm.runInNewContext(js, { module: mod, exports: mod.exports, require: () => ({}), window: undefined, Math, Array, Object, JSON })
const { erreursEtape, etapeDepuisAncienne, statutDemande, EMAIL_OK, TEL_OK, CP_OK } = mod.exports

let ko = 0
const eq = (nom, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); if (!ok) { ko++; console.log('ECHEC', nom, JSON.stringify(a), '!=', JSON.stringify(b)) } else console.log('ok   ', nom) }
const base = { prenom: 'Claire', nom: 'Test', email: 'a@b.fr', tel: '', entreprise: 'Boulangerie', adresse: '1 rue du Test', codePostal: '06140', ville: 'Vence', mode: 'manuel', siretInvalide: null, secteur: 'Association', secteurAutre: '', motdepasse: 'huitcars' }

eq('ecran 1 complet (sans SIRET)', erreursEtape(0, base), {})
eq('ecran 1 SIRET non trouve', Object.keys(erreursEtape(0, { ...base, mode: 'recherche' })), ['siret'])
eq('ecran 1 SIRET prerempli sans adresse', Object.keys(erreursEtape(0, { ...base, mode: 'prerempli', adresse: '', codePostal: '' })), ['adresse', 'codePostal'])
eq('ecran 1 champs vides', Object.keys(erreursEtape(0, { ...base, prenom: '', nom: ' ', email: 'x' })), ['prenom', 'nom', 'email'])
eq('ecran 2 sans secteur', Object.keys(erreursEtape(1, { ...base, secteur: '' })), ['secteur'])
eq('ecran 2 Autre sans precision', Object.keys(erreursEtape(1, { ...base, secteur: 'Autre', secteurAutre: 'ab' })), ['secteurAutre'])
eq('ecran 2 Autre precise', erreursEtape(1, { ...base, secteur: 'Autre', secteurAutre: 'cave a bieres' }), {})
eq('ecran 3 mot de passe court', Object.keys(erreursEtape(2, { ...base, motdepasse: 'abc' })), ['motdepasse'])
eq('ecran 3 telephone facultatif vide', erreursEtape(2, base), {})
eq('ecran 3 telephone invalide', Object.keys(erreursEtape(2, { ...base, tel: '12' })), ['tel'])
eq('produits et points de vente non demandes', Object.keys(erreursEtape(2, { ...base })).length, 0)
eq('ancien brouillon : vous / entreprise / adresse / points', [0, 1, 3, 4, 5].map(etapeDepuisAncienne), [0, 0, 0, 0, 0])
eq('ancien brouillon : secteur', etapeDepuisAncienne(2), 1)
eq('ancien brouillon : compte', etapeDepuisAncienne(6), 2)
eq('statut sans cfg', statutDemande(undefined), 'Demandé')
eq('statut en_attente_sa', statutDemande({ diffusion_demandee: { statut: 'en_attente_sa' } }), 'Demandé')
eq('statut en_cours', statutDemande({ diffusion_demandee: { statut: 'en_cours' } }), 'En cours')
eq('statut traitee', statutDemande({ diffusion_demandee: { statut: 'traitee' } }), 'Accepté')
eq('statut inconnu', statutDemande({ diffusion_demandee: { statut: 'zzz' } }), 'Demandé')
eq('email / tel / cp', [EMAIL_OK('a@b.fr'), EMAIL_OK('a@b'), TEL_OK(''), TEL_OK('06 12 34 56 78'), CP_OK('06140'), CP_OK('6140')], [true, false, true, true, true, false])
console.log(ko ? `${ko} echec(s)` : 'tous les tests passent')
process.exit(ko ? 1 : 0)
