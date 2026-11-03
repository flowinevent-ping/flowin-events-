/**
 * QUESTIONS PERSONNALISEES AU COMMERCE : modeles a {variables} que le commercant renseigne
 * lui-meme. Rien n est invente par Flowin : chaque champ « a completer » est vide et porte un
 * placeholder explicite. Tant qu un champ est vide, la question n est jamais posee au joueur.
 */
import { creerPerso, V, LEURRES3, type BanqueModele } from './outils'

const NOM_ETAB = V('etablissement', 'Nom de votre établissement', '[nom de votre établissement à compléter]')

const rp = creerPerso('rp-perso')
export const PERSO_RESTAURATEUR: BanqueModele = {
  id: 'bq-modele-resto-perso', nom: 'Restaurateur · Questions personnalisées (à compléter)', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: true,
  description: 'Vos clients répondent sur VOTRE maison : serveuse préférée, année de création, plat signature, chef… Vous renseignez chaque réponse vous-même.',
  questions: [
    rp('Notre équipe', 'facile', 'Comment s’appelle notre serveuse ou notre serveur préféré chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Prénom du serveur ou de la serveuse', '[prénom à compléter]'), ...LEURRES3('prénom')], 'C’est {reponse} ! Dites-lui bonjour à votre prochaine visite.'),
    rp('Notre équipe', 'moyen', 'Quel est le prénom de notre chef ou de notre cheffe chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Prénom du chef ou de la cheffe', '[prénom à compléter]'), ...LEURRES3('prénom')], 'En cuisine, c’est {reponse} qui régale l’équipe et les clients.'),
    rp('Notre équipe', 'moyen', 'Quel est le plat préféré de l’équipe de {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Le plat préféré de l’équipe', '[plat à compléter]'), ...LEURRES3('plat')], 'Le plat préféré de l’équipe : {reponse}. À goûter !'),
    rp('Notre histoire', 'moyen', 'En quelle année {etablissement} a-t-il été créé ?', 'annee', [NOM_ETAB, V('reponse', 'Année de création', '[année à compléter, ex. 4 chiffres]')], '{etablissement} existe depuis {reponse}. Merci de nous suivre !'),
    rp('Notre histoire', 'difficile', 'Combien de places assises compte {etablissement}, terrasse comprise ?', 'nombre', [NOM_ETAB, V('reponse', 'Nombre de places assises', '[nombre à compléter]')], 'Il y a {reponse} places assises chez {etablissement}.'),
    rp('Notre carte', 'facile', 'Quel est le plat signature de {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Votre plat signature', '[plat signature à compléter]'), ...LEURRES3('plat')], 'Notre plat signature, c’est {reponse}.'),
    rp('Notre carte', 'facile', 'Quelle est la spécialité de la maison chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'La spécialité de la maison', '[spécialité à compléter]'), ...LEURRES3('spécialité')], 'La spécialité de la maison : {reponse}.'),
    rp('Notre carte', 'moyen', 'Quel dessert est fait maison chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Un dessert fait maison', '[dessert à compléter]'), ...LEURRES3('dessert')], 'Le dessert {reponse} est préparé chez nous.'),
    rp('Notre carte', 'moyen', 'Quelle est la boisson ou le cocktail signature de {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Boisson ou cocktail signature', '[boisson à compléter]'), ...LEURRES3('boisson')], 'Notre boisson signature : {reponse}.'),
    rp('Notre carte', 'difficile', 'Quel ingrédient fait le petit goût de la sauce maison de {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'L’ingrédient qui fait la différence', '[ingrédient à compléter]'), ...LEURRES3('ingrédient')], 'L’ingrédient qui fait la différence : {reponse}.'),
    rp('Nos produits', 'moyen', 'D’où vient la farine utilisée par {etablissement} ?', 'choix', [NOM_ETAB, V('reponse', 'Origine de votre farine', '[origine à compléter, ex. région ou pays]')], 'Notre farine vient de {reponse}.', ['D’Italie', 'D’Ukraine', 'Du Canada']),
    rp('Nos produits', 'moyen', 'D’où viennent les tomates de {etablissement} ?', 'choix', [NOM_ETAB, V('reponse', 'Origine de vos tomates', '[origine à compléter]')], 'Nos tomates viennent de {reponse}.', ['D’Espagne', 'Du Maroc', 'Des Pays-Bas']),
    rp('Nos produits', 'moyen', 'D’où vient l’huile d’olive de {etablissement} ?', 'choix', [NOM_ETAB, V('reponse', 'Origine de votre huile d’olive', '[origine à compléter]')], 'Notre huile d’olive vient de {reponse}.', ['De Grèce', 'D’Espagne', 'De Tunisie']),
    rp('Nos produits', 'difficile', 'Chez quel producteur local {etablissement} s’approvisionne-t-il en {produit} ?', 'saisie', [NOM_ETAB, V('produit', 'Le produit concerné', '[produit à compléter, ex. légumes, fromage]'), V('reponse', 'Nom du producteur ou de la ferme', '[nom du producteur à compléter]'), ...LEURRES3('producteur')], 'Notre {produit} vient de chez {reponse}.'),
  ],
}

