/**
 * GRILLE DE VIGNETTES D OPERATIONS (16/09 nuit) — vignettes rangees par
 * periode (En cours, A venir, Passees) puis par mois et annee ; habillage
 * planning compact .sa-kb-* depuis le 29/10.
 * Composant sans etat : utilisable par les pages serveur.
 */
import { Fragment } from 'react'
import Link from 'next/link'
import type { DonneesOperation } from '@/lib/operations'
import { libelleModule, libelleDates } from '@/lib/operations'
import type { GroupePeriode } from '@/lib/rangementOperations'
import { CHARTE_PRO as C, ACCENT_ANIM, ACCENT_SUPER } from '@/lib/charte'
import { Ico } from '@/lib/proicons'

export function chiffresOperation(op: DonneesOperation) {
  const parties = op.stations.reduce((n, s) => n + (s.participants ?? 0), 0)
  const remis = op.gagnants.filter(x => x.etat === 'retire').length
  const lots = op.lots.reduce((n, l) => n + (l.quantite || 0), 0)
  return { parties, lots, gagnants: op.gagnants.length, aRemettre: op.gagnants.length - remis }
}

/* Meme vignette que le planning SA (/dashboard/planning, super-events, events)
   et que l Historique pro : « meme design de planning partout, dans toutes les
   interfaces » (Romain, 29/10). Classes .sa-kb-* de styles/sa-kanban.css
   (chargee par ProShell). Pastille ronde : etoile orange = super event, ticket
   bleu = animation (code couleur du 18/09 conserve). Contenu inchange : nom,
   dates, module, compteurs parties / gagnants / a remettre, memes liens. */
export function Vignette({ op, href, liens }: { op: DonneesOperation; href: string; liens?: { label: string; href: string }[] }) {
  const k = chiffresOperation(op)
  const accent = op.type === 'super' ? ACCENT_SUPER : ACCENT_ANIM
  const sous = [op.type === 'super' ? 'Super event' : 'Animation', libelleModule(op.stations[0]?.module)]
  if (op.type === 'super') sous.push(op.stations.length > 1 ? `${op.stations.length} stations` : op.stations[0]?.nom ?? '')
  return (
    <div className="sa-kb-vignette" style={{ cursor: 'default' }}>
      <Link href={href} title={`Ouvrir ${op.nom}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div className="sa-kb-ligne">
          <span className="sa-kb-pastille" style={{ background: `${accent}20`, color: accent }}>
            <Ico k={op.type === 'super' ? 'star' : 'ticket'} size={14} />
          </span>
          <span className="sa-kb-nom">{op.nom}</span>
          {op.dateD && <span className="sa-kb-date">{libelleDates(op.dateD, op.dateF)}</span>}
        </div>
        <div className="sa-kb-sub">{sous.filter(Boolean).join(' · ')}</div>
        <div className="sa-kb-sub" style={{ marginTop: 3 }}>
          <b style={{ color: accent }}>{k.parties}</b> parties · <b style={{ color: accent }}>{k.gagnants}</b> gagnants · <b style={{ color: accent }}>{k.aRemettre}</b> à remettre
        </div>
      </Link>
      {liens && liens.length > 0 && (
        <div className="sa-kb-chips">
          {liens.map(l => (
            <Link key={l.label} href={l.href} className="sa-kb-chip">{l.label}</Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* Kanban par periode (En cours / A venir / Passees), mois et annee en
   sous-titre dans chaque colonne -- meme structure que /dashboard/planning. */
export default function GrilleOperations({ groupes, vignette }: {
  groupes: GroupePeriode<DonneesOperation>[]
  vignette: (op: DonneesOperation) => React.ReactNode
}) {
  return (
    <div className="sa-kanban">
      {groupes.map(g => (
        <section key={g.periode} className="sa-kb-col">
          <header className="sa-kb-tete">
            {g.periode === 'en_cours' && <span className="pastille" style={{ background: C.magenta }} />}
            <span className="t">{g.titre}</span>
            <span className="n">{g.n}</span>
          </header>
          <div className="sa-kb-corps">
            {g.mois.map(m => (
              <Fragment key={m.cle}>
                <div className="sa-kb-mois">{m.titre}</div>
                {m.ops.map(op => <div key={op.cle}>{vignette(op)}</div>)}
              </Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
