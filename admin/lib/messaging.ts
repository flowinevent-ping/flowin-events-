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

/** Un lien Gmail par lot de destinataires (BCC), pour rester dans une
 *  longueur d URL raisonnable -- decoupe le tableau avant appel. */
export function lienGmailBcc(bccList: string[], objet: string, message: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(bccList.join(','))}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`
}

/** Un lien Gmail a UN destinataire (pas de BCC) -- permet de personnaliser le
 *  texte par personne (ex. prenom, lien de billet), impossible en BCC groupe. */
export function lienGmailTo(email: string, objet: string, message: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(objet)}&body=${encodeURIComponent(message)}`
}

export const TAILLE_LOT_EMAIL = 40

export function lotsEmail<T>(destinataires: T[], email: (d: T) => string): string[][] {
  const out: string[][] = []
  for (let i = 0; i < destinataires.length; i += TAILLE_LOT_EMAIL) {
    out.push(destinataires.slice(i, i + TAILLE_LOT_EMAIL).map(email))
  }
  return out
}
