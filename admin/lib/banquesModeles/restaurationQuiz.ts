/**
 * Banques QUIZ « restauration » : pizza, temps de cuisson, origines, saisons, eveil (anti-gaspi,
 * labels, allergenes), region (PACA, arriere-pays nicois, Vence), culture gastronomique.
 * Faits generalement admis et verifiables ; aucune marque ; aucun effet sante promis.
 * Format `banques.questions` : { id, type:'qcm', texte, options[4], bonne, points, explication, theme, difficulte }.
 */
import { creerQuiz, type BanqueModele } from './outils'

const pz = creerQuiz('rq-pizza')
const ck = creerQuiz('rq-cuisson')
const og = creerQuiz('rq-origine')
const sa = creerQuiz('rq-saison')
const ev = creerQuiz('rq-eveil')
const rg = creerQuiz('rq-region')
const cu = creerQuiz('rq-culture')

export const QUIZ_PIZZA: BanqueModele = {
  id: 'bq-modele-resto-pizza', nom: 'Restaurateur · Pizza', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: false,
  description: 'Pâte, repos, levure, température du four et temps de cuisson : tout sur la fabrication d’une pizza.',
  questions: [
    pz('Pizza', 'facile', 'Quel ingrédient fait gonfler la pâte à pizza ?', 'La levure', ['Le sel', 'L’huile d’olive', 'La tomate'], 'La levure produit du gaz carbonique qui fait lever la pâte.'),
    pz('Pizza', 'facile', 'Quels sont les ingrédients de base d’une pâte à pizza classique ?', 'Farine, eau, sel et levure', ['Farine, œufs, beurre et sucre', 'Pommes de terre, crème et fromage', 'Semoule, lait, miel et vinaigre'], 'Une pâte à pizza tient en quatre ingrédients : farine, eau, sel et levure (souvent un filet d’huile d’olive).'),
    pz('Pizza', 'facile', 'Pourquoi laisse-t-on reposer la pâte avant de l’étaler ?', 'Pour qu’elle lève et devienne souple', ['Pour qu’elle sèche complètement', 'Pour qu’elle refroidisse avant la cuisson', 'Pour lui retirer sa levure'], 'Pendant le repos, la levure travaille et la pâte se détend : elle est plus facile à étaler.'),
    pz('Pizza', 'facile', 'De quelle ville italienne la pizza est-elle originaire ?', 'Naples', ['Milan', 'Venise', 'Turin'], 'La pizza est née à Naples, où elle est devenue un plat emblématique.'),
    pz('Pizza', 'facile', 'Quelle pizza reprend, dit-on, les trois couleurs du drapeau italien ?', 'La Margherita', ['La Reine', 'La Calzone', 'La Quatre fromages'], 'Tomate rouge, mozzarella blanche, basilic vert : la Margherita rappelle les couleurs de l’Italie.'),
    pz('Pizza', 'moyen', 'À quelle température peut monter un four à bois de pizzeria napolitaine ?', 'Plus de 400 °C', ['Environ 100 °C', 'Environ 150 °C', 'Environ 200 °C'], 'Les fours à bois traditionnels montent en général entre 400 et 500 °C, bien plus qu’un four de maison.'),
    pz('Pizza', 'moyen', 'Combien de temps cuit une pizza dans un four à bois très chaud ?', 'Environ 90 secondes', ['Environ 10 minutes', 'Environ 25 minutes', 'Environ 45 minutes'], 'À cette chaleur, une pizza cuit en une à deux minutes seulement.'),
    pz('Pizza', 'moyen', 'Pourquoi fait-on longuement préchauffer le four avant d’enfourner une pizza ?', 'Pour que la pâte cuise vite et devienne croustillante', ['Pour que la pizza reste crue au centre', 'Pour faire refroidir la sauce', 'Pour dessaler la pâte'], 'Un four bien chaud saisit la pâte : le dessous croustille avant que la garniture ne sèche.'),
    pz('Pizza', 'moyen', 'Que veut dire « calzone » en cuisine ?', 'Une pizza repliée sur elle-même', ['Une pizza sans fromage', 'Une pizza à la crème', 'Une pizza servie froide'], 'La calzone est une pizza garnie puis repliée en demi-lune avant la cuisson.'),
    pz('Pizza', 'moyen', 'Pourquoi certains pizzaïolos laissent-ils la pâte reposer 24 heures ou plus au frais ?', 'Pour lui donner plus de goût et de souplesse', ['Pour la faire sécher', 'Pour lui faire perdre son sel', 'Parce que le four n’est pas prêt'], 'Une longue levée lente au frais développe les arômes et rend la pâte plus souple.'),
    pz('Pizza', 'moyen', 'Que désigne le « 00 » sur un sac de farine italienne ?', 'Une mouture très fine', ['Le nombre de grammes de sel', 'L’année de la récolte', 'Le taux d’humidité'], 'Le « 00 » indique le degré de finesse de la mouture : c’est la plus fine.'),
    pz('Pizza', 'difficile', 'Quelle garniture porte la pizza « marinara » traditionnelle ?', 'Tomate, ail, origan et huile d’olive', ['Tomate, mozzarella et basilic', 'Jambon et champignons', 'Chèvre, miel et noix'], 'La marinara est la pizza sans fromage : tomate, ail, origan et un filet d’huile d’olive.'),
  ],
}

