'use client'

/**
 * LISTE CRM — le gabarit UNIQUE de toutes les listes du dashboard.
 *
 * Romain, 02/09 : « toutes les listes nommées CRM ou listes d'info type Excel
 * doivent être présentées de la même manière [...] le format liste CRM liste
 * des gagnants est le bon format, fais la même chose partout avec les infos
 * qui leur sont propres », et « rangé par catégorie et sous-catégorie : event,
 * pro ».
 *
 * Ce composant est donc la Liste des gagnants EXTRAITE, pas une nouvelle
 * invention : mêmes classes CSS (`sa-tbl`, `sa-btn sm`, `sa-input`), même barre
 * recherche + boutons de filtre + sélecteur aligné à droite, même en-tête
 * cliquable avec la flèche ▲/▼, même clic de ligne qui ouvre une fiche.
 *
 * CE QU'IL AJOUTE, et c'est tout :
 *   - un regroupement à DEUX niveaux (catégorie -> sous-catégorie), repliable,
 *     avec le compte par groupe ;
 *   - la possibilité de n'avoir aucun groupement (`categorie` non fourni), et
 *     on retombe alors exactement sur le tableau plat d'origine.
 *
 * Il ne charge AUCUNE donnée et n'en écrit aucune : on lui passe des lignes
 * deja chargées par l'appelant, il les filtre, les trie et les affiche.
 */

import { Fragment, useMemo, useState } from 'react'
import { EmptyState, PageHeader, SearchBar } from './DashboardUI'

/** Une colonne : ce qu'on affiche, et sur quelle valeur on trie et on cherche. */
export interface ColonneCRM<T> {
  id: string
  label: string
  /** Valeur brute — sert au TRI et à la RECHERCHE. Jamais affichée telle quelle si `rendu` existe. */
  valeur: (l: T) => string | number | null | undefined
  /** Affichage riche (chips, sous-ligne grise, code…). À défaut, `valeur` est affichée. */
  rendu?: (l: T) => React.ReactNode
  /** Colonne exclue de la recherche plein texte (ex. une date déjà formatée). */
  horsRecherche?: boolean
  style?: React.CSSProperties
}

/** Un bouton de filtre, comme « Tous / En attente / Confirmés / Utilisés ». */
export interface FiltreCRM<T> {
  id: string
  label: string
  /** `undefined` = ne filtre rien (le bouton « Tous »). */
  test?: (l: T) => boolean
}

/** Un sélecteur aligné à droite, comme « Tous les pros ». */
export interface SelecteurCRM {
  id: string
  libelleTout: string
  options: { id: string; label: string }[]
  valeur: string
  onChange: (v: string) => void
}

export interface ListeCRMProps<T> {
  titre: string
  sousTitre?: string
  /** `null` = chargement en cours (le sous-titre le dit, comme sur Gagnants). */
  lignes: T[] | null
  colonnes: ColonneCRM<T>[]
  cle: (l: T) => string
  /** Clic sur une ligne. Absent = lignes non cliquables (curseur par défaut). */
  onLigne?: (l: T) => void
  /** Colonne triée au départ. À défaut, la première. */
  triDefaut?: string
  /** Tri décroissant au départ (utile pour les dates). */
  triDescendant?: boolean
  placeholderRecherche?: string
  filtres?: FiltreCRM<T>[]
  selecteurs?: SelecteurCRM[]
  /** Niveau 1 du rangement — typiquement le super event, ou l'event. */
  categorie?: (l: T) => { id: string; label: string }
  /** Niveau 2 — typiquement l'event, ou le pro. */
  sousCategorie?: (l: T) => { id: string; label: string }
  /** Ligne d'explication sous les filtres (la légende des états sur Gagnants). */
  legende?: React.ReactNode
  /** Boutons à droite du titre (export CSV…). */
  actions?: React.ReactNode
  /** Encart libre entre les filtres et le tableau. */
  entete?: React.ReactNode
  videTitre?: string
  videDesc?: string
}

const texte = (v: unknown) => (v === null || v === undefined ? '' : String(v))

