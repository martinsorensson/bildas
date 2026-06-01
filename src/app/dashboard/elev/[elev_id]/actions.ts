'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function sparaAnteckning(elevId: string, anteckning: string): Promise<{ ok: true } | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  const { error } = await supabase
    .from('larare_anteckningar')
    .upsert(
      { larare_id: user.id, elev_id: elevId, anteckning, uppdaterad_at: new Date().toISOString() },
      { onConflict: 'larare_id,elev_id' }
    )

  if (error) return { fel: error.message }

  revalidatePath(`/dashboard/elev/${elevId}`)
  return { ok: true }
}

export async function genererFeedback(
  elevId: string,
  feedbackPrompt: string
): Promise<{ text: string } | { fel: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { fel: 'Ej autentiserad' }

  // Hämta elevens inlämningar med uppgiftsnamn
  const { data: inlamningar } = await supabase
    .from('inlamningar')
    .select('id, bild_url, skapad_at, uppgifter(titel)')
    .eq('elev_id', elevId)
    .order('skapad_at', { ascending: true })

  if (!inlamningar || inlamningar.length === 0) {
    return { fel: 'Eleven har inga inlämningar att analysera.' }
  }

  // Hämta elevens namn
  const { data: elevProfil } = await supabase
    .from('profiles')
    .select('namn')
    .eq('id', elevId)
    .single()

  // Ladda ner bilder och konvertera till base64
  const bildBlock: Anthropic.ImageBlockParam[] = []
  const metadataRader: string[] = []

  for (const inl of inlamningar) {
    const uppgiftTitel = Array.isArray(inl.uppgifter)
      ? (inl.uppgifter[0] as any)?.titel
      : (inl.uppgifter as any)?.titel ?? 'Okänd uppgift'

    const datum = new Date(inl.skapad_at).toLocaleDateString('sv-SE', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    metadataRader.push(`• ${uppgiftTitel} (inlämnad ${datum})`)

    if (inl.bild_url) {
      try {
        const res = await fetch(inl.bild_url)
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const contentType = (res.headers.get('content-type') ?? 'image/jpeg') as
            'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

          bildBlock.push({
            type: 'image',
            source: { type: 'base64', media_type: contentType, data: base64 },
          })
        }
      } catch {
        // Hoppa över bilder som inte kan laddas
      }
    }
  }

  const effektivPrompt = feedbackPrompt.trim() ||
    'Jag vill ha generell feedback på hur eleven utvecklats över tid.'

  const systemPrompt = `Du är en erfaren bildlärare som ger konstruktiv, pedagogisk feedback på elevarbeten.
Du analyserar det faktiska konstnärliga arbetet i bilderna och ger specifik, konkret feedback.
Svara på svenska. Var positiv men ärlig.

Strukturera alltid ditt svar i två delar:

1. INTRO TILL ELEVEN (2–4 meningar)
Börja med ett kort, personligt och uppmuntrande avsnitt riktat direkt till eleven – skriv "du" till eleven. Det ska vara varmt och specifikt nog att läraren kan skicka det rakt till eleven. Markera detta avsnitt med rubriken "Till eleven:".

2. ANALYS FÖR LÄRAREN
Därefter följer den mer detaljerade analysen av elevens progression, styrkor och utvecklingsområden – riktad till läraren. Markera detta avsnitt med rubriken "För läraren:".`

  const userContent: Anthropic.MessageParam['content'] = [
    {
      type: 'text',
      text: `Elev: ${elevProfil?.namn ?? 'Okänd'}

Inlämningar (kronologisk ordning):
${metadataRader.join('\n')}

Lärarens instruktion: ${effektivPrompt}

Nedan följer elevens bilder i kronologisk ordning:`,
    },
    ...bildBlock,
    {
      type: 'text',
      text: 'Ge din feedback baserat på bilderna och metadatan ovan.',
    },
  ]

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 64000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const message = await stream.finalMessage()

  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return { fel: 'Inget svar från AI.' }

  return { text: textBlock.text }
}
