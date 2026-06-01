'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

async function verifieraAgare(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, uppgiftId: string, userId: string) {
  const { data: uppgift } = await supabase
    .from('uppgifter')
    .select('id, kurs_id, kurser(larare_id)')
    .eq('id', uppgiftId)
    .single()

  if (!uppgift) return { uppgift: null, fel: 'Uppgiften hittades inte' }

  // Uppgifter utan kurs: verifiera via direkt ägande (larare_id finns ej på uppgifter —
  // men uppgifter skapas av läraren, verifiera via kursen om den finns)
  if (uppgift.kurs_id) {
    const kurs = Array.isArray(uppgift.kurser) ? uppgift.kurser[0] : uppgift.kurser
    if (!kurs || (kurs as any).larare_id !== userId) return { uppgift: null, fel: 'Åtkomst nekad' }
  }

  return { uppgift, fel: null }
}

export async function uppdateraUppgift(
  uppgiftId: string,
  data: {
    titel: string
    beskrivning: string
    bedomningsparametrar: string[]
    kurs_id: string | null
  }
): Promise<{ ok: true } | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  const { fel } = await verifieraAgare(supabase, uppgiftId, user.id)
  if (fel) return { fel }

  const { error } = await supabase
    .from('uppgifter')
    .update({
      titel: data.titel.trim(),
      beskrivning: data.beskrivning.trim() || null,
      bedomningsparametrar: data.bedomningsparametrar,
      kurs_id: data.kurs_id || null,
    })
    .eq('id', uppgiftId)

  if (error) return { fel: error.message }
  return { ok: true }
}

export async function raderaUppgiftFranDashboard(
  uppgiftId: string
): Promise<{ ok: true } | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  const { fel } = await verifieraAgare(supabase, uppgiftId, user.id)
  if (fel) return { fel }

  // Hämta bild-URLs för att kunna radera från Storage
  const { data: inlamningar } = await supabase
    .from('inlamningar')
    .select('bild_url')
    .eq('uppgift_id', uppgiftId)

  const bildStigar = (inlamningar ?? [])
    .map(inl => {
      if (!inl.bild_url) return null
      const delar = inl.bild_url.split('/bilder/')
      return delar.length === 2 ? delar[1] : null
    })
    .filter((s): s is string => s !== null)

  if (bildStigar.length > 0) {
    await supabase.storage.from('bilder').remove(bildStigar)
  }

  await supabase.from('inlamningar').delete().eq('uppgift_id', uppgiftId)

  const { error } = await supabase.from('uppgifter').delete().eq('id', uppgiftId)
  if (error) return { fel: error.message }

  return { ok: true }
}
