'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function joinKurs(formData: FormData): Promise<{ fel: string }> {
  const kod = ((formData.get('kod') as string) ?? '').trim().toUpperCase()

  if (!kod) return { fel: 'Ange en kurskod.' }

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kurs } = await supabase
    .from('kurser')
    .select('id')
    .eq('kod', kod)
    .maybeSingle()

  if (!kurs) return { fel: 'Ingen kurs hittades med den koden. Kontrollera stavningen.' }

  const { error: joinFel } = await supabase
    .from('kurs_elever')
    .insert({ kurs_id: kurs.id, elev_id: user.id })

  if (joinFel) {
    if (joinFel.code === '23505') return { fel: 'Du är redan med i den kursen.' }
    return { fel: 'Kunde inte gå med i kursen. Försök igen.' }
  }

  // Sätt roll till 'elev' om den fortfarande är 'pending'
  await supabase
    .from('profiles')
    .update({ role: 'elev' })
    .eq('id', user.id)
    .eq('role', 'pending')

  redirect('/dashboard')
}