const pp = creerPerso('pz-perso')
export const PERSO_PIZZERIA: BanqueModele = {
  id: 'bq-modele-pizzeria-perso', nom: 'Pizzeria · Questions personnalisées (à compléter)', metiers: ['pizzeria'], genre: 'quiz', personnalisable: true,
  description: 'Pizzas par jour, repos de la pâte, four, pizza signature : à renseigner par le pizzaïolo.',
  questions: [
    pp('Notre pizzeria', 'moyen', 'Combien de pizzas environ sortent du four de {etablissement} chaque jour ?', 'nombre', [NOM_ETAB, V('reponse', 'Nombre de pizzas par jour (environ)', '[nombre à compléter]')], 'Environ {reponse} pizzas par jour chez {etablissement}.'),
    pp('Notre pizzeria', 'difficile', 'Combien d’heures la pâte à pizza repose-t-elle chez {etablissement} ?', 'nombre', [NOM_ETAB, V('reponse', 'Heures de repos de la pâte', '[nombre d’heures à compléter]')], 'Notre pâte repose {reponse} heures avant d’être étalée.'),
    pp('Notre pizzeria', 'moyen', 'Comment cuit-on les pizzas chez {etablissement} ?', 'choix', [NOM_ETAB, V('reponse', 'Votre type de four', '[type de four à compléter, ex. à bois]')], 'Chez {etablissement}, nos pizzas cuisent dans un four {reponse}.', ['Au four à bois', 'Au four électrique', 'Au four à gaz']),
    pp('Notre pizzeria', 'facile', 'Quelle est la pizza signature de {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Votre pizza signature', '[nom de la pizza à compléter]'), ...LEURRES3('pizza')], 'Notre pizza signature : {reponse}.'),
    pp('Notre pizzeria', 'moyen', 'Quelle est la pizza préférée de l’équipe de {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'La pizza préférée de l’équipe', '[nom de la pizza à compléter]'), ...LEURRES3('pizza')], 'L’équipe craque pour la {reponse}.'),
  ],
}

const pb = creerPerso('bl-perso')
export const PERSO_BOULANGER: BanqueModele = {
  id: 'bq-modele-boulanger-perso', nom: 'Boulanger · Questions personnalisées (à compléter)', metiers: ['boulanger'], genre: 'quiz', personnalisable: true,
  description: 'Pain signature, année de création, prénom du boulanger : à renseigner par vos soins.',
  questions: [
    pb('Notre boulangerie', 'facile', 'Quel est le pain signature de {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Votre pain signature', '[pain signature à compléter]'), ...LEURRES3('pain')], 'Notre pain signature : {reponse}.'),
    pb('Notre boulangerie', 'moyen', 'En quelle année {etablissement} a-t-il ouvert ses portes ?', 'annee', [NOM_ETAB, V('reponse', 'Année d’ouverture', '[année à compléter, ex. 4 chiffres]')], '{etablissement} est ouverte depuis {reponse}.'),
    pb('Notre boulangerie', 'moyen', 'Quel est le prénom de notre boulanger ou de notre boulangère chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Prénom du boulanger ou de la boulangère', '[prénom à compléter]'), ...LEURRES3('prénom')], 'Le pain est pétri par {reponse}.'),
    pb('Notre boulangerie', 'difficile', 'Combien de baguettes {etablissement} fait-elle environ chaque jour ?', 'nombre', [NOM_ETAB, V('reponse', 'Baguettes par jour (environ)', '[nombre à compléter]')], 'Environ {reponse} baguettes sortent du four chaque jour.'),
    pb('Notre boulangerie', 'moyen', 'D’où vient la farine de {etablissement} ?', 'choix', [NOM_ETAB, V('reponse', 'Origine de votre farine', '[origine à compléter]')], 'Notre farine vient de {reponse}.', ['D’Italie', 'Du Canada', 'D’Ukraine']),
  ],
}

