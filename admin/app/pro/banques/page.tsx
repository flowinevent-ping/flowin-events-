import Link from 'next/link'
import { fetchProDashboard } from '@/lib/pro'
import { fetchBanquesPro, type Banque } from '@/lib/banques'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB, ACC } from '@/lib/proui'

/**
 * Mes banques de questions -- sous-categories nommees par le pro (demande Romain, 28/07/2026),
 * regroupees Quiz (culture generale, notee, tirage/instantane) vs Sondage bonus (statistiques
 * clients, pas de bonne/mauvaise reponse). Reutilise integralement la table `banques` deja en
 * production (pro_id, nom, tags, questions) -- aucune nouvelle table.
 */
function estBonus(b: Banque): boolean { return b.tags?.includes('bonus') }

export default async function ProBanquesPage({ searchParams }: { searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, banques] = await Promise.all([fetchProDashboard(proId), fetchBanquesPro(proId)])
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  const quiz = banques.filter(b => !estBonus(b))
  const bonus = banques.filter(estBonus)

  const Groupe = ({ titre, sous, items, tagsDefaut, hrefCreer }: { titre: string; sous: string; items: Banque[]; tagsDefaut: string[]; hrefCreer: string }) => (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{titre}</div>
        <div style={{ fontSize: 12, ...MUTED }}>{items.length}</div>
      </div>
      <div style={{ fontSize: 12.5, ...MUTED, marginBottom: 12 }}>{sous}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {items.map(b => (
          <Link key={b.id} href={`/pro/banques/${b.id}${q}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ ...CARD, marginBottom: 0, cursor: 'pointer', border: b.statut === 'valide' ? '1px solid #E2E8F0' : '1.5px dashed #CBD5E1' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{b.nom || 'Sans nom'}</div>
              <div style={{ fontSize: 12, ...MUTED, marginBottom: 8 }}>{b.questions?.length ?? 0} question{(b.questions?.length ?? 0) > 1 ? 's' : ''}</div>
              <span style={{
                fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '2px 7px',
                background: b.statut === 'valide' ? 'rgba(21,128,61,.1)' : 'rgba(180,83,9,.1)',
                color: b.statut === 'valide' ? '#15803D' : '#B45309',
              }}>{b.statut === 'valide' ? 'VALIDÉE' : 'BROUILLON'}</span>
            </div>
          </Link>
        ))}
        <Link href={`${hrefCreer}${q ? '&' : '?'}${q.slice(1)}&tags=${tagsDefaut.join(',')}`} style={{ textDecoration: 'none' }}>
          <div style={{ ...CARD, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 84, border: '1.5px dashed #CBD5E1', color: ACC, fontWeight: 700, fontSize: 13 }}>
            + Nouvelle banque
          </div>
        </Link>
      </div>
    </div>
  )

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="banques">
      <h1 style={H1}>Mes banques de questions</h1>
      <div style={{ ...SUB, marginBottom: 20 }}>Organisées par catégorie — une banque s&apos;enrichit à chaque modification, elle sert à tous vos events.</div>

      <Groupe
        titre="Quiz"
        sous="Questions à bonne réponse — culture générale, votre activité, votre marque."
        items={quiz}
        tagsDefaut={['quiz']}
        hrefCreer="/pro/banques/nouvelle"
      />
      <Groupe
        titre="Sondage bonus"
        sous="Questions sans bonne réponse — servent à connaître votre clientèle et améliorer votre service."
        items={bonus}
        tagsDefaut={['bonus']}
        hrefCreer="/pro/banques/nouvelle"
      />

      <div style={{ ...CARD, background: '#F8FAFC', fontSize: 12.5, ...MUTED, lineHeight: 1.6 }}>
        Une banque <b>brouillon</b> reste modifiable librement. Cliquez <b>Valider</b> dans l&apos;éditeur pour la figer et pouvoir la sélectionner lors de la création d&apos;une animation.
      </div>
    </ProShell>
  )
}
