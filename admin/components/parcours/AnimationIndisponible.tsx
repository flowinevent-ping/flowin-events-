import { libelleDateFr, type MotifIndisponible } from '@/lib/etatAnimation'

/**
 * Message propre quand un QR mene a une animation qui n'existe pas, est terminee
 * ou n'a pas encore commence. Rendu serveur, sans script : il s'affiche meme sur
 * un vieux telephone, et ne propose aucun jeu (donc rien n'est ecrit).
 */
const TEXTES: Record<MotifIndisponible, { titre: string; texte: string }> = {
  inexistante: { titre: 'Cette animation n’existe pas', texte: 'Le lien ou le QR code que tu as ouvert ne correspond à aucune animation. Vérifie le QR code, ou demande-le au commerçant.' },
  terminee: { titre: 'Cette animation est terminée', texte: 'Merci d’avoir joué ! Cette animation n’est plus ouverte. Cherche le prochain QR code Flowin près de chez toi.' },
  avenir: { titre: 'Cette animation n’a pas encore commencé', texte: 'Reviens bientôt : le jeu s’ouvrira au début de l’animation.' },
}

export default function AnimationIndisponible({ motif, nom, debut }: { motif: MotifIndisponible; nom?: string | null; debut?: string | null }) {
  const t = TEXTES[motif]
  const quand = motif === 'avenir' && debut ? 'Début : ' + libelleDateFr(debut) + '.' : ''
  return (
    <div role="status" data-indisponible={motif} style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: '#F4F6F9', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color: '#1B3A5C', overflow: 'auto' }}>
      <div style={{ maxWidth: 380, width: '100%', background: '#fff', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 10px 30px rgba(27,58,92,.10)' }}>
        <div aria-hidden style={{ fontSize: 44, marginBottom: 8 }}>{motif === 'avenir' ? '⏳' : motif === 'terminee' ? '🏁' : '🔎'}</div>
        {nom ? <div style={{ fontSize: 13, fontWeight: 700, opacity: .65, marginBottom: 6 }}>{nom}</div> : null}
        <h1 style={{ fontSize: 22, lineHeight: 1.2, margin: '0 0 10px', fontWeight: 800 }}>{t.titre}</h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0, opacity: .8 }}>{t.texte}</p>
        {quand ? <p style={{ fontSize: 15, fontWeight: 700, margin: '12px 0 0' }}>{quand}</p> : null}
        <p style={{ fontSize: 12, margin: '22px 0 0', opacity: .55 }}>Jeu proposé avec Flowin</p>
      </div>
    </div>
  )
}
