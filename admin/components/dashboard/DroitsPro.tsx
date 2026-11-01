'use client'

/**
 * FICHE DU PRO (Super Admin) — onglet « Droits » : les options que ce pro voit
 * ou non dans son espace (creer une animation, creer / rejoindre un super event,
 * banques de questions, partenaires et logos). Voir sql/06-droits-pro.sql.
 *
 * Seul le Super Admin CONNECTE peut changer un droit (fonction pro_definir_droit,
 * refusee a tout autre appelant) ; chaque changement est journalise. La
 * session est celle du dashboard (lib/saSession.ts) ; sans session, la
 * connexion se fait ici meme.
 */
import { useCallback, useEffect, useState } from 'react'
import { useDashboard } from '@/contexts/DashboardContext'
import { DROITS_LISTE, droitsEffectifs, colonneDroitsPresente, type CleDroit } from '@/lib/droitsPro'
import { connecterSA, lireSessionSA, lireSA, rpcSA } from '@/lib/saSession'
import { supabase } from '@/lib/supabase'
import type { FlowinPro } from '@/lib/types'

interface Ligne { id: number; droit: string; avant: boolean | null; apres: boolean | null; par_email: string | null; le: string }
const NOM_DROIT: Record<string, string> = Object.fromEntries(DROITS_LISTE.map(d => [d.cle, d.titre]))

export default function DroitsPro({ pro }: { pro: FlowinPro }) {
  const { pros, setPros } = useDashboard()
  const [connecte, setConnecte] = useState(false)
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [enCours, setEnCours] = useState<string | null>(null)
  const [journal, setJournal] = useState<Ligne[] | null>(null)
  /* Les droits sont relus EN DIRECT a l'ouverture de l'onglet : la liste des pros du dashboard est
     chargee une fois (et peut dater) ; un interrupteur ne doit jamais s'appuyer dessus. */
  const [vivant, setVivant] = useState<{ present: boolean; droits: unknown } | null>(null)
  useEffect(() => {
    let fini = false
    supabase.from('pros').select('droits').eq('id', pro.id).maybeSingle().then(r => {
      if (fini) return
      setVivant(r.error || !r.data ? { present: colonneDroitsPresente(pro), droits: pro.droits } : { present: true, droits: (r.data as { droits?: unknown }).droits })
    })
    return () => { fini = true }
  }, [pro.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const presente = vivant ? vivant.present : colonneDroitsPresente(pro)
  const d = droitsEffectifs(vivant ? vivant.droits : pro.droits)

  const chargerJournal = useCallback(async () => {
    const r = await lireSA<Ligne[]>('pros_droits_journal?select=id,droit,avant,apres,par_email,le&pro_id=eq.' + encodeURIComponent(pro.id) + '&order=le.desc&limit=12')
    setJournal(r.data ?? null)
  }, [pro.id])

  useEffect(() => {
    const ok = !!lireSessionSA()
    setConnecte(ok)
    if (ok && presente) chargerJournal()
  }, [presente, chargerJournal])

  async function seConnecter() {
    setMsg(null)
    const r = await connecterSA(email, mdp)
    if (!r.ok) { setMsg({ ok: false, t: r.erreur || 'Connexion refusée.' }); return }
    setMdp(''); setConnecte(true); chargerJournal()
  }

  async function basculer(cle: CleDroit) {
    setMsg(null); setEnCours(cle)
    const valeur = !d[cle]
    const r = await rpcSA<Record<string, boolean>>('pro_definir_droit', { p_pro: pro.id, p_droit: cle, p_valeur: valeur })
    setEnCours(null)
    if (r.sansSession) { setConnecte(false); setMsg({ ok: false, t: 'Session expirée : reconnectez-vous.' }); return }
    if (r.erreur || !r.data) { setMsg({ ok: false, t: r.erreur || 'Changement refusé.' }); return }
    setVivant({ present: true, droits: r.data })
    setPros(pros.map(x => x.id === pro.id ? { ...x, droits: r.data } : x))
    setMsg({ ok: true, t: (valeur ? 'Activé : ' : 'Retiré : ') + NOM_DROIT[cle] })
    chargerJournal()
  }

  return (
    <div data-droits-pro>
      <p className="sa-muted" style={{ fontSize: 12.5, margin: '0 0 12px', lineHeight: 1.5 }}>
        Ce que <b>{pro.nom}</b> peut faire dans son espace. Un droit retiré fait disparaître le bouton ET bloque l’accès direct (message « contactez Flowin »).
      </p>

      {!presente && (
        <div className="sa-alert info" data-droits-absent>
          Le SQL <code className="sa-code">sql/06-droits-pro.sql</code> n’est pas encore appliqué : les interrupteurs ci-dessous montrent les valeurs par défaut
          (comportement actuel, rien n’est bloqué) et ne sont pas encore actifs.
        </div>
      )}

      {presente && !connecte && (
        <div className="sa-alert info" data-droits-connexion style={{ display: 'grid', gap: 8 }}>
          <div><b>Connexion Super Admin requise</b> pour changer un droit (le compte inscrit dans <code className="sa-code">flowin_super_admins</code>).</div>
          <input className="sa-input" type="email" placeholder="Email du Super Admin" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" />
          <input className="sa-input" type="password" placeholder="Mot de passe" value={mdp} onChange={e => setMdp(e.target.value)} autoComplete="current-password" onKeyDown={e => { if (e.key === 'Enter') seConnecter() }} />
          <button className="sa-btn primary" onClick={seConnecter} disabled={!email || !mdp}>Se connecter</button>
        </div>
      )}

      {msg && <div className={`sa-alert ${msg.ok ? 'live' : 'info'}`} role="status" data-droits-msg style={msg.ok ? undefined : { background: '#FEE2E2', color: '#991B1B' }}>{msg.t}</div>}

      <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
        {DROITS_LISTE.map(x => {
          const actif = presente && connecte
          return (
            <label key={x.cle} data-droit={x.cle} data-valeur={d[x.cle] ? '1' : '0'}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', border: '1px solid var(--sa-border)', borderRadius: 10, background: 'var(--sa-subtle)', cursor: actif ? 'pointer' : 'not-allowed', opacity: actif || !presente ? 1 : .75 }}>
              <input type="checkbox" role="switch" aria-label={x.titre} checked={d[x.cle]} disabled={!actif || enCours === x.cle} onChange={() => basculer(x.cle)} style={{ marginTop: 3, width: 18, height: 18 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>{x.titre}</span>
                <span className="sa-muted" style={{ display: 'block', fontSize: 12, marginTop: 2, lineHeight: 1.45 }}>{x.aide}</span>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: d[x.cle] ? '#166534' : '#991B1B' }}>{d[x.cle] ? 'Autorisé' : 'Retiré'}</span>
            </label>
          )
        })}
      </div>

      {presente && connecte && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--sa-muted)', marginBottom: 6 }}>Historique des changements</div>
          {journal === null && <div className="sa-muted" style={{ fontSize: 12.5 }}>Historique indisponible (réservé au Super Admin connecté).</div>}
          {journal && journal.length === 0 && <div className="sa-muted" style={{ fontSize: 12.5 }}>Aucun changement enregistré.</div>}
          {journal && journal.map(l => (
            <div key={l.id} data-journal-ligne style={{ fontSize: 12.5, padding: '4px 0', borderBottom: '1px solid var(--sa-border)' }}>
              {new Date(l.le).toLocaleString('fr-FR')} · {l.par_email || 'inconnu'} · {NOM_DROIT[l.droit] || l.droit} : {l.avant ? 'oui' : 'non'} → <b>{l.apres ? 'oui' : 'non'}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
