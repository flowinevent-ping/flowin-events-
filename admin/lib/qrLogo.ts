/**
 * QR FLOWIN AVEC LOGO (Romain, 10/11/2026) : tout QR Flowin porte en son centre la marque « Flowin Animation ».
 * Correction d'erreur H (30 %) : la pastille centrale couvre environ 7 % de la surface, le QR reste lisible
 * (vérifié au décodage jsQR, docs/audit-2026-11-10/AUDIT-configurateur-2026-11-10.md).
 * PNG : dessin sur canvas. SVG : la même pastille ajoutée en fin de document.
 */
const BLEU = '#3B5CC4'
/** Part de la largeur du QR occupée par la pastille blanche. */
const PART = 0.26

export const OPTIONS_QR_FLOWIN = { errorCorrectionLevel: 'H' as const, margin: 2 }

/** PNG (data URL) du QR avec la marque au centre. Navigateur uniquement. */
export async function qrFlowinPng(url: string, largeur = 1024): Promise<string> {
  const mod = await import('qrcode')
  const QR = (mod as unknown as { default?: typeof mod }).default ?? mod
  const canvas = document.createElement('canvas')
  await QR.toCanvas(canvas, url, { ...OPTIONS_QR_FLOWIN, width: largeur })
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.toDataURL('image/png')
  const w = canvas.width
  const c = PART * w
  const x = (w - c) / 2
  ctx.fillStyle = '#fff'
  arrondi(ctx, x, x, c, c, c * 0.18); ctx.fill()
  ctx.strokeStyle = BLEU; ctx.lineWidth = Math.max(2, w * 0.006)
  arrondi(ctx, x + c * 0.06, x + c * 0.06, c * 0.88, c * 0.88, c * 0.14); ctx.stroke()
  ctx.fillStyle = BLEU; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = `900 ${Math.round(c * 0.27)}px Arial, sans-serif`
  ctx.fillText('Flowin', w / 2, w / 2 - c * 0.1)
  ctx.font = `700 ${Math.round(c * 0.15)}px Arial, sans-serif`
  ctx.fillText('Animation', w / 2, w / 2 + c * 0.17)
  return canvas.toDataURL('image/png')
}

/** SVG du QR avec la même marque. */
export async function qrFlowinSvg(url: string, largeur = 1024): Promise<string> {
  const mod = await import('qrcode')
  const QR = (mod as unknown as { default?: typeof mod }).default ?? mod
  const svg = await QR.toString(url, { ...OPTIONS_QR_FLOWIN, type: 'svg', width: largeur })
  const vb = /viewBox="0 0 (\d+(?:\.\d+)?) /.exec(svg)
  const n = vb ? Number(vb[1]) : 0
  if (!n) return svg
  const c = PART * n, x = (n - c) / 2
  const marque = `<g><rect x="${x}" y="${x}" width="${c}" height="${c}" rx="${c * 0.18}" fill="#fff"/>` +
    `<rect x="${x + c * 0.06}" y="${x + c * 0.06}" width="${c * 0.88}" height="${c * 0.88}" rx="${c * 0.14}" fill="none" stroke="${BLEU}" stroke-width="${n * 0.006}"/>` +
    `<text x="${n / 2}" y="${n / 2 - c * 0.02}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="${c * 0.27}" fill="${BLEU}">Flowin</text>` +
    `<text x="${n / 2}" y="${n / 2 + c * 0.24}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${c * 0.15}" fill="${BLEU}">Animation</text></g>`
  return svg.replace('</svg>', marque + '</svg>')
}

function arrondi(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
}
