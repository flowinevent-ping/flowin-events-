'use client'

/**
 * Tableaux lisibles sur telephone (audit ergonomie 17/11/2026, expert 5).
 *
 * Sous 760 px, chaque tableau de 4 colonnes et plus (ou plus large que l'ecran) du Super Admin et de
 * l'espace pro devient une pile de CARTES : une carte par ligne, chaque cellule precedee du titre de
 * sa colonne. L'en-tete reste visible (bandeau defilant) pour garder le TRI. Au-dela de 10 lignes, les
 * suivantes sont repliees derriere « Afficher 10 de plus » : plus de liste interminable a faire defiler.
 * Rien n'est retire : memes lignes, memes clics (ouverture de fiche), meme recherche, meme tri ; sur
 * ordinateur, aucun changement. Un tableau peut s'exclure avec l'attribut data-garder-table.
 *
 * Le composant ne touche qu'a des attributs (data-label, data-tm-*) et a un <tfoot> qu'il ajoute
 * lui-meme : React garde la main sur thead/tbody.
 */
import { useEffect } from 'react'

const PAS = 10
const MQ = '(max-width: 760px)'

const CSS = `
@media ${MQ} {
  table.tm-cartes, table.tm-cartes > tbody { display: block; width: 100% !important; min-width: 0 !important; }
  table.tm-cartes > thead { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 8px; }
  table.tm-cartes > thead > tr { display: flex; gap: 6px; }
  table.tm-cartes > thead > tr > th { display: block; flex-shrink: 0; white-space: nowrap; border: 1px solid var(--sa-border, #DCE4F2) !important; border-radius: 999px; padding: 8px 12px !important; min-height: 36px; box-sizing: border-box; background: #fff; }
  table.tm-cartes > thead > tr > th:empty { display: none; }
  table.tm-cartes > tbody > tr { display: block; background: #fff; border: 1px solid var(--sa-border, #DCE4F2); border-radius: 14px; margin: 0 0 10px; padding: 6px 12px; box-sizing: border-box; }
  table.tm-cartes > tbody > tr > td { display: grid; grid-template-columns: 34% minmax(0, 1fr); align-items: baseline; gap: 10px; width: auto !important; border: none !important; padding: 5px 0 !important; text-align: right; white-space: normal !important; min-width: 0 !important; max-width: none !important; word-break: break-word; }
  table.tm-cartes > tbody > tr > td[colspan], table.tm-cartes > tbody > tr > td[data-label=""] { display: block; text-align: center; }
  table.tm-cartes > tbody > tr > td > * { max-width: 100%; justify-self: end; }
  table.tm-cartes > tbody > tr > td::before { content: attr(data-label); text-align: left; font-size: 10.5px; overflow-wrap: normal; word-break: normal; hyphens: none; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: var(--sa-muted, #64748B); }
  table.tm-cartes > tbody > tr > td[data-label=""]::before { display: none; }
  table.tm-cartes > tbody > tr[data-tm-cache] { display: none !important; }
  table.tm-cartes > tfoot { display: block; }
  table.tm-cartes > tfoot td { display: block; padding: 0 !important; border: none !important; }
  .tm-plus { width: 100%; min-height: 48px; border-radius: 999px; border: 1.5px solid var(--fl-bleu, #3B5CC4); background: #fff; color: var(--fl-bleu, #3B5CC4); font-weight: 800; font-size: 14px; cursor: pointer; font-family: inherit; }
}
table > tfoot.tm-pied { display: none; }
@media ${MQ} { table.tm-cartes > tfoot.tm-pied { display: block; } }
`

function libelles(t: HTMLTableElement): string[] {
  const lignes = t.tHead ? t.tHead.rows : null
  if (!lignes || !lignes.length) return []
  const r = lignes[lignes.length - 1]
  const out: string[] = []
  for (let i = 0; i < r.cells.length; i++) {
    const c = r.cells[i]
    const txt = (c.innerText || c.textContent || '').replace(/[▲▼↑↓⇅]/g, '').trim()
    const span = c.colSpan || 1
    for (let k = 0; k < span; k++) out.push(txt)
  }
  return out
}

const limites = new WeakMap<HTMLTableElement, number>()

function traiterTable(t: HTMLTableElement, mobile: boolean) {
  if (t.hasAttribute('data-garder-table')) return
  const body = t.tBodies[0]
  if (!body) return
  if (!mobile) {
    if (t.classList.contains('tm-cartes')) t.classList.remove('tm-cartes')
    for (let i = 0; i < body.rows.length; i++) if (body.rows[i].hasAttribute('data-tm-cache')) body.rows[i].removeAttribute('data-tm-cache')
    return
  }
  const noms = libelles(t)
  if (!t.classList.contains('tm-cartes')) {
    const large = t.scrollWidth > window.innerWidth - 8
    if (noms.length < 4 && !large) return
    t.classList.add('tm-cartes')
  }
  const rows = body.rows
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells
    let col = 0
    for (let j = 0; j < cells.length; j++) {
      const lab = cells[j].colSpan > 1 && cells.length === 1 ? '' : (noms[col] || '')
      if (cells[j].getAttribute('data-label') !== lab) cells[j].setAttribute('data-label', lab)
      col += cells[j].colSpan || 1
    }
  }
  const lim = limites.get(t) || PAS
  for (let i = 0; i < rows.length; i++) {
    const cacher = i >= lim
    if (cacher !== rows[i].hasAttribute('data-tm-cache')) {
      if (cacher) rows[i].setAttribute('data-tm-cache', '1')
      else rows[i].removeAttribute('data-tm-cache')
    }
  }
  let pied = t.querySelector(':scope > tfoot.tm-pied') as HTMLTableSectionElement | null
  const reste = rows.length - lim
  if (reste > 0) {
    if (!pied) {
      pied = document.createElement('tfoot')
      pied.className = 'tm-pied'
      pied.innerHTML = '<tr><td><button type="button" class="tm-plus"></button></td></tr>'
      const b = pied.querySelector('button') as HTMLButtonElement
      b.addEventListener('click', () => { limites.set(t, (limites.get(t) || PAS) + PAS); traiterTable(t, true) })
      t.appendChild(pied)
    }
    const b = pied.querySelector('button') as HTMLButtonElement
    const txt = 'Afficher ' + Math.min(PAS, reste) + ' de plus (' + reste + ' restant' + (reste > 1 ? 's' : '') + ')'
    if (b.textContent !== txt) b.textContent = txt
  } else if (pied) {
    pied.remove()
  }
}

export default function TablesMobiles() {
  useEffect(() => {
    const mq = window.matchMedia(MQ)
    let planifie = 0
    const tout = () => {
      planifie = 0
      const tables = document.querySelectorAll('table')
      for (let i = 0; i < tables.length; i++) traiterTable(tables[i] as HTMLTableElement, mq.matches)
    }
    const plus_tard = () => { if (!planifie) planifie = window.requestAnimationFrame(tout) }
    const obs = new MutationObserver(plus_tard)
    obs.observe(document.body, { childList: true, subtree: true })
    const surMq = () => plus_tard()
    if (mq.addEventListener) mq.addEventListener('change', surMq)
    tout()
    return () => {
      obs.disconnect()
      if (planifie) window.cancelAnimationFrame(planifie)
      if (mq.removeEventListener) mq.removeEventListener('change', surMq)
    }
  }, [])
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />
}
