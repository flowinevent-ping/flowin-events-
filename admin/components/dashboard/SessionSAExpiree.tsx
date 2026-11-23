'use client'

/** Message unique « session expirée » des listes Super Admin qui lisent des coordonnées (jamais une liste vide). */
import { LIEN_CONNEXION_SA, MESSAGE_SESSION_SA_EXPIREE } from '@/lib/supabase'

export default function SessionSAExpiree() {
  return (
    <div role="alert" data-session-expiree className="sa-alert warn texte" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 14 }}>
      <div style={{ fontWeight: 800 }}>{MESSAGE_SESSION_SA_EXPIREE.replace(/\.$/, '')}</div>
      <a href={LIEN_CONNEXION_SA} style={{ color: '#3B5CC4', fontWeight: 800, display: 'inline-block', minHeight: 44, lineHeight: '44px' }}>Me reconnecter</a>
    </div>
  )
}
