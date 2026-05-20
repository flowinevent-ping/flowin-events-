import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Flowin — Participez !',
  description: 'Participez et tentez de gagner',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#D4537E',
}

export default function ParcoursLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap"
        crossOrigin="anonymous"
      />
      <style dangerouslySetInnerHTML={{ __html: `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; font-family: 'Nunito', sans-serif; }
        body { background: #f0f0f5; display: flex; justify-content: center; }
        #flowin-vp {
          position: relative; width: 100%; max-width: 430px;
          height: 100dvh; overflow: hidden;
          background: var(--bg, #fff); color: var(--text, #1a1a2e);
          font-family: 'Nunito', sans-serif;
        }
        .fl-screen { position: absolute; inset: 0; display: none; flex-direction: column; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .fl-screen.active { display: flex; }
        .fl-btn { display: block; width: 100%; padding: 16px; border: none; border-radius: 14px; cursor: pointer; font-family: 'Fredoka One', cursive; font-size: 16px; letter-spacing: .03em; text-align: center; text-decoration: none; transition: opacity .15s, transform .1s; }
        .fl-btn:active { transform: scale(.98); opacity: .9; }
        .fl-btn-primary { background: var(--a, #D4537E); color: #fff; }
        .fl-btn-ghost { background: transparent; color: var(--a, #D4537E); border: 1.5px solid var(--a, #D4537E); }
        .fl-field { margin-bottom: 14px; }
        .fl-label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .1em; color: var(--muted, #888); margin-bottom: 6px; }
        .fl-input { width: 100%; padding: 14px 16px; border: 1.5px solid rgba(0,0,0,.12); border-radius: 12px; font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 600; background: #fff; color: #1a1a2e; outline: none; transition: border-color .2s; }
        .fl-input:focus { border-color: var(--a, #D4537E); }
        .fl-input.error { border-color: #E24B4A; }
        .fl-error-msg { font-size: 11px; font-weight: 700; color: #E24B4A; margin-top: 4px; }
        .fl-ticket { background: #fff; border-radius: 20px; padding: 24px 20px; margin: 0 20px; text-align: center; position: relative; border-top: 4px solid var(--a, #D4537E); box-shadow: 0 4px 24px rgba(0,0,0,.08); }
        .fl-ticket::before, .fl-ticket::after { content: ''; position: absolute; width: 20px; height: 20px; background: var(--bg, #f4f4f9); border-radius: 50%; top: 50%; transform: translateY(-50%); }
        .fl-ticket::before { left: -10px; }
        .fl-ticket::after { right: -10px; }
        .fl-ticket-code { font-family: 'Fredoka One', cursive; font-size: 24px; color: var(--a, #D4537E); letter-spacing: .08em; margin: 8px 0; }
        .fl-part-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 20px; }
        .fl-part-tile { background: rgba(0,0,0,.04); border: 1.5px solid rgba(0,0,0,.1); border-radius: 16px; padding: 18px 10px 14px; text-align: center; cursor: pointer; transition: transform .15s; }
        .fl-part-tile:active { transform: scale(.97); }
        .fl-part-emoji { font-size: 38px; margin-bottom: 8px; display: block; }
        .fl-part-name { font-size: 12px; font-weight: 800; color: #1a1a2e; line-height: 1.3; }
        .fl-part-voir { font-size: 10px; color: var(--a, #D4537E); margin-top: 3px; }
        .fl-sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 200; }
        .fl-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 201; background: linear-gradient(180deg, #1a1230 0%, #0f0c1e 100%); border-radius: 24px 24px 0 0; padding-bottom: env(safe-area-inset-bottom); }
        .fl-sheet-handle { width: 40px; height: 4px; background: rgba(255,255,255,.25); border-radius: 2px; margin: 10px auto 16px; }
        .fl-sheet-body { padding: 0 24px 28px; }
        .fl-sheet-avatar { width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; overflow: hidden; border: 2px solid rgba(255,255,255,.15); }
        .fl-sheet-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .fl-sheet-nom { font-family: 'Fredoka One', cursive; font-size: 22px; color: #fff; text-align: center; margin-bottom: 6px; }
        .fl-sheet-desc { font-size: 13px; color: rgba(255,255,255,.65); text-align: center; line-height: 1.5; margin-bottom: 12px; }
        .fl-sheet-promo { background: rgba(168,85,247,.18); border: 1px solid rgba(168,85,247,.35); border-radius: 10px; padding: 9px 14px; font-size: 12px; font-weight: 700; color: #C4B5FD; text-align: center; margin-bottom: 14px; }
        .fl-sheet-links { display: flex; flex-direction: column; gap: 8px; }
        .fl-sheet-link { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 12px 16px; color: #fff; font-size: 14px; font-weight: 700; text-decoration: none; }
        .fl-sheet-link-ico { font-size: 20px; width: 28px; text-align: center; }
        .fl-sheet-close { position: absolute; top: 14px; right: 18px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.1); border: none; color: #fff; font-size: 18px; cursor: pointer; }
        .fl-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px 10px; }
        .fl-back-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,.08); border: none; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .fl-ad-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; gap: 16px; }
        .fl-ad-icon { font-size: 64px; }
        .fl-ad-title { font-size: 22px; font-weight: 900; }
        .fl-ad-msg { font-size: 14px; color: var(--muted, #888); line-height: 1.5; }
      `}} />
      {children}
    </>
  )
}
