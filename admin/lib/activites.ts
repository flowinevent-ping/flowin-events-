/**
 * TYPOLOGIES DE COMMERCES ET D'ACTIVITES — UNE SEULE SOURCE (03/11/2026).
 *
 * Liste structuree par familles, inspiree de la nomenclature NAF du commerce de detail, de l'artisanat, de la restauration, des
 * services de proximite, du tourisme et du bien-etre. Partout ou un selecteur de secteur / categorie existe, il lit cette liste.
 * Le libelle est la valeur enregistree (aucune colonne nouvelle).
 *
 * « Autre » : le pro precise son activite (lib/proCreation : tag `secteur-autre:<precision>` ou categorie « Autre : <precision> »).
 * Ces precisions servent a ENRICHIR cette liste : le Super Admin voit le recapitulatif « Autres activites saisies » (valeur, nombre,
 * page Pros) et les promeut ici, dans la famille qui convient.
 */
export interface FamilleActivites { famille: string; activites: string[] }

export const FAMILLES_ACTIVITES: FamilleActivites[] = [
  { famille: 'Alimentation et métiers de bouche', activites: ['Boulangerie', 'Pâtisserie', 'Boucherie · Charcuterie', 'Poissonnerie', 'Fromagerie · Crèmerie', 'Primeur · Fruits et légumes', 'Épicerie fine', 'Épicerie · Supérette', 'Chocolaterie · Confiserie', 'Glacier', 'Caviste · Cave à vins', 'Torréfacteur · Thé et café', 'Produits du terroir · Producteur local'] },
  { famille: 'Restauration et bars', activites: ['Restaurant', 'Brasserie · Bistrot', 'Pizzeria', 'Restauration rapide · Snack', 'Bar · Café', 'Bar à vins · Brasserie artisanale', 'Salon de thé', 'Traiteur'] },
  { famille: 'Beauté, bien-être et santé', activites: ['Coiffeur', 'Barbier', 'Institut de beauté', 'Onglerie', 'Spa · Massage · Bien-être', 'Pharmacie · Parapharmacie', 'Opticien', 'Audioprothésiste', 'Salle de sport · Coaching', 'Yoga · Pilates · Danse'] },
  { famille: 'Mode et accessoires', activites: ['Vêtements femme', 'Vêtements homme', 'Vêtements enfant', 'Chaussures · Maroquinerie', 'Bijouterie · Horlogerie', 'Lingerie', 'Mercerie · Retouches · Couture', 'Friperie · Dépôt-vente'] },
  { famille: 'Maison, déco et jardin', activites: ['Décoration · Art de la table', 'Meubles · Literie', 'Bricolage · Quincaillerie', 'Jardinerie · Pépiniériste', 'Fleuriste', 'Électroménager · Hi-fi', 'Artisan d’art · Poterie · Céramique'] },
  { famille: 'Culture, loisirs et cadeaux', activites: ['Librairie', 'Papeterie · Presse', 'Jeux · Jouets', 'Cadeaux · Souvenirs', 'Magasin de sport', 'Location de vélos', 'Instruments de musique', 'Disquaire · Jeux vidéo', 'Photographe', 'Animalerie · Toilettage'] },
  { famille: 'Auto, moto et mobilité', activites: ['Garage · Mécanique', 'Carrosserie', 'Concessionnaire auto · moto', 'Auto-école', 'Station de lavage', 'Vélos · Trottinettes', 'Location de véhicules'] },
  { famille: 'Tourisme et hébergement', activites: ['Hôtel', 'Chambre d’hôtes · Gîte', 'Camping', 'Office de tourisme', 'Visites · Activités de loisirs', 'Agence de voyages'] },
  { famille: 'Services de proximité et professions', activites: ['Pressing · Blanchisserie', 'Cordonnerie · Clés', 'Banque · Assurance', 'Immobilier', 'Agence d’intérim · Services aux entreprises', 'Imprimerie · Reprographie', 'Téléphonie · Informatique', 'Artisan du bâtiment', 'Coworking · Formation'] },
]

export const ACTIVITE_AUTRE = 'Autre'
export const TOUTES_ACTIVITES: string[] = FAMILLES_ACTIVITES.reduce<string[]>((acc, f) => acc.concat(f.activites), [])
export const estActiviteConnue = (v: string | null | undefined): boolean => !!v && (v === ACTIVITE_AUTRE || TOUTES_ACTIVITES.indexOf(v) >= 0)
/** Ancien jeu de categories du parcours « rejoindre » : toujours accepte (donnees deja enregistrees). */
export const ANCIENNES_CATEGORIES = ['Boulangerie', 'Restaurant', 'Bar · Café', 'Caviste', 'Fleuriste', 'Librairie', 'Épicerie fine', 'Mode', 'Beauté · Coiffure', 'Décoration']
