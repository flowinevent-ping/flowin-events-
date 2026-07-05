/*************************************************************
 *  BACKUP CRM FLOWIN  ->  Google Sheet
 *  Sauvegarde automatique, en 4 onglets, toutes les heures :
 *    - CRM_Backup    : joueurs NDS + participations (station / jour / heure)
 *    - Utilisateurs  : tous les utilisateurs (CRM complet)
 *    - Pros          : pros / prestataires suivis
 *    - Prestataires  : partenaires business
 *
 *  INSTALLATION / MISE À JOUR (une seule fois) :
 *   1. Google Sheet  ->  Extensions  ->  Apps Script.
 *   2. Efface tout, colle CE fichier, puis Enregistrer.
 *   3. Choisis la fonction  installerBackupAutomatique  et clique  Exécuter.
 *      (Autorisation Google demandée la 1re fois : accepte.)
 *   -> Les 4 onglets se remplissent et se rafraîchissent seuls chaque heure.
 *
 *  Sauvegarde immédiate à tout moment : exécuter  sauvegarderCRM.
 *************************************************************/

// ====== PARAMÈTRES (déjà remplis — ne pas partager le JETON) ======
const SUPABASE_URL = 'https://ywcqtupgoxfzkddqkztk.supabase.co';
const CLE_PUBLIQUE = 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1';
const JETON_SECRET = 'ndsbkp_92cf257f349164f2c62ec526ed1934b7d702b5dc';

// [ fonction Supabase , nom de l'onglet ]
const EXPORTS = [
  ['nds_export_crm',            'CRM_Backup'],
  ['flowin_export_users',       'Utilisateurs'],
  ['flowin_export_pros',        'Pros'],
  ['flowin_export_partenaires', 'Prestataires']
];
// ==================================================================

function _lireRpc(nomFonction) {
  const res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/rpc/' + nomFonction, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'apikey': CLE_PUBLIQUE, 'Authorization': 'Bearer ' + CLE_PUBLIQUE },
    payload: JSON.stringify({ p_token: JETON_SECRET }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(nomFonction + ' -> ' + res.getResponseCode() + ' : ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

function _ecrireOnglet(nomOnglet, lignes) {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  let feuille = classeur.getSheetByName(nomOnglet) || classeur.insertSheet(nomOnglet);
  feuille.clearContents();
  if (!lignes || lignes.length === 0) {
    feuille.getRange(1, 1).setValue('Aucune donnée — ' + new Date());
    return;
  }
  const entetes = Object.keys(lignes[0]);
  const data = lignes.map(function (l) {
    return entetes.map(function (c) { return (l[c] === null || l[c] === undefined) ? '' : l[c]; });
  });
  feuille.getRange(1, 1, 1, entetes.length).setValues([entetes]).setFontWeight('bold');
  feuille.getRange(2, 1, data.length, entetes.length).setValues(data);
  feuille.setFrozenRows(1);
  feuille.getRange(1, entetes.length + 2)
         .setValue('Dernier backup : ' + Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm'));
}

function sauvegarderCRM() {
  EXPORTS.forEach(function (e) { _ecrireOnglet(e[1], _lireRpc(e[0])); });
}

function installerBackupAutomatique() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sauvegarderCRM') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sauvegarderCRM').timeBased().everyHours(1).create();
  sauvegarderCRM();
}
