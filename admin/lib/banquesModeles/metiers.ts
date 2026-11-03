/**
 * Banques modeles boulanger, boucher, libraire : 20 quiz + 10 sondages bonus chacun.
 * Faits generalement admis ; aucune marque. Format `banques.questions` (voir lib/banques.ts).
 */
import { creerQuiz, creerBonus, type BanqueModele } from './outils'

const bq = creerQuiz('bl-quiz')
export const QUIZ_BOULANGER: BanqueModele = {
  id: 'bq-modele-boulanger-quiz', nom: 'Boulanger · Quiz pain, viennoiserie et pâtisserie', metiers: ['boulanger'], genre: 'quiz', personnalisable: false,
  description: 'Farine, levain, pétrissage, cuisson, croissant, baguette : 20 questions pour les gourmands de pain.',
  questions: [
    bq('Pain', 'facile', 'Quels sont les ingrédients de base d’un pain ?', 'Farine, eau, sel et levure ou levain', ['Farine, œufs, beurre et sucre', 'Maïs, lait et huile', 'Riz, eau et vinaigre'], 'Quatre ingrédients suffisent pour un pain : farine, eau, sel et levure (ou levain).'),
    bq('Pain', 'facile', 'Qu’est-ce qu’un levain naturel ?', 'Un mélange de farine et d’eau mis à fermenter', ['Un sel spécial', 'Un type de four', 'Une farine de maïs'], 'Le levain est une pâte fermentée naturellement, qui fait lever le pain et lui donne du goût.'),
    bq('Pain', 'moyen', 'Que garantit l’appellation « pain de tradition française » ?', 'Un pain sans additif, jamais surgelé', ['Un pain cuit au feu de bois', 'Un pain fait avec de la farine bio', 'Un pain au seigle'], 'Cette appellation est réservée aux pains fabriqués sans additif et sans surgélation.'),
    bq('Fabrication', 'moyen', 'Que développe le pétrissage dans la pâte à pain ?', 'Le réseau de gluten', ['La levure', 'Le sel', 'La couleur'], 'En pétrissant, on forme le réseau de gluten qui donne de l’élasticité à la pâte.'),
    bq('Fabrication', 'difficile', 'Comment appelle-t-on la première fermentation de la pâte, après le pétrissage ?', 'Le pointage', ['Le façonnage', 'L’enfournement', 'Le pliage'], 'Le pointage est la fermentation en masse, avant de façonner les pâtons.'),
    bq('Fabrication', 'moyen', 'À quoi servent les coups de lame sur la pâte avant la cuisson ?', 'À guider l’ouverture du pain pendant la cuisson', ['À ajouter du sel', 'À empêcher la pâte de lever', 'À faire cuire plus lentement'], 'Les entailles permettent à la vapeur de s’échapper et au pain de s’ouvrir joliment.'),
    bq('Cuisson', 'moyen', 'À quelle température environ cuit-on une baguette ?', 'Autour de 240 °C', ['Autour de 80 °C', 'Autour de 120 °C', 'Autour de 400 °C'], 'Un four bien chaud, autour de 230 à 250 °C, donne une croûte dorée et croustillante.'),
    bq('Cuisson', 'moyen', 'Pourquoi injecte-t-on de la vapeur dans le four au début de la cuisson ?', 'Pour une croûte brillante et un pain bien gonflé', ['Pour saler le pain', 'Pour refroidir le four', 'Pour laver la pâte'], 'La vapeur retarde la formation de la croûte : le pain se développe avant de durcir.'),
    bq('Cuisson', 'difficile', 'Comment s’appelle la réaction qui dore la croûte et développe les arômes du pain ?', 'La réaction de Maillard', ['La réaction de Curie', 'La réaction de Pascal', 'La réaction de Newton'], 'La réaction de Maillard, entre sucres et protéines, colore et parfume la croûte.'),
    bq('Farines', 'difficile', 'Que mesure le chiffre dans « T55 » sur un sac de farine ?', 'Le taux de minéraux (cendres)', ['La température de cuisson', 'Le temps de pétrissage', 'Le taux d’humidité'], 'Le type de farine (T45, T55, T65…) indique son taux de cendres, donc son degré de blutage.'),
    bq('Farines', 'moyen', 'Qu’a-t-on conservé dans la farine d’un pain complet ?', 'Le son, l’enveloppe du grain', ['Le sucre du blé', 'Le sel marin', 'Les œufs'], 'La farine complète garde le son et le germe du grain.'),
    bq('Viennoiserie', 'facile', 'Quel ingrédient donne son feuilletage au croissant ?', 'Le beurre', ['L’huile de friture', 'Le miel', 'Le fromage'], 'Le beurre est plié plusieurs fois dans la pâte : on appelle cela le tourage.'),
    bq('Viennoiserie', 'facile', 'Quels ingrédients riches rendent la brioche moelleuse ?', 'Les œufs et le beurre', ['L’eau et le sel', 'Le vinaigre et le miel', 'Le riz et l’huile'], 'La brioche est une pâte levée enrichie en œufs et en beurre.'),
    bq('Pâtisserie', 'facile', 'Avec quelle pâte fait-on les éclairs et les choux ?', 'La pâte à choux', ['La pâte brisée', 'La pâte à pain', 'La pâte à crêpes'], 'La pâte à choux gonfle à la cuisson et crée une cavité à garnir de crème.'),
    bq('Pâtisserie', 'moyen', 'Quelle poudre est à la base de la coque d’un macaron ?', 'La poudre d’amande', ['La poudre de cacao', 'La poudre de lait', 'La poudre de café'], 'Poudre d’amande, sucre et blancs d’œufs : voilà la coque du macaron.'),
    bq('Pâtisserie', 'facile', 'Quelle crème garnit traditionnellement un mille-feuille ?', 'La crème pâtissière', ['La crème de marron', 'La crème de gruyère', 'La crème d’ail'], 'Un mille-feuille alterne pâte feuilletée et crème pâtissière.'),
    bq('Régions', 'moyen', 'De quelle région vient le kouign-amann ?', 'La Bretagne', ['L’Alsace', 'La Provence', 'Le Limousin'], 'Le kouign-amann, « gâteau au beurre » en breton, est une spécialité bretonne.'),
    bq('Régions', 'moyen', 'De quelle ville vient le canelé ?', 'Bordeaux', ['Nice', 'Lille', 'Strasbourg'], 'Le canelé est une petite pâtisserie bordelaise, à la croûte caramélisée.'),
    bq('Régions', 'facile', 'La fougasse est un pain emblématique de quelle région ?', 'La Provence', ['La Normandie', 'La Lorraine', 'La Bretagne'], 'La fougasse provençale se garnit d’olives, de lardons ou d’herbes.'),
    bq('Patrimoine', 'moyen', 'En quelle année la baguette a-t-elle été inscrite au patrimoine culturel immatériel de l’UNESCO ?', '2022', ['1990', '2005', '2015'], 'En 2022, l’UNESCO a reconnu le savoir-faire artisanal et la culture de la baguette de pain.'),
  ],
}

