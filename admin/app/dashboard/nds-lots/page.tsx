'use client'

/**
 * Stock des lots — vue Next.
 * Portage de renderNdsLots du monolithe, avec la correction de fond :
 * lots_stock.utilise ne passe a true qu au RETRAIT en caisse, jamais au tirage.
 * La vue lisait donc uniquement le stock et affichait "0 attribue" alors que des
 * gagnants existaient. On lit les DEUX sources : le stock et les tirages.
 */
import { useEffect, useState, useCallback } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { PageHeader, SectionHeader, EmptyState } from '@/components/dashboard/DashboardUI'
import {
  fetchGagnantsPartenaire, fetchEtatPartenaire, confirmerGagnant, annulerEtRetirer,
  lienBillet, mailPartenaireUrl, SE_DEFAUT, fetchSuperEvents,
  type GagnantPartenaire, type EtatPartenaire, type SuperEvent,
} from '@/lib/nds'

import { usePorteeInitiale } from '@/lib/portee'
declare global {
  interface Window {
    flowinMailGagnant?: {
      sujet: (t: Record<string, unknown>) => string
      corps: (t: Record<string, unknown>) => string
      gmailUrl: (t: Record<string, unknown>) => string
      lienBillet: (t: Record<string, unknown>) => string
    }
  }
}
/** Charge /nds/mail-gagnant.js une seule fois -- source unique du texte, jamais recopiee ici
 * (deja utilise depuis PartenaireDrawer, meme pattern repris a l'identique). */
function useMailGagnant() {
  useEffect(() => {
    if (window.flowinMailGagnant || document.getElementById('flowin-mail-gagnant-script')) return
    const s = document.createElement('script')
    s.id = 'flowin-mail-gagnant-script'
    s.src = '/nds/mail-gagnant.js'
    document.head.appendChild(s)
  }, [])
}

interface Ligne {
  id: string
  nom: string
  email: string | null
  gagnants: GagnantPartenaire[]
  etat: EtatPartenaire
}

