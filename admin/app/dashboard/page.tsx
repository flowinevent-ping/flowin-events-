'use client'

/**
 * ACCUEIL — tableau de bord de reporting (maquette validee par Romain le
 * 26/10 : https://claude.ai/artifact/NLXLgEe1PTQANWCAygR44r).
 *
 * Remplace le kanban d events qui vivait ici (parti sur /dashboard/planning,
 * qui est lui-meme un kanban par statut, pas une liste d events a plat).
 * Accueil n est plus une vue d events : c est un
 * reporting (KPI + repartition joueurs) et des raccourcis vers les listes de
 * la sidebar -- « simplifier la vie, un visuel accessible, simple ».
 *
 * Donnees reelles uniquement : ville/genre/age_tranche existent bien sur
 * joueurs (lib/types.ts), genre est stocke 'H'/'F' (voir TombolaClient.tsx).
 * Le delta "+12% vs N-1" de la maquette etait un exemple fictif -- on n a pas
 * de moyen fiable de calculer un vrai delta, donc il n apparait pas ici.
 */
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/contexts/DashboardContext'
import { Ico } from '@/lib/proicons'
import AlerteLotsRetires from '@/components/dashboard/AlerteLotsRetires'

const COULEURS_VILLE = ['#2563EB', '#F59E0B', '#10B981', '#A855F7', '#BE123C']
const COULEUR_HOMME = '#2563EB'
const COULEUR_FEMME = '#DB2777'

type Part = { label: string; n: number }

/** Regroupe des valeurs texte (deja normalisees par l appelant), triees par
 *  frequence, les moins frequentes fusionnees dans "Autres" au-dela de max. */
function repartir(valeurs: (string | null)[], max = 5): { parts: Part[]; nonRenseigne: number } {
  const compte = new Map<string, number>()
  let nonRenseigne = 0
  valeurs.forEach(v => {
    const t = (v ?? '').trim()
    if (!t) { nonRenseigne++; return }
    compte.set(t, (compte.get(t) ?? 0) + 1)
  })
  const tries = Array.from(compte.entries()).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n)
  if (tries.length <= max) return { parts: tries, nonRenseigne }
  const tete = tries.slice(0, max - 1)
  const resteN = tries.slice(max - 1).reduce((s, p) => s + p.n, 0)
  return { parts: [...tete, { label: 'Autres', n: resteN }], nonRenseigne }
}

const CIRCONFERENCE = 2 * Math.PI * 15.9

/** Arcs d un donut en %, calcules a partir d un total (sans la part "non
 *  renseigne", exclue de la base pour ne pas fausser les pourcentages). */
function arcsDonut(parts: Part[]) {
  const total = parts.reduce((s, p) => s + p.n, 0)
  if (!total) return []
  let cumul = 0
  return parts.map(p => {
    const pct = (p.n / total) * 100
    const long = (pct / 100) * CIRCONFERENCE
    const arc = { pct, dasharray: `${long} ${CIRCONFERENCE - long}`, dashoffset: -(cumul / 100) * CIRCONFERENCE + CIRCONFERENCE * 0.25 }
    cumul += pct
    return arc
  })
}

