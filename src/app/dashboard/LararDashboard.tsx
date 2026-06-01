'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import RedigeraUppgiftModal from './RedigeraUppgiftModal'

type Uppgift = {
  id: string
  titel: string
  beskrivning: string | null
  bedomningsparametrar: string[] | null
  skapad_at: string
  kurs_id?: string | null
}

type Kurs = {
  id: string
  namn: string
  kod: string
}

export default function LararDashboard({ uppgifter, kurser }: { uppgifter: Uppgift[]; kurser: Kurs[] }) {
  const router = useRouter()
  const [redigerarUppgift, setRedigerarUppgift] = useState<Uppgift | null>(null)

  const loggaUt = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Bildas</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Lärarvy</span>
          <button onClick={loggaUt} className="text-sm text-gray-500 hover:text-black transition">
            Logga ut
          </button>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto p-6 space-y-10">

        {/* Kurser */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Mina kurser</h2>
          {kurser.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <p>Inga kurser skapade ännu.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {kurser.map(k => (
                <Link
                  key={k.id}
                  href={`/dashboard/kurs/${k.id}`}
                  className="bg-white rounded-xl border p-5 hover:shadow-sm hover:border-gray-300 transition flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{k.namn}</p>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{k.kod}</p>
                  </div>
                  <span className="text-gray-400 text-sm">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Uppgifter */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Uppgifter</h2>
            <button
              onClick={() => router.push('/dashboard/ny-inlamning')}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              + Ny uppgift
            </button>
          </div>
          {uppgifter.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <p className="text-lg">Inga uppgifter ännu</p>
              <p className="text-sm mt-1">Skapa din första uppgift för att komma igång</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {uppgifter.map(u => (
                <div key={u.id} className="bg-white rounded-xl border p-5 flex justify-between items-center hover:shadow-sm transition">
                  <button
                    onClick={() => router.push(`/dashboard/uppgift/${u.id}`)}
                    className="flex-1 text-left"
                  >
                    <h3 className="font-semibold text-lg">{u.titel}</h3>
                    <p className="text-sm text-gray-500 mt-1">{u.beskrivning}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {u.bedomningsparametrar?.map((p, i) => (
                        <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{p}</span>
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setRedigerarUppgift(u) }}
                    className="ml-4 shrink-0 p-2.5 rounded-lg hover:bg-gray-100 transition"
                    title="Redigera uppgift"
                    aria-label="Redigera uppgift"
                  >
                    <span style={{ fontSize: '32px', lineHeight: 1, color: '#9ca3af', display: 'block' }}>⚙</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {redigerarUppgift && (
        <RedigeraUppgiftModal
          uppgift={redigerarUppgift}
          kurser={kurser}
          onStang={() => setRedigerarUppgift(null)}
          onSparad={() => { setRedigerarUppgift(null); router.refresh() }}
          onRaderad={() => { setRedigerarUppgift(null); router.refresh() }}
        />
      )}
    </div>
  )
}