const bb = creerBonus('bl-bonus')
export const BONUS_BOULANGER: BanqueModele = {
  id: 'bq-modele-boulanger-bonus', nom: 'Boulanger · Sondage bonus', metiers: ['boulanger'], genre: 'bonus', personnalisable: false,
  description: 'Pain préféré, viennoiserie, moment de la journée, idées : dix mini-sondages.',
  questions: [
    bb('Goûts', 'Ton pain de cœur ?', ['La baguette', 'Le pain de campagne', 'Le pain complet', 'Un pain aux graines ou aux noix']),
    bb('Goûts', 'La viennoiserie qui te fait craquer ?', ['Le croissant', 'Le pain au chocolat', 'La brioche', 'Le pain aux raisins']),
    bb('Goûts', 'Baguette : bien cuite ou bien blonde ?', ['Bien cuite, bien croustillante', 'Blonde et moelleuse', 'Entre les deux', 'Je ne regarde pas !']),
    bb('Goûts', 'Le bout de baguette qu’on grignote en rentrant : tu l’as déjà fait ?', ['Toujours', 'Souvent', 'Parfois', 'Jamais, je suis raisonnable']),
    bb('Habitudes', 'Tu passes à la boulangerie…', ['Tous les jours', 'Plusieurs fois par semaine', 'Une fois par semaine', 'De temps en temps']),
    bb('Habitudes', 'Ton moment préféré ?', ['Le matin tôt', 'À la pause de midi', 'Au goûter', 'Juste avant le dîner']),
    bb('Profil', 'Et vous, quel client de la boulangerie êtes-vous ?', ['Le matinal : première fournée !', 'Le gourmand : toujours une pâtisserie en plus', 'Le pressé : sandwich et c’est parti', 'Le fidèle : toujours la même commande']),
    bb('Idées', 'Quelle nouveauté aimerais-tu trouver ?', ['Un pain de saison', 'Des sandwichs maison', 'Des pâtisseries individuelles', 'Un atelier pour apprendre à faire son pain']),
    bb('Idées', 'Pour un cadeau gourmand, tu penses à…', ['Un coffret de viennoiseries', 'Un gâteau pour la famille', 'Des biscuits', 'Un pain-surprise']),
    bb('Satisfaction', 'Comment trouves-tu l’accueil en boutique ?', ['Au top', 'Bien', 'Moyen', 'À améliorer']),
  ],
}

