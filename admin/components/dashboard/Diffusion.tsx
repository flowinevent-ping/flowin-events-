'use client'

/**
 * DIFFUSION — apercu de la page publique + lien + QR telechargeable.
 * Lot 4 de la reorganisation. Un seul composant, pose partout ou une entite a
 * une page publique : onglet Landing d un event, d un super event, ecran de
 * livraison des wizards, fiche partenaire.
 *
 * POURQUOI CE COMPOSANT EXISTE
 * Avant, aucun QR n etait genere localement : toutes les images etaient des
 * <img src="https://api.qrserver.com/..."> (verifie : EventDrawer, ProDrawer,
 * nds-comm, nds-media, ProClient). Consequence directe, il n y avait RIEN a
 * telecharger -- pas de fichier, juste une image distante. Ici le QR est
 * calcule dans le navigateur avec la lib `qrcode`, donc exportable en PNG et
 * en SVG, et l affiche A4 s imprime sans dependance supplementaire.
 *
 * L apercu reprend le principe du cadre telephone deja utilise par
 * PhoneApercu (page Landing pages) et ParcoursMobil : iframe a taille reelle,
 * mise a l echelle par transform, pour que la page s affiche comme sur mobile.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'

export const BASE_PUBLIQUE = 'https://flowin-events.vercel.app'

export interface LienDiffusion {
  /** Libelle de l onglet (ex. « Page du super event »). */
  cle: string
  /** Chemin absolu depuis la racine du site (ex. /se/se-nds-2026). */
  chemin: string
  /** Une phrase : a quoi sert cette page, pour qui. */
  aide?: string
}

interface Props {
  /** Les pages publiques de l entite. La premiere est selectionnee au depart. */
  liens: LienDiffusion[]
  /** Sert a nommer les fichiers telecharges (slugifie). */
  nomFichier: string
  /** Titre imprime sur l affiche A4. */
  titreAffiche?: string
  /** Sous-titre imprime sur l affiche A4 (lieu, dates…). */
  sousTitreAffiche?: string
}

const LARGEUR_TEL = 250
const HAUTEUR_TEL = 500
const ECHELLE = 0.64

function slug(s: string) {
  return (s || 'flowin')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    .slice(0, 60) || 'flowin'
}

