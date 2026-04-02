import { createClient } from '@/lib/supabase/server'
import StylesAdmin from './StylesAdmin'
import type { Style } from '@/lib/types'

export default async function StylesPage() {
  const supabase = await createClient()
  const { data: styles } = await supabase.from('styles').select('*').order('name')

  return <StylesAdmin styles={(styles as Style[]) ?? []} />
}
