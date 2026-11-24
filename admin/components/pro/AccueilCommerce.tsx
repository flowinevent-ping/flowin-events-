'use client'

/**
 * ACCUEIL DU COMMERCE (maquette lot 6 C, validée par Romain, 24/11/2026) : 4 écrans en carrousel, peu de texte.
 * 1 Mes animations (flashs du jour) · 2 Ma participation au Super Event (Demandé / Accepté / En cours) ·
 * 3 Lots à retirer · 4 Statistiques (aperçu ; « Voir tous mes chiffres » ouvre /pro/statistiques).
 * « Créer une animation » reste en bas des écrans 1 et 2 : un geste.
 * Données : opérations du serveur, rechargées avec la session du navigateur (noms des gagnants) ;
 * flashs du jour = fetchFlashsAujourdhui par QR ; statut = statutDemande(cfg) (lib/inscriptionPro.ts) ;
 * chiffres = RPC stats_pro_audience (« Bientôt » si absente). ?demo=1 : exemples étiquetés, aucune écriture (cet écran n'écrit jamais).
 */
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { estDemo } from '@/lib/demo'
import { fetchOperationsPro, libelleModule, libelleDates, libelleStatut, type DonneesOperation } from '@/lib/operations'
import { fetchQrTraces, avecDefauts, fetchFlashsAujourdhui } from '@/lib/qrTraces'
import { statutDemande } from '@/lib/inscriptionPro'
import { fetchStatsAudience, STATS_DEMO, pct, type EtatStats } from '@/lib/statsPro'
import { IcoModule, Ico } from '@/lib/proicons'
import CarrouselOrange, { Bientot, EtiquetteDemo, carteBlanche, boutonOrange, ORANGE, BLEU, VERT, GRIS, ENCRE, type EcranOrange } from '@/components/pro/CarrouselOrange'

type Statut3 = 'Demandé' | 'Accepté' | 'En cours'
interface LigneAnim { cle: string; nom: string; jeu: string; module: string; enLigne: boolean; statut: string; flashs: number | null; href: string }
interface LigneSE { cle: string; nom: string; dates: string; statut: Statut3; flashs: number | null; href: string }
interface LigneLot { id: string; lot: string; prenom: string; code: string; valable: string }

const fmt = (v: number) => v.toLocaleString('fr-FR').replace(/ /g, ' ')
const ETAPES: Statut3[] = ['Demandé', 'Accepté', 'En cours']

async function flashsDuJour(op: DonneesOperation): Promise<number | null> {
  try {
    let total = 0
    for (const s of op.stations) {
      const qrs = avecDefauts(await fetchQrTraces(s.id))
      const n = await Promise.all(qrs.map(q => fetchFlashsAujourdhui(s.id, q.source_qr)))
      total += n.reduce((t, x) => t + x, 0)
    }
    return total
  } catch { return null }
}

function joursRestants(iso: string | null | undefined): string {
  if (!iso) return 'sans limite'
  const j = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
  return j <= 0 ? 'expire aujourd’hui' : `valable ${j} j`
}

