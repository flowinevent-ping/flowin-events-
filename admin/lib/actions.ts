'use server'

import { checkDuplicate, writeJoueurParticipation } from './joueurs'
import type { FlowinEvent, SubmitFormData } from './types'

export async function actionCheckDuplicate(
  email: string,
  tel: string,
  eventId: string
): Promise<'email_duplicate' | 'tel_duplicate' | null> {
  return checkDuplicate(email, tel, eventId)
}

export async function actionWriteJoueur(
  ev: FlowinEvent,
  form: SubmitFormData,
  ticket: string
): Promise<{ success: boolean; error?: string }> {
  return writeJoueurParticipation(ev, form, ticket)
}
