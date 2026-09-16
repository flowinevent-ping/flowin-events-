'use client'

/**
 * Pros — dans le gabarit unique des listes (ListeCRM, famille H).
 * Le tableau etait code a la main : largeurs, troncature et tri propres a la
 * page, differents de Partenaires, Joueurs et Gagnants.
 */
import { Suspense, useMemo, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import ListeCRM, { type ColonneCRM } from '@/components/dashboard/ListeCRM'
import { upsertPro } from '@/lib/dashboard'
import type { FlowinPro } from '@/lib/types'
import { useFiltreSuperEvent } from '@/lib/filtreSuperEvent'
import { BandeauFiltreSE } from '@/components/dashboard/BandeauFiltreSE'

const STATUT_STYLE: Record<string, { bg: string; c: string; label: string }> = {
  en_attente: { bg: '#FEF3C7', c: '#92400E', label: 'En attente' },
  valide: { bg: '#DCFCE7', c: '#166534', label: 'Validé' },
  refuse: { bg: '#FEE2E2', c: '#991B1B', label: 'Refusé' },
}

function ProsContenu() {
  const { pros, setPros, events, openDrawer, openDrawerEdit } = useDashboard()
  const [enCours, setEnCours] = useState<string | null>(null)

  /* Depuis la carte d un super event, on n affiche que les pros qui y tiennent
     une station. Sans ?se=, la page reste la vue d ensemble. */
  const { seId, proIds } = useFiltreSuperEvent()
  const lignes = proIds ? pros.filter((p: FlowinPro) => proIds.has(p.id)) : pros
  const nbEnAttente = lignes.filter((p: FlowinPro) => p.statut === 'en_attente').length
  const nbStations = (id: string) => events.filter(e => e.pro_id === id).length

  async function traiter(id: string, statut: 'valide' | 'refuse') {
    setEnCours(id)
    const ok = await upsertPro({ id, statut })
    if (ok) setPros(pros.map((p: FlowinPro) => p.id === id ? { ...p, statut } : p))
    setEnCours(null)
  }

  const colonnes = useMemo<ColonneCRM<FlowinPro>[]>(() => [
    { id: 'nom', label: 'Pro', valeur: p => p.nom, rendu: p => <b>{p.nom || '—'}</b>, largeur: 240 },
    { id: 'ville', label: 'Ville', valeur: p => p.ville, largeur: 130 },
    { id: 'secteur', label: 'Secteur', valeur: p => p.secteur, largeur: 160 },
    { id: 'contact', label: 'Contact', valeur: p => p.contact, largeur: 150 },
    { id: 'email', label: 'Email', valeur: p => p.email, largeur: 210 },
    { id: 'stations', label: 'Stations', valeur: p => nbStations(p.id), aligne: 'droite', largeur: 80, horsRecherche: true },
    {
      id: 'statut', label: 'Statut', valeur: p => STATUT_STYLE[p.statut ?? 'valide']?.label ?? p.statut, largeur: 110,
      rendu: p => {
        const st = STATUT_STYLE[p.statut ?? 'valide'] ?? STATUT_STYLE.valide
        return <span style={{ background: st.bg, color: st.c, fontSize: 11.5, fontWeight: 800, padding: '3px 9px', borderRadius: 99 }}>{st.label}</span>
      },
    },
    {
      id: 'actions', label: '', valeur: () => '', horsRecherche: true, nonTriable: true, largeur: 170, aligne: 'droite',
      rendu: p => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
          {p.statut === 'en_attente' && (
            <>
              <button className="sa-btn sm" disabled={enCours === p.id} onClick={() => traiter(p.id, 'valide')} style={{ background: '#166534', color: '#fff' }}>Valider</button>
              <button className="sa-btn sm" disabled={enCours === p.id} onClick={() => traiter(p.id, 'refuse')}>Refuser</button>
            </>
          )}
          <button className="sa-btn icon sm" title="Éditer" onClick={() => openDrawerEdit('pro', p.id)}>✏</button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [events, enCours, pros])

  return (
    <div className="sa-content">
      <div className="sa-page">
        <ListeCRM<FlowinPro>
          titre="🏢 Pros"
          sousTitre={`${lignes.length} pro${lignes.length > 1 ? 's' : ''}${nbEnAttente ? ` · ${nbEnAttente} en attente de validation` : ''}`}
          lignes={lignes}
          colonnes={colonnes}
          cle={p => p.id}
          onLigne={p => openDrawer('pro', p.id)}
          triDefaut="nom"
          placeholderRecherche="Rechercher un pro, une ville, un secteur…"
          filtres={[
            { id: 'tous', label: 'Tous' },
            { id: 'attente', label: `En attente${nbEnAttente ? ` (${nbEnAttente})` : ''}`, test: p => p.statut === 'en_attente' },
          ]}
          entete={seId ? <BandeauFiltreSE seId={seId} quoi="Pros" retour="/dashboard/pros" /> : undefined}
        />
      </div>
    </div>
  )
}

/* useSearchParams impose une frontiere Suspense au build (bailout CSR). */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProsContenu />
    </Suspense>
  )
}