const bc = creerQuiz('bo-quiz')
export const QUIZ_BOUCHER: BanqueModele = {
  id: 'bq-modele-boucher-quiz', nom: 'Boucher · Quiz viandes, morceaux et cuissons', metiers: ['boucher'], genre: 'quiz', personnalisable: false,
  description: 'Morceaux, cuissons, labels, charcuterie, plats mijotés et régions : 20 questions pour les gourmands de viande.',
  questions: [
    bc('Morceaux', 'moyen', 'Quel morceau de bœuf est réputé le plus tendre ?', 'Le filet', ['Le jarret', 'La joue', 'Le collier'], 'Le filet est un muscle peu sollicité, donc très tendre.'),
    bc('Morceaux', 'facile', 'D’où vient le nom « entrecôte » ?', 'De sa position entre deux côtes', ['De son lieu d’origine', 'Du nom d’un boucher', 'De sa couleur'], 'L’entrecôte se coupe entre deux côtes du bœuf.'),
    bc('Morceaux', 'facile', 'De quelle partie de l’animal vient le gigot ?', 'De la cuisse de l’agneau', ['Du cou de l’agneau', 'Du ventre du porc', 'De l’aile du poulet'], 'Le gigot d’agneau est la cuisse de l’animal.'),
    bc('Morceaux', 'facile', 'Quelle partie du porc donne le jambon ?', 'La cuisse', ['Le cou', 'Le museau', 'La queue'], 'Le jambon est préparé à partir de la cuisse du porc.'),
    bc('Morceaux', 'facile', 'Le magret est le filet de quel animal ?', 'Du canard', ['De l’agneau', 'Du poulet', 'Du lapin'], 'Le magret est la poitrine charnue d’un canard engraissé.'),
    bc('Morceaux', 'moyen', 'Que signifie « persillé » pour une viande ?', 'Elle contient de fines veinules de gras dans le muscle', ['Elle est recouverte de persil', 'Elle est salée', 'Elle est congelée'], 'Ce gras fond à la cuisson et rend la viande plus savoureuse.'),
    bc('Savoir-faire', 'moyen', 'Pourquoi laisse-t-on reposer une viande après la cuisson ?', 'Pour que les jus se répartissent dans la chair', ['Pour la refroidir complètement', 'Pour qu’elle sèche', 'Pour la saler'], 'Le repos évite que les jus ne s’échappent à la découpe.'),
    bc('Savoir-faire', 'difficile', 'En quoi consiste la maturation d’une viande ?', 'La laisser vieillir au froid pour la rendre plus tendre et plus parfumée', ['La congeler pendant des mois', 'La faire sécher au soleil', 'La plonger dans l’huile'], 'La maturation, au froid et sous contrôle, attendrit et affine le goût.'),
    bc('Savoir-faire', 'moyen', 'Que signifie « barder » un rôti ?', 'L’entourer d’une fine tranche de gras', ['Le piquer de clous', 'Le couper en deux', 'Le tremper dans du lait'], 'La barde protège la viande du dessèchement pendant la cuisson.'),
    bc('Savoir-faire', 'facile', 'Comment s’appelle la tige d’acier qui sert au boucher à entretenir le fil de ses couteaux ?', 'Le fusil', ['Le hachoir', 'La louche', 'La spatule'], 'Le fusil redresse le fil de la lame entre deux affûtages.'),
    bc('Cuisson', 'moyen', 'Pourquoi cuit-on plus à cœur un steak haché qu’un steak entier ?', 'Parce que le hachage répartit la surface de la viande dans toute la préparation', ['Parce qu’il est plus gras', 'Parce qu’il est plus froid', 'Pour qu’il soit plus rouge'], 'Une viande hachée doit être bien cuite à cœur par précaution d’hygiène.'),
    bc('Cuisson', 'facile', 'Quel plat mijote du bœuf avec carottes, poireaux et navets dans un bouillon ?', 'Le pot-au-feu', ['La choucroute', 'Le cassoulet', 'La paella'], 'Le pot-au-feu est un grand classique de la cuisine française, servi avec le bouillon.'),
    bc('Cuisson', 'facile', 'Quelle viande est la base de la blanquette ?', 'Le veau', ['Le canard', 'Le sanglier', 'Le lapin'], 'La blanquette est un plat mijoté de veau, en sauce blanche.'),
    bc('Cuisson', 'facile', 'Quel plat mijote du bœuf avec du vin rouge, des lardons et des champignons ?', 'Le bœuf bourguignon', ['La blanquette de veau', 'Le couscous', 'Le pot-au-feu de poisson'], 'Le bœuf bourguignon vient de Bourgogne, terre de vins.'),
    bc('Charcuterie', 'facile', 'Quel ingrédient donne sa couleur sombre au boudin noir ?', 'Le sang', ['Le chocolat', 'L’encre de seiche', 'Le café'], 'Le boudin noir est préparé avec du sang de porc, du gras et des oignons.'),
    bc('Charcuterie', 'facile', 'De quoi est principalement fait un saucisson sec ?', 'De viande de porc hachée et de gras', ['De poisson fumé', 'De farine de blé', 'De fromage'], 'Le saucisson sec est séché plusieurs semaines après avoir été assaisonné.'),
    bc('Labels', 'moyen', 'Que signifie le logo « Viande Bovine Française » ?', 'L’animal est né, élevé et abattu en France', ['L’animal a été congelé en France', 'La viande est toujours bio', 'La viande est toujours du Label Rouge'], 'Ce logo garantit l’origine française de la viande de bœuf.'),
    bc('Races et terroirs', 'moyen', 'De quelle région vient la race bovine charolaise ?', 'La Bourgogne (le Charolais)', ['La Bretagne', 'L’Alsace', 'La Corse'], 'La charolaise est une race à viande originaire du Charolais, en Bourgogne.'),
    bc('Races et terroirs', 'moyen', 'Dans quel département est élevé l’agneau de Sisteron (IGP) ?', 'Les Alpes-de-Haute-Provence', ['Le Nord', 'La Manche', 'Le Finistère'], 'L’agneau de Sisteron est une indication géographique protégée de Haute-Provence.'),
    bc('Races et terroirs', 'difficile', 'Quelle viande bénéficie d’une AOP en Camargue ?', 'Le taureau', ['Le sanglier', 'Le cheval', 'Le canard'], 'Le taureau de Camargue est une appellation d’origine protégée.'),
  ],
}

