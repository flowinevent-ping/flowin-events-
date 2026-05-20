import { supabase } from './supabase'
import type { SubmitFormData, FlowinEvent } from './types'

export interface WriteResult {
  success: boolean
  error?: 'email_duplicate' | 'tel_duplicate' | 'write_error'
}

export async function checkDuplicate(
  email: string,
  tel: string,
  eventId: string
): Promise<'email_duplicate' | 'tel_duplicate' | null> {
  /* Anti-doublon email — cs.{} pour text[] */
  const { data: emailRows } = await supabase
    .from('joueurs')
    .select('id')
    .eq('email_lower', email.toLowerCase().trim())
    .contains('events', [eventId])
    .limit(1)

  if (emailRows && emailRows.length > 0) return 'email_duplicate'

  /* Anti-doublon tel */
  const { data: telRows } = await supabase
    .from('joueurs')
    .select('id')
    .eq('tel', tel.trim())
    .contains('events', [eventId])
    .limit(1)

  if (telRows && telRows.length > 0) return 'tel_duplicate'

  return null
}

export async function writeJoueurParticipation(
  ev: FlowinEvent,
  form: SubmitFormData,
  ticket: string
): Promise<WriteResult> {
  const emailLower = form.email.toLowerCase().trim()
  const extId = 'j-' + emailLower.replace(/[^a-z0-9]/g, '-').substring(0, 40)
  const today = new Date().toISOString().slice(0, 10)

  /* 1. Upsert joueur par external_id */
  const joueurPayload = {
    external_id: extId,
    email: emailLower,
    prenom: form.prenom.trim(),
    nom: form.nom.trim(),
    tel: form.tel.trim().replace(/\s/g, ''),
    genre: form.genre ?? null,
    code_postal: form.code_postal ?? null,
    age_tranche: form.age_tranche ?? null,
    source: form.source ?? null,
    ticket_code: ticket,
    optin: form.optin ?? true,
    optin_date: form.optin !== false ? today : null,
    first_seen: today,
    last_seen: today,
    events: [ev.id],
    client_type: ev.client_type ?? 'btoc',
  }

  const { data: joueurRows, error: joueurErr } = await supabase
    .from('joueurs')
    .upsert(joueurPayload, {
      onConflict: 'external_id',
      ignoreDuplicates: false,
    })
    .select('id')

  if (joueurErr || !joueurRows?.length) {
    console.error('[Flowin] joueur upsert:', joueurErr)
    return { success: false, error: 'write_error' }
  }

  const joueurId = joueurRows[0].id

  /* 2. Insert participation */
  const { error: partErr } = await supabase.from('participations').insert({
    joueur_id: joueurId,
    event_id: ev.id,
    ticket_code: ticket,
    score: 0,
    completed: true,
  })

  if (partErr) {
    console.error('[Flowin] participation insert:', partErr)
    /* Joueur créé mais participation échouée — pas bloquant */
  }

  return { success: true }
}
