'use client'

/**
 * COMMERCIAL — offres, prix, CGV, bons de commande, factures, plaquettes (10/11/2026).
 *
 * Demande de Romain : « un accès direct à la modification du prix et des infos, copie de ce qui
 * est publié, pour avoir accès immédiat à la modification et ne plus avoir de conflit d'écriture
 * et réécriture ».
 *
 * Cette page NE RECREE RIEN : elle lit ce qui est publié et renvoie vers les écrans existants.
 *  - Offres Animation : lues dans lib/reglement.ts (source unique) ET relues en direct dans le
 *    fichier publié /bon-commande-pdf.js, pour signaler tout écart entre les copies.
 *  - Packs Super Event : quatre sources affichées côte à côte (code, table packs_participation,
 *    bon-commande-nds.html, nds-partenaire.html). Aucun prix n'est choisi ici : l'écart est
 *    signalé, la décision revient à Romain.
 *  - Lecture seule pour les prix Animation : ils vivent dans le code (déploiement nécessaire).
 *    Les packs de la table packs_participation restent modifiables dans « Packs de participation ».
 */
import { useEffect, useState } from 'react'
import { PageHeader, SectionHeader } from '@/components/dashboard/DashboardUI'
import { OFFRES_ANIMATION, PRIX_ANIMATION, OPTION_QUIZ_FLOWIN, OPTION_CUSTOMISATION } from '@/lib/reglement'
import { PACKS_DEMANDE, fetchPacksParticipation, type PackParticipation } from '@/lib/commercial'

const BLEU = '#3B5CC4'
const eur = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'
const ttc = (ht: number) => Math.round(ht * 1.2 * 100) / 100

const carte: React.CSSProperties = { background: '#fff', border: '1px solid #e4e7ee', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }
const lienBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '8px 14px', borderRadius: 10, border: `1.5px solid ${BLEU}`, color: BLEU, fontWeight: 700, fontSize: 13.5, textDecoration: 'none', marginRight: 8, marginBottom: 8, background: '#fff' }
const th: React.CSSProperties = { textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#5a6b80', borderBottom: '1px solid #e4e7ee', whiteSpace: 'nowrap' }
const td: React.CSSProperties = { padding: '8px 10px', fontSize: 13.5, borderBottom: '1px solid #f0f2f6', verticalAlign: 'top' }
const ecart: React.CSSProperties = { background: '#FEF3C7', color: '#92400E', fontWeight: 800 }

type Onglet = 'offres' | 'cgv' | 'bons' | 'factures' | 'plaquettes'
const ONGLETS: { id: Onglet; label: string }[] = [
  { id: 'offres', label: 'Offres et prix' },
  { id: 'cgv', label: 'CGV' },
  { id: 'bons', label: 'Bons de commande' },
  { id: 'factures', label: 'Factures' },
  { id: 'plaquettes', label: 'Plaquettes et outils' },
]

/** Lit un fichier publié (même site) en texte ; null si indisponible. */
async function lireFichier(url: string): Promise<string | null> {
  try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.text() : null } catch { return null }
}

interface PublieAnimation { lancement?: number; annuelle?: number; mensuelle?: number; optQuiz?: number; optQuizLancement?: number; kitPhysique?: number }
function lirePrixPdf(js: string | null): PublieAnimation | null {
  if (!js) return null
  const m = js.match(/var PRIX = \{([^}]*)\}/)
  if (!m) return null
  const o: Record<string, number> = {}
  m[1].split(',').forEach(p => { const kv = p.split(':'); if (kv.length === 2) o[kv[0].trim()] = Number(kv[1].trim()) })
  return o as PublieAnimation
}
type PrixPacks = Record<string, number | null>
function lirePacksBonNds(html: string | null): PrixPacks | null {
  if (!html) return null
  const o: PrixPacks = {}
  const re = /data-offre="([a-z]+)"[^>]*data-ht="([0-9.]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) o[m[1]] = Number(m[2])
  return Object.keys(o).length ? o : null
}
function lirePacksPartenaire(html: string | null): PrixPacks | null {
  if (!html) return null
  const o: PrixPacks = {}
  const re = /key:'([a-z]+)'[^}]*ht:([0-9.]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) o[m[1]] = Number(m[2])
  return Object.keys(o).length ? o : null
}
const versionCgv = (html: string | null) => { const m = html && html.match(/CGV_VERSION\s*=\s*'([^']+)'/); return m ? m[1] : null }

