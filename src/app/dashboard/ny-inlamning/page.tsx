'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Kurs = { id: string; namn: string; kod: string }

export default function NyInlamning() {
  const router = useRouter()
  const [titel, setTitel] = useState('')
  const [beskrivning, setBeskrivning] = useState('')
  const [parameter, setParameter] = useState('')
  const [parametrar, setParametrar] = useState<string[]>([])
  const [kursId, setKursId] = useState('')
  const [kurser, setKurser] = useState<Kurs[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const hamtaKurser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('kurser')
        .select('id, namn, kod')
        .eq('larare_id', user.id)
        .order('skapad_at', { ascending: true })
      if (data) setKurser(data)
    }
    hamtaKurser()
  }, [])

  const laggTillParameter = () => {
    if (parameter.trim()) {
      setParametrar([...parametrar, parameter.trim()])
      setParameter('')
    }
  }

  const taBortParameter = (index: number) => {
    setParametrar(parametrar.filter((_, i) => i !== index))
  }

  const skapaInlamning = async () => {
    if (!titel || parametrar.length === 0 || !kursId) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('uppgifter').insert({
      larare_id: user.id,
      titel,
      beskrivning,
      bedomningsparametrar: parametrar,
      kurs_id: kursId,
    })

    if (!error) router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black">← Tillbaka</button>
        <h1 className="text-xl font-bold">Ny inlämning</h1>
      </nav>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kurs *</label>
            {kurser.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Du har inga kurser än.{' '}
                <button onClick={() => router.push('/dashboard/ny-kurs')} className="underline hover:no-underline">
                  Skapa en kurs
                </button>{' '}
                innan du skapar uppgifter.
              </p>
            ) : (
              <select
                value={kursId}
                onChange={e => setKursId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">Välj kurs...</option>
                {kurser.map(k => (
                  <option key={k.id} value={k.id}>{k.namn} ({k.kod})</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Titel *</label>
            <input value={titel} onChange={e => setTitel(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="T.ex. Porträtt i blyerts" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beskrivning</label>
            <textarea value={beskrivning} onChange={e => setBeskrivning(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              rows={3} placeholder="Beskriv uppgiften för eleverna..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bedömningsparametrar *</label>
            <div className="flex gap-2">
              <input value={parameter} onChange={e => setParameter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && laggTillParameter()}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="T.ex. Skuggor, Proportioner, Linjer..." />
              <button onClick={laggTillParameter}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                Lägg till
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {parametrar.map((p, i) => (
                <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {p}
                  <button onClick={() => taBortParameter(i)} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button onClick={skapaInlamning} disabled={loading || !titel || parametrar.length === 0 || !kursId}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {loading ? 'Skapar...' : 'Skapa inlämning'}
        </button>
      </main>
    </div>
  )
}
