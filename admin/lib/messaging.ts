/**
 * Liens de messagerie pre-remplis (Gmail BCC, WhatsApp) -- meme mecanisme
 * partout dans l app (envoi-masse, diffusion, relance de gagnants) : jamais
 * d envoi serveur (pas de Resend), un lien que la personne ouvre puis
 * envoie elle-meme depuis son propre compte. Source unique pour ne pas
 * reimplementer la normalisation de numero a chaque endroit.
 */

/** Normalise un numero FR pour un lien wa.me (E.164 sans le "+") :
 *  "06 12 34 56 78" -> "33612345678". Best-effort, jamais bloquant : un
 *  numero deja international ou mal forme part tel quel. */
export function telWhatsApp(tel: string): string {
  const digits = tel.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits.slice(1)
  if (digits.startsWith('0')) return '33' + digits.slice(1)
  return digits
}

export function lienWhatsApp(tel: string, message: string): string {
  return `https://wa.me/${telWhatsApp(tel)}?text=${encodeURIComponent(message)}`
}

/** Romain (21/10) : « je crois qu'on n'envoie pas depuis la boîte
 *  flowinevent@gmail.com [...] il faut que ça parte de cette boîte ». Sans
 *  indication, Gmail compose avec le compte Google "actif" du navigateur, qui
 *  peut etre un autre compte que celui de Flowin -- `authuser` force Gmail a
 *  utiliser CE compte, s il est bien connecte dans le meme navigateur (ne
 *  connecte personne a sa place, bascule seulement parmi les comptes deja
 *  ouverts). Tout lien Gmail de l app doit le porter. */
const AUTHUSER_FLOWIN = 'authuser=flowinevent%40gmail.com'

/** Un lien Gmail par lot de destinataires (BCC), pour rester dans une
 *  longueur d URL raisonnable -- decoupe le tableau avant appel. */
export function lienGmailBcc(bccList: string[], objet: string, message: string): string {
  return `https://mail.google.com/mail/?${AUTHUSER_FLOWIN}&view=cm&fs=1&bcc=${encodeURIComponent(bccList.join(','))}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`
}

/** Un lien Gmail a UN destinataire (pas de BCC) -- permet de personnaliser le
 *  texte par personne (ex. prenom, lien de billet), impossible en BCC groupe.
 *  `cc` optionnel (Romain, 20/10 : « mettre en copie [...] pour l'envoi au pro
 *  des personnes qu'on a relancées ») -- le commerce voit directement, dans sa
 *  boite mail, chaque message reellement envoye a un gagnant. */
export function lienGmailTo(email: string, objet: string, message: string, cc?: string | null): string {
  const base = `https://mail.google.com/mail/?${AUTHUSER_FLOWIN}&view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`
  return cc ? `${base}&cc=${encodeURIComponent(cc)}` : base
}

/** Base d un lien Gmail compose, deja munie du bon compte -- pour les
 *  endroits qui construisent leur propre URL (to/su/body/bcc). */
export const GMAIL_COMPOSE_BASE = `https://mail.google.com/mail/?${AUTHUSER_FLOWIN}&view=cm&fs=1`

export const TAILLE_LOT_EMAIL = 40

export function lotsEmail<T>(destinataires: T[], email: (d: T) => string): string[][] {
  const out: string[][] = []
  for (let i = 0; i < destinataires.length; i += TAILLE_LOT_EMAIL) {
    out.push(destinataires.slice(i, i + TAILLE_LOT_EMAIL).map(email))
  }
  return out
}