/** Retrouve un pack de la table par sa clé (id ou nom). */
function packTable(table: PackParticipation[] | null, cle: string): number | null {
  if (!table) return null
  const p = table.find(x => x.id === cle || (x.nom || '').toLowerCase().indexOf(cle.slice(0, 5)) >= 0)
  return p ? Number(p.prix_ht) : null
}

export default function Page() {
  const [onglet, setOnglet] = useState<Onglet>('offres')
  const [pdf, setPdf] = useState<PublieAnimation | null | undefined>(undefined)
  const [bonNds, setBonNds] = useState<PrixPacks | null | undefined>(undefined)
  const [partenaire, setPartenaire] = useState<PrixPacks | null | undefined>(undefined)
  const [table, setTable] = useState<PackParticipation[] | null | undefined>(undefined)
  const [cgvAnim, setCgvAnim] = useState<string | null | undefined>(undefined)
  const [cgvNds, setCgvNds] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    lireFichier('/bon-commande-pdf.js').then(t => setPdf(lirePrixPdf(t)))
    lireFichier('/bon-commande-nds.html').then(t => { setBonNds(lirePacksBonNds(t)); setCgvNds(versionCgv(t)) })
    lireFichier('/nds-partenaire.html').then(t => setPartenaire(lirePacksPartenaire(t)))
    lireFichier('/bon-commande-animation.html').then(t => setCgvAnim(versionCgv(t)))
    fetchPacksParticipation().then(p => setTable(p.length ? p : null)).catch(() => setTable(null))
  }, [])

  const lignesAnim: { cle: keyof PublieAnimation; nom: string; detail: string; ht: number; unite: string }[] = [
    ...OFFRES_ANIMATION.map(o => ({ cle: o.cle as keyof PublieAnimation, nom: o.nom, detail: o.detail, ht: PRIX_ANIMATION[o.cle], unite: o.cle === 'mensuelle' ? '/ mois' : o.cle === 'annuelle' ? '/ an' : '1re année' })),
    { cle: 'optQuiz', nom: 'Option : ' + OPTION_QUIZ_FLOWIN.nom, detail: OPTION_QUIZ_FLOWIN.detail, ht: OPTION_QUIZ_FLOWIN.prix, unite: 'forfait' },
    { cle: 'optQuizLancement', nom: 'Option : ' + OPTION_QUIZ_FLOWIN.nom + ' (1re année)', detail: '-50 % avec l’offre de lancement', ht: OPTION_QUIZ_FLOWIN.prixLancement, unite: 'forfait' },
  ]

  const packsCles = ['visibilite', 'animation', 'sponsor']
  const valeurPdf = (c: keyof PublieAnimation) => pdf === undefined ? '…' : pdf && typeof pdf[c] === 'number' ? eur(pdf[c] as number) : 'non lu'

  return (
    <div className="sa-page">
      <PageHeader title="Commercial" subtitle="Offres, prix, CGV, bons de commande, factures et plaquettes : ce qui est publié aujourd’hui, au même endroit." />

      <div role="tablist" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {ONGLETS.map(o => (
          <button key={o.id} role="tab" aria-selected={onglet === o.id} onClick={() => setOnglet(o.id)}
            style={{ minHeight: 40, padding: '8px 14px', borderRadius: 100, border: `1.5px solid ${onglet === o.id ? BLEU : '#d9dde6'}`, background: onglet === o.id ? BLEU : '#fff', color: onglet === o.id ? '#fff' : '#1B3A5C', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
            {o.label}
          </button>
        ))}
      </div>

      {onglet === 'offres' && (
        <>
          <SectionHeader>Flowin Animation (commerce) — grille publiée</SectionHeader>
          <div style={carte}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead><tr><th style={th}>Offre</th><th style={th}>Prix HT</th><th style={th}>TTC (TVA 20 %)</th><th style={th}>Description</th><th style={th}>Copie du bon de commande PDF</th></tr></thead>
                <tbody>
                  {lignesAnim.map(l => {
                    const dif = pdf && typeof pdf[l.cle] === 'number' && pdf[l.cle] !== l.ht
                    return (
                      <tr key={l.cle}>
                        <td style={td}><b>{l.nom}</b></td>
                        <td style={td}>{eur(l.ht)} <span style={{ color: '#5a6b80' }}>{l.unite}</span></td>
                        <td style={td}>{eur(ttc(l.ht))}</td>
                        <td style={td}>{l.detail}</td>
                        <td style={{ ...td, ...(dif ? ecart : {}) }}>{valeurPdf(l.cle)}{dif ? ' — écart' : ''}</td>
                      </tr>
                    )
                  })}
                  <tr>
                    <td style={td}><b>Kit physique imprimé</b></td>
                    <td style={td}>{valeurPdf('kitPhysique')} <span style={{ color: '#5a6b80' }}>/ boutique</span></td>
                    <td style={td}>{pdf && pdf.kitPhysique ? eur(ttc(pdf.kitPhysique)) : '—'}</td>
                    <td style={td}>1 support de caisse, 3 affiches A4, 3 macarons (prix lu dans le bon de commande PDF uniquement)</td>
                    <td style={td}>{valeurPdf('kitPhysique')}</td>
                  </tr>
                  <tr>
                    <td style={td}><b>Option : {OPTION_CUSTOMISATION.nom}</b></td>
                    <td style={td}>{OPTION_CUSTOMISATION.prix}</td><td style={td}>—</td>
                    <td style={td}>{OPTION_CUSTOMISATION.detail}</td><td style={td}>—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 13, color: '#5a6b80', margin: '12px 0 0' }}>
              Source unique : <code>admin/lib/reglement.ts</code>. Copies à garder identiques : <code>public/bon-commande-pdf.js</code> (relu ici en direct),
              <code> supabase/functions/_shared/bon-commande-pdf.js</code>, <code>public/bon-commande-animation.html</code>, <code>public/cgv-animation-magasin.html</code> (art. 4 et 6)
              et le calcul de la base <code>sql/2026-11-10-lot-a.sql</code> (445 / 990 / 110 / 145 / 72,5).
            </p>
          </div>

          <SectionHeader>Super Event — packs de participation (4 sources comparées)</SectionHeader>
          <div style={carte}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                <thead><tr>
                  <th style={th}>Pack</th>
                  <th style={th}>Code (lib/commercial.ts)<br /><span style={{ fontWeight: 400 }}>affiché au pro qui rejoint</span></th>
                  <th style={th}>Table packs_participation<br /><span style={{ fontWeight: 400 }}>modifiable dans « Packs »</span></th>
                  <th style={th}>bon-commande-nds.html</th>
                  <th style={th}>nds-partenaire.html</th>
                </tr></thead>
                <tbody>
                  {packsCles.map(c => {
                    const code = PACKS_DEMANDE.find(p => p.cle === c)
                    const vals: (number | null | undefined)[] = [
                      code ? code.prixHt : null,
                      table === undefined ? undefined : packTable(table, c),
                      bonNds === undefined ? undefined : bonNds ? bonNds[c] ?? null : null,
                      partenaire === undefined ? undefined : partenaire ? partenaire[c] ?? null : null,
                    ]
                    const connus = vals.filter((v): v is number => typeof v === 'number')
                    const conflit = connus.some(v => v !== connus[0])
                    return (
                      <tr key={c}>
                        <td style={td}><b>{code ? code.nom : c}</b>{conflit && <div style={{ ...ecart, display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>Conflit de prix</div>}</td>
                        {vals.map((v, i) => (
                          <td key={i} style={{ ...td, ...(conflit && typeof v === 'number' ? ecart : {}) }}>
                            {v === undefined ? '…' : v === null ? 'non lu' : <>{eur(v)} HT<br /><span style={{ fontWeight: 400, color: '#5a6b80' }}>{eur(ttc(v))} TTC</span></>}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 13, color: '#92400E', margin: '12px 0 0' }}>
              Aucun prix n’est choisi ici : les écarts sont signalés, la grille définitive reste à trancher par Romain.
              Un super event peut aussi avoir ses propres packs (configuration du super event, champ <code>cfg_jeu.packs</code>).
            </p>
            {PACKS_DEMANDE.filter(p => packsCles.indexOf(p.cle) >= 0).map(p => (
              <div key={p.cle} style={{ marginTop: 10, fontSize: 13 }}><b>{p.nom}</b> — {p.accroche}. {p.inclusions.join(' ; ')}. Lot mis en jeu : {eur(p.lotEuros)}.</div>
            ))}
          </div>

          <SectionHeader>Modifier un prix</SectionHeader>
          <div style={carte}>
            <p style={{ margin: '0 0 8px', fontSize: 13.5 }}><b>Packs Super Event</b> : modifiables tout de suite dans <a href="/dashboard/nds-packs" style={{ color: BLEU, fontWeight: 700 }}>Packs de participation</a> (table packs_participation). Attention : cette table n’est pas encore lue par le parcours du pro, qui affiche la grille du code.</p>
            <p style={{ margin: '0 0 8px', fontSize: 13.5 }}><b>Offres Animation</b> : lecture seule ici. Les prix sont dans le code ; une modification passe par Claude (fichiers listés ci-dessus) puis une mise en ligne.</p>
            <p style={{ margin: 0, fontSize: 13, color: '#5a6b80' }}>Pour modifier sans mise en ligne (proposition, rien n’est créé) : une table <code>offres_commerciales</code> (cle, gamme animation ou super_event, nom, description, prix_ht, unite, ordre, actif, updated_at, updated_by), écrite par le super admin seul, lue par le bon de commande, la publication, le PDF et le calcul de la base. À valider par Romain avant création.</p>
          </div>
        </>
      )}

      {onglet === 'cgv' && (
        <>
          <SectionHeader>Conditions générales de vente publiées</SectionHeader>
          <div style={carte}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>CGV Flowin Animation (commerce)</div>
            <div style={{ fontSize: 13, color: '#5a6b80', marginBottom: 10 }}>Version acceptée sur le bon de commande : <b>{cgvAnim === undefined ? '…' : cgvAnim || 'non lue'}</b></div>
            <a style={lienBtn} href="/cgv-animation-magasin.html" target="_blank" rel="noopener">Voir les CGV Animation</a>
          </div>
          <div style={carte}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>CGV Super Event (Nuits du Sud 2026)</div>
            <div style={{ fontSize: 13, color: '#5a6b80', marginBottom: 10 }}>Version acceptée sur le bon de commande NDS : <b>{cgvNds === undefined ? '…' : cgvNds || 'non lue'}</b></div>
            <a style={lienBtn} href="/cgv-nds.html" target="_blank" rel="noopener">Voir les CGV Super Event</a>
          </div>
          <div style={carte}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Documents légaux (statut, édition)</div>
            <a style={lienBtn} href="/dashboard/cgv">Ouvrir CGV et légal</a>
          </div>
        </>
      )}

      {onglet === 'bons' && (
        <>
          <SectionHeader>Bons de commande</SectionHeader>
          <div style={carte}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Commandes Animation : paiements à vérifier, virements reçus</div>
            <a style={lienBtn} href="/admin-commandes-animation.html">Ouvrir les commandes Animation</a>
            <a style={lienBtn} href="/bon-commande-animation.html" target="_blank" rel="noopener">Bon de commande Animation (vierge)</a>
          </div>
          <div style={carte}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Super Event (Nuits du Sud 2026)</div>
            <a style={lienBtn} href="/dashboard/nds-bon-commande">Bons de commande et factures NDS</a>
            <a style={lienBtn} href="/bons-commande-liste.html" target="_blank" rel="noopener">Liste des bons NDS</a>
            <a style={lienBtn} href="/bon-commande-nds.html" target="_blank" rel="noopener">Bon de commande NDS (vierge)</a>
          </div>
        </>
      )}

      {onglet === 'factures' && (
        <>
          <SectionHeader>Factures</SectionHeader>
          <div style={carte}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Factures Animation (FL-AM-AAAA-NNNNN)</div>
            <div style={{ fontSize: 13, color: '#5a6b80', marginBottom: 10 }}>Émises automatiquement au paiement validé ; le numéro de facture apparaît sur chaque commande.</div>
            <a style={lienBtn} href="/admin-commandes-animation.html">Voir les commandes et leurs factures</a>
          </div>
          <div style={carte}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Factures Super Event</div>
            <a style={lienBtn} href="/facture-nds.html">Générer une facture</a>
            <a style={lienBtn} href="/dashboard/nds-bon-commande">Bons de commande et factures NDS</a>
          </div>
        </>
      )}

      {onglet === 'plaquettes' && (
        <>
          <SectionHeader>Plaquettes et outils de communication</SectionHeader>
          <div style={carte}>
            <a style={lienBtn} href="/dashboard/landing-page">Landing pages et outils commerciaux</a>
            <a style={lienBtn} href="/plaquette-animation-magasin.html" target="_blank" rel="noopener">Plaquette Animation</a>
            <a style={lienBtn} href="/plaquette-super-event.html" target="_blank" rel="noopener">Plaquette Super Event</a>
            <a style={lienBtn} href="/plaquette-nds.html" target="_blank" rel="noopener">Plaquette NDS 2026</a>
            <a style={lienBtn} href="/visite-guidee/index.html" target="_blank" rel="noopener">Visite guidée Flowin</a>
          </div>
        </>
      )}
    </div>
  )
}
