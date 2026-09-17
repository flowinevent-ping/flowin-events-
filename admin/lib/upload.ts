import { supabase } from './supabase'

const TAILLE_MAX = 5 * 1024 * 1024
const TYPES_ACCEPTES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/**
 * Upload d'un logo vers le bucket Supabase Storage `logos`, public.
 * Remplace le champ « coller une URL » : le fichier est heberge par Flowin,
 * l'appelant recoit l'URL publique a stocker (image_url, logo_url...).
 * Redimensionnement : fait cote navigateur avant upload (voir redimensionnerImage),
 * pas de traitement serveur.
 */
export async function uploaderLogo(fichier: File, prefixe: string): Promise<{ url: string } | { erreur: string }> {
  if (!TYPES_ACCEPTES.includes(fichier.type)) return { erreur: 'Format non accepté (PNG, JPG, WebP ou SVG uniquement).' }
  if (fichier.size > TAILLE_MAX) return { erreur: 'Fichier trop lourd (5 Mo max).' }

  const ext = fichier.name.split('.').pop()?.toLowerCase() || 'png'
  const chemin = `${prefixe}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from('logos').upload(chemin, fichier, { cacheControl: '31536000', upsert: false })
  if (error) return { erreur: `Envoi échoué — ${error.message}` }

  const { data } = supabase.storage.from('logos').getPublicUrl(chemin)
  return { url: data.publicUrl }
}

/**
 * Redimensionne une image cote navigateur (canvas) avant upload : evite les
 * logos photo-appareil de plusieurs Mo affiches en 80x80px. Conserve le
 * ratio, ne recadre jamais, fond transparent si le format le permet.
 */
export function redimensionnerImage(fichier: File, cotéMax = 512): Promise<File> {
  return new Promise((resolve, reject) => {
    if (fichier.type === 'image/svg+xml') { resolve(fichier); return }
    const img = new Image()
    const url = URL.createObjectURL(fichier)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(1, cotéMax / Math.max(img.width, img.height))
      if (ratio === 1) { resolve(fichier); return }
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(fichier); return }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        if (!blob) { resolve(fichier); return }
        resolve(new File([blob], fichier.name, { type: fichier.type }))
      }, fichier.type, 0.9)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')) }
    img.src = url
  })
}
