'use client'

import { libelleModule } from '@/lib/operations'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CHARTE_PRO as C, ACCENT_SUPER } from '@/lib/charte'
import { estModuleMaster, ECRANS_APERCU, urlApercuMaster } from '@/lib/masters/apercu'

/**
 * APERCU DU PARCOURS JOUEUR — refonte du 01/11 : les MASTERS de jeux.
 *
 * Meme page que le joueur, le Super Admin et l'espace pro : /jouer
 * (admin/app/jouer, maquettes validees). Les jeux Quiz + bonus, Quiz solo,
 * Roue, Tombola et Vote s'affichent donc avec leur master ; l'univers comics
 * du super event pour l'onglet « super event ». Les modules qui ne sont pas
 * des masters (Quiz Master, NDS 2026) gardent leur ancien parcours, inchange.
 *
 * Cadre telephone clair (plus de coque noire), pastilles d'ecrans comme le
 * storyboard des maquettes, fleches precedent / suivant (postMessage), retour
 * et historique geres par la page /jouer elle-meme.
 */

type Ev = { id: string; module: string; nom: string; super_event_id?: string | null }

/** Cadre telephone clair, aux dimensions des maquettes (390 px de large). */
export function Phone({ src, empty, iframeRef }: { src?: string; empty?: string; iframeRef?: React.RefObject<HTMLIFrameElement | null> }) {
  const W = 280, SCALE = W / 390, H = Math.round(844 * SCALE)
  return (
    <div style={{ width: W + 22, flexShrink: 0 }}>
      <div style={{ borderRadius: 38, padding: 10, background: '#fff', border: `1.5px solid ${C.bordureChamp}`, boxShadow: '0 24px 50px rgba(27,58,92,.12), 0 6px 16px rgba(27,58,92,.06)' }}>
        <div style={{ borderRadius: 28, overflow: 'hidden', background: C.fond, width: W, height: H, position: 'relative', boxShadow: `0 0 0 1.5px ${C.bordure}` }}>
          {src ? (
            <iframe
              key={src}
              ref={iframeRef}
              src={src}
              title="Aperçu du parcours"
              loading="lazy"
              style={{ width: 390, height: 844, border: 0, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', color: C.attenue, fontSize: 13.5, lineHeight: 1.5 }}>{empty}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ParcoursMobil({ events = [], showTitle = true }: { events?: Ev[]; showTitle?: boolean }) {
  /* Noms des super events, pour titrer les groupes du selecteur. */
  const [supers, setSupers] = useState<Record<string, string>>({})
  useEffect(() => {
    supabase.from('super_events').select('id,nom').then(({ data }) => {
      const m: Record<string, string> = {}
      ;((data ?? []) as { id: string; nom: string }[]).forEach(x => { m[x.id] = x.nom })
      setSupers(m)
    })
  }, [])
  const [tab, setTab] = useState<'event' | 'super'>('event')
  const [evId, setEvId] = useState(events[0]?.id ?? '')
  const [ecran, setEcran] = useState('s-accueil')
  const ev = events.find(e => e.id === evId) ?? events[0]
  const multistation = !!ev?.super_event_id
  const groupes = events.reduce<{ cle: string; nom: string; evs: Ev[] }[]>((acc, e) => {
    const cle = e.super_event_id ?? ''
    let g = acc.find(x => x.cle === cle)
    if (!g) { g = { cle, nom: cle ? (supers[cle] ?? cle) : 'Animations autonomes', evs: [] }; acc.push(g) }
    g.evs.push(e)
    return acc
  }, [])

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const naviguer = (sens: 'next' | 'prev') => {
    try { iframeRef.current?.contentWindow?.postMessage({ flowinNav: sens }, window.location.origin) } catch { /* iframe pas encore chargee */ }
  }

  const master = !!ev && estModuleMaster(ev.module)
  /* Onglet animation : le master du jeu. Onglet super event : l'univers comics
     du super event de la station, ou son exemple si l'animation est seule. */
  let url = ''
  if (ev) {
    if (tab === 'super') url = urlApercuMaster({ superEventId: multistation ? ev.super_event_id : null, master: 'super' })
    else if (master) url = urlApercuMaster({ evId: ev.id, ecran })
    else url = `/parcours/${ev.module}?ev=${encodeURIComponent(ev.id)}&preview=1`
  }
  const phoneUrl = url && url.indexOf('/jouer') !== 0 ? `${url}&bar=0` : url
  const empty = 'Aucune animation à prévisualiser pour le moment.'

  const tabBtn = (t: 'event' | 'super', label: string, sous: string) => {
    const c = t === 'super' ? ACCENT_SUPER : C.violet
    return (
      <button onClick={() => { setTab(t); setEcran(t === 'super' ? 'sj-accueil' : 's-accueil') }} style={{ flex: 1, textAlign: 'left', padding: '13px 16px', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', border: tab === t ? `2px solid ${c}` : `1.5px solid ${C.bordure}`, background: tab === t ? (t === 'super' ? '#FFF8EA' : C.violetClair) : '#fff' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: tab === t ? c : C.texte }}>{label}</div>
        <div style={{ fontSize: 11.5, color: C.attenue, marginTop: 2 }}>{sous}</div>
      </button>
    )
  }

  return (
    <div>
      {showTitle && (<>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Parcours mobil</div>
        <div style={{ fontSize: 13.5, color: C.attenue, marginTop: 2, marginBottom: 18 }}>Le vrai parcours joueur, en direct, avec les masters de jeux. Choisissez une animation et prévisualisez-la telle qu’elle s’affiche sur mobile.</div>
      </>)}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {tabBtn('event', 'Parcours animation', 'Votre animation, en direct')}
        {tabBtn('super', 'Parcours super event', multistation ? 'L’univers super event de la station' : 'L’univers super event (exemple)')}
      </div>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start', flexWrap: 'wrap', paddingLeft: 4 }}>
        <div style={{ flex: '0 1 360px', minWidth: 260, maxWidth: 400, order: 1 }}>
          {events.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: C.attenue, marginBottom: 8 }}>Animation à prévisualiser</div>
              <select
                value={ev?.id ?? ''}
                onChange={e => { setEvId(e.target.value); setEcran(tab === 'super' ? 'sj-accueil' : 's-accueil') }}
                style={{ width: '100%', maxWidth: 360, padding: '11px 12px', borderRadius: 13, border: `1.5px solid ${C.bordureChamp}`, background: '#fff', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: C.texte, cursor: 'pointer' }}
              >
                {groupes.map(g => (
                  <optgroup key={g.cle || 'autonomes'} label={g.nom}>
                    {g.evs.map(e => (
                      <option key={e.id} value={e.id}>{e.nom} — {libelleModule(e.module)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {tab === 'event' && master && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: C.attenue, marginBottom: 8 }}>Écran</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ECRANS_APERCU.map(x => {
                  const id = x.id === '@jeu' && ev ? x.jeu(ev.module) : x.id
                  const on = ecran === id
                  return (
                    <button key={x.id} onClick={() => setEcran(id)} style={{ padding: '7px 13px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12.5, border: `1.5px solid ${on ? C.violet : C.bordureChamp}`, background: on ? C.violetClair : '#fff', color: on ? '#5B34C2' : C.texte }}>{x.t}</button>
                  )
                })}
              </div>
            </div>
          )}

          {url && (
            <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '11px 18px', borderRadius: 100, background: C.violet, color: '#fff', fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Ouvrir en plein écran ↗</a>
          )}

          <p style={{ fontSize: 12, color: C.attenue, marginTop: 14, lineHeight: 1.5, maxWidth: 360 }}>
            Le <b>vrai parcours</b>, le même que celui du joueur et de l’espace pro (masters de jeux).{' '}
            {tab === 'event'
              ? (master ? 'Touchez les pastilles pour passer d’un écran à l’autre, ou jouez directement dans le cadre : le bouton Retour et le retour du navigateur fonctionnent.' : 'Ce jeu n’a pas de master : son parcours historique est affiché.')
              : (multistation ? 'Carte des stations, super tickets et grand tirage de l’opération.' : 'Cette animation n’appartient à aucun super event : le cadre montre l’univers super event en exemple.')}
          </p>
        </div>

        <div className="pm-rangee" style={{ order: 2, display: 'flex', alignItems: 'center', gap: 10, maxWidth: '100%' }}>
          {/* Petit ecran (390 px) : le cadre telephone + 2 fleches depassait la largeur ; les fleches passent sous le cadre. */}
          <style dangerouslySetInnerHTML={{ __html: '@media (max-width:520px){.pm-rangee{flex-wrap:wrap;justify-content:center;width:100%}.pm-rangee>div{order:1;flex:0 0 100%;display:flex;justify-content:center}.pm-rangee>button{order:2}}' }} />
          {url && (
            <button onClick={() => naviguer('prev')} aria-label="Écran précédent"
              style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C.bordureChamp}`, background: '#fff', cursor: 'pointer', fontSize: 16, color: C.texte }}>‹</button>
          )}
          <Phone src={phoneUrl || undefined} empty={empty} iframeRef={iframeRef} />
          {url && (
            <button onClick={() => naviguer('next')} aria-label="Écran suivant"
              style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${C.bordureChamp}`, background: '#fff', cursor: 'pointer', fontSize: 16, color: C.texte }}>›</button>
          )}
        </div>
      </div>
    </div>
  )
}
