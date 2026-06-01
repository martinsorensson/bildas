'use client'

import { useState, useTransition } from 'react'
import { uppdateraUppgift, raderaUppgiftFranDashboard } from './uppgift-actions'

type Uppgift = {
  id: string
  titel: string
  beskrivning: string | null
  bedomningsparametrar: string[] | null
  kurs_id?: string | null
}

type Kurs = {
  id: string
  namn: string
  kod: string
}

type Props = {
  uppgift: Uppgift
  kurser: Kurs[]
  onStang: () => void
  onSparad: () => void
  onRaderad: () => void
}

export default function RedigeraUppgiftModal({ uppgift, kurser, onStang, onSparad, onRaderad }: Props) {
  const [titel, setTitel] = useState(uppgift.titel)
  const [beskrivning, setBeskrivning] = useState(uppgift.beskrivning ?? '')
  const [params, setParams] = useState<string[]>(uppgift.bedomningsparametrar ?? [])
  const [nyParam, setNyParam] = useState('')
  const [kursId, setKursId] = useState<string>(uppgift.kurs_id ?? '')
  const [fel, setFel] = useState<string | null>(null)
  const [visaRaderaDialog, setVisaRaderaDialog] = useState(false)

  const [sparar, startSpara] = useTransition()
  const [raderar, startRadera] = useTransition()

  const laggTillParam = () => {
    const trimmed = nyParam.trim()
    if (trimmed && !params.includes(trimmed)) {
      setParams(prev => [...prev, trimmed])
    }
    setNyParam('')
  }

  const taBortParam = (index: number) => {
    setParams(prev => prev.filter((_, i) => i !== index))
  }

  const handleSpara = () => {
    if (!titel.trim()) { setFel('Titel krävs'); return }
    setFel(null)
    startSpara(async () => {
      const res = await uppdateraUppgift(uppgift.id, {
        titel,
        beskrivning,
        bedomningsparametrar: params,
        kurs_id: kursId || null,
      })
      if ('fel' in res) setFel(res.fel)
      else onSparad()
    })
  }

  const handleRadera = () => {
    setFel(null)
    startRadera(async () => {
      const res = await raderaUppgiftFranDashboard(uppgift.id)
      if ('fel' in res) { setFel(res.fel); setVisaRaderaDialog(false) }
      else onRaderad()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Redigera uppgift</h3>
          <button onClick={onStang} className="text-gray-400 hover:text-black text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* Titel */}
          <div>
            <label className="block text-sm font-medium mb-1">Titel</label>
            <input
              type="text"
              value={titel}
              onChange={e => setTitel(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Beskrivning */}
          <div>
            <label className="block text-sm font-medium mb-1">Beskrivning</label>
            <textarea
              value={beskrivning}
              onChange={e => setBeskrivning(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          {/* Bedömningsparametrar */}
          <div>
            <label className="block text-sm font-medium mb-2">Bedömningsfokus</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {params.map((p, i) => (
                <span key={i} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {p}
                  <button
                    onClick={() => taBortParam(i)}
                    className="text-gray-400 hover:text-black leading-none ml-1"
                    aria-label="Ta bort"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={nyParam}
                onChange={e => setNyParam(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); laggTillParam() } }}
                placeholder="Lägg till parameter…"
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                onClick={laggTillParam}
                className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                + Lägg till
              </button>
            </div>
          </div>

          {/* Kurs */}
          <div>
            <label className="block text-sm font-medium mb-1">Kurs</label>
            <select
              value={kursId}
              onChange={e => setKursId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="">Ingen kurs</option>
              {kurser.map(k => (
                <option key={k.id} value={k.id}>{k.namn} ({k.kod})</option>
              ))}
            </select>
          </div>

          {fel && <p className="text-sm text-red-600">{fel}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
          <button
            onClick={() => setVisaRaderaDialog(true)}
            disabled={sparar || raderar}
            className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-40"
          >
            Radera uppgift
          </button>
          <div className="flex gap-3">
            <button
              onClick={onStang}
              disabled={sparar || raderar}
              className="text-sm border px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
            >
              Avbryt
            </button>
            <button
              onClick={handleSpara}
              disabled={sparar || raderar}
              className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-40"
            >
              {sparar ? 'Sparar…' : 'Spara'}
            </button>
          </div>
        </div>
      </div>

      {/* Bekräftelsedialog för radering */}
      {visaRaderaDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Radera uppgift?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Är du säker? Alla inlämningar kopplade till uppgiften raderas permanent.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setVisaRaderaDialog(false)}
                disabled={raderar}
                className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
              >
                Avbryt
              </button>
              <button
                onClick={handleRadera}
                disabled={raderar}
                className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-40"
              >
                {raderar ? 'Raderar…' : 'Ja, radera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
