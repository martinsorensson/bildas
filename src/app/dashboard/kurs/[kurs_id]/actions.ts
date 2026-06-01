'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export type ElevInlamningRad = {
  elevId: string
  elevNamn: string
  inlamningId: string | null
  bildUrl: string | null
}

export async function hamtaKlassInlamningar(
  uppgiftId: string,
  kursId: string
): Promise<ElevInlamningRad[] | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  // Verifiera att läraren äger kursen
  const { data: kurs } = await supabase
    .from('kurser')
    .select('id, larare_id')
    .eq('id', kursId)
    .single()

  if (!kurs || kurs.larare_id !== user.id) return { fel: 'Åtkomst nekad' }

  // Hämta alla elever i kursen
  const { data: kursElever } = await supabase
    .from('kurs_elever')
    .select('elev_id, profiles!elev_id(id, namn, email)')
    .eq('kurs_id', kursId)

  // Hämta alla inlämningar för uppgiften
  const { data: inlamningar } = await supabase
    .from('inlamningar')
    .select('id, elev_id, bild_url')
    .eq('uppgift_id', uppgiftId)

  const inlamningPerElev = new Map(
    (inlamningar ?? []).map(inl => [inl.elev_id, inl])
  )

  return (kursElever ?? []).map(ke => {
    const p = Array.isArray(ke.profiles) ? ke.profiles[0] : ke.profiles
    const inl = inlamningPerElev.get(ke.elev_id)
    return {
      elevId: ke.elev_id,
      elevNamn: (p as any)?.namn ?? (p as any)?.email ?? '—',
      inlamningId: inl?.id ?? null,
      bildUrl: inl?.bild_url ?? null,
    }
  })
}

export async function genereraElevFeedback(
  inlamningId: string,
  uppgiftTitel: string
): Promise<{ text: string } | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  const { data: inl } = await supabase
    .from('inlamningar')
    .select('id, bild_url, uppgifter(kurs_id, kurser(larare_id))')
    .eq('id', inlamningId)
    .single()

  if (!inl) return { fel: 'Inlämningen hittades inte' }

  const uppgift = Array.isArray(inl.uppgifter) ? inl.uppgifter[0] : inl.uppgifter
  const kurs = uppgift
    ? Array.isArray((uppgift as any).kurser)
      ? (uppgift as any).kurser[0]
      : (uppgift as any).kurser
    : null
  if (!kurs || (kurs as any).larare_id !== user.id) return { fel: 'Åtkomst nekad' }

  if (!inl.bild_url) return { fel: 'Ingen bild' }

  let bildBlock: Anthropic.ImageBlockParam
  try {
    const res = await fetch(inl.bild_url)
    if (!res.ok) return { fel: 'Kunde inte hämta bilden' }
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = (res.headers.get('content-type') ?? 'image/jpeg') as
      'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    bildBlock = { type: 'image', source: { type: 'base64', media_type: contentType, data: base64 } }
  } catch {
    return { fel: 'Kunde inte ladda bilden' }
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: `Du är en uppmuntrande bildlärare som ger kort, konkret feedback direkt till eleven.
Skriv på svenska. Använd "du" och tilltala eleven direkt.
Håll svaret till max 2–3 meningar totalt.
Använd formatet "two stars and a wish": börja med två saker eleven gjort bra, avsluta med en sak att utveckla.
Inga rubriker, inga punktlistor — löpande text.`,
    messages: [
      {
        role: 'user',
        content: [
          bildBlock,
          { type: 'text', text: `Uppgift: ${uppgiftTitel}\n\nGe two stars and a wish-feedback på elevens bild.` },
        ],
      },
    ],
  })

  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return { fel: 'Inget svar från AI' }

  return { text: textBlock.text }
}
