-- station_sans_gps — Assurance Charvolin (fiche NDS secondaire) et SAFER.
-- Rien invente : Charvolin recopie les coordonnees de son event NDS principal
-- (ev-nds-charvolin, meme commerce, meme adresse physique) ; SAFER recopie
-- les coordonnees de la Caisse 1 (partenaires.adresse = "Vence — vers la
-- Caisse 1", deja geolocalisee). Nook Cafe reste sans GPS : aucune
-- coordonnee connue nulle part en base pour ce commerce (a fournir).

update events set lat = 43.7244152, lng = 7.1027993
where id = 'ev-fetes-du-haut-et-moyen-pays-vencois-charvolin-9kfw' and lat is null;

update events set lat = 43.722715, lng = 7.111389
where id = 'ev-nds-safer' and lat is null;