export default function ListeCRM<T>({
  titre, sousTitre, lignes, colonnes, cle, onLigne,
  triDefaut, triDescendant = false, placeholderRecherche = 'Rechercher…',
  filtres, selecteurs, categorie, sousCategorie, legende, actions, entete,
  videTitre = 'Aucun résultat', videDesc,
}: ListeCRMProps<T>) {
  const [q, setQ] = useState('')
  const [filtre, setFiltre] = useState(filtres?.[0]?.id ?? '')
  const [triCol, setTriCol] = useState(triDefaut ?? colonnes[0]?.id ?? '')
  const [triAsc, setTriAsc] = useState(!triDescendant)
  const [replies, setReplies] = useState<Record<string, boolean>>({})

  const trier = (id: string) => {
    if (id === triCol) setTriAsc(a => !a)
    else { setTriCol(id); setTriAsc(true) }
  }
  const fleche = (id: string) => (triCol === id ? (triAsc ? ' ▲' : ' ▼') : '')

  const visibles = useMemo(() => {
    const base = lignes ?? []
    const f = filtres?.find(x => x.id === filtre)
    const apresFiltre = f?.test ? base.filter(f.test) : base

    const t = q.trim().toLowerCase()
    const apresRecherche = t
      ? apresFiltre.filter(l =>
          colonnes.some(c => !c.horsRecherche && texte(c.valeur(l)).toLowerCase().includes(t)))
      : apresFiltre

    const col = colonnes.find(c => c.id === triCol)
    if (!col) return apresRecherche
    const sens = triAsc ? 1 : -1
    return apresRecherche.slice().sort((a, b) => {
      const va = col.valeur(a), vb = col.valeur(b)
      // Les valeurs manquantes vont toujours en bas, quel que soit le sens :
      // sinon une colonne à moitié vide « remonte » du vide en tête de liste.
      const aVide = va === null || va === undefined || va === ''
      const bVide = vb === null || vb === undefined || vb === ''
      if (aVide && bVide) return 0
      if (aVide) return 1
      if (bVide) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sens
      return texte(va).localeCompare(texte(vb), 'fr', { numeric: true }) * sens
    })
  }, [lignes, filtres, filtre, q, colonnes, triCol, triAsc])

  /* Regroupement. Sans `categorie`, un seul groupe anonyme : on retombe
     exactement sur le tableau plat de la Liste des gagnants. */
  const groupes = useMemo(() => {
    if (!categorie) return [{ id: '', label: '', sous: [{ id: '', label: '', lignes: visibles }] }]
    const ordre: string[] = []
    const par: Record<string, { label: string; sousOrdre: string[]; sous: Record<string, { label: string; lignes: T[] }> }> = {}
    visibles.forEach(l => {
      const c = categorie(l)
      if (!par[c.id]) { par[c.id] = { label: c.label, sousOrdre: [], sous: {} }; ordre.push(c.id) }
      const s = sousCategorie ? sousCategorie(l) : { id: '', label: '' }
      const g = par[c.id]
      if (!g.sous[s.id]) { g.sous[s.id] = { label: s.label, lignes: [] }; g.sousOrdre.push(s.id) }
      g.sous[s.id].lignes.push(l)
    })
    return ordre.map(id => ({
      id,
      label: par[id].label,
      sous: par[id].sousOrdre.map(sid => ({ id: sid, label: par[id].sous[sid].label, lignes: par[id].sous[sid].lignes })),
    }))
  }, [visibles, categorie, sousCategorie])

  const nb = visibles.length
  const sousTitreCalcule = lignes === null
    ? 'Chargement…'
    : sousTitre ?? `${nb} résultat${nb > 1 ? 's' : ''}`

  const cellules = (l: T) => colonnes.map(c => (
    <td key={c.id} style={c.style}>{c.rendu ? c.rendu(l) : (texte(c.valeur(l)) || '—')}</td>
  ))

  const corps = (lot: T[]) => lot.map(l => (
    <tr
      key={cle(l)}
      onClick={onLigne ? () => onLigne(l) : undefined}
      style={{ cursor: onLigne ? 'pointer' : 'default' }}
    >
      {cellules(l)}
    </tr>
  ))

  return (
    <>
      <PageHeader title={titre} subtitle={sousTitreCalcule} actions={actions} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <SearchBar value={q} onChange={setQ} placeholder={placeholderRecherche} />
        {filtres?.map(f => (
          <button key={f.id} className={`sa-btn sm${filtre === f.id ? ' primary' : ''}`} onClick={() => setFiltre(f.id)}>
            {f.label}
          </button>
        ))}
        {selecteurs?.map((s, i) => (
          <select
            key={s.id}
            className="sa-input"
            style={{ marginLeft: i === 0 ? 'auto' : undefined, width: 'auto', fontSize: 12.5, padding: '6px 10px' }}
            value={s.valeur}
            onChange={e => s.onChange(e.target.value)}
          >
            <option value="">{s.libelleTout}</option>
            {s.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {legende && <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginBottom: 12 }}>{legende}</div>}
      {entete}

      {lignes !== null && nb === 0 && <EmptyState title={videTitre} desc={videDesc} />}

      {nb > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-tbl" style={{ width: '100%' }}>
            <thead>
              <tr>
                {colonnes.map(c => (
                  <th key={c.id} onClick={() => trier(c.id)} title={`Trier par ${c.label}`}>
                    {c.label}{fleche(c.id)}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Sans catégorie, un seul tbody : le tableau plat d'origine. */}
            {!categorie && <tbody>{corps(visibles)}</tbody>}

            {categorie && groupes.map(g => {
              const total = g.sous.reduce((n, s) => n + s.lignes.length, 0)
              const replie = replies[g.id]
              return (
                <tbody key={g.id}>
                  <tr className="sa-crm-cat" onClick={() => setReplies(r => ({ ...r, [g.id]: !r[g.id] }))}>
                    <td colSpan={colonnes.length}>
                      <span className="chev">{replie ? '▸' : '▾'}</span>
                      <span className="lbl">{g.label}</span>
                      <span className="n">{total}</span>
                    </td>
                  </tr>
                  {!replie && g.sous.map(s => (
                    <Fragment key={`${g.id}/${s.id}`}>
                      {sousCategorie && s.label && (
                        <tr className="sa-crm-sous">
                          <td colSpan={colonnes.length}>
                            <span className="lbl">{s.label}</span>
                            <span className="n">{s.lignes.length}</span>
                          </td>
                        </tr>
                      )}
                      {corps(s.lignes)}
                    </Fragment>
                  ))}
                </tbody>
              )
            })}
          </table>
        </div>
      )}
    </>
  )
}