const pc = creerPerso('bo-perso')
export const PERSO_BOUCHER: BanqueModele = {
  id: 'bq-modele-boucher-perso', nom: 'Boucher · Questions personnalisées (à compléter)', metiers: ['boucher'], genre: 'quiz', personnalisable: true,
  description: 'Spécialité maison, origine des viandes, année d’ouverture : à renseigner par le boucher.',
  questions: [
    pc('Notre boucherie', 'facile', 'Quelle est la grande spécialité de la boucherie {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'La spécialité de la maison', '[spécialité à compléter]'), ...LEURRES3('spécialité')], 'La spécialité de la maison : {reponse}.'),
    pc('Notre boucherie', 'moyen', 'D’où viennent les viandes de {etablissement} ?', 'choix', [NOM_ETAB, V('reponse', 'Origine de vos viandes', '[origine à compléter, ex. région ou éleveurs]')], 'Nos viandes viennent de {reponse}.', ['D’un grossiste lointain', 'D’un autre continent', 'De partout un peu']),
    pc('Notre boucherie', 'moyen', 'En quelle année la boucherie {etablissement} a-t-elle ouvert ses portes ?', 'annee', [NOM_ETAB, V('reponse', 'Année d’ouverture', '[année à compléter, ex. 4 chiffres]')], '{etablissement} est ouverte depuis {reponse}.'),
    pc('Notre boucherie', 'difficile', 'Quel est le morceau préféré de notre boucher chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Le morceau préféré', '[morceau à compléter]'), ...LEURRES3('morceau')], 'Le morceau préféré de la maison : {reponse}.'),
  ],
}

const pl = creerPerso('lb-perso')
export const PERSO_LIBRAIRE: BanqueModele = {
  id: 'bq-modele-libraire-perso', nom: 'Libraire · Questions personnalisées (à compléter)', metiers: ['libraire'], genre: 'quiz', personnalisable: true,
  description: 'Coup de cœur du libraire, année d’ouverture, rayon préféré : à renseigner par vos soins.',
  questions: [
    pl('Notre librairie', 'facile', 'Quel est le coup de cœur du moment chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Titre du coup de cœur', '[titre à compléter]'), ...LEURRES3('titre')], 'Notre coup de cœur : {reponse}.'),
    pl('Notre librairie', 'moyen', 'En quelle année {etablissement} a-t-elle ouvert ses portes ?', 'annee', [NOM_ETAB, V('reponse', 'Année d’ouverture', '[année à compléter, ex. 4 chiffres]')], '{etablissement} est ouverte depuis {reponse}.'),
    pl('Notre librairie', 'moyen', 'Quel est le rayon préféré de notre libraire chez {etablissement} ?', 'saisie', [NOM_ETAB, V('reponse', 'Le rayon préféré', '[rayon à compléter]'), ...LEURRES3('rayon')], 'Le rayon préféré de la maison : {reponse}.'),
    pl('Notre librairie', 'difficile', 'Combien de livres environ compte le fonds de {etablissement} ?', 'nombre', [NOM_ETAB, V('reponse', 'Nombre de livres (environ)', '[nombre à compléter]')], 'Environ {reponse} livres sont en rayon chez {etablissement}.'),
  ],
}

export const BANQUES_PERSONNALISEES: BanqueModele[] = [PERSO_RESTAURATEUR, PERSO_PIZZERIA, PERSO_BOULANGER, PERSO_BOUCHER, PERSO_LIBRAIRE]
