/**
 * AFFICHE A4 : QR vectoriel imprimable (extraite de components/dashboard/Diffusion.tsx le 23/11/2026 pour
 * servir aussi l'ecran final « C'est en ligne » du Configurateur ; aucun changement de rendu par defaut).
 * Lot 5 F (24/11/2026) : logo du commerce, couleur (6 couleurs de la charte, sans violet), texte court (40 caracteres max),
 * impression en un geste (`auto`). Sans personnalisation, le rendu reste celui d'avant.
 * Retourne un message d'erreur, ou '' quand la fenetre d'impression est ouverte.
 */
export type ParamsAfficheA4 = {
  svg: string; url: string; titre: string; sousTitre?: string; qrNom?: string; support?: string | null; code?: string | null
  /** Logo du commerce (URL de l'image du profil) : pose sur une plaque blanche en haut de l'affiche. */
  logoUrl?: string | null
  /** Couleur de l'affiche (une des COULEURS_AFFICHE). */
  couleur?: string | null
  /** Texte court en grand (40 caracteres max) ; absent : le nom du commerce. */
  texte?: string | null
  /** Lance la boite d'impression des l'ouverture (un seul geste). */
  auto?: boolean
}

/** Six couleurs de la charte, sans violet (Romain). */
export const COULEURS_AFFICHE: { v: string; nom: string }[] = [
  { v: '#3B5CC4', nom: 'Bleu' }, { v: '#C2410C', nom: 'Orange' }, { v: '#15803D', nom: 'Vert' },
  { v: '#1B3A5C', nom: 'Marine' }, { v: '#9A3412', nom: 'Brique' }, { v: '#B7791F', nom: 'Or' },
]
export const TEXTES_AFFICHE = ['Jouez, gagnez', 'Tentez votre chance', 'Scannez et gagnez']
export const TEXTE_AFFICHE_MAX = 40

export type PersoAffiche = { couleur: string; texte: string }
const cleAffiche = (eventId: string) => 'flowin_affiche_' + eventId
/** Personnalisation retenue sur cet appareil (confort : jamais indispensable ; stockage parfois indisponible). */
export function lirePersoAffiche(eventId: string): PersoAffiche {
  const defaut: PersoAffiche = { couleur: COULEURS_AFFICHE[0].v, texte: '' }
  try {
    const j = JSON.parse(window.localStorage.getItem(cleAffiche(eventId)) || 'null') as Partial<PersoAffiche> | null
    if (j && COULEURS_AFFICHE.some(c => c.v === j.couleur)) return { couleur: j.couleur as string, texte: String(j.texte || '').slice(0, TEXTE_AFFICHE_MAX) }
  } catch { /* stockage indisponible */ }
  return defaut
}
export function ecrirePersoAffiche(eventId: string, p: PersoAffiche) {
  try { window.localStorage.setItem(cleAffiche(eventId), JSON.stringify({ couleur: p.couleur, texte: p.texte.slice(0, TEXTE_AFFICHE_MAX) })) } catch { /* stockage indisponible */ }
}

export function ouvrirAfficheA4({ svg, url, titre, sousTitre, qrNom, support, code, logoUrl, couleur, texte, auto }: ParamsAfficheA4): string {
  if (!svg) return ''
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const col = COULEURS_AFFICHE.some(c => c.v === couleur) ? (couleur as string) : '#3B5CC4'
  const grand = (texte || '').trim().slice(0, TEXTE_AFFICHE_MAX) || titre
  const perso = !!(logoUrl || texte || couleur)
  const logo = logoUrl && /^https?:\/\//.test(logoUrl) ? `<div class="lg"><img src="${esc(logoUrl)}" alt=""></div>` : (perso ? `<div class="lg"><b>${esc(titre)}</b></div>` : '<div class="k">Flowin</div>')
  /* Ligne d'identification imprimee : « QR <nom> · <support> · réf. <code> ». */
  const ident = [qrNom ? `QR « ${qrNom} »` : '', support && support !== qrNom ? support : '', code ? `réf. ${code}` : ''].filter(Boolean).join(' · ')
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Affiche — ${esc(titre)}${qrNom ? ' — ' + esc(qrNom) : ''}${code ? ' — ' + esc(code) : ''}</title>
<style>
  @page { size: A4; margin: 0 }
  * { box-sizing: border-box }
  body { margin:0; font-family: Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#0F172A; -webkit-print-color-adjust:exact; print-color-adjust:exact }
  .p { width:210mm; height:297mm; padding:22mm 18mm; display:flex; flex-direction:column;
     align-items:center; justify-content:center; text-align:center; page-break-after:always }
  .k { font-size:13pt; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:${col} }
  .lg { background:#fff; border:2px solid ${col}; border-radius:6mm; padding:5mm 9mm; min-width:60mm; max-width:120mm; min-height:30mm; display:flex; align-items:center; justify-content:center; font-size:20pt; color:${col} }
  .lg img { max-width:100mm; max-height:34mm; display:block }
  h1 { font-size:34pt; line-height:1.1; margin:6mm 0 2mm; font-weight:900; color:${perso ? col : '#0F172A'} }
  .s { font-size:15pt; color:#475569; margin:0 0 4mm }
  .i { font-size:12pt; font-weight:800; color:#0F172A; background:#F1F5F9; border-radius:99px; padding:2mm 6mm; margin:0 0 8mm }
  .q { width:112mm; height:112mm; padding:6mm; background:#fff; border:2px solid ${perso ? col : '#E2E8F0'}; border-radius:8mm }
  .q svg { width:100%; height:100% }
  .c { font-size:19pt; font-weight:800; margin-top:10mm; ${perso ? `background:${col}; color:#fff; border-radius:99px; padding:3mm 10mm` : ''} }
  .u { font-size:9.5pt; color:#94A3B8; margin-top:4mm; word-break:break-all; max-width:150mm }
  @media print { .n { display:none } }
  .n { position:fixed; top:10px; right:10px; font:600 13px/1 system-ui; background:#3B5CC4;
     color:#fff; border:0; border-radius:8px; padding:10px 14px; cursor:pointer }
</style></head><body>
<button class="n" onclick="window.print()">Imprimer</button>
<div class="p">
  ${logo}
  <h1>${esc(grand)}</h1>
  <p class="s">${esc(sousTitre ?? 'Scannez pour jouer')}</p>
  ${ident ? `<div class="i">${esc(ident)}</div>` : ''}
  <div class="q">${svg}</div>
  <div class="c">Scannez ce QR code pour jouer</div>
  <div class="u">${esc(url)}</div>
</div>${auto ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},350)})</script>` : ''}</body></html>`
  const w = window.open('', '_blank')
  if (!w) return "La fenêtre d'impression a été bloquée par le navigateur."
  w.document.write(html)
  w.document.close()
  return ''
}
