-- Rattachement du compte flowinevent@gmail.com a une fiche pro, pour les essais.
-- Applique le 04/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
--
-- Constat : le compte auth existe depuis le 05/07
-- (5d16448c-4c2d-448c-8272-6ae78c4f315c, email confirme), mais aucune ligne de
-- `pros` ne portait son auth_id. La connexion aboutissait donc sur
-- « Compte connecte mais aucun profil pro associe ».
--
-- On rattache plutot que de suspendre le controle d acces : suspendre ferait
-- essayer un parcours qui ne serait pas celui de la production, et il faudrait
-- ensuite se souvenir de le retablir.
--
-- Aucune contrainte d unicite sur pros.auth_id, mais le code fait
-- `.eq('auth_id', ...).maybeSingle()` : UN SEUL pro a la fois. Pour essayer sous
-- une autre enseigne, liberer d abord puis rattacher :
--
--   update pros set auth_id = null where auth_id = '5d16448c-4c2d-448c-8272-6ae78c4f315c';
--   update pros set auth_id = '5d16448c-4c2d-448c-8272-6ae78c4f315c' where id = 'pro-nook';
--
-- A RETIRER quand Assurance Charvolin aura son propre compte : cette ligne
-- donne l espace pro de Charvolin au compte flowinevent@gmail.com.

update pros
   set auth_id = '5d16448c-4c2d-448c-8272-6ae78c4f315c'
 where id = 'pro-charvolin';
