'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const GILTIGA_ROLLER = ['pending', 'elev', 'larare', 'admin'] as const
type Roll = typeof GILTIGA_ROLLER[number]

export async function uppdateraRoll(anvandareId: string, nyRoll: Roll) {
  if (!GILTIGA_ROLLER.includes(nyRoll)) {
    throw new Error('Ogiltig roll')
  }

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ej autentiserad')

  const { data: anropare } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (anropare?.role !== 'admin') throw new Error('Saknar behörighet')

  const { error } = await supabase
    .from('profiles')
    .update({ role: nyRoll })
    .eq('id', anvandareId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}