export const QUIZ_CUISSONS: BanqueModele = {
  id: 'bq-modele-resto-cuissons', nom: 'Restaurateur · Temps de cuisson', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: false,
  description: 'Œuf, pâtes, riz, viandes, poissons, frites : les bons réflexes de cuisson.',
  questions: [
    ck('Temps de cuisson', 'facile', 'Combien de temps cuit un œuf à la coque dans l’eau bouillante ?', 'Environ 3 minutes', ['Environ 30 secondes', 'Environ 12 minutes', 'Environ 25 minutes'], 'Trois minutes environ : le blanc est pris et le jaune reste liquide.'),
    ck('Temps de cuisson', 'facile', 'Combien de temps cuit un œuf dur dans l’eau bouillante ?', 'Environ 10 minutes', ['Environ 1 minute', 'Environ 3 minutes', 'Environ 25 minutes'], 'Compter une dizaine de minutes pour un blanc et un jaune bien fermes.'),
    ck('Temps de cuisson', 'moyen', 'Combien de temps cuit un œuf mollet dans l’eau bouillante ?', 'Environ 6 minutes', ['Environ 1 minute', 'Environ 15 minutes', 'Environ 20 minutes'], 'Six minutes environ : le blanc est ferme, le jaune encore coulant.'),
    ck('Temps de cuisson', 'facile', 'Que veut dire « al dente » pour des pâtes ?', 'Cuites mais encore fermes sous la dent', ['Cuites très longtemps jusqu’à devenir molles', 'Servies froides', 'Cuites sans eau'], 'Des pâtes « al dente » gardent une petite résistance en bouche.'),
    ck('Temps de cuisson', 'moyen', 'Quelle quantité de sel met-on environ dans l’eau de cuisson des pâtes ?', 'Environ 10 g par litre', ['Environ 1 g par litre', 'Environ 50 g par litre', 'Environ 100 g par litre'], 'Une dizaine de grammes par litre assaisonne les pâtes sans les rendre trop salées.'),
    ck('Temps de cuisson', 'facile', 'Les pâtes fraîches cuisent en général…', 'Bien plus vite que les pâtes sèches', ['Bien plus lentement que les pâtes sèches', 'Exactement au même rythme', 'Pendant une heure'], 'Les pâtes fraîches contiennent déjà de l’eau : quelques minutes suffisent.'),
    ck('Temps de cuisson', 'moyen', 'Combien de temps cuit environ du riz blanc à grains longs dans l’eau bouillante ?', 'Environ 10 à 12 minutes', ['Environ 2 minutes', 'Environ 45 minutes', 'Environ 1 h 30'], 'Le temps exact est indiqué sur le paquet, autour de dix à douze minutes.'),
    ck('Temps de cuisson', 'facile', 'Quelle cuisson de viande rouge est la moins cuite ?', 'Bleue', ['À point', 'Saignante', 'Bien cuite'], 'Dans l’ordre : bleue, saignante, à point, bien cuite.'),
    ck('Temps de cuisson', 'moyen', 'Comment cuit-on des noix de Saint-Jacques à la poêle ?', 'Très vite, environ 1 à 2 minutes par face', ['Pendant 20 minutes par face', 'Pendant 40 minutes à feu doux', 'Une heure au four'], 'Une cuisson courte garde leur chair fondante ; trop longtemps, elles durcissent.'),
    ck('Temps de cuisson', 'moyen', 'Pourquoi cuit-on souvent les frites en deux fois ?', 'Pour qu’elles soient dorées dehors et moelleuses dedans', ['Pour qu’elles absorbent plus de sel', 'Pour qu’elles restent blanches', 'Parce que la première friture les rend crues'], 'Une première cuisson plus douce cuit l’intérieur, la seconde, plus chaude, dore l’extérieur.'),
    ck('Temps de cuisson', 'difficile', 'Quel temps de cuisson est généralement conseillé pour un filet de poisson fin à la poêle ?', 'Quelques minutes par face', ['Une heure par face', 'Plus de deux heures', 'Aucun : il se mange toujours cru'], 'Un poisson fin cuit vite ; le temps dépend surtout de l’épaisseur du filet.'),
  ],
}

