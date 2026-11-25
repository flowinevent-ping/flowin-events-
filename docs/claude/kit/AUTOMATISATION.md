# Automatisation sous contrôle (description seule : rien n'est construit)
Entrée : « Flowin Event · Automatisation ». Rien ne sort à l'extérieur sans la validation de Romain.

## Ce qui est propre
Trois plans : **produit** (ce que fait l'application), **fabrication automatique** (améliorer le contenu : file de travail, contrôles qualité, validation humaine), **croissance automatique** (prospection e-mail, contenu, réseaux sociaux : calendrier, séquences, validation).
Moteur ou session : répétitif et en volume, moteur dans l'application ; ponctuel, créatif ou structurel, session de la rubrique.

## Règles
Centre de contrôle (admin + base) : registre (nom, rubrique responsable, déclencheur, fréquence, statut, dernier passage, coût, validation exigée), interrupteur général et par automatisation, journal, plafond de dépense avec arrêt automatique, file d'approbation.
Garde-fous : mode d'essai par défaut ; contrôles automatiques avant validation, ancienne version conservée ; secrets dans le coffre du serveur ; accès minimal ; tout journalisé ; règles légales (prospection e-mail, données personnelles, mineurs) et conditions des plateformes vérifiées avant le premier envoi.

## Argent
Plafonds de dépense : décision de Romain. Prix du produit : `univers/paiement.md`.

## Code
Existant à rattacher (rien de nouveau) : cron `tickets-rappels`, `controle_qualite_lancer` (03:17 UTC), mailer Gmail, `supabase/functions/`. Voir `docs/claude/CONTROLES.md`.

## À faire et notes
Décisions en attente de Romain (ne pas les demander) : clés, outil d'envoi et domaine d'e-mail, comptes réseaux, plafonds, validateurs.
