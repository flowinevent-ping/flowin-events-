'use client'

/**
 * REGLAGE DU TIRAGE (lot QR, 31/10) — choix client :
 *   - « Tirage manuel (un clic) » : le pro lance le tirage depuis Gagnants ;
 *   - « Tirage automatique le [date/heure] » : la fonction SQL
 *     tirage_auto_animations() (pg_cron, toutes les 15 min) tire les gagnants
 *     a l echeance et envoie le billet (sql/2026-11-01-tirage-auto-liste-gagnants.sql) ;
 *   - « Publier la liste des gagnants apres le tirage » : page publique
 *     /gagnants/[evId] (prenom + initiale, lot, date, commerce).
 *
 * Stockage : events.cfg.tirage = { mode: 'manuel' | 'auto', date: ISO | null }
 * et events.cfg.publierGagnants (booleen). Ecriture par fusion de cfg
 * (lecture puis mise a jour), comme le texte de diffusion.
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface ConfigTirage { mode: 'manuel' | 'auto'; date: string; publier: boolean }

const BRD = 'var(--sa-border, #E2E8F0)'
const MUT = 'var(--sa-muted, #64748B)'
const ACC = '#2563EB'

/** ISO -> valeur d un <input type="datetime-local"> (heure locale). */
export function isoVersLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => (n < 10 ? '0' : '') + n
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
export function localVersIso(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}
/** Texte lisible du tirage (affiche par les jeux via cfg.tirageDate). */
export function libelleDateTirage(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ' à ' +
    d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** Message bloquant, ou null si la configuration est valide. */
export function erreurTirage(c: ConfigTirage): string | null {
  if (c.mode !== 'auto') return null
  const iso = localVersIso(c.date)
  if (!iso) return 'Indiquez la date et l’heure du tirage automatique.'
  if (new Date(iso).getTime() < Date.now()) return 'La date du tirage automatique est passée.'
  return null
}

/** Les cles cfg a fusionner dans events.cfg. */
export function cfgDepuisTirage(c: ConfigTirage): Record<string, unknown> {
  const iso = c.mode === 'auto' ? localVersIso(c.date) : null
  return {
    tirage: { mode: c.mode, date: iso },
    publierGagnants: c.publier,
    ...(iso ? { tirageDate: libelleDateTirage(iso) } : {}),
  }
}
export function tirageDepuisCfg(cfg: Record<string, unknown> | null | undefined): ConfigTirage {
  const t = ((cfg ?? {}).tirage ?? {}) as { mode?: string; date?: string | null }
  return { mode: t.mode === 'auto' ? 'auto' : 'manuel', date: isoVersLocal(t.date ?? null), publier: (cfg ?? {}).publierGagnants === true }
}

const choix = (on: boolean): React.CSSProperties => ({
  flex: '1 1 200px', textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
  border: `1.5px solid ${on ? ACC : BRD}`, background: on ? 'rgba(37,99,235,.06)' : '#fff', color: '#0F172A',
})

/** Formulaire controle (utilise tel quel dans le parcours de creation). */
export function ChoixTirage({ value, onChange }: { value: ConfigTirage; onChange: (c: ConfigTirage) => void }) {
  const err = erreurTirage(value)
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={choix(value.mode === 'manuel')} onClick={() => onChange({ ...value, mode: 'manuel' })}>
          <b style={{ display: 'block', fontSize: 13 }}>Tirage manuel (un clic)</b>
          <span style={{ fontSize: 12, color: MUT }}>Vous lancez le tirage depuis l’écran Gagnants, quand vous voulez.</span>
        </button>
        <button type="button" style={choix(value.mode === 'auto')} onClick={() => onChange({ ...value, mode: 'auto' })}>
          <b style={{ display: 'block', fontSize: 13 }}>Tirage automatique</b>
          <span style={{ fontSize: 12, color: MUT }}>Flowin tire au sort à la date choisie et envoie le billet au gagnant.</span>
        </button>
      </div>
      {value.mode === 'auto' && (
        <label style={{ display: 'block', marginTop: 10 }}>
          <span style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 4 }}>Tirage automatique le</span>
          <input type="datetime-local" value={value.date} onChange={e => onChange({ ...value, date: e.target.value })}
            style={{ border: `1.5px solid ${BRD}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
          {err && <span style={{ display: 'block', fontSize: 12, color: '#B45309', fontWeight: 700, marginTop: 4 }}>{err}</span>}
        </label>
      )}
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={value.publier} onChange={e => onChange({ ...value, publier: e.target.checked })} style={{ width: 18, height: 18, marginTop: 1 }} />
        <span>
          <b style={{ display: 'block', fontSize: 13 }}>Publier la liste des gagnants après le tirage</b>
          <span style={{ fontSize: 12, color: MUT }}>Page publique : prénom et initiale du nom, lot, date et commerce. Rien d’autre.</span>
        </span>
      </label>
    </div>
  )
}

export const lienListeGagnants = (evId: string) => `/gagnants/${encodeURIComponent(evId)}`

/** Lien vers la page publique, ou mention qu elle n est pas publiee. */
export function LienListeGagnants({ evId, publie }: { evId: string; publie: boolean }) {
  if (!publie) return <span style={{ fontSize: 12, color: MUT }}>Liste des gagnants non publiée.</span>
  return (
    <a href={lienListeGagnants(evId)} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: ACC }}>
      Liste publique des gagnants ↗
    </a>
  )
}

/** Reglage enregistre sur un event existant (ecran Gagnants, pro et SA). */
export default function ReglageTirage({ evId }: { evId: string }) {
  const [c, setC] = useState<ConfigTirage | null>(null)
  const [etat, setEtat] = useState<'' | 'envoi' | 'ok' | 'ko'>('')
  const [ouvert, setOuvert] = useState(false)
  const [initial, setInitial] = useState<ConfigTirage | null>(null)
  useEffect(() => {
    let vivant = true
    supabase.from('events').select('cfg').eq('id', evId).maybeSingle().then(({ data }) => {
      if (!vivant) return
      const t = tirageDepuisCfg(((data as { cfg: Record<string, unknown> | null } | null)?.cfg) ?? {})
      setC(t); setInitial(t)
    })
    return () => { vivant = false }
  }, [evId])
  if (!c || !initial) return null

  async function enregistrer() {
    if (!c || erreurTirage(c)) return
    setEtat('envoi')
    const { data } = await supabase.from('events').select('cfg').eq('id', evId).maybeSingle()
    const actuel = ((data as { cfg: Record<string, unknown> | null } | null)?.cfg) ?? {}
    const { error } = await supabase.from('events').update({ cfg: { ...actuel, ...cfgDepuisTirage(c) } }).eq('id', evId)
    setEtat(error ? 'ko' : 'ok')
    if (!error) setInitial(c)
  }

  const resume = initial.mode === 'auto'
    ? `Tirage automatique le ${libelleDateTirage(localVersIso(initial.date))}`
    : 'Tirage manuel (un clic)'
  return (
    <div style={{ border: `1px solid ${BRD}`, borderRadius: 12, padding: 12, marginBottom: 12, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Mode de tirage</div>
          <div style={{ fontSize: 12, color: MUT }}>{resume} · {initial.publier ? 'liste des gagnants publiée' : 'liste des gagnants non publiée'}</div>
        </div>
        <LienListeGagnants evId={evId} publie={initial.publier} />
        <button type="button" onClick={() => setOuvert(o => !o)}
          style={{ padding: '6px 11px', borderRadius: 8, border: `1.5px solid ${BRD}`, background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {ouvert ? '▲ Fermer' : '▼ Modifier'}
        </button>
      </div>
      {ouvert && (
        <div style={{ marginTop: 10 }}>
          <ChoixTirage value={c} onChange={v => { setC(v); setEtat('') }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
            <button type="button" disabled={etat === 'envoi' || !!erreurTirage(c)} onClick={enregistrer}
              style={{ padding: '7px 13px', borderRadius: 8, border: 'none', background: ACC, color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: erreurTirage(c) ? 0.5 : 1 }}>
              {etat === 'envoi' ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {etat === 'ok' && <span style={{ fontSize: 12, color: '#15803D', fontWeight: 700 }}>Enregistré.</span>}
            {etat === 'ko' && <span style={{ fontSize: 12, color: '#B45309', fontWeight: 700 }}>Échec, réessayez.</span>}
          </div>
        </div>
      )}
    </div>
  )
}