export const QUIZ_ORIGINES: BanqueModele = {
  id: 'bq-modele-resto-origines', nom: 'Restaurateur · Origines des aliments', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: false,
  description: 'Tomate, pomme de terre, riz, cacao, café, fromages : les origines des produits du quotidien.',
  questions: [
    og('Origines', 'facile', 'Sur quel continent la tomate a-t-elle été cultivée en premier ?', 'En Amérique', ['En Europe', 'En Asie', 'En Afrique'], 'La tomate vient d’Amérique et est arrivée en Europe au XVIe siècle.'),
    og('Origines', 'moyen', 'Dans quelle région du monde la pomme de terre a-t-elle été cultivée en premier ?', 'Les Andes', ['Les Alpes', 'L’Himalaya', 'Les Pyrénées'], 'La pomme de terre est originaire des Andes, en Amérique du Sud.'),
    og('Origines', 'facile', 'Sur quel continent le riz a-t-il été cultivé en premier ?', 'En Asie', ['En Amérique du Nord', 'En Europe', 'En Océanie'], 'Le riz est cultivé en Asie depuis des millénaires.'),
    og('Origines', 'facile', 'D’où vient le cacao, base du chocolat ?', 'D’Amérique centrale et du Sud', ['De Scandinavie', 'Des Alpes', 'D’Australie'], 'Le cacaoyer est originaire des régions chaudes et humides d’Amérique.'),
    og('Origines', 'moyen', 'De quelle région du monde le caféier est-il originaire ?', 'D’Afrique de l’Est (Éthiopie)', ['De Scandinavie', 'D’Amérique du Nord', 'D’Australie'], 'Le caféier est originaire d’Éthiopie avant d’être cultivé dans de nombreux pays.'),
    og('Origines', 'facile', 'Dans quel pays le Parmigiano Reggiano est-il fabriqué ?', 'En Italie', ['En Espagne', 'Au Portugal', 'En Grèce'], 'Ce fromage à pâte dure vient d’Émilie-Romagne, en Italie, et porte une appellation d’origine protégée.'),
    og('Origines', 'facile', 'De quelle région de France vient le camembert ?', 'La Normandie', ['La Bretagne', 'L’Alsace', 'La Provence'], 'Le camembert de Normandie est une appellation d’origine protégée.'),
    og('Origines', 'moyen', 'Avec quel lait le roquefort est-il fabriqué ?', 'Du lait de brebis', ['Du lait de vache', 'Du lait de chèvre', 'Du lait de jument'], 'Le roquefort est un fromage au lait de brebis, affiné dans des caves.'),
    og('Origines', 'moyen', 'De quelle plante vient la vanille ?', 'D’une orchidée', ['D’un palmier', 'D’un cactus', 'D’un buisson de lavande'], 'La gousse de vanille est le fruit d’une orchidée.'),
    og('Origines', 'moyen', 'Le safran est fait à partir…', 'Des filaments (stigmates) d’une fleur de crocus', ['Des graines d’un tournesol', 'Des feuilles d’un olivier', 'Des racines d’une carotte'], 'Chaque fleur de crocus ne donne que quelques filaments rouges, récoltés à la main : d’où son prix.'),
  ],
}