const bd = creerBonus('bo-bonus')
export const BONUS_BOUCHER: BanqueModele = {
  id: 'bq-modele-boucher-bonus', nom: 'Boucher · Sondage bonus', metiers: ['boucher'], genre: 'bonus', personnalisable: false,
  description: 'Viande préférée, cuisson, barbecue, origine : dix mini-sondages.',
  questions: [
    bd('Goûts', 'La viande de ta table du dimanche ?', ['Le rôti', 'Le poulet', 'Les grillades', 'Un plat mijoté']),
    bd('Goûts', 'Ta cuisson de viande rouge ?', ['Bleue', 'Saignante', 'À point', 'Bien cuite']),
    bd('Goûts', 'Au barbecue, tu prends en premier…', ['Les brochettes', 'Les saucisses', 'Une côte', 'Le poulet mariné']),
    bd('Goûts', 'Une marinade, plutôt…', ['Aux herbes', 'Aux épices', 'Au citron', 'Nature, rien de plus']),
    bd('Habitudes', 'Tu viens chez ton boucher…', ['Chaque semaine', 'Quelques fois par mois', 'Pour les grandes occasions', 'Pour le barbecue']),
    bd('Habitudes', 'Pour choisir ta viande, tu comptes sur…', ['Le conseil du boucher', 'Ma recette du jour', 'Le prix', 'L’origine']),
    bd('Profil', 'Et vous, quel client de la boucherie êtes-vous ?', ['Le cuisinier : je viens avec ma recette', 'Le curieux : je demande un morceau que je ne connais pas', 'Le grillardin : barbecue en vue', 'Le pressé : prêt à cuire, merci']),
    bd('Idées', 'Qu’aimerais-tu trouver en plus ?', ['Des plats cuisinés maison', 'Des marinades prêtes à cuire', 'Des conseils de cuisson', 'Des coffrets pour le barbecue']),
    bd('Idées', 'L’origine de la viande, pour toi…', ['C’est essentiel', 'C’est un plus', 'Je n’y prête pas attention']),
    bd('Satisfaction', 'Comment trouves-tu les conseils du boucher ?', ['Précieux', 'Utiles', 'Moyens', 'À améliorer']),
  ],
}