function telecharger(nom: string, contenu: Blob | string) {
  const blob = typeof contenu === 'string' ? new Blob([contenu], { type: 'image/svg+xml' }) : contenu
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nom
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoquer trop tot annule le telechargement sur certains navigateurs.
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export default function Diffusion({ liens, nomFichier, titreAffiche, sousTitreAffiche }: Props) {
  const [i, setI] = useState(0)
  const [copie, setCopie] = useState(false)
  const [qrPng, setQrPng] = useState<string>('')
  const [qrSvg, setQrSvg] = useState<string>('')
  const [erreurQr, setErreurQr] = useState<string | null>(null)
  const zoneImpression = useRef<HTMLDivElement>(null)

  const lien = liens[Math.min(i, liens.length - 1)]
  const url = useMemo(() => (lien ? `${BASE_PUBLIQUE}${lien.chemin}` : ''), [lien])

  useEffect(() => {
    if (!url) return
    let vivant = true
    setErreurQr(null)
    Promise.all([
      QRCode.toDataURL(url, { width: 1024, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0F172A', light: '#FFFFFF' } }),
      QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0F172A', light: '#FFFFFF' } }),
    ])
      .then(([png, svg]) => { if (vivant) { setQrPng(png); setQrSvg(svg) } })
      .catch(e => { if (vivant) setErreurQr(e instanceof Error ? e.message : 'QR indisponible') })
    return () => { vivant = false }
  }, [url])

  async function copier() {
    try {
      await navigator.clipboard.writeText(url)
      setCopie(true)
      setTimeout(() => setCopie(false), 1800)
    } catch {
      // clipboard refuse hors HTTPS ou sans geste utilisateur : on ne ment pas.
      setCopie(false)
      window.prompt('Copie manuelle du lien :', url)
    }
  }

  function telechargerPng() {
    if (!qrPng) return
    const bin = atob(qrPng.split(',')[1])
    const buf = new Uint8Array(bin.length)
    for (let k = 0; k < bin.length; k++) buf[k] = bin.charCodeAt(k)
    telecharger(`qr-${slug(nomFichier)}-${slug(lien.cle)}.png`, new Blob([buf], { type: 'image/png' }))
  }

  function telechargerSvg() {
    if (!qrSvg) return
    telecharger(`qr-${slug(nomFichier)}-${slug(lien.cle)}.svg`, qrSvg)
  }

  if (!lien) {
    return <div className="sa-empty-mini">Aucune page publique pour cette fiche.</div>
  }

  return (
    <div className="sa-diff">
      {liens.length > 1 && (
        <div className="sa-diff-onglets" role="tablist">
          {liens.map((l, k) => (
            <button
              key={l.chemin}
              role="tab"
              aria-selected={k === i}
              className={`sa-diff-onglet${k === i ? ' actif' : ''}`}
              onClick={() => setI(k)}
            >
              {l.cle}
            </button>
          ))}
        </div>
      )}

      {lien.aide && <p className="sa-diff-aide">{lien.aide}</p>}

      <div className="sa-diff-grid">
        {/* Apercu de la page reelle, au format telephone */}
        <div>
          <div className="sa-diff-lbl">Aperçu</div>
          <div className="sa-phone" style={{ width: LARGEUR_TEL, height: HAUTEUR_TEL }}>
            <iframe
              key={url}
              src={url}
              title={`Aperçu — ${lien.cle}`}
              loading="lazy"
              style={{
                width: Math.round(LARGEUR_TEL / ECHELLE),
                height: Math.round(HAUTEUR_TEL / ECHELLE),
                border: 0,
                transform: `scale(${ECHELLE})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
          <a className="sa-btn sm" href={url} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>
            Ouvrir la vraie page ↗
          </a>
        </div>

        {/* Lien + QR + telechargements */}
        <div className="sa-diff-col">
          <div>
            <div className="sa-diff-lbl">Lien public</div>
            <div className="sa-diff-lien">
              <input readOnly value={url} onFocus={e => e.currentTarget.select()} aria-label="Lien public" />
              <button className="sa-btn sm" onClick={copier}>{copie ? 'Copié ✓' : 'Copier'}</button>
            </div>
          </div>

          <div>
            <div className="sa-diff-lbl">QR code</div>
            {erreurQr && <div className="sa-diff-err">QR indisponible : {erreurQr}</div>}
            {!erreurQr && !qrPng && <div className="sa-diff-aide">Génération…</div>}
            {qrPng && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrPng} alt={`QR vers ${url}`} className="sa-diff-qr" width={180} height={180} />
                <div className="sa-diff-btns">
                  <button className="sa-btn sm" onClick={telechargerPng}>PNG 1024px</button>
                  <button className="sa-btn sm" onClick={telechargerSvg}>SVG (vectoriel)</button>
                  <button className="sa-btn sm" onClick={() => window.print()}>Affiche A4</button>
                </div>
                <p className="sa-diff-aide" style={{ marginTop: 8 }}>
                  Le QR est calculé ici, dans le navigateur — c&apos;est un vrai fichier,
                  imprimable en grand sans perte avec le SVG.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Affiche A4 : masquee a l ecran, seule visible a l impression. */}
      <div className="sa-affiche" ref={zoneImpression} aria-hidden="true">
        <div className="sa-affiche-in">
          <div className="sa-affiche-titre">{titreAffiche ?? nomFichier}</div>
          {sousTitreAffiche && <div className="sa-affiche-sous">{sousTitreAffiche}</div>}
          {qrPng && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrPng} alt="" className="sa-affiche-qr" />
          )}
          <div className="sa-affiche-cta">Scannez pour jouer</div>
          <div className="sa-affiche-url">{url}</div>
        </div>
      </div>
    </div>
  )
}
