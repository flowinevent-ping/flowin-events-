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
import { usePorteeInitiale } from '@/lib/portee'
import { useMailGagnant } from '@/lib/mailGagnant'
import { etatTirage, LIBELLE_ETAT_TIRAGE, marquerRelance, type EtatTirage } from '@/lib/operations'
import ModalRelanceGlobale from '@/components/dashboard/ModalRelanceGlobale'

type Etat = EtatTirage
const LIB_ETAT = LIBELLE_ETAT_TIRAGE

const euros = (n: number | null) => (n == null ? '—' : `${n} €`)
const dateFr = (s: string | null) => (s ? new Date(s).toLocaleDateString('fr-FR') : '—')
const dateHeureFr = (s: string | null) => (s ? new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')

/* Avant : ignorait le cas « event autonome » (gain immediat, non pilote par
   le SA) -- un tel gagnant restait affiche « En attente » indefiniment meme
   confirme d emblee. Delegue desormais a la meme source unique que partout
   ailleurs (lib/operations.ts), audit UX du 20/10. */
function etatDe(t: GagnantRow): Etat {
  return etatTirage(t)
}

export default function Page() {
  const { openDrawer, partenaires, events } = useDashboard()
  useMailGagnant()
  const [list, setList] = useState<GagnantRow[] | null>(null)
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [pro, setPro] = useState('')
  /* FILTRE ?se= (acces rapide « Gagnants » de la carte d un super event) :
     la page s ouvre cadree sur l operation, le selecteur reste maitre ensuite. */
  const [se, setSe] = useState('')
  const [relanceOuverte, setRelanceOuverte] = useState(false)
  /* Trace locale des relances envoyees DEPUIS cette page (bouton par ligne) --
     en plus de l ecrit en base (marquerRelance), pour refleter l etat tout de
     suite sans recharger `list`. */
  const [relancesSession, setRelancesSession] = useState<Record<string, true>>({})
  const portee = usePorteeInitiale()
  useEffect(() => { if (portee.se) setSe(portee.se) }, [portee.se])

  useEffect(() => { fetchGagnants().then(setList) }, [])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  const nomPartenaire = (id: string | null) => partenaires.find(p => p.id === id)?.nom ?? (id ?? '—')
  const nomEvent = (id: string | null) => events.find(e => e.id === id)?.nom ?? (id ?? '')
  /* REFERENTIEL 35 — rangement par OPERATION (super event, ou event autonome)
     puis par STATION. Il etait par super event puis par commerce : un tirage
     d event autonome tombait dans « hors super event », melange aux autres. */
  const operationDe = (t: GagnantRow) => t.super_event_id
    ? { id: t.super_event_id, label: supers.find(s => s.id === t.super_event_id)?.nom ?? t.super_event_id }
    : t.event_id
      ? { id: `ev:${t.event_id}`, label: nomEvent(t.event_id) }
      : { id: '_hors', label: 'Sans opération' }
  const stationDe = (t: GagnantRow) => t.event_id
    ? { id: t.event_id, label: nomEvent(t.event_id) }
    : { id: `pt:${t.partenaire_id ?? '_'}`, label: `Tirage de l’opération${t.partenaire_id ? ` — ${nomPartenaire(t.partenaire_id)}` : ''}` }

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
    () => (list === null ? null : list
      .filter(t => !pro || t.partenaire_id === pro)
      .filter(t => !se || t.super_event_id === se)),
    [list, pro, se])

  const colonnes: ColonneCRM<GagnantRow>[] = [
    {
      id: 'joueur_nom', label: 'Joueur', valeur: t => t.joueur_nom ?? t.joueur_email, multiligne: true,
      rendu: t => (
        <>
          <div style={{ fontWeight: 700 }}>{t.joueur_nom ?? '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{t.joueur_email ?? '—'}</div>
        </>
      ),
    },
    { id: 'station', label: 'Station', valeur: t => stationDe(t).label, style: { fontSize: 12.5 } },
    { id: 'pro', label: 'Commerce', valeur: t => nomPartenaire(t.partenaire_id), style: { fontSize: 12.5 } },
    { id: 'lot_nom', label: 'Lot', valeur: t => t.lot_nom },
    { id: 'lot_valeur', label: 'Valeur', valeur: t => t.lot_valeur, rendu: t => euros(t.lot_valeur) },
    {
      id: 'ticket_code', label: 'Ticket', valeur: t => t.ticket_code,
      rendu: t => (t.ticket_code ? <code className="sa-code">{t.ticket_code}</code> : '—'),
    },
    {
      id: 'etat', label: 'Statut', valeur: t => etatDe(t), multiligne: true,
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
    {
      /* Romain (19/09) : « module pour relancer les gagnants qui n'ont pas
         utilise leur ticket, dans la meme section que la liste ». Le bouton
         existait deja sur /dashboard/nds-lots (Stock des lots), mais pas ici
         -- or c'est ICI que Romain cherche, recherche et filtre un gagnant.
         Meme mecanique (flowinMailGagnant, type 'relance'), memes conditions :
         uniquement pour un lot confirme (donc deja notifie) et pas encore
         retire -- un gagnant "en attente" n'a pas encore ete appele, le
         relancer par email n'aurait pas de sens. */
      id: 'action', label: '', nonTriable: true, horsRecherche: true, aligne: 'centre', largeur: 110,
      valeur: () => '',
      rendu: t => {
        if (etatDe(t) !== 'confirme') return null
        const p = partenaires.find(x => x.id === t.partenaire_id)
        const relance = relancesSession[t.id] || t.relance_envoyee_at
        return (
          <button
            className="sa-btn sm"
            title={relance ? "Renvoyer un rappel par email" : "Rappeler par email que le lot confirmé n'a pas encore été retiré"}
            onClick={e => {
              e.stopPropagation()
              const url = window.flowinMailGagnant?.gmailUrl({
                joueur_nom: t.joueur_nom, email: t.joueur_email, lot_nom: t.lot_nom,
                ticket_code: t.ticket_code, retrait_token: t.retrait_token,
                partenaire_nom: p?.nom, partenaire_adresse: p?.adresse, partenaire_tel: p?.tel,
                type: 'relance',
              })
              if (url) window.open(url, '_blank', 'noopener')
              marquerRelance(Number(t.id))
              setRelancesSession(r => ({ ...r, [t.id]: true }))
            }}
          >
            🔔 {relance ? 'Relancer à nouveau' : 'Relancer'}
          </button>
        )
      },
    },
  ]

  const aRelancer = (visibles ?? []).filter(t => etatDe(t) === 'confirme')

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
          actions={
            <button className="sa-btn sm primary" disabled={aRelancer.length === 0} onClick={() => setRelanceOuverte(true)}>
              🔔 Relancer (lot pas récupéré){aRelancer.length > 0 ? ` (${aRelancer.length})` : ''}
            </button>
          }
          filtres={[
            { id: 'tous', label: 'Tous' },
            { id: 'a_confirmer', label: 'En attente', test: t => etatDe(t) === 'a_confirmer' },
            { id: 'confirme', label: 'Confirmés', test: t => etatDe(t) === 'confirme' },
            /* Romain (21/10) : « il manque la sélection de ceux que l'on veut
               voir, qui sont ceux qui sont relancés ou à relancer » -- deux
               sous-filtres du groupe Confirmés, bases sur relance_envoyee_at
               (persiste en base, pas seulement pendant la session). */
            { id: 'a_relancer', label: 'À relancer', test: t => etatDe(t) === 'confirme' && !t.relance_envoyee_at },
            { id: 'relance', label: 'Déjà relancés', test: t => etatDe(t) === 'confirme' && !!t.relance_envoyee_at },
            { id: 'retire', label: 'Utilisés', test: t => etatDe(t) === 'retire' },
          ]}
          selecteurs={[{
            id: 'se', libelleTout: 'Tous les super events',
            options: supers.map(x => ({ id: x.id, label: x.nom })), valeur: se, onChange: setSe,
          }, {
            id: 'pro', libelleTout: 'Tous les pros',
            options: partenairesAvecGagnant, valeur: pro, onChange: setPro,
          }]}
          categorie={operationDe}
          sousCategorie={stationDe}
          legende={
            <>
              <b>En attente</b> = jamais appelé · <b>Confirmé</b> = appelé, lot pas encore
              récupéré (sous-filtres <b>À relancer</b> / <b>Déjà relancés</b>) ·{' '}
              <b>Utilisé</b> = billet scanné et lot remis en boutique · le bouton{' '}
              <b>🔔 Relancer</b> (visible sur les confirmés) envoie un rappel par email
            </>
          }
        />
      </div>
      {relanceOuverte && (
        <ModalRelanceGlobale gagnants={aRelancer} partenaires={partenaires} supers={supers} onClose={() => setRelanceOuverte(false)} />
      )}
    </div>
  )
}
