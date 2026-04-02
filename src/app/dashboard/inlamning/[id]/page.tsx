'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Inlamning = {
  id: string
  bild_url: string
  status: string
  skapad_at: string
  profiles: { namn: string; email: string }[] | null
}

export default function InlamningPage() {
  const router = useRouter()
  const params = useParams()
  const [uppgift, setUppgift] = useState<any>(null)
  const [inlamningar, setInlamningar] = useState<Inlamning[]>([])
  const [kopieradLank, setKopieradLank] = useState(false)

  useEffect(() => {
    const hamta = async () => {
      const supabase = createClient()

      const { data: uppgiftData } = await supabase
        .from('uppgifter')
        .select('*')
        .eq('id', params.id)
        .single()
      if (uppgiftData) setUppgift(uppgiftData)

      const { data: inlamningarData } = await supabase
        .from('inlamningar')
        .select('id, bild_url, status, skapad_at, profiles(namn, email)')
        .eq('uppgift_id', params.id)
        .order('skapad_at', { ascending: false })
      if (inlamningarData) setInlamningar(inlamningarData as Inlamning[])
    }
    hamta()
  }, [params.id])

  const kopieraLank = () => {
    const url = `${window.location.origin}/uppgift/${params.id}`
    navigator.clipboard.writeText(url)
    setKopieradLank(true)
    setTimeout(() => setKopieradLank(false), 2000)
  }

  if (!uppgift) return <div className="p-8 text-gray-500">Laddar...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black">← Tillbaka</button>
        <h1 className="text-xl font-bold">{uppgift.titel}</h1>
      </nav>
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-lg mb-2">Om uppgiften</h2>
          {uppgift.beskrivning && <p className="text-gray-600 mb-4">{uppgift.beskrivning}</p>}
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

        <div className="bg-white rounded-xl border p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Elevlänk</p>
            <p className="text-gray-500 text-sm mt-0.5 break-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/uppgift/${params.id}` : ''}
            </p>
          </div>
          <button
            onClick={kopieraLank}
            className="shrink-0 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            {kopieradLank ? 'Kopierad!' : 'Kopiera länk'}
          </button>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-3">
            Inlämningar {inlamningar.length > 0 && <span className="text-gray-400 font-normal">({inlamningar.length})</span>}
          </h2>
          {inlamningar.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <p className="text-lg">Inga inlämningar ännu</p>
              <p className="text-sm mt-1">Dela elevlänken ovan så eleverna kan ladda upp sina bilder</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inlamningar.map((inl) => (
                <div key={inl.id} className="bg-white rounded-xl border overflow-hidden">
                  <img
                    src={inl.bild_url}
                    alt="Elevbild"
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <p className="font-medium text-sm">{inl.profiles?.[0]?.namn ?? 'Okänd elev'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{inl.profiles?.[0]?.email}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                        {inl.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(inl.skapad_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