export default function Page() {
  const { partenaires, openDrawer } = useDashboard()
  const [lignes, setLignes] = useState<Ligne[] | null>(null)
  useMailGagnant()

  /* PORTEE. Cette page etait figee sur SE_DEFAUT : elle ne pouvait montrer que
     les lots de NDS 2026, quel que soit le nombre de super events en base. Le
     selecteur reprend exactement le motif de /dashboard/statistiques — meme
     source (fetchSuperEvents), meme rendu — plutot que d en inventer un autre.
     SE_DEFAUT reste la valeur de depart : aucun changement de comportement
     tant qu on ne touche pas au selecteur. */
  const [se, setSe] = useState<string>(SE_DEFAUT)
  /* Portee recue de la fiche qui nous a ouverts : on arrive DEJA cadre sur son
     super event. Sans ca, ouvrir ce module depuis « Jazz a Nice 2027 » affichait
     Nuits du Sud. Les boutons de l ecran restent maitres ensuite. */
  const porteeUrl = usePorteeInitiale()
  useEffect(() => { if (porteeUrl.se) setSe(porteeUrl.se) }, [porteeUrl.se])

  const [supers, setSupers] = useState<SuperEvent[]>([])
  useEffect(() => { fetchSuperEvents().then(setSupers) }, [])

  /* Seuls les partenaires dotes d au moins un lot nous interessent ici. */
  const dotes = partenaires.filter(p => Array.isArray(p.lots) && p.lots.length > 0)

  const charger = useCallback(async () => {
    // Vider AVANT de recharger : sinon, en changeant de super event, on lit les
    // lots du precedent sous le nom du nouveau pendant toute la requete.
    setLignes(null)
    const res = await Promise.all(
      dotes.map(async p => {
        const [gagnants, etat] = await Promise.all([
          fetchGagnantsPartenaire(p.id, se),
          fetchEtatPartenaire(p.id, se),
        ])
        return { id: p.id, nom: p.nom, email: p.email ?? null, gagnants, etat } as Ligne
      })
    )
    setLignes(res.filter(l => l.etat.tires > 0 || l.gagnants.length > 0))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partenaires.length, se])

  useEffect(() => { charger() }, [charger])

  async function onConfirmer(tirageId: number) {
    if (!confirm('Confirmer ce gagnant ?\n\nIl apparaîtra alors chez le commerçant et son nom s\'inscrira sur le billet.')) return
    if (!await confirmerGagnant(tirageId)) { alert('La confirmation a échoué.'); return }
    charger()
  }

  async function onRetirer(g: GagnantPartenaire, partenaireId: string) {
    if (!confirm(`Annuler ce tirage (${g.joueur_nom ?? 'gagnant'}) et en tirer un nouveau pour le même lot (${g.lot_nom}) ?\n\nÀ utiliser uniquement si la personne ne répond pas à l'appel. Le tirage annulé reste en base pour historique mais disparaît de cette liste.`)) return
    const r = await annulerEtRetirer(g.tirage_id, partenaireId, g.lot_nom ?? '', Number(g.lot_valeur ?? 0))
    if (!r.ok) { alert('Le re-tirage a échoué : ' + (r.erreur ?? 'raison inconnue')); return }
    charger()
  }

  const total = (lignes ?? []).reduce(
    (acc, l) => ({
      tires: acc.tires + l.etat.tires,
      a_confirmer: acc.a_confirmer + l.etat.a_confirmer,
      confirmes: acc.confirmes + l.etat.confirmes,
      retires: acc.retires + l.etat.retires,
    }),
    { tires: 0, a_confirmer: 0, confirmes: 0, retires: 0 }
  )

  /* "213 lots tires" (ci-dessus) compte des LOTS, pas des personnes -- une meme personne
     peut legitimement gagner plusieurs fois a des moments differents (des qu'elle a retire
     son lot precedent, elle redevient eligible). Compteur distinct reel, demande par Romain
     ("erreur dans le nombre de gagnants") : dedoublonne par joueur_id. */
  const gagnantsDistincts = new Set(
    (lignes ?? []).flatMap(l => l.gagnants.map(g => g.joueur_id).filter((id): id is string => !!id))
  ).size

  /* FIX 31/08 (cf. docs/sql/2026-08-31-fix-tirage-lot-quantite.sql) : tirage_lot() ne
     verifiait pas la quantite configuree avant ce fix -- des lots ont ete tires bien
     au-dela du stock reel (ex. Nook Cafe : 10 configures, 43 tires). Le controle humain
     (confirmer un par un) a jusqu'ici empeche tout depassement REEL envers les partenaires
     (confirmes+retires == configure, exactement), mais des tirages "fantomes" jamais
     destines a etre confirmes restent affiches. Comparaison visible pour que ça ne passe
     plus inaperçu -- signale par Romain. */
  const totalConfigure = partenaires.reduce(
    (n, p) => n + (Array.isArray(p.lots) ? p.lots.reduce((s: number, l: any) => s + (Number(l?.quantite) || 0), 0) : 0),
    0
  )
  const totalHonore = total.confirmes + total.retires
  const totalFantome = total.tires - totalHonore

  return (
    <div className="sa-content">
      <div className="sa-page">
        <PageHeader
          title="🎁 Stock des lots"
          subtitle="Gagnants tirés, confirmations et retraits en caisse"
        />

        {/* Meme selecteur que /dashboard/statistiques, a l identique. */}
        {supers.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {supers.map(x => (
              <button key={x.id} className={`sa-btn sm${x.id === se ? ' primary' : ''}`} onClick={() => setSe(x.id)}>
                {x.nom}
              </button>
            ))}
          </div>
        )}

        {totalFantome > 0 && (
          <div className="sa-alert warn" style={{ marginBottom: 16, fontSize: 12.5 }}>
            ⚠ {totalConfigure} lots configurés au total, {totalHonore} réellement confirmés/retirés (les deux correspondent — aucun partenaire lésé) — mais {totalFantome} tirages restent en base sans jamais avoir été destinés à être honorés, tirés au-delà du stock avant la correction du 31/08. Voir <code className="sa-code">docs/sql/2026-08-31-fix-tirage-lot-quantite.sql</code>.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 18 }}>
          {([['Lots tirés', total.tires], ['Gagnants distincts', gagnantsDistincts], ['À appeler', total.a_confirmer],
             ['Confirmés', total.confirmes], ['Retirés en caisse', total.retires]] as [string, number][])
            .map(([lib, val]) => (
            <div key={lib} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 12, padding: '16px 14px' }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--sa-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{lib}</div>
            </div>
          ))}
        </div>
        <div className="sa-muted" style={{ fontSize: 11.5, marginBottom: 18, marginTop: -10 }}>
          « Lots tirés » ≠ « Gagnants distincts » : une même personne peut gagner plusieurs fois, à des moments différents (dès qu'elle a retiré son lot précédent, elle redevient éligible).
        </div>

        {lignes === null && <div className="sa-muted" style={{ fontSize: 13 }}>Chargement…</div>}
        {lignes?.length === 0 && <EmptyState title="Aucun gagnant tiré pour l'instant" />}

        {(lignes ?? []).map(l => (
          <div key={l.id} style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button className="sa-btn sm" onClick={() => openDrawer('partenaire', l.id)} style={{ fontWeight: 800 }}>{l.nom}</button>
              <span style={{ fontSize: 12, color: 'var(--sa-muted)' }}>
                {l.etat.tires} tiré{l.etat.tires > 1 ? 's' : ''} · {l.etat.confirmes} confirmé{l.etat.confirmes > 1 ? 's' : ''} · {l.etat.retires} retiré{l.etat.retires > 1 ? 's' : ''}
              </span>
            </div>

            {l.etat.a_confirmer > 0 && (
              <div className="sa-alert warn" style={{ marginBottom: 10, fontSize: 12.5 }}>
                ☎ {l.etat.a_confirmer} gagnant{l.etat.a_confirmer > 1 ? 's' : ''} à appeler. Le partenaire ne les verra qu&apos;une fois confirmés.
              </div>
            )}

            {l.gagnants.map(g => (
              <div key={g.tirage_id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '7px 10px', background: 'var(--sa-subtle)', borderRadius: 9, marginBottom: 5 }}>
                <span style={{ flex: 1, minWidth: 150 }}>
                  <b style={{ fontSize: 13 }}>{g.etat === 'a_confirmer' ? 'À attribuer' : (g.joueur_nom ?? '—')}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}> · {g.lot_nom}</span>
                </span>
                <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11.5, fontWeight: 700, color: '#7C2D92' }}>{g.ticket_code ?? '—'}</span>
                <span className={`sa-chip ${g.etat === 'a_confirmer' ? 'past' : 'live'}`}>
                  {g.etat === 'retire' ? '✓ Retiré' : g.etat === 'confirme' ? '✓ Confirmé' : '☎ À appeler'}
                </span>
                {g.retrait_token && (
                  <a className="sa-btn sm" href={lienBillet(g.retrait_token, true)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>📄 Billet</a>
                )}
                {g.etat !== 'a_confirmer' && (
                  <>
                    <button
                      className="sa-btn sm"
                      onClick={() => {
                        const url = window.flowinMailGagnant?.gmailUrl({
                          joueur_nom: g.joueur_nom, email: g.joueur_email, lot_nom: g.lot_nom,
                          ticket_code: g.ticket_code, retrait_token: g.retrait_token, type: 'lot',
                        })
                        if (url) window.open(url, '_blank', 'noopener')
                      }}
                    >
                      ✉️ Gagnant
                    </button>
                    <button
                      className="sa-btn sm"
                      onClick={() => window.open(mailPartenaireUrl(g, l.nom, l.email), '_blank', 'noopener')}
                    >
                      ✉️ Partenaire
                    </button>
                  </>
                )}
                {g.etat === 'a_confirmer' && (
                  <>
                    <button className="sa-btn sm primary" onClick={() => onConfirmer(g.tirage_id)}>✓ Confirmer</button>
                    <button className="sa-btn sm" onClick={() => onRetirer(g, l.id)} title="Annuler et tirer un nouveau gagnant pour ce lot">🔁 Re-tirer</button>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
