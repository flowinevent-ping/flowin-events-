/**
 * BANDEAU D ETAPES — referentiel 47/48 : UN seul composant pour tous les
 * parcours de creation (SA et pro) : creer un event, rejoindre un super
 * event, creer un super event.
 * Styles en ligne : il s affiche a l identique dans le dashboard SA et dans
 * l espace pro, qui ne charge pas le CSS du dashboard.
 * Teintes (convention etablie) : violet = event, orange = super event,
 * bleu = pro.
 */
export type TeinteEtapes = 'event' | 'super' | 'pro'

export const COULEURS_ETAPES: Record<TeinteEtapes, [string, string]> = {
  event: ['#9B45B4', '#7C2D92'],
  super: ['#FF8A14', '#C2410C'],
  pro: ['#3B7DE0', '#2746A6'],
}

export default function BandeauEtapes({ titre, i, total, teinte = 'event' }: {
  /** Ce qu on cree, ex. « Créer un super event ». Affiche en capitales. */
  titre: string
  /** Etape en cours, base 0. */
  i: number
  total: number
  teinte?: TeinteEtapes
}) {
  const [c1, c2] = COULEURS_ETAPES[teinte]
  return (
    <div style={{ borderRadius: 18, padding: '18px 20px', color: '#fff', marginBottom: 18, background: `linear-gradient(135deg,${c1},${c2})` }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', opacity: 0.9, textTransform: 'uppercase' }}>{titre}</div>
      <div style={{ fontSize: 20, fontWeight: 900, margin: '4px 0 2px' }}>Étape {i + 1} sur {total}</div>
      <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
        {Array.from({ length: total }).map((_, n) => (
          <span key={n} style={{ flex: 1, height: 5, borderRadius: 99, background: n <= i ? '#fff' : 'rgba(255,255,255,.3)' }} />
        ))}
      </div>
    </div>
  )
}
