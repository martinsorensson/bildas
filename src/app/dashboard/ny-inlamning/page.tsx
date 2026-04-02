'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function NyInlamning() {
  const router = useRouter()
  const [titel, setTitel] = useState('')
  const [beskrivning, setBeskrivning] = useState('')
  const [parameter, setParameter] = useState('')
  const [parametrar, setParametrar] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

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
    if (!titel || parametrar.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('uppgifter').insert({
      larare_id: user.id,
      titel,
      beskrivning,
      bedomningsparametrar: parametrar
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
        <button onClick={skapaInlamning} disabled={loading || !titel || parametrar.length === 0}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {loading ? 'Skapar...' : 'Skapa inlämning'}
        </button>
      </main>
    </div>
  )
}
