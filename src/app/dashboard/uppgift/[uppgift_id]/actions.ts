'use server'

import { redirect } from 'next/navigation'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function raderaUppgift(uppgiftId: string): Promise<{ fel: string }> {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  // Verifiera att användaren äger uppgiften via kursen
  const { data: uppgift } = await supabase
    .from('uppgifter')
    .select('id, kurs_id, kurser(larare_id)')
    .eq('id', uppgiftId)
    .single()

  if (!uppgift) return { fel: 'Uppgiften hittades inte' }

  const kurs = Array.isArray(uppgift.kurser) ? uppgift.kurser[0] : uppgift.kurser
  if (!kurs || (kurs as any).larare_id !== user.id) return { fel: 'Åtkomst nekad' }

  const kursId = uppgift.kurs_id

  // Hämta alla inlämningar för att kunna radera bilder från Storage
  const { data: inlamningar } = await supabase
    .from('inlamningar')
    .select('id, bild_url')
    .eq('uppgift_id', uppgiftId)

  // Radera bilder från Storage
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

  // Radera inlämningar
  const { error: inlFel } = await supabase
    .from('inlamningar')
    .delete()
    .eq('uppgift_id', uppgiftId)

  if (inlFel) return { fel: inlFel.message }

  // Radera uppgiften
  const { error: uppgiftFel } = await supabase
    .from('uppgifter')
    .delete()
    .eq('id', uppgiftId)

  if (uppgiftFel) return { fel: uppgiftFel.message }

  redirect(kursId ? `/dashboard/kurs/${kursId}` : '/dashboard')
}

export async function genereraTvaStjarnor(
  inlamningId: string
): Promise<{ text: string } | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  // Hämta inlämningen och verifiera att läraren äger uppgiften
  const { data: inl } = await supabase
    .from('inlamningar')
    .select('id, bild_url, uppgifter(titel, kurs_id, kurser(larare_id))')
    .eq('id', inlamningId)
    .single()

  if (!inl) return { fel: 'Inlämningen hittades inte' }

  const uppgift = Array.isArray(inl.uppgifter) ? inl.uppgifter[0] : inl.uppgifter
  const kurs = uppgift ? (Array.isArray((uppgift as any).kurser) ? (uppgift as any).kurser[0] : (uppgift as any).kurser) : null
  if (!kurs || (kurs as any).larare_id !== user.id) return { fel: 'Åtkomst nekad' }

  if (!inl.bild_url) return { fel: 'Inlämningen saknar bild' }

  // Ladda ner bilden och konvertera till base64
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
    model: 'claude-sonnet-4-5',
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
          { type: 'text', text: `Uppgift: ${(uppgift as any)?.titel ?? ''}\n\nGe two stars and a wish-feedback på elevens bild.` },
        ],
      },
    ],
  })

  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return { fel: 'Inget svar från AI' }

  return { text: textBlock.text }
}

export async function sparaFeedbackUtkast(
  inlamningId: string,
  utkast: string
): Promise<{ ok: true } | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  // Verifiera ägarskap via uppgift → kurs
  const { data: inl } = await supabase
    .from('inlamningar')
    .select('id, uppgifter(kurs_id, kurser(larare_id))')
    .eq('id', inlamningId)
    .single()

  if (!inl) return { fel: 'Inlämningen hittades inte' }

  const uppgift = Array.isArray(inl.uppgifter) ? inl.uppgifter[0] : inl.uppgifter
  const kurs = uppgift ? (Array.isArray((uppgift as any).kurser) ? (uppgift as any).kurser[0] : (uppgift as any).kurser) : null
  if (!kurs || (kurs as any).larare_id !== user.id) return { fel: 'Åtkomst nekad' }

  const { error } = await supabase
    .from('inlamningar')
    .update({ feedback_utkast: utkast, status: 'feedback_genererad' })
    .eq('id', inlamningId)

  if (error) return { fel: error.message }
  return { ok: true }
}