export const QUIZ_SAISONS: BanqueModele = {
  id: 'bq-modele-resto-saisons', nom: 'Restaurateur · Fruits et légumes de saison', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: false,
  description: 'Printemps, été, automne, hiver : quels produits sont de saison (France métropolitaine) ?',
  questions: [
    sa('Printemps', 'facile', 'Quel fruit rouge est de saison au printemps en France ?', 'La fraise', ['La clémentine', 'La châtaigne', 'La mandarine'], 'Les premières fraises de France arrivent au printemps.'),
    sa('Printemps', 'facile', 'Quel légume « royal » est de saison au printemps ?', 'L’asperge', ['La courge', 'Le chou de Bruxelles', 'La betterave'], 'La saison de l’asperge s’étend du printemps au début de l’été.'),
    sa('Printemps', 'moyen', 'Le « violet de Provence » est une variété de quel légume ?', 'L’artichaut', ['De l’aubergine', 'De la betterave', 'Du chou'], 'Le violet de Provence est un petit artichaut très présent sur les étals du sud au printemps.'),
    sa('Été', 'facile', 'Quel légume-fruit est de pleine saison en été ?', 'La tomate', ['Le potiron', 'Le poireau', 'Le navet'], 'La tomate se récolte surtout de juin à septembre.'),
    sa('Été', 'facile', 'Quel fruit est de saison en été ?', 'La pêche', ['La clémentine', 'La poire d’hiver', 'La châtaigne'], 'Pêches, abricots et melons sont des fruits de l’été.'),
    sa('Été', 'moyen', 'Quel légume est l’un des ingrédients de la ratatouille en été ?', 'La courgette', ['Le potimarron', 'Le panais', 'La mâche'], 'Courgette, aubergine, poivron et tomate : le quatuor d’été de la ratatouille.'),
    sa('Automne', 'facile', 'Quel légume orange est un symbole de l’automne ?', 'La courge (potiron)', ['La tomate', 'La courgette', 'Le radis'], 'Potiron, potimarron et autres courges se récoltent à l’automne.'),
    sa('Automne', 'moyen', 'Quel fruit à coque se ramasse en automne ?', 'La châtaigne', ['La fraise', 'La cerise', 'L’abricot'], 'Les châtaignes tombent à l’automne, de fin septembre à novembre.'),
    sa('Hiver', 'facile', 'Quel agrume est de saison en hiver ?', 'La clémentine', ['La pastèque', 'La fraise', 'La pêche'], 'Clémentines, oranges et citrons sont les agrumes de l’hiver.'),
    sa('Hiver', 'moyen', 'Quel légume blanc et croquant est un légume d’hiver ?', 'L’endive', ['Le concombre', 'La courgette', 'Le poivron'], 'L’endive pousse à l’abri de la lumière et se récolte surtout de l’automne au printemps.'),
  ],
}

