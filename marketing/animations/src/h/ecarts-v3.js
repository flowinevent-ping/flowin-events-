/* Écarts volontaires avec les scénarios validés (films-v3.js), un par scène
   (index à partir de 0). Seule raison admise : la véracité (ce que fait
   réellement l'application). Repris dans les pages, les .srt et les .txt. */
window.ECARTS = {
  s3: {
    7: {
      ecran: 'DIMANCHE. TIRAGE EN UN CLIC. · Le billet part tout seul.',
      vo: 'Dimanche : le tirage se fait en un clic, et le billet part tout seul chez le gagnant.',
      pourquoi: 'Il n’existe pas de tirage automatique programmé : le commerçant clique « Lancer le tirage » puis « Confirmer et envoyer le billet » (components/pro/GagnantsClient.tsx) ; c’est l’envoi du billet qui est automatique. « Liste des gagnants diffusée » retiré : l’app n’a pas de diffusion automatique de la liste (les gagnants sont annoncés par l’organisateur sur ses réseaux).'
    },
    10: {
      pourquoi: 'Pas de bouton nommé « Relancer » : l’écran CRM réel filtre « Opt-in seulement », sélectionne les contacts et propose « Envoyer un email » (components/pro/CrmPro.tsx). C’est ce qui est montré ; la voix off « en un clic » reste vraie.'
    }
  }
}
