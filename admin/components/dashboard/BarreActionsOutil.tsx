'use client'

/**
 * Barre d'actions de l'outil affiche dans le carrousel / l'apercu plein ecran :
 * Envoyer par WhatsApp, Copier le lien, Email. Un brouillon reste bloque tant que le
 * Super Admin n'a pas active « Valider cet outil ».
 */
import { useState } from 'react'
import { CHARTE_PRO as C } from '@/lib/charte'
import { avecSource } from '@/lib/source'
import { lienWhatsApp, lienEmail } from '@/lib/outilsCommerciaux'

export interface CibleBarre {
  titre: string
  url: string
  message: string
  /** Vrai : partageable. Faux : brouillon ou hors ligne. */
  partageable: boolean
  /** Message de blocage (affiche quand non partageable). */
  motif: string
  /** Si fourni, affiche l'interrupteur « Valider cet outil ». */
  valide?: boolean
  onValider?: (v: boolean) => void
}

async function copier(texte: string): Promise<boolean> {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texte); return true } } catch { /* repli */ }
  try {
    const t = document.createElement('textarea'); t.value = texte; t.style.position = 'fixed'; t.style.opacity = '0'
    document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); document.body.removeChild(t); return ok
  } catch { return false }
}

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '0 16px', borderRadius: 10,
  border: `1px solid ${C.bordureChamp}`, background: '#fff', color: C.encre, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  textDecoration: 'none', fontFamily: 'inherit',
}
const off: React.CSSProperties = { opacity: 0.4, cursor: 'not-allowed' }

export function BarreActionsOutil({ cible }: { cible: CibleBarre }) {
  const [copie, setCopie] = useState(false)
  const ok = cible.partageable
  const urlWa = avecSource(cible.url, 'whatsapp')
  const urlMail = avecSource(cible.url, 'email')
  return (
    <div data-barre style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', margin: '10px 0 4px' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ok ? (
          <a data-barre-wa href={lienWhatsApp(cible.message, urlWa)} target="_blank" rel="noopener noreferrer"
            style={{ ...btn, background: '#1F9D55', borderColor: '#1F9D55', color: '#fff' }}>Envoyer par WhatsApp</a>
        ) : (
          <span data-barre-wa aria-disabled="true" style={{ ...btn, ...off }}>Envoyer par WhatsApp</span>
        )}
        <button type="button" data-barre-copier disabled={!ok} style={{ ...btn, ...(ok ? {} : off) }}
          onClick={async () => { const r = await copier(cible.url); setCopie(r); window.setTimeout(() => setCopie(false), 2000) }}>
          {copie ? 'Copié ✓' : 'Copier le lien'}
        </button>
        {ok ? (
          <a data-barre-mail href={lienEmail(cible.titre, cible.message, urlMail)} style={btn}>Email</a>
        ) : (
          <span data-barre-mail aria-disabled="true" style={{ ...btn, ...off }}>Email</span>
        )}
      </div>
      {!ok && (
        <div data-barre-motif style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: C.ko, borderRadius: 8, padding: '4px 12px' }}>{cible.motif}</div>
      )}
      {cible.onValider && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: C.encre, cursor: 'pointer' }}>
          <input type="checkbox" role="switch" data-valider checked={!!cible.valide} onChange={e => cible.onValider?.(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: C.violet }} />
          Valider cet outil (Super Admin)
        </label>
      )}
    </div>
  )
}