function Donut({ titre, parts, nonRenseigne, couleurs }: { titre: string; parts: Part[]; nonRenseigne: number; couleurs: string[] }) {
  const arcs = arcsDonut(parts)
  const total = parts.reduce((s, p) => s + p.n, 0)
  return (
    <div className="sa-tile sa-donut-card">
      <h3>{titre}</h3>
      {total === 0 ? (
        <div className="sa-empty-inline">Pas encore de donnée.</div>
      ) : (
        <div className="sa-donut-row">
          <svg width="80" height="80" viewBox="0 0 42 42" role="img" aria-label={titre}>
            <circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--sa-border)" strokeWidth="5.2" />
            {arcs.map((a, i) => (
              <circle key={i} cx="21" cy="21" r="15.9" fill="none" stroke={couleurs[i % couleurs.length]} strokeWidth="5.2"
                strokeDasharray={a.dasharray} strokeDashoffset={a.dashoffset} transform="rotate(-90 21 21)" />
            ))}
          </svg>
          <div className="sa-legend">
            {parts.map((p, i) => (
              <div className="sa-leg-item" key={p.label}>
                <span className="sa-leg-dot" style={{ background: couleurs[i % couleurs.length] }} />
                <span className="sa-leg-lbl">{p.label}</span>
                <span className="sa-leg-val">{Math.round((p.n / total) * 100)} %</span>
              </div>
            ))}
            {nonRenseigne > 0 && (
              <div className="sa-leg-item"><span className="sa-leg-lbl" style={{ color: 'var(--sa-muted)', fontWeight: 500 }}>
                {nonRenseigne} joueur{nonRenseigne > 1 ? 's' : ''} sans cette info
              </span></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { joueurs, events, partenaires, pros, lots } = useDashboard()

  const estDemo = (e: { pro_id: string | null; nom: string }) => e.pro_id === null && e.nom.startsWith('Démo')
  const reels = useMemo(() => events.filter(e => !estDemo(e)), [events])

  const totalOptins = joueurs.filter(j => j.optin).length
  const totalGagnants = joueurs.filter(j => j.gains > 0).length
  const nbLive = reels.filter(e => e.status === 'live').length
  const nbUpcoming = reels.filter(e => e.status === 'upcoming').length
  const prosActifs = pros.filter(p => p.statut === 'valide').length
  const partenairesActifs = partenaires.filter(p => p.actif).length
  const sponsoring = partenaires.reduce((s, p) => s + (p.montant_sponsoring ?? 0), 0)
  const lotsUtilises = lots.filter(l => l.retire).length

  const kpis: { icone: string; val: string; lbl: string; sub: string; href: string }[] = [
    { icone: 'users', val: String(joueurs.length), lbl: 'Joueurs CRM', sub: `${totalOptins} opt-in · ${totalGagnants} gagnants`, href: '/dashboard/joueurs' },
    { icone: 'building', val: String(pros.length), lbl: 'Pros enregistrés', sub: `${prosActifs} validés`, href: '/dashboard/pros' },
    { icone: 'handshake', val: String(partenaires.length), lbl: 'Partenaires', sub: `${partenairesActifs} actifs`, href: '/dashboard/partenaires' },
    { icone: 'game', val: String(nbLive), lbl: 'Events en cours', sub: `${nbUpcoming} à venir`, href: '/dashboard/events' },
    { icone: 'chart', val: `${sponsoring.toLocaleString('fr-FR')} €`, lbl: 'Sponsoring généré', sub: `sur ${partenaires.length} partenaires`, href: '/dashboard/partenaires' },
    { icone: 'gift', val: `${lotsUtilises} / ${lots.length}`, lbl: 'Lots utilisés', sub: `${lots.length - lotsUtilises} encore disponibles`, href: '/dashboard/nds-lots' },
  ]

  const raccourcis: { icone: string; lbl: string; n: string; href: string }[] = [
    /* Pointait vers /dashboard/crm-pro (un picker : choisir un pro -> voir son
       seul CRM de joueurs). Romain (28/10) veut qu'un clic sur « CRM Pro »
       affiche directement la liste complete des pros (nom, contact, adresse,
       telephone, operations en cours) -- c'est deja /dashboard/pros, meme
       famille ListeCRM que Joueurs/Partenaires/Gagnants. Le CRM complet d'un
       pro choisi reste accessible via la sidebar (« CRM pro (toutes ses
       operations) ») et depuis la fiche d'un pro. */
    { icone: 'building', lbl: 'CRM Pro', n: `${pros.length} fiches`, href: '/dashboard/pros' },
    { icone: 'users', lbl: 'CRM Utilisateurs', n: `${joueurs.length} joueurs`, href: '/dashboard/joueurs' },
    { icone: 'game', lbl: 'Jeux', n: '7 modules', href: '/dashboard/jeux' },
    { icone: 'calendar', lbl: 'Events', n: `${reels.length} events`, href: '/dashboard/events' },
    { icone: 'star', lbl: 'Super Events', n: 'Opérations', href: '/dashboard/super-events' },
  ]

  const villes = useMemo(() => repartir(joueurs.map(j => j.ville), 5), [joueurs])
  const ages = useMemo(() => repartir(joueurs.map(j => j.age_tranche), 5), [joueurs])
  const genres = useMemo(() => {
    const h = joueurs.filter(j => j.genre === 'H').length
    const f = joueurs.filter(j => j.genre === 'F').length
    const autres = joueurs.length - h - f
    const parts: Part[] = []
    if (h) parts.push({ label: 'Homme', n: h })
    if (f) parts.push({ label: 'Femme', n: f })
    return { parts, nonRenseigne: autres }
  }, [joueurs])
  const couleursGenre = genres.parts.map(p => (p.label === 'Homme' ? COULEUR_HOMME : COULEUR_FEMME))

  return (
    <div className="sa-content">
      <AlerteLotsRetires />

      <div className="sa-kpi-rep-grid">
        {kpis.map(k => (
          <button key={k.lbl} className="sa-tile sa-kpi-rep" onClick={() => router.push(k.href)} title={`Ouvrir ${k.lbl}`}>
            <div className="sa-ico-badge"><Ico k={k.icone} size={30} /></div>
            <div className="sa-kpi-rep-txt">
              <div className="sa-kpi-rep-val">{k.val}</div>
              <div className="sa-kpi-rep-lbl">{k.lbl}</div>
              <div className="sa-kpi-rep-sub">{k.sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="sa-sec-h"><h2>Répartition des joueurs</h2></div>
      <div className="sa-donut-grid">
        <Donut titre="Par ville" parts={villes.parts} nonRenseigne={villes.nonRenseigne} couleurs={COULEURS_VILLE} />
        <Donut titre="Par sexe" parts={genres.parts} nonRenseigne={genres.nonRenseigne} couleurs={couleursGenre} />
        <Donut titre="Par tranche d'âge" parts={ages.parts} nonRenseigne={ages.nonRenseigne} couleurs={COULEURS_VILLE} />
      </div>

      <div className="sa-sec-h"><h2>Accès rapides</h2></div>
      <div className="sa-shortcut-grid">
        {raccourcis.map(r => (
          <button key={r.lbl} className="sa-tile sa-shortcut" onClick={() => router.push(r.href)} title={`Ouvrir ${r.lbl}`}>
            <div className="sa-ico-badge"><Ico k={r.icone} size={36} /></div>
            <div className="lbl">{r.lbl}</div>
            <div className="n">{r.n}</div>
            <div className="go">Ouvrir <Ico k="chevronRight" size={12} /></div>
          </button>
        ))}
      </div>
    </div>
  )
}
