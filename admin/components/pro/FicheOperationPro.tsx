'use client'

/**
 * FICHE D UNE OPERATION (P1, 16/09) — tout ce qui concerne UNE operation
 * (event ou super event), au meme endroit, en onglets. Les contenus sont
 * ceux des blocs deja utilises cote SA et cote pro (BlocsOperations).
 */
import { useState } from 'react'
import { fetchOperationsPro, libelleDates, libelleModule, libelleStatut, type OperationsPro } from '@/lib/operations'
import { ContenuLots, ContenuComm, ContenuContrat, ContenuTracking } from '@/components/operations/BlocsOperations'
import { ContenuCrm } from '@/components/operations/DataOperation'
import { BlocGagnants } from '@/components/pro/GagnantsClient'
import ApercuJeu from '@/components/parcours/ApercuJeu'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, MUTED, BTN2 } from '@/lib/proui'

export const ONGLETS_OP = [
  { id: 'jeu', label: 'Jeu' },
  { id: 'lots', label: 'Lots' },
  { id: 'diffusion', label: 'Diffusion' },
  { id: 'gagnants', label: 'Gagnants' },
  { id: 'trafic', label: 'Trafic' },
  { id: 'crm', label: 'Contacts' },
  { id: 'contrat', label: 'Contrat' },
] as const
export type OngletOp = typeof ONGLETS_OP[number]['id']

export default function FicheOperationPro({ initial, cle, onglet: ongletInitial }: { initial: OperationsPro; cle: string; onglet: OngletOp }) {
  const [data, setData] = useState(initial)
  const [onglet, setOnglet] = useState<OngletOp>(ongletInitial)
  const [station, setStation] = useState<string | null>(null)
  const recharger = () => { fetchOperationsPro(initial.proId).then(setData) }
  const op = data.operations.find(o => o.cle === cle)
  const q = `?pro=${encodeURIComponent(initial.proId)}`
  if (!op) return <div style={CARD}>Opération introuvable. <a href={`/pro${q}`} style={{ color: C.accent, fontWeight: 700 }}>Mes opérations</a></div>
  const pt = data.partenaire
  const st = op.stations.find(s => s.id === station) ?? op.stations[0]

  function changer(o: OngletOp) {
    setOnglet(o)
    try {
      const u = new URL(window.location.href)
      u.searchParams.set('onglet', o)
      window.history.replaceState(null, '', u.toString())
    } catch { /* rien */ }
  }

  return (
    <div>
      <a href={`/pro${q}`} style={{ fontSize: 13, fontWeight: 700, color: C.accent, textDecoration: 'none' }}>← Mes opérations</a>
      <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginTop: 10 }}>
        <div style={{ background: `linear-gradient(180deg,${C.accent},${C.accentFonce})`, color: '#fff', padding: '20px 22px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.filet }} />
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: 0.8 }}>
            {op.type === 'super' ? 'Super event' : 'Animation'} · {libelleStatut(op.status)}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{op.nom}</div>
          <div style={{ fontSize: 13.5, opacity: 0.9, marginTop: 2 }}>
            {libelleDates(op.dateD, op.dateF)} · {op.type === 'super' ? `${op.stations.length} station${op.stations.length > 1 ? 's' : ''}` : libelleModule(op.stations[0]?.module)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '12px 14px', overflowX: 'auto' }}>
          {ONGLETS_OP.map(o => (
            <button key={o.id} onClick={() => changer(o.id)}
              style={{ border: 'none', borderRadius: 50, padding: '9px 16px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', whiteSpace: 'nowrap',
                background: onglet === o.id ? C.degrade : C.subtil, color: onglet === o.id ? '#fff' : C.accent }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div style={CARD}>
        {onglet === 'jeu' && st && (
          <div className="nop-grille">
            <style>{`.nop-grille{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:26px;align-items:start}
              @media (max-width:1020px){.nop-grille{grid-template-columns:1fr}}`}</style>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{libelleModule(st.module)}</div>
              <div style={{ fontSize: 13, ...MUTED, marginTop: 3, marginBottom: 14 }}>
                {op.type === 'super' ? 'Le jeu du super event, identique sur chaque station.' : 'Le jeu de votre animation, tel que vos clients le voient.'}
              </div>
              {op.type === 'super' && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: C.attenue, marginBottom: 6 }}>
                    {op.stations.length > 1 ? 'Vos stations' : 'Votre station'}
                  </div>
                  {op.stations.map(s => (
                    <button key={s.id} onClick={() => setStation(s.id)}
                      style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 6, borderRadius: 14, padding: '10px 14px', cursor: 'pointer',
                        border: s.id === st.id ? `2px solid ${C.magenta}` : `1.5px solid ${C.bordureChamp}`, background: s.id === st.id ? 'rgba(224,33,138,.07)' : C.champ }}>
                      <b>{s.nom}</b> <span style={MUTED}>· {s.participants ?? 0} participations</span>
                    </button>
                  ))}
                  <a href={`/pro/super${q}&se=${encodeURIComponent(op.id)}`} style={{ ...BTN2, display: 'inline-block', textDecoration: 'none', marginTop: 8 }}>Carte et bilan du super event</a>
                </>
              )}
              {op.type === 'event' && (
                <a href={`/pro/super/${encodeURIComponent(st.id)}${q}`} style={{ ...BTN2, display: 'inline-block', textDecoration: 'none' }}>Activité détaillée</a>
              )}
            </div>
            <ApercuJeu module={st.module} eventId={st.id} saisie={{}} titre="Votre jeu en ce moment" />
          </div>
        )}
        {onglet === 'lots' && <ContenuLots op={op} />}
        {onglet === 'diffusion' && <ContenuComm op={op} partenaireId={pt?.id ?? null} partenaireSe={pt?.super_event_id ?? null} mode="pro" />}
        {onglet === 'gagnants' && <BlocGagnants op={op} data={data} onChange={recharger} />}
        {onglet === 'trafic' && <ContenuTracking op={op} proId={data.proId} onStation={id => { window.location.href = `/pro/super/${encodeURIComponent(id)}${q}` }} />}
        {onglet === 'crm' && <ContenuCrm op={op} />}
        {onglet === 'contrat' && <ContenuContrat op={op} mode="pro" partenaireId={pt?.id ?? null} onChange={recharger} />}
      </div>
    </div>
  )
}
