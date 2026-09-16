'use client'

/**
 * Retours CRM — suivi des dossiers partenaires apres signature.
 *
 * Les trois jalons (logo, facture, paiement) sont INDEPENDANTS et affiches comme tels.
 * Ne jamais deduire l un de l autre : un paiement encaisse n implique pas que la facture
 * ait ete emise dans l outil, et inversement.
 */
import { useEffect, useMemo, useState } from 'react'
import ListeCRM, { type ColonneCRM } from '@/components/dashboard/ListeCRM'
import { fetchRetoursCrm, majRetourCrm, jalonsRetour, type RetourCrm } from '@/lib/administratif'

const euros = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function Page() {
  const [list, setList] = useState<RetourCrm[]>([])
  const [charge, setCharge] = useState(true)
  const [etat, setEtat] = useState('')
  const [ouvert, setOuvert] = useState<RetourCrm | null>(null)
  /* Totaux calcules sur les lignes REELLEMENT affichees (recherche comprise). */
  const [visibles, setVisibles] = useState<RetourCrm[]>([])

  useEffect(() => {
    fetchRetoursCrm().then(setList).finally(() => setCharge(false))
  }, [])

  const etats = useMemo(
    () => Array.from(new Set(list.map(r => r.etat).filter(Boolean) as string[])).sort(),
    [list]
  )
  const lignes = charge ? null : (etat ? list.filter(r => r.etat === etat) : list)

  async function majJalon(r: RetourCrm, champ: 'logo_envoye' | 'facture_emise' | 'paiement_recu') {
    const val = !r[champ]
    const ok = await majRetourCrm(r.id, { [champ]: val })
    if (ok) {
      const patch = { ...r, [champ]: val }
      setList(l => l.map(x => x.id === r.id ? patch : x))
      setOuvert(o => o && o.id === r.id ? patch : o)
    }
  }

  const total = visibles.reduce((a, r) => a + (r.montant ?? 0), 0)
  const encaisse = visibles.filter(r => r.paiement_recu).reduce((a, r) => a + (r.montant ?? 0), 0)

  /* FAMILLE H : le tableau etait code a la main, avec la classe `sa-table`
     (differente de `sa-tbl` des autres listes). Il passe dans ListeCRM. */
  const colonnes: ColonneCRM<RetourCrm>[] = [
    { id: 'enseigne', label: 'Enseigne', valeur: r => r.enseigne, rendu: r => <b>{r.enseigne ?? '—'}</b>, largeur: 200 },
    {
      id: 'contact_nom', label: 'Contact', valeur: r => r.contact_nom, largeur: 170, multiligne: true,
      rendu: r => (
        <>
          {r.contact_nom ?? '—'}
          {r.contact_tel && <div className="sa-muted" style={{ fontSize: 10.5 }}>{r.contact_tel}</div>}
        </>
      ),
    },
    { id: 'ville', label: 'Ville', valeur: r => `${r.ville ?? ''}${r.cp ? ` (${r.cp})` : ''}`.trim(), largeur: 140 },
    { id: 'offre', label: 'Offre', valeur: r => r.offre ?? r.produit, largeur: 180 },
    { id: 'montant', label: 'Montant', valeur: r => r.montant, rendu: r => <b>{euros(r.montant)}</b>, aligne: 'droite', largeur: 100, horsRecherche: true },
    { id: 'etat', label: 'État', valeur: r => r.etat, rendu: r => (r.etat ? <span className="sa-chip" style={{ fontSize: 10 }}>{r.etat}</span> : '—'), largeur: 110 },
    {
      id: 'jalons', label: 'Jalons', valeur: () => '', nonTriable: true, horsRecherche: true, largeur: 180,
      rendu: r => (
        <div style={{ display: 'flex', gap: 4 }}>
          {jalonsRetour(r).map(j => (
            <span key={j.libelle} title={j.libelle} style={{
              fontSize: 9.5, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
              border: `1px solid ${j.fait ? '#2f7d4f' : 'var(--sa-border)'}`,
              color: j.fait ? '#2f7d4f' : 'var(--sa-muted)',
            }}>{j.libelle.split(' ')[0]}</span>
          ))}
        </div>
      ),
    },
    {
      id: 'date_relance', label: 'Relance', valeur: r => r.date_relance, largeur: 100, horsRecherche: true,
      rendu: r => (r.date_relance ? new Date(r.date_relance).toLocaleDateString('fr-FR') : '—'),
    },
  ]

  return (
    <div className="sa-page">
      <ListeCRM<RetourCrm>
        titre="Retours CRM"
        sousTitre={`${list.length} dossier${list.length > 1 ? 's' : ''}`}
        lignes={lignes}
        colonnes={colonnes}
        cle={r => String(r.id)}
        onLigne={r => setOuvert(r)}
        triDefaut="date_relance"
        triDescendant
        placeholderRecherche="Rechercher une enseigne, un contact, une ville…"
        selecteurs={[{ id: 'etat', libelleTout: 'Tous les états', options: etats.map(e => ({ id: e, label: e })), valeur: etat, onChange: setEtat }]}
        onVisibles={setVisibles}
        legende={<><b>{euros(total)}</b> engagés sur la sélection · <b>{euros(encaisse)}</b> encaissés. Les trois jalons sont indépendants : un paiement reçu n&apos;implique pas que la facture ait été émise.</>}
        videTitre="Aucun dossier"
        videDesc="Aucun retour ne correspond à cette sélection."
      />

      {ouvert && (
        <>
          <div className="sa-drawer-bd" onClick={() => setOuvert(null)} />
          <div className="sa-drawer">
            <div className="sa-drawer-h">
              <div>
                <div className="sa-drawer-title">{ouvert.enseigne ?? 'Dossier'}</div>
                <div className="sa-drawer-sub">{ouvert.contact_nom ?? '—'}{ouvert.ville ? ` · ${ouvert.ville}` : ''}</div>
              </div>
              <button className="sa-drawer-close" onClick={() => setOuvert(null)}>×</button>
            </div>
            <div className="sa-drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>CONTACT</div>
                  <div style={{ fontSize: 13 }}>{ouvert.contact_nom ?? '—'}</div>
                  {ouvert.contact_tel && <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>{ouvert.contact_tel}</div>}
                  {ouvert.contact_email && (
                    <div style={{ fontSize: 12 }}><a href={`mailto:${ouvert.contact_email}`}>{ouvert.contact_email}</a></div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginTop: 2 }}>
                    {ouvert.ville ?? '—'}{ouvert.cp ? ` (${ouvert.cp})` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>OFFRE</div>
                  <div style={{ fontSize: 13 }}>{ouvert.offre ?? ouvert.produit ?? '—'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{euros(ouvert.montant)}</div>
                  {ouvert.origine && <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>Origine : {ouvert.origine}</div>}
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>ÉTAT</div>
                  <input
                    className="sa-input"
                    value={ouvert.etat ?? ''}
                    onChange={e => setOuvert({ ...ouvert, etat: e.target.value })}
                    onBlur={() => majRetourCrm(ouvert.id, { etat: ouvert.etat }).then(ok => ok && setList(l => l.map(x => x.id === ouvert.id ? ouvert : x)))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>
                    JALONS — indépendants, à cocher un par un
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {([
                      ['logo_envoye', 'Logo envoyé'],
                      ['facture_emise', 'Facture émise'],
                      ['paiement_recu', 'Paiement reçu'],
                    ] as const).map(([champ, libelle]) => (
                      <label key={champ} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!ouvert[champ]} onChange={() => majJalon(ouvert, champ)} />
                        {libelle}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>DATE DE RELANCE</div>
                  <input
                    type="date"
                    className="sa-input"
                    value={ouvert.date_relance ?? ''}
                    onChange={e => setOuvert({ ...ouvert, date_relance: e.target.value })}
                    onBlur={() => majRetourCrm(ouvert.id, { date_relance: ouvert.date_relance }).then(ok => ok && setList(l => l.map(x => x.id === ouvert.id ? ouvert : x)))}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sa-muted)', marginBottom: 6 }}>NOTE</div>
                  <textarea
                    className="sa-input"
                    value={ouvert.note ?? ''}
                    onChange={e => setOuvert({ ...ouvert, note: e.target.value })}
                    onBlur={() => majRetourCrm(ouvert.id, { note: ouvert.note }).then(ok => ok && setList(l => l.map(x => x.id === ouvert.id ? ouvert : x)))}
                    style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
