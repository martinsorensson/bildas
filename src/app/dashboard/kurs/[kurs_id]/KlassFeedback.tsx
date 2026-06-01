'use client'

import { useState } from 'react'
import Link from 'next/link'
import { hamtaKlassInlamningar, genereraElevFeedback, ElevInlamningRad } from './actions'

type Uppgift = { id: string; titel: string }

type ElevResultat = ElevInlamningRad & {
  status: 'vantar' | 'genererar' | 'klar' | 'ingen_inlamning' | 'fel'
  feedback: string
  felmeddelande?: string
}

export default function KlassFeedback({
  uppgifter,
  kursId,
}: {
  uppgifter: Uppgift[]
  kursId: string
}) {
  const [valdUppgiftId, setValdUppgiftId] = useState(uppgifter[0]?.id ?? '')
  const [resultat, setResultat] = useState<ElevResultat[]>([])
  const [kör, setKör] = useState(false)

  const valdUppgift = uppgifter.find(u => u.id === valdUppgiftId)

  const uppdatera = (elevId: string, patch: Partial<ElevResultat>) =>
    setResultat(prev => prev.map(r => r.elevId === elevId ? { ...r, ...patch } : r))

  const hanteraGenera = async () => {
    if (!valdUppgiftId) return
    setKör(true)
    setResultat([])

    const data = await hamtaKlassInlamningar(valdUppgiftId, kursId)
    if ('fel' in data) {
      setKör(false)
      return
    }

    const initialt: ElevResultat[] = data.map(e => ({
      ...e,
      status: e.inlamningId ? 'vantar' : 'ingen_inlamning',
      feedback: '',
    }))
    setResultat(initialt)

    for (const elev of initialt) {
      if (!elev.inlamningId) continue

      uppdatera(elev.elevId, { status: 'genererar' })

      const res = await genereraElevFeedback(elev.inlamningId, valdUppgift?.titel ?? '')
      if ('fel' in res) {
        uppdatera(elev.elevId, { status: 'fel', felmeddelande: res.fel })
      } else {
        uppdatera(elev.elevId, { status: 'klar', feedback: res.text })
      }
    }

    setKör(false)
  }

  if (uppgifter.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Ge feedback till hela klassen</h2>

      <div className="bg-white rounded-xl border p-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Välj uppgift</label>
          <select
            value={valdUppgiftId}
            onChange={e => { setValdUppgiftId(e.target.value); setResultat([]) }}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {uppgifter.map(u => (
              <option key={u.id} value={u.id}>{u.titel}</option>
            ))}
          </select>
        </div>
        <button
          onClick={hanteraGenera}
          disabled={kör || !valdUppgiftId}
          className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40"
        >
          {kör ? 'Genererar…' : 'Generera feedback för alla elever'}
        </button>
      </div>

      {resultat.length > 0 && (
        <div className="space-y-3">
          {resultat.map(e => (
            <div key={e.elevId} className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 mb-3">
                {e.status === 'ingen_inlamning' ? (
                  <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, display: 'inline-block', backgroundColor: '#f87171' }} />
                ) : (
                  <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, display: 'inline-block', backgroundColor: '#22c55e' }} />
                )}
                <Link
                  href={`/dashboard/elev/${e.elevId}`}
                  className="font-medium hover:underline text-sm"
                >
                  {e.elevNamn}
                </Link>
              </div>

              {e.status === 'ingen_inlamning' && (
                <p className="text-sm text-gray-400">Ingen inlämning</p>
              )}
              {e.status === 'genererar' && (
                <p className="text-sm text-gray-400 animate-pulse">Genererar feedback…</p>
              )}
              {e.status === 'fel' && (
                <p className="text-sm text-red-500">{e.felmeddelande ?? 'Något gick fel'}</p>
              )}
              {e.status === 'klar' && (
                <textarea
                  defaultValue={e.feedback}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
