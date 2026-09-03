'use client'

/**
 * CREER UN SUPER EVENT — parcours en vignettes, cote SA.
 *
 * Romain, 02/09 : « peux-tu implementer le parcours de souscription en mode
 * vignette carrousel ergonomique [...] 1 pour le super event, l autre pour
 * l event. ATTENTION ici nous creons le super event, nous pouvons ajouter des
 * pros, nous ne creons pas une demande de participation. »
 *
 * C est donc bien distinct des deux choses qui existaient :
 *   - /pro/rejoindre depose une DEMANDE DE PARTICIPATION, validee ensuite ;
 *   - /dashboard/super-events duplique la STRUCTURE d une edition precedente.
 * Ici le SA cree l operation et y rattache directement des pros. Aucune
 * demande, aucune validation en aval : les stations existent en sortant.
 *
 * La suppression vit sur le meme ecran, volontairement : « il faut ajouter la
 * fonction supprimer ce super event en cas d erreur » — l erreur se constate
 * juste apres la creation, c est la qu il faut pouvoir revenir en arriere.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader, SectionHeader } from '@/components/dashboard/DashboardUI'
import { Parcours, VignetteChoix, type EtapeParcours } from '@/components/dashboard/Parcours'
import ApercuApp, { type EcranApercu } from '@/components/dashboard/ApercuApp'
import { useDashboard } from '@/contexts/DashboardContext'
import {
  creerSuperEvent, supprimerSuperEvent, slugSuperEvent, fetchSuperEvents,
  type SuperEvent,
} from '@/lib/nds'
import { GABARIT_MODULE, GABARIT_NOM } from '@/lib/gabarit'

const MODULES: { id: string; nom: string; sous: string; icone: string }[] = [
  /* Le gabarit de reference en tete, et par defaut : c est de NDS 2026 qu on
     part, pas d une page blanche (Romain, 03/09). */
  { id: GABARIT_MODULE, nom: GABARIT_NOM, sous: 'Le gabarit de référence — quiz, bonus, ticket', icone: '🎯' },
  { id: 'spin', nom: 'Roue', sous: 'Un tour, un lot immédiat', icone: '🎡' },
  { id: 'quiz', nom: 'Quiz', sous: 'Questions à la suite', icone: '🧠' },
  { id: 'quizmaster', nom: 'Quiz Master', sous: 'Animé par un meneur', icone: '🎤' },
  { id: 'quizsolo', nom: 'Quiz Solo', sous: 'Le joueur seul, à son rythme', icone: '🎯' },
  { id: 'tombola', nom: 'Tombola', sous: 'Tirage différé', icone: '🎟️' },
  { id: 'vote', nom: 'Vote', sous: 'Le public départage', icone: '🗳️' },
]

