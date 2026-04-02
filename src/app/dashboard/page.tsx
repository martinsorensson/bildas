'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [uppgifter, setUppgifter] = useState<any[]>([])

  useEffect(() => {
    const hamtaUppgifter = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('uppgifter').select('*').order('skapad_at', { ascending: false })
      if (data) setUppgifter(data)
    }
    hamtaUppgifter()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Bildas</h1>
        <span className="text-sm text-gray-500">Lärarvy</span>
      </nav>
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mina inlämningar</h2>
          <button onClick={() => router.push('/dashboard/ny-inlamning')}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            + Ny inlämning
          </button>
        </div>
        {uppgifter.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
            <p className="text-lg">Inga inlämningar ännu</p>
            <p className="text-sm mt-1">Skapa din första inlämning för att komma igång</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {uppgifter.map(u => (
              <div key={u.id} className="bg-white rounded-xl border p-5 flex justify-between items-center hover:shadow-sm transition">
                <div>
                  <h3 className="font-semibold text-lg">{u.titel}</h3>
                  <p className="text-sm text-gray-500 mt-1">{u.beskrivning}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {u.bedomningsparametrar?.map((p: string, i: number) => (
                      <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{p}</span>
                    ))}
                  </div>
                </div>
                <button className="text-sm text-gray-500 hover:text-black border px-3 py-1.5 rounded-lg">
                  Visa →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
