import { supabase } from './supabase'
import type { FlowinEvent } from './types'

export async function fetchEvent(evId: string): Promise<FlowinEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', evId)
    .single()

  if (error || !data) return null
  return data as FlowinEvent
}
