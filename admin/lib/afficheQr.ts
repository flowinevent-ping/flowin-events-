/**
 * AFFICHE A4 : QR vectoriel imprimable (extraite de components/dashboard/Diffusion.tsx le 23/11/2026 pour
 * servir aussi l'ecran final « C'est en ligne » du Configurateur ; aucun changement de rendu).
 * Retourne un message d'erreur, ou '' quand la fenetre d'impression est ouverte.
 */
export type ParamsAfficheA4 = { svg: string; url: string; titre: string; sousTitre?: string; qrNom?: string; support?: string | null; code?: string | null }

export function ouvrirAfficheA4({ svg, url, titre, sousTitre, qrNom, support, code }: ParamsAfficheA4): string {
  if (!svg) return ''
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  /* Ligne d'identification imprimee : « QR <nom> · <support> · réf. <code> ». */
  const ident = [qrNom ? `QR « ${qrNom} »` : '', support && support !== qrNom ? support : '', code ? `réf. ${code}` : ''].filter(Boolean).join(' · ')
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<title>Affiche — ${esc(titre)}${qrNom ? ' — ' + esc(qrNom) : ''}${code ? ' — ' + esc(code) : ''}</title>
<style>
  @page { size: A4; margin: 0 }
  * { box-sizing: border-box }
  body { margin:0; font-family: Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:#0F172A }
  .p { width:210mm; height:297mm; padding:22mm 18mm; display:flex; flex-direction:column;
     align-items:center; justify-content:center; text-align:center; page-break-after:always }
  .k { font-size:13pt; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#3B5CC4 }
  h1 { font-size:34pt; line-height:1.1; margin:6mm 0 2mm; font-weight:900 }
  .s { font-size:15pt; color:#475569; margin:0 0 4mm }
  .i { font-size:12pt; font-weight:800; color:#0F172A; background:#F1F5F9; border-radius:99px; padding:2mm 6mm; margin:0 0 8mm }
  .q { width:112mm; height:112mm; padding:6mm; background:#fff; border:2px solid #E2E8F0; border-radius:8mm }
  .q svg { width:100%; height:100% }
  .c { font-size:19pt; font-weight:800; margin-top:10mm }
  .u { font-size:9.5pt; color:#94A3B8; margin-top:4mm; word-break:break-all; max-width:150mm }
  @media print { .n { display:none } }
  .n { position:fixed; top:10px; right:10px; font:600 13px/1 system-ui; background:#3B5CC4;
     color:#fff; border:0; border-radius:8px; padding:10px 14px; cursor:pointer }
</style></head><body>
<button class="n" onclick="window.print()">Imprimer</button>
<div class="p">
  <div class="k">Flowin</div>
  <h1>${esc(titre)}</h1>
  <p class="s">${esc(sousTitre ?? 'Scannez pour jouer')}</p>
  ${ident ? `<div class="i">${esc(ident)}</div>` : ''}
  <div class="q">${svg}</div>
  <div class="c">Scannez ce QR code pour jouer</div>
  <div class="u">${esc(url)}</div>
</div></body></html>`
  const w = window.open('', '_blank')
  if (!w) return "La fenêtre d'impression a été bloquée par le navigateur."
  w.document.write(html)
  w.document.close()
  return ''
}