const bl = creerQuiz('lb-quiz')
export const QUIZ_LIBRAIRE: BanqueModele = {
  id: 'bq-modele-libraire-quiz', nom: 'Libraire · Quiz littérature et livres', metiers: ['libraire'], genre: 'quiz', personnalisable: false,
  description: 'Classiques, poésie, théâtre, prix littéraires, vocabulaire du livre et auteurs de la région : 20 questions.',
  questions: [
    bl('Classiques', 'facile', 'Qui a écrit « Les Misérables » ?', 'Victor Hugo', ['Émile Zola', 'Honoré de Balzac', 'Gustave Flaubert'], 'Victor Hugo a publié « Les Misérables » en 1862.'),
    bl('Classiques', 'facile', 'Qui a écrit « Le Petit Prince » ?', 'Antoine de Saint-Exupéry', ['Jules Verne', 'Albert Camus', 'Marcel Pagnol'], 'Saint-Exupéry est aussi aviateur ; son conte est l’un des livres les plus traduits au monde.'),
    bl('Classiques', 'facile', 'Dans quel pays se déroule « Don Quichotte » ?', 'En Espagne', ['En Italie', 'Au Portugal', 'En France'], 'Le roman de Cervantès se déroule en Espagne, dans la Manche.'),
    bl('Classiques', 'moyen', 'Qui a écrit « L’Étranger » ?', 'Albert Camus', ['Jean-Paul Sartre', 'Marguerite Duras', 'André Gide'], 'Albert Camus a publié « L’Étranger » en 1942.'),
    bl('Classiques', 'moyen', 'Qui est l’auteur de « Madame Bovary » ?', 'Gustave Flaubert', ['Stendhal', 'Alexandre Dumas', 'Guy de Maupassant'], 'Le roman de Flaubert paraît en 1857.'),
    bl('Classiques', 'facile', 'Qui a écrit « Le Comte de Monte-Cristo » ?', 'Alexandre Dumas', ['Victor Hugo', 'Honoré de Balzac', 'Jules Verne'], 'Alexandre Dumas est aussi l’auteur des « Trois Mousquetaires ».'),
    bl('Classiques', 'moyen', 'Comment s’appelle le capitaine du Nautilus dans « Vingt mille lieues sous les mers » ?', 'Nemo', ['Achab', 'Haddock', 'Crochet'], 'Le capitaine Nemo est le personnage énigmatique du roman de Jules Verne.'),
    bl('Classiques', 'moyen', 'Dans « Les Trois Mousquetaires », comment s’appelle le jeune Gascon ?', 'D’Artagnan', ['Rodrigue', 'Roland', 'Figaro'], 'D’Artagnan rejoint Athos, Porthos et Aramis.'),
    bl('Classiques', 'difficile', 'Qui a écrit « À la recherche du temps perdu » ?', 'Marcel Proust', ['André Malraux', 'Louis Aragon', 'Colette'], 'Cette œuvre en sept volumes est l’un des sommets de la littérature française.'),
    bl('Classiques', 'facile', 'Qui a écrit les « Fables » où l’on trouve « La Cigale et la Fourmi » ?', 'Jean de La Fontaine', ['Charles Perrault', 'Molière', 'Victor Hugo'], 'La Fontaine a mis en vers des fables célèbres au XVIIe siècle.'),
    bl('Classiques', 'moyen', 'Qui a écrit « Germinal » ?', 'Émile Zola', ['Victor Hugo', 'Guy de Maupassant', 'Alphonse Daudet'], 'Zola y raconte la vie des mineurs du Nord.'),
    bl('Poésie et théâtre', 'moyen', 'Qui a écrit « Les Fleurs du mal » ?', 'Charles Baudelaire', ['Arthur Rimbaud', 'Paul Verlaine', 'Alfred de Musset'], 'Baudelaire publie « Les Fleurs du mal » en 1857.'),
    bl('Poésie et théâtre', 'moyen', 'Qui a écrit la pièce « Cyrano de Bergerac » ?', 'Edmond Rostand', ['Molière', 'Jean Racine', 'Victor Hugo'], 'Cyrano, son grand nez et son panache sont nés sous la plume d’Edmond Rostand.'),
    bl('Poésie et théâtre', 'moyen', 'Combien de syllabes compte un alexandrin ?', 'Douze', ['Huit', 'Dix', 'Quatorze'], 'L’alexandrin est le vers de douze syllabes.'),
    bl('Vocabulaire du livre', 'moyen', 'Que signifie le sigle ISBN ?', 'Numéro international normalisé du livre', ['Index des succès de bibliothèque nationale', 'Imprimé sur beau noir', 'Inventaire standard des beaux numéros'], 'L’ISBN (International Standard Book Number) identifie chaque édition d’un livre.'),
    bl('Vocabulaire du livre', 'moyen', 'Qu’appelle-t-on l’« incipit » d’un roman ?', 'Ses premiers mots ou ses premières phrases', ['Sa dernière page', 'Sa couverture', 'Son résumé au dos'], 'L’incipit est le début du texte : il doit donner envie de poursuivre.'),
    bl('Vocabulaire du livre', 'facile', 'Quel inventeur est associé à l’imprimerie à caractères mobiles en Europe, au XVe siècle ?', 'Johannes Gutenberg', ['Léonard de Vinci', 'Christophe Colomb', 'Galilée'], 'Gutenberg a mis au point l’imprimerie vers 1450 à Mayence.'),
    bl('Vocabulaire du livre', 'difficile', 'Quel prix littéraire français porte le nom de deux frères écrivains ?', 'Le prix Goncourt', ['Le prix Nobel', 'Le prix Pulitzer', 'Le prix Fémina'], 'Le prix Goncourt honore la mémoire d’Edmond et Jules de Goncourt ; il est remis chaque automne.'),
    bl('Auteurs du Sud', 'moyen', 'Quel auteur a écrit « La Gloire de mon père » ?', 'Marcel Pagnol', ['Jean Giono', 'Alphonse Daudet', 'Frédéric Mistral'], 'Marcel Pagnol raconte ses souvenirs d’enfance en Provence.'),
    bl('Auteurs du Sud', 'difficile', 'Quel auteur de « Le Hussard sur le toit » est né à Manosque ?', 'Jean Giono', ['Marcel Pagnol', 'Albert Camus', 'Colette'], 'Jean Giono est l’un des grands écrivains de la Provence.'),
  ],
}