export default function AccueilCommerce({ proId, proNom, operations, peutCreer, peutRejoindre }: {
  proId: string
  proNom: string
  operations: DonneesOperation[]
  peutCreer: boolean
  peutRejoindre: boolean
}) {
  const [ops, setOps] = useState<DonneesOperation[]>(operations)
  const [demo, setDemo] = useState(false)
  const [flashs, setFlashs] = useState<Record<string, number | null>>({})
  const [stats, setStats] = useState<EtatStats | null>(null)

  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const et = q ? '&' : '?'

  /* Démo : exemples étiquetés. Hors démo : recharge avec la session (noms des gagnants), puis les flashs du jour. */
  useEffect(() => {
    let vivant = true
    const d = estDemo()
    setDemo(d)
    if (d) { setStats({ etat: 'ok', stats: STATS_DEMO }); return }
    fetchOperationsPro(proId).then(r => { if (vivant && r.operations.length) setOps(r.operations) }).catch(() => {})
    return () => { vivant = false }
  }, [proId])

  const cle = ops.map(o => o.cle).join('|')
  useEffect(() => {
    if (demo) return
    let vivant = true
    ops.slice(0, 8).forEach(o => { flashsDuJour(o).then(n => { if (vivant) setFlashs(f => ({ ...f, [o.cle]: n })) }) })
    const ids = ops.flatMap(o => o.stations.map(s => s.id))
    fetchStatsAudience(ids, 30).then(r => { if (vivant) setStats(r) })
    return () => { vivant = false }
  }, [cle, demo]) // eslint-disable-line react-hooks/exhaustive-deps

  const lien = (c: string) => `/pro/operation${q}${et}op=${encodeURIComponent(c)}`

  const animations: LigneAnim[] = useMemo(() => {
    if (demo) return [
      { cle: 'd1', nom: 'Roue', jeu: 'Un café offert', module: 'spin', enLigne: true, statut: 'En ligne', flashs: 96, href: '#' },
      { cle: 'd2', nom: 'Quiz + bonus', jeu: 'Questions sur la ville', module: 'quiz', enLigne: true, statut: 'En ligne', flashs: 32, href: '#' },
    ]
    return ops.filter(o => o.type === 'event').map(o => ({
      cle: o.cle, nom: o.nom, jeu: libelleModule(o.stations[0]?.module), module: o.stations[0]?.module || 'quiz',
      enLigne: o.status === 'live', statut: o.status === 'live' ? 'En ligne' : libelleStatut(o.status), flashs: flashs[o.cle] ?? null, href: lien(o.cle),
    }))
  }, [demo, ops, flashs]) // eslint-disable-line react-hooks/exhaustive-deps

  const supers: LigneSE[] = useMemo(() => {
    if (demo) return [
      { cle: 's1', nom: 'Nuits du Sud 2026', dates: '9 – 18 juillet · Vence', statut: 'En cours', flashs: 38, href: '#' },
      { cle: 's2', nom: 'Foire de Vence', dates: 'Réponse sous 24 à 48 h', statut: 'Demandé', flashs: null, href: '#' },
    ]
    return ops.filter(o => o.type === 'super').map(o => {
      const brut = statutDemande(o.stations[0]?.cfg)
      /* « Accepté » devient « En cours » quand le Super Event est en cours (status live). */
      const statut: Statut3 = brut === 'Accepté' && o.status === 'live' ? 'En cours' : brut
      return { cle: o.cle, nom: o.nom, dates: libelleDates(o.dateD, o.dateF), statut, flashs: flashs[o.cle] ?? null, href: lien(o.cle) }
    })
  }, [demo, ops, flashs]) // eslint-disable-line react-hooks/exhaustive-deps

  const lots: LigneLot[] = useMemo(() => {
    if (demo) return [
      { id: 'a', lot: 'Un café offert', prenom: 'Camille', code: 'K7M2', valable: 'valable 12 j' },
      { id: 'b', lot: 'Un café offert', prenom: 'Hugo', code: 'P3X9', valable: 'valable 20 j' },
      { id: 'c', lot: 'Panier garni', prenom: 'Inès', code: 'T5B1', valable: 'valable 4 j' },
    ]
    const l: (LigneLot & { t: number })[] = []
    ops.forEach(o => o.gagnants.forEach(g => {
      if (g.etat === 'retire' || g.etat === 'annule') return
      l.push({ id: String(g.id), lot: g.lotNom || 'Lot', prenom: (g.joueurNom || '').trim().split(/\s+/)[0] || '—', code: g.ticketCode || '', valable: joursRestants(g.valableJusquAu ?? o.dateF), t: g.date ? new Date(g.date).getTime() : 0 })
    }))
    return l.sort((a, b) => b.t - a.t)
  }, [demo, ops])

  const stockLigne = useMemo(() => {
    if (demo) return 'Stock : Un café offert, 14 restants sur 20.'
    for (const o of ops) for (const l of o.lots) if (l.stock) return `Stock : ${l.nom}, ${l.stock.dispo} restants sur ${l.stock.total}.`
    return null
  }, [demo, ops])

  const flashsJour = animations.reduce((t, a) => t + (a.flashs ?? 0), 0)
  const jourConnu = animations.length > 0 && animations.every(a => a.flashs !== null)

  const creer = peutCreer
    ? <Link href={`/pro/nouvelle${q}${et}type=animation`} style={boutonOrange()} data-creer-animation><Ico k="plus" size={18} />Créer une animation</Link>
    : undefined

  const st = stats && stats.etat === 'ok' ? stats.stats : null
  const flashs30 = stats ? (stats.etat === 'ok' ? stats.stats.flashs : stats.flashs) : null

  const ecrans: EcranOrange[] = [
    {
      cle: 'animations', titre: `Bonjour, ${proNom}`, sous: demo ? 'Aujourd’hui (exemple)' : 'Aujourd’hui', picto: 'shop',
      corps: (
        <>
          {demo && <EtiquetteDemo />}
          <div style={{ ...carteBlanche, border: `2px solid ${ORANGE}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: GRIS }}>Flashs aujourd’hui</div>
            <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, color: ORANGE, margin: '4px 0' }}>{demo ? fmt(128) : jourConnu ? fmt(flashsJour) : animations.length ? '…' : '0'}</div>
            <div style={{ fontSize: 14, color: GRIS }}>sur {animations.length} animation{animations.length > 1 ? 's' : ''}</div>
          </div>
          {animations.length === 0
            ? <div style={{ ...carteBlanche, fontSize: 14, color: GRIS, textAlign: 'center' }}>Aucune animation pour le moment.</div>
            : animations.slice(0, 3).map(a => (
              <Link key={a.cle} href={a.href} style={{ ...carteBlanche, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: ENCRE, minHeight: 64 }}>
                <span style={{ flex: 'none', width: 48, height: 48, borderRadius: 14, background: '#FFF4EA', color: ORANGE, display: 'grid', placeItems: 'center' }}><IcoModule module={a.module} size={24} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: 'block', fontSize: 16, overflowWrap: 'anywhere' }}>{a.nom}</b>
                  <span style={{ display: 'block', fontSize: 13, color: GRIS }}>{a.jeu}</span>
                  <span style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 800, borderRadius: 99, padding: '1px 9px', background: a.enLigne ? '#E3F3EC' : '#EEF1F5', color: a.enLigne ? VERT : GRIS }}>{a.statut}</span>
                </span>
                <span style={{ flex: 'none', textAlign: 'right', fontWeight: 900, fontSize: 22 }}>{a.flashs === null ? '…' : a.flashs}<small style={{ display: 'block', fontSize: 12.5, color: GRIS, fontWeight: 700 }}>flashs</small></span>
              </Link>
            ))}
          {animations.length > 3 && <div style={{ fontSize: 13, color: GRIS }}>et {animations.length - 3} autre{animations.length - 3 > 1 ? 's' : ''}</div>}
          <Link href={`/pro${q}${et}liste=1`} data-toutes-animations style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontSize: 14, fontWeight: 800, color: ORANGE }}>Toutes mes animations</Link>
        </>
      ),
      pied: creer,
    },
    {
      cle: 'super-event', titre: 'Super Event', sous: demo ? 'Ma participation (exemple)' : 'Ma participation', picto: 'star',
      corps: (
        <>
          {demo && <EtiquetteDemo />}
          {supers.length === 0
            ? <div style={{ ...carteBlanche, textAlign: 'center', padding: '28px 14px', marginTop: 8 }}>
                <div style={{ fontSize: 17, fontWeight: 800 }}>Pas encore de Super Event</div>
                <div style={{ fontSize: 14, color: GRIS, marginTop: 4 }}>Rejoignez-en un en 3 écrans.</div>
              </div>
            : supers.slice(0, 2).map((s, k) => {
              const rang = ETAPES.indexOf(s.statut)
              return (
                <Link key={s.cle} href={s.href} style={{ ...carteBlanche, display: 'block', textDecoration: 'none', color: ENCRE }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <b style={{ fontSize: 19, overflowWrap: 'anywhere' }}>{s.nom}</b>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: ORANGE, background: '#FFF4EA', borderRadius: 99, padding: '2px 10px', flex: 'none' }}>{s.statut}</span>
                  </div>
                  <div style={{ fontSize: 13, color: GRIS, marginTop: 2 }}>{s.dates}</div>
                  {k === 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-around', margin: '12px 0 4px' }} data-statut-se={s.statut}>
                      {ETAPES.map((e, r) => (
                        <div key={e} style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: r <= rang ? ORANGE : '#9AA5B4' }}>
                          <span style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 15, margin: '0 auto 3px', background: r <= rang ? ORANGE : '#E2E7EE', color: '#fff' }}>{r < rang ? <Ico k="check" size={16} /> : r === rang ? <span style={{ width: 10, height: 10, borderRadius: 5, background: '#fff' }} /> : null}</span>
                          {e}
                        </div>
                      ))}
                    </div>
                  )}
                  {s.flashs !== null && s.statut !== 'Demandé' && (
                    <div style={{ marginTop: 6 }}><b style={{ fontSize: 28 }}>{s.flashs}</b> <span style={{ fontSize: 13, color: GRIS, fontWeight: 700 }}>flashs de ma station aujourd’hui</span></div>
                  )}
                </Link>
              )
            })}
        </>
      ),
      pied: (
        <>
          {peutRejoindre && <Link href={`/pro/rejoindre${q}`} data-rejoindre style={boutonOrange(true)}>Rejoindre</Link>}
          {creer}
        </>
      ),
    },
    {
      cle: 'lots', titre: 'Lots à retirer', sous: demo ? 'Tickets gagnés (exemple)' : 'Tickets gagnés en attente', picto: 'gift',
      corps: (
        <>
          {demo && <EtiquetteDemo />}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 8px' }}>
            <span style={{ fontSize: 46, fontWeight: 900, color: ORANGE, lineHeight: 1 }}>{lots.length}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: GRIS }}>ticket{lots.length > 1 ? 's' : ''} à retirer</span>
          </div>
          {lots.slice(0, 4).map(l => (
            <div key={l.id} style={{ ...carteBlanche, display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '10px 12px' }}>
              <span style={{ flex: 'none', width: 44, height: 44, borderRadius: 14, background: '#FFF4EA', color: ORANGE, display: 'grid', placeItems: 'center' }}><Ico k="ticket" size={22} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ display: 'block', fontSize: 15.5, overflowWrap: 'anywhere' }}>{l.lot}</b>
                <span style={{ fontSize: 13, color: GRIS }}>{l.prenom} · {l.valable}</span>
              </span>
              <span style={{ flex: 'none', fontFamily: 'ui-monospace, Menlo, monospace', fontWeight: 800, color: ORANGE, fontSize: 14 }}>{l.code}</span>
            </div>
          ))}
          {lots.length > 4 && <div style={{ fontSize: 13, color: GRIS, marginBottom: 6 }}>et {lots.length - 4} de plus</div>}
          {lots.length === 0 && <div style={{ ...carteBlanche, fontSize: 14, color: GRIS, textAlign: 'center' }}>Aucun lot en attente.</div>}
          {stockLigne && <div style={{ background: '#E3E9F8', color: ENCRE, borderRadius: 12, padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>{stockLigne}</div>}
        </>
      ),
      pied: <Link href={`/pro/scanner${q}`} style={boutonOrange()} data-scanner><Ico k="scan" size={18} />Scanner un ticket</Link>,
    },
    {
      cle: 'stats', titre: 'Mes statistiques', sous: demo ? '30 derniers jours (exemple)' : '30 derniers jours', picto: 'chart',
      corps: (
        <>
          {demo && <EtiquetteDemo />}
          <div style={{ ...carteBlanche, border: `2px solid ${ORANGE}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: GRIS }}>Flashs</div>
            <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, color: ORANGE, margin: '4px 0' }}>{flashs30 === null ? '…' : fmt(flashs30)}</div>
            <div style={{ fontSize: 14, color: GRIS }}>pages ouvertes en scannant un QR</div>
          </div>
          {st ? (
            <>
              <div style={carteBlanche}>
                <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: GRIS }}>Contacts autorisés</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: BLEU }}>{fmt(st.optin)}</div>
                <div style={{ fontSize: 13, color: GRIS }}>{pct(st.optin, st.flashs)} % des flashs</div>
              </div>
              {st.genre && !st.petitEchantillon && (() => {
                const t = st.genre.hommes + st.genre.femmes + st.genre.non_renseigne
                return (
                  <div>
                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#E2E7EE' }} aria-hidden>
                      <span style={{ width: `${pct(st.genre.hommes, t)}%`, background: BLEU }} />
                      <span style={{ width: `${pct(st.genre.femmes, t)}%`, background: ORANGE }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                      <span>Hommes {pct(st.genre.hommes, t)} %</span><span>Femmes {pct(st.genre.femmes, t)} %</span>
                    </div>
                  </div>
                )
              })()}
            </>
          ) : stats ? <Bientot texte="Contacts et répartition arrivent bientôt." /> : <div style={{ ...carteBlanche, fontSize: 14 }}>Chargement…</div>}
        </>
      ),
      pied: <Link href={`/pro/statistiques${q}`} style={boutonOrange()} data-voir-chiffres>Voir tous mes chiffres</Link>,
    },
  ]
  return <CarrouselOrange ecrans={ecrans} nom="Accueil de mon commerce" />
}
