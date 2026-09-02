'use client'

/**
 * Gagnants — lisait auparavant joueurs.gains (colonne jamais alimentee par le
 * vrai systeme de tirage, d'ou le "0 resultat" constate en prod). Les vrais
 * gagnants vivent dans la table tirages (billet + QR + retrait_token), la
 * meme que lisent lot.html, valider_lot et billets-partenaires.html.
 *
 * MAJ 25/08 -- Romain signale : le statut brut actif/retire masquait l'info
 * utile (un gagnant "actif" peut etre soit jamais appele, soit confirme et
 * juste pas encore retire -- deux situations tres differentes en pratique).
 * Reprend le meme etat a 3 valeurs deja utilise partout ailleurs
 * (a_confirmer / confirme / retire, voir partenaire_gagnants() RPC).
 * Ajoute aussi la colonne + le filtre Pro (partenaire), absents jusqu'ici --
 * impossible jusque la de savoir a quel commerce un gagnant appartenait
 * depuis cette liste.
 *
 * MAJ 02/09 -- Romain : « le format liste CRM liste des gagnants est le bon
 * format, fais la meme chose partout ». Cette page etait donc le modele, mais
 * elle portait sa propre copie du tri, du filtre et de la recherche. Elle passe
 * sur <ListeCRM>, le composant extrait D ELLE : le rendu ne change pas, mais il
 * n existe plus qu UN seul code de liste dans le dashboard, et cette page
 * herite au passage du rangement « categorie et sous-categorie » demande —
 * super event, puis pro.
 */
import { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import ListeCRM, { type ColonneCRM } from '@/components/dashboard/ListeCRM'
import { fetchGagnants, type GagnantRow } from '@/lib/dashboard'
import { fetchSuperEvents, type SuperEvent } from '@/lib/nds'

type Etat = 'a_confirmer' | 'confirme' | 'retire'
const LIB_ETAT: Record<Etat, string> = { a_confirmer: 'En attente', confirme: 'Confirmé', retire: 'Utilisé' }

const euros = (n: number | null) => (n == null ? '—' : `${n} €`)
const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')
const dateHeureFr = (s: string | null) => (s ? new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')

function etatDe(t: GagnantRow): Etat {
  if (t.retire_at) return 'retire'
  if (t.notifie_at) return 'confirme'
  return 'a_confirmer'
}

export default function Page() {
  const { openDrawer, partenaires } = useDashboard()
  const [list, setList] = useState<GagnantRow[] | null>(null)
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [pro, setPro] = useState('')

  useEffect(() => { fetchGagnants().then(setList) }, [])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  const nomPartenaire = (id: string | null) => partenaires.find(p => p.id === id)?.nom ?? (id ?? '—')
  const nomSuper = (id: string | null) => supers.find(s => s.id === id)?.nom ?? (id ?? '(hors super event)')

  const partenairesAvecGagnant = useMemo(() => {
    if (!list) return []
    // ES5 : pas de spread sur Set.
    const ids = list.map(t => t.partenaire_id)
      .filter((x): x is string => !!x)
      .filter((v, i, a) => a.indexOf(v) === i)
    return ids.map(id => ({ id, label: nomPartenaire(id) })).sort((a, b) => a.label.localeCompare(b.label, 'fr'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, partenaires])

  const visibles = useMemo(
    () => (list === null ? null : (pro ? list.filter(t => t.partenaire_id === pro) : list)),
    [list, pro])

  const colonnes: ColonneCRM<GagnantRow>[] = [
    {
      id: 'joueur_nom', label: 'Joueur', valeur: t => t.joueur_nom ?? t.joueur_email,
      rendu: t => (
        <>
          <div style={{ fontWeight: 700 }}>{t.joueur_nom ?? '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{t.joueur_email ?? '—'}</div>
        </>
      ),
    },
    { id: 'pro', label: 'Pro', valeur: t => nomPartenaire(t.partenaire_id), style: { fontSize: 12.5 } },
    { id: 'lot_nom', label: 'Lot', valeur: t => t.lot_nom },
    { id: 'lot_valeur', label: 'Valeur', valeur: t => t.lot_valeur, rendu: t => euros(t.lot_valeur) },
    {
      id: 'ticket_code', label: 'Ticket', valeur: t => t.ticket_code,
      rendu: t => (t.ticket_code ? <code className="sa-code">{t.ticket_code}</code> : '—'),
    },
    {
      id: 'etat', label: 'Statut', valeur: t => etatDe(t),
      rendu: t => {
        const etat = etatDe(t)
        return (
          <>
            <span className="sa-chip" style={{
              fontSize: 10, fontWeight: 700,
              color: etat === 'retire' ? 'var(--sa-muted)' : etat === 'confirme' ? '#2f7d4f' : '#b4791f',
              borderColor: etat === 'retire' ? 'var(--sa-border)' : etat === 'confirme' ? '#2f7d4f' : '#b4791f',
            }}>
              {LIB_ETAT[etat]}
            </span>
            {etat === 'confirme' && t.notifie_at && <div style={{ fontSize: 10, color: 'var(--sa-muted)', marginTop: 2 }}>Notifié le {dateFr(t.notifie_at)}</div>}
            {etat === 'retire' && t.retire_at && <div style={{ fontSize: 10, color: 'var(--sa-muted)', marginTop: 2 }}>Le {dateHeureFr(t.retire_at)}</div>}
          </>
        )
      },
    },
    {
      id: 'created_at', label: 'Tiré le', valeur: t => t.created_at, horsRecherche: true,
      rendu: t => <span style={{ fontSize: 12.5 }}>{dateFr(t.created_at)}</span>,
    },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <ListeCRM<GagnantRow>
          titre="🏆 Gagnants"
          lignes={visibles}
          colonnes={colonnes}
          cle={t => t.id}
          onLigne={t => { if (t.joueur_id) openDrawer('joueur', t.joueur_id) }}
          triDefaut="created_at"
          triDescendant
          placeholderRecherche="Rechercher un joueur, un lot, un ticket…"
          filtres={[
            { id: 'tous', label: 'Tous' },
            { id: 'a_confirmer', label: 'En attente', test: t => etatDe(t) === 'a_confirmer' },
            { id: 'confirme', label: 'Confirmés', test: t => etatDe(t) === 'confirme' },
            { id: 'retire', label: 'Utilisés', test: t => etatDe(t) === 'retire' },
          ]}
          selecteurs={[{
            id: 'pro', libelleTout: 'Tous les pros',
            options: partenairesAvecGagnant, valeur: pro, onChange: setPro,
          }]}
          categorie={t => ({ id: t.super_event_id ?? '_hors', label: nomSuper(t.super_event_id) })}
          sousCategorie={t => ({ id: t.partenaire_id ?? '_sans', label: nomPartenaire(t.partenaire_id) })}
          legende={
            <>
              <b>En attente</b> = jamais appelé · <b>Confirmé</b> = appelé, lot pas encore
              récupéré · <b>Utilisé</b> = billet scanné et lot remis en boutique
            </>
          }
        />
      </div>
    </div>
  )
}
