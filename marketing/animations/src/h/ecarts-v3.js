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
  },
  's3-v5': {
    9: {
      ecran: 'UNE GESTION SIMPLE, AVEC UN TÉLÉPHONE. · Tirage en un clic, billets et stock automatiques. Le gagnant revient, vous scannez.',
      pourquoi: 'Le tirage n’est pas automatique : il se lance d’un clic (« Lancer le tirage », components/pro/GagnantsClient.tsx). L’envoi du billet et le décompte du stock de lots, eux, sont automatiques. Texte écran ajusté en conséquence ; la voix off ne cite pas le tirage.'
    }
  }
}
