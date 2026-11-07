'use client'

/**
 * Garde d'acces du dashboard Next (/dashboard/*) -- securite 07/11/2026.
 *
 * Tant qu'il n'y a pas de session Super Admin valide (localStorage
 * `flowin_admin_session`, la MEME que dashboard.html / admin-connexion.html),
 * on affiche l'ecran de connexion a la place du dashboard. La session est
 * verifiee par est_super_admin() (un compte pro connecte n'ouvre pas le
 * dashboard), rafraichie avant expiration (refresh_token, toutes les minutes)
 * et un bouton permet la deconnexion.
 *
 * Les clients supabase (lib/supabase.ts) envoient ce jeton sur /dashboard : les
 * ecritures admin passent la RLS `authenticated` + est_super_admin().
 */
import { useCallback, useEffect, useState } from 'react'
import { connecterSA, deconnecterSA, sessionSAFraiche, verifierSuperAdmin } from '@/lib/saSession'

type Etat = 'verif' | 'connexion' | 'ok'

export default function GardeSA({ children }: { children: React.ReactNode }) {
  const [etat, setEtat] = useState<Etat>('verif')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const verifier = useCallback(async () => {
    const s = await sessionSAFraiche()
    if (!s) { setEtat('connexion'); return }
    const ok = await verifierSuperAdmin()
    if (!ok) { setErreur('Ce compte n’est pas un compte Super Admin Flowin.'); deconnecterSA(); setEtat('connexion'); return }
    setEtat('ok')
  }, [])

  useEffect(() => { verifier() }, [verifier])

  /* Rafraichissement du jeton avant expiration ; si la session disparait (deconnexion
     dans un autre onglet, refresh refuse), retour a l'ecran de connexion. */
  useEffect(() => {
    if (etat !== 'ok') return
    const t = window.setInterval(async () => {
      const s = await sessionSAFraiche()
      if (!s) setEtat('connexion')
    }, 60000)
    const surStockage = (e: StorageEvent) => { if (e.key === 'flowin_admin_session' && !e.newValue) setEtat('connexion') }
    window.addEventListener('storage', surStockage)
    return () => { window.clearInterval(t); window.removeEventListener('storage', surStockage) }
  }, [etat])

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault()
    setErreur(''); setEnvoi(true)
    const r = await connecterSA(email, mdp)
    setEnvoi(false)
    if (!r.ok) { setErreur(r.erreur || 'Connexion impossible.'); return }
    setMdp('')
    await verifier()
  }

  function seDeconnecter() {
    deconnecterSA()
    setEtat('connexion')
  }

  if (etat === 'ok') {
    return (
      <>
        {children}
        <button
          type="button"
          onClick={seDeconnecter}
          style={{ position: 'fixed', right: 14, bottom: 14, zIndex: 9999, padding: '8px 14px', borderRadius: 10, border: '1px solid #d9dde6', background: '#fff', color: '#141a26', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.08)' }}
        >
          Se déconnecter
        </button>
      </>
    )
  }

  const champ: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '12px 13px', borderRadius: 11, border: '1.5px solid #d9dde6', fontSize: 15, fontFamily: 'inherit', marginBottom: 12 }
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f6fa', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      {etat === 'verif' ? (
        <div style={{ color: '#5a6071' }}>Vérification de la session…</div>
      ) : (
        <form onSubmit={seConnecter} style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: '26px 22px', border: '1px solid #e4e7ee' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Dashboard Flowin</div>
          <div style={{ fontSize: 13.5, color: '#5a6071', marginBottom: 18 }}>Connexion Super Admin requise.</div>
          <input type="email" autoComplete="username" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={champ} required />
          <input type="password" autoComplete="current-password" placeholder="Mot de passe" value={mdp} onChange={e => setMdp(e.target.value)} style={champ} required />
          {erreur && <div style={{ color: '#b42318', fontSize: 13.5, marginBottom: 12 }}>{erreur}</div>}
          <button type="submit" disabled={envoi} style={{ width: '100%', padding: '12px', borderRadius: 11, border: 'none', background: '#7C5CFC', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      )}
    </div>
  )
}
