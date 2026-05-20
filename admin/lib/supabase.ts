import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://ywcqtupgoxfzkddqkztk.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON ?? 'sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
export { SUPABASE_URL, SUPABASE_ANON }
