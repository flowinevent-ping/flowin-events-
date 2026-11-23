'use client'
/** Retour du lien e-mail participant : relie la session au joueur (par l'e-mail verifie) puis /moi. */
import { useEffect, useState } from 'react'
import { lierSessionAuJoueur } from '@/lib/connexionJoueur'
import ConnexionEmail from '@/components/joueur/ConnexionEmail'

const HERO = '#3B5CC4'

export default function ConnexionJoueur() {
  const [etat, setEtat] = useState<'attente' | 'aucun' | 'sans_session' | 'erreur'>('attente')

  useEffect(() => {
    lierSessionAuJoueur().then(r => {
      if (r.etat === 'ok') window.location.replace('/moi')
      else setEtat(r.etat)
    }).catch(() => setEtat('erreur'))
  }, [])

  const boite: React.CSSProperties = { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, background: '#f4f5f8', color: '#141a26', fontFamily: 'system-ui, sans-serif' }
  const lien: React.CSSProperties = { display: 'inline-block', marginTop: 18, padding: '13px 22px', borderRadius: 100, background: HERO, color: '#fff', fontWeight: 800, textDecoration: 'none' }

  return (
    <div style={boite} data-etat={etat}>
      <div style={{ maxWidth: 340, width: '100%' }}>
        {etat === 'attente' && <div style={{ fontSize: 16, fontWeight: 700 }}>Connexion…</div>}
        {etat === 'aucun' && (<>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Aucun lot pour cet email pour l&apos;instant — jouez dans un commerce Flowin</div>
          <a href="/carte-commerces" style={lien}>Trouver un commerce</a>
        </>)}
        {(etat === 'sans_session' || etat === 'erreur') && (<>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{etat === 'erreur' ? 'Connexion impossible pour l’instant' : 'Lien expiré ou déjà utilisé'}</div>
          <div style={{ fontSize: 14, color: '#5a6071', marginBottom: 14 }}>Demande un nouveau lien :</div>
          <ConnexionEmail />
        </>)}
      </div>
    </div>
  )
}
