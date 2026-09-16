'use client'

/**
 * Partenaires — gabarit unique des listes (ListeCRM, famille H) et filtre
 * `?se=` (lib/filtreSuperEvent.ts) : depuis la carte d un super event, seuls
 * ses commerces s affichent.
 *
 * Rattachement a l operation : la fiche partenaire porte `super_event_id`, OU
 * son compte pro tient une station dans l operation. Les deux sont acceptes :
 * 7 pros sur 16 n ont pas de fiche partenaire, et une fiche peut exister sans
 * compte pro.
 */
import { Suspense, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import ListeCRM, { type ColonneCRM } from '@/components/dashboard/ListeCRM'
import type { FlowinPartenaire } from '@/lib/types'
import { useFiltreSuperEvent } from '@/lib/filtreSuperEvent'
import { BandeauFiltreSE } from '@/components/dashboard/BandeauFiltreSE'

type P = FlowinPartenaire & { super_event_id?: string | null; secteur?: string | null }

function PartenairesContenu() {
  const { partenaires, pros, openDrawer, openDrawerEdit } = useDashboard()
  const { seId, proIds } = useFiltreSuperEvent()

  const lignes = useMemo(() => {
    const l = partenaires as P[]
    if (!seId) return l
    const ptDesPros = new Set(pros.filter(p => proIds?.has(p.id)).map(p => p.partenaire_id).filter(Boolean) as string[])
    return l.filter(p => p.super_event_id === seId || ptDesPros.has(p.id))
  }, [partenaires, pros, seId, proIds])

  const colonnes: ColonneCRM<P>[] = [
    {
      id: 'nom', label: 'Partenaire', valeur: p => p.nom, largeur: 240,
      rendu: p => <span><span style={{ marginRight: 6 }}>{p.emoji ?? '🤝'}</span><b>{p.nom || '—'}</b></span>,
    },
    {
      id: 'type', label: 'Catégorie', valeur: p => p.type, largeur: 110,
      rendu: p => p.type ? <span className={`sa-chip${p.type === 'National' ? ' purple' : ''}`}>{p.type}</span> : '—',
    },
    { id: 'ville', label: 'Ville', valeur: p => p.ville, largeur: 130 },
    { id: 'tel', label: 'Téléphone', valeur: p => p.tel, largeur: 130 },
    { id: 'email', label: 'Email', valeur: p => p.email, largeur: 220 },
    {
      id: 'pro', label: 'Compte pro', valeur: p => (pros.find(x => x.partenaire_id === p.id) ? 'oui' : 'non'), largeur: 100, aligne: 'centre',
      rendu: p => (pros.find(x => x.partenaire_id === p.id) ? <span className="sa-chip live">✓</span> : <span className="sa-chip">—</span>),
    },
    {
      id: 'actions', label: '', valeur: () => '', horsRecherche: true, nonTriable: true, largeur: 60, aligne: 'droite',
      rendu: p => (
        <button className="sa-btn icon sm" title="Éditer" onClick={e => { e.stopPropagation(); openDrawerEdit('partenaire', p.id) }}>✏</button>
      ),
    },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <ListeCRM<P>
          titre="🤝 Partenaires"
          lignes={lignes}
          colonnes={colonnes}
          cle={p => p.id}
          onLigne={p => openDrawer('partenaire', p.id)}
          triDefaut="nom"
          placeholderRecherche="Rechercher un partenaire, une ville…"
          entete={seId ? <BandeauFiltreSE seId={seId} quoi="Partenaires" retour="/dashboard/partenaires" /> : undefined}
        />
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartenairesContenu />
    </Suspense>
  )
}
