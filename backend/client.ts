import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
    return createClient(
        "https://lrhmxcaniyonaodhgsvh.supabase.co",
        process.env.SUPABASE_SECRET!,
    )
}
