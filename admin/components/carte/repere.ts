/**
 * Repère de carte Flowin : UN SEUL dessin partout (validé par Romain le 24/11/2026).
 * Rond de 44 px, anneau #B5471E (vert #15803D une fois joué), logo du commerce ou, sans logo,
 * initiale du nom. Utilisé par SuperEventMap (page publique /se, cartes des tableaux de bord)
 * et par CarteCommerces (/carte-commerces, /dashboard/carte-reseau).
 */
import { initiale } from '@/lib/seReperes'

export const ANNEAU = '#B5471E'
export const ANNEAU_JOUE = '#15803D'
export const ANNEAU_CHOISI = '#1D4ED8'

export function creerRepere(p: { id: string; nom: string; logo?: string | null; joue?: boolean }): { el: HTMLDivElement; ring: HTMLDivElement } {
  const joue = !!p.joue
  const el = document.createElement('div')
  el.style.cssText = 'width:44px;height:44px;cursor:pointer'
  el.title = p.nom
  const ring = document.createElement('div')
  ring.setAttribute('data-repere', p.id)
  ring.style.cssText = `position:relative;width:44px;height:44px;border-radius:50%;background:${p.logo ? '#fff' : '#FED7AA'};border:4px solid ${joue ? ANNEAU_JOUE : ANNEAU};box-shadow:0 3px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;box-sizing:border-box;overflow:visible;transition:transform .25s,border-color .25s`
  if (p.logo) {
    const im = document.createElement('img')
    im.src = p.logo; im.alt = ''
    im.style.cssText = 'width:78%;height:78%;object-fit:contain;border-radius:50%'
    im.onerror = () => { im.remove(); ring.style.background = '#FED7AA'; ring.insertAdjacentText('afterbegin', initiale(p.nom)) }
    ring.appendChild(im)
  } else {
    ring.textContent = initiale(p.nom)
    ring.style.font = '800 16px sans-serif'
    ring.style.color = '#9A3412'
  }
  if (joue) {
    const c = document.createElement('span')
    c.textContent = '✓'
    c.style.cssText = 'position:absolute;right:-5px;top:-5px;width:18px;height:18px;border-radius:50%;background:#15803D;color:#fff;font:700 12px/18px sans-serif;text-align:center'
    ring.appendChild(c)
  }
  el.appendChild(ring)
  return { el, ring }
}

/** Commerce sélectionné : la pastille grossit et prend l'anneau bleu. */
export function marquerChoisi(ring: HTMLElement, choisi: boolean) {
  ring.style.transform = choisi ? 'scale(1.4)' : 'none'
  ring.style.zIndex = choisi ? '5' : ''
  ring.style.boxShadow = choisi ? '0 0 0 6px rgba(29,78,216,.25),0 3px 10px rgba(0,0,0,.4)' : '0 3px 8px rgba(0,0,0,.35)'
  ring.style.borderColor = choisi ? ANNEAU_CHOISI : (ring.querySelector('span') ? ANNEAU_JOUE : ANNEAU)
}
