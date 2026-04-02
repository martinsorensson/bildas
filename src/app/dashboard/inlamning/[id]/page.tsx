'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function InlamningPage() {
  const router = useRouter()
  const params = useParams()
  const [uppgift, setUppgift] = useState<any>(null)

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

  if (!uppgift) return <div className="p-8">Laddar...</div>

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
          <div>
            <p className="text-sm font-medium mb-2">Bedömningsparametrar:</p>
            <div className="flex flex-wrap gap-2">
              {uppgift.bedomningsparametrar?.map((p: string, i: number) => (
                <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{p}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          <p className="text-lg">Inga inlämningar ännu</p>
          <p className="text-sm mt-1">Eleverna har inte lämnat in något ännu</p>
        </div>
      </main>
    </div>
  )
}
