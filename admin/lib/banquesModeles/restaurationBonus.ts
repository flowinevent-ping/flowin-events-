/**
 * Banques BONUS « restauration » : mini-sondages gamifies. Aucune bonne ni mauvaise reponse.
 * Format `banques.questions` : { id, type:'single'|'multi', label, options:[{val,label}], theme }.
 * Le retour « comme X % des joueurs » n est affiche que s il est calcule sur de vraies reponses
 * (voir pourcentageReel dans resoudre.ts) : aucun pourcentage n est ecrit ici.
 */
import { creerBonus, type BanqueModele } from './outils'

const gf = creerBonus('rb-gout')
const hb = creerBonus('rb-habitude')
const id = creerBonus('rb-idee')

export const BONUS_GOUTS: BanqueModele = {
  id: 'bq-modele-resto-sondage-gouts', nom: 'Restauration · Sondage : vos goûts', metiers: ['restaurateur', 'pizzeria'], genre: 'bonus', personnalisable: false,
  description: 'Pizza, dessert, boisson, piquant : huit questions pour mieux connaître les goûts de vos clients.',
  questions: [
    gf('Pizza', 'Ta pizza de rêve, tu la commences par…', ['Une base tomate', 'Une base crème', 'Beaucoup de fromage', 'Ce que le chef conseille']),
    gf('Pizza', 'Ananas sur la pizza : où te situes-tu ?', ['J’adore', 'Une fois pour voir', 'Jamais, sacrilège !', 'Peu importe']),
    gf('Pizza', 'Ta pâte idéale ?', ['Fine et croustillante', 'Épaisse et moelleuse', 'Avec de gros bords gonflés', 'Surprends-moi']),
    gf('Dessert', 'Fin de repas : ton réflexe sucré ?', ['Un dessert au chocolat', 'Un dessert fruité', 'Un café gourmand', 'Pas de dessert, merci']),
    gf('Boisson', 'Pour accompagner ton plat, tu choisis…', ['De l’eau', 'Une boisson fraîche', 'Un verre de vin ou une bière', 'Un café ou un thé']),
    gf('Goûts', 'Dans ton assiette, tu es plutôt…', ['Salé', 'Sucré', 'Épicé', 'Un peu de tout']),
    gf('Goûts', 'Le piquant, pour toi, c’est…', ['Jamais', 'Un petit peu', 'Bien relevé', 'Le plus fort possible']),
    gf('Goûts', 'Tu préfères commencer par…', ['Une entrée', 'Directement le plat', 'Le dessert, pourquoi pas !', 'Je partage tout']),
  ],
}

export const BONUS_HABITUDES: BanqueModele = {
  id: 'bq-modele-resto-sondage-habitudes', nom: 'Restauration · Sondage : vos habitudes', metiers: ['restaurateur', 'pizzeria'], genre: 'bonus', personnalisable: false,
  description: 'Fréquence, moment de la journée, compagnie, sur place ou à emporter, et « quel client êtes-vous ? ».',
  questions: [
    hb('Fréquence', 'À quelle fréquence manges-tu au restaurant ?', ['Chaque semaine', 'Quelques fois par mois', 'Quelques fois par an', 'Pour les grandes occasions']),
    hb('Moment', 'Ton moment préféré pour manger dehors ?', ['Déjeuner en semaine', 'Dîner en semaine', 'Le week-end à midi', 'Le week-end le soir']),
    hb('Compagnie', 'Avec qui viens-tu le plus souvent ?', ['En famille', 'Entre amis', 'En couple', 'Avec des collègues', 'Seul(e)']),
    hb('Habitudes', 'Tu réserves…', ['Toujours', 'Parfois', 'Jamais, je tente ma chance', 'Seulement pour les groupes']),
    hb('Habitudes', 'Plutôt sur place ou à emporter ?', ['Sur place', 'À emporter', 'En livraison', 'Un peu des trois']),
    hb('Habitudes', 'Terrasse ou salle ?', ['Terrasse dès qu’il fait beau', 'Salle', 'Peu importe, c’est la table qui compte']),
    hb('Profil', 'Et vous, quel client êtes-vous ?', ['L’explorateur : je teste toujours un nouveau plat', 'Le fidèle : toujours mon plat habituel', 'Le gourmand : je partage tout', 'Le pressé : le service rapide avant tout']),
    hb('Profil', 'Quand tu choisis ton plat, tu es plutôt…', ['Je lis toute la carte', 'Je demande conseil', 'Je prends le plat du jour', 'J’ai choisi avant d’arriver']),
    hb('Profil', 'Le plus important pour une bonne soirée ?', ['L’accueil', 'L’assiette', 'L’ambiance', 'Le rapport qualité-prix']),
  ],
}

export const BONUS_IDEES: BanqueModele = {
  id: 'bq-modele-resto-sondage-idees', nom: 'Restauration · Sondage : vos idées et votre avis', metiers: ['restaurateur', 'pizzeria'], genre: 'bonus', personnalisable: false,
  description: 'Idées de plats, animations, produits locaux, anti-gaspi et satisfaction.',
  questions: [
    id('Idées', 'Quelle idée de plat aimerais-tu voir à la carte ?', ['Un plat de saison', 'Un plat du terroir local', 'Un plat végétarien', 'Une création surprise du chef']),
    id('Idées', 'Et si on organisait un atelier ?', ['Un atelier pizza', 'Un atelier cuisine du marché', 'Une dégustation de produits locaux', 'Rien, juste bien manger']),
    id('Idées', 'Quelle animation te ferait venir ?', ['Une soirée musique', 'Une soirée à thème', 'Un menu à partager', 'Rien de spécial']),
    id('Idées', 'Pour limiter le gaspillage, tu serais partant pour…', ['Des portions à adapter', 'Emporter mes restes', 'Un plat anti-gaspi du jour', 'Je le fais déjà']),
    id('Idées', 'Les produits locaux, pour toi, c’est…', ['Un vrai critère de choix', 'Un plus apprécié', 'Je n’y fais pas attention']),
    id('Satisfaction', 'Comment as-tu trouvé l’accueil aujourd’hui ?', ['Au top', 'Bien', 'Moyen', 'À améliorer']),
    id('Satisfaction', 'Recommanderais-tu notre table à un ami ?', ['Sans hésiter', 'Probablement', 'Peut-être', 'Pas encore']),
    id('Satisfaction', 'Ta prochaine visite, ce sera…', ['Cette semaine', 'Ce mois-ci', 'Bientôt', 'Je ne sais pas encore']),
  ],
}

export const BANQUES_RESTAURATION_BONUS: BanqueModele[] = [BONUS_GOUTS, BONUS_HABITUDES, BONUS_IDEES]
