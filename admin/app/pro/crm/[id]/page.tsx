import { fetchOperationsPro } from '@/lib/operations'
import { fetchJoueurTirages } from '@/lib/dashboard'
import { fetchCrmPro, libelleOrigine } from '@/lib/crmPro'
import ProShell from '@/components/pro/ProShell'
import { CARD, MUTED, H1, ACC } from '@/lib/proui'
import { CHARTE_PRO as C } from '@/lib/charte'

/**
 * Fiche contact du CRM pro (28/07, reprise 16/09 nuit) : coordonnees,
 * origines, operations jouees, parties, lots gagnes, et contact direct
 * (email, appel, SMS, WhatsApp). Donnees : crm_pro (tout le perimetre du pro)
 * + tirages du joueur.
 */
export default async function FicheJoueurProPage({ params, searchParams }: { params: { id: string }; searchParams: { pro?: string } }) {
  const proId = searchParams.pro ?? ''
  const [ops, contacts, tousTirages] = await Promise.all([fetchOperationsPro(proId), fetchCrmPro(proId), fetchJoueurTirages(params.id)])
  const j = contacts.find(x => x.joueur_id === params.id)
  /* Seuls les lots de ce pro, non annules. */
  const ptId = ops.partenaire?.id ?? null
  const tirages = tousTirages.filter(t => t.statut !== 'annule' && ((ptId && t.partenaire_id === ptId) || (j?.lots ?? []).includes(t.lot_nom ?? '')))
  const q = proId ? `?pro=${encodeURIComponent(proId)}&` : '?'
  const retour = `/pro/donnees${q}onglet=crm`
  const proNom = ops.proNom ?? 'Mon établissement'

  if (!j) {
    return (
      <ProShell proName={proNom} proId={proId} active="crm">
        <h1 style={H1}>Contact introuvable</h1>
        <a href={retour} style={{ color: ACC, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>← Retour au CRM</a>
      </ProShell>
    )
  }

  const nom = `${j.prenom ?? ''} ${j.nom ?? ''}`.trim() || 'Sans nom'
  const initiales = ((j.prenom?.[0] ?? '') + (j.nom?.[0] ?? '')).toUpperCase() || '?'
  const tel = (j.tel ?? '').replace(/[^\d+]/g, '')
  const telWa = tel.startsWith('0') ? `33${tel.slice(1)}` : tel.replace(/^\+/, '')
  const dateFr = (d: string | null) => d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR') : '—'
  const ligne = (label: string, valeur: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: `1px solid ${C.bordure}`, fontSize: 13 }}>
      <span style={MUTED}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: 'right' }}>{valeur}</span>
    </div>
  )
  const bouton: React.CSSProperties = { border: `1.5px solid ${C.bordureChamp}`, borderRadius: 50, padding: '7px 14px', fontWeight: 800, fontSize: 12.5, color: C.accent, textDecoration: 'none', background: '#fff' }
  const titre = (t: string) => <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: C.attenue, marginBottom: 6 }}>{t}</div>

  return (
    <ProShell proName={proNom} proId={proId} active="crm">
      <a href={retour} style={{ color: ACC, fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>← Retour au CRM</a>

      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 999, background: C.degrade, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>{initiales}</div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{nom}</div>
          <div style={{ fontSize: 12.5, ...MUTED }}>
            {j.optin ? 'Opt-in : relançable' : 'Sans opt-in'} · {j.nb_parties} partie{j.nb_parties > 1 ? 's' : ''} · {j.nb_gains} lot{j.nb_gains > 1 ? 's' : ''} gagné{j.nb_gains > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {j.email && <a style={bouton} href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(j.email)}&su=${encodeURIComponent(proNom)}`} target="_blank" rel="noopener noreferrer">Email</a>}
          {tel && <a style={bouton} href={`tel:${tel}`}>Appeler</a>}
          {tel && <a style={bouton} href={`sms:${tel}`}>SMS</a>}
          {telWa && <a style={bouton} href={`https://wa.me/${telWa}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
        <div style={CARD}>
          {titre('Coordonnées')}
          {ligne('Email', j.email || '—')}
          {ligne('Téléphone', j.tel || '—')}
          {ligne('Code postal', j.code_postal || '—')}
          {ligne('Ville', j.ville || '—')}
          {ligne('Genre', j.genre === 'F' ? 'Femme' : j.genre === 'H' ? 'Homme' : (j.genre || '—'))}
          {ligne('Âge', j.tranche_age || '—')}
          {ligne('Origine', j.origines.length ? j.origines.map(libelleOrigine).join(', ') : '—')}
          {ligne('Première partie', dateFr(j.premiere))}
          {ligne('Dernière partie', dateFr(j.derniere))}
        </div>

        <div style={CARD}>
          {titre(`Opérations (${j.operations.length})`)}
          {j.operations.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Aucune.</div>}
          {j.operations.map(o => (
            <div key={o.cle} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.bordure}`, fontSize: 13 }}>
              <a href={`/pro/operation${q}op=${encodeURIComponent(o.cle)}`} style={{ fontWeight: 800, color: C.texte, textDecoration: 'none' }}>{o.nom}</a>
              <span style={MUTED}>{o.parties} partie{Number(o.parties) > 1 ? 's' : ''} · {dateFr(o.derniere)}</span>
            </div>
          ))}

          <div style={{ height: 14 }} />
          {titre(`Lots gagnés (${tirages.length})`)}
          {tirages.length === 0 && <div style={{ fontSize: 13, ...MUTED }}>Aucun lot gagné.</div>}
          {tirages.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${C.bordure}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{t.lot_nom ?? 'Lot'}</div>
                <div style={{ fontSize: 11, ...MUTED }}>{t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR') : '—'}</div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: '3px 9px',
                background: t.retire_at ? 'rgba(21,128,61,.1)' : 'rgba(180,83,9,.1)', color: t.retire_at ? '#15803D' : '#B45309' }}>
                {t.retire_at ? 'Remis' : 'À remettre'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ProShell>
  )
}
