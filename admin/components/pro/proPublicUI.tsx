/* Kit visuel partagé — parcours pro publics (inscription, connexion, rejoindre un super event,
   et futurs parcours : sélection tarifs, création d'event en propre). Une seule charte, reprise
   de celle déjà en place dans ProShell.tsx / /pro (accueil), pas une couleur importée des
   anciennes pages /rejoindre et /sponsor jamais utilisées. */

/* Charte du 31/10 (lib/charte.ts CHARTE_PRO) : encre, bleu, papier, accent violet commun. */
import { CHARTE_PRO } from '@/lib/charte'
export const ACCENT = CHARTE_PRO.violet
export const ACCENT_D = CHARTE_PRO.violetFonce
export const INK = CHARTE_PRO.encre
export const MUTED = CHARTE_PRO.attenue
export const BORDER = CHARTE_PRO.bordure
export const BG_PAGE = CHARTE_PRO.fond

export const wrap: React.CSSProperties = { minHeight: '100dvh', background: BG_PAGE, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color: INK }

/* Plus de bandeau sombre ni de degrade plein : en-tete clair, titre encre. */
export const heroStyle: React.CSSProperties = {
  background: CHARTE_PRO.carte, borderBottom: `1px solid ${BORDER}`,
  color: INK, padding: '40px 18px 40px', textAlign: 'center',
}

export function Hero({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div style={heroStyle}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: CHARTE_PRO.violet, letterSpacing: '.12em', textTransform: 'uppercase' }}>{kicker}</div>
      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 8, lineHeight: 1.12, letterSpacing: '-.01em' }}>{title}</div>
      {sub && <div style={{ fontSize: 14.5, color: MUTED, marginTop: 8, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>{sub}</div>}
    </div>
  )
}

export const pageWrap: React.CSSProperties = { maxWidth: 540, margin: '0 auto', padding: '0 18px 40px' }

export const card: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '24px 22px', boxShadow: '0 6px 24px rgba(27,58,92,.07)', border: `1px solid ${BORDER}`,
}

export const cardFloating: React.CSSProperties = { ...card, marginTop: -18 }

export const fieldLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, letterSpacing: '.03em', color: MUTED, textTransform: 'uppercase', marginBottom: 6, display: 'block' }

export const fieldInput: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13, border: `1px solid ${BORDER}`, background: '#fff',
  fontSize: 15, fontFamily: 'inherit', outline: 'none', marginTop: 0,
}

export const fieldBlock: React.CSSProperties = { marginBottom: 16 }

export const sectionLabel: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: ACCENT_D, margin: '22px 0 13px' }

export const primaryBtn: React.CSSProperties = {
  width: '100%', background: CHARTE_PRO.degrade, color: '#fff', fontWeight: 800,
  fontSize: 16, padding: '15px', borderRadius: 16, border: 'none', cursor: 'pointer',
}

export const ghostLink: React.CSSProperties = { color: ACCENT_D, fontWeight: 700, textDecoration: 'none' }

export const errorBox: React.CSSProperties = { background: '#FEECEC', color: '#B42318', borderRadius: 12, padding: '11px 14px', fontSize: 13.5, marginBottom: 14 }

export const helpText: React.CSSProperties = { fontSize: 12, color: MUTED, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={fieldBlock}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

export function SuccessScreen({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div style={wrap}>
      <div style={heroStyle}>
        {/* Pas d emoticone dans l espace pro (Romain, 16/09). */}{void emoji}
        <div style={{ fontSize: 26, fontWeight: 900 }}>{title}</div>
      </div>
      <div style={pageWrap}>
        <div style={cardFloating}>{children}</div>
      </div>
    </div>
  )
}
