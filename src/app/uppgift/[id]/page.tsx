'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ElevUppladdningPage() {
  const params = useParams()
  const router = useRouter()
  const [uppgift, setUppgift] = useState<any>(null)
  const [fil, setFil] = useState<File | null>(null)
  const [forhandsvisning, setForhandsvisning] = useState<string | null>(null)
  const [laddarUpp, setLaddarUpp] = useState(false)
  const [klar, setKlar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const hamta = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('uppgifter')
        .select('*')
        .eq('id', params.id)
        .single()
      if (data) setUppgift(data)
    }
    hamta()
  }, [params.id])

  const handleFilval = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valdFil = e.target.files?.[0]
    if (!valdFil) return
    if (!valdFil.type.startsWith('image/')) {
      setFel('Välj en bildfil (JPEG, PNG, etc.)')
      return
    }
    if (valdFil.size > 10 * 1024 * 1024) {
      setFel('Bilden får max vara 10 MB')
      return
    }
    setFel(null)
    setFil(valdFil)
    setForhandsvisning(URL.createObjectURL(valdFil))
  }

  const handleSkicka = async () => {
    if (!fil) return
    setLaddarUpp(true)
    setFel(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?next=/uppgift/${params.id}`)
      return
    }

    // Säkerställ att eleven har en profil
    const { data: profil } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profil) {
      await supabase.from('profiles').insert({
        id: user.id,
        role: 'elev',
        namn: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Elev',
        email: user.email,
      })
    }

    const filnamn = `${params.id}/${user.id}/${Date.now()}-${fil.name}`
    const { error: uploadFel } = await supabase.storage
      .from('bilder')
      .upload(filnamn, fil, { upsert: true })

    if (uploadFel) {
      setFel('Kunde inte ladda upp bilden. Kontrollera att storage-bucketen finns.')
      setLaddarUpp(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('bilder')
      .getPublicUrl(filnamn)

    const { error: dbFel } = await supabase
      .from('inlamningar')
      .insert({
        uppgift_id: params.id,
        elev_id: user.id,
        bild_url: publicUrl,
        status: 'inkommen',
      })

    if (dbFel) {
      setFel('Kunde inte spara inlämningen. Försök igen.')
      setLaddarUpp(false)
      return
    }

    setKlar(true)
    setLaddarUpp(false)
  }

  if (!uppgift) return <div className="p-8 text-gray-500">Laddar...</div>

  if (klar) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl border p-10 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Inlämnat!</h2>
          <p className="text-gray-500">Din bild har skickats till läraren.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold">Bildas</h1>
      </nav>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-lg mb-1">{uppgift.titel}</h2>
          {uppgift.beskrivning && (
            <p className="text-gray-600 mb-4">{uppgift.beskrivning}</p>
          )}
          {uppgift.bedomningsparametrar?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Bedömningsparametrar:</p>
              <div className="flex flex-wrap gap-2">
                {uppgift.bedomningsparametrar.map((p: string, i: number) => (
                  <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-4">Ladda upp din bild</h3>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-gray-400 transition"
          >
            {forhandsvisning ? (
              <img
                src={forhandsvisning}
                alt="Förhandsvisning"
                className="max-h-72 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16l4-4a3 3 0 014.24 0l1.06 1.06M14 14l1.5-1.5a3 3 0 014.24 0L21 14M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Klicka för att välja bild</p>
                <p className="text-sm text-gray-400 mt-1">JPEG, PNG, WEBP · max 10 MB</p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFilval}
          />

          {forhandsvisning && (
            <button
              onClick={() => { setFil(null); setForhandsvisning(null) }}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Välj annan bild
            </button>
          )}

          {fel && <p className="mt-3 text-sm text-red-600">{fel}</p>}

          <button
            onClick={handleSkicka}
            disabled={!fil || laddarUpp}
            className="mt-4 w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {laddarUpp ? 'Laddar upp...' : 'Skicka in'}
          </button>
        </div>
      </main>
    </div>
  )
}
