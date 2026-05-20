import { supabase } from './supabase'

export interface LandingFormData {
  prenom: string
  nom: string
  email: string
  tel: string
  typePro: string
  decouverte: string
  source?: string
}

export interface LandingWriteResult {
  success: boolean
  error?: 'email_duplicate' | 'write_error'
}

export async function writeLandingProspect(form: LandingFormData): Promise<LandingWriteResult> {
  const emailLower = form.email.toLowerCase().trim()
  const extId = 'j-btob-' + emailLower.replace(/[^a-z0-9]/g, '-').substring(0, 36)
  const today = new Date().toISOString().slice(0, 10)

  /* Check doublon email B2B */
  const { data: existing } = await supabase
    .from('joueurs')
    .select('id')
    .eq('email_lower', emailLower)
    .eq('client_type', 'btob')
    .limit(1)

  if (existing?.length) return { success: false, error: 'email_duplicate' }

  const payload = {
    external_id: extId,
    email: emailLower,
    prenom: form.prenom.trim(),
    nom: form.nom.trim(),
    tel: form.tel.trim(),
    client_type: 'btob',
    source: form.source ?? 'landing_btob',
    tags: ['btob', form.typePro, form.decouverte].filter(Boolean),
    optin: true,
    optin_date: today,
    first_seen: today,
    last_seen: today,
    enseigne: form.typePro,
    decouverte: form.decouverte,
  }

  const { error } = await supabase
    .from('joueurs')
    .upsert(payload, { onConflict: 'external_id' })

  if (error) {
    console.error('[Flowin] landing upsert:', error)
    return { success: false, error: 'write_error' }
  }

  return { success: true }
}