export default function Page() {
  const router = useRouter()
  const { pros } = useDashboard()

  const [nom, setNom] = useState('')
  const [idManuel, setIdManuel] = useState('')
  const [dateD, setDateD] = useState('')
  const [dateF, setDateF] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [geofence, setGeofence] = useState('150')
  const [tirageGlobal, setTirageGlobal] = useState(true)
  const [choisis, setChoisis] = useState<Record<string, string>>({}) // pro_id -> module
  const [recherchePro, setRecherchePro] = useState('')

  /* L apercu montre la station en cours de reglage : sans ca, on parametre
     cinq stations sans jamais voir a quoi ressemble celle qu on regle. */
  const [apercuPro, setApercuPro] = useState('')
  const [ecranApercu, setEcranApercu] = useState<EcranApercu>('onboard')

  const [occupe, setOccupe] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null)

  const id = idManuel || slugSuperEvent(nom)

  const prosFiltres = useMemo(() => {
    const q = recherchePro.trim().toLowerCase()
    const l = q ? pros.filter(p => (p.nom ?? '').toLowerCase().includes(q)) : pros
    return l.slice().sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? '', 'fr'))
  }, [pros, recherchePro])

  const nbChoisis = Object.keys(choisis).length
  const proApercu = (apercuPro && choisis[apercuPro]) ? apercuPro : Object.keys(choisis)[0] ?? ''

  const basculerPro = (proId: string) =>
    setChoisis(c => {
      const n = { ...c }
      if (n[proId]) delete n[proId]
      else n[proId] = GABARIT_MODULE
      return n
    })

  async function creer() {
    setOccupe(true); setRetour(null)
    const r = await creerSuperEvent({
      id, nom, dateD: dateD || null, dateF: dateF || null,
      description: description || null,
      geofenceM: geofence ? Number(geofence) : null,
      logoUrl: logoUrl.trim() || null,
      tirageGlobal,
      pros: Object.keys(choisis).map(proId => ({
        pro_id: proId,
        nom: pros.find(p => p.id === proId)?.nom ?? proId,
        module: choisis[proId],
      })),
    })
    setOccupe(false)
    if (!r.ok) { setRetour({ ok: false, texte: r.erreur ?? 'Échec de la création.' }); return }
    setRetour({
      ok: true,
      texte: `Créé — ${r.fait.join(', ')}.${r.erreur ? ' ⚠ ' + r.erreur : ''}`,
    })
    setTimeout(() => router.push('/dashboard/super-events'), 1500)
  }

  const etapes: EtapeParcours[] = [
    {
      id: 'identite', icone: '⭐', titre: 'L’opération',
      sous: 'Le nom que verront les joueurs, et les dates pendant lesquelles on joue.',
      bloque: !nom.trim() ? 'Donnez un nom à l’opération pour continuer.'
        : !dateD ? 'La date de début est nécessaire.'
        : (dateF && dateD && dateF < dateD) ? 'La date de fin précède la date de début.'
        : undefined,
      contenu: (
        <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
          <label>
            <span className="sa-lbl">Nom de l’opération *</span>
            <input className="sa-input" value={nom} onChange={e => setNom(e.target.value)} placeholder="Jazz à Nice 2027" />
          </label>
          <label>
            <span className="sa-lbl">Identifiant</span>
            <input className="sa-input" value={idManuel} onChange={e => setIdManuel(e.target.value)} placeholder={slugSuperEvent(nom) || 'se-…'} />
            <span className="sa-aide">
              Déduit du nom : <code className="sa-code">{id || 'se-…'}</code>. Il sert dans les liens
              et les QR — il ne se change plus une fois l’opération lancée.
            </span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span className="sa-lbl">Début *</span>
              <input className="sa-input" type="date" value={dateD} onChange={e => setDateD(e.target.value)} />
            </label>
            <label>
              <span className="sa-lbl">Fin</span>
              <input className="sa-input" type="date" value={dateF} onChange={e => setDateF(e.target.value)} />
            </label>
          </div>
          <label>
            <span className="sa-lbl">Logo de l’opération</span>
            <input className="sa-input" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://…/logo.png" />
            <span className="sa-aide">
              Il s’affiche en tête du parcours joueur, sur <b>toutes les stations</b> de
              l’opération. Laissé vide, la place reste libre — le gabarit n’affiche
              alors aucune marque.
            </span>
          </label>
          <label>
            <span className="sa-lbl">Description</span>
            <textarea className="sa-input" rows={3} value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Ce que l’opération propose, en une ou deux phrases." />
          </label>
        </div>
      ),
    },
    {
      id: 'pros', icone: '🏢', titre: 'Les pros participants',
      sous: 'Chaque pro sélectionné reçoit une station de jeu rattachée à cette opération. On peut en ajouter d’autres plus tard.',
      contenu: (
        <>
          <input
            className="sa-input" style={{ maxWidth: 340, marginBottom: 12 }}
            value={recherchePro} onChange={e => setRecherchePro(e.target.value)}
            placeholder="Rechercher un pro…"
          />
          <div style={{ fontSize: 11.5, color: 'var(--sa-muted)', marginBottom: 10 }}>
            {nbChoisis === 0
              ? 'Aucun pro sélectionné — vous pourrez créer l’opération vide et les ajouter ensuite.'
              : `${nbChoisis} pro${nbChoisis > 1 ? 's' : ''} sélectionné${nbChoisis > 1 ? 's' : ''}.`}
          </div>
          <div className="sa-choix-grille">
            {prosFiltres.map(p => (
              <VignetteChoix
                key={p.id}
                titre={p.nom ?? p.id}
                sous={p.ville ?? undefined}
                icone="🏢"
                actif={!!choisis[p.id]}
                onClick={() => basculerPro(p.id)}
              />
            ))}
          </div>
        </>
      ),
    },
    {
      id: 'jeux', icone: '🎮', titre: 'Le jeu de chaque station',
      sous: 'Les jeux sont indépendants de l’opération : deux stations du même super event peuvent proposer des jeux différents.',
      contenu: nbChoisis === 0 ? (
        <div className="sa-muted" style={{ fontSize: 13 }}>
          Aucun pro sélectionné à l’étape précédente — rien à configurer ici.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {Object.keys(choisis).map(proId => (
            <div key={proId}>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 7 }}>
                {pros.find(p => p.id === proId)?.nom ?? proId}
              </div>
              <div className="sa-choix-grille">
                {MODULES.map(m => (
                  <VignetteChoix
                    key={m.id}
                    titre={m.nom} sous={m.sous} icone={m.icone}
                    actif={choisis[proId] === m.id}
                    // Choisir un jeu montre AUSSI cette station dans l apercu.
                    onClick={() => { setChoisis(c => ({ ...c, [proId]: m.id })); setApercuPro(proId) }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'reglages', icone: '⚙️', titre: 'Réglages de l’opération',
      sous: 'Ce qui vaut pour toutes les stations à la fois.',
      contenu: (
        <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
          <label>
            <span className="sa-lbl">Périmètre de jeu (mètres)</span>
            <input className="sa-input" type="number" value={geofence} onChange={e => setGeofence(e.target.value)} style={{ maxWidth: 160 }} />
            <span className="sa-aide">
              Distance maximale entre le joueur et la station pour qu’une partie compte.
              Vide = aucun contrôle de position.
            </span>
          </label>
          <div className="sa-choix-grille" style={{ maxWidth: 440 }}>
            <VignetteChoix
              titre="Tirage global" sous="Un tirage commun à toutes les stations" icone="🎰"
              actif={tirageGlobal} onClick={() => setTirageGlobal(true)}
            />
            <VignetteChoix
              titre="Tirage par station" sous="Chaque pro tire chez lui" icone="🏪"
              actif={!tirageGlobal} onClick={() => setTirageGlobal(false)}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'recap', icone: '✅', titre: 'Récapitulatif',
      sous: 'Rien n’est écrit tant que vous n’avez pas validé ici.',
      contenu: (
        <div style={{ maxWidth: 620 }}>
          {([
            ['Nom', nom || '—'],
            ['Identifiant', id || '—'],
            ['Dates', dateD ? `${dateD}${dateF && dateF !== dateD ? ` → ${dateF}` : ''}` : '—'],
            ['Pros rattachés', nbChoisis ? `${nbChoisis}` : 'aucun'],
            ['Stations créées', nbChoisis ? `${nbChoisis}` : '0'],
            ['Périmètre', geofence ? `${geofence} m` : 'aucun contrôle'],
            ['Tirage', tirageGlobal ? 'global' : 'par station'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--sa-border)' }}>
              <span className="sa-muted" style={{ fontSize: 11.5 }}>{k}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
          {nbChoisis > 0 && (
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--sa-muted)', lineHeight: 1.5 }}>
              Les stations sont créées en statut « à venir ». Leur QR, leurs lots et leur
              contenu de jeu se règlent ensuite depuis la fiche de chaque station.
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="⭐ Créer un super event"
          subtitle="Le SA crée l’opération et y rattache directement des pros — ce n’est pas une demande de participation"
          actions={<Link href="/dashboard/super-events" className="sa-btn sm">← Super Events</Link>}
        />

        <div className="sa-parc-avec-apercu">
          <Parcours
            teinte="super"
            bandeau="Créer un super event"
            etapes={etapes}
            onTerminer={creer}
            libelleFin="Créer le super event"
            occupe={occupe}
            message={retour && (
              <div className={`sa-alert ${retour.ok ? 'info' : 'warn'}`} style={{ marginTop: 14, fontSize: 12.5 }}>
                {retour.texte}
              </div>
            )}
          />

          {/* Le visuel se construit pendant la saisie. Un super event n a pas
              d ecran a lui : ce qu on montre, c est la STATION en cours de
              reglage — c est elle que le joueur ouvrira. */}
          <ApercuApp
            ecran={ecranApercu}
            onEcran={setEcranApercu}
            d={{
              nom: proApercu ? (pros.find(p => p.id === proApercu)?.nom ?? proApercu) : nom,
              superEvent: nom || null,
              /* Un super event groupe plusieurs stations : la carte des
                 stations et la carte partenaires font partie du parcours. */
              multistation: true,
              nbStations: Object.keys(choisis).length,
              logoUrl: logoUrl.trim() || null,
              nbPartenaires: Object.keys(choisis).length,
            }}
          />
        </div>

        <ZoneSuppression />
      </div>
    </div>
  )
}

/**
 * Suppression d un super event cree par erreur.
 * Refusee par la base si l operation porte des participations ou des tirages :
 * on n efface pas de l activite joueur, ni des gagnants a qui on a promis un
 * lot. Le nom doit etre ressaisi exactement — un clic de trop ne suffit pas.
 */
function ZoneSuppression() {
  const [supers, setSupers] = useState<SuperEvent[]>([])
  const [cible, setCible] = useState('')
  const [saisie, setSaisie] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [retour, setRetour] = useState<{ ok: boolean; texte: string } | null>(null)

  const charger = () => fetchSuperEvents().then(setSupers)
  useEffect(() => { charger() }, [])

  const se = supers.find(s => s.id === cible)

  async function supprimer() {
    if (!se) return
    setOccupe(true); setRetour(null)
    const r = await supprimerSuperEvent(se.id, saisie)
    setOccupe(false)
    if (r.ok) {
      setRetour({ ok: true, texte: `« ${r.nom} » supprimé — ${r.events_supprimes ?? 0} station(s) avec lui.` })
      setCible(''); setSaisie(''); charger()
      return
    }
    if (r.raison === 'activite') {
      setRetour({
        ok: false,
        texte: `Suppression refusée : cette opération porte ${r.participations} partie(s) et ${r.tirages} tirage(s). `
          + 'Effacer, ce serait effacer de l’activité joueur réelle et des gagnants déjà désignés.',
      })
      return
    }
    if (r.raison === 'confirmation') {
      setRetour({ ok: false, texte: `Le nom saisi ne correspond pas. Attendu exactement : « ${r.attendu} ».` })
      return
    }
    setRetour({
      ok: false,
      texte: r.message
        ? `La suppression a échoué — ${r.message}`
        : 'Super event introuvable.',
    })
  }

  return (
    <div className="sa-page" style={{ marginTop: 20, borderColor: '#E2B4B4' }}>
      <SectionHeader>🗑️ Supprimer un super event créé par erreur</SectionHeader>
      <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 12, lineHeight: 1.5 }}>
        Refusé automatiquement si l’opération porte des parties jouées ou des tirages.
        Les stations rattachées partent avec elle ; <b>les fiches pro sont conservées</b> —
        un pro existe indépendamment de l’opération à laquelle il a participé.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="sa-input" style={{ maxWidth: 300, width: 'auto' }} value={cible}
          onChange={e => { setCible(e.target.value); setSaisie(''); setRetour(null) }}>
          <option value="">— choisir l’opération —</option>
          {supers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        {se && (
          <>
            <input className="sa-input" style={{ maxWidth: 300 }} value={saisie}
              onChange={e => setSaisie(e.target.value)}
              placeholder={`Retapez « ${se.nom} » pour confirmer`} />
            <button className="sa-btn" style={{ background: '#B3261E', color: '#fff', borderColor: '#B3261E' }}
              onClick={supprimer} disabled={occupe || saisie.trim() !== (se.nom ?? '').trim()}>
              {occupe ? '…' : 'Supprimer définitivement'}
            </button>
          </>
        )}
      </div>

      {retour && (
        <div className={`sa-alert ${retour.ok ? 'info' : 'warn'}`} style={{ marginTop: 12, fontSize: 12.5 }}>
          {retour.texte}
        </div>
      )}
    </div>
  )
}
