# Le « Mode Preview » — aperçu navigable de l'application réelle

**Ce document décrit une méthode de travail réutilisable sur n'importe quel projet d'application.**

---

## 1. Ce que c'est (et ce que ce n'est pas)

| | Maquette (Figma, mockup HTML) | **Mode Preview** |
|---|---|---|
| Ce qu'on voit | Une **image** de l'app | **L'app réelle** |
| Le code | Aucun / jetable | **Le code de production** |
| Les données | Inventées | **Les vraies données** |
| Les boutons | Décoratifs | **Ils marchent** |
| Écart avec la prod | Souvent énorme | **Zéro** |

> **La règle d'or : ce que tu valides dans le preview est EXACTEMENT ce qui part en production.**
> Il n'existe aucun écart possible, puisque c'est le même code.

**Exemple en production :**
`https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-ecrans&preview=1`

---

## 2. Pourquoi c'est supérieur à une maquette

- **On valide le vrai rendu** — les vraies polices, les vrais logos, les vrais textes, les vraies longueurs de mots.
- **On détecte les vrais bugs** — un bouton masqué par un bandeau, un texte qui déborde, une barre qui défile alors qu'elle devrait rester fixe. Une maquette ne montre jamais ça.
- **On teste les interactions** — cliquer, ouvrir une fiche, changer d'onglet.
- **Aucun double travail** — on ne dessine pas d'abord pour recoder ensuite.
- **On peut le montrer à un client** — c'est un outil commercial, pas seulement de dev.

---

## 3. Les 3 ingrédients techniques

### a) Un paramètre d'URL qui active le mode
```
?preview=1
```
Lu au chargement, il met l'app dans un état « lecture seule + navigation libre ».

### b) Une barre d'onglets, un onglet par écran
Fixée en haut, elle force l'affichage de l'écran voulu.
Chaque onglet appelle simplement le sélecteur d'écran existant (`setScreen('quiz')`, etc.).
**Elle n'existe QUE si `preview=1`.** Elle n'est jamais visible en production.

### c) Les garde-fous — le point le plus important
Sans eux, l'app te ramène de force à un écran et tu ne peux pas circuler.
En mode preview, on **désactive** :

| À désactiver | Pourquoi |
|---|---|
| **Toute écriture en base** | Aucun joueur créé, aucune partie comptée, aucune statistique polluée |
| Les **redirections automatiques** | Sinon l'app saute au quiz dès l'ouverture |
| Les **popups automatiques** | « Déjà joué », « Victoire »… empêchent de naviguer |
| Le **rechargement anti-retour-arrière** | Sinon l'app se recharge quand tu changes d'onglet |
| La **restauration de l'état sauvegardé** | Sinon elle te force sur le dernier écran vu |

---

## 4. Le prompt à réutiliser — copier/coller tel quel

> **Ajoute un « mode preview » à cette application.**
>
> **Le principe :** un aperçu navigable de l'application **réelle** (pas une maquette),
> qui me permet de circuler écran par écran sans jouer et sans rien enregistrer.
>
> **Ce que je veux :**
> 1. Un paramètre d'URL `?preview=1` qui active le mode.
> 2. Une **barre d'onglets en haut**, un onglet par écran, pour sauter directement à
>    n'importe quel écran d'un clic.
> 3. En mode preview, **désactive** : toute écriture en base, les redirections
>    automatiques, les popups automatiques, le rechargement anti-retour-arrière, et la
>    restauration de l'état sauvegardé — sinon je ne peux pas naviguer librement.
> 4. La barre d'onglets **ne doit jamais apparaître en production**.
>
> **Contraintes :**
> - Tu utilises le **code réel** de l'application, tu ne crées pas une copie ni une maquette.
> - Tu ne casses **aucune fonction existante** : je dois pouvoir vérifier que la version
>   normale (sans `?preview=1`) se comporte exactement comme avant.
> - Tu me donnes le **lien direct** à ouvrir quand c'est prêt.

---

## 5. Comment l'utiliser au quotidien

1. **Pour valider un changement d'UX/UI** → j'ouvre le preview, je regarde, je dis ce qui ne va pas.
2. **Pour détecter les bugs d'affichage** → un bouton masqué, un texte coupé, un logo qui déborde : ça se voit tout de suite, ce qu'une maquette ne montre jamais.
3. **Pour montrer à un client / partenaire** → c'est un **outil commercial** : le prospect voit l'app réelle, sans qu'aucune donnée de test ne pollue les statistiques.
4. **Pour arbitrer une décision** → au lieu de discuter dans le vide, on regarde.

---

## 6. Un piège à connaître

**Le mode preview ne remplace pas un test sur le terrain.**
Il montre fidèlement l'interface, mais il ne reproduit ni le réseau saturé d'un festival,
ni la lumière du soleil sur un écran, ni un joueur pressé dans une file d'attente.

Il sert à valider **ce qu'on voit**, pas **ce qu'on vit**.

---

*Méthode éprouvée sur Nuits du Sud 2026. Réutilisable sur tout projet d'application.*
