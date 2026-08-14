/* Kit visuel partagé — parcours pro publics (inscription, connexion, rejoindre un super event,
   et futurs parcours : sélection tarifs, création d'event en propre). Une seule charte, reprise
   de celle déjà en place dans ProShell.tsx / /pro (accueil), pas une couleur importée des
   anciennes pages /rejoindre et /sponsor jamais utilisées. */

export const ACCENT = '#A855F7'
export const ACCENT_D = '#7C2D92'
export const INK = '#0F172A'
export const MUTED = '#64748B'
export const BORDER = '#E2E8F0'
export const BG_PAGE = '#F8F5FC'

export const wrap: React.CSSProperties = { minHeight: '100dvh', background: BG_PAGE, fontFamily: 'system-ui, sans-serif', color: INK }

export const heroStyle: React.CSSProperties = {
  background: `linear-gradient(135deg,${ACCENT_D},${ACCENT})`,
  color: '#fff', padding: '46px 18px 40px', textAlign: 'center',
}

export function Hero({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div style={heroStyle}>
      <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, letterSpacing: '.04em', textTransform: 'uppercase' }}>{kicker}</div>
      <div style={{ fontSize: 27, fontWeight: 800, marginTop: 8, lineHeight: 1.15 }}>{title}</div>
      {sub && <div style={{ fontSize: 14.5, opacity: 0.92, marginTop: 8, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>{sub}</div>}
    </div>
  )
}

export const pageWrap: React.CSSProperties = { maxWidth: 540, margin: '0 auto', padding: '0 18px 40px' }

export const card: React.CSSProperties = {
  background: '#fff', borderRadius: 20, padding: '24px 22px', boxShadow: '0 6px 24px rgba(124,45,146,.08)', border: `1px solid ${BORDER}`,
}

export const cardFloating: React.CSSProperties = { ...card, marginTop: -18 }

export const fieldLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 800, letterSpacing: '.03em', color: '#5a6071', textTransform: 'uppercase', marginBottom: 6, display: 'block' }

export const fieldInput: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 13, border: `1px solid ${BORDER}`, background: '#fff',
  fontSize: 15, fontFamily: 'inherit', outline: 'none', marginTop: 0,
}

export const fieldBlock: React.CSSProperties = { marginBottom: 16 }

export const sectionLabel: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: ACCENT_D, margin: '22px 0 13px' }

export const primaryBtn: React.CSSProperties = {
  width: '100%', background: `linear-gradient(135deg,${ACCENT_D},${ACCENT})`, color: '#fff', fontWeight: 800,
  fontSize: 16, padding: '15px', borderRadius: 16, border: 'none', cursor: 'pointer',
}

export const ghostLink: React.CSSProperties = { color: ACCENT_D, fontWeight: 700, textDecoration: 'none' }

export const errorBox: React.CSSProperties = { background: '#FEECEC', color: '#B42318', borderRadius: 12, padding: '11px 14px', fontSize: 13.5, marginBottom: 14 }

export const helpText: React.CSSProperties = { fontSize: 12, color: '#9aa0ad', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }

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
        <div style={{ fontSize: 54, marginBottom: 10 }}>{emoji}</div>
        <div style={{ fontSize: 26, fontWeight: 800 }}>{title}</div>
      </div>
      <div style={pageWrap}>
        <div style={cardFloating}>{children}</div>
      </div>
    </div>
  )
}
