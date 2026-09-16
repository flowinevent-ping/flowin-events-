import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { fetchOperationsPro } from '@/lib/operations'
import { fetchBanquesPro } from '@/lib/banques'
import ProShell from '@/components/pro/ProShell'
import EntrepriseForm from '@/components/pro/EntrepriseForm'
import { OngletOperationsPro } from '@/components/operations/BlocsOperations'
import { CHARTE_PRO as C } from '@/lib/charte'
import { CARD, H1, SUB, MUTED, BTN2 } from '@/lib/proui'

export const dynamic = 'force-dynamic'

const ONGLETS = [
  { id: 'entreprise', label: 'Mon entreprise' },
  { id: 'contrat', label: 'Contrats' },
  { id: 'banques', label: 'Banques de questions' },
] as const

/** MON COMPTE (P1) — coordonnees, contrats par operation, banques de questions. */
export default async function Page({ searchParams }: { searchParams: { pro?: string; onglet?: string } }) {
  const proId = searchParams.pro ?? ''
  const onglet = ONGLETS.find(o => o.id === searchParams.onglet)?.id ?? 'entreprise'
  const [data, ops, banques] = await Promise.all([fetchProDashboard(proId), fetchOperationsPro(proId), fetchBanquesPro(proId)])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (data.pro ?? {}) as any
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''
  const qo = q ? `${q}&` : '?'
  return (
    <ProShell proName={p.nom ?? 'Mon établissement'} proId={proId} active="compte">
      <h1 style={H1}>Mon compte</h1>
      <div style={{ ...SUB, marginBottom: 14 }}>Vos coordonnées, vos contrats et vos questions.</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {ONGLETS.map(o => (
          <Link key={o.id} href={`/pro/compte${qo}onglet=${o.id}`}
            style={{ borderRadius: 50, padding: '9px 18px', fontWeight: 800, fontSize: 13.5, textDecoration: 'none',
              background: onglet === o.id ? C.degrade : '#fff', color: onglet === o.id ? '#fff' : C.accent, border: onglet === o.id ? 'none' : `1.5px solid ${C.bordureChamp}` }}>
            {o.label}
          </Link>
        ))}
      </div>
      {onglet === 'entreprise' && (p.id
        ? <EntrepriseForm initial={{
            id: p.id, nom: p.nom ?? null, secteur: p.secteur ?? null, adresse: p.adresse ?? null,
            code_postal: p.code_postal ?? null, ville: p.ville ?? null, siret: p.siret ?? null,
            contact: p.contact ?? null, email: p.email ?? null, tel: p.tel ?? null, partenaire_id: p.partenaire_id ?? null,
          }} />
        : <div style={CARD}>Établissement introuvable.</div>)}
      {onglet === 'contrat' && <OngletOperationsPro initial={ops} onglet="contrat" />}
      {onglet === 'banques' && (
        <div style={CARD}>
          {banques.length === 0 && <div style={{ fontSize: 13.5, ...MUTED, marginBottom: 12 }}>Aucune banque de questions.</div>}
          {banques.map(b => (
            <Link key={b.id} href={`/pro/banques/${encodeURIComponent(b.id)}${q}`}
              style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '11px 0', borderBottom: `1px solid ${C.bordure}`, textDecoration: 'none', color: C.texte }}>
              <b>{b.nom}</b><span style={MUTED}>{(b.questions || []).length} questions · {b.statut === 'valide' ? 'validée' : 'brouillon'} →</span>
            </Link>
          ))}
          <Link href={`/pro/banques/nouvelle${q}`} style={{ ...BTN2, display: 'inline-block', textDecoration: 'none', marginTop: 14 }}>+ Créer une banque</Link>
        </div>
      )}
    </ProShell>
  )
}
