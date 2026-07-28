import { fetchProDashboard } from '@/lib/pro'
import { fetchJoueurTirages } from '@/lib/dashboard'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, SUB, ACC } from '@/lib/proui'

/**
 * Fiche contact CRM cote Pro. N'existait pas -- les lignes de /pro/crm etaient de simples
 * lignes de tableau sans possibilite d'entrer dedans. Demande de Romain (28/07/2026) :
 * "des liens cliquables sur les lignes de CRM... afin de pouvoir rentrer a l'interieur".
 * Reutilise fetchJoueurTirages (deja construit pour la fiche joueur SA) -- memes donnees,
 * meme table `tirages`, juste un affichage Pro plus simple.
 */
export default async function FicheJoueurProPage({ params, searchParams }: { params: { id: string }; searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [data, tirages] = await Promise.all([fetchProDashboard(proId), fetchJoueurTirages(params.id)])
  const j = data.joueurs.find(x => x.id === params.id)
  const q = proId ? `?pro=${encodeURIComponent(proId)}` : ''

  if (!j) {
    return (
      <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="crm">
        <h1 style={H1}>Contact introuvable</h1>
        <a href={`/pro/crm${q}`} style={{ color: ACC, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← Retour au CRM</a>
      </ProShell>
    )
  }

  const nom = `${j.prenom ?? ''} ${j.nom ?? ''}`.trim() || 'Sans nom'
  const initiales = ((j.prenom?.[0] ?? '') + (j.nom?.[0] ?? '')).toUpperCase() || '?'
  const ligne = (label: string, valeur: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
      <span style={MUTED}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: 'right' }}>{valeur}</span>
    </div>
  )

  return (
    <ProShell proName={data.pro?.nom ?? 'Mon établissement'} proId={proId} active="crm">
      <a href={`/pro/crm${q}`} style={{ color: ACC, fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 14 }}>← Retour au CRM</a>

      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 999, background: ACC, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{initiales}</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{nom}</div>
          <div style={{ fontSize: 12.5, ...MUTED }}>{j.optin ? '✓ Opt-in — recontactable' : 'Pas d\u2019opt-in'}</div>
        </div>
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 8 }}>Coordonnées</div>
        {ligne('Email', j.email ? <a href={`mailto:${j.email}`} style={{ color: ACC }}>{j.email}</a> : '—')}
        {ligne('Téléphone', j.tel ? <a href={`tel:${j.tel}`} style={{ color: ACC }}>{j.tel}</a> : '—')}
        {ligne('Ville', j.ville || '—')}
        {ligne('Code postal', j.code_postal || '—')}
        {ligne('Découverte', j.source || '—')}
        {ligne('Première visite', j.first_seen ? new Date(j.first_seen).toLocaleDateString('fr-FR') : '—')}
      </div>

      <div style={CARD}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: '#64748B', marginBottom: 8 }}>
          Lots gagnés ({tirages.length})
        </div>
        {tirages.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Aucun lot gagné pour l&apos;instant.</div>}
        {tirages.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 16 }}>🎫</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.lot_nom ?? 'Lot'}</div>
              <div style={{ fontSize: 11, ...MUTED }}>{t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : '—'}</div>
            </div>
            <span style={{
              fontSize: 10.5, fontWeight: 800, borderRadius: 6, padding: '3px 8px',
              background: t.retire_at ? 'rgba(21,128,61,.1)' : 'rgba(180,83,9,.1)',
              color: t.retire_at ? '#15803D' : '#B45309',
            }}>{t.retire_at ? 'RETIRÉ' : 'À RETIRER'}</span>
          </div>
        ))}
      </div>
    </ProShell>
  )
}
