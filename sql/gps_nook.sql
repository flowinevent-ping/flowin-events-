-- station_sans_gps — Nook Cafe, dernier des 3. Coordonnees fournies par
-- Romain (lien Google Maps du lieu « Nook - Coffee Shop »), pas geocodees
-- ici (aucun acces reseau externe depuis ce sandbox). controle_incoherences()
-- station_sans_gps repasse a 0 (etait a 3 le 16-17/09).

update events set lat = 43.7216792, lng = 7.1116903 where id = 'ev-nds-nook' and lat is null;
