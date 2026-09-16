import type { Metadata } from 'next'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fetchOperationsPro, libelleDates, libelleModule } from '@/lib/operations'
import { ONGLETS_OP, LIBELLE_PERIODE, periodeOperation, type Periode } from '@/lib/ongletsOperation'
import { rangerOperations } from '@/lib/rangementOperations'
import ProShell from '@/components/pro/ProShell'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, MUTED, H1, SUB, BTN, BTN2 } from '@/lib/proui'

export const metadata: Metadata = { title: 'Mes opérations — Flowin Pro' }
export const dynamic = 'force-dynamic'

interface Props { searchParams: { pro?: string; ev?: string; periode?: string } }

const PERIODES: { id: Periode | ''; label: string }[] = [
  { id: '', label: 'Toutes' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'a_venir', label: 'À venir' },
  { id: 'terminee', label: 'Terminées' },
]

/**
 * MES OPERATIONS — la porte d entree du pro. Rangement (Romain, 16/09 soir) :
 * par type (Animations, Super events), puis par date ; filtre par periode.
 * Une vignette s ouvre sur la fiche de l operation (/pro/operation).
 */
export default async function ProAccueilPage({ searchParams }: Props) {
  let proId = searchParams.pro ?? ''
  const evId = searchParams.ev ?? ''
  if (!proId && evId) {
    const { data: ev } = await supabase.from('events').select('pro_id').eq('id', evId).single()
    proId = ev?.pro_id ?? ''
  }
  const ops = await fetchOperationsPro(proId)
  const proName = ops.proNom ?? 'Mon établissement'
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const lien = (cle: string, onglet?: string) => `/pro/operation${q}${q ? '&' : '?'}op=${encodeURIComponent(cle)}${onglet ? `&onglet=${onglet}` : ''}`
  const periode = (PERIODES.find(p => p.id && p.id === searchParams.periode)?.id || null) as Periode | null
  const groupes = rangerOperations(ops.operations, periode)
  const chiffre = (v: number, l: string) => (
    <div style={{ flex: '1 1 70px', background: C.subtil, borderRadius: 12, padding: '8px 10px' }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: C.accent, lineHeight: 1.15 }}>{v}</div>
      <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', ...MUTED }}>{l}</div>
    </div>
  )

  return (
    <ProShell proName={proName} proId={proId} active="operations">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={H1}>Mes opérations</h1>
          <div style={SUB}>Animations et super events, rangés par date.</div>
        </div>
        <Link href={`/pro/parcours${q}`} style={{ ...BTN2, textDecoration: 'none' }}>Parcours mobil</Link>
        <Link href={`/pro/nouvelle${q}`} style={{ ...BTN, textDecoration: 'none' }}>+ Nouvelle opération</Link>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {PERIODES.map(p => {
          const on = (p.id || null) === periode
          const href = `/pro${q}${p.id ? `${q ? '&' : '?'}periode=${p.id}` : ''}`
          return (
            <Link key={p.id || 'toutes'} href={href}
              style={{ borderRadius: 50, padding: '8px 16px', fontWeight: 800, fontSize: 13, textDecoration: 'none',
                background: on ? C.degrade : '#fff', color: on ? '#fff' : C.accent, border: on ? 'none' : `1.5px solid ${C.bordureChamp}` }}>
              {p.label}
            </Link>
          )
        })}
      </div>

      {groupes.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: 30 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{ops.operations.length ? 'Aucune opération sur cette période' : 'Aucune opération pour le moment'}</div>
          <div style={{ fontSize: 13.5, ...MUTED, margin: '6px 0 16px' }}>Créez votre animation ou rejoignez un super event.</div>
          <Link href={`/pro/nouvelle${q}`} style={{ ...BTN, textDecoration: 'none' }}>Commencer</Link>
        </div>
      )}

      {groupes.map(g => (
        <section key={g.titre} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '0 2px 12px', borderBottom: `2px solid ${C.bordure}`, paddingBottom: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{g.titre}</h2>
            <span style={{ fontSize: 13, fontWeight: 700, ...MUTED }}>{g.ops.length}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))', gap: 14 }}>
            {g.ops.map(op => {
              const parties = op.stations.reduce((n, s) => n + (s.participants ?? 0), 0)
              const remis = op.gagnants.filter(x => x.etat === 'retire').length
              const lotsTotal = op.lots.reduce((n, l) => n + (l.quantite || 0), 0)
              const per = periodeOperation(op.dateD, op.dateF, op.status)
              return (
                <div key={op.cle} style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
                  <Link href={lien(op.cle)} style={{ textDecoration: 'none', color: '#fff' }}>
                    <div style={{ background: `linear-gradient(135deg,${C.accent},${C.accentFonce})`, padding: '14px 18px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: C.filet }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{libelleDates(op.dateD, op.dateF)}</span>
                        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', borderRadius: 50, padding: '3px 9px', whiteSpace: 'nowrap', flexShrink: 0,
                          background: per === 'en_cours' ? C.magenta : 'rgba(255,255,255,.18)' }}>{LIBELLE_PERIODE[per]}</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 6, lineHeight: 1.2 }}>{op.nom}</div>
                      <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>
                        {libelleModule(op.stations[0]?.module)}
                        {op.type === 'super' ? ` · ${op.stations.length > 1 ? `${op.stations.length} stations` : `station : ${op.stations[0]?.nom ?? '—'}`}` : ''}
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {chiffre(parties, 'parties')}
                      {chiffre(lotsTotal, 'lots')}
                      {chiffre(op.gagnants.length, 'gagnants')}
                      {chiffre(op.gagnants.length - remis, 'à remettre')}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                      {ONGLETS_OP.map(o => (
                        <Link key={o.id} href={lien(op.cle, o.id)} style={{ ...BTN2, padding: '6px 12px', fontSize: 12.5, textDecoration: 'none' }}>{o.label}</Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </ProShell>
  )
}
