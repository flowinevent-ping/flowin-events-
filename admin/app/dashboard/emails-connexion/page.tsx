'use client'

/* Rapport des emails de connexion (10/11/2026, demande de Romain) : pour chaque compte, date d'envoi
   du dernier email « mot de passe oublié » et de la confirmation d'inscription. Lu via la RPC
   admin_rapport_emails_connexion (réservée au super admin, lecture seule de auth.users).
   Supabase ne garde que le DERNIER envoi de chaque type par compte : ce n'est pas un historique complet,
   et « envoyé » ne garantit pas la réception (spams). */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, EmptyState, SearchBar } from '@/components/dashboard/DashboardUI'
import { rpcSA } from '@/lib/saSession'

type Ligne = { email: string; cree_le: string; confirmation_envoyee_le: string | null; email_confirme_le: string | null; recuperation_envoyee_le: string | null; derniere_connexion: string | null }

function d(v: string | null): string {
  if (!v) return '—'
  return new Date(v).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function recent(v: string | null): boolean { return !!v && Date.now() - new Date(v).getTime() < 7 * 86400000 }

export default function Page() {
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [charge, setCharge] = useState(true)
  const [erreur, setErreur] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    rpcSA<Ligne[]>('admin_rapport_emails_connexion', {}).then((r) => {
      if (r.erreur) setErreur(r.erreur); else setLignes(r.data ?? [])
      setCharge(false)
    })
  }, [])

  const vues = useMemo(() => lignes.filter((l) => !q || l.email.toLowerCase().indexOf(q.toLowerCase()) >= 0), [lignes, q])
  const nbRecup7 = lignes.filter((l) => recent(l.recuperation_envoyee_le)).length
  const nbNonConf = lignes.filter((l) => !l.email_confirme_le).length

  return (
    <div>
      <PageHeader title="Emails de connexion" subtitle="Mot de passe oublié et confirmation d'inscription : date du dernier email envoyé, compte par compte." />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '0 0 16px' }}>
        {[['Comptes', lignes.length], ['Mot de passe oublié (7 derniers jours)', nbRecup7], ['Email non confirmé', nbNonConf]].map(([k, v]) => (
          <div key={String(k)} style={{ background: '#fff', border: '1px solid #DCE3EC', borderRadius: 12, padding: '12px 16px', minWidth: 160 }}>
            <div style={{ fontSize: 12, color: '#5a6b80' }}>{k}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1B3A5C' }}>{charge ? '…' : v}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: '#5a6b80', margin: '0 0 12px' }}>
        « Envoyé » veut dire que Supabase a remis l'email à l'envoyeur (Gmail). Si la personne ne le trouve pas, lui dire de regarder dans ses spams.
        Seul le dernier envoi de chaque type est conservé.
      </p>
      <SearchBar value={q} onChange={setQ} placeholder="Rechercher un email" />
      {erreur ? <EmptyState icon="warning" title="Rapport indisponible" desc={erreur} /> : charge ? <EmptyState title="Chargement…" /> : !vues.length ? <EmptyState title="Aucun compte" /> : (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
            <thead><tr style={{ textAlign: 'left', color: '#5a6b80' }}>
              {['Email', 'Mot de passe oublié envoyé le', 'Confirmation envoyée le', 'Email confirmé le', 'Dernière connexion', 'Compte créé le'].map((h) => <th key={h} style={{ padding: '8px 10px', borderBottom: '1px solid #DCE3EC', whiteSpace: 'nowrap' }}>{h}</th>)}
            </tr></thead>
            <tbody>{vues.map((l) => (
              <tr key={l.email}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #EEF2F7', fontWeight: 600, color: '#1B3A5C' }}>{l.email}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap', color: recent(l.recuperation_envoyee_le) ? '#3B5CC4' : undefined, fontWeight: recent(l.recuperation_envoyee_le) ? 700 : 400 }}>{d(l.recuperation_envoyee_le)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' }}>{d(l.confirmation_envoyee_le)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap', color: l.email_confirme_le ? undefined : '#C62F2F' }}>{l.email_confirme_le ? d(l.email_confirme_le) : 'Pas encore'}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' }}>{d(l.derniere_connexion)}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' }}>{d(l.cree_le)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
