// Verifie l'interrupteur « satisfait ou rembourse » dans le PDF du bon de commande et les emails (hors navigateur).
//   node admin/scripts/verifier-garantie-suspendue.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const racine = join(dirname(fileURLToPath(import.meta.url)), '../..')
const require = createRequire(import.meta.url)
let ko = 0
const v = (n, ok) => { console.log((ok ? 'OK ' : 'KO ') + n); if (!ok) ko++ }
// faux jsPDF qui memorise tous les textes ecrits
function fauxJsPDF() {
  const textes = []
  const doc = new Proxy({}, { get: (_, p) => p === 'textes' ? textes : p === 'getTextWidth' ? (() => 10) : p === 'splitTextToSize' ? (t => [String(t)]) : (...a) => { if (p === 'text') textes.push(String(a[0])); return doc } })
  return function () { return doc }
}
const rec = { id: 'AM-20261101-TEST0001', offre: 'annuelle', kit: 'digital', nb_boutiques: 1, opt_quiz_qte: 0, opt_bonus_qte: 0, mode_paiement: 'virement', garantie: true, garantie_clients_objectif: 50, panier_moyen: 20, flux_journalier: '15+', garantie_certifiee_par: 'Test', garantie_certifiee_le: new Date().toISOString(), raison_sociale: 'Test', signataire_nom: 'Test', signature_horodatage: new Date().toISOString(), created_at: new Date().toISOString() }
async function pdf(actif) {
  delete require.cache[join(racine, 'admin/public/bon-commande-pdf.js')]
  globalThis.FLOWIN_CONFIG = { GARANTIE_ACTIVE: actif }
  const M = require(join(racine, 'admin/public/bon-commande-pdf.js'))
  // root = self ou this : en Node, `this` = module.exports ; on pose donc aussi la config dessus
  const J = fauxJsPDF(); const d = M.construire ? M.construire(J, rec, {}) : null
  return (d && d.textes ? d.textes : []).join(' ')
}
const t0 = await pdf(false)
v('PDF du bon : aucune mention « satisfait ou rembourse » quand suspendue', t0.length > 0 && !/SATISFAIT OU REMBOURSE|garantie/i.test(t0))
const docs = await import(join(racine, 'supabase/functions/notify-commande-animation/documents.ts')).catch(() => null)
if (docs) {
  delete globalThis.FLOWIN_CONFIG
  const e0 = docs.emailAccuse({ ...rec, type_commande: 'premiere', garantie: false, statut: 'en_attente_paiement', montant_ttc: 1188, montant_ht: 990, montant_tva: 198, contact_nom: 'T', signature_horodatage: rec.created_at })
  v('email d\'accusé : aucune mention quand suspendue', !/rembours|garantie/i.test(e0.html))
  globalThis.FLOWIN_CONFIG = { GARANTIE_ACTIVE: true }
  const e1 = docs.emailAccuse({ ...rec, type_commande: 'premiere', garantie: false, statut: 'en_attente_paiement', montant_ttc: 1188, montant_ht: 990, montant_tva: 198, contact_nom: 'T', signature_horodatage: rec.created_at })
  v('email d\'accusé : la mention revient quand activée', /rembours/i.test(e1.html))
} else console.log('(documents.ts non chargeable en Node pur : verifie par tsc et par le test navigateur)')
process.exit(ko)
