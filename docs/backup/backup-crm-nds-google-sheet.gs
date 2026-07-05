/*************************************************************
 *  BACKUP CRM — Nuits du Sud 2026  ->  Google Sheet
 *  Copie automatique des joueurs + participations (station / jour / heure)
 *  depuis Supabase vers cette feuille, toutes les heures.
 *
 *  INSTALLATION (une seule fois) :
 *   1. Ouvre un nouveau Google Sheet.
 *   2. Menu  Extensions  ->  Apps Script.
 *   3. Efface le contenu, colle TOUT ce fichier, puis  Enregistrer.
 *   4. En haut, choisis la fonction  installerBackupAutomatique  et clique  Exécuter.
 *      (Google demandera une autorisation la 1re fois : accepte.)
 *   -> À partir de là, la feuille "CRM_Backup" se met à jour toute seule chaque heure.
 *
 *  Pour forcer une sauvegarde immédiate : choisis  sauvegarderCRM  et clique  Exécuter.
 *************************************************************/

// ====== PARAMÈTRES (déjà remplis, ne pas partager le JETON) ======
const SUPABASE_URL  = 'https://ywcqtupgoxfzkddqkztk.supabase.co';
const CLE_PUBLIQUE  = 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1';
const JETON_SECRET  = 'ndsbkp_92cf257f349164f2c62ec526ed1934b7d702b5dc';
const NOM_FEUILLE   = 'CRM_Backup';
// =================================================================

function sauvegarderCRM() {
  const url = SUPABASE_URL + '/rest/v1/rpc/nds_export_crm';
  const reponse = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'apikey': CLE_PUBLIQUE, 'Authorization': 'Bearer ' + CLE_PUBLIQUE },
    payload: JSON.stringify({ p_token: JETON_SECRET }),
    muteHttpExceptions: true
  });

  if (reponse.getResponseCode() !== 200) {
    throw new Error('Erreur Supabase ' + reponse.getResponseCode() + ' : ' + reponse.getContentText());
  }

  const lignes = JSON.parse(reponse.getContentText());
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  let feuille = classeur.getSheetByName(NOM_FEUILLE);
  if (!feuille) feuille = classeur.insertSheet(NOM_FEUILLE);

  feuille.clearContents();

  if (!lignes || lignes.length === 0) {
    feuille.getRange(1, 1).setValue('Aucune donnée pour le moment — ' + new Date());
    return;
  }

  const entetes = Object.keys(lignes[0]);
  const data = lignes.map(function (l) {
    return entetes.map(function (c) { return (l[c] === null || l[c] === undefined) ? '' : l[c]; });
  });

  feuille.getRange(1, 1, 1, entetes.length).setValues([entetes]);
  feuille.getRange(2, 1, data.length, entetes.length).setValues(data);
  feuille.getRange(1, 1, 1, entetes.length).setFontWeight('bold');
  feuille.setFrozenRows(1);

  // Horodatage du dernier backup, dans une colonne à droite des entêtes
  feuille.getRange(1, entetes.length + 2)
         .setValue('Dernier backup : ' + Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm'));
}

function installerBackupAutomatique() {
  // Retire les anciens déclencheurs de sauvegarderCRM pour éviter les doublons
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sauvegarderCRM') ScriptApp.deleteTrigger(t);
  });
  // Nouveau déclencheur : toutes les heures
  ScriptApp.newTrigger('sauvegarderCRM').timeBased().everyHours(1).create();
  // Et une première sauvegarde tout de suite
  sauvegarderCRM();
}