export const QUIZ_EVEIL: BanqueModele = {
  id: 'bq-modele-resto-eveil', nom: 'Restaurateur · Anti-gaspi, labels et allergènes', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: false,
  description: 'Gaspillage, circuits courts, labels, allergènes, dates limites : de quoi sensibiliser sans ennuyer.',
  questions: [
    ev('Anti-gaspi', 'facile', 'Que signifie « DLC » sur un emballage ?', 'Date limite de consommation', ['Dosage légal en calories', 'Délai de livraison courant', 'Date de lancement commerciale'], 'Passé la DLC, le produit ne doit plus être consommé : elle figure sur les produits très périssables.'),
    ev('Anti-gaspi', 'moyen', 'Que signifie la mention « à consommer de préférence avant » ?', 'La qualité optimale est garantie jusqu’à cette date', ['Le produit devient inutilisable le lendemain', 'Le produit doit être congelé', 'Le produit est déjà périmé'], 'Cette date (DDM) indique une qualité optimale ; elle ne signifie pas que le produit est périmé.'),
    ev('Anti-gaspi', 'facile', 'Que signifie « premier entré, premier sorti » en cuisine ?', 'Utiliser d’abord les produits les plus anciens', ['Servir d’abord les clients arrivés les premiers', 'Jeter les restes de la veille', 'Ranger les produits au hasard'], 'Cette règle évite que des produits ne se perdent au fond d’une réserve.'),
    ev('Anti-gaspi', 'moyen', 'Au restaurant, un client qui n’a pas fini son repas peut demander…', 'À emporter ses restes dans un contenant', ['Que l’on jette son plat devant lui', 'À payer le plat deux fois', 'Que le chef finisse son assiette'], 'En France, les restaurants doivent mettre à disposition, sur demande, un contenant pour emporter les restes (le « gourmet bag »).'),
    ev('Anti-gaspi', 'moyen', 'Depuis 2024, que doivent trier à la source tous les producteurs de déchets en France, restaurants compris ?', 'Les biodéchets (restes alimentaires)', ['Uniquement le verre', 'Uniquement les piles', 'Rien de nouveau : le tri reste facultatif'], 'Les déchets alimentaires doivent être triés pour être compostés ou transformés en énergie.'),
    ev('Circuits courts', 'difficile', 'Combien d’intermédiaires au maximum compte un « circuit court » en France ?', 'Un seul', ['Dix', 'Au moins trois', 'Aucun, c’est impossible'], 'En France, un circuit court compte au plus un intermédiaire entre le producteur et le consommateur.'),
    ev('Labels', 'moyen', 'Que garantit le « Label Rouge » ?', 'Une qualité supérieure à celle des produits courants', ['Un produit toujours bio', 'Un produit toujours fabriqué à moins de 10 km', 'Un produit sans aucun ingrédient animal'], 'Le Label Rouge est un signe officiel de qualité supérieure, contrôlé par des organismes indépendants.'),
    ev('Labels', 'facile', 'Que désigne le logo « AB » sur un produit alimentaire ?', 'L’agriculture biologique', ['Aliment de Base', 'Appellation de Boisson', 'Allégé en Beurre'], 'Le logo « AB » signale un produit issu de l’agriculture biologique.'),
    ev('Labels', 'moyen', 'Que signifie le sigle AOP ?', 'Appellation d’Origine Protégée', ['Aliment d’Origine Pasteurisée', 'Appellation Optionnelle de Production', 'Agriculture Organisée Privée'], 'L’AOP relie un produit à un terroir précis et à un savoir-faire reconnu.'),
    ev('Allergènes', 'moyen', 'Combien d’allergènes doivent être signalés au client dans un restaurant (liste européenne) ?', '14', ['4', '8', '25'], 'La réglementation européenne impose d’informer sur 14 allergènes : gluten, lait, œufs, arachides, poissons, etc.'),
    ev('Allergènes', 'facile', 'Lequel de ces ingrédients fait partie des allergènes à déclarer ?', 'Le gluten (certaines céréales)', ['La tomate', 'La carotte', 'La pomme'], 'Les céréales contenant du gluten figurent sur la liste des 14 allergènes.'),
    ev('Bon à savoir', 'facile', 'Dans un restaurant qui sert des repas en France, la carafe d’eau du robinet est…', 'Proposée gratuitement à la demande du client', ['Facturée au prix du vin', 'Interdite', 'Réservée aux enfants'], 'Une carafe d’eau doit être donnée gratuitement sur demande : bon pour le porte-monnaie et pour la planète.'),
    ev('Bon à savoir', 'moyen', 'À quelle température doit rester un réfrigérateur pour bien conserver les aliments frais ?', 'Environ 4 °C', ['Environ 12 °C', 'Environ 20 °C', 'Environ 30 °C'], 'Autour de 4 °C, le froid ralentit nettement l’altération des aliments.'),
  ],
}