const bm = creerBonus('lb-bonus')
export const BONUS_LIBRAIRE: BanqueModele = {
  id: 'bq-modele-libraire-bonus', nom: 'Libraire · Sondage bonus', metiers: ['libraire'], genre: 'bonus', personnalisable: false,
  description: 'Genres, formats, lieux de lecture, idées d’animations : dix mini-sondages.',
  questions: [
    bm('Goûts', 'Ton genre préféré ?', ['Roman', 'Policier', 'BD et manga', 'Documentaire ou histoire', 'Jeunesse']),
    bm('Goûts', 'Le livre idéal pour les vacances ?', ['Un gros roman', 'Un polar qui se dévore', 'Un guide pour explorer', 'Une BD légère']),
    bm('Habitudes', 'Tu lis surtout…', ['Sur papier', 'En poche', 'Sur liseuse', 'En livre audio']),
    bm('Habitudes', 'Tu lis plutôt…', ['Le soir au lit', 'Dans les transports', 'En vacances', 'Quand je peux !']),
    bm('Habitudes', 'Combien de livres lis-tu environ par an ?', ['Un à trois', 'Quatre à dix', 'Plus de dix', 'Je n’ai pas compté']),
    bm('Profil', 'Et vous, quel lecteur êtes-vous ?', ['Le fidèle : je relis mes classiques', 'Le curieux : je tente un auteur inconnu', 'Le boulimique : un livre à peine fini, un autre commencé', 'Le conseillé : je fais confiance à mon libraire']),
    bm('Profil', 'Pour choisir ton prochain livre, tu te fies…', ['Au conseil du libraire', 'À la couverture', 'Au bouche-à-oreille', 'Aux prix littéraires']),
    bm('Idées', 'Quelle animation te plairait en librairie ?', ['Une rencontre avec un auteur', 'Un club de lecture', 'Un atelier d’écriture', 'Une dédicace']),
    bm('Idées', 'Pour offrir, tu penses plutôt à…', ['Un roman', 'Une BD', 'Un livre de cuisine', 'Un livre pour enfants']),
    bm('Satisfaction', 'Comment trouves-tu les conseils de lecture en boutique ?', ['Excellents', 'Utiles', 'Moyens', 'À améliorer']),
  ],
}

export const BANQUES_METIERS: BanqueModele[] = [QUIZ_BOULANGER, BONUS_BOULANGER, QUIZ_BOUCHER, BONUS_BOUCHER, QUIZ_LIBRAIRE, BONUS_LIBRAIRE]
