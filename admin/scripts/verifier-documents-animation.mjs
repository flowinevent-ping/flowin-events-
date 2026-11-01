// Verifie que admin/lib/documentsAnimation.ts est le miroir verbatim de la source unique
// supabase/functions/notify-commande-animation/documents.ts (contrat et facture PDF identiques
// cote fonction edge et cote espace pro). Usage : node scripts/verifier-documents-animation.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const ici = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(ici, '../../supabase/functions/notify-commande-animation/documents.ts'), 'utf8')
const miroir = readFileSync(join(ici, '../lib/documentsAnimation.ts'), 'utf8').split('\n').slice(2).join('\n')
if (source !== miroir) { console.error('DIFFERENT : recopier documents.ts dans admin/lib/documentsAnimation.ts (apres les 2 lignes d en-tete).'); process.exit(1) }
console.log('OK : miroir identique')