export const QUIZ_REGION: BanqueModele = {
  id: 'bq-modele-resto-region', nom: 'Restaurateur · Provence, pays niçois et Vence', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: false,
  description: 'Produits locaux, spécialités, histoire culinaire et culture de la région de Vence et de l’arrière-pays niçois.',
  questions: [
    rg('Spécialités', 'facile', 'De quoi est faite la socca niçoise ?', 'De farine de pois chiche', ['De farine de maïs', 'De pommes de terre', 'De semoule de blé'], 'La socca est une galette fine de farine de pois chiche, d’eau et d’huile d’olive, cuite à four très chaud.'),
    rg('Spécialités', 'moyen', 'Quelle garniture recouvre la pissaladière niçoise ?', 'Des oignons confits, des anchois et des olives', ['Du chèvre et du miel', 'Des champignons et de la crème', 'Du jambon et du fromage'], 'Les oignons longuement cuits sont la base de la pissaladière.'),
    rg('Spécialités', 'facile', 'Quel plat provençal mijote aubergines, courgettes, poivrons, tomates et oignons ?', 'La ratatouille', ['Le gratin dauphinois', 'La choucroute', 'Le cassoulet'], 'La ratatouille est un plat de légumes d’été de la cuisine provençale et niçoise.'),
    rg('Spécialités', 'difficile', 'Le mot « tapenade » vient du provençal « tapéno ». Que désigne ce mot ?', 'Les câpres', ['Les olives', 'Les anchois', 'L’ail'], 'La tapenade doit son nom aux câpres, même si les olives en sont l’ingrédient principal.'),
    rg('Spécialités', 'facile', 'Quels sont les deux ingrédients de base d’un aïoli ?', 'L’ail et l’huile d’olive', ['Le basilic et le parmesan', 'Le citron et le beurre', 'La tomate et l’oignon'], 'L’aïoli est une émulsion d’ail et d’huile d’olive. Le pistou, lui, est à base de basilic.'),
    rg('Spécialités', 'moyen', 'Que sont les « petits farcis » niçois ?', 'De petits légumes (tomates, courgettes, oignons…) garnis de farce', ['De petits gâteaux fourrés', 'Des raviolis frits', 'Des petits poissons panés'], 'Tomates, courgettes, oignons ou aubergines sont creusés, farcis puis cuits au four.'),
    rg('Spécialités', 'difficile', 'Quel légume-feuille garnit la tourte niçoise, salée ou sucrée ?', 'Les blettes', ['Le chou', 'La laitue', 'Le poireau'], 'La tourte de blettes est une spécialité niçoise, qui existe en version salée comme en version sucrée.'),
    rg('Spécialités', 'facile', 'De quelle ville est originaire la bouillabaisse ?', 'Marseille', ['Lyon', 'Bordeaux', 'Strasbourg'], 'La bouillabaisse est une soupe de poissons de roche née à Marseille.'),
    rg('Produits locaux', 'facile', 'Quel arbre est emblématique des collines de l’arrière-pays méditerranéen ?', 'L’olivier', ['Le sapin', 'Le bouleau', 'Le hêtre'], 'L’olivier pousse sur les restanques des collines autour de Nice et de Vence.'),
    rg('Produits locaux', 'difficile', 'Quelle variété d’olive donne l’olive de Nice AOP ?', 'Le cailletier', ['La picholine', 'La lucques', 'La tanche'], 'L’olive de Nice et l’huile d’olive de Nice proviennent de la variété cailletier.'),
    rg('Produits locaux', 'moyen', 'Lequel de ces ingrédients entre dans les « herbes de Provence » ?', 'Le thym', ['La vanille', 'La cannelle', 'Le gingembre'], 'Thym, romarin, sarriette et origan font partie des herbes de Provence.'),
    rg('Produits locaux', 'difficile', 'Quelle appellation de vin se trouve sur les collines de Nice ?', 'Bellet', ['Cassis', 'Bandol', 'Palette'], 'Le vignoble de Bellet s’étend sur les collines autour de Nice.'),
    rg('Produits locaux', 'moyen', 'De quelle ville provençale le calisson est-il la spécialité ?', 'Aix-en-Provence', ['Nice', 'Marseille', 'Avignon'], 'Le calisson est une confiserie d’amandes et de fruits confits, glacée de sucre.'),
    rg('Produits locaux', 'facile', 'Quelle ville de la Côte d’Azur organise chaque hiver la Fête du Citron ?', 'Menton', ['Cannes', 'Antibes', 'Grasse'], 'Menton est connue pour ses citrons et pour sa Fête du Citron.'),
    rg('Histoire et culture', 'facile', 'Dans quel département se trouve Vence ?', 'Les Alpes-Maritimes (06)', ['Le Var', 'Les Bouches-du-Rhône', 'Le Vaucluse'], 'Vence est dans les Alpes-Maritimes, à quelques kilomètres de la mer.'),
    rg('Histoire et culture', 'facile', 'Quel peintre a conçu la chapelle du Rosaire de Vence ?', 'Henri Matisse', ['Pablo Picasso', 'Auguste Renoir', 'Paul Cézanne'], 'Henri Matisse a conçu la chapelle du Rosaire, inaugurée en 1951.'),
    rg('Histoire et culture', 'moyen', 'Dans quel village près de Vence se trouve la Fondation Maeght, consacrée à l’art moderne ?', 'Saint-Paul-de-Vence', ['Gourdon', 'Tourrettes-sur-Loup', 'Èze'], 'La Fondation Maeght, ouverte en 1964, est l’un des grands lieux d’art moderne du sud de la France.'),
    rg('Histoire et culture', 'facile', 'Quelle ville voisine est connue pour sa tradition de parfumerie ?', 'Grasse', ['Menton', 'Fréjus', 'Hyères'], 'Grasse est depuis longtemps la capitale française du parfum.'),
    rg('Histoire et culture', 'moyen', 'En quelle année le comté de Nice a-t-il été rattaché à la France ?', '1860', ['1789', '1848', '1914'], 'Le rattachement du comté de Nice à la France date de 1860.'),
    rg('Histoire et culture', 'moyen', 'Comment appelle-t-on la langue traditionnelle de Nice, proche de l’occitan ?', 'Le niçois (nissart)', ['Le breton', 'L’alsacien', 'Le basque'], 'Le niçois est la langue régionale traditionnelle du pays niçois.'),
    rg('Histoire et culture', 'facile', 'Dans quelle ville se déroule le festival Nuits du Sud ?', 'Vence', ['Nice', 'Cannes', 'Grasse'], 'Le festival Nuits du Sud anime Vence chaque été.'),
  ],
}

