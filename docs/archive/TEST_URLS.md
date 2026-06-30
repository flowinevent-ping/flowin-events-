# 🎯 FLOWIN — URLs DE TEST AUDIT

**Date** : 13/05/2026  
**Mot de passe PRO commun** : `flowin-test-2026`

---

## 🔗 Côté USER (parcours QR)

Chaque URL est scannable depuis téléphone ou ouvrable directement dans navigateur.

### Scénario A — Quiz + Bonus + Banque (Cannes)
🔗 https://flowin-events.vercel.app/parcours/?ev=ev-test-quiz  
📱 QR : https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://flowin-events.vercel.app/parcours/?ev=ev-test-quiz

### Scénario A-bis — Spin seul (Cannes)
🔗 https://flowin-events.vercel.app/parcours/?ev=ev-test-spin-only  
📱 QR : https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://flowin-events.vercel.app/parcours/?ev=ev-test-spin-only

### Scénario A-ter — Tombola seule (Cannes)
🔗 https://flowin-events.vercel.app/parcours/?ev=ev-test-tombola-only  
📱 QR : https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://flowin-events.vercel.app/parcours/?ev=ev-test-tombola-only

### Scénario B — Quiz Solo
🔗 https://flowin-events.vercel.app/parcours/?ev=ev-test-quizsolo

### Scénario C — Super Event Riviera (5 villes)
- Cannes : https://flowin-events.vercel.app/parcours/?ev=ev-test-se-cannes
- Antibes : https://flowin-events.vercel.app/parcours/?ev=ev-test-se-antibes
- Grasse : https://flowin-events.vercel.app/parcours/?ev=ev-test-se-grasse
- Nice : https://flowin-events.vercel.app/parcours/?ev=ev-test-se-nice
- Mougins : https://flowin-events.vercel.app/parcours/?ev=ev-test-se-mougins

### Scénario D — Vote concerts
🔗 https://flowin-events.vercel.app/parcours/?ev=ev-test-vote

---

## 👤 Côté PRO (dashboard mobile)

URL commune : **https://flowin-events.vercel.app/admin/pro_mobile_v4.html**

| Email login | Mot de passe | Voit l'event |
|-------------|--------------|--------------|
| `animation@cannes-test.fr` | `flowin-test-2026` | Cannes (quiz, spin, tombola, quizsolo, vote, SE Cannes) |
| `animation@antibes-test.fr` | `flowin-test-2026` | Antibes (SE Antibes) |
| `animation@grasse-test.fr` | `flowin-test-2026` | Grasse (SE Grasse) |
| `animation@nice-test.fr` | `flowin-test-2026` | Nice (SE Nice) |
| `animation@mougins-test.fr` | `flowin-test-2026` | Mougins (SE Mougins) |

Le PRO ne voit que **ses events** (RLS scope par `pro_id`).

---

## 👑 Côté SA (dashboard complet)

🔗 https://flowin-events.vercel.app/admin/index.html

Vue complète : tous les pros, events, joueurs, lots, stats, tirages.

---

## 🧹 Suppression données test (après audit)

Coller dans Supabase SQL Editor :
```sql
-- Voir docs sql/CLEAN_TEST_DATA.sql
```

Cible :
- IDs préfixés `*-test-*`
- Tag `'TEST'` dans tags[]
- Description `'[FICTIF AUDIT...]'`
- `cfg->>'audit_id'` LIKE `'AUDIT-%'`
- Comptes Auth `*@*-test.fr`
