#!/usr/bin/env bash
# Le modèle unique du bon de commande existe en 2 exemplaires qui doivent rester identiques :
#   admin/public/bon-commande-pdf.js (navigateur : client, vente assistée, Super Admin)
#   supabase/functions/_shared/bon-commande-pdf.js (fonction edge : PDF joint aux emails)
# Usage : bash scripts/verifier-bon-commande-pdf.sh   (à lancer avant tout push)
set -e
cd "$(dirname "$0")/.."
A=admin/public/bon-commande-pdf.js; B=supabase/functions/_shared/bon-commande-pdf.js
ma=$(md5sum "$A" | cut -d' ' -f1); mb=$(md5sum "$B" | cut -d' ' -f1)
if [ "$ma" != "$mb" ]; then echo "DIFFERENT : cp $A $B"; echo "  $ma  $A"; echo "  $mb  $B"; exit 1; fi
echo "OK : modèle du bon de commande identique ($ma)"