export const QUIZ_CULTURE: BanqueModele = {
  id: 'bq-modele-resto-culture', nom: 'Restaurateur · Culture gastronomique', metiers: ['restaurateur', 'pizzeria'], genre: 'quiz', personnalisable: false,
  description: 'Vocabulaire de cuisine, techniques, saveurs et patrimoine gastronomique.',
  questions: [
    cu('Vocabulaire', 'facile', 'Que signifie « mise en place » en cuisine ?', 'Tout préparer avant le service', ['Mettre la table en terrasse', 'Nettoyer la cuisine après le service', 'Choisir le menu du jour'], 'La mise en place, ce sont les préparatifs qui permettent d’aller vite pendant le service.'),
    cu('Vocabulaire', 'facile', 'Comment appelle-t-on le responsable d’une brigade de cuisine ?', 'Le chef de cuisine', ['Le sommelier', 'Le plongeur', 'Le maître d’hôtel'], 'Le chef de cuisine dirige l’équipe en cuisine et compose la carte.'),
    cu('Vocabulaire', 'facile', 'Quel professionnel du restaurant conseille sur les vins ?', 'Le sommelier', ['Le pâtissier', 'Le plongeur', 'Le boucher'], 'Le sommelier choisit les vins de la cave et conseille les clients.'),
    cu('Techniques', 'moyen', 'Que fait-on quand on « déglace » une poêle ?', 'On verse un liquide pour décoller les sucs de cuisson', ['On la plonge dans l’eau glacée', 'On la met au congélateur', 'On la recouvre de papier'], 'Le liquide (vin, bouillon…) décolle les sucs, très savoureux, au fond de la poêle.'),
    cu('Techniques', 'moyen', 'Que signifie « blanchir » des légumes ?', 'Les plonger brièvement dans l’eau bouillante', ['Les passer à l’eau de Javel', 'Les peler à vif', 'Les saupoudrer de farine'], 'Le blanchiment, suivi d’un bain d’eau froide, fixe la couleur et le croquant des légumes.'),
    cu('Techniques', 'moyen', 'Quel ingrédient lie l’huile dans une mayonnaise ?', 'Le jaune d’œuf', ['Le sucre', 'La farine', 'Le lait'], 'Le jaune d’œuf émulsionne l’huile pour donner une sauce onctueuse.'),
    cu('Saveurs', 'moyen', 'Combien de saveurs de base distingue-t-on généralement ?', 'Cinq', ['Deux', 'Trois', 'Neuf'], 'Sucré, salé, acide, amer et umami.'),
    cu('Produits', 'facile', 'Quel fromage crémeux entre dans la recette du tiramisu ?', 'Le mascarpone', ['Le roquefort', 'Le comté', 'Le camembert'], 'Le mascarpone est un fromage frais italien, base crémeuse du tiramisu.'),
    cu('Produits', 'moyen', 'Où récolte-t-on la fleur de sel ?', 'À la surface des marais salants', ['Dans des mines profondes', 'Au sommet des montagnes', 'Dans les forêts'], 'La fleur de sel est le fin cristal qui se forme à la surface de l’eau des marais salants.'),
    cu('Produits', 'facile', 'La truffe est…', 'Un champignon qui pousse sous terre', ['Un fruit d’arbre', 'Un légume-racine', 'Une algue'], 'La truffe est un champignon souterrain, recherché pour son parfum.'),
    cu('Patrimoine', 'difficile', 'En quelle année « le repas gastronomique des Français » a-t-il été inscrit à l’UNESCO ?', '2010', ['1994', '2002', '2016'], 'En 2010, le repas gastronomique des Français a été inscrit au patrimoine culturel immatériel de l’humanité.'),
  ],
}

export const BANQUES_RESTAURATION_QUIZ: BanqueModele[] = [QUIZ_PIZZA, QUIZ_CUISSONS, QUIZ_ORIGINES, QUIZ_SAISONS, QUIZ_EVEIL, QUIZ_REGION, QUIZ_CULTURE]
