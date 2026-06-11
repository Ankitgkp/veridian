import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    "https://lrhmxcaniyonaodhgsvh.supabase.co",
    "sb_publishable_4kO0vsaMA_4yCt_NHQsRgw_hbK0sL8R"
  )
}
